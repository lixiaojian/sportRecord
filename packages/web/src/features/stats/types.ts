/**
 * 统计响应类型（对应 server statsService，shared 未导出，前端本地定义）
 */
export interface TrainingStats {
  totalWorkouts: number;
  totalDuration: number;
  totalSets: number;
  categoryRatio: { category: string; count: number; ratio: number }[];
  trend: { period: string; count: number }[];
}

export interface MatchStats {
  total: number;
  win: number;
  winRate: number;
  byType: { type: string; total: number; win: number; winRate: number }[];
  trend: { date: string; type: string; result: string }[];
  opponentWinRate: { opponentId: string; total: number; win: number; winRate: number }[];
}

export interface PublicStats {
  user: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    bio?: string;
    defaultPublic: boolean;
    racketHand?: string;
    mainEvent?: string;
    createdAt: string;
  };
  training: TrainingStats;
  match: MatchStats;
}
