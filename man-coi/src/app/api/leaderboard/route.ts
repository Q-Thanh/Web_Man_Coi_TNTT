import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();

  // Get all teams sorted by bead count (total_points repurposed as bead count)
  const teams = db.prepare(`
    SELECT t.*,
           COUNT(u.id) as member_count,
           COALESCE(SUM(CASE WHEN date(tc.completed_at) = date('now') THEN tc.beads_earned ELSE 0 END), 0) as today_beads
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id
    LEFT JOIN task_completions tc ON tc.user_id = u.id
    GROUP BY t.id
    ORDER BY t.total_points DESC
  `).all() as any[];

  // Get team streak info (avg of members)
  const teamStreaks = db.prepare(`
    SELECT u.team_id, AVG(s.current_streak) as avg_streak, MAX(s.current_streak) as max_streak
    FROM streaks s
    JOIN users u ON s.user_id = u.id
    GROUP BY u.team_id
  `).all() as any[];

  const streakMap = Object.fromEntries(
    teamStreaks.map(ts => [ts.team_id, { avg: ts.avg_streak, max: ts.max_streak }])
  );

  // Community progress
  const community = db.prepare('SELECT * FROM community_progress LIMIT 1').get() as any;

  const teamsWithRank = teams.map((team, index) => {
    const teamMembers = db.prepare(`
      SELECT u.id, u.display_name, u.team_id, u.avatar_url,
             u.personal_points,
             u.personal_points as total_beads,
             (SELECT COUNT(*) FROM rosary_beads WHERE user_id = u.id AND bead_type = 'small') as small_beads,
             (SELECT COUNT(*) FROM rosary_beads WHERE user_id = u.id AND bead_type = 'large') as large_beads
      FROM users u
      WHERE u.team_id = ? AND u.role = 'CHILD'
      ORDER BY u.personal_points DESC, u.display_name ASC
      LIMIT 10
    `).all(team.id) as any[];

    return {
      ...team,
      rank: index + 1,
      topMembers: teamMembers,
      streakInfo: streakMap[team.id] || { avg: 0, max: 0 },
    };
  });

  return NextResponse.json({
    teams: teamsWithRank,
    community: community || { total_beads: 0 },
    communityGoal: 5000,
  });
}
