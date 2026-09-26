import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Mark all as read and return
  const notifications = await db.all(`
    SELECT id, message, notif_type, created_at, is_read
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `, userId);

  await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', userId);

  return NextResponse.json({ notifications });
}
