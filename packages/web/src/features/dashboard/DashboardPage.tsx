import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { useTrainingStats, useMatchStats } from '../stats/hooks';
import { buttonVariants } from '../../components/ui/button';
import { cn } from '../../lib/utils';

const QUICK_LINKS = [
  { to: '/workouts', label: '训练记录', desc: '查看与录入训练课' },
  { to: '/matches', label: '比赛记录', desc: '录入比赛战绩' },
  { to: '/exercises', label: '动作库', desc: '管理训练动作' },
  { to: '/stats', label: '统计', desc: '训练与比赛图表' },
];

export function DashboardPage() {
  const user = useCurrentUser();
  const training = useTrainingStats(!!user);
  const match = useMatchStats(!!user);

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">🏸 羽毛球训练与比赛记录</h1>
        <p className="text-muted-foreground">登录后记录训练、分析战绩，或浏览他人的公开记录。</p>
        <div className="flex gap-2">
          <Link to="/login" className={buttonVariants()}>
            登录
          </Link>
          <Link to="/register" className={buttonVariants({ variant: 'outline' })}>
            注册
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="font-medium">{l.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{l.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">你好，{user.nickname || user.username}</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold">训练概览</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="训练次数"
            value={training.data?.totalWorkouts}
            loading={training.isLoading}
          />
          <StatCard
            label="总时长(分)"
            value={training.data?.totalDuration}
            loading={training.isLoading}
          />
          <StatCard label="总组数" value={training.data?.totalSets} loading={training.isLoading} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">比赛概览</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="总场次" value={match.data?.total} loading={match.isLoading} />
          <StatCard label="胜场" value={match.data?.win} loading={match.isLoading} />
          <StatCard
            label="胜率"
            value={
              match.data?.winRate !== undefined
                ? `${(match.data.winRate * 100).toFixed(0)}%`
                : undefined
            }
            loading={match.isLoading}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">快捷入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn('rounded-md border bg-card p-4 transition-colors hover:bg-accent')}
            >
              <div className="font-medium">{l.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{l.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number | string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{loading ? '–' : (value ?? 0)}</div>
    </div>
  );
}
