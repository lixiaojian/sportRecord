import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMatch, useDeleteMatch, useEvent } from './hooks';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { MatchForm } from './MatchForm';
import { Button } from '../../components/ui/button';
import { MATCH_TYPE_LABELS, MATCH_RESULT_LABELS } from '../../lib/labels';

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, error } = useMatch(id);
  const { data: event } = useEvent(match?.eventId);
  const user = useCurrentUser();
  const removeMatch = useDeleteMatch();
  const [showEdit, setShowEdit] = useState(false);

  if (isLoading) return <p className="text-muted-foreground">加载中…</p>;
  if (error) return <p className="text-destructive">加载失败：{error.message}</p>;
  if (!match) return <p className="text-muted-foreground">未找到该比赛</p>;

  const isOwner = !!user && match.userId === user.id;

  async function onDelete() {
    if (!id) return;
    if (!window.confirm('确认删除该比赛记录？')) return;
    await removeMatch.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link to="/matches" className="text-sm text-muted-foreground hover:underline">
          ← 返回列表
        </Link>
        {showEdit && isOwner ? (
          <MatchForm
            initial={match}
            onDone={() => setShowEdit(false)}
            onCancel={() => setShowEdit(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{MATCH_TYPE_LABELS[match.type]}</h1>
                <span
                  className={
                    match.result === 'win'
                      ? 'rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-200'
                  }
                >
                  {MATCH_RESULT_LABELS[match.result]}
                </span>
                {!match.isPublic && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                    私有
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{match.date}</span>
                {event && <span>· {event.name}</span>}
                {event?.location && <span>· {event.location}</span>}
              </div>
              {match.scores?.length > 0 && (
                <div className="font-mono text-lg">
                  {match.scores.map((g, i) => (
                    <span key={i} className="mr-3">
                      {g[0]}:{g[1]}
                    </span>
                  ))}
                </div>
              )}
              {match.note && <p className="text-sm">{match.note}</p>}
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                编辑
              </Button>
            )}
          </div>
        )}
      </div>

      {isOwner && !showEdit && (
        <div className="border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={removeMatch.isPending}
          >
            删除比赛
          </Button>
        </div>
      )}
    </div>
  );
}
