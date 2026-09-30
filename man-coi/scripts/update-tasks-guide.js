const { createClient } = require('@libsql/client');

const turso = createClient({
  url: 'libsql://webmancoitntt-q-thanh.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAzODYzMTQsImlkIjoiMDFhMGRiNTUtYzMwMS03MTU1LWI1MjMtMWNhMDhjMWY0ZDZlIiwia2lkIjoiaFR6TldtendOakMwZDVQSzB4bmJLOV9wTF9EWnNwS1VaUUo0XzdMNjBYOCIsInJpZCI6ImUzZGZhNjU0LTc1MjYtNDI2ZC1iZWM3LTYzNDBjNTUxZWIwYSJ9.eP10Fa1hPDZmFjczVLoWEai88eu8S0c8QIuAYrNEGDNMsuGrhmwjC7D_dm-OnWdoX0ztx4Ewj97mxc6eCYNjCQ'
});

const newTasks = [
  {
    step_number: 1,
    title: '1. Làm Dấu Thánh Giá và đọc Kinh Tin Kính',
    description: 'Làm Dấu Thánh Giá và đọc Kinh Tin Kính với tâm hồn sốt sắng hướng về Chúa.',
    points: 1,
    bead_progress: 1,
    bead_type: 'cross',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '✝️'
  },
  {
    step_number: 2,
    title: '2. Đọc Kinh Lạy Cha',
    description: 'Đọc 1 lần Kinh Lạy Cha tại hạt lớn đầu tiên (hạt màu xanh dương).',
    points: 1,
    bead_progress: 1,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🙏'
  },
  {
    step_number: 3,
    title: '3. Ba Hạt Nhỏ: Mỗi hạt đọc một Kinh Kính Mừng',
    description: 'Đọc 3 Kinh Kính Mừng cầu xin ơn Đức Tin (Đỏ), Đức Cậy (Xanh lá) và Đức Mến (Trắng).',
    points: 3,
    bead_progress: 3,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    step_number: 4,
    title: '4. Đọc Kinh Sáng Danh',
    description: 'Đọc 1 lần Kinh Sáng Danh kết thúc phần chuỗi đầu trước khi vào các Mầu Nhiệm.',
    points: 1,
    bead_progress: 1,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '✨'
  },
  {
    step_number: 5,
    title: '5. Ngắm Mầu Nhiệm Thứ Nhất, sau đó đọc Kinh Lạy Cha',
    description: 'Suy ngắm Mầu Nhiệm Thứ Nhất và đọc 1 lần Kinh Lạy Cha khởi đầu Chục 1.',
    points: 1,
    bead_progress: 1,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '📿'
  },
  {
    step_number: 6,
    title: '6. Mười Hạt Nhỏ: Mỗi hạt đọc một Kinh Kính Mừng (Mầu Nhiệm Thứ Nhất)',
    description: 'Đọc 10 Kinh Kính Mừng. Trong khi đọc, hãy suy ngẫm về Mầu Nhiệm Thứ Nhất (10 hạt Vàng).',
    points: 10,
    bead_progress: 10,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🟡'
  },
  {
    step_number: 7,
    title: '7. Đọc một Kinh Sáng Danh và một Lời nguyện Fatima',
    description: 'Trước khi sang hạt lớn kế tiếp, đọc một Kinh Sáng Danh và một Lời nguyện Fatima.',
    points: 1,
    bead_progress: 1,
    bead_type: 'special',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌟'
  },
  {
    step_number: 8,
    title: '8. Ngắm Mầu Nhiệm Thứ Hai, sau đó đọc Kinh Lạy Cha và lặp lại cho các Mầu Nhiệm',
    description: 'Ngắm Mầu Nhiệm tiếp theo, đọc Kinh Lạy Cha & 10 Kinh Kính Mừng cho đến hết 5 Mầu Nhiệm (Chục 2 Xanh lá, Chục 3 Xanh dương, Chục 4 Đỏ, Chục 5 Trắng).',
    points: 10,
    bead_progress: 10,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🟢'
  },
  {
    step_number: 9,
    title: '9. Đọc một Kinh Lạy Nữ Vương, một Kinh Trông Cậy và Các Lời Nguyện Tắt',
    description: 'Sau khi hoàn tất 5 mầu nhiệm: Đọc Kinh Lạy Nữ Vương, Kinh Trông Cậy và Các Lời Nguyện Tắt tại Mề Đay Đức Mẹ.',
    points: 2,
    bead_progress: 1,
    bead_type: 'medallion',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '👑'
  },
  {
    step_number: 10,
    title: '10. Làm Dấu Thánh Giá và hôn Thánh Giá với tâm hồn kính mến',
    description: 'Hoàn tất chuỗi Mân Côi: Làm Dấu Thánh Giá và hôn Thánh Giá với tâm hồn kính mến.',
    points: 1,
    bead_progress: 1,
    bead_type: 'cross',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '✝️'
  },
  // Thêm 2 nhiệm vụ đọc kinh linh hoạt ngoài các bước chuỗi
  {
    step_number: 11,
    title: 'Đọc thêm 1 Kinh Kính Mừng (Tự do)',
    description: 'Đọc 1 lần Kinh Kính Mừng bất kỳ lúc nào để dâng thêm một đoá hoa hồng lên Mẹ.',
    points: 1,
    bead_progress: 1,
    bead_type: 'small',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🌹'
  },
  {
    step_number: 12,
    title: 'Đọc thêm 1 Kinh Lạy Cha (Tự do)',
    description: 'Đọc 1 lần Kinh Lạy Cha để cầu nguyện cùng Cha trên trời.',
    points: 1,
    bead_progress: 1,
    bead_type: 'large',
    task_type: 'daily',
    reset_type: 'daily',
    icon: '🙏'
  }
];

async function updateTasks() {
  console.log('🔄 Đang cập nhật bảng tasks trên Turso Cloud...');
  
  // Ẩn hoặc vô hiệu các tasks cũ không thuộc quy trình 10 bước
  await turso.execute('UPDATE tasks SET is_active = 0');

  for (const t of newTasks) {
    // Kiểm tra xem task đã tồn tại chưa
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
      console.log(`✓ Đã cập nhật task: ${t.title}`);
    } else {
      await turso.execute({
        sql: `INSERT INTO tasks (title, description, points, bead_progress, bead_type, task_type, reset_type, icon, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [t.title, t.description, t.points, t.bead_progress, t.bead_type, t.task_type, t.reset_type, t.icon]
      });
      console.log(`+ Đã thêm task mới: ${t.title}`);
    }
  }

  const res = await turso.execute('SELECT id, title, bead_type, bead_progress FROM tasks WHERE is_active = 1');
  console.log('✨ Danh sách tasks đang hoạt động:', res.rows);
}

updateTasks().catch(console.error);
