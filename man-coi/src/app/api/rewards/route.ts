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

  // All rewards with user status
  const rewards = db.prepare(`
    SELECT r.*,
           ur.earned_at,
           CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as is_earned
    FROM rewards r
    LEFT JOIN user_rewards ur ON ur.reward_id = r.id AND ur.user_id = ?
    WHERE r.is_active = 1
    ORDER BY r.condition_beads ASC
  `).all(userId) as any[];

  const userBeads = (db.prepare(
    'SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ?'
  ).get(userId) as { cnt: number }).cnt;

  return NextResponse.json({ rewards, userBeads });
}
