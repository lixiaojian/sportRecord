import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExerciseSchema,
  EXERCISE_CATEGORY_VALUES,
  EXERCISE_UNIT_VALUES,
  type CreateExerciseInput,
  type Exercise,
} from '@sport-record/shared';
import { useCreateExercise, useUpdateExercise } from './hooks';
import { ApiError } from '../../lib/api';
import { EXERCISE_CATEGORY_LABELS, EXERCISE_UNIT_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/button';
import { Input, Textarea, Select, Label, FieldError } from '../../components/ui/form-controls';

interface Props {
  initial?: Exercise;
  onDone: () => void;
  onCancel?: () => void;
}

export function ExerciseForm({ initial, onDone, onCancel }: Props) {
  const isEdit = !!initial;
  const create = useCreateExercise();
  const update = useUpdateExercise();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExerciseInput>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          category: initial.category,
          unit: initial.unit,
          note: initial.note ?? '',
        }
      : { name: '', category: 'technique', unit: 'sets', note: '' },
  });

  const pending = create.isPending || update.isPending;

  async function onSubmit(data: CreateExerciseInput) {
    setServerError(null);
    try {
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, body: data });
      } else {
        await create.mutateAsync(data);
      }
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '保存失败，请重试');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="name">名称</Label>
        <Input id="name" {...register('name')} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="category">分类</Label>
          <Select id="category" {...register('category')}>
            {EXERCISE_CATEGORY_VALUES.map((c) => (
              <option key={c} value={c}>
                {EXERCISE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
          <FieldError>{errors.category?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="unit">单位</Label>
          <Select id="unit" {...register('unit')}>
            {EXERCISE_UNIT_VALUES.map((u) => (
              <option key={u} value={u}>
                {EXERCISE_UNIT_LABELS[u]}
              </option>
            ))}
          </Select>
          <FieldError>{errors.unit?.message}</FieldError>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">备注</Label>
        <Textarea id="note" {...register('note')} />
        <FieldError>{errors.note?.message}</FieldError>
      </div>
      {serverError && <FieldError>{serverError}</FieldError>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? '保存中…' : isEdit ? '保存' : '新建'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            取消
          </Button>
        )}
      </div>
    </form>
  );
}
