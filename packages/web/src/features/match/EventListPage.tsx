import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useDeleteEvent } from './hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { EventForm } from './EventForm';
import { Button } from '../../components/ui/button';
import { EVENT_TYPE_LABELS } from '../../lib/labels';
import type { Event } from '@sport-record/shared';

const PAGE_SIZE = 10;

export function EventListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useEvents(page, PAGE_SIZE);
  const user = useCurrentUser();
  const remove = useDeleteEvent();
  const [showCreate, setShowCreate] = useState(false);

  const items = data?.list ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function onDelete(item: Event) {
    if (!window.confirm(`确认删除赛事「${item.name}」？`)) return;
    await remove.mutateAsync(item.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">赛事</h1>
        {user && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '收起' : '新建赛事'}
          </Button>
        )}
      </div>

      {showCreate && user && (
        <EventForm onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      )}

      {isLoading && <p className="text-muted-foreground">加载中…</p>}
      {error && <p className="text-destructive">加载失败：{error.message}</p>}

      {!isLoading && items.length === 0 && <p className="text-muted-foreground">暂无赛事</p>}

      <ul className="divide-y rounded-md border">
        {items.map((item) => {
          const isOwner = !!user && item.creatorId === user.id;
          return (
            <li key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {!item.isPublic && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        私有
                      </span>
                    )}
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                      {EVENT_TYPE_LABELS[item.type]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{item.startDate}</span>
                    {item.endDate && <span>~ {item.endDate}</span>}
                    {item.location && <span>· {item.location}</span>}
                  </div>
                  {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(item)}
                    disabled={remove.isPending}
                  >
                    删除
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            下一页
          </Button>
        </div>
      )}

      <div className="text-center">
        <Link to="/matches" className="text-sm text-muted-foreground hover:underline">
          → 查看比赛记录
        </Link>
      </div>
    </div>
  );
}
