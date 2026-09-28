const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/TURSO_DATABASE_URL=(.*)/)?.[1]?.trim();
const token = env.match(/TURSO_AUTH_TOKEN=(.*)/)?.[1]?.trim();
const { createClient } = require('@libsql/client');
const c = createClient({ url, authToken: token });

async function run() {
  try {
    const q1 = await c.execute(`
      SELECT u.id, u.username, u.display_name, u.role, u.team_id, u.personal_points,
             t.name as team_name, t.color as team_color,
             (SELECT COUNT(*) FROM rosary_beads WHERE user_id = u.id) as bead_count,
             (SELECT current_streak FROM streaks WHERE user_id = u.id) as streak
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      ORDER BY u.role, t.id, u.display_name ASC
    `);
    console.log('q1 count:', q1.rows.length);

    const q2 = await c.execute('SELECT id, name, color FROM teams ORDER BY id ASC');
    console.log('q2 count:', q2.rows.length);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
