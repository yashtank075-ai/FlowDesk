import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { AppNotification } from '../types/notification';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { isAuthenticated, currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', currentWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get('/notifications?limit=25');
      return {
        notifications: (res.data?.data || []) as AppNotification[],
        unreadCount: (res.data?.unreadCount || 0) as number,
      };
    },
    enabled: Boolean(isAuthenticated && currentWorkspace?.id),
    refetchInterval: isAuthenticated ? 15000 : false, // Poll every 15s when authenticated
    staleTime: 10000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentWorkspace?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch('/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentWorkspace?.id] });
    },
  });

  return {
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAll: markAllAsReadMutation.isPending,
  };
}

