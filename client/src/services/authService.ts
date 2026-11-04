import { apiClient, setAuthToken, setActiveWorkspaceId } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  title?: string;
  avatarUrl?: string;
  status?: string;
  createdAt?: string;
}

export interface AuthWorkspace {
  id: string;
  name: string;
  role: string;
  currency?: string;
  slug?: string;
}

export interface AuthResponse {
  user: AuthUser;
  currentWorkspace: AuthWorkspace | null;
  workspaces?: AuthWorkspace[];
  accessToken: string;
}

export interface RegisterPayload {
  name: string;
  workspaceName: string;
  industry?: string;
  currency?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', payload);
    const data: AuthResponse = response.data.data;
    setAuthToken(data.accessToken);
    if (data.currentWorkspace?.id) {
      setActiveWorkspaceId(data.currentWorkspace.id);
    }
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', payload);
    const data: AuthResponse = response.data.data;
    setAuthToken(data.accessToken);
    if (data.currentWorkspace?.id) {
      setActiveWorkspaceId(data.currentWorkspace.id);
    }
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh');
    const data: AuthResponse = response.data.data;
    setAuthToken(data.accessToken);
    if (data.currentWorkspace?.id) {
      setActiveWorkspaceId(data.currentWorkspace.id);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAuthToken(null);
      setActiveWorkspaceId(null);
    }
  },

  async getMe(): Promise<{ user: AuthUser; workspaces: AuthWorkspace[] }> {
    const response = await apiClient.get('/auth/me');
    return {
      user: {
        id: response.data.data.id,
        name: response.data.data.name,
        email: response.data.data.email,
        title: response.data.data.title,
        avatarUrl: response.data.data.avatarUrl,
        status: response.data.data.status,
        createdAt: response.data.data.createdAt,
      },
      workspaces: response.data.data.workspaces,
    };
  },

  async updateProfile(payload: { name?: string; title?: string | null; avatarUrl?: string | null }): Promise<AuthUser> {
    const response = await apiClient.patch('/auth/profile', payload);
    return response.data.data;
  },
};

