const fs = require('fs');
const { createClient } = require('@libsql/client');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.substring(0, idx).trim(), l.substring(idx + 1).trim()];
    })
);

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('--- Cập nhật nhiệm vụ theo yêu cầu mới ---');

  // 1. Xóa nhiệm vụ Ba Hạt Nhỏ (ID 59)
  await db.execute({
    sql: 'UPDATE tasks SET is_active = 0 WHERE id = 59 OR title LIKE ?',
    args: ['%Ba Hạt Nhỏ%']
  });
  console.log('✅ Đã tắt nhiệm vụ Ba Hạt Nhỏ');

  // 2. Bỏ hết các chữ bước 1, 2, 4, 5, 6... ra khỏi tên nhiệm vụ
  await db.execute({
    sql: 'UPDATE tasks SET title = ?, description = ? WHERE id = 57 OR title LIKE ?',
    args: [
      'Làm Dấu Thánh Giá và đọc Kinh Tin Kính',
      'Làm Dấu Thánh Giá và đọc Kinh Tin Kính tại Cây Thánh Giá mở đầu giờ kinh Mân Côi.',
      '%Tin Kính%'
    ]
  });

  await db.execute({
    sql: 'UPDATE tasks SET title = ?, description = ? WHERE id = 69 OR (title LIKE ? AND bead_type = ?)',
    args: [
      'Đọc Kinh Lạy Cha (Khởi đầu chuỗi)',
      'Đọc một Kinh Lạy Cha tại hạt lớn đầu tiên trên cột dọc.',
      '%xanh dương%',
      'large'
    ]
  });

  await db.execute({
    sql: 'UPDATE tasks SET title = ?, description = ? WHERE id = 60 OR title LIKE ?',
    args: [
      'Đọc Kinh Sáng Danh',
      'Đọc Kinh Sáng Danh trên đoạn dây nối trước khi bắt đầu các mầu nhiệm.',
      '%Sáng Danh%'
    ]
  });

  await db.execute({
    sql: 'UPDATE tasks SET title = ?, description = ? WHERE id = 70 OR title LIKE ?',
    args: [
      'Đọc Kinh Lạy Nữ Vương & Kinh Trông Cậy',
      'Đọc Kinh Lạy Nữ Vương, Kinh Trông Cậy và các Lời Nguyện Tắt tại Mề Đay Đức Mẹ.',
      '%Nữ Vương%'
    ]
  });

  await db.execute({
    sql: 'UPDATE tasks SET title = ?, description = ? WHERE id = 71 OR title LIKE ?',
    args: [
      'Làm Dấu Thánh Giá và hôn Thánh Giá kết thúc',
      'Làm Dấu Thánh Giá và hôn kính Cây Thánh Giá để hoàn tất trọn vẹn giờ cầu nguyện.',
      '%hôn Thánh Giá%'
    ]
  });

  console.log('✅ Đã cập nhật xong tất cả tiêu đề nhiệm vụ không còn chữ bước 1,2,3...');

  // Query lại danh sách nhiệm vụ active
  const res = await db.execute('SELECT id, title, bead_type, bead_progress, points, is_active FROM tasks WHERE is_active = 1 ORDER BY id');
  console.log('Danh sách nhiệm vụ active hiện tại:');
  console.table(res.rows);
}

main().catch(console.error);
