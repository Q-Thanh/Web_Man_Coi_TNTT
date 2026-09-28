import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const users = await db.all(`
    SELECT u.id, u.username, u.display_name, u.role, u.team_id, u.personal_points,
           t.name as team_name, t.color as team_color,
           (SELECT COUNT(*) FROM rosary_beads WHERE user_id = u.id) as bead_count,
           (SELECT current_streak FROM streaks WHERE user_id = u.id) as streak
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    ORDER BY u.role, t.id, u.display_name ASC
  `);

  const teams = await db.all('SELECT id, name, color FROM teams ORDER BY id ASC');
  return NextResponse.json({ users, teams });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  // 1. Thêm thành viên mới
  if (action === 'create') {
    const username = (body.username || '').trim().toLowerCase();
    const displayName = (body.displayName || '').trim();
    const teamId = body.teamId ? parseInt(body.teamId) : null;
    const role = body.role || 'CHILD';
    const password = body.password || '123456';

    if (!username || !displayName) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập và họ tên' }, { status: 400 });
    }

    // Kiểm tra trùng username
    const existing = await db.get('SELECT id FROM users WHERE username = ?', username) as any;
    if (existing) {
      return NextResponse.json({ error: `Tên đăng nhập "${username}" đã tồn tại! Vui lòng chọn tên khác.` }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.run(`
      INSERT INTO users (username, display_name, password_hash, role, team_id, personal_points)
      VALUES (?, ?, ?, ?, ?, 0)
    `, username, displayName, hash, role, teamId);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  }

  // 2. Cập nhật thông tin thành viên (Đổi tên, đổi lớp, đổi vai trò)
  if (action === 'update') {
    const userId = parseInt(body.userId);
    const displayName = (body.displayName || '').trim();
    const teamId = body.teamId ? parseInt(body.teamId) : null;
    const role = body.role || 'CHILD';

    if (!userId || !displayName) {
      return NextResponse.json({ error: 'Thiếu thông tin cập nhật' }, { status: 400 });
    }

    await db.run(`
      UPDATE users 
      SET display_name = ?, role = ?, team_id = ?
      WHERE id = ?
    `, displayName, role, teamId, userId);

    return NextResponse.json({ success: true });
  }

  // 3. Đặt lại mật khẩu về mặc định (hoặc mật khẩu mới)
  if (action === 'resetPassword') {
    const userId = parseInt(body.userId);
    const newPassword = body.newPassword || '123456';

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', hash, userId);
    return NextResponse.json({ success: true, message: `Đã đặt lại mật khẩu thành "${newPassword}"` });
  }

  // 4. Xóa thành viên
  if (action === 'delete') {
    const userId = parseInt(body.userId);
    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    // Không cho phép xóa chính mình hoặc admin chính
    if (userId === parseInt(session.user.id) || userId === 1) {
      return NextResponse.json({ error: 'Không thể xóa tài khoản Quản trị viên cấp cao này' }, { status: 400 });
    }

    await db.run('DELETE FROM rosary_beads WHERE user_id = ?', userId);
    await db.run('DELETE FROM task_completions WHERE user_id = ?', userId);
    await db.run('DELETE FROM streaks WHERE user_id = ?', userId);
    await db.run('DELETE FROM user_badges WHERE user_id = ?', userId);
    await db.run('DELETE FROM users WHERE id = ?', userId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
}
