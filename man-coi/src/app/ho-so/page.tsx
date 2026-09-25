'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { formatPoints, getAvatarInitials, getStreakEmoji } from '@/lib/utils';

export default function HoSoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/dashboard').then(r => r.json()).then(d => setProfileData(d));
    }
  }, [session]);

  const style = { minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' };
  const main = { paddingTop: '80px', maxWidth: 700, margin: '0 auto', padding: '80px 24px 48px' };

  if (!profileData) return <div style={style}><Header /></div>;

  const { user, beads, litCount, streak } = profileData;
  const frames: Record<string, string> = {
    default: '2px solid #E5E7EB',
    frame_blue: '3px solid #2563EB',
    frame_gold: '3px solid #F59E0B',
  };

  return (
    <div style={style}>
      <Header />
      <main style={main}>
        {/* Profile card */}
        <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `linear-gradient(135deg, ${user.teamColor || '#2563EB'}, #7C3AED)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 28,
              outline: frames[user.avatarFrame] || frames.default,
              outlineOffset: 3,
            }}>
              {getAvatarInitials(user.displayName)}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1F2937' }}>{user.displayName}</h1>
              {user.title && (
                <div style={{ display: 'inline-block', padding: '3px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9999, fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                  {user.title}
                </div>
              )}
              <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                {user.teamName ? `👥 Đội ${user.teamName}` : ''}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { icon: '📿', label: 'Hạt Mân Côi', value: `${litCount}/55` },
              { icon: '⭐', label: 'Tổng điểm', value: formatPoints(user.personalPoints) },
              { icon: getStreakEmoji(streak.current_streak), label: 'Streak hiện tại', value: `${streak.current_streak} ngày` },
              { icon: '🏆', label: 'Streak dài nhất', value: `${streak.longest_streak} ngày` },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#F8FAFF', borderRadius: 14, padding: '16px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1F2937' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rosary preview */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1F2937' }}>📿 Tiến độ chuỗi Mân Côi</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: '50%',
                background: beads[i]?.isLit ? 'linear-gradient(135deg, #60A5FA, #2563EB)' : '#E5E7EB',
                boxShadow: beads[i]?.isLit ? '0 0 6px rgba(59,130,246,0.4)' : 'none',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: '50%',
                background: beads[50 + i]?.isLit ? 'linear-gradient(135deg, #FDE68A, #F59E0B)' : '#E5E7EB',
                boxShadow: beads[50 + i]?.isLit ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
              }} />
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#6B7280' }}>
            {litCount < 55 ? `Còn ${55 - litCount} hạt nữa để hoàn thành! Cố lên! 💪` : '🎉 Đã hoàn thành toàn bộ chuỗi!'}
          </div>
        </div>
      </main>
    </div>
  );
}
