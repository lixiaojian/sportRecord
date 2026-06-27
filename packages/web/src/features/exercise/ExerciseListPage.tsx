import { useState, useMemo } from 'react';
import { useExercises, useDeleteExercise } from './hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { ExerciseForm } from './ExerciseForm';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Stack, Grid } from '../../components/ui/layout';
import { EXERCISE_CATEGORY_LABELS, EXERCISE_UNIT_LABELS } from '../../lib/labels';
import type { Exercise, ExerciseCategory } from '@sport-record/shared';

type FilterKey = 'all' | ExerciseCategory;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  ...(Object.entries(EXERCISE_CATEGORY_LABELS) as [ExerciseCategory, string][]).map(
    ([key, label]) => ({
      key,
      label,
    }),
  ),
];

export function ExerciseListPage() {
  const { data, isLoading, error } = useExercises();
  const user = useCurrentUser();
  const remove = useDeleteExercise();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const items = useMemo(() => {
    const list = data?.list ?? [];
    return filter === 'all' ? list : list.filter((e) => e.category === filter);
  }, [data?.list, filter]);

  async function onDelete(item: Exercise) {
    if (!window.confirm(`确认删除「${item.name}」？`)) return;
    await remove.mutateAsync(item.id);
  }

  return (
    <Stack gap={6}>
      <Stack direction="row" justify="between" align="center">
        <CardTitle className="text-2xl font-bold">动作库</CardTitle>
        {user && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '收起' : '新建训练项'}
          </Button>
        )}
      </Stack>

      <Stack direction="row" gap={2} wrap>
        {FILTER_OPTIONS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </Stack>

      {showCreate && user && (
        <ExerciseForm onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      )}

      {isLoading && <CardDescription>加载中…</CardDescription>}
      {error && (
        <CardDescription className="!text-destructive">加载失败：{error.message}</CardDescription>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <Stack align="center" gap={2}>
              <CardDescription>暂无训练项</CardDescription>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid colsMd={2} colsLg={3} gap={4}>
        {items.map((item) => (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            {editingId === item.id ? (
              <CardContent className="p-4">
                <ExerciseForm
                  initial={item}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-2">
                  <Stack direction="row" align="center" gap={2}>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {item.isBuiltIn && <Badge variant="secondary">内置</Badge>}
                    <Badge variant="outline">{EXERCISE_CATEGORY_LABELS[item.category]}</Badge>
                  </Stack>
                </CardHeader>
                <CardContent className="pb-2">
                  <Stack gap={2}>
                    <Badge variant="outline" className="w-fit">
                      {EXERCISE_UNIT_LABELS[item.unit]}
                    </Badge>
                    {item.note && <CardDescription>{item.note}</CardDescription>}
                  </Stack>
                </CardContent>
                {user && !item.isBuiltIn && item.creatorId === user.id && (
                  <CardFooter>
                    <Stack direction="row" gap={2}>
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
                    </Stack>
                  </CardFooter>
                )}
              </>
            )}
          </Card>
        ))}
      </Grid>
    </Stack>
  );
}
