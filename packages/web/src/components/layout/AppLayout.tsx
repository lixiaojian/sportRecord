import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useCurrentUser, useLogout } from '../../lib/hooks/useAuth';
import { Button, buttonVariants } from '../ui/button';

const NAV = [
  { to: '/', label: '概览' },
  { to: '/workouts', label: '训练' },
  { to: '/matches', label: '比赛' },
  { to: '/events', label: '赛事' },
  { to: '/exercises', label: '动作库' },
];

export function AppLayout() {
  const user = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="text-lg font-bold">
            🏸 Sport Record
          </Link>
          {/* 桌面导航 */}
          <nav className="hidden flex-1 gap-4 sm:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-sm font-medium text-foreground'
                    : 'text-sm text-muted-foreground hover:text-foreground'
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.username}
                </span>
                <Button variant="outline" size="sm" onClick={onLogout} disabled={logout.isPending}>
                  退出
                </Button>
              </>
            ) : (
              <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                登录
              </Link>
            )}
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="菜单"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* 移动端下拉导航 */}
        {menuOpen && (
          <nav className="border-t sm:hidden">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm ${isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
