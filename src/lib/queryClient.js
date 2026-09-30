import { QueryClient, MutationCache } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => {
      // Invalidate all queries on any mutation success so updated/created data displays immediately
      queryClient.invalidateQueries();
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 0, // Keep data fresh; never serve stale data when navigating
      gcTime: 1000 * 60 * 10, // Retain inactive queries in memory for 10 minutes
      refetchOnMount: "always", // Always refetch latest data on screen/component mount
      refetchOnWindowFocus: false, // Avoid excessive refetches on alt-tab
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
