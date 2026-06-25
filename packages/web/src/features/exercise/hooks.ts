import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { exercisesApi } from './api';
import type { CreateExerciseInput, UpdateExerciseInput } from '@sport-record/shared';

export function useExercises() {
  return useQuery({ queryKey: queryKeys.exercises, queryFn: exercisesApi.list });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExerciseInput) => exercisesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exercises }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateExerciseInput }) =>
      exercisesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exercises }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exercisesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exercises }),
  });
}
