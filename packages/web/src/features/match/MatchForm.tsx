import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createMatchSchema,
  MATCH_TYPE_VALUES,
  type CreateMatchInput,
  type Match,
} from '@sport-record/shared';
import { useCreateMatch, useUpdateMatch, useEventsForSelect, useUserProfiles } from './hooks';
import { ApiError } from '../../lib/api';
import { MATCH_TYPE_LABELS, MATCH_RESULT_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { FieldGroup, FieldError } from '../../components/ui/field';
import { FormField } from '../../components/ui/form-field';
import { FormTextarea } from '../../components/ui/form-textarea';
import { FormSelect } from '../../components/ui/form-select';
import { Grid } from '../../components/ui/layout';
import { UserPicker } from '../../components/ui/UserPicker';

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
    setValue,
    formState: { errors },
  } = useForm<CreateMatchInput>({
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
  const partnerId = watch('partnerId');
  const opponentIds = watch('opponentIds');
  const isDouble = type === 'double' || type === 'mixed';

  const knownIds = [...(partnerId ? [partnerId] : []), ...opponentIds];
  const profileResults = useUserProfiles(knownIds);
  const selectedMap: Record<string, { username: string; nickname: string }> = {};
  profileResults.forEach((r) => {
    if (r.data) selectedMap[r.data.id] = { username: r.data.username, nickname: r.data.nickname };
  });

  const pending = create.isPending || update.isPending;

  async function onSubmit(data: CreateMatchInput) {
    setServerError(null);
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
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            暂无赛事，请先到「赛事」页新建一个赛事后再录入比赛。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-4">
          <FieldGroup>
            <Grid colsMd={2} gap={3}>
              <FormSelect
                id="eventId"
                label="赛事"
                error={errors.eventId?.message}
                register={register('eventId')}
                disabled={isEdit}
                options={events.map((e) => ({ value: e.id, label: e.name }))}
              />
              <FormSelect
                id="type"
                label="类型"
                error={errors.type?.message}
                register={register('type')}
                options={MATCH_TYPE_VALUES.map((t) => ({
                  value: t,
                  label: MATCH_TYPE_LABELS[t],
                }))}
              />
            </Grid>

            <Grid colsMd={2} gap={3}>
              <FormField
                id="date"
                label="日期"
                type="date"
                error={errors.date?.message}
                register={register('date')}
              />
              <FormSelect
                id="result"
                label="结果"
                error={errors.result?.message}
                register={register('result')}
                options={[
                  { value: 'win', label: MATCH_RESULT_LABELS.win },
                  { value: 'lose', label: MATCH_RESULT_LABELS.lose },
                ]}
              />
            </Grid>

            {isDouble && (
              <UserPicker
                mode="single"
                label="搭档（可选）"
                placeholder="搜索队友用户名/昵称"
                value={partnerId || null}
                onChange={(id) => setValue('partnerId', id ?? '')}
                selectedMap={selectedMap}
                error={errors.partnerId?.message}
              />
            )}

            <UserPicker
              mode="multiple"
              label="对手（可选，可多选）"
              placeholder="搜索对手用户名/昵称"
              value={opponentIds}
              onChange={(ids) => setValue('opponentIds', ids)}
              selectedMap={selectedMap}
              error={errors.opponentIds?.message}
            />

            <div>
              <label className="text-sm font-medium leading-none">比分（每局：我方 / 对方）</label>
              <div className="mt-1.5 space-y-2">
                {fields.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <span className="w-8 text-sm text-muted-foreground">第{i + 1}局</span>
                    <input
                      type="number"
                      min={0}
                      className="w-24 flex h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...register(`scores.${i}.0`, { setValueAs: toInt })}
                    />
                    <span className="text-muted-foreground">:</span>
                    <input
                      type="number"
                      min={0}
                      className="w-24 flex h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="mt-2"
                onClick={() => append([0, 0] as [number, number])}
              >
                添加一局
              </Button>
              <FieldError>{errors.scores?.message}</FieldError>
            </div>

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
