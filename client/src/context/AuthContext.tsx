import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authService,
  AuthUser,
  AuthWorkspace,
  LoginPayload,
  RegisterPayload,
} from '../services/authService';
import { getAuthToken } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  currentWorkspace: AuthWorkspace | null;
  workspaces: AuthWorkspace[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: { name?: string; title?: string | null; avatarUrl?: string | null }) => Promise<void>;
  switchWorkspace: (workspace: AuthWorkspace) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<AuthWorkspace | null>(null);
  const [workspaces, setWorkspaces] = useState<AuthWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      // In-memory token model: Always restore session using HttpOnly refresh-token cookie
      try {
        const authData = await authService.refresh();
        setUser(authData.user);
        setCurrentWorkspace(authData.currentWorkspace);
        if (authData.workspaces && authData.workspaces.length > 0) {
          setWorkspaces(authData.workspaces);
        }
      } catch {
        setUser(null);
        setCurrentWorkspace(null);
        setWorkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
      setCurrentWorkspace(null);
    };

    window.addEventListener('flowdesk:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('flowdesk:auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await authService.login(payload);
      setUser(data.user);
      setCurrentWorkspace(data.currentWorkspace);
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      setUser(data.user);
      setCurrentWorkspace(data.currentWorkspace);
      if (data.currentWorkspace) {
        setWorkspaces([data.currentWorkspace]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setCurrentWorkspace(null);
      setWorkspaces([]);
    }
  };

  const updateProfile = async (payload: { name?: string; title?: string | null; avatarUrl?: string | null }) => {
    const updatedUser = await authService.updateProfile(payload);
    setUser(updatedUser);
  };

  const switchWorkspace = (workspace: AuthWorkspace) => {
    setCurrentWorkspace(workspace);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        workspaces,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

