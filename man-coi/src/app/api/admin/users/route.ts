import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role, u.personal_points,
           t.name as team_name, t.color as team_color,
           (SELECT COUNT(*) FROM rosary_beads WHERE user_id = u.id) as bead_count,
           (SELECT current_streak FROM streaks WHERE user_id = u.id) as streak
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    ORDER BY u.role, u.personal_points DESC
  `).all();
  const teams = db.prepare('SELECT id, name, color FROM teams').all();
  return NextResponse.json({ users, teams });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    const hash = await bcrypt.hash(body.password || 'abc123', 10);
    db.prepare(`
      INSERT INTO users (username, display_name, password_hash, role, team_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(body.username, body.displayName, hash, body.role || 'CHILD', body.teamId || null);
    return NextResponse.json({ success: true });
  }

  if (action === 'update') {
    db.prepare(`
      UPDATE users SET display_name = ?, role = ?, team_id = ? WHERE id = ?
    `).run(body.displayName, body.role, body.teamId || null, body.userId);
    return NextResponse.json({ success: true });
  }

  if (action === 'resetPassword') {
    const hash = await bcrypt.hash(body.newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, body.userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
