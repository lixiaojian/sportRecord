import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWorkout, useDeleteWorkout, useDeleteSet } from './hooks';
import { useExercises } from '../exercise/hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { WorkoutForm } from './WorkoutForm';
import { SetForm } from './SetForm';
import { Button } from '../../components/ui/button';
import { EXERCISE_UNIT_LABELS, EXERCISE_CATEGORY_LABELS } from '../../lib/labels';
import type { Exercise, Set as SetType } from '@sport-record/shared';

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading, error } = useWorkout(id);
  const { data: exercisesData } = useExercises();
  const user = useCurrentUser();
  const removeWorkout = useDeleteWorkout();
  const removeSet = useDeleteSet();
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [showEditWorkout, setShowEditWorkout] = useState(false);

  const exerciseMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const e of exercisesData?.list ?? []) m.set(e.id, e);
    return m;
  }, [exercisesData]);

  if (isLoading) return <p className="text-muted-foreground">加载中…</p>;
  if (error) return <p className="text-destructive">加载失败：{error.message}</p>;
  if (!workout) return <p className="text-muted-foreground">未找到该训练课</p>;

  const isOwner = !!user && workout.userId === user.id;

  async function onDeleteWorkout() {
    if (!workout || !id) return;
    if (!window.confirm(`确认删除「${workout.title}」？`)) return;
    await removeWorkout.mutateAsync(id);
  }

  async function onDeleteSet(set: SetType) {
    if (!id) return;
    if (!window.confirm('确认删除该组记录？')) return;
    await removeSet.mutateAsync({ id: set.id, workoutId: id });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link to="/workouts" className="text-sm text-muted-foreground hover:underline">
          ← 返回列表
        </Link>
        {showEditWorkout && isOwner ? (
          <WorkoutForm
            initial={workout}
            onDone={() => setShowEditWorkout(false)}
            onCancel={() => setShowEditWorkout(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{workout.title}</h1>
                {!workout.isPublic && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                    私有
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{workout.date}</span>
                {workout.duration != null && <span>· {workout.duration} 分钟</span>}
                {workout.feeling && <span>· {workout.feeling}</span>}
              </div>
              {workout.note && <p className="text-sm">{workout.note}</p>}
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowEditWorkout(true)}>
                编辑
              </Button>
            )}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">训练记录（Set）</h2>
          {isOwner && (
            <Button size="sm" onClick={() => setShowCreateSet((v) => !v)}>
              {showCreateSet ? '收起' : '添加记录'}
            </Button>
          )}
        </div>

        {showCreateSet && isOwner && id && (
          <SetForm
            workoutId={id}
            onDone={() => setShowCreateSet(false)}
            onCancel={() => setShowCreateSet(false)}
          />
        )}

        {(!workout.sets || workout.sets.length === 0) && (
          <p className="text-sm text-muted-foreground">暂无逐组记录</p>
        )}

        <ul className="divide-y rounded-md border">
          {workout.sets?.map((set) => {
            const ex = exerciseMap.get(set.exerciseId);
            const editing = editingSetId === set.id;
            return (
              <li key={set.id} className="p-4">
                {editing && isOwner ? (
                  <SetForm
                    workoutId={workout.id}
                    editing={set}
                    onDone={() => setEditingSetId(null)}
                    onCancel={() => setEditingSetId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-medium">{ex?.name ?? '未知训练项'}</div>
                      {ex && (
                        <div className="text-xs text-muted-foreground">
                          {EXERCISE_CATEGORY_LABELS[ex.category]} · {EXERCISE_UNIT_LABELS[ex.unit]}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm">
                        {set.sets != null && <span>组数 {set.sets}</span>}
                        {set.reps != null && <span>次数 {set.reps}</span>}
                        {set.duration != null && <span>时长 {set.duration}</span>}
                        {set.distance != null && <span>距离 {set.distance}</span>}
                        {set.weight != null && <span>重量 {set.weight}</span>}
                      </div>
                      {set.note && <p className="text-sm text-muted-foreground">{set.note}</p>}
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingSetId(set.id)}>
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteSet(set)}
                          disabled={removeSet.isPending}
                        >
                          删除
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isOwner && (
        <div className="border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteWorkout}
            disabled={removeWorkout.isPending}
          >
            删除整节训练课
          </Button>
        </div>
      )}
    </div>
  );
}
