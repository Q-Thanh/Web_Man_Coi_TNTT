'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import styles from './login.module.css';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return null;

  return (
    <div className={styles.page}>
      {/* Background decorations */}
      <div className={styles.bgDecor}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
        <div className={styles.bgCircle3} />
      </div>

      {/* Floating beads decoration */}
      <div className={styles.floatingBeads}>
        {['📿', '✨', '🙏', '⭐', '🌹'].map((emoji, i) => (
          <span key={i} className={styles.floatBead} style={{ animationDelay: `${i * 0.8}s` }}>
            {emoji}
          </span>
        ))}
      </div>

      <div className={styles.loginCard}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <AppLogo size="xl" title="Chuỗi Mân Côi" subtitle="Hành trình yêu thương" />
        </div>

        <h2 className={styles.formTitle}>Đăng nhập</h2>
        <p className={styles.formSub}>Bắt đầu hành trình cầu nguyện của bạn</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên đăng nhập</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mật khẩu</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              '📿 Bắt đầu hành trình'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
