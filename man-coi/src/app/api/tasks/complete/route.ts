import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const { taskId } = await req.json();

  if (!taskId) {
    return NextResponse.json({ error: 'Thiếu taskId' }, { status: 400 });
  }

  // ── Get task info ──
  const task = await db.get(
    'SELECT * FROM tasks WHERE id = ? AND is_active = 1',
    taskId
  ) as any;

  if (!task) {
    return NextResponse.json({ error: 'Nhiệm vụ không tồn tại' }, { status: 404 });
  }

  const beadType: string = task.bead_type || 'small';
  const beadsToAdd: number = task.bead_progress || 1;

  // ── Count current beads by type ──
  const smallBeadRow = await db.get(
    "SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ? AND bead_type = 'small'",
    userId
  ) as { cnt: number } | null;
  const smallBeadCount = smallBeadRow?.cnt || 0;

  const largeBeadRow = await db.get(
    "SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ? AND bead_type = 'large'",
    userId
  ) as { cnt: number } | null;
  const largeBeadCount = largeBeadRow?.cnt || 0;

  const totalBeadCount = smallBeadCount + largeBeadCount;

  // 1. Record completion (points = 0, beads_earned = actual count)
  const completion = await db.run(`
    INSERT INTO task_completions (user_id, task_id, points_earned, beads_earned)
    VALUES (?, ?, 0, ?)
  `, userId, taskId, beadsToAdd);

  const completionId = completion.lastInsertRowid as number;

  // 2. Award beads to user and team
  const userRow = await db.get('SELECT team_id FROM users WHERE id = ?', userId) as any;
  if (userRow?.team_id) {
    await db.run(
      'UPDATE teams SET total_points = total_points + ? WHERE id = ?',
      beadsToAdd, userRow.team_id
    );
  }

  // Update personal bead count stored in personal_points
  await db.run(
    'UPDATE users SET personal_points = personal_points + ? WHERE id = ?',
    beadsToAdd, userId
  );

  // 3. Update streak
  const streakRow = await db.get('SELECT * FROM streaks WHERE user_id = ?', userId) as any;
  const todayDate = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!streakRow) {
    await db.run(`
      INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date)
      VALUES (?, 1, 1, ?)
    `, userId, todayDate);
  } else {
    let newStreak = streakRow.current_streak;
    if (streakRow.last_active_date === yesterdayDate) {
      newStreak = streakRow.current_streak + 1;
    } else if (streakRow.last_active_date !== todayDate) {
      newStreak = 1; // reset
    }
    const longest = Math.max(newStreak, streakRow.longest_streak);
    await db.run(`
      UPDATE streaks
      SET current_streak = ?, longest_streak = ?, last_active_date = ?
      WHERE user_id = ?
    `, newStreak, longest, todayDate, userId);
  }

  // 4. Update community total
  await db.run(
    "UPDATE community_progress SET total_beads = total_beads + ?, updated_at = datetime('now')",
    beadsToAdd
  );

  // 5. Total beads count by type from task_completions
  const totalSmallRow = await db.get(`
    SELECT COALESCE(SUM(tc.beads_earned), 0) as total
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.user_id = ? AND (t.bead_type = 'small' OR t.bead_type IS NULL)
  `, userId) as { total: number } | null;
  const totalSmall = totalSmallRow?.total || 0;

  const totalLargeRow = await db.get(`
    SELECT COALESCE(SUM(tc.beads_earned), 0) as total
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.user_id = ? AND t.bead_type = 'large'
  `, userId) as { total: number } | null;
  const totalLarge = totalLargeRow?.total || 0;

  const newTotalBeads = totalSmall + totalLarge;

  // 6. Sync rosary_beads positions for visual display
  const newBeadPositions: number[] = [];

  if (beadType === 'small') {
    const prevSmall = totalSmall - beadsToAdd;
    for (let s = prevSmall + 1; s <= totalSmall; s++) {
      if (s <= 50) {
        try {
          await db.run(`
            INSERT OR IGNORE INTO rosary_beads (user_id, bead_position, bead_type, task_completion_id)
            VALUES (?, ?, 'small', ?)
          `, userId, s, completionId);
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
          await db.run(`
            INSERT OR IGNORE INTO rosary_beads (user_id, bead_position, bead_type, task_completion_id)
            VALUES (?, ?, 'large', ?)
          `, userId, pos, completionId);
          newBeadPositions.push(pos);
        } catch {}
      }
    }
  }

  const earnedBadges: any[] = [];
  const earnedRewards: any[] = [];
  const updatedStreak = await db.get('SELECT current_streak FROM streaks WHERE user_id = ?', userId) as any;

  // Check bead-based badges
  const beadBadges = await db.all(`
    SELECT b.* FROM badges b
    WHERE b.condition_type = 'beads' AND b.condition_value <= ?
    AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
  `, newTotalBeads, userId) as any[];

  for (const badge of beadBadges) {
    await db.run(
      'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
      userId, badge.id
    );
    earnedBadges.push(badge);
    await db.run(`
      INSERT INTO notifications (user_id, message, notif_type)
      VALUES (?, ?, 'badge')
    `, userId, `🏅 Bạn vừa nhận huy hiệu "${badge.name}"!`);
  }

  // Check streak badges
  if (updatedStreak) {
    const streakBadges = await db.all(`
      SELECT b.* FROM badges b
      WHERE b.condition_type = 'streak' AND b.condition_value <= ?
      AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
    `, updatedStreak.current_streak, userId) as any[];

    for (const badge of streakBadges) {
      await db.run(
        'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        userId, badge.id
      );
      earnedBadges.push(badge);
      await db.run(`
        INSERT INTO notifications (user_id, message, notif_type)
        VALUES (?, ?, 'badge')
      `, userId, `🔥 Huy hiệu streak "${badge.name}" đã mở khóa!`);
    }
  }

  // Check rewards by beads
  const beadRewards = await db.all(`
    SELECT r.* FROM rewards r
    WHERE r.condition_beads IS NOT NULL AND r.condition_beads <= ?
    AND r.id NOT IN (SELECT reward_id FROM user_rewards WHERE user_id = ?)
    AND r.is_active = 1
  `, newTotalBeads, userId) as any[];

  for (const reward of beadRewards) {
    await db.run(
      'INSERT OR IGNORE INTO user_rewards (user_id, reward_id) VALUES (?, ?)',
      userId, reward.id
    );
    earnedRewards.push(reward);
    await db.run(`
      INSERT INTO notifications (user_id, message, notif_type)
      VALUES (?, ?, 'reward')
    `, userId, `🎁 Bạn nhận được phần thưởng "${reward.name}"!`);
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
        await db.run(`
          INSERT INTO notifications (user_id, message, notif_type)
          VALUES (?, ?, 'milestone')
        `, userId, `✨ Chúc mừng! Bạn đã đạt mốc ${msg}`);
      }
    }
  }

  return NextResponse.json({
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
  });
}
