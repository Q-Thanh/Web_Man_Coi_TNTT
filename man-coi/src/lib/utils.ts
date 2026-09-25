// Utility functions for the Mân Côi application

export function formatPoints(points: number): string {
  return points.toLocaleString('vi-VN');
}

export function getBeadType(position: number): 'small' | 'large' {
  // Positions 1-50: small beads, 51-55: large beads
  return position <= 50 ? 'small' : 'large';
}

export function getMilestoneForBead(position: number): { title: string; icon: string } | null {
  const milestones: Record<number, { title: string; icon: string }> = {
    51: { title: 'Khởi đầu', icon: '🌱' },
    52: { title: 'Bền bỉ', icon: '💪' },
    53: { title: 'Chăm chỉ', icon: '⭐' },
    54: { title: 'Quyết tâm', icon: '🔥' },
    55: { title: 'Hoàn thành', icon: '👑' },
  };
  return milestones[position] || null;
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🌟';
  if (streak >= 14) return '🔥';
  if (streak >= 7) return '⚡';
  if (streak >= 3) return '✨';
  return '💫';
}

export function getMotivationMessage(
  rank: number,
  teamName: string,
  pointsBehind?: number,
  teamAhead?: string
): string {
  if (rank === 1) {
    return `👑 Đội ${teamName} đang dẫn đầu! Hãy cùng tiếp tục cố gắng!`;
  }
  if (rank === 2 && teamAhead && pointsBehind !== undefined) {
    return `🔥 Chỉ còn ${formatPoints(pointsBehind)} điểm nữa để vượt ${teamAhead}!`;
  }
  return `🚀 Đội ${teamName} đang tiến bộ! Mỗi hạt là một bước tiến!`;
}

export function getProgressPercent(current: number, total: number): number {
  return Math.min(Math.round((current / total) * 100), 100);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    daily: 'Hằng ngày',
    special: 'Đặc biệt',
    event: 'Sự kiện',
    community: 'Cộng đồng',
  };
  return labels[type] || type;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    CHILD: 'Thiếu nhi',
    LEADER: 'Giáo lý viên',
    ADMIN: 'Quản trị viên',
  };
  return labels[role] || role;
}

export function getAvatarInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const ROSARY_CONFIG = {
  totalBeads: 55,
  smallBeads: 50,
  largeBeads: 5,
  checkpoints: [10, 20, 30, 40, 50, 55],
  milestonePositions: [51, 52, 53, 54, 55], // large bead positions
};

export const COMMUNITY_MILESTONES = [1000, 2000, 3000, 5000];
