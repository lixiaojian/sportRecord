import { api } from '../../lib/api';
import type {
  CreateSetInput,
  CreateWorkoutInput,
  PaginatedData,
  Set,
  UpdateSetInput,
  UpdateWorkoutInput,
  Workout,
} from '@sport-record/shared';

/** 训练课列表查询参数 */
export interface WorkoutListParams {
  page?: number;
  pageSize?: number;
}

export const workoutsApi = {
  list: (params: WorkoutListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    return api.get<PaginatedData<Workout>>(`/workouts${query ? `?${query}` : ''}`);
  },
  create: (body: CreateWorkoutInput) => api.post<Workout>('/workouts', body),
  getById: (id: string) => api.get<Workout>(`/workouts/${id}`),
  update: (id: string, body: UpdateWorkoutInput) => api.patch<Workout>(`/workouts/${id}`, body),
  remove: (id: string) => api.delete<void>(`/workouts/${id}`),
};

export const setsApi = {
  create: (workoutId: string, body: CreateSetInput) =>
    api.post<Set>(`/workouts/${workoutId}/sets`, body),
  update: (id: string, body: UpdateSetInput) => api.patch<Set>(`/sets/${id}`, body),
  remove: (id: string) => api.delete<void>(`/sets/${id}`),
};
