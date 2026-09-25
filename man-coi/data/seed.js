// Standalone seed script - runs without module alias
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'mancoi.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create schema
db.exec(`
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
    task_type TEXT NOT NULL DEFAULT 'daily',
    reset_type TEXT DEFAULT 'daily',
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
    bead_type TEXT NOT NULL DEFAULT 'small',
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
    reward_type TEXT DEFAULT 'virtual',
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
    notif_type TEXT DEFAULT 'info',
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
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log('🌱 Bắt đầu tạo dữ liệu demo...');

async function seed() {
  // Teams
  const teams = [
    { name: 'Bao đồng 1A', color: '#2563EB', description: 'Chi đoàn Bao đồng 1A', total_points: 0 },
    { name: 'Bao đồng 1B', color: '#059669', description: 'Chi đoàn Bao đồng 1B', total_points: 0 },
    { name: 'Bao đồng 1C', color: '#D97706', description: 'Chi đoàn Bao đồng 1C', total_points: 0 },
    { name: 'Bao đồng 2A', color: '#7C3AED', description: 'Chi đoàn Bao đồng 2A', total_points: 0 },
    { name: 'Bao đồng 2B', color: '#DC2626', description: 'Chi đoàn Bao đồng 2B', total_points: 0 },
    { name: 'Hiệp Sĩ', color: '#0891B2', description: 'Ngành Hiệp Sĩ', total_points: 0 },
  ];

  const insertTeam = db.prepare('INSERT OR IGNORE INTO teams (name, color, description, total_points) VALUES (@name, @color, @description, @total_points)');
  for (const team of teams) insertTeam.run(team);
  console.log('✅ Đã tạo 6 đội');

  const allTeams = db.prepare('SELECT id, name FROM teams').all();
  const teamMap = {};
  allTeams.forEach(t => teamMap[t.name] = t.id);

  // Users
  const adminHash = bcrypt.hashSync('admin123', 10);
  const leaderHash = bcrypt.hashSync('gly123', 10);
  const childHash = bcrypt.hashSync('abc123', 10);

  const users = [
    { username: 'admin', display_name: 'Quản Trị Viên', hash: adminHash, role: 'ADMIN', team: null, points: 0 },
    { username: 'giaoly1', display_name: 'Thầy Minh Đức', hash: leaderHash, role: 'LEADER', team: 'Thánh Gia', points: 150 },
    { username: 'giaoly2', display_name: 'Cô Thanh Hương', hash: leaderHash, role: 'LEADER', team: 'Fatima', points: 130 },
    { username: 'em_anna', display_name: 'Anna Nguyễn', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 380 },
    { username: 'em_peter', display_name: 'Phêrô Trần', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 290 },
    { username: 'em_maria', display_name: 'Maria Lê', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 210 },
    { username: 'em_joseph', display_name: 'Giuse Phạm', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 175 },
    { username: 'em_minh', display_name: 'Gioan Minh', hash: childHash, role: 'CHILD', team: 'Fatima', points: 320 },
    { username: 'em_linh', display_name: 'Têrêsa Linh', hash: childHash, role: 'CHILD', team: 'Fatima', points: 280 },
    { username: 'em_duc', display_name: 'Phaolô Đức', hash: childHash, role: 'CHILD', team: 'Fatima', points: 195 },
    { username: 'em_lan', display_name: 'Catarina Lan', hash: childHash, role: 'CHILD', team: 'Lộ Đức', points: 250 },
    { username: 'em_hoa', display_name: 'Vêrônica Hoa', hash: childHash, role: 'CHILD', team: 'Lộ Đức', points: 220 },
    { username: 'em_tung', display_name: 'Tôma Tùng', hash: childHash, role: 'CHILD', team: 'Lộ Đức', points: 180 },
    { username: 'em_thu', display_name: 'Lucia Thu', hash: childHash, role: 'CHILD', team: 'Guadalupe', points: 300 },
    { username: 'em_hung', display_name: 'Đaminh Hùng', hash: childHash, role: 'CHILD', team: 'Guadalupe', points: 240 },
    { username: 'em_ngoc', display_name: 'Agnes Ngọc', hash: childHash, role: 'CHILD', team: 'Nazareth', points: 190 },
    { username: 'em_bao', display_name: 'Bênêđictô Bảo', hash: childHash, role: 'CHILD', team: 'Nazareth', points: 160 },
    { username: 'em_trang', display_name: 'Cecilia Trang', hash: childHash, role: 'CHILD', team: 'Cana', points: 210 },
    { username: 'em_khanh', display_name: 'Clêmentê Khánh', hash: childHash, role: 'CHILD', team: 'Cana', points: 175 },
  ];

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, display_name, password_hash, role, team_id, personal_points) VALUES (@username, @display_name, @password_hash, @role, @team_id, @personal_points)');
  for (const u of users) {
    insertUser.run({ username: u.username, display_name: u.display_name, password_hash: u.hash, role: u.role, team_id: u.team ? teamMap[u.team] : null, personal_points: u.points });
  }
  console.log('✅ Đã tạo 19 users');

  // Tasks – Chỉ gồm Kinh Kính Mừng và Kinh Lạy Cha theo các mốc số lần
  // Xóa tasks cũ trước khi nạp lại (đúng thứ tự foreign key)
  db.pragma('foreign_keys = OFF');
  db.prepare('DELETE FROM task_completions').run();
  db.prepare('DELETE FROM tasks').run();
  db.pragma('foreign_keys = ON');

  const tasks = [
    // ── KINH KÍNH MỪNG → hạt nhỏ (small) ────────────────────────────
    // bead_progress = số kinh = số hạt nhỏ được thắp sáng
    { title: '1 Kinh Kính Mừng',  description: 'Đọc 1 lần Kinh Kính Mừng', bead_progress: 1,  bead_type: 'small', task_type: 'daily',   icon: '🌹' },
    { title: '5 Kinh Kính Mừng',  description: 'Đọc 5 lần Kinh Kính Mừng liên tiếp', bead_progress: 5,  bead_type: 'small', task_type: 'daily',   icon: '🌹' },
    { title: '10 Kinh Kính Mừng', description: 'Đọc 10 lần Kinh Kính Mừng – một chục kinh đầy đủ', bead_progress: 10, bead_type: 'small', task_type: 'daily',   icon: '🌹' },
    { title: '15 Kinh Kính Mừng', description: 'Đọc 15 lần Kinh Kính Mừng', bead_progress: 15, bead_type: 'small', task_type: 'special', icon: '🌹' },
    { title: '20 Kinh Kính Mừng', description: 'Đọc 20 lần Kinh Kính Mừng – hai chục kinh', bead_progress: 20, bead_type: 'small', task_type: 'special', icon: '🌹' },
    { title: '30 Kinh Kính Mừng', description: 'Đọc 30 lần Kinh Kính Mừng – ba chục kinh', bead_progress: 30, bead_type: 'small', task_type: 'special', icon: '🌹' },
    { title: '50 Kinh Kính Mừng', description: 'Đọc trọn 50 lần Kinh Kính Mừng – toàn bộ 5 chục kinh!', bead_progress: 50, bead_type: 'small', task_type: 'special', icon: '✨' },

    // ── KINH LẠY CHA → hạt to (large) ───────────────────────────────
    // bead_progress = số kinh = số hạt to được thắp sáng
    { title: '1 Kinh Lạy Cha',  description: 'Đọc 1 lần Kinh Lạy Cha với tâm hồn khiêm tốn', bead_progress: 1,  bead_type: 'large', task_type: 'daily',   icon: '🙏' },
    { title: '5 Kinh Lạy Cha',  description: 'Đọc 5 lần Kinh Lạy Cha', bead_progress: 5,  bead_type: 'large', task_type: 'daily',   icon: '🙏' },
    { title: '10 Kinh Lạy Cha', description: 'Đọc 10 lần Kinh Lạy Cha', bead_progress: 10, bead_type: 'large', task_type: 'special', icon: '🙏' },
    { title: '15 Kinh Lạy Cha', description: 'Đọc 15 lần Kinh Lạy Cha', bead_progress: 15, bead_type: 'large', task_type: 'special', icon: '🙏' },
    { title: '20 Kinh Lạy Cha', description: 'Đọc 20 lần Kinh Lạy Cha – dâng lên Thiên Chúa', bead_progress: 20, bead_type: 'large', task_type: 'special', icon: '🙏' },
  ];

  // Thêm cột bead_type nếu chưa có (migrate schema)
  try { db.exec("ALTER TABLE tasks ADD COLUMN bead_type TEXT DEFAULT 'small'"); } catch {}

  const insertTask = db.prepare('INSERT INTO tasks (title, description, points, bead_progress, bead_type, task_type, reset_type, icon) VALUES (@title, @description, @points, @bead_progress, @bead_type, @task_type, @reset_type, @icon)');
  for (const task of tasks) {
    insertTask.run({ ...task, points: 0, reset_type: task.task_type === 'daily' ? 'daily' : 'never' });
  }
  console.log(`✅ Đã tạo ${tasks.length} nhiệm vụ (Kinh Kính Mừng & Kinh Lạy Cha)`);


  // Badges
  const badges = [
    { name: 'Khởi đầu hành trình', description: 'Hoàn thành nhiệm vụ đầu tiên', icon: '🌱', condition_type: 'completions', condition_value: 1, badge_order: 0 },
    { name: 'Người cầu nguyện chăm chỉ', description: 'Đạt 10 hạt Mân Côi', icon: '🙏', condition_type: 'beads', condition_value: 10, badge_order: 1 },
    { name: 'Lửa 3 ngày', description: '3 ngày liên tiếp hoàn thành nhiệm vụ', icon: '🔥', condition_type: 'streak', condition_value: 3, badge_order: 2 },
    { name: 'Người bạn Mân Côi', description: 'Đạt 25 hạt Mân Côi', icon: '📿', condition_type: 'beads', condition_value: 25, badge_order: 3 },
    { name: 'Kiên trì 7 ngày', description: '7 ngày liên tiếp hoàn thành nhiệm vụ', icon: '⚡', condition_type: 'streak', condition_value: 7, badge_order: 4 },
    { name: 'Người bền bỉ', description: 'Đạt 40 hạt Mân Côi', icon: '⭐', condition_type: 'beads', condition_value: 40, badge_order: 5 },
    { name: 'Chiến binh 14 ngày', description: '14 ngày liên tiếp hoàn thành nhiệm vụ', icon: '🛡️', condition_type: 'streak', condition_value: 14, badge_order: 6 },
    { name: 'Hoàn thành chuỗi', description: 'Thắp sáng đủ 55 hạt Mân Côi', icon: '👑', condition_type: 'beads', condition_value: 55, badge_order: 7 },
  ];

  const insertBadge = db.prepare('INSERT OR IGNORE INTO badges (name, description, icon, condition_type, condition_value, badge_order) VALUES (@name, @description, @icon, @condition_type, @condition_value, @badge_order)');
  for (const badge of badges) insertBadge.run(badge);
  console.log('✅ Đã tạo 8 huy hiệu');

  // Rewards
  const rewards = [
    { name: 'Huy hiệu Khởi đầu', description: 'Phần thưởng khi đạt 10 hạt đầu tiên', reward_type: 'virtual', condition_beads: 10, reward_value: 'badge_start' },
    { name: 'Khung avatar Xanh Dương', description: 'Khung viền xanh dương cho avatar', reward_type: 'frame', condition_beads: 20, reward_value: 'frame_blue' },
    { name: 'Danh hiệu "Người Mân Côi"', description: 'Danh hiệu đặc biệt hiển thị dưới tên', reward_type: 'title', condition_beads: 30, reward_value: 'title_rosary' },
    { name: 'Khung avatar Vàng Kim', description: 'Khung viền vàng kim đặc biệt cho avatar', reward_type: 'frame', condition_beads: 40, reward_value: 'frame_gold' },
    { name: 'Phần thưởng Hoàn thành 50', description: 'Phần thưởng đặc biệt khi hoàn thành 50 hạt nhỏ', reward_type: 'virtual', condition_beads: 50, reward_value: 'reward_complete_50' },
    { name: '🏆 Hoàn thành Toàn Chuỗi', description: 'Phần thưởng cao quý nhất – hoàn thành đủ 55 hạt', reward_type: 'physical', condition_beads: 55, reward_value: 'reward_complete_all' },
  ];

  const insertReward = db.prepare('INSERT OR IGNORE INTO rewards (name, description, reward_type, condition_beads, reward_value) VALUES (@name, @description, @reward_type, @condition_beads, @reward_value)');
  for (const reward of rewards) insertReward.run(reward);
  console.log('✅ Đã tạo 6 phần thưởng');

  // Milestones
  const milestones = [
    { bead_position: 51, title: 'Khởi đầu', description: 'Bạn đã hoàn thành 50 hạt nhỏ!', icon: '🌱' },
    { bead_position: 52, title: 'Bền bỉ', description: 'Sự bền bỉ là chìa khóa thành công', icon: '💪' },
    { bead_position: 53, title: 'Chăm chỉ', description: 'Mỗi ngày một bước nhỏ', icon: '⭐' },
    { bead_position: 54, title: 'Quyết tâm', description: 'Quyết tâm vượt mọi thử thách', icon: '🔥' },
    { bead_position: 55, title: 'Hoàn thành', description: 'Đã hoàn thành toàn bộ chuỗi Mân Côi!', icon: '👑' },
  ];

  const insertMilestone = db.prepare('INSERT OR IGNORE INTO milestone_checkpoints (bead_position, title, description, icon) VALUES (@bead_position, @title, @description, @icon)');
  for (const m of milestones) insertMilestone.run(m);

  // Community
  const existingCommunity = db.prepare('SELECT id FROM community_progress').get();
  if (!existingCommunity) db.prepare('INSERT INTO community_progress (total_beads) VALUES (0)').run();

  // Demo rosary progress for child users
  const childUsers = db.prepare('SELECT id, personal_points FROM users WHERE role = ?').all('CHILD');
  const insertBead = db.prepare('INSERT OR IGNORE INTO rosary_beads (user_id, bead_position, bead_type) VALUES (?, ?, ?)');
  const insertStreak = db.prepare('INSERT OR IGNORE INTO streaks (user_id, current_streak, longest_streak, last_active_date) VALUES (?, ?, ?, ?)');

  const today = new Date().toISOString().split('T')[0];
  let totalBeadCount = 0;

  for (const user of childUsers) {
    const beadCount = Math.min(Math.floor(user.personal_points / 10), 50);
    for (let i = 1; i <= beadCount; i++) {
      insertBead.run(user.id, i, 'small');
      totalBeadCount++;
    }
    const streak = Math.floor(Math.random() * 10) + 1;
    insertStreak.run(user.id, streak, streak + Math.floor(Math.random() * 5), today);
  }

  // Special: give em_anna more beads (27 beads, to show good demo)
  const annaUser = db.prepare("SELECT id FROM users WHERE username = 'em_anna'").get();
  if (annaUser) {
    // em_anna already has beads from loop above, but let's ensure she has 27
    for (let i = 1; i <= 27; i++) {
      try { insertBead.run(annaUser.id, i, 'small'); totalBeadCount++; } catch {}
    }
  }

  db.prepare('UPDATE community_progress SET total_beads = ?').run(totalBeadCount);

  console.log('✅ Đã tạo tiến độ Mân Côi demo');
  console.log('');
  console.log('🎉 Seed hoàn thành!');
  console.log('');
  console.log('📋 Tài khoản demo:');
  console.log('  admin / admin123      → Quản trị viên');
  console.log('  giaoly1 / gly123      → Giáo lý viên (Thánh Gia)');
  console.log('  em_anna / abc123      → Thiếu nhi (Thánh Gia) – 27 hạt');
  console.log('  em_minh / abc123      → Thiếu nhi (Fatima)');
  console.log('  em_lan / abc123       → Thiếu nhi (Lộ Đức)');
}

seed().catch(console.error);
