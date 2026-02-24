/**
 * Shared React Query configuration to prevent excessive refetching
 * in multi-user environments.
 */

/** Default staleTime for list queries (30 seconds) */
export const LIST_STALE_TIME = 30 * 1000;

/** Longer staleTime for reference data that rarely changes (2 minutes) */
export const REF_STALE_TIME = 2 * 60 * 1000;

/** Default query options for list queries */
export const listQueryOptions = {
  staleTime: LIST_STALE_TIME,
  refetchOnWindowFocus: false,
} as const;

/** Query options for reference/lookup data (employees, teams, clients, categories) */
export const refQueryOptions = {
  staleTime: REF_STALE_TIME,
  refetchOnWindowFocus: false,
} as const;
