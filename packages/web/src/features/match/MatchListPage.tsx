import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMatches, useDeleteMatch } from './hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { MatchForm } from './MatchForm';
import { Button } from '../../components/ui/button';
import { MATCH_TYPE_LABELS, MATCH_RESULT_LABELS } from '../../lib/labels';
import type { Match } from '@sport-record/shared';

const PAGE_SIZE = 10;

function scoreText(scores: number[][]): string {
  return scores.map((g) => `${g[0]}:${g[1]}`).join('  ');
}

export function MatchListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMatches(page, PAGE_SIZE);
  const user = useCurrentUser();
  const remove = useDeleteMatch();
  const [showCreate, setShowCreate] = useState(false);

  const items = data?.list ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function onDelete(item: Match) {
    if (!window.confirm('确认删除该比赛记录？')) return;
    await remove.mutateAsync(item.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">比赛记录</h1>
        {user && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '收起' : '录入比赛'}
          </Button>
        )}
      </div>

      {showCreate && user && (
        <MatchForm onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      )}

      {isLoading && <p className="text-muted-foreground">加载中…</p>}
      {error && <p className="text-destructive">加载失败：{error.message}</p>}

      {!isLoading && items.length === 0 && <p className="text-muted-foreground">暂无比赛记录</p>}

      <ul className="divide-y rounded-md border">
        {items.map((item) => {
          const isOwner = !!user && item.userId === user.id;
          return (
            <li key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/matches/${item.id}`} className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium hover:underline">
                      {MATCH_TYPE_LABELS[item.type]}
                    </span>
                    <span
                      className={
                        item.result === 'win'
                          ? 'rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-200'
                      }
                    >
                      {MATCH_RESULT_LABELS[item.result]}
                    </span>
                    {!item.isPublic && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        私有
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{item.date}</span>
                    {item.scores?.length > 0 && (
                      <span className="font-mono">{scoreText(item.scores)}</span>
                    )}
                  </div>
                </Link>
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
    </div>
  );
}
