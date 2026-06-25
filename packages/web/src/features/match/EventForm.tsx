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
import { Input, Textarea, Select, Label, FieldError } from '../../components/ui/form-controls';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="name">赛事名称</Label>
        <Input id="name" {...register('name')} placeholder="如：2026 俱乐部联赛" />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="type">类型</Label>
          <Select id="type" {...register('type')}>
            {EVENT_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <FieldError>{errors.type?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">地点</Label>
          <Input id="location" {...register('location')} placeholder="可选" />
          <FieldError>{errors.location?.message}</FieldError>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="startDate">开始日期</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
          <FieldError>{errors.startDate?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">结束日期</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
          <FieldError>{errors.endDate?.message}</FieldError>
        </div>
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
