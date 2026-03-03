/**
 * Shared React Query configuration to prevent excessive refetching
 * in multi-user environments.
 */

/** Default staleTime for list queries (5 minutes - Realtime handles updates) */
export const LIST_STALE_TIME = 5 * 60 * 1000;

/** Longer staleTime for reference data that rarely changes (10 minutes - Realtime handles updates) */
export const REF_STALE_TIME = 10 * 60 * 1000;

/** Garbage collection time — keep cached data for 30 minutes to prevent re-fetch flash on navigation */
export const GC_TIME = 30 * 60 * 1000;

/** Default query options for list queries */
export const listQueryOptions = {
  staleTime: LIST_STALE_TIME,
  gcTime: GC_TIME,
  refetchOnWindowFocus: false,
  refetchOnMount: false as const,
  placeholderData: (prev: any) => prev, // Keep previous data during refetch to avoid flash
} as const;

/** Query options for reference/lookup data (employees, teams, clients, categories) */
export const refQueryOptions = {
  staleTime: REF_STALE_TIME,
  gcTime: GC_TIME,
  refetchOnWindowFocus: false,
  refetchOnMount: false as const,
  placeholderData: (prev: any) => prev,
} as const;
