'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { formatPoints, getAvatarInitials } from '@/lib/utils';

export default function DoiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/leaderboard')
        .then(r => r.json())
        .then(d => {
          const myTeam = d.teams?.find((t: any) => 
            (session.user.teamId && t.id === Number(session.user.teamId)) ||
            (session.user.teamName && t.name === session.user.teamName)
          );
          setTeamData(myTeam || null);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const pageStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' };
  const mainStyle = { paddingTop: '80px', maxWidth: 800, margin: '0 auto', padding: '80px 24px 48px' };

  if (!session?.user?.teamId && !session?.user?.teamName) {
    return (
      <div style={pageStyle}>
        <Header />
        <main style={mainStyle}>
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
            <h2 style={{ color: '#1F2937', marginBottom: 8 }}>Bạn chưa có đội</h2>
            <p>Liên hệ giáo lý viên để được phân công vào một đội.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loading || !teamData) {
    return <div style={pageStyle}><Header /></div>;
  }

  const teamColor = teamData.color || '#2563EB';

  return (
    <div style={pageStyle}>
      <Header />
      <main style={mainStyle}>
        {/* Team header */}
        <div style={{
          background: `linear-gradient(135deg, ${teamColor}, ${teamColor}99)`,
          borderRadius: 24,
          padding: '36px 32px',
          color: 'white',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 120, opacity: 0.1 }}>👥</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 8 }}>Hạng #{teamData.rank} • {teamData.member_count} thành viên</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Đội {teamData.name}</h1>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{formatPoints(teamData.total_points)} <span style={{ fontSize: 16, opacity: 0.75 }}>điểm</span></div>

          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.2)', borderRadius: 9999, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '65%', background: 'rgba(255,255,255,0.8)', borderRadius: 9999 }} />
          </div>
        </div>

        {/* Motivation */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 24,
          borderLeft: `4px solid ${teamColor}`,
          fontSize: 15,
          fontWeight: 600,
          color: '#1F2937',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          💪 Mỗi hạt của bạn là một bước tiến của cả đội!
        </div>

        {/* Top members */}
        <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#1F2937' }}>
            🌟 Thành viên tiêu biểu
          </h2>
          {(!teamData.topMembers || teamData.topMembers.length === 0) ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', margin: '20px 0', fontSize: 14 }}>
              Chưa có thành viên nào ghi nhận điểm. Hãy là người đầu tiên dâng hoa Mân Côi cho đội!
            </p>
          ) : (
            teamData.topMembers.map((member: any, i: number) => (
              <div key={member.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom: i < teamData.topMembers.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}>
                <div style={{ width: 32, textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#6B7280' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${teamColor}, ${teamColor}66)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {getAvatarInitials(member.display_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{member.display_name}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: teamColor }}>
                  {formatPoints(member.personal_points ?? member.total_beads ?? 0)} ⭐
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
