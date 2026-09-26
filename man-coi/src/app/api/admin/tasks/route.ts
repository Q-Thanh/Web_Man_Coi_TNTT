import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const tasks = await db.all('SELECT * FROM tasks ORDER BY is_active DESC, task_type, points DESC');
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    await db.run(`
      INSERT INTO tasks (title, description, points, bead_progress, task_type, reset_type, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, body.title, body.description, body.points, body.beadProgress || 1,
       body.taskType || 'daily', body.resetType || 'daily', body.icon || '📿');
    return NextResponse.json({ success: true });
  }

  if (action === 'update') {
    await db.run(`
      UPDATE tasks SET title=?, description=?, points=?, bead_progress=?, task_type=?, reset_type=?, icon=?, is_active=?
      WHERE id = ?
    `, body.title, body.description, body.points, body.beadProgress,
       body.taskType, body.resetType, body.icon, body.isActive ? 1 : 0, body.taskId);
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    await db.run('UPDATE tasks SET is_active = 0 WHERE id = ?', body.taskId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
