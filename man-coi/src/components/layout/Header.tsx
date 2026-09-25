'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getAvatarInitials } from '@/lib/utils';
import styles from './Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Logo */}
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>📿</span>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Mân Côi</span>
            <span className={styles.logoSub}>Hành trình yêu thương</span>
          </div>
        </Link>

        {/* Nav links (desktop) */}
        <nav className={styles.nav}>
          <NavLink href="/dashboard" active={pathname === '/dashboard'}>🏠 Trang chủ</NavLink>
          <NavLink href="/thi-dua" active={pathname === '/thi-dua'}>🏆 Thi đua</NavLink>
          <NavLink href="/doi" active={pathname.startsWith('/doi')}>👥 Đội của con</NavLink>
          <NavLink href="/huy-hieu" active={pathname === '/huy-hieu'}>🏅 Huy hiệu</NavLink>
          <NavLink href="/phan-thuong" active={pathname === '/phan-thuong'}>🎁 Phần thưởng</NavLink>
          {(session.user.role === 'ADMIN' || session.user.role === 'LEADER') && (
            <NavLink href="/admin" active={pathname.startsWith('/admin')}>⚙️ Quản lý</NavLink>
          )}
        </nav>

        {/* User menu */}
        <div className={styles.userArea}>
          {/* Points badge */}
          <div className={styles.pointsBadge}>
            <span>⭐</span>
            <span className={styles.pointsNum}>{(session.user.personalPoints || 0).toLocaleString('vi-VN')}</span>
          </div>

          {/* Avatar dropdown */}
          <div className={styles.avatarWrap} onClick={() => setMenuOpen(v => !v)}>
            <div
              className={styles.avatarPlaceholder}
              style={{
                background: session.user.teamColor
                  ? `linear-gradient(135deg, ${session.user.teamColor}, ${session.user.teamColor}99)`
                  : 'linear-gradient(135deg, #2563EB, #7C3AED)',
              }}
            >
              {getAvatarInitials(session.user.name || '?')}
            </div>
            <span className={styles.dropIcon}>▾</span>

            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropHeader}>
                  <strong>{session.user.name}</strong>
                  <span className={styles.dropTeam}>{session.user.teamName || 'Chưa có đội'}</span>
                </div>
                <Link href="/ho-so" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                  👤 Hồ sơ cá nhân
                </Link>
                <button
                  className={`${styles.dropItem} ${styles.dropItemDanger}`}
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className={styles.mobileMenuBtn} onClick={() => setMenuOpen(v => !v)}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className={styles.mobileNav}>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}>🏠 Trang chủ</Link>
          <Link href="/thi-dua" onClick={() => setMenuOpen(false)}>🏆 Thi đua</Link>
          <Link href="/doi" onClick={() => setMenuOpen(false)}>👥 Đội của con</Link>
          <Link href="/huy-hieu" onClick={() => setMenuOpen(false)}>🏅 Huy hiệu</Link>
          <Link href="/phan-thuong" onClick={() => setMenuOpen(false)}>🎁 Phần thưởng</Link>
          <Link href="/ho-so" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
          <button className={styles.mobileSignOut} onClick={() => signOut({ callbackUrl: '/' })}>
            🚪 Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}>
      {children}
    </Link>
  );
}
