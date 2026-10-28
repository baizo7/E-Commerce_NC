import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes stale time
      gcTime: 1000 * 60 * 15,    // 15 minutes garbage collection cache
      refetchOnWindowFocus: false, // Prevent redundant HTTP cascades on tab switch
      retry: 1,
    },
  },
});
