'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  if (status === 'loading') return null;

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span>📿</span>
          <strong>Chuỗi Mân Côi</strong>
        </div>
        <Link href="/login" className={styles.navBtn}>Đăng nhập</Link>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          {/* Floating rosary beads decoration */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={styles.floatBead}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                width: i % 5 === 0 ? 18 : 12,
                height: i % 5 === 0 ? 18 : 12,
                opacity: 0.1 + Math.random() * 0.2,
              }}
            />
          ))}
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>📿</div>
          <h1 className={styles.heroTitle}>
            Mỗi hạt – Một bước yêu thương
          </h1>
          <p className={styles.heroSub}>
            Cùng nhau xây dựng thói quen cầu nguyện,<br />
            việc tốt và tinh thần đoàn kết.
          </p>
          <div className={styles.heroBtns}>
            <Link href="/login" className={styles.heroBtn}>
              📿 Bắt đầu hành trình
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}><strong>55</strong><span>hạt Mân Côi</span></div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}><strong>6</strong><span>đội thi đua</span></div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}><strong>∞</strong><span>hạt đã sáng</span></div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Cách hoạt động</h2>
          <div className={styles.featuresGrid}>
            {[
              { icon: '🎯', title: 'Hoàn thành nhiệm vụ', desc: 'Đọc kinh, làm việc tốt, tham dự Thánh lễ... mỗi việc tốt đều được ghi nhận' },
              { icon: '📿', title: 'Hạt Mân Côi sáng lên', desc: 'Mỗi khi hoàn thành, một hạt trên chuỗi Mân Côi cá nhân của bạn sẽ được thắp sáng' },
              { icon: '⭐', title: 'Nhận điểm & huy hiệu', desc: 'Tích lũy điểm, nhận huy hiệu đặc biệt và các phần thưởng theo cột mốc' },
              { icon: '👥', title: 'Thi đua cùng đội', desc: 'Đóng góp điểm cho đội, cùng nhau chinh phục bảng xếp hạng với tinh thần đoàn kết' },
            ].map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rosary showcase */}
      <section className={styles.showcase}>
        <div className={styles.container}>
          <div className={styles.showcaseGrid}>
            <div className={styles.showcaseText}>
              <h2>Chuỗi Mân Côi<br /><span className={styles.grad}>của riêng bạn</span></h2>
              <p>55 hạt tương tác – mỗi hạt sáng lên là một việc tốt bạn đã làm. Nhìn vào chuỗi là biết mình đã đi được bao xa trên hành trình yêu thương.</p>
              <ul className={styles.showcaseList}>
                <li>📿 50 hạt nhỏ + 5 hạt lớn cột mốc</li>
                <li>✨ Hiệu ứng ánh sáng khi hoàn thành</li>
                <li>📊 Tiến trình cá nhân rõ ràng</li>
                <li>🏆 5 hạt lớn = 5 cột mốc quan trọng</li>
              </ul>
            </div>
            <div className={styles.showcaseVisual}>
              <div className={styles.rosaryPreview}>
                <div className={styles.previewTitle}>Hành trình Mân Côi</div>
                {/* Simple visual representation */}
                <div className={styles.previewBeads}>
                  {Array.from({ length: 50 }, (_, i) => (
                    <div
                      key={i}
                      className={`${styles.previewBead} ${i < 27 ? styles.previewBeadLit : ''}`}
                    />
                  ))}
                </div>
                <div className={styles.previewLarge}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`${styles.previewBeadBig} ${i < 1 ? styles.previewBeadBigLit : ''}`}
                    />
                  ))}
                </div>
                <div className={styles.previewLabel}>27 / 55 hạt đã sáng ✨</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className={styles.teams}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>6 Đội Thi Đua</h2>
          <div className={styles.teamsGrid}>
            {[
              { name: 'Thánh Gia', color: '#2563EB', icon: '👨‍👩‍👧' },
              { name: 'Fatima', color: '#7C3AED', icon: '🌹' },
              { name: 'Lộ Đức', color: '#059669', icon: '💧' },
              { name: 'Guadalupe', color: '#D97706', icon: '🌺' },
              { name: 'Nazareth', color: '#DC2626', icon: '⭐' },
              { name: 'Cana', color: '#0891B2', icon: '🍷' },
            ].map(team => (
              <div key={team.name} className={styles.teamChip} style={{ borderColor: team.color }}>
                <span>{team.icon}</span>
                <span style={{ color: team.color, fontWeight: 700 }}>{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Sẵn sàng bắt đầu hành trình?</h2>
        <p>Mỗi hạt bạn thắp sáng là một lời cầu nguyện, một việc tốt, một bước tiến.</p>
        <Link href="/login" className={styles.ctaBtn}>
          📿 Đăng nhập ngay
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>📿 Chuỗi Mân Côi – Minigame thiếu nhi Công giáo</p>
        <p style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>Mỗi hạt – Một bước yêu thương</p>
      </footer>
    </div>
  );
}
