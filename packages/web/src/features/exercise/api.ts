import { api } from '../../lib/api';
import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '@sport-record/shared';

/** 列表响应：exercise 不分页，返回全量 */
interface ExerciseList {
  list: Exercise[];
  total: number;
}

export const exercisesApi = {
  list: () => api.get<ExerciseList>('/exercises'),
  create: (body: CreateExerciseInput) => api.post<Exercise>('/exercises', body),
  update: (id: string, body: UpdateExerciseInput) => api.patch<Exercise>(`/exercises/${id}`, body),
  remove: (id: string) => api.delete<void>(`/exercises/${id}`),
};
