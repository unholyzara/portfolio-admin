import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../resources/endpoints';
import type { ApiItem } from '../resources/types';
import { ApiError, request } from './client';

export const listKey = (endpoint: string) => ['list', endpoint] as const;
export const singletonKey = (endpoint: string) => ['singleton', endpoint] as const;
export const siteSettingsKey = ['site-settings'] as const;

const fetchList = <T extends ApiItem = ApiItem>(endpoint: string) => request<T[]>(endpoint);

export const useList = <T extends ApiItem = ApiItem>(endpoint: string) =>
  useQuery({ queryKey: listKey(endpoint), queryFn: () => fetchList<T>(endpoint) });

export const useItem = (endpoint: string, uuid: string | undefined) =>
  useQuery({
    queryKey: ['item', endpoint, uuid],
    queryFn: () => request<ApiItem>(`${endpoint}${uuid}/`),
    enabled: Boolean(uuid),
  });

export const useCreate = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>): Promise<ApiItem> => {
      const before = await queryClient.ensureQueryData({
        queryKey: listKey(endpoint),
        queryFn: () => fetchList(endpoint),
      });
      const knownIds = new Set(before.map((item) => item.uuid));
      const created = (await request<ApiItem | null>(endpoint, { method: 'POST', body: payload })) ?? {};
      await queryClient.invalidateQueries();
      if (created.uuid) return created;
      const after = await queryClient.fetchQuery({
        queryKey: listKey(endpoint),
        queryFn: () => fetchList(endpoint),
        staleTime: 0,
      });
      const added = after.find((item) => !knownIds.has(item.uuid));
      return added ? { ...created, uuid: added.uuid } : created;
    },
  });
};

export const useUpdate = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Record<string, unknown> }) =>
      request<ApiItem>(`${endpoint}${uuid}/`, { method: 'PUT', body: payload }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

export const usePatch = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Record<string, unknown> }) =>
      request<ApiItem>(`${endpoint}${uuid}/`, { method: 'PATCH', body: payload }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

export const useRemove = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => request(`${endpoint}${uuid}/`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

export const useSingleton = (endpoint: string) =>
  useQuery({
    queryKey: singletonKey(endpoint),
    queryFn: async (): Promise<ApiItem | null> => {
      try {
        return await request<ApiItem>(endpoint);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });

export const useSaveSingleton = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, exists }: { payload: Record<string, unknown>; exists: boolean }) =>
      request<ApiItem>(endpoint, { method: exists ? 'PUT' : 'POST', body: payload }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

export const useSiteSettings = () =>
  useQuery({
    queryKey: siteSettingsKey,
    queryFn: async (): Promise<ApiItem | null> => {
      const list = await request<ApiItem[]>(ENDPOINTS.siteSettings);
      return list[0] ?? null;
    },
  });

export const useToggleMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, maintenance }: { uuid: string; maintenance: boolean }) =>
      request<ApiItem>(`${ENDPOINTS.siteSettings}${uuid}/`, {
        method: 'PATCH',
        body: { maintenance },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: siteSettingsKey }),
  });
};
