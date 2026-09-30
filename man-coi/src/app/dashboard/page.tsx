'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { useToast } from '@/components/ui/ToastProvider';
import { getStreakEmoji } from '@/lib/utils';
import styles from './dashboard.module.css';

// Dynamic import of RosaryChain (SVG-heavy, no SSR needed)
const RosaryChain = dynamic(() => import('@/components/rosary/RosaryChain'), { ssr: false });

interface DashboardData {
  user: {
    displayName: string;
    teamName: string;
    teamColor: string;
    teamBeads: number;
    teamRank: number;
    avatarFrame: string;
    title: string;
  };
  beads: Array<{ position: number; type: string; isLit: boolean; litAt: string | null }>;
  litCount: number;
  smallBeads: number;
  largeBeads: number;
  streak: { current_streak: number; longest_streak: number };
  completedTodayIds: number[];
  todayBeads: number;
  todaySmallBeads?: number;
  todayChuoi?: number;
  todayPoints?: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  points?: number;
  bead_progress: number;
  bead_type: string;
  task_type: string;
  icon: string;
  completionsToday: number; // how many times tapped today
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast, showBadge, showReward } = useToast();

  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [newBeadPositions, setNewBeadPositions] = useState<number[]>([]);
  const [beadAnimation, setBeadAnimation] = useState<{ show: boolean; count: number; type: string }>({ show: false, count: 0, type: 'small' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, tasksRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/tasks'),
      ]);
      if (dashRes.ok) setDashData(await dashRes.json());
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks);
      }
    } catch {
      showToast({ title: 'Lỗi kết nối', message: 'Không thể tải dữ liệu. Vui lòng thử lại.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  const handleCompleteTask = async (task: Task) => {
    if (completingTaskId) return;
    setCompletingTaskId(task.id);

    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast({ title: 'Không thể hoàn thành', message: data.error, type: 'error' });
        return;
      }

      // Mark new beads for animation
      setNewBeadPositions(data.beadsLit);
      setTimeout(() => setNewBeadPositions([]), 3000);

      // Bead count animation
      setBeadAnimation({ show: true, count: data.beadsAdded, type: data.beadType });
      setTimeout(() => setBeadAnimation({ show: false, count: 0, type: 'small' }), 2500);

      // Success toast
      const beadLabel = data.beadType === 'large' ? 'hạt to' : 'hạt nhỏ';
      const beadEmoji = data.beadType === 'large' ? '🟤' : '⚪';
      showToast({
        title: `${beadEmoji} +${data.beadsAdded} ${beadLabel}!`,
        message: `Hoàn thành "${task.title}" – Tổng: ${data.smallBeads} hạt nhỏ + ${data.largeBeads} hạt to`,
        type: 'success',
        icon: '📿',
      });

      // Special toast if points awarded today
      if (data.pointsAwarded > 0) {
        setTimeout(() => {
          showToast({
            title: `⭐ +${data.pointsAwarded} điểm thi đua!`,
            message: data.todayChuoi === 3
              ? 'Chúc mừng con đã hoàn thành đủ 3 chuỗi Mân Côi hôm nay và nhận trọn 20 điểm!'
              : `Chúc mừng con đã hoàn thành chuỗi thứ ${data.todayChuoi} hôm nay (+${data.pointsAwarded} điểm thưởng)!`,
            type: 'success',
            icon: '🎉',
          });
        }, 1200);
      }

      // Earned badges
      for (const badge of data.earnedBadges) {
        setTimeout(() => showBadge(badge.name), 1000);
      }

      // Earned rewards
      for (const reward of data.earnedRewards) {
        setTimeout(() => showReward(reward.name), 1500);
      }

      // Refresh data
      await fetchData();

    } catch {
      showToast({ title: 'Lỗi mạng', message: 'Không thể cập nhật tiến độ. Vui lòng thử lại.', type: 'error' });
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.pageWrap}>
        <Header />
        <div className={styles.loadingCenter}>
          <div className={styles.spinner} />
          <p>Đang tải hành trình của bạn...</p>
        </div>
      </div>
    );
  }

  if (!dashData) return null;

  const { user, beads, litCount, smallBeads, largeBeads, streak, todayBeads } = dashData;
  const stemTaskTitles = [
    'Làm Dấu Thánh Giá và đọc Kinh Tin Kính',
    'Đọc Kinh Lạy Cha (Khởi đầu chuỗi)',
    'Đọc Kinh Sáng Danh',
    'Đọc Kinh Lạy Nữ Vương & Kinh Trông Cậy',
    'Làm Dấu Thánh Giá và hôn Thánh Giá kết thúc'
  ];
  const stemTasks = tasks.filter(t => stemTaskTitles.includes(t.title) || t.bead_type === 'cross' || t.bead_type === 'medallion' || t.bead_type === 'special' || t.title.includes('Khởi đầu'));
  const kinhMungTasks = tasks.filter(t => !stemTasks.some(st => st.id === t.id) && (t.bead_type === 'small' || t.title.includes('Kính Mừng')));
  const layChaTasks = tasks.filter(t => !stemTasks.some(st => st.id === t.id) && (t.bead_type === 'large' || t.title.includes('Lạy Cha')));

  const rosaryBeads = beads.map(b => ({
    ...b,
    litAt: b.litAt ?? undefined,
    isNew: newBeadPositions.includes(b.position),
  }));

  return (
    <div className={styles.pageWrap}>
      <Header />

      <main className={styles.main}>
        {/* ─── HERO: Rosary Section ─── */}
        <section className={styles.rosarySection}>
          <div className={styles.rosaryHeader}>
            <h1 className={styles.rosaryTitle}>
              📿 Hành trình Mân Côi của{' '}
              <span className={styles.userName}>{user.displayName}</span>
            </h1>
            {user.title && (
              <div className={styles.userTitle}>{user.title}</div>
            )}
          </div>

          <div className={styles.rosaryContent}>
            {/* Rosary Chain - Center */}
            <div className={styles.rosaryCenter}>
              <RosaryChain
                beads={rosaryBeads}
                totalBeads={55}
                smallBeads={smallBeads}
                largeBeads={largeBeads}
                size="lg"
              />
            </div>

            {/* Stats panel */}
            <div className={styles.statsPanel}>
              {/* Small beads count */}
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🌹</div>
                <div className={styles.statValue}>
                  {smallBeads}
                  {beadAnimation.show && beadAnimation.type === 'small' && (
                    <span className={styles.pointsFloat}>+{beadAnimation.count}</span>
                  )}
                </div>
                <div className={styles.statLabel}>Hạt nhỏ<br/><small>(Kinh Kính Mừng)</small></div>
              </div>

              {/* Large beads count */}
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🙏</div>
                <div className={styles.statValue} style={{ color: '#7C3AED' }}>
                  {largeBeads}
                  {beadAnimation.show && beadAnimation.type === 'large' && (
                    <span className={styles.pointsFloat}>+{beadAnimation.count}</span>
                  )}
                </div>
                <div className={styles.statLabel}>Hạt to<br/><small>(Kinh Lạy Cha)</small></div>
              </div>

              {/* Streak */}
              <div className={styles.statCard}>
                <div className={styles.statIcon}>{getStreakEmoji(streak.current_streak)}</div>
                <div className={styles.statValue} style={{ color: '#F59E0B' }}>
                  {streak.current_streak}
                </div>
                <div className={styles.statLabel}>Ngày liên tiếp</div>
              </div>

              {/* Today beads */}
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🌟</div>
                <div className={styles.statValue} style={{ color: '#2563EB' }}>+{todayBeads}</div>
                <div className={styles.statLabel}>Hạt hôm nay</div>
              </div>

              {/* Daily Mission Target (3 Chuỗi -> 20 Điểm) */}
              <div style={{
                gridColumn: '1 / -1',
                background: (dashData?.todayChuoi || 0) >= 3 ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' : 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                border: (dashData?.todayChuoi || 0) >= 3 ? '1.5px solid #86EFAC' : '1.5px solid #FDE68A',
                borderRadius: 16,
                padding: '14px 16px',
                marginTop: 2,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: (dashData?.todayChuoi || 0) >= 3 ? '#166534' : '#92400E' }}>
                    🎯 Mục tiêu ngày: 3 Chuỗi Mân Côi
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 9999,
                    background: (dashData?.todayChuoi || 0) >= 3 ? '#16A34A' : '#F59E0B',
                    color: 'white',
                  }}>
                    {(dashData?.todayChuoi || 0) >= 3 ? '✅ Đã đạt (+20đ thưởng)' : `${dashData?.todayChuoi || 0} / 3 chuỗi`}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: (dashData?.todayChuoi || 0) >= 3 ? '#14532D' : '#78350F', lineHeight: 1.45 }}>
                  {(dashData?.todayChuoi || 0) >= 3
                    ? `🎉 Chúc mừng con đã hoàn thành ${dashData?.todayChuoi} chuỗi hôm nay! Con đã tích lũy ${dashData?.todayPoints || 0} điểm (gồm 1 điểm/kinh và +20 điểm thưởng hoàn thành 3 chuỗi cho lớp).`
                    : `Mỗi kinh con đọc được cộng 1 điểm. Hôm nay con đã đọc ${dashData?.todaySmallBeads || 0} kinh Kính Mừng (${dashData?.todayChuoi || 0}/3 chuỗi). Hoàn thành đủ 3 chuỗi (150 kinh) để nhận thêm 20 điểm thưởng thi đua cho lớp!`}
                </div>
              </div>

              {/* Team */}
              {user.teamName && (
                <div className={styles.teamCard} style={{ borderColor: user.teamColor || '#2563EB' }}>
                  <div
                    className={styles.teamDot}
                    style={{ background: user.teamColor || '#2563EB' }}
                  />
                  <div className={styles.teamInfo}>
                    <div className={styles.teamName}>{user.teamName}</div>
                    <div className={styles.teamPoints}>{user.teamBeads} hạt</div>
                  </div>
                  {user.teamRank && (
                    <div className={styles.teamRank}>
                      {user.teamRank === 1 ? '🥇' : user.teamRank === 2 ? '🥈' : user.teamRank === 3 ? '🥉' : `#${user.teamRank}`}
                    </div>
                  )}
                </div>
              )}

              {/* Motivation message */}
              <div className={styles.motivationBox}>
                <p className={styles.motivationText}>
                  {litCount === 0
                    ? '🌱 Hãy bắt đầu hành trình của con hôm nay!'
                    : litCount < 10
                    ? `✨ Con đã thắp được ${litCount} hạt đầu tiên!`
                    : litCount < 25
                    ? `💪 Cố thêm ${25 - litCount} hạt nữa đến nửa chặng đường!`
                    : litCount < 50
                    ? `🔥 Chỉ còn ${50 - litCount} hạt nữa để đạt 50 hạt!`
                    : `🎉 Tuyệt vời! Con đã thắp được ${litCount} hạt rồi!`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TASKS ─── */}
        <section className={styles.tasksSection}>
          {/* Section 1: Khởi đầu & Kết thúc chuỗi (Các hạt dọc) */}
          {stemTasks.length > 0 && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
                border: '1.5px solid #BFDBFE',
                borderRadius: 20,
                padding: '20px 24px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '24px' }}>📿</span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
                    Khởi Đầu & Kết Thúc Giờ Kinh (Các Hạt Dọc)
                  </h2>
                </div>
                <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Hoàn thành các kinh nguyện mở đầu và kết thúc tại Cây Thánh Giá, hạt lớn và Mề Đay Đức Mẹ!
                </p>
              </div>

              <div className={styles.taskList} style={{ marginBottom: '36px' }}>
                {stemTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleting={completingTaskId === task.id}
                    onComplete={() => handleCompleteTask(task)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Section 2: Kinh Kính Mừng (Vòng chuỗi 5 chục kinh) */}
          {kinhMungTasks.length > 0 && (
            <>
              <h2 className={styles.sectionTitle} style={{ marginTop: '16px' }}>
                🌹 Kinh Kính Mừng <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>(Vòng chuỗi 50 hạt - 5 chục kinh)</span>
              </h2>
              <p className={styles.sectionSub}>Chọn số lượng kinh đã đọc để thắp sáng các hạt nhỏ trên vòng chuỗi (1 kinh = 1 điểm)</p>
              <div className={styles.taskList} style={{ marginBottom: '36px' }}>
                {kinhMungTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleting={completingTaskId === task.id}
                    onComplete={() => handleCompleteTask(task)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Section 3: Kinh Lạy Cha (Hạt lớn giữa các chục) */}
          {layChaTasks.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>
                🙏 Kinh Lạy Cha <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>(Hạt lớn giữa các chục kinh)</span>
              </h2>
              <p className={styles.sectionSub}>Thắp sáng các hạt vàng lớn phân cách giữa các mầu nhiệm</p>
              <div className={styles.taskList}>
                {layChaTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleting={completingTaskId === task.id}
                    onComplete={() => handleCompleteTask(task)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

// ── TaskCard component ────────────────────────────────────────────────────────
function TaskCard({
  task,
  isCompleting,
  onComplete,
}: {
  task: Task;
  isCompleting: boolean;
  onComplete: () => void;
}) {
  const isLarge = task.bead_type === 'large';
  const isCross = task.bead_type === 'cross';
  const isMedallion = task.bead_type === 'medallion';

  const bgColor = isCross ? '#FFFBEB' : isMedallion ? '#FEF3C7' : isLarge ? '#EFF6FF' : '#FFF1F2';
  const doneCount = task.completionsToday || 0;

  return (
    <div className={`${styles.taskCard} ${isCompleting ? styles.taskCompleting : ''}`}>
      <div className={styles.taskIcon} style={{ background: bgColor, position: 'relative' }}>
        {task.icon}
        {doneCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px', right: '-6px',
            background: '#10B981',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(0,0,0,.2)',
          }}>
            {doneCount}×
          </span>
        )}
      </div>

      <div className={styles.taskBody}>
        <div className={styles.taskTitle}>
          {task.title}
        </div>
        <div className={styles.taskDesc}>{task.description}</div>
        <div className={styles.taskMeta}>
          <span className={styles.taskBeads}>
            {task.icon} +{task.bead_progress} {isCross ? 'Thánh Giá' : isMedallion ? 'Mề Đay' : isLarge ? 'hạt to' : 'hạt nhỏ'}
          </span>
          <span className={styles.taskType}>
            {doneCount > 0 ? `Đã hoàn thành ${doneCount} lần hôm nay` : 'Hằng ngày'}
          </span>
        </div>
      </div>

      <div className={styles.taskRight}>
        <div className={styles.taskPoints}>
          <span className={styles.taskPointsNum}>
            +{task.points || task.bead_progress}
          </span>
          <span className={styles.taskPointsLabel}>điểm thi đua</span>
        </div>
        <button
          className={styles.completeBtn}
          onClick={onComplete}
          disabled={isCompleting}
          style={doneCount > 0 ? { background: 'linear-gradient(135deg, #10B981, #059669)' } : {}}
        >
          {isCompleting ? (
            <span className={styles.spinnerSmall} />
          ) : doneCount > 0 ? (
            '✓ Đọc thêm'
          ) : (
            'Hoàn thành'
          )}
        </button>
      </div>
    </div>
  );
}
