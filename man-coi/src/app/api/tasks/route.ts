import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const today = new Date().toISOString().split('T')[0];

  // Get all active tasks
  const rawTasks = await db.all(`
    SELECT id, title, description, points, bead_progress, bead_type, task_type, icon, reset_type
    FROM tasks
    WHERE is_active = 1
  `) as any[];

  // Custom sort:
  // 1. Stem steps: 1., 2., 3., 4., 5., 6. in exact order
  // 2. Kinh Kính Mừng (small beads) by bead_progress ASC (1, 5, 10, 15, 20, 30, 50)
  // 3. Kinh Lạy Cha (large beads) by bead_progress ASC (1, 5)
  const tasks = rawTasks.sort((a, b) => {
    const stepMatchA = a.title.match(/^(\d+)\./);
    const stepMatchB = b.title.match(/^(\d+)\./);

    if (stepMatchA && stepMatchB) {
      return parseInt(stepMatchA[1]) - parseInt(stepMatchB[1]);
    }
    if (stepMatchA) return -1;
    if (stepMatchB) return 1;

    if (a.bead_type === 'small' && b.bead_type !== 'small') return -1;
    if (a.bead_type !== 'small' && b.bead_type === 'small') return 1;

    return (a.bead_progress || 0) - (b.bead_progress || 0);
  });

  // Count how many times each task was completed today
  const completions = await db.all(`
    SELECT task_id, COUNT(*) as count
    FROM task_completions
    WHERE user_id = ? AND date(completed_at) = ?
    GROUP BY task_id
  `, userId, today) as { task_id: number; count: number }[];

  const completedMap = Object.fromEntries(completions.map(c => [c.task_id, c.count]));

  // All tasks are repeatable – no completedToday lock
  const tasksWithStatus = tasks.map(task => ({
    ...task,
    completionsToday: completedMap[task.id] || 0,
  }));

  return NextResponse.json({ tasks: tasksWithStatus });
}
