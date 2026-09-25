import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const userId = parseInt(session.user.id);

  // All badges with user status
  const badges = db.prepare(`
    SELECT b.*,
           ub.earned_at,
           CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_earned
    FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
    WHERE b.is_active = 1
    ORDER BY b.badge_order
  `).all(userId) as any[];

  // User's current progress for context
  const progress = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM rosary_beads WHERE user_id = ?) as bead_count,
      (SELECT current_streak FROM streaks WHERE user_id = ?) as streak,
      (SELECT COUNT(*) FROM task_completions WHERE user_id = ?) as total_completions
  `).get(userId, userId, userId) as any;

  return NextResponse.json({ badges, progress });
}
