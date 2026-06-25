import { useState } from 'react';
import { useTrash, useRestoreTrash, usePurgeTrash } from './hooks';
import { TRASH_TYPES, TRASH_TYPE_LABELS, type TrashItem, type TrashType } from './api';
import { Button } from '../../components/ui/button';

const PAGE_SIZE = 15;

/** 各类型在回收站里展示的主标题字段 */
function itemTitle(item: TrashItem): string {
  if (typeof item.name === 'string') return item.name;
  if (typeof item.title === 'string') return item.title;
  return '未命名';
}

function deletedText(at: string): string {
  try {
    return new Date(at).toLocaleString();
  } catch {
    return at;
  }
}

export function TrashPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<TrashType | undefined>(undefined);
  const { data, isLoading, error } = useTrash(page, PAGE_SIZE, type);
  const restore = useRestoreTrash();
  const purge = usePurgeTrash();

  const items = data?.list ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function onRestore(item: TrashItem) {
    await restore.mutateAsync({ type: item.type, id: item.id });
  }

  async function onPurge(item: TrashItem) {
    if (!window.confirm(`彻底删除「${itemTitle(item)}」？此操作不可恢复。`)) return;
    await purge.mutateAsync({ type: item.type, id: item.id });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">回收站</h1>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={type === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setType(undefined);
            setPage(1);
          }}
        >
          全部
        </Button>
        {TRASH_TYPES.map((t) => (
          <Button
            key={t}
            variant={type === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setType(t);
              setPage(1);
            }}
          >
            {TRASH_TYPE_LABELS[t]}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">加载中…</p>}
      {error && <p className="text-destructive">加载失败：{error.message}</p>}

      {!isLoading && items.length === 0 && <p className="text-muted-foreground">回收站为空</p>}

      <ul className="divide-y rounded-md border">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{itemTitle(item)}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                  {TRASH_TYPE_LABELS[item.type]}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                删除于 {deletedText(item.deletedAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestore(item)}
                disabled={restore.isPending}
              >
                恢复
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onPurge(item)}
                disabled={purge.isPending}
              >
                彻底删除
              </Button>
            </div>
          </li>
        ))}
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
