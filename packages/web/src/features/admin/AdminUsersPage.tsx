import { useState } from 'react';
import { useAdminUsers, useUpdateUserByAdmin } from './hooks';
import type { AdminUser } from './api';
import { Button } from '../../components/ui/button';
import { ROLE_LABELS } from '../../lib/labels';
import type { Role } from '@sport-record/shared';

const PAGE_SIZE = 15;

function dateText(s: string): string {
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminUsers(page, PAGE_SIZE);
  const update = useUpdateUserByAdmin();

  const items = data?.list ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function toggleDisabled(u: AdminUser) {
    await update.mutateAsync({ id: u.id, body: { disabled: !u.disabled } });
  }

  async function toggleRole(u: AdminUser) {
    const next: Role = u.role === 'admin' ? 'user' : 'admin';
    await update.mutateAsync({ id: u.id, body: { role: next } });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">用户管理</h1>

      {isLoading && <p className="text-muted-foreground">加载中…</p>}
      {error && <p className="text-destructive">加载失败：{error.message}</p>}

      <ul className="divide-y rounded-md border">
        {items.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{u.nickname || u.username}</span>
                <span className="text-sm text-muted-foreground">@{u.username}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                  {ROLE_LABELS[u.role]}
                </span>
                {u.disabled && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-200">
                    已禁用
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                注册于 {dateText(u.createdAt)}
                {u.defaultPublic ? ' · 默认公开' : ' · 默认私有'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleRole(u)}
                disabled={update.isPending}
              >
                {u.role === 'admin' ? '降为用户' : '升为管理员'}
              </Button>
              <Button
                variant={u.disabled ? 'outline' : 'destructive'}
                size="sm"
                onClick={() => toggleDisabled(u)}
                disabled={update.isPending}
              >
                {u.disabled ? '启用' : '禁用'}
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
