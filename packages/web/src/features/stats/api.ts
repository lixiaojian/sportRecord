import { api } from '../../lib/api';
import type { MatchStats, PublicStats, TrainingStats } from './types';

export const statsApi = {
  training: () => api.get<TrainingStats>('/stats/training'),
  match: () => api.get<MatchStats>('/stats/match'),
  public: (userId: string) => api.get<PublicStats>(`/stats/public/${userId}`),
};
