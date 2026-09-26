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

  // All rewards with user status
  const rewards = await db.all(`
    SELECT r.*,
           ur.earned_at,
           CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as is_earned
    FROM rewards r
    LEFT JOIN user_rewards ur ON ur.reward_id = r.id AND ur.user_id = ?
    WHERE r.is_active = 1
    ORDER BY r.condition_beads ASC
  `, userId) as any[];

  const beadRow = await db.get(
    'SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ?',
    userId
  ) as { cnt: number } | null;
  const userBeads = beadRow?.cnt || 0;

  return NextResponse.json({ rewards, userBeads });
}
