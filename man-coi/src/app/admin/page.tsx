'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { formatPoints } from '@/lib/utils';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const DEFAULT_TEAMS = [
  { id: 1, name: 'Bao đồng 1A', color: '#2563EB' },
  { id: 2, name: 'Bao đồng 1B', color: '#059669' },
  { id: 3, name: 'Bao đồng 1C', color: '#D97706' },
  { id: 4, name: 'Bao đồng 2A', color: '#7C3AED' },
  { id: 5, name: 'Bao đồng 2B', color: '#DC2626' },
  { id: 6, name: 'Hiệp Sĩ', color: '#0891B2' },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>(DEFAULT_TEAMS);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add form fields
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newTeamId, setNewTeamId] = useState('1');
  const [newRole, setNewRole] = useState('CHILD');
  const [newPassword, setNewPassword] = useState('123456');

  // Edit form fields
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editTeamId, setEditTeamId] = useState('1');
  const [editRole, setEditRole] = useState('CHILD');

  // Load data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [s, u, t] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/admin/users', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/admin/tasks', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      ]);

      if (u?.code === 'UNAUTHORIZED' || u?.error === 'Unauthorized') {
        alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        router.push('/login');
        return;
      }

      if (u?.error) {
        setLoadError(u.error);
      } else {
        setLoadError(null);
      }

      if (s) setStats(s);
      if (Array.isArray(u?.users)) setUsers(u.users);
      if (Array.isArray(u?.teams) && u.teams.length > 0) setTeams(u.teams);
      if (Array.isArray(t?.tasks)) setTasks(t.tasks);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu admin:', err);
      setLoadError(err.message || 'Lỗi kết nối');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      if (!['ADMIN', 'LEADER'].includes(session?.user?.role || '')) {
        router.push('/dashboard');
        return;
      }
      refreshData().finally(() => setLoading(false));
    }
  }, [status, session, router]);

  // Handle auto username when typing new name
  const handleNameChange = (name: string) => {
    setNewDisplayName(name);
    // Tự sinh username không dấu
    const autoUser = removeVietnameseTones(name);
    setNewUsername(autoUser);
  };

  // Add new member
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newUsername.trim()) {
      alert('Vui lòng nhập họ tên và tên đăng nhập');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          displayName: newDisplayName.trim(),
          username: newUsername.trim(),
          teamId: newTeamId ? parseInt(newTeamId) : null,
          role: newRole,
          password: newPassword || '123456',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Đã thêm thành viên mới thành công!');
        setShowAddModal(false);
        setNewDisplayName('');
        setNewUsername('');
        setNewPassword('123456');
        refreshData();
      } else {
        alert(data.error || 'Lỗi khi thêm người dùng');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditDisplayName(user.display_name || '');
    setEditTeamId(user.team_id ? String(user.team_id) : '');
    setEditRole(user.role || 'CHILD');
    setShowEditModal(true);
  };

  // Save Edit Member
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          userId: editingUser.id,
          displayName: editDisplayName.trim(),
          teamId: editTeamId ? parseInt(editTeamId) : null,
          role: editRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Đã cập nhật thành viên thành công!');
        setShowEditModal(false);
        setEditingUser(null);
        refreshData();
      } else {
        alert(data.error || 'Lỗi khi cập nhật');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async (user: any) => {
    if (!window.confirm(`Bạn có chắc muốn đặt lại mật khẩu cho "${user.display_name}" về mặc định "123456"?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resetPassword',
          userId: user.id,
          newPassword: '123456',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message || 'Đã đặt lại mật khẩu về: 123456'}`);
      } else {
        alert(data.error || 'Lỗi khi đặt lại mật khẩu');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TÀI KHOẢN:\n"${user.display_name}" (${user.username})?\n\nThao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Đã xóa tài khoản "${user.display_name}"`);
        refreshData();
      } else {
        alert(data.error || 'Lỗi khi xóa tài khoản');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    }
  };

  // Reset all test beads & scores
  const handleResetAllBeads = async () => {
    if (!window.confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ hạt Mân Côi đã sáng, đưa điểm số, chuỗi streak và tiến độ toàn đoàn về 0 để chuẩn bị bước vào cuộc hành trình mới không?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-beads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Đã reset toàn bộ về 0 thành công!');
        refreshData();
      } else {
        alert(data.error || 'Có lỗi xảy ra khi xóa dữ liệu');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q));
      const matchTeam = teamFilter === 'all' || String(u.team_id) === teamFilter;
      return matchSearch && matchTeam;
    });
  }, [users, searchQuery, teamFilter]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F8FAFF, #F5F3FF)',
  };

  const mainStyle: React.CSSProperties = {
    paddingTop: '80px',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '80px 20px 48px',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1F2937', margin: 0 }}>⚙️ Quản Trị Hệ Thống</h1>
        </div>
        <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 14 }}>
          Theo dõi và quản lý thành viên, lớp và các hoạt động thi đua Mân Côi
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: 6, background: 'white', borderRadius: 14, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', width: 'fit-content' }}>
          {[
            { key: 'overview', label: '📊 Tổng quan' },
            { key: 'users', label: `👥 Thành viên (${users.length})` },
            { key: 'tasks', label: '🎯 Nhiệm vụ' },
          ].map(tab => (
            <button key={tab.key} style={TAB_STYLE(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: TỔNG QUAN ─── */}
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
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🏆 Bảng xếp hạng lớp</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFF' }}>
                    {['Hạng', 'Lớp', 'Điểm', 'Thành viên'].map(h => (
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

            {/* Danger / Reset Tools */}
            <div style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(225, 29, 72, 0.06)', marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#9F1239', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠️ Quản lý dữ liệu thử nghiệm
                  </h2>
                  <p style={{ color: '#BE123C', fontSize: 13, margin: '4px 0 0 0' }}>
                    Dành cho Ban Quản trị: Xóa toàn bộ hạt đã sáng & điểm số thử nghiệm để chuẩn bị bước vào thi đua chính thức.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={resetting}
                  onClick={handleResetAllBeads}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: '#E11D48',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: resetting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
                    fontFamily: 'inherit',
                  }}
                >
                  {resetting ? '⏳ Đang xóa...' : '🔄 Xóa toàn bộ dữ liệu test về 0 (Hạt, Điểm, Streak)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: QUẢN LÝ THÀNH VIÊN (NGƯỜI DÙNG) ─── */}
        {activeTab === 'users' && (
          <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {/* Header controls: Search, Filter, Add Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1F2937', margin: 0 }}>👥 Quản lý tài khoản thiếu nhi</h2>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  Hiển thị: <strong>{filteredUsers.length}</strong> / {users.length} thành viên
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() => refreshData()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: 'white',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: refreshing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  <span>{refreshing ? '⏳' : '🔄'}</span> {refreshing ? 'Đang tải...' : 'Tải lại danh sách'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                    fontFamily: 'inherit',
                  }}
                >
                  <span>➕</span> Thêm thành viên mới
                </button>
              </div>
            </div>

            {loadError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 13.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>⚠️ Lỗi khi tải danh sách: {loadError}</span>
                <button
                  type="button"
                  onClick={() => refreshData()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#DC2626',
                    color: 'white',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Filter toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, padding: 14, background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm theo Tên Thánh, Họ Tên hoặc username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ minWidth: 160 }}>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Tất cả các lớp ({users.length})</option>
                  {teams.map(t => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || teamFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setTeamFilter('all'); }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: 'white',
                    color: '#64748B',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ✕ Đặt lại bộ lọc
                </button>
              )}
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>STT</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Họ và tên (Tên Thánh)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Tên đăng nhập</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Lớp</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Vai trò</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Hạt sáng</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                        Không tìm thấy thành viên nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: any, index: number) => (
                      <tr key={user.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 12 }}>{index + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1E293B' }}>
                          {user.display_name}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#2563EB', fontSize: 13 }}>
                          {user.username}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {user.team_name ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: user.team_color, display: 'inline-block' }} />
                              {user.team_name}
                            </span>
                          ) : <span style={{ color: '#9CA3AF' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 9px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                            background: user.role === 'ADMIN' ? '#EEF2FF' : user.role === 'LEADER' ? '#F0FDF4' : '#F1F5F9',
                            color: user.role === 'ADMIN' ? '#4338CA' : user.role === 'LEADER' ? '#065F46' : '#475569',
                          }}>
                            {user.role === 'ADMIN' ? 'Admin' : user.role === 'LEADER' ? 'GL Viên' : 'Thiếu nhi'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#F59E0B' }}>
                          {user.personal_points || 0}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              title="Sửa họ tên hoặc chuyển lớp"
                              onClick={() => openEditModal(user)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 7,
                                border: '1px solid #CBD5E1',
                                background: 'white',
                                color: '#0F172A',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Sửa / Đổi lớp
                            </button>
                            <button
                              type="button"
                              title="Đặt lại mật khẩu về 123456"
                              onClick={() => handleResetPassword(user)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 7,
                                border: '1px solid #FDE68A',
                                background: '#FFFBEB',
                                color: '#B45309',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              🔑 Reset MK
                            </button>
                            {user.role !== 'ADMIN' && (
                              <button
                                type="button"
                                title="Xóa tài khoản này"
                                onClick={() => handleDeleteUser(user)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 7,
                                  border: '1px solid #FECDD3',
                                  background: '#FFF1F2',
                                  color: '#E11D48',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: NHIỆM VỤ ─── */}
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

      {/* ─── MODAL: THÊM THÀNH VIÊN MỚI ─── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 480,
            padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                ➕ Thêm thành viên mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Họ và tên (kèm Tên Thánh) <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Maria Nguyễn Thị Khánh An"
                  value={newDisplayName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Tên đăng nhập (Username) <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: maria_nguyenthikhanhan"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'monospace', color: '#2563EB', boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4 }}>
                  💡 Tự động tạo không dấu. Các em dùng tên này để đăng nhập vào web.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Lớp tham gia <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <select
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
                    }}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Vai trò
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
                    }}
                  >
                    <option value="CHILD">Thiếu nhi</option>
                    <option value="LEADER">Giáo lý viên</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4 }}>
                  Mặc định là <strong>123456</strong>.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: '1px solid #CBD5E1',
                    background: 'white', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#2563EB', color: 'white', fontWeight: 700, fontSize: 14,
                    cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SỬA THÀNH VIÊN & CHUYỂN LỚP ─── */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 480,
            padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                ✏️ Chỉnh sửa thông tin thành viên
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                  Tên đăng nhập (Cố định)
                </label>
                <div style={{ padding: '9px 12px', background: '#F1F5F9', borderRadius: 10, fontFamily: 'monospace', color: '#475569', fontSize: 14 }}>
                  {editingUser.username}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Họ và tên hiển thị (kèm Tên Thánh) <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Chuyển lớp tham gia
                </label>
                <select
                  value={editTeamId}
                  onChange={(e) => setEditTeamId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
                  }}
                >
                  <option value="">— Chưa phân lớp —</option>
                  {teams.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4 }}>
                  💡 Điểm số của em sẽ tự động được tính cho lớp mới sau khi chuyển.
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Vai trò
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid #CBD5E1', fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
                  }}
                >
                  <option value="CHILD">Thiếu nhi</option>
                  <option value="LEADER">Giáo lý viên</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: '1px solid #CBD5E1',
                    background: 'white', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#2563EB', color: 'white', fontWeight: 700, fontSize: 14,
                    cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
