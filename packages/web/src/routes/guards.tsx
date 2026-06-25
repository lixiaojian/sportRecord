import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '@sport-record/shared';
import { useAuthStore } from '../stores/authStore';

/**
 * 登录守卫：未登录跳 /login 并记 redirect（design.md 6.3）
 */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/**
 * 角色守卫：角色不足跳 /403（admin 拥有所有权限）
 */
export function RequireRole({ role }: { role: Role }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role && user.role !== 'admin') {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
