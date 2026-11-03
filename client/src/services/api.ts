import axios, { InternalAxiosRequestConfig } from 'axios';

// Normalize API_BASE_URL to always target the /api prefix
const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizeApiUrl = (url?: string) => {
  if (!url) return 'http://localhost:5000/api';
  // Remove trailing slashes
  const cleanUrl = url.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE_URL = normalizeApiUrl(rawApiUrl);
export const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

// In-memory token storage (XSS hardened: never persisted in localStorage or sessionStorage)
let currentAccessToken: string | null = null;
let currentWorkspaceId: string | null = localStorage.getItem('flowdesk_workspace_id') || DEMO_WORKSPACE_ID;

export const setAuthToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAuthToken = () => currentAccessToken;

export const setActiveWorkspaceId = (workspaceId: string | null) => {
  currentWorkspaceId = workspaceId || DEMO_WORKSPACE_ID;
  if (workspaceId) {
    localStorage.setItem('flowdesk_workspace_id', workspaceId);
  } else {
    localStorage.removeItem('flowdesk_workspace_id');
  }
};

export const getActiveWorkspaceId = () => currentWorkspaceId;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HTTP-only refresh cookies
  timeout: 10000,
});

// Centralized request interceptor attaching Auth and Workspace headers
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  if (currentWorkspaceId) {
    config.headers['X-Workspace-Id'] = currentWorkspaceId;
  }
  return config;
});

// Flag to avoid infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor with automatic 401 refresh handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh retry if original request was already to an auth endpoint
    if (
      originalRequest &&
      !originalRequest._retry &&
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;
        setAuthToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('flowdesk:auth-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);
