import {
  createMatchSchema,
  updateMatchSchema,
  type CreateMatchInput,
  type UpdateMatchInput,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { isOwner } from '../lib/auth.js';
import { NOT_FOUND, FORBIDDEN } from '../lib/errors.js';

/**
 * 比赛 service（design.md 4.1 Match + 5.2 + 3.4 公开机制）。
 *
 * scores / opponentIds 在 SQLite 中以 JSON 字符串存储，service 层负责
 * 入库 stringify、出库 parse，对外保持数组形态（与 shared schema 一致）。
 * - 列表：游客仅公开；登录 自己全部 + 他人公开
 * - 详情：公开或归属自己/admin 可见，否则 404
 * - 改删：仅记录者（admin 可改任意）
 * - isPublic 未显式传入时取用户 defaultPublic
 */

type MatchRow = {
  id: string;
  eventId: string;
  userId: string;
  type: string;
  date: string;
  partnerId: string | null;
  opponentIds: string;
  scores: string;
  result: string;
  note: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MatchOut = Omit<MatchRow, 'scores' | 'opponentIds'> & {
  scores: number[][];
  opponentIds: string[];
};

function fromDb(item: MatchRow): MatchOut {
  return {
    ...item,
    scores: JSON.parse(item.scores || '[]') as number[][],
    opponentIds: JSON.parse(item.opponentIds || '[]') as string[],
  };
}

function toDbScores(scores: number[][]): string {
  return JSON.stringify(scores);
}

export async function list(userId: string | undefined, skip: number, take: number) {
  const where = userId ? { OR: [{ userId }, { isPublic: true }] } : { isPublic: true };
  const [rows, total] = await Promise.all([
    prisma.match.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
    prisma.match.count({ where }),
  ]);
  return { list: rows.map(fromDb), total };
}

export async function create(input: CreateMatchInput, userId: string) {
  const data = createMatchSchema.parse(input);
  if (data.isPublic === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultPublic: true },
    });
    data.isPublic = user?.defaultPublic ?? true;
  }
  const row = await prisma.match.create({
    data: {
      eventId: data.eventId,
      userId,
      type: data.type,
      date: data.date,
      partnerId: data.partnerId ?? null,
      opponentIds: toDbScores(data.opponentIds as unknown as number[][]),
      scores: toDbScores(data.scores),
      result: data.result,
      note: data.note ?? '',
      isPublic: data.isPublic,
    },
  });
  return fromDb(row);
}

export async function getById(id: string, userId: string | undefined, isAdmin: boolean) {
  const item = await prisma.match.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('比赛不存在');
  const visible = item.isPublic || (userId !== undefined && isOwner(item, userId)) || isAdmin;
  if (!visible) throw NOT_FOUND('比赛不存在');
  return fromDb(item);
}

async function getMutable(id: string, userId: string, isAdmin: boolean) {
  const item = await prisma.match.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('比赛不存在');
  if (!isOwner(item, userId) && !isAdmin) throw FORBIDDEN('无权操作该比赛');
  return item;
}

export async function update(
  id: string,
  input: UpdateMatchInput,
  userId: string,
  isAdmin: boolean,
) {
  await getMutable(id, userId, isAdmin);
  const data = updateMatchSchema.parse(input);
  // 只更新显式传入的字段；scores/opponentIds 需 stringify
  const dbData: Record<string, unknown> = {};
  if (data.eventId !== undefined) dbData.eventId = data.eventId;
  if (data.type !== undefined) dbData.type = data.type;
  if (data.date !== undefined) dbData.date = data.date;
  if (data.partnerId !== undefined) dbData.partnerId = data.partnerId ?? null;
  if (data.opponentIds !== undefined)
    dbData.opponentIds = toDbScores(data.opponentIds as unknown as number[][]);
  if (data.scores !== undefined) dbData.scores = toDbScores(data.scores);
  if (data.result !== undefined) dbData.result = data.result;
  if (data.note !== undefined) dbData.note = data.note;
  if (data.isPublic !== undefined) dbData.isPublic = data.isPublic;
  const row = await prisma.match.update({ where: { id }, data: dbData });
  return fromDb(row);
}

export async function remove(id: string, userId: string, isAdmin: boolean) {
  await getMutable(id, userId, isAdmin);
  await prisma.match.delete({ where: { id } });
}
