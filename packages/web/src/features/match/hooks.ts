import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { eventsApi, matchesApi, usersApi } from './api';
import type {
  CreateEventInput,
  CreateMatchInput,
  UpdateEventInput,
  UpdateMatchInput,
} from '@sport-record/shared';

/** 用户搜索：关键字 >= 1 才发起，staleTime 短避免频繁请求 */
export function useUserSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.userSearch(q),
    queryFn: () => usersApi.search(q),
    enabled: q.trim().length >= 1,
    staleTime: 10_000,
  });
}

/** 批量获取用户 profile（编辑模式回显已选对手/搭档名称） */
export function useUserProfiles(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.userProfile(id),
      queryFn: () => usersApi.getProfile(id),
      enabled: !!id,
      staleTime: 5 * 60_000,
    })),
  });
}

export function useMatches(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...queryKeys.matches, { page, pageSize }],
    queryFn: () => matchesApi.list({ page, pageSize }),
  });
}

export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.match(id) : ['matches', 'detail'],
    queryFn: () => matchesApi.getById(id!),
    enabled: !!id,
  });
}

export function useEvents(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...queryKeys.events, { page, pageSize }],
    queryFn: () => eventsApi.list({ page, pageSize }),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.event(id) : ['events', 'detail'],
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
  });
}

/** 比赛表单下拉用：拉取一页赛事供选择 */
export function useEventsForSelect() {
  return useQuery({
    queryKey: [...queryKeys.events, 'select'],
    queryFn: () => eventsApi.list({ page: 1, pageSize: 100 }),
  });
}

function invalidateMatches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.matches });
  qc.invalidateQueries({ queryKey: ['stats'] });
}

function invalidateEvents(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.events });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMatchInput) => matchesApi.create(body),
    onSuccess: () => invalidateMatches(qc),
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMatchInput }) =>
      matchesApi.update(id, body),
    onSuccess: (data) => {
      invalidateMatches(qc);
      qc.invalidateQueries({ queryKey: queryKeys.match(data.id) });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matchesApi.remove(id),
    onSuccess: () => invalidateMatches(qc),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventInput) => eventsApi.create(body),
    onSuccess: () => invalidateEvents(qc),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateEventInput }) =>
      eventsApi.update(id, body),
    onSuccess: (data) => {
      invalidateEvents(qc);
      qc.invalidateQueries({ queryKey: queryKeys.event(data.id) });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => invalidateEvents(qc),
  });
}
