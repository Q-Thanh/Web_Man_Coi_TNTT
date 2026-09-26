import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const targetUserId = body.userId ? parseInt(body.userId) : null;

  try {
    if (targetUserId) {
      // 1. Reset specific user
      await db.run('DELETE FROM rosary_beads WHERE user_id = ?', targetUserId);
      await db.run('DELETE FROM task_completions WHERE user_id = ?', targetUserId);
      await db.run('DELETE FROM streaks WHERE user_id = ?', targetUserId);
      await db.run('UPDATE users SET personal_points = 0 WHERE id = ?', targetUserId);

      // Recalculate team points
      const user = await db.get('SELECT team_id FROM users WHERE id = ?', targetUserId) as any;
      if (user?.team_id) {
        const teamSum = await db.get(
          'SELECT COALESCE(SUM(personal_points), 0) as total FROM users WHERE team_id = ?',
          user.team_id
        ) as any;
        await db.run('UPDATE teams SET total_points = ? WHERE id = ?', teamSum?.total || 0, user.team_id);
      }

      // Recalculate community beads
      const commSum = await db.get('SELECT COUNT(*) as cnt FROM rosary_beads') as any;
      await db.run(
        "UPDATE community_progress SET total_beads = ?, updated_at = datetime('now')",
        commSum?.cnt || 0
      );

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ hạt và điểm của thành viên được chọn về 0 thành công!',
      });
    } else {
      // 2. Reset ALL test beads & completions
      await db.run('DELETE FROM rosary_beads');
      await db.run('DELETE FROM task_completions');
      await db.run('DELETE FROM streaks');
      await db.run("UPDATE users SET personal_points = 0 WHERE role IN ('MEMBER', 'CHILD')");
      await db.run('UPDATE teams SET total_points = 0');
      await db.run(
        "UPDATE community_progress SET total_beads = 0, milestone_1 = 0, milestone_2 = 0, milestone_3 = 0, milestone_4 = 0, updated_at = datetime('now')"
      );

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ hạt test và đưa tiến độ toàn đoàn về 0 thành công!',
      });
    }
  } catch (error: any) {
    console.error('Lỗi khi reset hạt:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi xóa dữ liệu hạt', details: error.message },
      { status: 500 }
    );
  }
}
