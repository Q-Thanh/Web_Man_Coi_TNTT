import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();

  const totalUsers = (db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = "CHILD"').get() as any).cnt;
  const totalCompletions = (db.prepare('SELECT COUNT(*) as cnt FROM task_completions').get() as any).cnt;
  const totalBeads = (db.prepare('SELECT COUNT(*) as cnt FROM rosary_beads').get() as any).cnt;

  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = (db.prepare(`SELECT COUNT(*) as cnt FROM task_completions WHERE date(completed_at) = ?`).get(today) as any).cnt;

  const teams = db.prepare(`
    SELECT t.name, t.color, t.total_points,
           COUNT(u.id) as member_count
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id
    GROUP BY t.id
    ORDER BY t.total_points DESC
  `).all();

  const topUsers = db.prepare(`
    SELECT u.display_name, u.personal_points, t.name as team_name,
           (SELECT COUNT(*) FROM rosary_beads WHERE user_id = u.id) as bead_count
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE u.role = 'CHILD'
    ORDER BY u.personal_points DESC
    LIMIT 10
  `).all();

  const recentActivity = db.prepare(`
    SELECT u.display_name, ta.title, tc.points_earned, tc.completed_at
    FROM task_completions tc
    JOIN users u ON tc.user_id = u.id
    JOIN tasks ta ON tc.task_id = ta.id
    ORDER BY tc.completed_at DESC
    LIMIT 15
  `).all();

  return NextResponse.json({
    stats: { totalUsers, totalCompletions, totalBeads, todayCompletions },
    teams,
    topUsers,
    recentActivity,
  });
}
