import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSetSchema,
  type CreateSetInput,
  type Exercise,
  type Set,
} from '@sport-record/shared';
import { useCreateSet, useUpdateSet } from './hooks';
import { useExercises } from '../exercise/hooks';
import { ApiError } from '../../lib/api';
import { EXERCISE_UNIT_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { FieldGroup } from '../../components/ui/field';
import { FormField } from '../../components/ui/form-field';
import { FormSelect } from '../../components/ui/form-select';
import { Grid } from '../../components/ui/layout';

interface Props {
  workoutId: string;
  editing?: Set;
  onDone: () => void;
  onCancel?: () => void;
}

type NumberField = 'sets' | 'reps' | 'duration' | 'distance' | 'weight';

function primaryField(unit: Exercise['unit']): NumberField {
  if (unit === 'duration') return 'duration';
  if (unit === 'reps') return 'reps';
  return 'sets';
}

const FIELD_LABELS: Record<NumberField, string> = {
  sets: '组数',
  reps: '次数',
  duration: '时长（分钟）',
  distance: '距离（m）',
  weight: '重量（kg）',
};

function toNumber(v: unknown): number | undefined {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export function SetForm({ workoutId, editing, onDone, onCancel }: Props) {
  const isEdit = !!editing;
  const create = useCreateSet();
  const update = useUpdateSet();
  const { data: exercisesData } = useExercises();
  const exercises = exercisesData?.list ?? [];
  const [serverError, setServerError] = useState<string | null>(null);

  const initialExercise = exercises.find((e) => e.id === editing?.exerciseId);
  const [unit, setUnit] = useState<Exercise['unit']>(
    initialExercise?.unit ?? exercises[0]?.unit ?? 'sets',
  );

  const defaults: CreateSetInput = editing
    ? {
        exerciseId: editing.exerciseId,
        sets: editing.sets ?? undefined,
        reps: editing.reps ?? undefined,
        duration: editing.duration ?? undefined,
        distance: editing.distance ?? undefined,
        weight: editing.weight ?? undefined,
        note: editing.note ?? '',
      }
    : {
        exerciseId: exercises[0]?.id ?? '',
        sets: undefined,
        reps: undefined,
        duration: undefined,
        distance: undefined,
        weight: undefined,
        note: '',
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSetInput>({
    resolver: zodResolver(createSetSchema),
    defaultValues: defaults,
  });

  const exerciseId = watch('exerciseId');
  const mainField = useMemo<NumberField>(() => {
    const ex = exercises.find((e) => e.id === exerciseId);
    return primaryField(ex?.unit ?? unit);
  }, [exerciseId, exercises, unit]);

  const pending = create.isPending || update.isPending;

  function onExerciseChange(id: string) {
    const ex = exercises.find((e) => e.id === id);
    if (ex) setUnit(ex.unit);
    setValue('exerciseId', id);
  }

  async function onSubmit(data: CreateSetInput) {
    setServerError(null);
    try {
      if (isEdit && editing) {
        await update.mutateAsync({ id: editing.id, body: data, workoutId });
      } else {
        await create.mutateAsync({ workoutId, body: data });
      }
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '保存失败，请重试');
    }
  }

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">暂无训练项，请先到「动作库」新建训练项。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-4">
          <FieldGroup>
            <FormSelect
              id="exerciseId"
              label="训练项"
              error={errors.exerciseId?.message}
              value={exerciseId}
              onChange={(e) => onExerciseChange(e.target.value)}
              disabled={isEdit}
              options={exercises.map((ex) => ({
                value: ex.id,
                label: `${ex.name}（${EXERCISE_UNIT_LABELS[ex.unit]}）`,
              }))}
            />

            <Grid colsMd={2} gap={3}>
              <FormField
                id="main"
                label={`${FIELD_LABELS[mainField]}（单位：${EXERCISE_UNIT_LABELS[unit]}）`}
                type="number"
                error={(errors as Record<string, { message?: string }>)[mainField]?.message}
                register={register(mainField, { setValueAs: toNumber })}
              />
              <FormField
                id="note"
                label="备注"
                placeholder="可选"
                error={errors.note?.message}
                register={register('note')}
              />
            </Grid>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                更多字段（重量 / 距离）
              </summary>
              <div className="mt-2">
                <Grid colsMd={2} gap={3}>
                  <FormField
                    id="weight"
                    label={FIELD_LABELS.weight}
                    type="number"
                    error={errors.weight?.message}
                    register={register('weight', { setValueAs: toNumber })}
                  />
                  <FormField
                    id="distance"
                    label={FIELD_LABELS.distance}
                    type="number"
                    error={errors.distance?.message}
                    register={register('distance', { setValueAs: toNumber })}
                  />
                </Grid>
              </div>
            </details>

            {serverError && <div className="text-xs text-destructive">{serverError}</div>}
          </FieldGroup>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? '保存中…' : isEdit ? '保存' : '添加记录'}
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
