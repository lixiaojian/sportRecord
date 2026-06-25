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
import { Input, Select, Label, FieldError } from '../../components/ui/form-controls';

interface Props {
  workoutId: string;
  editing?: Set;
  onDone: () => void;
  onCancel?: () => void;
}

type NumberField = 'sets' | 'reps' | 'duration' | 'distance' | 'weight';

/**
 * 按 exercise.unit 决定主要数值字段：
 * - sets: 组数
 * - duration: 时长
 * - reps: 次数
 */
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
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        暂无训练项，请先到「动作库」新建训练项。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="exerciseId">训练项</Label>
        <Select
          id="exerciseId"
          value={exerciseId}
          onChange={(e) => onExerciseChange(e.target.value)}
          disabled={isEdit}
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}（{EXERCISE_UNIT_LABELS[ex.unit]}）
            </option>
          ))}
        </Select>
        <FieldError>{errors.exerciseId?.message}</FieldError>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="main">
            {FIELD_LABELS[mainField]}
            <span className="ml-1 text-xs text-muted-foreground">
              （单位：{EXERCISE_UNIT_LABELS[unit]}）
            </span>
          </Label>
          <Input
            id="main"
            type="number"
            min={0}
            {...register(mainField, { setValueAs: toNumber })}
          />
          <FieldError>
            {(errors as Record<string, { message?: string }>)[mainField]?.message}
          </FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="note">备注</Label>
          <Input id="note" {...register('note')} placeholder="可选" />
          <FieldError>{errors.note?.message}</FieldError>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">更多字段（重量 / 距离）</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="weight">{FIELD_LABELS.weight}</Label>
            <Input
              id="weight"
              type="number"
              min={0}
              step="any"
              {...register('weight', { setValueAs: toNumber })}
            />
            <FieldError>{errors.weight?.message}</FieldError>
          </div>
          <div className="space-y-1">
            <Label htmlFor="distance">{FIELD_LABELS.distance}</Label>
            <Input
              id="distance"
              type="number"
              min={0}
              step="any"
              {...register('distance', { setValueAs: toNumber })}
            />
            <FieldError>{errors.distance?.message}</FieldError>
          </div>
        </div>
      </details>

      {serverError && <FieldError>{serverError}</FieldError>}
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
    </form>
  );
}
