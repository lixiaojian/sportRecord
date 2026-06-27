import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../lib/hooks/useAuth';
import { useDashboardStats } from '../../lib/hooks/useDashboard';
import { useTrainingStats, useMatchStats } from '../stats/hooks';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Stack, Grid } from '../../components/ui/layout';
import { Dumbbell, Trophy, TrendingUp, Activity, Target, ChevronRight, Zap } from 'lucide-react';

export function DashboardPage() {
  const user = useCurrentUser();
  const dashboard = useDashboardStats(!!user);
  const training = useTrainingStats(!!user);
  const match = useMatchStats(!!user);

  const data = dashboard.data;

  if (!user) {
    return (
      <Card className="min-h-[80vh] border-0 shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center text-center h-full">
          <CardTitle className="text-4xl font-bold text-primary">🏸 科学训练，超越极限</CardTitle>
          <CardDescription className="mt-4 text-lg">数据驱动表现，成就更好的自己</CardDescription>
          <CardFooter className="mt-8">
            <Stack direction="row" gap={4}>
              <Link to="/login">
                <Button size="lg" className="bg-primary text-primary-foreground">
                  开始训练
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg">
                  选手分析
                </Button>
              </Link>
            </Stack>
          </CardFooter>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack gap={6}>
      <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30">
        <CardContent className="relative z-10 p-8">
          <CardTitle className="text-4xl font-bold">
            <span className="text-foreground">科学训练，</span>
            <span className="text-primary">超越极限</span>
          </CardTitle>
          <CardDescription className="mt-2 text-lg">数据驱动表现，成就更好的自己</CardDescription>
          <CardFooter className="mt-6 p-0">
            <Stack direction="row" gap={4}>
              <Link to="/workouts">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                >
                  开始训练
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/stats">
                <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur">
                  选手分析
                  <TrendingUp className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Stack>
          </CardFooter>
        </CardContent>
        <Stack className="absolute right-8 top-8 opacity-20">
          <svg className="h-48 w-48" viewBox="0 0 100 100" fill="none">
            <circle cx="30" cy="70" r="15" fill="currentColor" className="text-emerald-500" />
            <path
              d="M35 65 Q50 50 70 30 Q80 20 90 10"
              stroke="currentColor"
              strokeWidth="3"
              className="text-emerald-400"
              fill="none"
            />
            <ellipse
              cx="75"
              cy="25"
              rx="20"
              ry="8"
              fill="currentColor"
              className="text-emerald-300"
              transform="rotate(-45 75 25)"
            />
          </svg>
        </Stack>
      </Card>

      <Grid colsMd={3} gap={4}>
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-6">
            <Stack className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 transition-transform group-hover:scale-150" />
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-semibold">训练中心</CardTitle>
              <CardDescription>个性化训练计划，提升技术水平</CardDescription>
            </CardHeader>
            <CardFooter className="p-0 mt-4">
              <Link
                to="/workouts"
                className="inline-flex items-center text-primary hover:underline"
              >
                进入训练 <ChevronRight className="h-4 w-4" />
              </Link>
            </CardFooter>
            <Grid cols={4} gap={2} className="mt-6">
              {[
                { icon: Dumbbell, label: '技术' },
                { icon: Activity, label: '体能' },
                { icon: Target, label: '多球' },
                { icon: Zap, label: '自定义' },
              ].map((item) => (
                <Card key={item.label} className="border-0 shadow-none rounded-lg bg-secondary/50">
                  <CardContent className="p-2">
                    <Stack align="center" gap={1}>
                      <item.icon className="h-5 w-5 text-primary" />
                      <CardDescription className="text-xs">{item.label}</CardDescription>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-6">
            <Stack className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/10 transition-transform group-hover:scale-150" />
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-semibold">比赛中心</CardTitle>
              <CardDescription>赛事报名、直播，回放与数据</CardDescription>
            </CardHeader>
            <CardFooter className="p-0 mt-4">
              <Link
                to="/matches"
                className="inline-flex items-center text-blue-500 hover:underline"
              >
                查看赛事 <ChevronRight className="h-4 w-4" />
              </Link>
            </CardFooter>
            <Card className="mt-4 rounded-lg bg-blue-50 border-0 shadow-none dark:bg-blue-950/30">
              <CardContent className="p-4">
                <Stack direction="row" align="center" gap={2}>
                  <Badge variant="success" className="rounded-sm gap-1">
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    进行中
                  </Badge>
                </Stack>
                <CardTitle className="mt-2 text-sm">2024 全国羽毛球锦标赛</CardTitle>
                <CardDescription className="text-xs">男子单打 1/4 决赛</CardDescription>
                <Stack direction="row" align="center" justify="between" className="mt-3">
                  <Stack align="center">
                    <Stack className="h-8 w-8 rounded-full bg-gray-200" />
                    <CardDescription className="mt-1 text-xs">李俊辉</CardDescription>
                  </Stack>
                  <Badge variant="outline" className="text-sm font-bold">
                    VS
                  </Badge>
                  <Stack align="center">
                    <Stack className="h-8 w-8 rounded-full bg-gray-200" />
                    <CardDescription className="mt-1 text-xs">王子衡</CardDescription>
                  </Stack>
                </Stack>
                <CardDescription className="mt-2 text-center text-xs font-medium !text-primary">
                  21-18 19-21 21-15
                </CardDescription>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-6">
            <Stack className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 transition-transform group-hover:scale-150" />
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-semibold">选手分析</CardTitle>
              <CardDescription>多维度数据分析，发现提升空间</CardDescription>
            </CardHeader>
            <CardFooter className="p-0 mt-4">
              <Link
                to="/stats"
                className="inline-flex items-center text-purple-500 hover:underline"
              >
                进入分析 <ChevronRight className="h-4 w-4" />
              </Link>
            </CardFooter>
            <Stack align="center" justify="center" className="mt-4">
              <svg viewBox="0 0 100 100" className="h-24 w-24">
                <polygon
                  points="50,10 90,30 80,80 20,80 10,30"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <polygon
                  points="50,15 85,35 75,75 25,75 15,35"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <polygon
                  points="50,20 80,40 70,70 30,70 20,40"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <polygon
                  points="50,25 75,45 65,65 35,65 25,45"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <polygon
                  points="50,22 78,42 72,68 28,68 22,42"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.3"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
              </svg>
            </Stack>
            <Grid cols={4} gap={2} className="mt-4 text-center">
              <Stack align="center">
                <CardDescription className="text-xs">综合评分</CardDescription>
                <CardTitle className="text-lg font-bold text-primary">85</CardTitle>
                <CardDescription className="!text-green-500 text-xs">优秀</CardDescription>
              </Stack>
              <Stack align="center">
                <CardDescription className="text-xs">技术能力</CardDescription>
                <CardTitle className="text-lg font-bold">82</CardTitle>
              </Stack>
              <Stack align="center">
                <CardDescription className="text-xs">战术意识</CardDescription>
                <CardTitle className="text-lg font-bold">88</CardTitle>
              </Stack>
              <Stack align="center">
                <CardDescription className="text-xs">体能状态</CardDescription>
                <CardTitle className="text-lg font-bold">80</CardTitle>
              </Stack>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid colsLg={3} gap={6}>
        <Stack gap={6} className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <CardHeader className="p-0 mb-4">
                <Stack direction="row" align="center" gap={2}>
                  <Stack className="h-4 w-1 rounded-full bg-primary" />
                  <CardTitle className="text-lg font-semibold">我的数据概览</CardTitle>
                </Stack>
              </CardHeader>
              <Grid colsMd={3} gap={6}>
                <Stack align="center">
                  <Stack className="relative h-32 w-32">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--secondary))"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${((data?.overallScore ?? 0) / 100) * 251.2} 251.2`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(190, 80%, 45%)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Stack align="center" justify="center" className="absolute inset-0">
                      <CardTitle className="text-3xl font-bold">
                        {data?.overallScore ?? 0}
                      </CardTitle>
                      <CardDescription className="!text-green-500 text-xs">
                        {data?.scoreLevel ?? '-'}
                      </CardDescription>
                    </Stack>
                  </Stack>
                  <CardDescription className="mt-2 text-sm">
                    较上月{' '}
                    <span className="text-green-500 font-medium">↑ {data?.scoreChange ?? 0}%</span>
                  </CardDescription>
                </Stack>

                <Stack className="md:col-span-2">
                  <CardTitle className="mb-3 text-sm font-medium">能力雷达图</CardTitle>
                  <Stack direction="row" gap={4}>
                    <Stack className="relative h-40 w-40 flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full">
                        <polygon
                          points="50,10 90,30 80,80 20,80 10,30"
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                        />
                        <polygon
                          points="50,15 85,35 75,75 25,75 15,35"
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                        />
                        <polygon
                          points="50,20 80,40 70,70 30,70 20,40"
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                        />
                        <polygon
                          points="50,22 78,42 72,68 28,68 22,42"
                          fill="hsl(var(--primary))"
                          fillOpacity="0.2"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                        />
                        <text
                          x="50"
                          y="8"
                          textAnchor="middle"
                          className="text-[8px] fill-muted-foreground"
                        >
                          进攻能力 {data?.abilities.attack ?? 0}
                        </text>
                        <text x="92" y="32" className="text-[8px] fill-muted-foreground">
                          防守能力 {data?.abilities.defense ?? 0}
                        </text>
                        <text x="82" y="85" className="text-[8px] fill-muted-foreground">
                          技术稳定性 {data?.abilities.stability ?? 0}
                        </text>
                        <text x="18" y="85" className="text-[8px] fill-muted-foreground">
                          体能水平 {data?.abilities.stamina ?? 0}
                        </text>
                        <text x="8" y="32" className="text-[8px] fill-muted-foreground">
                          战术意识 {data?.abilities.tactics ?? 0}
                        </text>
                        <text
                          x="50"
                          y="45"
                          textAnchor="middle"
                          className="text-[8px] fill-muted-foreground"
                        >
                          心理素质 {data?.abilities.mentality ?? 0}
                        </text>
                      </svg>
                    </Stack>
                    <Stack className="flex-1">
                      <CardTitle className="mb-2 text-sm font-medium">表现趋势</CardTitle>
                      <Stack className="relative h-24 w-full">
                        <svg viewBox="0 0 200 80" className="h-full w-full">
                          <polyline
                            points="0,60 25,55 50,58 75,50 100,52 125,45 150,48 175,40 200,35"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                          />
                          <polyline
                            points="0,70 25,68 50,65 75,60 100,62 125,58 150,55 175,52 200,50"
                            fill="none"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                        </svg>
                        <Stack direction="row" gap={4} className="mt-2 text-xs">
                          <Badge variant="outline" className="gap-1 text-xs font-normal rounded-sm">
                            <span className="h-2 w-2 rounded-full bg-primary" /> 综合表现
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs font-normal rounded-sm">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground" /> 训练负荷
                          </Badge>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>

              <Stack className="mt-6">
                <CardTitle className="mb-3 text-sm font-medium">技术统计 Top 5</CardTitle>
                <Stack gap={3}>
                  {(data?.techniqueStats.length ?? 0) > 0 ? (
                    data?.techniqueStats.map((stat) => (
                      <StatRow
                        key={stat.name}
                        name={stat.name}
                        count={stat.count}
                        percentage={stat.percentage}
                      />
                    ))
                  ) : (
                    <CardDescription>暂无训练数据</CardDescription>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Grid colsMd={2} gap={4}>
            <Card>
              <CardHeader>
                <Stack direction="row" align="center" gap={2}>
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <CardTitle className="font-semibold">训练概览</CardTitle>
                </Stack>
              </CardHeader>
              <CardContent>
                <Stack gap={3}>
                  <StatRowSimple
                    label="训练次数"
                    value={training.data?.totalWorkouts}
                    loading={training.isLoading}
                  />
                  <StatRowSimple
                    label="总时长 (分)"
                    value={training.data?.totalDuration}
                    loading={training.isLoading}
                  />
                  <StatRowSimple
                    label="总组数"
                    value={training.data?.totalSets}
                    loading={training.isLoading}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Stack direction="row" align="center" gap={2}>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="font-semibold">比赛概览</CardTitle>
                </Stack>
              </CardHeader>
              <CardContent>
                <Stack gap={3}>
                  <StatRowSimple
                    label="总场次"
                    value={match.data?.total}
                    loading={match.isLoading}
                  />
                  <StatRowSimple label="胜场" value={match.data?.win} loading={match.isLoading} />
                  <StatRowSimple
                    label="胜率"
                    value={
                      match.data?.winRate !== undefined
                        ? `${(match.data.winRate * 100).toFixed(0)}%`
                        : undefined
                    }
                    loading={match.isLoading}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        <aside>
          <Stack gap={6}>
            <Card>
              <CardHeader>
                <Stack direction="row" align="center" gap={2}>
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="font-semibold">今日训练建议</CardTitle>
                </Stack>
              </CardHeader>
              <CardContent>
                <Stack gap={4}>
                  {(data?.suggestions.length ?? 0) > 0 ? (
                    data?.suggestions.map((suggestion, i) => (
                      <ProgressBar
                        key={i}
                        label={suggestion.label}
                        time={suggestion.time}
                        progress={suggestion.progress}
                      />
                    ))
                  ) : (
                    <CardDescription>暂无训练建议</CardDescription>
                  )}
                </Stack>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="w-full justify-between p-0 text-sm">
                  查看完整计划 <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
              <CardContent className="relative z-10 p-6">
                <CardTitle className="text-xl font-bold text-white">数据驱动</CardTitle>
                <CardDescription className="text-lg font-medium !text-emerald-400">
                  科学训练
                </CardDescription>
                <CardDescription className="mt-2 text-sm !text-gray-300">
                  让每一次训练都更有价值
                </CardDescription>
                <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
                  了解更多 <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
              <Stack className="absolute -bottom-8 -right-8 opacity-30">
                <svg className="h-48 w-48" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="50" cy="30" r="12" />
                  <path d="M50 42 L55 65 L45 65 Z" />
                  <path
                    d="M50 65 L35 85 M50 65 L65 85"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </Stack>
            </Card>
          </Stack>
        </aside>
      </Grid>
    </Stack>
  );
}

function StatRow({ name, count, percentage }: { name: string; count: number; percentage: number }) {
  return (
    <Stack direction="row" align="center" gap={3}>
      <CardDescription className="w-12 text-sm">{name}</CardDescription>
      <Stack className="flex-1">
        <Progress value={percentage} />
      </Stack>
      <CardDescription className="w-20 text-right text-sm font-medium !text-foreground">
        {count} ({percentage}%)
      </CardDescription>
    </Stack>
  );
}

function StatRowSimple({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number | string;
  loading?: boolean;
}) {
  return (
    <Stack direction="row" align="center" justify="between">
      <CardDescription className="text-sm">{label}</CardDescription>
      <CardDescription className="font-medium !text-foreground">
        {loading ? '–' : (value ?? 0)}
      </CardDescription>
    </Stack>
  );
}

function ProgressBar({ label, time, progress }: { label: string; time: string; progress: number }) {
  return (
    <Stack>
      <Stack direction="row" align="center" justify="between" className="mb-1 text-sm">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <CardDescription className="text-sm">{time}</CardDescription>
      </Stack>
      <Progress value={progress} />
      <CardDescription className="mt-1 text-right text-xs">{progress}%</CardDescription>
    </Stack>
  );
}
