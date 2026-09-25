'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { formatPoints } from '@/lib/utils';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated' && !['ADMIN', 'LEADER'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && ['ADMIN', 'LEADER'].includes(session.user.role)) {
      Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/tasks').then(r => r.json()),
      ]).then(([s, u, t]) => {
        setStats(s);
        setUsers(u.users || []);
        setTasks(t.tasks || []);
        setLoading(false);
      });
    }
  }, [session]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F8FAFF, #F5F3FF)',
  };

  const mainStyle: React.CSSProperties = {
    paddingTop: '80px',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '80px 24px 48px',
  };

  if (loading) return <div style={containerStyle}><Header /></div>;

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    background: active ? '#2563EB' : 'transparent',
    color: active ? 'white' : '#6B7280',
    transition: 'all 150ms',
    fontFamily: 'inherit',
    boxShadow: active ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
  });

  return (
    <div style={containerStyle}>
      <Header />
      <main style={mainStyle}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1F2937', marginBottom: 8 }}>⚙️ Quản Trị Hệ Thống</h1>
        <p style={{ color: '#6B7280', marginBottom: 28 }}>Theo dõi và quản lý toàn bộ hoạt động</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: 8, background: 'white', borderRadius: 14, marginBottom: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'overview', label: '📊 Tổng quan' },
            { key: 'users', label: '👥 Người dùng' },
            { key: 'tasks', label: '🎯 Nhiệm vụ' },
          ].map(tab => (
            <button key={tab.key} style={TAB_STYLE(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { icon: '👧', label: 'Thiếu nhi', value: stats.stats.totalUsers },
                { icon: '✅', label: 'Nhiệm vụ hoàn thành', value: stats.stats.totalCompletions.toLocaleString('vi-VN') },
                { icon: '📿', label: 'Tổng hạt sáng', value: stats.stats.totalBeads.toLocaleString('vi-VN') },
                { icon: '🌟', label: 'Hôm nay', value: stats.stats.todayCompletions },
              ].map(card => (
                <div key={card.label} style={{ background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1F2937' }}>{card.value}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Teams table */}
            <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🏆 Bảng xếp hạng đội</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFF' }}>
                    {['Hạng', 'Đội', 'Điểm', 'Thành viên'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.teams.map((team: any, i: number) => (
                    <tr key={team.name} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, display: 'inline-block' }} />
                          {team.name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563EB' }}>{formatPoints(team.total_points)}</td>
                      <td style={{ padding: '10px 12px' }}>{team.member_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent activity */}
            <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>⚡ Hoạt động gần đây</h2>
              {stats.recentActivity.map((act: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none', fontSize: 14 }}>
                  <span>✅</span>
                  <div style={{ flex: 1 }}>
                    <strong>{act.display_name}</strong> hoàn thành <em>{act.title}</em>
                  </div>
                  <span style={{ color: '#F59E0B', fontWeight: 700 }}>+{act.points_earned}</span>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>
                    {new Date(act.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>👥 Danh sách người dùng</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFF' }}>
                  {['Tên đăng nhập', 'Tên hiển thị', 'Đội', 'Vai trò', 'Điểm', 'Hạt', 'Streak'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#2563EB' }}>{user.username}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{user.display_name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {user.team_name ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: user.team_color, display: 'inline-block' }} />
                          {user.team_name}
                        </span>
                      ) : <span style={{ color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        background: user.role === 'ADMIN' ? '#EEF2FF' : user.role === 'LEADER' ? '#F0FDF4' : '#EFF6FF',
                        color: user.role === 'ADMIN' ? '#4338CA' : user.role === 'LEADER' ? '#065F46' : '#1D4ED8',
                      }}>
                        {user.role === 'ADMIN' ? 'Admin' : user.role === 'LEADER' ? 'GL Viên' : 'Thiếu nhi'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#F59E0B' }}>{formatPoints(user.personal_points)}</td>
                    <td style={{ padding: '10px 12px' }}>{user.personal_points || user.bead_count || 0} hạt</td>
                    <td style={{ padding: '10px 12px' }}>🔥 {user.streak || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === 'tasks' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🎯 Quản lý nhiệm vụ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((task: any) => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12, border: '1px solid #F3F4F6',
                  opacity: task.is_active ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: 24 }}>{task.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{task.description}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontWeight: 800, color: '#F59E0B' }}>+{task.points}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>điểm</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 50 }}>
                    <div style={{ fontWeight: 700, color: '#2563EB' }}>+{task.bead_progress}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>hạt</div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                    background: task.is_active ? '#D1FAE5' : '#F3F4F6',
                    color: task.is_active ? '#065F46' : '#6B7280',
                  }}>
                    {task.is_active ? 'Hoạt động' : 'Tắt'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
