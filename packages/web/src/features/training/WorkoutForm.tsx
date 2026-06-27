import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkoutSchema, type CreateWorkoutInput, type Workout } from '@sport-record/shared';
import { useCreateWorkout, useUpdateWorkout } from './hooks';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { FieldGroup } from '../../components/ui/field';
import { FormField } from '../../components/ui/form-field';
import { FormTextarea } from '../../components/ui/form-textarea';
import { Grid } from '../../components/ui/layout';

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
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-4">
          <FieldGroup>
            <Grid colsMd={2} gap={3}>
              <FormField
                id="date"
                label="日期"
                type="date"
                error={errors.date?.message}
                register={register('date')}
              />
              <FormField
                id="duration"
                label="时长（分钟）"
                type="number"
                placeholder="0"
                error={errors.duration?.message}
                register={register('duration', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
              />
            </Grid>
            <FormField
              id="title"
              label="标题"
              placeholder="如：晨练 / 多球训练"
              error={errors.title?.message}
              register={register('title')}
            />
            <FormField
              id="feeling"
              label="感受"
              placeholder="一句话状态"
              error={errors.feeling?.message}
              register={register('feeling')}
            />
            <FormTextarea
              id="note"
              label="备注"
              error={errors.note?.message}
              register={register('note')}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isPublic')} />
              公开（他人可见）
            </label>
            {serverError && <div className="text-xs text-destructive">{serverError}</div>}
          </FieldGroup>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
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
        </CardFooter>
      </form>
    </Card>
  );
}
