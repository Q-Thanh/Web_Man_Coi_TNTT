import React from 'react';
import Image from 'next/image';
import styles from './AppLogo.module.css';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function AppLogo({
  size = 'md',
  showText = true,
  title = 'Mân Côi',
  subtitle = 'Hành trình yêu thương',
  className = '',
}: AppLogoProps) {
  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 58,
    xl: 88,
  };

  const px = pixelSizes[size];

  return (
    <div className={`${styles.logoWrapper} ${styles[`size-${size}`]} ${className}`}>
      <div className={styles.iconWrapper}>
        <div className={styles.auraGlow} />
        <Image
          src="/logo.png"
          alt="Chuỗi Mân Côi"
          width={px}
          height={px}
          className={styles.iconImage}
          priority
        />
      </div>

      {showText && (
        <div className={styles.textGroup}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
