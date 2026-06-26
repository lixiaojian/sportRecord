import { api } from '../../lib/api';
import type {
  CreateEventInput,
  CreateMatchInput,
  Event,
  Match,
  PaginatedData,
  UpdateEventInput,
  UpdateMatchInput,
  UserProfile,
  UserSearchItem,
} from '@sport-record/shared';

export interface ListParams {
  page?: number;
  pageSize?: number;
}

function toQuery(params: ListParams): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const matchesApi = {
  list: (params: ListParams = {}) => api.get<PaginatedData<Match>>(`/matches${toQuery(params)}`),
  create: (body: CreateMatchInput) => api.post<Match>('/matches', body),
  getById: (id: string) => api.get<Match>(`/matches/${id}`),
  update: (id: string, body: UpdateMatchInput) => api.patch<Match>(`/matches/${id}`, body),
  remove: (id: string) => api.delete<void>(`/matches/${id}`),
};

/** 用户搜索：按关键字查用户，供比赛表单选对手/搭档 */
export const usersApi = {
  search: (q: string) => api.get<UserSearchItem[]>(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (id: string) => api.get<UserProfile>(`/users/${id}/profile`),
};

export const eventsApi = {
  list: (params: ListParams = {}) => api.get<PaginatedData<Event>>(`/events${toQuery(params)}`),
  create: (body: CreateEventInput) => api.post<Event>('/events', body),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  update: (id: string, body: UpdateEventInput) => api.patch<Event>(`/events/${id}`, body),
  remove: (id: string) => api.delete<void>(`/events/${id}`),
};
