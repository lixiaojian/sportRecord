import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createMatchSchema,
  MATCH_TYPE_VALUES,
  type CreateMatchInput,
  type Match,
} from '@sport-record/shared';
import { useCreateMatch, useUpdateMatch, useEventsForSelect } from './hooks';
import { ApiError } from '../../lib/api';
import { MATCH_TYPE_LABELS, MATCH_RESULT_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/button';
import { Input, Textarea, Select, Label, FieldError } from '../../components/ui/form-controls';

interface Props {
  initial?: Match;
  onDone: () => void;
  onCancel?: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toInt(v: unknown): number | undefined {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export function MatchForm({ initial, onDone, onCancel }: Props) {
  const isEdit = !!initial;
  const create = useCreateMatch();
  const update = useUpdateMatch();
  const { data: eventsData } = useEventsForSelect();
  const events = eventsData?.list ?? [];
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateMatchInput>({
    // createMatchSchema 的 opponentIds 带 .default([])，输入/输出类型不一致，
    // 这里将 resolver 收敛到输出类型 CreateMatchInput
    resolver: zodResolver(createMatchSchema) as unknown as Resolver<CreateMatchInput>,
    defaultValues: initial
      ? {
          eventId: initial.eventId,
          type: initial.type,
          date: initial.date,
          partnerId: initial.partnerId ?? '',
          opponentIds: initial.opponentIds,
          scores: initial.scores,
          result: initial.result,
          note: initial.note ?? '',
          isPublic: initial.isPublic,
        }
      : {
          eventId: events[0]?.id ?? '',
          type: 'single',
          date: today(),
          partnerId: '',
          opponentIds: [],
          scores: [[0, 0]],
          result: 'win',
          note: '',
          isPublic: true,
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'scores' });
  const type = watch('type');
  const isDouble = type === 'double' || type === 'mixed';

  const pending = create.isPending || update.isPending;

  async function onSubmit(data: CreateMatchInput) {
    setServerError(null);
    // 过滤掉全 0 的空局
    const cleanedScores = (data.scores ?? []).filter(
      (g) => Array.isArray(g) && (g[0] !== 0 || g[1] !== 0),
    );
    const payload: CreateMatchInput = {
      ...data,
      scores: cleanedScores.length ? cleanedScores : [[0, 0]],
      partnerId: isDouble ? data.partnerId || null : null,
      opponentIds: data.opponentIds ?? [],
    };
    try {
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, body: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '保存失败，请重试');
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        暂无赛事，请先到「赛事」页新建一个赛事后再录入比赛。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="eventId">赛事</Label>
          <Select id="eventId" {...register('eventId')} disabled={isEdit}>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
          <FieldError>{errors.eventId?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="type">类型</Label>
          <Select id="type" {...register('type')}>
            {MATCH_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {MATCH_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <FieldError>{errors.type?.message}</FieldError>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="date">日期</Label>
          <Input id="date" type="date" {...register('date')} />
          <FieldError>{errors.date?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="result">结果</Label>
          <Select id="result" {...register('result')}>
            <option value="win">{MATCH_RESULT_LABELS.win}</option>
            <option value="lose">{MATCH_RESULT_LABELS.lose}</option>
          </Select>
          <FieldError>{errors.result?.message}</FieldError>
        </div>
      </div>

      {isDouble && (
        <div className="space-y-1">
          <Label htmlFor="partnerId">搭档 ID（可选）</Label>
          <Input id="partnerId" {...register('partnerId')} placeholder="队友的用户 UUID" />
          <FieldError>{errors.partnerId?.message}</FieldError>
        </div>
      )}

      <div className="space-y-1">
        <Label>比分（每局：我方 / 对方）</Label>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="w-8 text-sm text-muted-foreground">第{i + 1}局</span>
              <Input
                type="number"
                min={0}
                className="w-24"
                {...register(`scores.${i}.0`, { setValueAs: toInt })}
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min={0}
                className="w-24"
                {...register(`scores.${i}.1`, { setValueAs: toInt })}
              />
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                  删除
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append([0, 0] as [number, number])}
        >
          添加一局
        </Button>
        <FieldError>{errors.scores?.message}</FieldError>
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
