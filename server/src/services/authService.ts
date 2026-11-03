import { prisma } from '../config/prisma.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/auth.js';
import { RegisterInput, LoginInput } from '../schemas/authSchemas.js';
import { Role, Prisma } from '@prisma/client';

export class AuthService {
  static async register(input: RegisterInput, clientInfo: { ip?: string; userAgent?: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      const error: any = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await hashPassword(input.password);
    const slugBase = input.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    // Create user, workspace and owner membership in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: input.workspaceName,
          slug,
          currency: 'USD',
        },
      });

      const membership = await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: Role.OWNER,
        },
      });

      return { user, workspace, membership };
    });

    // Generate tokens
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshSession.create({
      data: {
        userId: result.user.id,
        tokenHash,
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ip,
        expiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        title: result.user.title,
        avatarUrl: result.user.avatarUrl,
        status: result.user.status,
        createdAt: result.user.createdAt,
      },
      currentWorkspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        role: result.membership.role,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  static async login(input: LoginInput, clientInfo: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === 'SUSPENDED') {
      const error: any = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    // Default to the first workspace or membership
    const primaryMembership = user.memberships[0];

    // Create refresh session
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ip,
        expiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt,
      },
      currentWorkspace: primaryMembership
        ? {
            id: primaryMembership.workspace.id,
            name: primaryMembership.workspace.name,
            role: primaryMembership.role,
          }
        : null,
      workspaces: user.memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
      })),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  static async refreshTokens(rawToken: string, clientInfo: { ip?: string; userAgent?: string }) {
    if (!rawToken) {
      const error: any = new Error('Refresh token is required');
      error.statusCode = 401;
      throw error;
    }

    const tokenHash = hashRefreshToken(rawToken);

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      const error: any = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    // Revoke old session and issue new one (Rotation)
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: newTokenHash,
          userAgent: clientInfo.userAgent,
          ipAddress: clientInfo.ip,
          expiresAt,
        },
      }),
    ]);

    const accessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
    });

    const primaryMembership = session.user.memberships[0];

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        title: session.user.title,
        avatarUrl: session.user.avatarUrl,
        status: session.user.status,
        createdAt: session.user.createdAt,
      },
      currentWorkspace: primaryMembership
        ? {
            id: primaryMembership.workspace.id,
            name: primaryMembership.workspace.name,
            role: primaryMembership.role,
          }
        : null,
      workspaces: session.user.memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
      })),
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  static async logout(rawToken: string) {
    if (!rawToken) return;
    const tokenHash = hashRefreshToken(rawToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      title: user.title,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt,
      workspaces: user.memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      })),
    };
  }

  static async updateProfile(userId: string, data: { name?: string; title?: string | null; avatarUrl?: string | null }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const cleanTitle = data.title !== undefined ? (data.title === '' ? null : data.title) : undefined;
    const cleanAvatarUrl = data.avatarUrl !== undefined ? (data.avatarUrl === '' ? null : data.avatarUrl) : undefined;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(cleanTitle !== undefined && { title: cleanTitle }),
        ...(cleanAvatarUrl !== undefined && { avatarUrl: cleanAvatarUrl }),
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      title: updated.title,
      avatarUrl: updated.avatarUrl,
      status: updated.status,
      createdAt: updated.createdAt,
      workspaces: updated.memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      })),
    };
  }
}
