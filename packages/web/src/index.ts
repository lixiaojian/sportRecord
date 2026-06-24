import {
  registerSchema,
  loginSchema,
  ExerciseCategorySchema,
  createWorkoutSchema,
  createMatchSchema,
  scoresSchema,
  paginationSchema,
  apiResponseSchema,
  type Role,
  type Workout,
} from '@sport-record/shared';

// 编译期断言：导入的 schema 与类型在 web 端可解析
const _role: Role = 'user';
const _workout: Workout = {} as Workout;

// 运行期断言：zod 实例可正常执行
registerSchema.parse({ username: 'alice', password: 'pass1234' });
loginSchema.parse({ username: 'alice', password: 'pass1234' });
ExerciseCategorySchema.parse('technique');
createWorkoutSchema.parse({ date: '2026-01-01', title: 't' });
createMatchSchema.parse({
  eventId: '00000000-0000-0000-0000-000000000000',
  type: 'single',
  date: '2026-01-01',
  opponentIds: [],
  scores: [
    [21, 15],
    [19, 21],
  ],
  result: 'win',
});
scoresSchema.parse([[21, 15]]);
paginationSchema.parse({ page: '1', pageSize: '20' });
apiResponseSchema(ExerciseCategorySchema).parse({
  code: 0,
  message: 'ok',
  data: 'technique',
});

void _role;
void _workout;
