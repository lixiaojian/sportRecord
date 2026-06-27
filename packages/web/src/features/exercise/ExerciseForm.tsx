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
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { FieldGroup } from '../../components/ui/field';
import { FormField } from '../../components/ui/form-field';
import { FormSelect } from '../../components/ui/form-select';
import { FormTextarea } from '../../components/ui/form-textarea';
import { Grid } from '../../components/ui/layout';

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
    <Card className="border-dashed">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-4">
          <FieldGroup>
            <FormField
              id="exercise-name"
              label="名称"
              error={errors.name?.message}
              register={register('name')}
            />
            <Grid cols={2} gap={3}>
              <FormSelect
                id="exercise-category"
                label="分类"
                error={errors.category?.message}
                register={register('category')}
                options={EXERCISE_CATEGORY_VALUES.map((c) => ({
                  value: c,
                  label: EXERCISE_CATEGORY_LABELS[c],
                }))}
              />
              <FormSelect
                id="exercise-unit"
                label="单位"
                error={errors.unit?.message}
                register={register('unit')}
                options={EXERCISE_UNIT_VALUES.map((u) => ({
                  value: u,
                  label: EXERCISE_UNIT_LABELS[u],
                }))}
              />
            </Grid>
            <FormTextarea
              id="exercise-note"
              label="备注"
              error={errors.note?.message}
              register={register('note')}
            />
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
