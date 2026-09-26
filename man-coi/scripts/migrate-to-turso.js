const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const localDb = new Database(path.join(__dirname, '..', 'data', 'mancoi.db'));

const turso = createClient({
  url: 'libsql://webmancoitntt-q-thanh.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAzODYzMTQsImlkIjoiMDFhMGRiNTUtYzMwMS03MTU1LWI1MjMtMWNhMDhjMWY0ZDZlIiwia2lkIjoiaFR6TldtendOakMwZDVQSzB4bmJLOV9wTF9EWnNwS1VaUUo0XzdMNjBYOCIsInJpZCI6ImUzZGZhNjU0LTc1MjYtNDI2ZC1iZWM3LTYzNDBjNTUxZWIwYSJ9.eP10Fa1hPDZmFjczVLoWEai88eu8S0c8QIuAYrNEGDNMsuGrhmwjC7D_dm-OnWdoX0ztx4Ewj97mxc6eCYNjCQ'
});

async function migrate() {
  console.log('🚀 Bắt đầu tạo bảng trên Turso Cloud...');

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      color TEXT DEFAULT '#2563EB',
      description TEXT,
      total_points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      avatar_frame TEXT DEFAULT 'default',
      title TEXT,
      team_id INTEGER REFERENCES teams(id),
      role TEXT NOT NULL DEFAULT 'CHILD' CHECK(role IN ('CHILD','LEADER','ADMIN')),
      personal_points INTEGER DEFAULT 0,
      today_points INTEGER DEFAULT 0,
      last_point_reset TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL DEFAULT 10,
      bead_progress INTEGER DEFAULT 1,
      task_type TEXT NOT NULL DEFAULT 'daily',
      reset_type TEXT DEFAULT 'daily',
      icon TEXT DEFAULT '📿',
      is_active INTEGER DEFAULT 1,
      event_start TEXT,
      event_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      bead_type TEXT DEFAULT 'small'
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      completed_at TEXT DEFAULT (datetime('now')),
      points_earned INTEGER NOT NULL,
      beads_earned INTEGER DEFAULT 1
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS rosary_beads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      bead_position INTEGER NOT NULL,
      bead_type TEXT NOT NULL DEFAULT 'small',
      lit_at TEXT DEFAULT (datetime('now')),
      task_completion_id INTEGER REFERENCES task_completions(id),
      UNIQUE(user_id, bead_position)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_active_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '🏅',
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL,
      badge_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      badge_id INTEGER NOT NULL REFERENCES badges(id),
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      reward_type TEXT DEFAULT 'virtual',
      condition_beads INTEGER,
      condition_points INTEGER,
      reward_value TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      reward_id INTEGER NOT NULL REFERENCES rewards(id),
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, reward_id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      notif_type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS milestone_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bead_position INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '⭐',
      reward_id INTEGER REFERENCES rewards(id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS community_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_beads INTEGER DEFAULT 0,
      milestone_1 INTEGER DEFAULT 0,
      milestone_2 INTEGER DEFAULT 0,
      milestone_3 INTEGER DEFAULT 0,
      milestone_4 INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Đã khởi tạo schema trên Turso!');

  // Migrate table by table
  const tables = [
    'teams',
    'users',
    'tasks',
    'badges',
    'rewards',
    'milestone_checkpoints',
    'community_progress',
    'streaks'
  ];

  for (const table of tables) {
    const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) continue;

    console.log(`📦 Đang đẩy bảng ${table} (${rows.length} dòng)...`);
    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const query = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;

    // Batch insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const statements = chunk.map(row => ({
        sql: query,
        args: cols.map(c => row[c])
      }));
      await turso.batch(statements);
    }
    console.log(`  -> Xong ${table}!`);
  }

  // Verify
  const userCount = await turso.execute('SELECT COUNT(*) as count FROM users');
  const teamCount = await turso.execute('SELECT COUNT(*) as count FROM teams');
  console.log('🎉 ĐỒNG BỘ HOÀN TẤT THÀNH CÔNG!');
  console.log(`Tổng số đội trên Turso: ${userCount.rows[0].count} users, ${teamCount.rows[0].count} teams`);
}

migrate().catch(err => {
  console.error('❌ Lỗi migrate:', err);
  process.exit(1);
});
