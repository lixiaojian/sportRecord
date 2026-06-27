import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, ShieldCheck, Trophy, UserCog } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useCurrentUser, useLogout } from '../../lib/hooks/useAuth';
import { Button, buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/', label: '首页', icon: ShieldCheck },
  { to: '/workouts', label: '训练', icon: ShieldCheck },
  { to: '/matches', label: '比赛', icon: Trophy },
  { to: '/stats', label: '选手分析', icon: UserCog },
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
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur dark:bg-gray-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-5 w-5 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L9 7L4 9L9 11L12 16L15 11L20 9L15 7L12 2Z" />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight">BADMINTON</span>
              <span className="block text-[10px] text-muted-foreground -mt-1">PERFORM BETTER</span>
            </div>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-primary dark:bg-emerald-950/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* 右侧用户区 */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop"
                      alt={user.nickname || user.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium">{user.nickname || user.username}</span>
                  <span className="text-xs text-muted-foreground">李教练</span>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout} disabled={logout.isPending}>
                  退出
                </Button>
              </div>
            ) : (
              <Link to="/login" className={buttonVariants({ variant: 'default', size: 'sm' })}>
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
          <nav className="border-t bg-white sm:hidden dark:bg-gray-950">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 border-b px-4 py-3 text-sm',
                    isActive
                      ? 'bg-emerald-50 font-medium text-primary dark:bg-emerald-950/30'
                      : 'text-muted-foreground hover:bg-accent',
                  )
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
