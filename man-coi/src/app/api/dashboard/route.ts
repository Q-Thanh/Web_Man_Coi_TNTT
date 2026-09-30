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

  // Check if user belongs to a class/team
  const teamId = user.team_id;

  // 1. Total small beads: If in team, sum for the entire class; otherwise user only
  const smallCompletionsRow = teamId
    ? await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ? AND (t.bead_type = 'small' OR t.bead_type IS NULL)
      `, teamId) as { total: number } | null
    : await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        WHERE tc.user_id = ? AND (t.bead_type = 'small' OR t.bead_type IS NULL)
      `, userId) as { total: number } | null;

  const smallBeads = smallCompletionsRow?.total || 0;

  // 2. Loop large divider beads (only decade Our Fathers on the loop, NOT the stem opening prayer)
  const loopLargeRow = teamId
    ? await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ? AND t.bead_type = 'large' AND t.title NOT LIKE '%Khởi đầu%'
      `, teamId) as { total: number } | null
    : await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        WHERE tc.user_id = ? AND t.bead_type = 'large' AND t.title NOT LIKE '%Khởi đầu%'
      `, userId) as { total: number } | null;

  const loopLargeBeads = loopLargeRow?.total || 0;

  // Total large beads (for general stats display)
  const totalLargeRow = teamId
    ? await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ? AND t.bead_type = 'large'
      `, teamId) as { total: number } | null
    : await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        WHERE tc.user_id = ? AND t.bead_type = 'large'
      `, userId) as { total: number } | null;

  const totalLargeBeads = totalLargeRow?.total || 0;

  // 3. Stem task completions count for the class (used to evaluate if stem beads are lit for this round)
  const stemCountsRow = teamId
    ? await db.get(`
        SELECT
          COALESCE(SUM(CASE WHEN t.bead_type = 'cross' AND t.title LIKE '%Tin Kính%' THEN 1 ELSE 0 END), 0) as cross_count,
          COALESCE(SUM(CASE WHEN t.title LIKE '%Khởi đầu%' THEN 1 ELSE 0 END), 0) as stem_large_count,
          COALESCE(SUM(CASE WHEN t.title LIKE '%Sáng Danh%' THEN 1 ELSE 0 END), 0) as stem_small_count,
          COALESCE(SUM(CASE WHEN t.bead_type = 'medallion' OR t.title LIKE '%Nữ Vương%' THEN 1 ELSE 0 END), 0) as medallion_count
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ?
      `, teamId) as any
    : await db.get(`
        SELECT
          COALESCE(SUM(CASE WHEN t.bead_type = 'cross' AND t.title LIKE '%Tin Kính%' THEN 1 ELSE 0 END), 0) as cross_count,
          COALESCE(SUM(CASE WHEN t.title LIKE '%Khởi đầu%' THEN 1 ELSE 0 END), 0) as stem_large_count,
          COALESCE(SUM(CASE WHEN t.title LIKE '%Sáng Danh%' THEN 1 ELSE 0 END), 0) as stem_small_count,
          COALESCE(SUM(CASE WHEN t.bead_type = 'medallion' OR t.title LIKE '%Nữ Vương%' THEN 1 ELSE 0 END), 0) as medallion_count
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        WHERE tc.user_id = ?
      `, userId) as any;

  const stemCounts = {
    cross: stemCountsRow?.cross_count || 0,
    stemLarge: stemCountsRow?.stem_large_count || 0,
    stemSmall: stemCountsRow?.stem_small_count || 0,
    medallion: stemCountsRow?.medallion_count || 0,
  };

  // 4. Mystery & Round progress based on class small and loop large beads
  const mysteryInfo = getMysteryProgress(smallBeads, loopLargeBeads);
  const roundNumber = mysteryInfo.roundNumber;
  const beadsInRound = mysteryInfo.beadsInRound;

  // Calculate large beads in the current round (0 to 5)
  const prevRoundLarge = (roundNumber - 1) * 5;
  const largeInRound = Math.max(0, Math.min(5, loopLargeBeads - prevRoundLarge));

  // Build the complete bead display array for RosaryChain:
  // - Crucifix: position 0
  // - Pendant beads: 51 (large 1), 101, 102, 103 (3 small), 57 (medallion)
  // - Loop beads: 1..50 (small), 52..55 (4 large dividers)
  //
  // NOTE: On advancing to a new round (roundNumber >= 2), the stem beads REQUIRE
  // completion count >= roundNumber to be lit, cleanly resetting until recited for the new round.
  const beads: Array<{ position: number; type: string; isLit: boolean; litAt: string | null }> = [];

  // 1. Crucifix (pos 0)
  beads.push({
    position: 0,
    type: 'cross',
    isLit: stemCounts.cross >= roundNumber,
    litAt: null,
  });

  // 2. Pendant large bead (pos 51): ONLY lit by the stem Our Father task ("Khởi đầu chuỗi")
  beads.push({
    position: 51,
    type: 'large',
    isLit: stemCounts.stemLarge >= roundNumber,
    litAt: null,
  });

  // 3. Pendant small beads (pos 101, 102, 103)
  const pendantSmall = [101, 102, 103];
  pendantSmall.forEach((pos) => {
    beads.push({
      position: pos,
      type: 'small',
      isLit: stemCounts.stemSmall >= roundNumber,
      litAt: null,
    });
  });

  // 4. Medallion (pos 57)
  beads.push({
    position: 57,
    type: 'medallion',
    isLit: stemCounts.medallion >= roundNumber,
    litAt: null,
  });

  // 5. Loop small beads (1-50): strictly follows current round progress (resets on new round)
  for (let pos = 1; pos <= 50; pos++) {
    beads.push({
      position: pos,
      type: 'small',
      isLit: pos <= beadsInRound,
      litAt: null,
    });
  }

  // 6. Large divider beads on loop (52-55): strictly follows current round loop large progress
  const largeLoopPositions = [52, 53, 54, 55];
  for (let i = 0; i < largeLoopPositions.length; i++) {
    const pos = largeLoopPositions[i];
    beads.push({
      position: pos,
      type: 'large',
      isLit: (i + 1) <= largeInRound,
      litAt: null,
    });
  }

  // Total lit count on the rosary chain
  const stemLitCount = (stemCounts.cross >= roundNumber ? 1 : 0) +
    (stemCounts.stemLarge >= roundNumber ? 1 : 0) +
    (stemCounts.stemSmall >= roundNumber ? 3 : 0) +
    (stemCounts.medallion >= roundNumber ? 1 : 0);
  const totalLit = beadsInRound + largeInRound + stemLitCount;

  // Get user streak
  const streak = await db.get(
    'SELECT current_streak, longest_streak, last_active_date FROM streaks WHERE user_id = ?',
    userId
  ) as { current_streak: number; longest_streak: number; last_active_date: string } | null;

  // Get today's task completions for this user
  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = await db.all(`
    SELECT tc.task_id FROM task_completions tc
    WHERE tc.user_id = ? AND date(tc.completed_at) = ?
  `, userId, today) as { task_id: number }[];

  const completedTodayIds = new Set(todayCompletions.map(c => c.task_id));

  // 5. Today's progress for the CLASS (Daily Goal: 3 Chuỗi Mân Côi)
  const todaySmallRow = teamId
    ? await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ?
          AND (t.bead_type = 'small' OR t.bead_type IS NULL)
          AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
      `, teamId) as { total: number } | null
    : await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN tasks t ON tc.task_id = t.id
        WHERE tc.user_id = ?
          AND (t.bead_type = 'small' OR t.bead_type IS NULL)
          AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
      `, userId) as { total: number } | null;

  const todaySmallBeads = todaySmallRow?.total || 0;
  const todayChuoi = Math.floor(todaySmallBeads / 50);

  // Total beads added by class today
  const todayBeadsRow = teamId
    ? await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ?
          AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
      `, teamId) as { total: number } | null
    : await db.get(`
        SELECT COALESCE(SUM(tc.beads_earned), 0) as total
        FROM task_completions tc
        WHERE tc.user_id = ?
          AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
      `, userId) as { total: number } | null;

  const todayBeads = todayBeadsRow?.total || 0;

  // Points earned by class today
  const todayPointsRow = teamId
    ? await db.get(`
        SELECT COALESCE(SUM(tc.points_earned), 0) as total
        FROM task_completions tc
        JOIN users u ON tc.user_id = u.id
        WHERE u.team_id = ?
          AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
      `, teamId) as { total: number } | null
    : await db.get(`
        SELECT COALESCE(SUM(tc.points_earned), 0) as total
        FROM task_completions tc
        WHERE tc.user_id = ?
          AND date(tc.completed_at, '+7 hours') = date('now', '+7 hours')
      `, userId) as { total: number } | null;

  const todayPoints = todayPointsRow?.total || 0;

  // Personal beads earned today
  const personalTodayRow = await db.get(`
    SELECT COALESCE(SUM(beads_earned), 0) as beads, COALESCE(SUM(points_earned), 0) as points
    FROM task_completions
    WHERE user_id = ? AND date(completed_at, '+7 hours') = date('now', '+7 hours')
  `, userId) as { beads: number; points: number } | null;

  // Get recent notifications (unread)
  const notifications = await db.all(`
    SELECT id, message, notif_type, created_at
    FROM notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC
    LIMIT 10
  `, userId);

  // Get team rank
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
      personalTodayBeads: personalTodayRow?.beads || 0,
      personalTodayPoints: personalTodayRow?.points || 0,
      teamRank,
      role: user.role,
    },
    beads,
    totalBeads: 55,
    litCount: totalLit,
    smallBeads,
    largeBeads: loopLargeBeads,
    totalLargeBeads,
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
