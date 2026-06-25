import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { setsApi, workoutsApi } from './api';
import type {
  CreateSetInput,
  CreateWorkoutInput,
  UpdateSetInput,
  UpdateWorkoutInput,
} from '@sport-record/shared';

export function useWorkouts(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...queryKeys.workouts, { page, pageSize }],
    queryFn: () => workoutsApi.list({ page, pageSize }),
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.workout(id) : ['workouts', 'detail'],
    queryFn: () => workoutsApi.getById(id!),
    enabled: !!id,
  });
}

function useInvalidateWorkouts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.workouts });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };
}

export function useCreateWorkout() {
  const invalidate = useInvalidateWorkouts();
  return useMutation({
    mutationFn: (body: CreateWorkoutInput) => workoutsApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateWorkout() {
  const invalidate = useInvalidateWorkouts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWorkoutInput }) =>
      workoutsApi.update(id, body),
    onSuccess: (data) => {
      invalidate();
      qc.invalidateQueries({ queryKey: queryKeys.workout(data.id) });
    },
  });
}

export function useDeleteWorkout() {
  const invalidate = useInvalidateWorkouts();
  return useMutation({
    mutationFn: (id: string) => workoutsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useCreateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, body }: { workoutId: string; body: CreateSetInput }) =>
      setsApi.create(workoutId, body),
    onSuccess: (_data, { workoutId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workout(workoutId) });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateSetInput; workoutId: string }) =>
      setsApi.update(id, body),
    onSuccess: (_data, { workoutId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workout(workoutId) });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; workoutId: string }) => setsApi.remove(id),
    onSuccess: (_data, { workoutId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workout(workoutId) });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
