const { createClient } = require('@libsql/client');

const turso = createClient({
  url: 'libsql://webmancoitntt-q-thanh.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAzODYzMTQsImlkIjoiMDFhMGRiNTUtYzMwMS03MTU1LWI1MjMtMWNhMDhjMWY0ZDZlIiwia2lkIjoiaFR6TldtendOakMwZDVQSzB4bmJLOV9wTF9EWnNwS1VaUUo0XzdMNjBYOCIsInJpZCI6ImUzZGZhNjU0LTc1MjYtNDI2ZC1iZWM3LTYzNDBjNTUxZWIwYSJ9.eP10Fa1hPDZmFjczVLoWEai88eu8S0c8QIuAYrNEGDNMsuGrhmwjC7D_dm-OnWdoX0ztx4Ewj97mxc6eCYNjCQ'
});

const allTasks = [
  // ── NHÓM 1: CÁC HẠT DỌC (KHỞI ĐẦU & KẾT THÚC CHUỖI) ──
  {
    order: 1,
    title: '1. Làm Dấu Thánh Giá và đọc Kinh Tin Kính',
    description: 'Làm Dấu Thánh Giá và đọc Kinh Tin Kính với tâm hồn sốt sắng tại Cây Thánh Giá.',
    points: 1,
    bead_progress: 1,
    bead_type: 'cross',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '✝️'
  },
  {
    order: 2,
    title: '2. Đọc Kinh Lạy Cha (Hạt lớn xanh dương)',
    description: 'Đọc 1 lần Kinh Lạy Cha tại hạt lớn đầu tiên màu xanh dương trên cột dọc.',
    points: 1,
    bead_progress: 1,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🔵'
  },
  {
    order: 3,
    title: '3. Ba Hạt Nhỏ: Mỗi hạt đọc một Kinh Kính Mừng',
    description: 'Đọc 3 Kinh Kính Mừng trên 3 hạt nhỏ cột dọc (Đỏ: Ơn Đức Tin, Xanh lá: Ơn Đức Cậy, Trắng: Ơn Đức Mến).',
    points: 3,
    bead_progress: 3,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 4,
    title: '4. Đọc Kinh Sáng Danh',
    description: 'Đọc 1 lần Kinh Sáng Danh trên đoạn dây trước Mề Đay để kết thúc phần chuỗi đầu.',
    points: 1,
    bead_progress: 1,
    bead_type: 'special',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '✨'
  },
  {
    order: 5,
    title: '5. Đọc Kinh Lạy Nữ Vương & Kinh Trông Cậy',
    description: 'Đọc Kinh Lạy Nữ Vương, Kinh Trông Cậy và Các Lời Nguyện Tắt tại Mề Đay Đức Mẹ.',
    points: 2,
    bead_progress: 1,
    bead_type: 'medallion',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '👑'
  },
  {
    order: 6,
    title: '6. Làm Dấu Thánh Giá và hôn Thánh Giá kết thúc',
    description: 'Làm Dấu Thánh Giá và hôn Thánh Giá với tâm hồn kính mến để hoàn tất trọn vẹn chuỗi Mân Côi.',
    points: 1,
    bead_progress: 1,
    bead_type: 'cross',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '✝️'
  },

  // ── NHÓM 2: VÒNG CHUỖI HÌNH TRÒN - KINH KÍNH MỪNG (GIỮ NGUYÊN BẢN TRƯỚC ĐÂY) ──
  {
    order: 11,
    title: '1 Kinh Kính Mừng',
    description: 'Đọc 1 lần Kinh Kính Mừng',
    points: 1,
    bead_progress: 1,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 12,
    title: '5 Kinh Kính Mừng',
    description: 'Đọc 5 lần Kinh Kính Mừng liên tiếp',
    points: 5,
    bead_progress: 5,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 13,
    title: '10 Kinh Kính Mừng',
    description: 'Đọc 10 lần Kinh Kính Mừng – một chục kinh đầy đủ',
    points: 10,
    bead_progress: 10,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 14,
    title: '15 Kinh Kính Mừng',
    description: 'Đọc 15 lần Kinh Kính Mừng',
    points: 15,
    bead_progress: 15,
    bead_type: 'small',
    task_type: 'special',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 15,
    title: '20 Kinh Kính Mừng',
    description: 'Đọc 20 lần Kinh Kính Mừng – hai chục kinh',
    points: 20,
    bead_progress: 20,
    bead_type: 'small',
    task_type: 'special',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 16,
    title: '30 Kinh Kính Mừng',
    description: 'Đọc 30 lần Kinh Kính Mừng – ba chục kinh',
    points: 30,
    bead_progress: 30,
    bead_type: 'small',
    task_type: 'special',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    order: 17,
    title: '50 Kinh Kính Mừng',
    description: 'Đọc trọn 50 lần Kinh Kính Mừng – toàn bộ 5 chục kinh!',
    points: 50,
    bead_progress: 50,
    bead_type: 'small',
    task_type: 'special',
    reset_type: 'daily',
    icon: '✨'
  },

  // ── NHÓM 3: VÒNG CHUỖI HÌNH TRÒN - KINH LẠY CHA (GIỮ NGUYÊN BẢN TRƯỚC ĐÂY) ──
  {
    order: 21,
    title: '1 Kinh Lạy Cha',
    description: 'Đọc 1 lần Kinh Lạy Cha với tâm hồn khiêm tốn',
    points: 1,
    bead_progress: 1,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🙏'
  },
  {
    order: 22,
    title: '5 Kinh Lạy Cha',
    description: 'Đọc 5 lần Kinh Lạy Cha',
    points: 5,
    bead_progress: 5,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🙏'
  }
];

async function updateAllTasks() {
  console.log('🔄 Đang đồng bộ bảng tasks...');
  // Ẩn tất cả các tasks cũ
  await turso.execute('UPDATE tasks SET is_active = 0');

  for (const t of allTasks) {
    const existing = await turso.execute({
      sql: 'SELECT id FROM tasks WHERE title = ?',
      args: [t.title]
    });

    if (existing.rows.length > 0) {
      await turso.execute({
        sql: `UPDATE tasks SET 
                description = ?, 
                points = ?, 
                bead_progress = ?, 
                bead_type = ?, 
                task_type = ?, 
                reset_type = ?, 
                icon = ?, 
                is_active = 1
              WHERE title = ?`,
        args: [t.description, t.points, t.bead_progress, t.bead_type, t.task_type, t.reset_type, t.icon, t.title]
      });
      console.log(`✓ Đã kích hoạt task: ${t.title}`);
    } else {
      await turso.execute({
        sql: `INSERT INTO tasks (title, description, points, bead_progress, bead_type, task_type, reset_type, icon, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [t.title, t.description, t.points, t.bead_progress, t.bead_type, t.task_type, t.reset_type, t.icon]
      });
      console.log(`+ Đã tạo mới task: ${t.title}`);
    }
  }

  const activeRows = await turso.execute('SELECT id, title, bead_type, bead_progress, points FROM tasks WHERE is_active = 1 ORDER BY id ASC');
  console.log('✨ Danh sách tasks hoạt động hiện tại:');
  console.table(activeRows.rows);
}

updateAllTasks().catch(console.error);
