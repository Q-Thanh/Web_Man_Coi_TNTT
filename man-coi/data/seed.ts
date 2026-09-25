import getDb from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
  const db = getDb();
  console.log('🌱 Bắt đầu tạo dữ liệu demo...');

  // ─── TEAMS ───────────────────────────────────────────────────────────────
  const teams = [
    { name: 'Bao đồng 1A', color: '#2563EB', description: 'Chi đoàn Bao đồng 1A' },
    { name: 'Bao đồng 1B', color: '#059669', description: 'Chi đoàn Bao đồng 1B' },
    { name: 'Bao đồng 1C', color: '#D97706', description: 'Chi đoàn Bao đồng 1C' },
    { name: 'Bao đồng 2A', color: '#7C3AED', description: 'Chi đoàn Bao đồng 2A' },
    { name: 'Bao đồng 2B', color: '#DC2626', description: 'Chi đoàn Bao đồng 2B' },
    { name: 'Hiệp Sĩ', color: '#0891B2', description: 'Ngành Hiệp Sĩ' },
  ];

  const insertTeam = db.prepare(`
    INSERT OR IGNORE INTO teams (name, color, description, total_points)
    VALUES (@name, @color, @description, @total_points)
  `);

  for (const team of teams) {
    insertTeam.run({ ...team, total_points: Math.floor(Math.random() * 800) + 200 });
  }
  console.log('✅ Đã tạo 6 đội');

  // ─── GET TEAM IDs ─────────────────────────────────────────────────────────
  const allTeams = db.prepare('SELECT id, name FROM teams').all() as { id: number; name: string }[];
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.name, t.id]));

  // ─── USERS ───────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  const leaderHash = await bcrypt.hash('gly123', 10);
  const childHash = await bcrypt.hash('abc123', 10);

  const users = [
    { username: 'admin', display_name: 'Quản Trị Viên', hash: adminHash, role: 'ADMIN', team: null, points: 0 },
    { username: 'giaoly1', display_name: 'Thầy Minh Đức', hash: leaderHash, role: 'LEADER', team: 'Thánh Gia', points: 150 },
    { username: 'giaoly2', display_name: 'Cô Thanh Hương', hash: leaderHash, role: 'LEADER', team: 'Fatima', points: 130 },
    // Thánh Gia
    { username: 'em_anna', display_name: 'Anna Nguyễn', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 380 },
    { username: 'em_peter', display_name: 'Phêrô Trần', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 290 },
    { username: 'em_maria', display_name: 'Maria Lê', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 210 },
    { username: 'em_joseph', display_name: 'Giuse Phạm', hash: childHash, role: 'CHILD', team: 'Thánh Gia', points: 175 },
    // Fatima
    { username: 'em_minh', display_name: 'Gioan Minh', hash: childHash, role: 'CHILD', team: 'Fatima', points: 320 },
    { username: 'em_linh', display_name: 'Têrêsa Linh', hash: childHash, role: 'CHILD', team: 'Fatima', points: 280 },
    { username: 'em_duc', display_name: 'Phaolô Đức', hash: childHash, role: 'CHILD', team: 'Fatima', points: 195 },
    // Lộ Đức
    { username: 'em_lan', display_name: 'Catarina Lan', hash: childHash, role: 'CHILD', team: 'Lộ Đức', points: 250 },
    { username: 'em_hoa', display_name: 'Vêrônica Hoa', hash: childHash, role: 'CHILD', team: 'Lộ Đức', points: 220 },
    { username: 'em_tung', display_name: 'Tôma Tùng', hash: childHash, role: 'CHILD', team: 'Lộ Đức', points: 180 },
    // Guadalupe
    { username: 'em_thu', display_name: 'Lucia Thu', hash: childHash, role: 'CHILD', team: 'Guadalupe', points: 300 },
    { username: 'em_hung', display_name: 'Đaminh Hùng', hash: childHash, role: 'CHILD', team: 'Guadalupe', points: 240 },
    // Nazareth
    { username: 'em_ngoc', display_name: 'Agnes Ngọc', hash: childHash, role: 'CHILD', team: 'Nazareth', points: 190 },
    { username: 'em_bao', display_name: 'Bênêđictô Bảo', hash: childHash, role: 'CHILD', team: 'Nazareth', points: 160 },
    // Cana
    { username: 'em_trang', display_name: 'Cecilia Trang', hash: childHash, role: 'CHILD', team: 'Cana', points: 210 },
    { username: 'em_khanh', display_name: 'Clêmentê Khánh', hash: childHash, role: 'CHILD', team: 'Cana', points: 175 },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, display_name, password_hash, role, team_id, personal_points)
    VALUES (@username, @display_name, @password_hash, @role, @team_id, @personal_points)
  `);

  for (const u of users) {
    insertUser.run({
      username: u.username,
      display_name: u.display_name,
      password_hash: u.hash,
      role: u.role,
      team_id: u.team ? teamMap[u.team] : null,
      personal_points: u.points,
    });
  }
  console.log('✅ Đã tạo users demo');

  // ─── TASKS ─────────────────────────────────────────────────────────────────
  const tasks = [
    { title: 'Đọc 1 chục kinh Mân Côi', description: 'Đọc một chục kinh với ý cầu nguyện cho gia đình', points: 20, bead_progress: 1, task_type: 'daily', icon: '📿' },
    { title: 'Đọc Tin Mừng hôm nay', description: 'Đọc và suy niệm đoạn Tin Mừng trong ngày', points: 15, bead_progress: 1, task_type: 'daily', icon: '📖' },
    { title: 'Tham dự Thánh lễ', description: 'Tham dự Thánh lễ với tấm lòng thành kính', points: 30, bead_progress: 1, task_type: 'daily', icon: '⛪' },
    { title: 'Làm một việc tốt', description: 'Làm một việc tốt giúp đỡ người thân hoặc bạn bè', points: 10, bead_progress: 1, task_type: 'daily', icon: '❤️' },
    { title: 'Cầu nguyện buổi tối', description: 'Cầu nguyện cùng gia đình buổi tối trước khi ngủ', points: 15, bead_progress: 1, task_type: 'daily', icon: '🌙' },
    { title: 'Đọc toàn bộ 5 chục kinh', description: 'Đọc đủ một tràng Mân Côi 5 chục kinh', points: 50, bead_progress: 3, task_type: 'special', icon: '✨' },
    { title: 'Học giáo lý bài mới', description: 'Học thuộc một bài giáo lý mới trong tuần', points: 25, bead_progress: 1, task_type: 'weekly', icon: '🎓' },
    { title: 'Giúp đỡ cha mẹ', description: 'Làm việc nhà giúp cha mẹ không cần nhắc nhở', points: 10, bead_progress: 1, task_type: 'daily', icon: '🏠' },
    { title: 'Chia sẻ với bạn', description: 'Chia sẻ một điều tốt đẹp với bạn bè trong nhóm', points: 15, bead_progress: 1, task_type: 'community', icon: '🤝' },
    { title: 'Tháng Mân Côi đặc biệt', description: 'Hoàn thành thử thách đặc biệt tháng Mân Côi', points: 100, bead_progress: 5, task_type: 'event', icon: '🌹' },
  ];

  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO tasks (title, description, points, bead_progress, task_type, reset_type, icon)
    VALUES (@title, @description, @points, @bead_progress, @task_type, @reset_type, @icon)
  `);

  for (const task of tasks) {
    insertTask.run({
      ...task,
      reset_type: task.task_type === 'daily' ? 'daily' : task.task_type === 'weekly' ? 'weekly' : 'never',
    });
  }
  console.log('✅ Đã tạo 10 nhiệm vụ');

  // ─── BADGES ────────────────────────────────────────────────────────────────
  const badges = [
    { name: 'Khởi đầu hành trình', description: 'Hoàn thành nhiệm vụ đầu tiên', icon: '🌱', condition_type: 'completions', condition_value: 1 },
    { name: 'Người cầu nguyện chăm chỉ', description: 'Đạt 10 hạt Mân Côi', icon: '🙏', condition_type: 'beads', condition_value: 10 },
    { name: 'Lửa 3 ngày', description: '3 ngày liên tiếp hoàn thành nhiệm vụ', icon: '🔥', condition_type: 'streak', condition_value: 3 },
    { name: 'Người bạn Mân Côi', description: 'Đạt 25 hạt Mân Côi', icon: '📿', condition_type: 'beads', condition_value: 25 },
    { name: 'Kiên trì 7 ngày', description: '7 ngày liên tiếp hoàn thành nhiệm vụ', icon: '⚡', condition_type: 'streak', condition_value: 7 },
    { name: 'Người bền bỉ', description: 'Đạt 40 hạt Mân Côi', icon: '⭐', condition_type: 'beads', condition_value: 40 },
    { name: 'Chiến binh 14 ngày', description: '14 ngày liên tiếp hoàn thành nhiệm vụ', icon: '🛡️', condition_type: 'streak', condition_value: 14 },
    { name: 'Hoàn thành chuỗi', description: 'Thắp sáng đủ 55 hạt Mân Côi', icon: '👑', condition_type: 'beads', condition_value: 55 },
  ];

  const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO badges (name, description, icon, condition_type, condition_value, badge_order)
    VALUES (@name, @description, @icon, @condition_type, @condition_value, @badge_order)
  `);

  badges.forEach((badge, i) => insertBadge.run({ ...badge, badge_order: i }));
  console.log('✅ Đã tạo 8 huy hiệu');

  // ─── REWARDS ────────────────────────────────────────────────────────────────
  const rewards = [
    { name: 'Huy hiệu Khởi đầu', description: 'Phần thưởng khi đạt 10 hạt đầu tiên', reward_type: 'virtual', condition_beads: 10, reward_value: 'badge_start' },
    { name: 'Khung avatar Xanh Dương', description: 'Khung viền xanh dương cho avatar', reward_type: 'frame', condition_beads: 20, reward_value: 'frame_blue' },
    { name: 'Danh hiệu "Người Mân Côi"', description: 'Danh hiệu đặc biệt hiển thị dưới tên', reward_type: 'title', condition_beads: 30, reward_value: 'title_rosary' },
    { name: 'Khung avatar Vàng Kim', description: 'Khung viền vàng kim đặc biệt cho avatar', reward_type: 'frame', condition_beads: 40, reward_value: 'frame_gold' },
    { name: 'Phần thưởng Hoàn thành', description: 'Phần thưởng đặc biệt khi hoàn thành 50 hạt nhỏ', reward_type: 'virtual', condition_beads: 50, reward_value: 'reward_complete_50' },
    { name: '🏆 Hoàn thành Toàn Chuỗi', description: 'Phần thưởng cao quý nhất – hoàn thành đủ 55 hạt', reward_type: 'physical', condition_beads: 55, reward_value: 'reward_complete_all' },
  ];

  const insertReward = db.prepare(`
    INSERT OR IGNORE INTO rewards (name, description, reward_type, condition_beads, reward_value)
    VALUES (@name, @description, @reward_type, @condition_beads, @reward_value)
  `);

  for (const reward of rewards) {
    insertReward.run(reward);
  }
  console.log('✅ Đã tạo 6 phần thưởng');

  // ─── MILESTONES ─────────────────────────────────────────────────────────────
  const milestones = [
    { bead_position: 51, title: 'Khởi đầu', description: 'Bạn đã hoàn thành 50 hạt nhỏ – một kỳ tích!', icon: '🌱' },
    { bead_position: 52, title: 'Bền bỉ', description: 'Sự bền bỉ là chìa khóa của mọi thành công', icon: '💪' },
    { bead_position: 53, title: 'Chăm chỉ', description: 'Mỗi ngày một bước nhỏ, tạo nên con đường lớn', icon: '⭐' },
    { bead_position: 54, title: 'Quyết tâm', description: 'Quyết tâm là sức mạnh vượt qua mọi thử thách', icon: '🔥' },
    { bead_position: 55, title: 'Hoàn thành', description: 'Chúc mừng! Bạn đã hoàn thành toàn bộ chuỗi Mân Côi!', icon: '👑' },
  ];

  const insertMilestone = db.prepare(`
    INSERT OR IGNORE INTO milestone_checkpoints (bead_position, title, description, icon)
    VALUES (@bead_position, @title, @description, @icon)
  `);

  for (const m of milestones) insertMilestone.run(m);

  // ─── COMMUNITY PROGRESS ─────────────────────────────────────────────────────
  const existingCommunity = db.prepare('SELECT id FROM community_progress').get();
  if (!existingCommunity) {
    db.prepare('INSERT INTO community_progress (total_beads) VALUES (?)').run(0);
  }

  // ─── DEMO ROSARY PROGRESS ───────────────────────────────────────────────────
  // Give some users demo bead progress
  const allUsers = db.prepare('SELECT id, personal_points FROM users WHERE role = ?').all('CHILD') as { id: number; personal_points: number }[];
  
  const insertBead = db.prepare(`
    INSERT OR IGNORE INTO rosary_beads (user_id, bead_position, bead_type, lit_at)
    VALUES (@user_id, @bead_position, @bead_type, @lit_at)
  `);

  const insertStreak = db.prepare(`
    INSERT OR IGNORE INTO streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (@user_id, @current_streak, @longest_streak, @last_active_date)
  `);

  const now = new Date().toISOString();
  
  for (const user of allUsers) {
    // Give beads based on points (roughly)
    const beadCount = Math.min(Math.floor(user.personal_points / 10), 55);
    for (let i = 1; i <= beadCount; i++) {
      const beadType = i > 50 ? 'large' : 'small';
      const litDate = new Date(Date.now() - (beadCount - i) * 86400000).toISOString();
      insertBead.run({ user_id: user.id, bead_position: i, bead_type: beadType, lit_at: litDate });
    }

    // Give streaks
    const streak = Math.floor(Math.random() * 12) + 1;
    insertStreak.run({
      user_id: user.id,
      current_streak: streak,
      longest_streak: streak + Math.floor(Math.random() * 5),
      last_active_date: new Date().toISOString().split('T')[0],
    });
  }

  // Update community total
  const totalBeads = db.prepare('SELECT COUNT(*) as count FROM rosary_beads').get() as { count: number };
  db.prepare('UPDATE community_progress SET total_beads = ?').run(totalBeads.count);

  console.log('✅ Đã tạo tiến độ Mân Côi demo');
  console.log('');
  console.log('🎉 Seed hoàn thành!');
  console.log('');
  console.log('📋 Tài khoản demo:');
  console.log('  admin / admin123       → Quản trị viên');
  console.log('  giaoly1 / gly123       → Giáo lý viên (Thánh Gia)');
  console.log('  em_anna / abc123       → Thiếu nhi (Thánh Gia)');
  console.log('  em_minh / abc123       → Thiếu nhi (Fatima)');
  console.log('  em_lan / abc123        → Thiếu nhi (Lộ Đức)');
}

seed().catch(console.error);
