const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/TURSO_DATABASE_URL=(.*)/);
const tokenMatch = envContent.match(/TURSO_AUTH_TOKEN=(.*)/);

if (!urlMatch || !tokenMatch) {
  console.error('Không tìm thấy TURSO_DATABASE_URL hoặc TURSO_AUTH_TOKEN trong .env.local');
  process.exit(1);
}

const client = createClient({
  url: urlMatch[1].trim(),
  authToken: tokenMatch[1].trim(),
});

async function resetAllTestBeads() {
  console.log('🔄 Đang tiến hành xóa hạt và lượt làm test...');

  // 1. Delete all rosary_beads
  const delBeads = await client.execute('DELETE FROM rosary_beads');
  console.log(`✅ Đã xóa ${delBeads.rowsAffected} hạt mân côi đã sáng`);

  // 2. Delete all task_completions
  const delCompletions = await client.execute('DELETE FROM task_completions');
  console.log(`✅ Đã xóa ${delCompletions.rowsAffected} lượt hoàn thành nhiệm vụ test`);

  // 3. Reset personal_points for all regular member users (role = MEMBER)
  const resetUsers = await client.execute("UPDATE users SET personal_points = 0 WHERE role = 'MEMBER'");
  console.log(`✅ Đã đặt lại điểm cá nhân về 0 cho các thành viên`);

  // 4. Reset team points to 0
  const resetTeams = await client.execute('UPDATE teams SET total_points = 0');
  console.log(`✅ Đã đặt lại điểm của tất cả các đội về 0`);

  // 5. Reset community progress
  await client.execute(`
    UPDATE community_progress 
    SET total_beads = 0, milestone_1 = 0, milestone_2 = 0, milestone_3 = 0, milestone_4 = 0, updated_at = datetime('now')
  `);
  console.log(`✅ Đã đặt lại tiến độ toàn xứ đoàn về 0 hạt`);

  // 6. Reset streaks
  await client.execute('DELETE FROM streaks');
  console.log(`✅ Đã đặt lại chuỗi ngày siêng năng`);

  console.log('\n🎉 TOÀN BỘ HẠT VÀ TIẾN ĐỘ TEST ĐÃ ĐƯỢC RESET VỀ 0 HOÀN TOÀN SẠCH SẼ!');
}

resetAllTestBeads().catch(err => {
  console.error('❌ Lỗi khi reset:', err);
  process.exit(1);
});
