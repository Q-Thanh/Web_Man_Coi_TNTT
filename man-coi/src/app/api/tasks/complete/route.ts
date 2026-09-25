import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const db = getDb();
  const userId = parseInt(session.user.id);
  const { taskId } = await req.json();

  if (!taskId) {
    return NextResponse.json({ error: 'Thiếu taskId' }, { status: 400 });
  }

  // ── Get task info ──
  const task = db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND is_active = 1'
  ).get(taskId) as any;

  if (!task) {
    return NextResponse.json({ error: 'Nhiệm vụ không tồn tại' }, { status: 404 });
  }

  // ── All prayer tasks are repeatable – no daily limit ──
  // ── Determine bead type from task ──
  // Kinh Kính Mừng → small beads, Kinh Lạy Cha → large beads
  const beadType: string = task.bead_type || 'small';
  const beadsToAdd: number = task.bead_progress || 1;

  // ── Count current beads by type ──
  const smallBeadCount = (db.prepare(
    "SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ? AND bead_type = 'small'"
  ).get(userId) as { cnt: number }).cnt;

  const largeBeadCount = (db.prepare(
    "SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ? AND bead_type = 'large'"
  ).get(userId) as { cnt: number }).cnt;

  const totalBeadCount = smallBeadCount + largeBeadCount;

  // ── Run everything in a transaction ──
  const result = db.transaction(() => {
    // 1. Record completion (points = 0, beads_earned = actual count)
    const completion = db.prepare(`
      INSERT INTO task_completions (user_id, task_id, points_earned, beads_earned)
      VALUES (?, ?, 0, ?)
    `).run(userId, taskId, beadsToAdd);

    const completionId = completion.lastInsertRowid as number;

    // 2. Award beads to user and team
    const userRow = db.prepare('SELECT team_id FROM users WHERE id = ?').get(userId) as any;
    if (userRow?.team_id) {
      db.prepare(
        'UPDATE teams SET total_points = total_points + ? WHERE id = ?'
      ).run(beadsToAdd, userRow.team_id);
    }

    // Update personal bead count stored in personal_points
    db.prepare(
      'UPDATE users SET personal_points = personal_points + ? WHERE id = ?'
    ).run(beadsToAdd, userId);

    // 3. Update streak
    const streakRow = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId) as any;
    const todayDate = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!streakRow) {
      db.prepare(`
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date)
        VALUES (?, 1, 1, ?)
      `).run(userId, todayDate);
    } else {
      let newStreak = streakRow.current_streak;
      if (streakRow.last_active_date === yesterdayDate) {
        newStreak = streakRow.current_streak + 1;
      } else if (streakRow.last_active_date !== todayDate) {
        newStreak = 1; // reset
      }
      const longest = Math.max(newStreak, streakRow.longest_streak);
      db.prepare(`
        UPDATE streaks
        SET current_streak = ?, longest_streak = ?, last_active_date = ?
        WHERE user_id = ?
      `).run(newStreak, longest, todayDate, userId);
    }

    // 4. Update community total
    db.prepare(
      "UPDATE community_progress SET total_beads = total_beads + ?, updated_at = datetime('now')"
    ).run(beadsToAdd);

    // 5. Total beads count by type from task_completions
    const totalSmall = (db.prepare(`
      SELECT COALESCE(SUM(tc.beads_earned), 0) as total
      FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.user_id = ? AND (t.bead_type = 'small' OR t.bead_type IS NULL)
    `).get(userId) as { total: number }).total;

    const totalLarge = (db.prepare(`
      SELECT COALESCE(SUM(tc.beads_earned), 0) as total
      FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.user_id = ? AND t.bead_type = 'large'
    `).get(userId) as { total: number }).total;

    const newTotalBeads = totalSmall + totalLarge;

    // 6. Sync rosary_beads positions for visual display
    // - Small beads: positions 1..50 on loop
    // - Large beads: positions 51..56 (51: Hạt lớn đầu tiên, 52..55: 4 hạt lớn giữa các chục, 56: Hạt lớn trước Mề Đay)
    const newBeadPositions: number[] = [];

    if (beadType === 'small') {
      const prevSmall = totalSmall - beadsToAdd;
      for (let s = prevSmall + 1; s <= totalSmall; s++) {
        if (s <= 50) {
          try {
            db.prepare(`
              INSERT OR IGNORE INTO rosary_beads (user_id, bead_position, bead_type, task_completion_id)
              VALUES (?, ?, 'small', ?)
            `).run(userId, s, completionId);
            newBeadPositions.push(s);
          } catch {}
        }
      }
    } else {
      const prevLarge = totalLarge - beadsToAdd;
      const largePositions = [51, 52, 53, 54, 55, 56];
      for (let l = prevLarge + 1; l <= totalLarge; l++) {
        if (l <= largePositions.length) {
          const pos = largePositions[l - 1];
          try {
            db.prepare(`
              INSERT OR IGNORE INTO rosary_beads (user_id, bead_position, bead_type, task_completion_id)
              VALUES (?, ?, 'large', ?)
            `).run(userId, pos, completionId);
            newBeadPositions.push(pos);
          } catch {}
        }
      }
    }

    const earnedBadges: any[] = [];
    const earnedRewards: any[] = [];
    const updatedStreak = db.prepare('SELECT current_streak FROM streaks WHERE user_id = ?').get(userId) as any;

    // Check bead-based badges
    const beadBadges = db.prepare(`
      SELECT b.* FROM badges b
      WHERE b.condition_type = 'beads' AND b.condition_value <= ?
      AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
    `).all(newTotalBeads, userId) as any[];

    for (const badge of beadBadges) {
      db.prepare(
        'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)'
      ).run(userId, badge.id);
      earnedBadges.push(badge);
      db.prepare(`
        INSERT INTO notifications (user_id, message, notif_type)
        VALUES (?, ?, 'badge')
      `).run(userId, `🏅 Bạn vừa nhận huy hiệu "${badge.name}"!`);
    }

    // Check streak badges
    if (updatedStreak) {
      const streakBadges = db.prepare(`
        SELECT b.* FROM badges b
        WHERE b.condition_type = 'streak' AND b.condition_value <= ?
        AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
      `).all(updatedStreak.current_streak, userId) as any[];

      for (const badge of streakBadges) {
        db.prepare(
          'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)'
        ).run(userId, badge.id);
        earnedBadges.push(badge);
        db.prepare(`
          INSERT INTO notifications (user_id, message, notif_type)
          VALUES (?, ?, 'badge')
        `).run(userId, `🔥 Huy hiệu streak "${badge.name}" đã mở khóa!`);
      }
    }

    // Check rewards by beads
    const beadRewards = db.prepare(`
      SELECT r.* FROM rewards r
      WHERE r.condition_beads IS NOT NULL AND r.condition_beads <= ?
      AND r.id NOT IN (SELECT reward_id FROM user_rewards WHERE user_id = ?)
      AND r.is_active = 1
    `).all(newTotalBeads, userId) as any[];

    for (const reward of beadRewards) {
      db.prepare(
        'INSERT OR IGNORE INTO user_rewards (user_id, reward_id) VALUES (?, ?)'
      ).run(userId, reward.id);
      earnedRewards.push(reward);
      db.prepare(`
        INSERT INTO notifications (user_id, message, notif_type)
        VALUES (?, ?, 'reward')
      `).run(userId, `🎁 Bạn nhận được phần thưởng "${reward.name}"!`);
    }

    // 8. Milestone notification
    if (newBeadPositions.length > 0) {
      const milestoneMap: Record<number, string> = {
        10: '10 hạt đầu tiên 🌱',
        25: 'Nửa chặng đường 💪',
        50: '50 hạt – Gần về đích 🔥',
        55: 'Hoàn thành toàn chuỗi 👑',
      };
      for (const [pos, msg] of Object.entries(milestoneMap)) {
        if (totalBeadCount < parseInt(pos) && newTotalBeads >= parseInt(pos)) {
          db.prepare(`
            INSERT INTO notifications (user_id, message, notif_type)
            VALUES (?, ?, 'milestone')
          `).run(userId, `✨ Chúc mừng! Bạn đã đạt mốc ${msg}`);
        }
      }
    }

    return {
      success: true,
      beadsLit: newBeadPositions,
      beadType,
      beadsAdded: beadsToAdd,
      smallBeads: totalSmall,
      largeBeads: totalLarge,
      totalBeads: newTotalBeads,
      earnedBadges,
      earnedRewards,
      taskTitle: task.title,
    };
  })();

  return NextResponse.json(result);
}
