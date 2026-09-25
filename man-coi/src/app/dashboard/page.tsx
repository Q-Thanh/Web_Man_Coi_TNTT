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
}

interface Task {
  id: number;
  title: string;
  description: string;
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
  const kinMungTasks = tasks.filter(t => (t.bead_type || 'small') === 'small');
  const layChaTasks = tasks.filter(t => t.bead_type === 'large');

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
          {/* Kinh Kính Mừng */}
          <h2 className={styles.sectionTitle}>🌹 Kinh Kính Mừng <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>(mỗi lần = 1 hạt nhỏ)</span></h2>
          <p className={styles.sectionSub}>Mỗi lần đọc kinh sẽ thắp sáng thêm hạt nhỏ trên chuỗi Mân Côi</p>
          <div className={styles.taskList}>
            {kinMungTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleting={completingTaskId === task.id}
                onComplete={() => handleCompleteTask(task)}
              />
            ))}
          </div>

          {/* Kinh Lạy Cha */}
          <h2 className={styles.sectionTitle} style={{ marginTop: '32px' }}>🙏 Kinh Lạy Cha <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>(mỗi lần = 1 hạt to)</span></h2>
          <p className={styles.sectionSub}>Kinh Lạy Cha thắp sáng hạt to đặc biệt trên chuỗi Mân Côi</p>
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
  const bgColor = isLarge ? '#F5F3FF' : '#FFF1F2';
  const beadEmoji = isLarge ? '🟤' : '⚪';
  const beadLabel = isLarge ? 'hạt to' : 'hạt nhỏ';
  const doneCount = task.completionsToday || 0;

  return (
    <div
      className={`${styles.taskCard} ${isCompleting ? styles.taskCompleting : ''}`}
    >
      <div className={styles.taskIcon} style={{ background: bgColor }}>
        {task.icon}
        {/* Badge showing how many times completed today */}
        {doneCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px', right: '-6px',
            background: isLarge ? '#7C3AED' : '#E11D48',
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
        <div className={styles.taskTitle}>{task.title}</div>
        <div className={styles.taskDesc}>{task.description}</div>
        <div className={styles.taskMeta}>
          <span className={styles.taskBeads}>
            {beadEmoji} +{task.bead_progress} {beadLabel}/lần
          </span>
          <span className={styles.taskType}>
            {doneCount > 0 ? `Đã đọc ${doneCount} lần hôm nay` : (task.task_type === 'daily' ? 'Có thể đọc nhiều lần' : 'Đặc biệt')}
          </span>
        </div>
      </div>

      <div className={styles.taskRight}>
        <div className={styles.taskPoints}>
          <span className={styles.taskPointsNum} style={{ color: isLarge ? '#7C3AED' : '#E11D48' }}>
            +{task.bead_progress}
          </span>
          <span className={styles.taskPointsLabel}>{beadLabel}</span>
        </div>
        {/* Button always visible and tappable */}
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
