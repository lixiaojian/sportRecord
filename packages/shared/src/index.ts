/**
 * @sport-record/shared
 * zod schema + 推导类型 + 枚举，前后端共用
 */

// 枚举
export {
  RoleSchema,
  type Role,
  ROLE_VALUES,
  ExerciseCategorySchema,
  type ExerciseCategory,
  EXERCISE_CATEGORY_VALUES,
  ExerciseUnitSchema,
  type ExerciseUnit,
  EXERCISE_UNIT_VALUES,
  MatchTypeSchema,
  type MatchType,
  MATCH_TYPE_VALUES,
  EventTypeSchema,
  type EventType,
  EVENT_TYPE_VALUES,
  RacketHandSchema,
  type RacketHand,
  RACKET_HAND_VALUES,
  MainEventSchema,
  type MainEvent,
  MAIN_EVENT_VALUES,
  MatchResultSchema,
  type MatchResult,
  MATCH_RESULT_VALUES,
} from './enums.js';

// 通用
export {
  uuidSchema,
  dateSchema,
  paginationSchema,
  type Pagination,
  paginatedDataSchema,
  type PaginatedData,
  apiResponseSchema,
  type ApiResponse,
} from './schemas/common.js';

// 认证
export {
  registerSchema,
  type RegisterInput,
  loginSchema,
  type LoginInput,
  refreshSchema,
  type RefreshInput,
} from './schemas/auth.js';

// 用户
export {
  updateProfileSchema,
  type UpdateProfileInput,
  changePasswordSchema,
  type ChangePasswordInput,
  updateUserByAdminSchema,
  type UpdateUserByAdminInput,
  userProfileSchema,
  type UserProfile,
  currentUserSchema,
  type CurrentUser,
} from './schemas/user.js';

// 训练项
export {
  createExerciseSchema,
  type CreateExerciseInput,
  updateExerciseSchema,
  type UpdateExerciseInput,
  exerciseSchema,
  type Exercise,
} from './schemas/exercise.js';

// 训练课
export {
  createWorkoutSchema,
  type CreateWorkoutInput,
  updateWorkoutSchema,
  type UpdateWorkoutInput,
  workoutSchema,
  type Workout,
} from './schemas/workout.js';

// Set
export {
  createSetSchema,
  type CreateSetInput,
  updateSetSchema,
  type UpdateSetInput,
  setSchema,
  type Set,
} from './schemas/set.js';

// 赛事
export {
  createEventSchema,
  type CreateEventInput,
  updateEventSchema,
  type UpdateEventInput,
  eventSchema,
  type Event,
} from './schemas/event.js';

// 比赛
export {
  createMatchSchema,
  type CreateMatchInput,
  updateMatchSchema,
  type UpdateMatchInput,
  matchSchema,
  type Match,
  scoresSchema,
} from './schemas/match.js';
