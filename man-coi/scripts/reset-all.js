const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://webmancoitntt-q-thanh.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAzODYzMTQsImlkIjoiMDFhMGRiNTUtYzMwMS03MTU1LWI1MjMtMWNhMDhjMWY0ZDZlIiwia2lkIjoiaFR6TldtendOakMwZDVQSzB4bmJLOV9wTF9EWnNwS1VaUUo0XzdMNjBYOCIsInJpZCI6ImUzZGZhNjU0LTc1MjYtNDI2ZC1iZWM3LTYzNDBjNTUxZWIwYSJ9.eP10Fa1hPDZmFjczVLoWEai88eu8S0c8QIuAYrNEGDNMsuGrhmwjC7D_dm-OnWdoX0ztx4Ewj97mxc6eCYNjCQ'
});

async function resetAllData() {
  console.log('🔄 Đang tiến hành reset toàn bộ dữ liệu về 0...');

  await turso.execute('DELETE FROM rosary_beads');
  await turso.execute('DELETE FROM task_completions');
  await turso.execute('DELETE FROM streaks');
  await turso.execute('DELETE FROM user_badges');
  await turso.execute('DELETE FROM user_rewards');
  await turso.execute('UPDATE users SET personal_points = 0, today_points = 0');
  await turso.execute('UPDATE teams SET total_points = 0');
  await turso.execute(
    "UPDATE community_progress SET total_beads = 0, milestone_1 = 0, milestone_2 = 0, milestone_3 = 0, milestone_4 = 0, updated_at = datetime('now')"
  );

  console.log('✅ Đã reset thành công:');
  console.log('- Số hạt Mân Côi: 0');
  console.log('- Điểm cá nhân & điểm lớp: 0');
  console.log('- Chuỗi ngày (streak): 0');
  console.log('- Tiến độ cộng đồng: 0 / 5.000 hạt');
  console.log('- Huy hiệu và phần thưởng thử nghiệm: Đã xóa');
}

resetAllData().catch(err => {
  console.error('❌ Lỗi khi reset:', err);
});
