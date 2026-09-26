import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { getMysteryProgress } from '@/lib/rosaryMysteries';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Get user profile with team
  const user = await db.get(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.avatar_frame, u.title,
           u.team_id, u.role,
           t.name as team_name, t.color as team_color, t.total_points as team_beads
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE u.id = ?
  `, userId) as any;

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // 1. Total counts from task_completions + rosary_beads (robust fallback)
  const smallCompletionsRow = await db.get(`
    SELECT COALESCE(SUM(tc.beads_earned), 0) as total
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.user_id = ? AND (t.bead_type = 'small' OR t.bead_type IS NULL)
  `, userId) as { total: number } | null;
  const smallFromCompletions = smallCompletionsRow?.total || 0;

  const smallBeadsRow = await db.get(
    "SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ? AND bead_type = 'small'",
    userId
  ) as { cnt: number } | null;
  const smallFromBeads = smallBeadsRow?.cnt || 0;

  const smallBeads = Math.max(smallFromCompletions, smallFromBeads);

  const largeCompletionsRow = await db.get(`
    SELECT COALESCE(SUM(tc.beads_earned), 0) as total
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.user_id = ? AND t.bead_type = 'large'
  `, userId) as { total: number } | null;
  const largeFromCompletions = largeCompletionsRow?.total || 0;

  const largeBeadsRow = await db.get(
    "SELECT COUNT(*) as cnt FROM rosary_beads WHERE user_id = ? AND bead_type = 'large'",
    userId
  ) as { cnt: number } | null;
  const largeFromBeads = largeBeadsRow?.cnt || 0;

  const largeBeads = Math.max(largeFromCompletions, largeFromBeads);

  const mysteryInfo = getMysteryProgress(smallBeads, largeBeads);
  const beadsInRound = mysteryInfo.beadsInRound;
  const largeInRound = (largeBeads % 5 === 0 && largeBeads > 0) ? 5 : (largeBeads % 5);

  // Total lit count on the chain for the current loop
  const totalLit = beadsInRound + largeInRound;

  // Build the bead display array for RosaryChain:
  // - Small beads: positions 1..50 on the loop (reflecting current round)
  // - Large beads: positions 51..56 (51: Hạt lớn đầu tiên, 52-55: 4 hạt lớn giữa các chục, 56: Hạt lớn trước Mề Đay)
  const beads: Array<{ position: number; type: string; isLit: boolean; litAt: string | null }> = [];

  // Small bead slots (1-50)
  for (let pos = 1; pos <= 50; pos++) {
    beads.push({
      position: pos,
      type: 'small',
      isLit: pos <= beadsInRound,
      litAt: null,
    });
  }

  // Large bead slots (51-56)
  const largePositions = [51, 52, 53, 54, 55, 56];
  for (let i = 0; i < largePositions.length; i++) {
    const pos = largePositions[i];
    beads.push({
      position: pos,
      type: 'large',
      isLit: i < largeInRound,
      litAt: null,
    });
  }

  // Get streak
  const streak = await db.get(
    'SELECT current_streak, longest_streak, last_active_date FROM streaks WHERE user_id = ?',
    userId
  ) as { current_streak: number; longest_streak: number; last_active_date: string } | null;

  // Get today's task completions
  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = await db.all(`
    SELECT tc.task_id FROM task_completions tc
    WHERE tc.user_id = ? AND date(tc.completed_at) = ?
  `, userId, today) as { task_id: number }[];

  const completedTodayIds = new Set(todayCompletions.map(c => c.task_id));

  // Get beads added today
  const todayBeadsRow = await db.get(`
    SELECT COALESCE(SUM(beads_earned), 0) as total
    FROM task_completions
    WHERE user_id = ? AND date(completed_at) = ?
  `, userId, today) as { total: number } | null;
  const todayBeads = todayBeadsRow?.total || 0;

  // Get recent notifications (unread)
  const notifications = await db.all(`
    SELECT id, message, notif_type, created_at
    FROM notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC
    LIMIT 10
  `, userId);

  // Get team rank (by total_points = team bead count)
  let teamRank = null;
  if (user.team_id) {
    const rankRow = await db.get(`
      SELECT COUNT(*) + 1 as rank FROM teams
      WHERE total_points > (SELECT total_points FROM teams WHERE id = ?)
    `, user.team_id) as { rank: number } | null;
    teamRank = rankRow?.rank || 1;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      avatarFrame: user.avatar_frame || 'default',
      title: user.title,
      teamId: user.team_id,
      teamName: user.team_name,
      teamColor: user.team_color,
      teamBeads: user.team_beads || 0,
      teamRank,
      role: user.role,
    },
    beads,
    totalBeads: 55,
    litCount: totalLit,
    smallBeads,
    largeBeads,
    mysteryInfo,
    streak: streak || { current_streak: 0, longest_streak: 0, last_active_date: null },
    completedTodayIds: Array.from(completedTodayIds),
    todayBeads,
    notifications,
  });
}
