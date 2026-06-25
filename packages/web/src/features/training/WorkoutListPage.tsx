import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkouts, useDeleteWorkout } from './hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { WorkoutForm } from './WorkoutForm';
import { Button } from '../../components/ui/button';
import type { Workout } from '@sport-record/shared';

const PAGE_SIZE = 10;

export function WorkoutListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useWorkouts(page, PAGE_SIZE);
  const user = useCurrentUser();
  const remove = useDeleteWorkout();
  const [showCreate, setShowCreate] = useState(false);

  const items = data?.list ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function onDelete(item: Workout) {
    if (!window.confirm(`确认删除「${item.title}」？`)) return;
    await remove.mutateAsync(item.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">训练记录</h1>
        {user && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '收起' : '新建训练课'}
          </Button>
        )}
      </div>

      {showCreate && user && (
        <WorkoutForm onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      )}

      {isLoading && <p className="text-muted-foreground">加载中…</p>}
      {error && <p className="text-destructive">加载失败：{error.message}</p>}

      {!isLoading && items.length === 0 && <p className="text-muted-foreground">暂无训练记录</p>}

      <ul className="divide-y rounded-md border">
        {items.map((item) => {
          const isOwner = !!user && item.userId === user.id;
          return (
            <li key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/workouts/${item.id}`} className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium hover:underline">{item.title}</span>
                    {!item.isPublic && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        私有
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{item.date}</span>
                    {item.duration != null && <span>· {item.duration} 分钟</span>}
                    {item.feeling && <span>· {item.feeling}</span>}
                    {item.sets && item.sets.length > 0 && <span>· {item.sets.length} 组记录</span>}
                  </div>
                </Link>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item)}
                      disabled={remove.isPending}
                    >
                      删除
                    </Button>
                  </div>
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
    </div>
  );
}
