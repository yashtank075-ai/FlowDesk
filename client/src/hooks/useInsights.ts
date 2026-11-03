import { useQuery } from '@tanstack/react-query';
import { insightsService, BusinessInsights } from '../services/insightsService';
import { useAuth } from '../context/AuthContext';

export const useInsights = () => {
  const { currentWorkspace } = useAuth();

  return useQuery<BusinessInsights>({
    queryKey: ['insights', currentWorkspace?.id],
    queryFn: () => insightsService.getInsights(),
    enabled: !!currentWorkspace?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

