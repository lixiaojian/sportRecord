import { useState } from 'react';
import { useExercises, useDeleteExercise } from './hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { ExerciseForm } from './ExerciseForm';
import { Button } from '../../components/ui/button';
import { EXERCISE_CATEGORY_LABELS, EXERCISE_UNIT_LABELS } from '../../lib/labels';
import type { Exercise } from '@sport-record/shared';

export function ExerciseListPage() {
  const { data, isLoading, error } = useExercises();
  const user = useCurrentUser();
  const remove = useDeleteExercise();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const items = data?.list ?? [];

  async function onDelete(item: Exercise) {
    if (!window.confirm(`确认删除「${item.name}」？`)) return;
    await remove.mutateAsync(item.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">动作库</h1>
        {user && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '收起' : '新建训练项'}
          </Button>
        )}
      </div>

      {showCreate && user && (
        <ExerciseForm onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      )}

      {isLoading && <p className="text-muted-foreground">加载中…</p>}
      {error && <p className="text-destructive">加载失败：{error.message}</p>}

      {!isLoading && items.length === 0 && <p className="text-muted-foreground">暂无训练项</p>}

      <ul className="divide-y rounded-md border">
        {items.map((item) => (
          <li key={item.id} className="p-4">
            {editingId === item.id ? (
              <ExerciseForm
                initial={item}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.isBuiltIn && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        内置
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span>{EXERCISE_CATEGORY_LABELS[item.category]}</span>
                    <span>·</span>
                    <span>{EXERCISE_UNIT_LABELS[item.unit]}</span>
                  </div>
                  {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
                </div>
                {user && !item.isBuiltIn && item.creatorId === user.id && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(item.id)}>
                      编辑
                    </Button>
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
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
