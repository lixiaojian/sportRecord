import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEventSchema,
  EVENT_TYPE_VALUES,
  type CreateEventInput,
  type Event,
} from '@sport-record/shared';
import { useCreateEvent, useUpdateEvent } from './hooks';
import { ApiError } from '../../lib/api';
import { EVENT_TYPE_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { FieldGroup } from '../../components/ui/field';
import { FormField } from '../../components/ui/form-field';
import { FormTextarea } from '../../components/ui/form-textarea';
import { FormSelect } from '../../components/ui/form-select';
import { Grid } from '../../components/ui/layout';

interface Props {
  initial?: Event;
  onDone: () => void;
  onCancel?: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function EventForm({ initial, onDone, onCancel }: Props) {
  const isEdit = !!initial;
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          type: initial.type,
          startDate: initial.startDate,
          endDate: initial.endDate ?? '',
          location: initial.location ?? '',
          note: initial.note ?? '',
          isPublic: initial.isPublic,
        }
      : {
          name: '',
          type: 'club',
          startDate: today(),
          endDate: '',
          location: '',
          note: '',
          isPublic: true,
        },
  });

  const pending = create.isPending || update.isPending;

  async function onSubmit(data: CreateEventInput) {
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
            <FormField
              id="name"
              label="赛事名称"
              placeholder="如：2026 俱乐部联赛"
              error={errors.name?.message}
              register={register('name')}
            />
            <Grid colsMd={2} gap={3}>
              <FormSelect
                id="type"
                label="类型"
                error={errors.type?.message}
                register={register('type')}
                options={EVENT_TYPE_VALUES.map((t) => ({
                  value: t,
                  label: EVENT_TYPE_LABELS[t],
                }))}
              />
              <FormField
                id="location"
                label="地点"
                placeholder="可选"
                error={errors.location?.message}
                register={register('location')}
              />
            </Grid>
            <Grid colsMd={2} gap={3}>
              <FormField
                id="startDate"
                label="开始日期"
                type="date"
                error={errors.startDate?.message}
                register={register('startDate')}
              />
              <FormField
                id="endDate"
                label="结束日期"
                type="date"
                error={errors.endDate?.message}
                register={register('endDate')}
              />
            </Grid>
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
