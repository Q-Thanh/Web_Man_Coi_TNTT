const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'mancoi.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const rawData = {
  'Bao đồng 1A': 'GioaKim Nguyễn Hoàng An, Maria Phạm Ngọc Khánh An, Maria Triệu Quỳnh Anh, Têrêsa Vũ Phương Anh, Giuse Vũ Trí Công, Maria Trần Thị Bảo Châu, Maria Vũ Thị Ngọc Châu, Têrêsa Nguyễn Hương Phương Dung, Antôn Nguyễn Huỳnh Tâm Đức, Maria Võ Trần Vân Hà, Maria Bùi Diễm Hằng, Gioan Baotixita Phạm Tấn Hoài, Phêrô Lê Tấn Huy, Giuse Đoàn Trung Kiên, Maria Đỗ Vũ Thiên Kim, Giacôbê Trần Hoàng Gia Khánh, Simon Nguyễn Anh Khoa, Phêrô Hồ Bảo Khôi, Giuse Nguyễn Hải Long, Maria Đào Tuệ Minh, Inê Dương Nguyễn Bảo Ngọc, Tadêô Trần Phi Nguyễn, Maria Nguyễn Ngọc Yến Nhi, Maria Nguyễn Phương Như, Maria Nguyễn Thị Hồng Phúc, Giuse Phạm Ngọc Trần Quân, Anna Nguyễn Tú Quỳnh, Maria Phạm Nguyễn Nhật Thanh, Gioan Baotixita Trần Quốc Thiên, Anna Nguyễn Thị Thanh Thủy, Maria Trần Ngọc Trâm, Emmanuel Nguyễn Huỳnh Đức Trí, Maria Đoàn Ngọc Đoan Trinh, Tôma Đặng Quang Vinh, Giuse Đoàn Nguyễn Thế Vương.',
  'Bao đồng 1B': 'Đaminh Savio Nguyễn Quốc Thái An, Phêrô Nguyễn Hải Anh, Gioan Baotixita Trần Tuấn Anh, Phêrô Vũ Hữu Hoàng Anh, Tôma Vũ Gia Bảo, Phêrô Trần Bá Quốc Cường, Cecilia Lê Hoàng Bảo Châu, Maria Trần Quỳnh Chi, Giuse Trần Trung Dũng, Giuse Nguyễn Minh Đức, Maria Trịnh Huỳnh Tố Hoa, Têrêsa Nguyễn Thị Thu Hoài, Emmanuel Nguyễn Huy Hoàng, Giuse Vũ Hoàng Quốc Huy, Antôn Nguyễn Tuấn Hưng, Đaminh Phạm Bảo Khang, Giuse Vũ Phạm Nam Khánh, Giuse Trần Võ Anh Khoa, Maria Nguyễn Thùy Lâm, Maria Nguyễn Trúc Lâm, Têrêsa Trịnh Phương Linh, Cosimo Hoàng Ngọc Long, GioaKim Hồ Hoàng Long, Têrêsa Nguyễn Phan Hoàng My, Maria Hồ Nguyễn Bảo Ngân, Maria Danh Nguyễn Phương Nghi, Têrêsa Phạm Kiều Như Ngọc, Maria Hồ Thảo Nhi, Đôminicô Nguyễn Thanh Phong, Têrêsa Huỳnh Thị Hồng Phúc, Gioan Nguyễn Hoàng Phúc, Giuse Hoàng Minh Quân, Martinô Lê Hồ Thi, Maria Nguyễn Trương Minh Thư, Maria Huỳnh Thị Bảo Trâm, Maria Nguyễn Thủy Trúc, Anê Lê Hoài Bảo Vy.',
  'Bao đồng 1C': 'Maria Nguyễn Hà Gia An, Têrêsa Nguyễn Nhất Hồng Ân, Têrêsa Nguyễn Nhất Thy Ân, Martinô Võ Hoàng Bảo, Maria Nguyễn Ngọc Bảo Châu, Maria Võ Tùng Chi, Antôn Nguyễn Tấn Đạt, Têrêsa Nguyễn Ngọc Hạ Giang, Maria Đinh Cao Ngọc Hân, Têrêsa Nguyễn Gia Hân, Martinô Lê Hào Hiệp, Phêrô Trần Minh Hoàng, Giuse Đào Đỗ Nhật Huy, Antôn Đỗ Duy Kiên, Maria Têrêsa Đoàn Thanh Nhật Khánh, Phaolô Lê Minh Khoa, Giuse Tiêu Nguyễn Khải Luân, Giuse Nguyễn Đức Minh, Maria Nguyễn Trà My, Đaminh Nguyễn Hoàng Tuấn Nam, Maria Huỳnh Ngọc Đông Nghi, Gioan Nguyễn Khải Nguyên, Têrêsa Nguyễn Ngọc Băng Nhi, Têrêsa Phạm Ngọc Uyên Như, Giuse Nguyễn Hải Phong, Phêrô Bùi Nguyễn Hoàng Phúc, Anna Lê Nguyễn Ngọc Phúc, Maria Nguyễn Ngọc Hoài Phương, Maria Fastina Trần Nguyễn Hiểu Quân, Phêrô Trần Hoàng Minh Tiến, Giuse Nguyễn Thanh Tú, Giuse Tiêu Nguyễn Khải Tuấn, Giuse Nguyễn Đức Thịnh, Têrêsa Đỗ Phương Trang, Phêrô Nguyễn Lê Trí, Giuse Dương Minh Triết, Maria Nguyễn Ngọc Minh Trúc, Maria Nguyễn Hoàng Cát Vân, Giuse Hồ Quang Vinh, Giuse Vũ Hoàng Vũ.',
  'Bao đồng 2A': 'Maria Nguyễn Trần Hồng Ân, Anphongsô Lê Hoàng Quốc Bảo, Đôminicô Ngô Bảo Châu, Maria Trương Minh Diệp, Giuse Phan Tín Dũng, Giuse Lê Quang Duy, Maria Thái Thùy Duyên, Catarina Tạ Khánh Đan, Phêrô Nguyễn Hoàng Minh Đạt, Anê Nguyễn Hà Gia Hân, Vincente Đỗ Ngọc Hình, Phê rô Nguyễn Đỗ Gia Huy, Phanxicô Nguyễn Tuấn Kiệt, Giuse Vũ Minh Kiệt, Maria Lê Nguyễn Thiên Kim, Gioa Kim Nguyễn Thế Khang, Giuse Nguyễn Anh Khôi, Isave Thiều Ngọc Ánh Linh, Maria Trần Thụy Trúc Linh, Calixto I Nguyễn Nhật Long, Đaminh Trần Nguyễn Bảo Lộc, Gioan Baotixita Hoàng Khánh Minh, Phêrô Nguyễn Công Minh, Anna Nguyễn Huỳnh Hoàng Ngọc, Inhaxiô Nguyễn Đăng Nguyên, Giuse Nguyễn Thiện Nhân, Têrêsa Huỳnh Ngọc An Nhiên, Gioan Nguyễn Đức Phát, Augustino Lê Huy Phong, Maria Đinh Phạm Phương Thảo, Giuse Nguyễn Hoàng Quốc Thắng, Anna Nguyễn Ngọc Bích Trâm, Maria Nguyễn Lê Như Ý.',
  'Bao đồng 2B': 'Antôn Trần Thế Anh, Maria Phạm Ngọc Hồng Ân, Vincente Ngô Gia Bảo, Emmanuel Nguyễn Thanh Chương, Têrêsa Nguyễn Ngọc Diệp, Giuse Lê Thành Đạt, Hêrônimô Võ Hoàng Hải Đăng, Gioan Baotixita Nguyễn Hữu Đức, Anna Trần Thị Hồng Hạnh, Phaolô Trần Minh Hiếu, Verônica Nguyễn Thị Kim Hoa, Phêrô Phan Khánh Hưng, Giêrađô Võ Tuấn Kiệt, Maria Nguyễn Ngân Khánh, Phaolô Huỳnh Đăng Khôi, Maria Bùi Thị Diệu Linh, Gioan Baotixita Huỳnh Nhật Nam, Teresa Lương Ngọc Thiên Ngân, Giuse Mai Trọng Nghĩa, Phanxicô Trần Lê Phúc Nhân, Phêrô Nguyễn Thanh Phong, Gioan Mai Đoàn Đức Tuấn, Têrêsa Vũ Minh Tuyết, Phaolô Lê Văn Duy Thiện, Giacôbê Đỗ Hoàng Thịnh, Maria Phạm Ngọc Khánh Thư, Maria Đặng Trần Anh Thư, Giuse Trần Mạnh Trí, Anna Đặng Trương Thanh Trúc, Têrêsa Nguyễn Ngọc Kim Uyên, Giuse Huỳnh Tấn Vũ, Matta Nguyễn Thái Gia Vy.',
  'Hiệp Sĩ': 'Anna Bùi Nguyễn Ngọc Mỹ Anh, Inhaxiô Nguyễn Hồng Ân, Phaolô Lê Hồng Ân, Anna Trần Phi Âu, Phêrô Nguyễn Ngọc Gia Bảo, Têrêsa Trịnh Quỳnh Chi, Phanxicô Đặng Nhật Duy, Martinô Lâm Khánh Hiệp, Maria Nguyễn Hoàng Lam Hồng, Maria Lê Hoàng Thiên Kim, Giuse Nguyễn Ngọc Dương Minh, Maria Phan Thị Kim Ngân, Têrêsa Nguyễn Khánh Ngọc, Giuse Phan Khôi Nguyên, Giuse Đặng Nguyễn Thành Nhân, Giuse Hoàng Nguyễn Minh Nhật, Maria Lê Phương Nhi, Maria Nguyễn Thị Yến Nhi, Emmanuel Chế Lê Tấn Tài, Martinô Nguyễn Minh Tiến, Giuse Nguyễn Đức Thiện, Phêrô Vũ Đức Thịnh, Têrêsa Nguyễn Ngọc Minh Thư, Têrêsa Nguyễn Trịnh Thiên Trang, Maria Chiêm Nguyễn Bảo Trân, Anna Trần Thanh Trúc, Anna Nguyễn Trịnh Mỹ Uyên, Maria Đào Đỗ Phương Vy, Elisabeth Châu Ngọc Ánh, Giuse Đỗ Minh Duy, Giuse Mai Minh Hiếu, Gioan Baotixita Nguyễn Bá Tây Hồ, Vincente Đặng Trần Anh Khoa, Maria Nguyễn Ngọc Mai Khôi, Giuse Phạm Hồng Long, Têrêsa Trần Nguyễn Minh Nghi, Maria Nguyễn Minh Ngọc, Giuse Khổng Trung Nguyên, Phanxicô Trương Văn Tuấn Phong, Phêrô Nguyễn Thiên Phú, Anna Nguyễn Ngọc Hoàng Quyên, Maria Nguyễn Ngọc Minh Thùy, Maria Vũ Ngọc Anh Thư, Rosa Trần Nguyễn Minh Thư, Rosa Trần Nguyễn Minh Thư, Têrêsa Lã Ngọc Quỳnh Trâm, Anna Nguyễn Ngọc Quỳnh Trân, Giuse Maria Nguyễn Đức Trí, Lucia Nguyễn Thanh Trúc.'
};

const christianNames = [
  'Đaminh Savio', 'Gioan Baotixita', 'Maria Têrêsa', 'Maria Fastina', 'Calixto I', 'Giuse Maria',
  'GioaKim', 'Gioa Kim', 'Maria', 'Têrêsa', 'Giuse', 'Antôn', 'Phêrô', 'Phê rô', 'Giacôbê', 'Simon', 'Inê',
  'Tadêô', 'Anna', 'Emmanuel', 'Tôma', 'Đaminh', 'Đôminicô', 'Cecilia', 'Cosimo', 'Martinô',
  'Anê', 'Vincente', 'Phaolô', 'Anphongsô', 'Catarina', 'Phanxicô', 'Isave', 'Inhaxiô',
  'Augustino', 'Hêrônimô', 'Verônica', 'Giêrađô', 'Teresa', 'Matta', 'Elisabeth', 'Rosa', 'Lucia', 'Gioan'
].sort((a,b) => b.length - a.length);

function removeVietnameseTones(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseMember(fullName) {
  let matchedChristian = '';
  let rest = fullName.trim();
  for (const cn of christianNames) {
    if (rest.toLowerCase().startsWith(cn.toLowerCase() + ' ')) {
      matchedChristian = cn;
      rest = rest.substring(cn.length).trim();
      break;
    }
  }
  return { christianName: matchedChristian, vietnameseName: rest, fullName: fullName.trim() };
}

async function run() {
  console.log('🔄 Đang cấu hình lại 6 đội...');
  const teamsConfig = [
    { id: 1, name: 'Bao đồng 1A', color: '#2563EB', description: 'Chi đoàn Bao đồng 1A' },
    { id: 2, name: 'Bao đồng 1B', color: '#059669', description: 'Chi đoàn Bao đồng 1B' },
    { id: 3, name: 'Bao đồng 1C', color: '#D97706', description: 'Chi đoàn Bao đồng 1C' },
    { id: 4, name: 'Bao đồng 2A', color: '#7C3AED', description: 'Chi đoàn Bao đồng 2A' },
    { id: 5, name: 'Bao đồng 2B', color: '#DC2626', description: 'Chi đoàn Bao đồng 2B' },
    { id: 6, name: 'Hiệp Sĩ', color: '#0891B2', description: 'Ngành Hiệp Sĩ' }
  ];

  for (const t of teamsConfig) {
    const existing = db.prepare('SELECT id FROM teams WHERE id = ?').get(t.id);
    if (existing) {
      db.prepare('UPDATE teams SET name = ?, color = ?, description = ?, total_points = 0 WHERE id = ?').run(t.name, t.color, t.description, t.id);
    } else {
      db.prepare('INSERT INTO teams (id, name, color, description, total_points) VALUES (?, ?, ?, ?, 0)').run(t.id, t.name, t.color, t.description);
    }
  }

  console.log('🧹 Xóa dữ liệu tài khoản thiếu nhi cũ...');
  // Delete completions, rosary beads, streaks, user_badges, user_rewards of old child accounts
  const oldChildren = db.prepare("SELECT id FROM users WHERE role = 'CHILD'").all();
  const oldIds = oldChildren.map(u => u.id);
  if (oldIds.length > 0) {
    const placeholders = oldIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM task_completions WHERE user_id IN (${placeholders})`).run(...oldIds);
    db.prepare(`DELETE FROM rosary_beads WHERE user_id IN (${placeholders})`).run(...oldIds);
    db.prepare(`DELETE FROM streaks WHERE user_id IN (${placeholders})`).run(...oldIds);
    db.prepare(`DELETE FROM user_badges WHERE user_id IN (${placeholders})`).run(...oldIds);
    db.prepare(`DELETE FROM user_rewards WHERE user_id IN (${placeholders})`).run(...oldIds);
    db.prepare(`DELETE FROM notifications WHERE user_id IN (${placeholders})`).run(...oldIds);
    db.prepare(`DELETE FROM users WHERE role = 'CHILD'`).run();
  }

  // Also reset community progress
  db.prepare('UPDATE community_progress SET total_beads = 0').run();

  console.log('🔐 Đang mã hóa mật khẩu mặc định: 123456 ...');
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  const teamIdMap = {
    'Bao đồng 1A': 1,
    'Bao đồng 1B': 2,
    'Bao đồng 1C': 3,
    'Bao đồng 2A': 4,
    'Bao đồng 2B': 5,
    'Hiệp Sĩ': 6
  };

  const insertUser = db.prepare(`
    INSERT INTO users (username, display_name, password_hash, role, team_id, personal_points)
    VALUES (?, ?, ?, 'CHILD', ?, 0)
  `);

  const insertStreak = db.prepare(`
    INSERT INTO streaks (user_id, current_streak, longest_streak)
    VALUES (?, 0, 0)
  `);

  const membersByTeam = {};
  const seenInTeam = new Set();
  let totalInserted = 0;

  for (const [teamName, text] of Object.entries(rawData)) {
    membersByTeam[teamName] = [];
    const teamId = teamIdMap[teamName];
    const list = text.split(',').map(s => s.trim().replace(/\.$/, '')).filter(Boolean);

    for (const item of list) {
      const key = teamName + ':' + item;
      if (seenInTeam.has(key)) {
        console.log(`⚠️ Bỏ qua trùng lặp trong ${teamName}: ${item}`);
        continue;
      }
      seenInTeam.add(key);

      const parsed = parseMember(item);
      const cleanViet = removeVietnameseTones(parsed.vietnameseName);
      const cleanChristian = removeVietnameseTones(parsed.christianName);
      const username = `${cleanChristian}_${cleanViet}`;

      const res = insertUser.run(username, item, defaultPasswordHash, teamId);
      const newUserId = res.lastInsertRowid;
      insertStreak.run(newUserId);

      membersByTeam[teamName].push({
        stt: membersByTeam[teamName].length + 1,
        fullName: item,
        christianName: parsed.christianName,
        vietnameseName: parsed.vietnameseName,
        username,
        password: '123456'
      });
      totalInserted++;
    }
  }

  console.log(`✅ Đã tạo thành công ${totalInserted} tài khoản thiếu nhi!`);

  // Create a markdown report file
  let md = '# 📋 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP THI ĐUA HOA MÂN CÔI\n\n';
  md += '> **Mật khẩu mặc định cho tất cả tài khoản:** `123456`  \n';
  md += '> *Các em có thể đăng nhập bằng tên tài khoản (có dấu gạch dưới `_` hoặc gõ liền không dấu đều được).*  \n\n';

  for (const [teamName, members] of Object.entries(membersByTeam)) {
    md += `## 🏆 ${teamName} (${members.length} thành viên)\n\n`;
    md += '| STT | Tên Thánh & Họ Tên | Tên đăng nhập (Username) | Mật khẩu |\n';
    md += '|---|---|---|---|\n';
    for (const m of members) {
      md += `| ${m.stt} | ${m.fullName} | \`${m.username}\` | \`123456\` |\n`;
    }
    md += '\n---\n\n';
  }

  const exportPath = path.join(__dirname, '..', 'DANH_SACH_TAI_KHOAN.md');
  fs.writeFileSync(exportPath, md, 'utf-8');
  console.log(`📄 Đã tạo file danh sách tài khoản tại: ${exportPath}`);
}

run().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
