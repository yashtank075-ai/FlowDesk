import { useQuery } from '@tanstack/react-query';
import { searchService, SearchParams } from '../services/searchService';

export function useGlobalSearch(params: SearchParams) {
  const query = params.q?.trim() || '';

  return useQuery({
    queryKey: ['globalSearch', query, params.type || 'all', params.limit || 5],
    queryFn: () => searchService.search(params),
    enabled: query.length >= 2,
    staleTime: 1000 * 15, // Cache results for 15s to keep keyboard search snappy
  });
}
