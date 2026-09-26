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

  // Get all active tasks – include bead_type
  const tasks = await db.all(`
    SELECT id, title, description, points, bead_progress, bead_type, task_type, icon, reset_type
    FROM tasks
    WHERE is_active = 1
    ORDER BY bead_type DESC, bead_progress ASC
  `) as any[];

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
