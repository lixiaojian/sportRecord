import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import { logout } from '../../lib/auth';
import { Button, buttonVariants } from '../ui/button';
import { Link } from 'react-router-dom';

const NAV = [
  { to: '/', label: '概览' },
  { to: '/workouts', label: '训练' },
  { to: '/matches', label: '比赛' },
  { to: '/events', label: '赛事' },
  { to: '/exercises', label: '动作库' },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="text-lg font-bold">
            🏸 Sport Record
          </Link>
          <nav className="hidden flex-1 gap-4 sm:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.username}</span>
                <Button variant="outline" size="sm" onClick={() => void logout()}>
                  退出
                </Button>
              </>
            ) : (
              <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                登录
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
