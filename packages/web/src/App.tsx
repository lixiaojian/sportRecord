import { lazy, Suspense, useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { queryClient } from './lib/query';
import { bootstrapAuth } from './lib/auth';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth, RequireRole } from './routes/guards';

// 路由级懒加载：每个页面拆为独立 chunk，recharts 等大依赖随 stats 页延后加载
const LoginPage = lazy(() =>
  import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ExerciseListPage = lazy(() =>
  import('./features/exercise/ExerciseListPage').then((m) => ({
    default: m.ExerciseListPage,
  })),
);
const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const WorkoutListPage = lazy(() =>
  import('./features/training/WorkoutListPage').then((m) => ({
    default: m.WorkoutListPage,
  })),
);
const WorkoutDetailPage = lazy(() =>
  import('./features/training/WorkoutDetailPage').then((m) => ({
    default: m.WorkoutDetailPage,
  })),
);
const MatchListPage = lazy(() =>
  import('./features/match/MatchListPage').then((m) => ({ default: m.MatchListPage })),
);
const MatchDetailPage = lazy(() =>
  import('./features/match/MatchDetailPage').then((m) => ({ default: m.MatchDetailPage })),
);
const EventListPage = lazy(() =>
  import('./features/match/EventListPage').then((m) => ({ default: m.EventListPage })),
);
const StatsPage = lazy(() =>
  import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })),
);
const TrashPage = lazy(() =>
  import('./features/trash/TrashPage').then((m) => ({ default: m.TrashPage })),
);
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AdminUsersPage = lazy(() =>
  import('./features/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);

// 骨架阶段的占位页：后续阶段 6 替换为真实 feature 页面
function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-md border bg-card p-8 text-card-foreground">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">该页面将在阶段 6 实现。</p>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      加载中…
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/workouts', element: <WorkoutListPage /> },
      { path: '/workouts/:id', element: <WorkoutDetailPage /> },
      { path: '/matches', element: <MatchListPage /> },
      { path: '/matches/:id', element: <MatchDetailPage /> },
      { path: '/events', element: <EventListPage /> },
      { path: '/exercises', element: <ExerciseListPage /> },
      { path: '/users/:id', element: <Placeholder title="用户主页" /> },
      { path: '/403', element: <Placeholder title="403 权限不足" /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/stats', element: <StatsPage /> },
          { path: '/trash', element: <TrashPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      {
        element: <RequireRole role="admin" />,
        children: [{ path: '/admin/users', element: <AdminUsersPage /> }],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    bootstrapAuth().finally(() => setBootstrapped(true));
  }, []);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        加载中…
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Suspense fallback={<PageFallback />}>
          <RouterProvider router={router} />
        </Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
