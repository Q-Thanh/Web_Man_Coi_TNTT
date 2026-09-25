import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'mancoi.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      color TEXT DEFAULT '#2563EB',
      description TEXT,
      total_points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL DEFAULT 10,
      bead_progress INTEGER DEFAULT 1,
      task_type TEXT NOT NULL DEFAULT 'daily' CHECK(task_type IN ('daily','special','event','community')),
      reset_type TEXT DEFAULT 'daily' CHECK(reset_type IN ('daily','weekly','never','event')),
      icon TEXT DEFAULT '📿',
      is_active INTEGER DEFAULT 1,
      event_start TEXT,
      event_end TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      completed_at TEXT DEFAULT (datetime('now')),
      points_earned INTEGER NOT NULL,
      beads_earned INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS rosary_beads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      bead_position INTEGER NOT NULL,
      bead_type TEXT NOT NULL DEFAULT 'small' CHECK(bead_type IN ('small','large')),
      lit_at TEXT DEFAULT (datetime('now')),
      task_completion_id INTEGER REFERENCES task_completions(id),
      UNIQUE(user_id, bead_position)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_active_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      badge_id INTEGER NOT NULL REFERENCES badges(id),
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      reward_type TEXT DEFAULT 'virtual' CHECK(reward_type IN ('virtual','physical','avatar','frame','title','effect')),
      condition_beads INTEGER,
      condition_points INTEGER,
      reward_value TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      reward_id INTEGER NOT NULL REFERENCES rewards(id),
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, reward_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      notif_type TEXT DEFAULT 'info' CHECK(notif_type IN ('info','success','badge','reward','milestone','team')),
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS milestone_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bead_position INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '⭐',
      reward_id INTEGER REFERENCES rewards(id)
    );

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
}

export default getDb;
