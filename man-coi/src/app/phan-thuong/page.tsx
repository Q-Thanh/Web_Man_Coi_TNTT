'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import styles from './phan-thuong.module.css';

interface Reward {
  id: number;
  name: string;
  description: string;
  reward_type: string;
  condition_beads: number;
  is_earned: number;
  earned_at: string | null;
}

const REWARD_ICONS: Record<string, string> = {
  virtual: '🌟',
  frame: '🖼️',
  title: '📜',
  avatar: '🧑',
  physical: '🎁',
  effect: '✨',
};

export default function PhanThuongPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userBeads, setUserBeads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/rewards')
        .then(r => r.json())
        .then(d => { setRewards(d.rewards); setUserBeads(d.userBeads); setLoading(false); });
    }
  }, [session]);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>🎁 Phần Thưởng</h1>
        <p className={styles.sub}>Hoàn thành chuỗi Mân Côi để nhận những phần thưởng đặc biệt</p>

        {/* Progress toward next reward */}
        <div className={styles.nextRewardCard}>
          <div className={styles.nextRewardLabel}>📿 Tiến độ của bạn: <strong>{userBeads}/55 hạt</strong></div>
          {rewards.find(r => !r.is_earned) && (
            <div className={styles.nextRewardHint}>
              Tiếp theo: <strong>{rewards.find(r => !r.is_earned)?.name}</strong> — còn{' '}
              {Math.max(0, (rewards.find(r => !r.is_earned)?.condition_beads || 0) - userBeads)} hạt nữa!
            </div>
          )}
          <div className={styles.nextRewardBar}>
            <div className={styles.nextRewardFill} style={{ width: `${(userBeads / 55) * 100}%` }} />
            {/* Milestone markers */}
            {rewards.map(r => (
              <div
                key={r.id}
                className={styles.marker}
                style={{ left: `${(r.condition_beads / 55) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Rewards list */}
        <div className={styles.rewardsList}>
          {rewards.map(reward => {
            const isEarned = reward.is_earned === 1;
            const pct = Math.min((userBeads / reward.condition_beads) * 100, 100);

            return (
              <div
                key={reward.id}
                className={`${styles.rewardCard} ${isEarned ? styles.rewardEarned : ''}`}
              >
                {/* Milestone */}
                <div className={styles.rewardMilestone}>
                  {isEarned ? '✅' : `${reward.condition_beads} hạt`}
                </div>

                {/* Icon */}
                <div className={styles.rewardIcon}>
                  {isEarned ? '🎁' : REWARD_ICONS[reward.reward_type] || '🌟'}
                </div>

                {/* Content */}
                <div className={styles.rewardContent}>
                  <div className={styles.rewardName}>{reward.name}</div>
                  <div className={styles.rewardDesc}>{reward.description}</div>
                  <div className={`${styles.rewardType} ${isEarned ? styles.rewardTypeEarned : ''}`}>
                    {reward.reward_type === 'virtual' ? 'Phần thưởng ảo'
                      : reward.reward_type === 'frame' ? 'Khung avatar'
                      : reward.reward_type === 'title' ? 'Danh hiệu'
                      : reward.reward_type === 'physical' ? '🎊 Phần thưởng thật'
                      : 'Phần thưởng'}
                  </div>

                  {!isEarned && (
                    <div className={styles.rewardProgress}>
                      <div className={styles.rewardTrack}>
                        <div className={styles.rewardFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.rewardPct}>{Math.round(pct)}%</span>
                    </div>
                  )}

                  {isEarned && reward.earned_at && (
                    <div className={styles.earnedDate}>
                      Nhận ngày {new Date(reward.earned_at).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                {isEarned && <div className={styles.earnedSeal}>✨ Đã nhận</div>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
