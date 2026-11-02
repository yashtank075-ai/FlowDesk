import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword } from '../utils/auth.js';

export class WorkspaceService {
  /**
   * List all members of a workspace
   */
  static async listMembers(workspaceId: string) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m: any) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    }));
  }

  /**
   * Invite a new member to the workspace
   */
  static async inviteMember(
    workspaceId: string,
    inviterId: string,
    inviterRole: Role,
    data: { email: string; role: Role }
  ) {
    // ADMIN cannot invite an OWNER or ADMIN
    if (inviterRole === Role.ADMIN) {
      if (data.role === Role.OWNER || data.role === Role.ADMIN) {
        const error: any = new Error('Admins cannot invite users with Owner or Admin privileges');
        error.statusCode = 403;
        throw error;
      }
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          where: { workspaceId },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      const error: any = new Error('This user is already a member of this workspace');
      error.statusCode = 409;
      throw error;
    }

    // Check if pending invitation exists
    const existingInvitation = await prisma.workspaceInvitation.findUnique({
      where: {
        workspaceId_email: {
          workspaceId,
          email: data.email,
        },
      },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    if (existingInvitation) {
      // Re-issue / update invitation
      await prisma.workspaceInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          role: data.role,
          tokenHash,
          expiresAt,
          invitedBy: inviterId,
        },
      });
    } else {
      await prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          email: data.email,
          role: data.role,
          tokenHash,
          expiresAt,
          invitedBy: inviterId,
        },
      });
    }

    return {
      email: data.email,
      role: data.role,
      expiresAt,
      invitationToken: rawToken, // Provided to caller (e.g. for email link)
    };
    // Check if token details are requested (for public validation)
  }

  static async getInvitationDetails(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      const error: any = new Error('Invitation not found or invalid');
      error.statusCode = 404;
      throw error;
    }

    if (invitation.expiresAt < new Date()) {
      const error: any = new Error('This invitation has expired');
      error.statusCode = 410;
      throw error;
    }

    if (invitation.acceptedAt) {
      const error: any = new Error('This invitation has already been accepted');
      error.statusCode = 409;
      throw error;
    }

    return {
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace.name,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accept an invitation token
   */
  static async acceptInvitation(rawToken: string, data: { name: string; password: string }) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });

    if (!invitation) {
      const error: any = new Error('Invalid invitation token');
      error.statusCode = 400;
      throw error;
    }

    if (invitation.expiresAt < new Date()) {
      const error: any = new Error('This invitation has expired');
      error.statusCode = 400;
      throw error;
    }

    if (invitation.acceptedAt) {
      const error: any = new Error('This invitation has already been accepted');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: data.name,
            email: invitation.email,
            passwordHash,
            status: 'ACTIVE',
          },
        });
      }

      const membership = await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return {
        user: { id: user.id, name: user.name, email: user.email },
        workspace: { id: invitation.workspace.id, name: invitation.workspace.name, role: membership.role },
      };
    });
  }

  /**
   * Change a member's role
   */
  static async updateMemberRole(
    workspaceId: string,
    targetMembershipId: string,
    newRole: Role,
    actorId: string,
    actorRole: Role
  ) {
    // Strictly OWNER can change roles
    if (actorRole !== Role.OWNER) {
      const error: any = new Error('Only workspace owners can change member roles');
      error.statusCode = 403;
      throw error;
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: { id: targetMembershipId },
      include: { user: true },
    });

    if (!membership || membership.workspaceId !== workspaceId) {
      const error: any = new Error('Member not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    // Prevent demoting the last OWNER
    if (membership.role === Role.OWNER && newRole !== Role.OWNER) {
      const ownerCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: Role.OWNER,
        },
      });

      if (ownerCount <= 1) {
        const error: any = new Error('Cannot demote the last remaining Owner of the workspace');
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: targetMembershipId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      membershipId: updated.id,
      role: updated.role,
      user: updated.user,
    };
  }
}

