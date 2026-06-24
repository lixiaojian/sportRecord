import { z } from 'zod';

/**
 * 枚举定义（zod enum + 推导类型 + 常量值数组）
 * 字段含义见 docs/design.md 第 4 章
 */

// 角色：游客不入库，仅 user/admin
export const RoleSchema = z.enum(['user', 'admin']);
export type Role = z.infer<typeof RoleSchema>;
export const ROLE_VALUES = RoleSchema.options;

// 训练项分类
export const ExerciseCategorySchema = z.enum([
  'technique', // 技术
  'footwork', // 步法
  'fitness', // 体能
  'multiball', // 多球
  'sparring', // 对抗
]);
export type ExerciseCategory = z.infer<typeof ExerciseCategorySchema>;
export const EXERCISE_CATEGORY_VALUES = ExerciseCategorySchema.options;

// 训练项单位：决定 Set 填哪个字段
export const ExerciseUnitSchema = z.enum([
  'sets', // 组数
  'duration', // 时长
  'reps', // 次数
]);
export type ExerciseUnit = z.infer<typeof ExerciseUnitSchema>;
export const EXERCISE_UNIT_VALUES = ExerciseUnitSchema.options;

// 比赛类型
export const MatchTypeSchema = z.enum([
  'single', // 单打
  'double', // 双打
  'mixed', // 混双
  'team', // 团体
]);
export type MatchType = z.infer<typeof MatchTypeSchema>;
export const MATCH_TYPE_VALUES = MatchTypeSchema.options;

// 赛事类型
export const EventTypeSchema = z.enum([
  'club', // 俱乐部
  'regional', // 区域
  'official', // 官方
]);
export type EventType = z.infer<typeof EventTypeSchema>;
export const EVENT_TYPE_VALUES = EventTypeSchema.options;

// 持拍手
export const RacketHandSchema = z.enum(['left', 'right']);
export type RacketHand = z.infer<typeof RacketHandSchema>;
export const RACKET_HAND_VALUES = RacketHandSchema.options;

// 主项
export const MainEventSchema = z.enum(['single', 'double', 'mixed']);
export type MainEvent = z.infer<typeof MainEventSchema>;
export const MAIN_EVENT_VALUES = MainEventSchema.options;

// 比赛结果
export const MatchResultSchema = z.enum(['win', 'lose']);
export type MatchResult = z.infer<typeof MatchResultSchema>;
export const MATCH_RESULT_VALUES = MatchResultSchema.options;
