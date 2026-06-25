import type {
  ExerciseCategory,
  ExerciseUnit,
  MatchType,
  EventType,
  RacketHand,
  MainEvent,
  MatchResult,
  Role,
} from '@sport-record/shared';

/**
 * 枚举中文标签映射（design.md 第 4 章）
 */
export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  technique: '技术',
  footwork: '步法',
  fitness: '体能',
  multiball: '多球',
  sparring: '对抗',
};

export const EXERCISE_UNIT_LABELS: Record<ExerciseUnit, string> = {
  sets: '组数',
  duration: '时长',
  reps: '次数',
};

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  single: '单打',
  double: '双打',
  mixed: '混双',
  team: '团体',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  club: '俱乐部',
  regional: '区域',
  official: '官方',
};

export const RACKET_HAND_LABELS: Record<RacketHand, string> = {
  left: '左手',
  right: '右手',
};

export const MAIN_EVENT_LABELS: Record<MainEvent, string> = {
  single: '单打',
  double: '双打',
  mixed: '混双',
};

export const MATCH_RESULT_LABELS: Record<MatchResult, string> = {
  win: '胜',
  lose: '负',
};

export const ROLE_LABELS: Record<Role, string> = {
  user: '用户',
  admin: '管理员',
};
