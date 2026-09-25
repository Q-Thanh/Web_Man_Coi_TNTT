'use client';

import React, { useEffect, useRef } from 'react';
import styles from './rosary.module.css';

interface BeadData {
  position: number; // 1-55
  type: 'small' | 'large';
  isLit: boolean;
  litAt?: string;
  isNew?: boolean; // just lit animation
}

interface RosaryBeadProps {
  bead: BeadData;
  x: number;
  y: number;
  onClick?: (position: number) => void;
  showTooltip?: boolean;
}

export function RosaryBead({ bead, x, y, onClick, showTooltip = true }: RosaryBeadProps) {
  const radius = bead.type === 'large' ? 14 : 9;

  const getMilestoneLabel = (pos: number) => {
    const labels: Record<number, string> = {
      51: 'Khởi đầu',
      52: 'Bền bỉ',
      53: 'Chăm chỉ',
      54: 'Quyết tâm',
      55: 'Hoàn thành',
    };
    return labels[pos];
  };

  const beadClass = [
    styles.bead,
    bead.type === 'large' ? styles.beadLarge : styles.beadSmall,
    bead.isLit ? styles.beadLit : styles.beadUnlit,
    bead.isNew ? styles.beadNew : '',
  ].join(' ');

  const title = bead.type === 'large'
    ? `Hạt lớn ${bead.position - 50}: ${getMilestoneLabel(bead.position)} ${bead.isLit ? '✓' : ''}`
    : `Hạt ${bead.position} ${bead.isLit ? '✓' : '○'}`;

  return (
    <g
      className={styles.beadGroup}
      onClick={() => onClick?.(bead.position)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Glow filter for lit beads */}
      {bead.isLit && (
        <circle
          cx={x}
          cy={y}
          r={radius + (bead.type === 'large' ? 8 : 5)}
          className={bead.type === 'large' ? styles.glowGold : styles.glowBlue}
        />
      )}

      {/* Main bead */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        className={beadClass}
      />

      {/* Shine highlight */}
      {bead.isLit && (
        <circle
          cx={x - radius * 0.3}
          cy={y - radius * 0.3}
          r={radius * 0.28}
          className={styles.beadShine}
        />
      )}

      {/* Star sparkle for newly lit */}
      {bead.isNew && (
        <>
          <text x={x - radius - 8} y={y - radius - 4} className={styles.sparkle}>✨</text>
          <text x={x + radius + 2} y={y - radius - 4} className={styles.sparkle2}>✨</text>
        </>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <title>{title}</title>
      )}
    </g>
  );
}
