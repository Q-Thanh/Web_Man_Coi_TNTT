'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { formatPoints, getMotivationMessage } from '@/lib/utils';
import styles from './thi-dua.module.css';

interface Team {
  id: number;
  name: string;
  color: string;
  total_points: number;
  member_count: number;
  rank: number;
  today_completions: number;
  streakInfo: { avg: number; max: number };
  topMembers: Array<{ id: number; display_name: string; personal_points: number }>;
}

interface LeaderboardData {
  teams: Team[];
  community: { total_beads: number };
  communityGoal: number;
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function ThiDuaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'diem' | 'hat' | 'streak'>('diem');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Header />
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
          <p>Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  const myTeam = data.teams.find(t => t.name === session?.user?.teamName);
  const topTeam = data.teams[0];
  const communityPct = Math.min((data.community.total_beads / data.communityGoal) * 100, 100);

  const motivationMsg = myTeam
    ? getMotivationMessage(
        myTeam.rank,
        myTeam.name,
        myTeam.rank > 1 ? data.teams[myTeam.rank - 2].total_points - myTeam.total_points : 0,
        myTeam.rank > 1 ? data.teams[myTeam.rank - 2].name : undefined
      )
    : null;

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>🏆 Bảng Thi Đua</h1>
        <p className={styles.pageSub}>Cùng nhau tiến bộ – mỗi hạt là một đóng góp</p>

        {/* Community progress */}
        <div className={styles.communityBanner}>
          <div className={styles.communityContent}>
            <div>
              <div className={styles.communityTitle}>🌎 Hành trình cộng đồng</div>
              <div className={styles.communityCount}>
                <span className={styles.communityNum}>{data.community.total_beads.toLocaleString('vi-VN')}</span>
                <span className={styles.communityGoal}> / {data.communityGoal.toLocaleString('vi-VN')} hạt</span>
              </div>
              <p className={styles.communityMsg}>Mỗi hạt của bạn thắp sáng cả cộng đồng!</p>
            </div>
            <div className={styles.communityPercent}>{Math.round(communityPct)}%</div>
          </div>
          <div className={styles.communityBar}>
            <div className={styles.communityBarFill} style={{ width: `${communityPct}%` }} />
          </div>
        </div>

        {/* My team motivation */}
        {motivationMsg && myTeam && (
          <div className={styles.motivationBanner} style={{ borderColor: myTeam.color }}>
            <span>{motivationMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'diem' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('diem')}
          >
            ⭐ Điểm số
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'hat' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('hat')}
          >
            📿 Số hạt
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'streak' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('streak')}
          >
            🔥 Streak
          </button>
        </div>

        {/* Leaderboard list */}
        <div className={styles.leaderboard}>
          {data.teams.map((team, index) => {
            const isMyTeam = team.name === session?.user?.teamName;
            const maxPoints = data.teams[0].total_points || 1;
            const barWidth = (team.total_points / maxPoints) * 100;

            return (
              <div
                key={team.id}
                className={`${styles.teamRow} ${isMyTeam ? styles.myTeam : ''}`}
                style={isMyTeam ? { borderColor: team.color } : {}}
              >
                {/* Rank */}
                <div className={`${styles.rankBadge} ${index < 3 ? styles[`rank${index + 1}`] : styles.rankOther}`}>
                  {index < 3 ? RANK_ICONS[index] : `${index + 1}`}
                </div>

                {/* Team info */}
                <div className={styles.teamInfo}>
                  <div className={styles.teamNameRow}>
                    <div
                      className={styles.teamColorDot}
                      style={{ background: team.color }}
                    />
                    <span className={styles.teamName}>{team.name}</span>
                    {isMyTeam && <span className={styles.myTeamTag}>Đội của bạn</span>}
                  </div>

                  {/* Progress bar */}
                  <div className={styles.teamBar}>
                    <div
                      className={styles.teamBarFill}
                      style={{ width: `${barWidth}%`, background: team.color }}
                    />
                  </div>

                  <div className={styles.teamStats}>
                    <span>👥 {team.member_count} thành viên</span>
                    <span>🔥 Streak tốt nhất: {team.streakInfo.max} ngày</span>
                  </div>
                </div>

                {/* Points */}
                <div className={styles.teamPoints}>
                  <div className={styles.teamPointsNum}>{formatPoints(team.total_points)}</div>
                  <div className={styles.teamPointsLabel}>điểm</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievements grid */}
        <h2 className={styles.subTitle}>🏅 Thành tích đặc biệt</h2>
        <div className={styles.achievementsGrid}>
          <AchievementCard
            icon="🏆"
            title="Nhiều điểm nhất"
            team={data.teams[0]?.name}
            color={data.teams[0]?.color}
            value={`${formatPoints(data.teams[0]?.total_points || 0)} điểm`}
          />
          <AchievementCard
            icon="🚀"
            title="Tiến bộ hôm nay"
            team={[...data.teams].sort((a, b) => b.today_completions - a.today_completions)[0]?.name}
            color={[...data.teams].sort((a, b) => b.today_completions - a.today_completions)[0]?.color}
            value={`${[...data.teams].sort((a, b) => b.today_completions - a.today_completions)[0]?.today_completions || 0} nhiệm vụ`}
          />
          <AchievementCard
            icon="🔥"
            title="Streak tốt nhất"
            team={[...data.teams].sort((a, b) => b.streakInfo.max - a.streakInfo.max)[0]?.name}
            color={[...data.teams].sort((a, b) => b.streakInfo.max - a.streakInfo.max)[0]?.color}
            value={`${[...data.teams].sort((a, b) => b.streakInfo.max - a.streakInfo.max)[0]?.streakInfo?.max || 0} ngày`}
          />
          <AchievementCard
            icon="❤️"
            title="Tích cực nhất"
            team={[...data.teams].sort((a, b) => b.member_count - a.member_count)[0]?.name}
            color={[...data.teams].sort((a, b) => b.member_count - a.member_count)[0]?.color}
            value={`${[...data.teams].sort((a, b) => b.member_count - a.member_count)[0]?.member_count || 0} thành viên`}
          />
        </div>
      </main>
    </div>
  );
}

function AchievementCard({ icon, title, team, color, value }: {
  icon: string; title: string; team?: string; color?: string; value: string;
}) {
  return (
    <div className={styles.achieveCard}>
      <div className={styles.achieveIcon}>{icon}</div>
      <div className={styles.achieveTitle}>{title}</div>
      {team && (
        <div className={styles.achieveTeam} style={{ color: color || '#2563EB' }}>{team}</div>
      )}
      <div className={styles.achieveValue}>{value}</div>
    </div>
  );
}
