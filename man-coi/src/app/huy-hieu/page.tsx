'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import styles from './huy-hieu.module.css';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  is_earned: number;
  earned_at: string | null;
}

export default function HuyHieuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState({ bead_count: 0, streak: 0, total_completions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/badges')
        .then(r => r.json())
        .then(d => { setBadges(d.badges); setProgress(d.progress); setLoading(false); });
    }
  }, [session]);

  const earned = badges.filter(b => b.is_earned);
  const locked = badges.filter(b => !b.is_earned);

  const getProgressFor = (badge: Badge) => {
    if (badge.condition_type === 'beads') return { cur: progress.bead_count, max: badge.condition_value };
    if (badge.condition_type === 'streak') return { cur: progress.streak || 0, max: badge.condition_value };
    if (badge.condition_type === 'completions') return { cur: progress.total_completions, max: badge.condition_value };
    return null;
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>🏅 Huy Hiệu</h1>
        <p className={styles.sub}>Mỗi huy hiệu là dấu ấn trên hành trình của bạn</p>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🏅</div>
            <div className={styles.summaryNum}>{earned.length}</div>
            <div className={styles.summaryLabel}>Đã đạt</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🔒</div>
            <div className={styles.summaryNum}>{locked.length}</div>
            <div className={styles.summaryLabel}>Chưa mở</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>📿</div>
            <div className={styles.summaryNum}>{progress.bead_count}</div>
            <div className={styles.summaryLabel}>Hạt hiện tại</div>
          </div>
        </div>

        {/* Earned badges */}
        {earned.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>✨ Đã đạt được</h2>
            <div className={styles.badgeGrid}>
              {earned.map(badge => (
                <div key={badge.id} className={`${styles.badgeCard} ${styles.earned}`}>
                  <div className={styles.badgeIconLarge}>{badge.icon}</div>
                  <div className={styles.badgeName}>{badge.name}</div>
                  <div className={styles.badgeDesc}>{badge.description}</div>
                  {badge.earned_at && (
                    <div className={styles.earnedDate}>
                      {new Date(badge.earned_at).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                  <div className={styles.earnedCheck}>✓ Đã đạt</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Locked badges */}
        {locked.length > 0 && (
          <>
            <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>🔒 Chưa mở khóa</h2>
            <div className={styles.badgeGrid}>
              {locked.map(badge => {
                const prog = getProgressFor(badge);
                const pct = prog ? Math.min((prog.cur / prog.max) * 100, 100) : 0;
                return (
                  <div key={badge.id} className={`${styles.badgeCard} ${styles.locked}`}>
                    <div className={styles.badgeIconLarge} style={{ filter: 'grayscale(1)' }}>{badge.icon}</div>
                    <div className={styles.badgeName}>{badge.name}</div>
                    <div className={styles.badgeDesc}>{badge.description}</div>
                    {prog && (
                      <div className={styles.badgeProgress}>
                        <div className={styles.progTrack}>
                          <div className={styles.progFill} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={styles.progLabel}>{prog.cur}/{prog.max}</div>
                      </div>
                    )}
                    <div className={styles.conditionText}>
                      {badge.condition_type === 'beads' && `Cần ${badge.condition_value} hạt`}
                      {badge.condition_type === 'streak' && `Cần ${badge.condition_value} ngày liên tiếp`}
                      {badge.condition_type === 'completions' && `Cần hoàn thành ${badge.condition_value} nhiệm vụ`}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
