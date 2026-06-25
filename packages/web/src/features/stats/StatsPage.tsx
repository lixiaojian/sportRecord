import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { useTrainingStats, useMatchStats } from './hooks';
import { EXERCISE_CATEGORY_LABELS, MATCH_TYPE_LABELS } from '../../lib/labels';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function StatsPage() {
  const user = useCurrentUser();
  const training = useTrainingStats(!!user);
  const match = useMatchStats(!!user);

  if (!user) {
    return <p className="text-muted-foreground">请登录后查看统计。</p>;
  }

  const t = training.data;
  const m = match.data;

  const categoryData = (t?.categoryRatio ?? []).map((c) => ({
    name:
      EXERCISE_CATEGORY_LABELS[c.category as keyof typeof EXERCISE_CATEGORY_LABELS] ?? c.category,
    value: c.count,
  }));

  const trendData = (t?.trend ?? []).map((p) => ({ name: p.period, 次数: p.count }));

  const byTypeData = (m?.byType ?? []).map((b) => ({
    name: MATCH_TYPE_LABELS[b.type as keyof typeof MATCH_TYPE_LABELS] ?? b.type,
    总场: b.total,
    胜场: b.win,
  }));

  const matchTrend = (m?.trend ?? []).map((p, i) => ({
    name: `${p.date} ${p.type}`,
    idx: i,
    result: p.result === 'win' ? 1 : 0,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">统计</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">训练概览</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card label="训练次数" value={t?.totalWorkouts} loading={training.isLoading} />
          <Card label="总时长(分)" value={t?.totalDuration} loading={training.isLoading} />
          <Card label="总组数" value={t?.totalSets} loading={training.isLoading} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="分类占比">
            {categoryData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e) => `${e.name}: ${e.value}`}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="训练趋势">
            {trendData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="次数" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">比赛概览</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card label="总场次" value={m?.total} loading={match.isLoading} />
          <Card label="胜场" value={m?.win} loading={match.isLoading} />
          <Card
            label="胜率"
            value={m?.winRate !== undefined ? `${(m.winRate * 100).toFixed(0)}%` : undefined}
            loading={match.isLoading}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="各类型胜场">
            {byTypeData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="总场" fill="#94a3b8" />
                  <Bar dataKey="胜场" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="战绩走势（胜=1 负=0）">
            {matchTrend.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={matchTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="idx" />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} />
                  <Tooltip />
                  <Line type="stepAfter" dataKey="result" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

function Card({
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-16 text-center text-sm text-muted-foreground">暂无数据</p>;
}
