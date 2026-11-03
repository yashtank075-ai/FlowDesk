import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { config } from '../config';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const clientInfo = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await AuthService.register(req.body, clientInfo);

      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, config.cookie);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          currentWorkspace: result.currentWorkspace,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const clientInfo = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await AuthService.login(req.body, clientInfo);

      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, config.cookie);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          currentWorkspace: result.currentWorkspace,
          workspaces: result.workspaces,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Refresh token can come from http-only cookie or request body
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const clientInfo = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await AuthService.refreshTokens(rawToken, clientInfo);

      // Set rotated HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, config.cookie);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          currentWorkspace: result.currentWorkspace,
          workspaces: result.workspaces,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await AuthService.logout(rawToken);

      // Clear cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await AuthService.getMe(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const updated = await AuthService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

