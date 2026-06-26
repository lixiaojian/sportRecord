/**
 * Query key 工厂：集中管理，避免散落字符串（design.md 6.2）
 */
export const queryKeys = {
  currentUser: ['auth', 'me'] as const,
  exercises: ['exercises'] as const,
  workouts: ['workouts'] as const,
  workout: (id: string) => ['workouts', id] as const,
  matches: ['matches'] as const,
  match: (id: string) => ['matches', id] as const,
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  statsTraining: ['stats', 'training'] as const,
  statsMatch: ['stats', 'match'] as const,
  statsPublic: (userId: string) => ['stats', 'public', userId] as const,
  trash: ['trash'] as const,
  users: ['users'] as const,
  userSearch: (q: string) => ['users', 'search', q] as const,
  userProfile: (id: string) => ['users', id, 'profile'] as const,
};
