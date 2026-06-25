import { api } from '../../lib/api';
import type { PaginatedData } from '@sport-record/shared';

/** 回收站支持的资源类型（与 server TRASH_TYPES 对应） */
export const TRASH_TYPES = ['exercise', 'workout', 'event', 'match'] as const;
export type TrashType = (typeof TRASH_TYPES)[number];

export const TRASH_TYPE_LABELS: Record<TrashType, string> = {
  exercise: '训练项',
  workout: '训练课',
  event: '赛事',
  match: '比赛',
};

export interface TrashItem {
  id: string;
  type: TrashType;
  deletedAt: string;
  [key: string]: unknown;
}

export interface TrashListParams {
  page?: number;
  pageSize?: number;
  type?: TrashType;
}

export const trashApi = {
  list: (params: TrashListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params.type) qs.set('type', params.type);
    const s = qs.toString();
    return api.get<PaginatedData<TrashItem>>(`/trash${s ? `?${s}` : ''}`);
  },
  restore: (type: TrashType, id: string) => api.post<unknown>(`/trash/${type}/${id}/restore`),
  purge: (type: TrashType, id: string) => api.delete<void>(`/trash/${type}/${id}`),
};
