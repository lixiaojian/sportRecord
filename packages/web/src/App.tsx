import { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { queryClient } from './lib/query';
import { bootstrapAuth } from './lib/auth';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth } from './routes/guards';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ExerciseListPage } from './features/exercise/ExerciseListPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { WorkoutListPage } from './features/training/WorkoutListPage';
import { WorkoutDetailPage } from './features/training/WorkoutDetailPage';
import { MatchListPage } from './features/match/MatchListPage';
import { MatchDetailPage } from './features/match/MatchDetailPage';
import { EventListPage } from './features/match/EventListPage';
import { StatsPage } from './features/stats/StatsPage';
import { TrashPage } from './features/trash/TrashPage';
import { SettingsPage } from './features/settings/SettingsPage';

// 骨架阶段的占位页：后续阶段 6 替换为真实 feature 页面
function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-md border bg-card p-8 text-card-foreground">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">该页面将在阶段 6 实现。</p>
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
      { path: '/admin/users', element: <Placeholder title="用户管理（admin）" /> },
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
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
