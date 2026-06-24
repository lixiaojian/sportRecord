import { prisma } from '../src/lib/prisma.js';

/**
 * seed 脚本（design.md 3.5 + 4.1）：
 * - 内置羽毛球动作库（按分类预填，isBuiltIn=true，creatorId=null）
 * - ADMIN_USERNAME 命中已注册用户则提权为 admin（密码不硬编码）
 *
 * 幂等：内置动作按 name+category 去重 upsert，可重复执行。
 */
async function main() {
  // 内置动作库：(name, category, unit, note)
  const builtins: Array<{
    name: string;
    category: 'technique' | 'footwork' | 'fitness' | 'multiball' | 'sparring';
    unit: 'sets' | 'duration' | 'reps';
    note?: string;
  }> = [
    // 技术
    { name: '正手高远球', category: 'technique', unit: 'sets', note: '后场发力基础' },
    { name: '反手高远球', category: 'technique', unit: 'sets' },
    { name: '正手杀球', category: 'technique', unit: 'sets' },
    { name: '劈吊', category: 'technique', unit: 'sets', note: '后场过渡' },
    { name: '网前搓球', category: 'technique', unit: 'reps', note: '前场小球' },
    { name: '网前勾球', category: 'technique', unit: 'reps' },
    { name: '推球', category: 'technique', unit: 'reps' },
    // 步法
    { name: '前后场移动', category: 'footwork', unit: 'sets', note: '基础步伐' },
    { name: '两侧蹬步', category: 'footwork', unit: 'sets' },
    { name: '交叉步', category: 'footwork', unit: 'duration' },
    { name: '米字步', category: 'footwork', unit: 'duration', note: '全场覆盖' },
    // 体能
    { name: '跳绳', category: 'fitness', unit: 'duration', note: '协调与小腿' },
    { name: '深蹲', category: 'fitness', unit: 'reps' },
    { name: '核心训练', category: 'fitness', unit: 'duration' },
    { name: '跑步', category: 'fitness', unit: 'duration' },
    // 多球
    { name: '多球高远', category: 'multiball', unit: 'reps' },
    { name: '多球网前', category: 'multiball', unit: 'reps' },
    { name: '多球杀球', category: 'multiball', unit: 'reps' },
    // 对抗
    { name: '单打对抗', category: 'sparring', unit: 'duration' },
    { name: '双打对抗', category: 'sparring', unit: 'duration' },
  ];

  for (const b of builtins) {
    // 幂等：按 name + category + isBuiltIn 判断是否已存在，避免重复 seed 产生副本
    const exists = await prisma.exercise.findFirst({
      where: { name: b.name, category: b.category, isBuiltIn: true },
    });
    if (!exists) {
      await prisma.exercise.create({
        data: { ...b, isBuiltIn: true, creatorId: null },
      });
    }
  }

  // admin 提权
  const adminUsername = process.env.ADMIN_USERNAME;
  if (adminUsername) {
    const admin = await prisma.user.findUnique({ where: { username: adminUsername } });
    if (admin && admin.role !== 'admin') {
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'admin' },
      });
      console.log(`[seed] 已将用户 ${adminUsername} 提权为 admin`);
    } else if (!admin) {
      console.log(
        `[seed] ADMIN_USERNAME=${adminUsername} 尚未注册，提权将在该用户注册后再次 seed 时生效`,
      );
    } else {
      console.log(`[seed] 用户 ${adminUsername} 已是 admin，无需提权`);
    }
  }

  console.log(`[seed] 内置动作库 ${builtins.length} 项已就绪`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
