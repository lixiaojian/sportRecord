import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkoutSchema, type CreateWorkoutInput, type Workout } from '@sport-record/shared';
import { useCreateWorkout, useUpdateWorkout } from './hooks';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input, Textarea, Label, FieldError } from '../../components/ui/form-controls';

interface Props {
  initial?: Workout;
  onDone: () => void;
  onCancel?: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function WorkoutForm({ initial, onDone, onCancel }: Props) {
  const isEdit = !!initial;
  const create = useCreateWorkout();
  const update = useUpdateWorkout();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkoutInput>({
    resolver: zodResolver(createWorkoutSchema),
    defaultValues: initial
      ? {
          date: initial.date,
          title: initial.title,
          feeling: initial.feeling ?? '',
          duration: initial.duration ?? undefined,
          note: initial.note ?? '',
          isPublic: initial.isPublic,
        }
      : { date: today(), title: '', feeling: '', duration: undefined, note: '', isPublic: true },
  });

  const pending = create.isPending || update.isPending;

  async function onSubmit(data: CreateWorkoutInput) {
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="date">日期</Label>
          <Input id="date" type="date" {...register('date')} />
          <FieldError>{errors.date?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="duration">时长（分钟）</Label>
          <Input
            id="duration"
            type="number"
            min={0}
            max={600}
            {...register('duration', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
          />
          <FieldError>{errors.duration?.message}</FieldError>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="title">标题</Label>
        <Input id="title" {...register('title')} placeholder="如：晨练 / 多球训练" />
        <FieldError>{errors.title?.message}</FieldError>
      </div>
      <div className="space-y-1">
        <Label htmlFor="feeling">感受</Label>
        <Input id="feeling" {...register('feeling')} placeholder="一句话状态" />
        <FieldError>{errors.feeling?.message}</FieldError>
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">备注</Label>
        <Textarea id="note" {...register('note')} />
        <FieldError>{errors.note?.message}</FieldError>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isPublic')} />
        公开（他人可见）
      </label>
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
