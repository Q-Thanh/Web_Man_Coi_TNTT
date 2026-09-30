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
  const roundNumber = mysteryInfo.roundNumber;
  const beadsInRound = mysteryInfo.beadsInRound;

  // Calculate large beads in the current round (0 to 5)
  const prevRoundLarge = (roundNumber - 1) * 5;
  const largeInRound = Math.max(0, Math.min(5, largeBeads - prevRoundLarge));

  // Get individually lit beads from rosary_beads table for this user
  const userLitBeads = await db.all(
    'SELECT bead_position, bead_type, lit_at FROM rosary_beads WHERE user_id = ?',
    userId
  ) as { bead_position: number; bead_type: string; lit_at: string }[];
  const userLitMap = new Map<number, { bead_type: string; lit_at: string }>();
  for (const b of userLitBeads) {
    userLitMap.set(b.bead_position, b);
  }

  // Total lit count on the chain for the current loop
  const totalLit = beadsInRound + largeInRound;

  // Build the complete bead display array for RosaryChain:
  // - Crucifix: position 0
  // - Pendant beads: 51 (large 1), 101, 102, 103 (3 small), 57 (medallion)
  // - Loop beads: 1..50 (small), 52..55 (4 large dividers)
  const beads: Array<{ position: number; type: string; isLit: boolean; litAt: string | null }> = [];

  // 1. Crucifix (pos 0)
  beads.push({
    position: 0,
    type: 'cross',
    isLit: userLitMap.has(0),
    litAt: userLitMap.get(0)?.lit_at || null,
  });

  // 2. Pendant beads (51, 101, 102, 103, 57)
  beads.push({
    position: 51,
    type: 'large',
    isLit: userLitMap.has(51) || largeInRound >= 1,
    litAt: userLitMap.get(51)?.lit_at || null,
  });

  const pendantSmall = [101, 102, 103];
  pendantSmall.forEach((pos, idx) => {
    beads.push({
      position: pos,
      type: 'small',
      isLit: userLitMap.has(pos) || (roundNumber > 1 || smallBeads > idx),
      litAt: userLitMap.get(pos)?.lit_at || null,
    });
  });

  beads.push({
    position: 57,
    type: 'medallion',
    isLit: userLitMap.has(57) || (roundNumber > 1 || (smallBeads >= 50 && largeBeads >= 5)),
    litAt: userLitMap.get(57)?.lit_at || null,
  });

  // 3. Loop small beads (1-50): strictly follows current round progress (resets on new round)
  for (let pos = 1; pos <= 50; pos++) {
    beads.push({
      position: pos,
      type: 'small',
      isLit: pos <= beadsInRound,
      litAt: userLitMap.get(pos)?.lit_at || null,
    });
  }

  // 4. Large divider beads on loop (52-55): strictly follows current round progress (resets on new round)
  const largeLoopPositions = [52, 53, 54, 55];
  for (let i = 0; i < largeLoopPositions.length; i++) {
    const pos = largeLoopPositions[i];
    beads.push({
      position: pos,
      type: 'large',
      isLit: (i + 1) <= largeInRound,
      litAt: userLitMap.get(pos)?.lit_at || null,
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

  // Get today's small beads (Kinh Kính Mừng) in Vietnam timezone
  const todaySmallRow = await db.get(`
    SELECT COALESCE(SUM(tc.beads_earned), 0) as total
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.user_id = ?
      AND (t.bead_type = 'small' OR t.bead_type IS NULL)
      AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
  `, userId) as { total: number } | null;
  const todaySmallBeads = todaySmallRow?.total || 0;
  const todayChuoi = Math.floor(todaySmallBeads / 50);

  // Get points earned today
  const todayPointsRow = await db.get(`
    SELECT COALESCE(SUM(points_earned), 0) as total
    FROM task_completions
    WHERE user_id = ?
      AND date(completed_at, '+7 hours') = date('now', '+7 hours')
  `, userId) as { total: number } | null;
  const todayPoints = todayPointsRow?.total || 0;

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
      personalPoints: user.personal_points || 0,
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
    todaySmallBeads,
    todayChuoi,
    todayPoints,
    notifications,
  });
}
