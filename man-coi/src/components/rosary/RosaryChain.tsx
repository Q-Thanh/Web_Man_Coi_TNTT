'use client';

import React, { useMemo, useState, useEffect } from 'react';
import styles from './rosary.module.css';
import { getMysteryProgress, MysteryProgressInfo, RosaryDecade } from '@/lib/rosaryMysteries';

export interface RosaryBeadData {
  position: number;
  type?: string;
  isLit: boolean;
  litAt?: string;
  isNew?: boolean;
}

export interface RosaryChainProps {
  beads: RosaryBeadData[];
  totalBeads?: number;
  smallBeads?: number;
  largeBeads?: number;
  onBeadClick?: (position: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

// ─── Mathematical Layout of the Classic 5-Decade Catholic Rosary ─────────────
// Structure:
// - Center: Blessed Virgin Mary (Đức Mẹ Ban Ơn) in an oval halo frame
// - The Loop: 5 Decades (Chục 1..5) with 10 small beads each, separated by 4 large divider beads + 1 Center Medallion
// - The Pendant (Tail): Medallion -> 1 Large bead -> 3 Small beads -> 1 Large bead -> Crucifix (Thánh Giá)

interface BeadPos {
  id: string;
  position: number; // 1 to 55 for gamification tracking
  type: 'small' | 'large' | 'medallion' | 'cross';
  x: number;
  y: number;
  decadeIndex?: number;
  beadInDecade?: number;
  name: string;
  prayer: string;
  meaning: string;
}

function calculateRosaryGeometry(width: number, height: number, mysteryInfo?: MysteryProgressInfo) {
  // Always center Rosary horizontally with generous radii to fill the screen
  const cx = width / 2;
  const ovalCY = height * 0.35;
  const rx = width * 0.40;
  const ry = height * 0.29;

  // Medallion at the bottom of the loop
  const medallionX = cx;
  const medallionY = ovalCY + ry;

  // The 5 decades around the ellipse
  // Gap at bottom for the medallion: angle gap of ~0.26 radians each side
  const bottomGap = 0.28;
  const startAngle = Math.PI / 2 + bottomGap; // Bottom-left starting clockwise
  const endAngle = Math.PI / 2 - bottomGap + 2 * Math.PI; // Bottom-right
  const totalSweep = endAngle - startAngle;

  const loopBeads: BeadPos[] = [];
  let globalBeadIndex = 1;

  // 5 decades = 5 groups of 10 small beads, with 4 large beads in between
  // Total units along loop = 5 * 10 (small) + 4 (large separators) = 54 slots
  const totalSlots = 5 * 10 + 4;
  const angleStep = totalSweep / (totalSlots + 1);

  let currentSlot = 1;

  for (let decade = 1; decade <= 5; decade++) {
    const decadeData = mysteryInfo?.mystery.decades[decade - 1];
    // 10 small beads for this decade
    for (let b = 1; b <= 10; b++) {
      const angle = startAngle + currentSlot * angleStep;
      const x = cx + rx * Math.cos(angle);
      const y = ovalCY + ry * Math.sin(angle);

      loopBeads.push({
        id: `small-${globalBeadIndex}`,
        position: globalBeadIndex,
        type: 'small',
        x,
        y,
        decadeIndex: decade,
        beadInDecade: b,
        name: `Hạt ${b} - Chục ${decadeData?.title || decade}`,
        prayer: 'Kinh Kính Mừng',
        meaning: decadeData ? `${decadeData.text}` : `Kính Mừng Maria đầy ơn phúc... (Hạt ${globalBeadIndex}/50)`,
      });

      globalBeadIndex++;
      currentSlot++;
    }

    // Large separator bead after decade 1, 2, 3, 4 (not after 5, which ends at medallion)
    if (decade < 5) {
      const angle = startAngle + currentSlot * angleStep;
      const x = cx + rx * Math.cos(angle);
      const y = ovalCY + ry * Math.sin(angle);

      // Large beads on loop: 52 (chục 1), 53 (chục 2), 54 (chục 3), 55 (chục 4)
      const largePos = 51 + decade;
      const nextDecadeData = mysteryInfo?.mystery.decades[decade];
      loopBeads.push({
        id: `large-dec-${decade}`,
        position: largePos,
        type: 'large',
        x,
        y,
        decadeIndex: decade,
        name: `Hạt lớn chục ${decade}`,
        prayer: 'Kinh Lạy Cha & Sáng Danh',
        meaning: nextDecadeData ? `Bắt đầu Chục ${nextDecadeData.title}: ${nextDecadeData.text}` : `Kết thúc chục ${decade} & Khởi đầu chục ${decade + 1}`,
      });

      currentSlot++;
    }
  }

  // ── Pendant (Chuỗi đuôi từ Thánh Giá lên Mề Đay) ───────────────────────────
  // Bottom to top:
  // 1. Cross (Thánh Giá)
  // 2. Large bead 1 (Hạt lớn đầu tiên - Kinh Lạy Cha: pos 51)
  // 3. 3 Small beads (3 Kinh Kính Mừng Tin-Cậy-Mến: pos 101, 102, 103)
  // 4. Large bead 2 (Hạt lớn trước Mề Đay: pos 56)
  // 5. Medallion (Mề Đay Đức Mẹ: pos 57)

  const pendantTopY = medallionY + 28;
  const pendantSpacing = 28;

  const pendantBeads: BeadPos[] = [
    // Medallion
    {
      id: 'medallion',
      position: 57,
      type: 'medallion',
      x: cx,
      y: medallionY,
      name: 'Mề Đay Đức Mẹ (Centerpiece)',
      prayer: 'Kinh Lạy Nữ Vương',
      meaning: 'Điểm kết nối 5 chục kinh Mân Côi với phần chuỗi đầu',
    },
    // Top large bead of pendant (under medallion)
    {
      id: 'pendant-large-2',
      position: 56,
      type: 'large',
      x: cx,
      y: pendantTopY,
      name: 'Hạt lớn trước Mề Đay',
      prayer: 'Kinh Sáng Danh & Lời nguyện Fatima',
      meaning: 'Sáng danh Đức Chúa Cha... và Lời nguyện Fatima',
    },
    // 3 small beads in pendant (Faith, Hope, Charity)
    {
      id: 'pendant-small-3',
      position: 103,
      type: 'small',
      x: cx,
      y: pendantTopY + pendantSpacing * 1,
      name: 'Hạt nhỏ thứ 3',
      prayer: 'Kinh Kính Mừng (Ơn Đức Mến)',
      meaning: 'Kính Mừng Maria - Cầu xin ơn Đức Mến vẹn toàn',
    },
    {
      id: 'pendant-small-2',
      position: 102,
      type: 'small',
      x: cx,
      y: pendantTopY + pendantSpacing * 1.9,
      name: 'Hạt nhỏ thứ 2',
      prayer: 'Kinh Kính Mừng (Ơn Đức Cậy)',
      meaning: 'Kính Mừng Maria - Cầu xin ơn Đức Cậy vững vàng',
    },
    {
      id: 'pendant-small-1',
      position: 101,
      type: 'small',
      x: cx,
      y: pendantTopY + pendantSpacing * 2.8,
      name: 'Hạt nhỏ thứ 1',
      prayer: 'Kinh Kính Mừng (Ơn Đức Tin)',
      meaning: 'Kính Mừng Maria - Cầu xin ơn Đức Tin sâu sắc',
    },
    // Bottom large bead (above crucifix)
    {
      id: 'pendant-large-1',
      position: 51,
      type: 'large',
      x: cx,
      y: pendantTopY + pendantSpacing * 3.8,
      name: 'Hạt lớn đầu tiên',
      prayer: 'Kinh Lạy Cha',
      meaning: 'Cầu theo ý chỉ của Đức Giáo Hoàng',
    },
  ];

  const crossY = pendantTopY + pendantSpacing * 4.8;

  return {
    cx,
    ovalCY,
    rx,
    ry,
    medallionX,
    medallionY,
    loopBeads,
    pendantBeads,
    crossX: cx,
    crossY,
  };
}

export default function RosaryChain({
  beads,
  totalBeads = 55,
  smallBeads,
  largeBeads,
  onBeadClick,
  size = 'lg',
  showLabels = true,
}: RosaryChainProps) {
  const [selectedBead, setSelectedBead] = useState<BeadPos | null>(null);
  const [selectedDecadeNumber, setSelectedDecadeNumber] = useState<number | null>(null);

  // Compute mystery and decade progress from total small and large beads
  const currentTotalSmall = smallBeads ?? beads.filter(b => b.type === 'small' && b.isLit).length;
  const currentTotalLarge = largeBeads ?? beads.filter(b => b.type === 'large' && b.isLit).length;
  const mysteryInfo = useMemo(
    () => getMysteryProgress(currentTotalSmall, currentTotalLarge),
    [currentTotalSmall, currentTotalLarge]
  );

  // Automatically reset any manual preview when bead progress advances so the card auto-follows
  useEffect(() => {
    setSelectedDecadeNumber(null);
  }, [mysteryInfo.currentDecadeNumber, currentTotalSmall, currentTotalLarge]);

  const displayedDecadeNumber = selectedDecadeNumber ?? mysteryInfo.currentDecadeNumber;
  const displayedDecade = mysteryInfo.mystery.decades[displayedDecadeNumber - 1];
  const isActiveDecade = displayedDecadeNumber === mysteryInfo.currentDecadeNumber;

  // Optimized SVG canvas dimensions: 580x740 gives the centered Rosary full width on both mobile and desktop
  const dimensions = useMemo(() => {
    return { width: 580, height: 740 };
  }, []);

  const { width, height } = dimensions;

  const geo = useMemo(
    () => calculateRosaryGeometry(width, height, mysteryInfo),
    [width, height, mysteryInfo]
  );

  // Map of lit bead positions -> actual bead_type from DB (small or large)
  const litMap = useMemo(() => {
    const map = new Map<number, string>(); // position -> bead_type
    beads.forEach(b => { if (b.isLit) map.set(b.position, b.type || 'small'); });
    return map;
  }, [beads]);

  const litSmallCount = useMemo(() => {
    return beads.filter(b => b.type === 'small' && b.isLit).length;
  }, [beads]);

  const litLargeCount = useMemo(() => {
    return beads.filter(b => b.type === 'large' && b.isLit).length;
  }, [beads]);

  const newSet = useMemo(() => {
    const s = new Set<number>();
    beads.forEach(b => { if (b.isNew) s.add(b.position); });
    return s;
  }, [beads]);

  const litCount = beads.filter(b => b.isLit).length;

  // Build SVG path for the chain wire
  const chainPathLoop = useMemo(() => {
    if (geo.loopBeads.length === 0) return '';
    const points = geo.loopBeads.map(b => `${b.x},${b.y}`).join(' L ');
    return `M ${geo.medallionX},${geo.medallionY} L ${points} L ${geo.medallionX},${geo.medallionY}`;
  }, [geo]);

  const chainPathPendant = useMemo(() => {
    const p1 = `${geo.medallionX},${geo.medallionY}`;
    const points = geo.pendantBeads.map(b => `${b.x},${b.y}`).join(' L ');
    const crossTop = `${geo.crossX},${geo.crossY}`;
    return `M ${p1} L ${points} L ${crossTop}`;
  }, [geo]);

  const handleBeadClick = (bead: BeadPos) => {
    setSelectedBead(bead);
    onBeadClick?.(bead.position);
  };

  return (
    <div className={styles.rosaryWrapper}>
      {/* Header controls */}
      <div className={styles.controlsBar}>
        <div className={styles.progressSummary}>
          <span className={styles.rosaryIconBadge}>{mysteryInfo.mystery.icon}</span>
          <div>
            <div className={styles.progressSummaryTitle}>
              {mysteryInfo.mystery.name} (Vòng {mysteryInfo.roundNumber})
            </div>
            <div className={styles.progressSummarySub}>
              Vòng này: <strong>{mysteryInfo.beadsInRound}</strong>/50 hạt nhỏ • Tổng tích lũy: <strong>{currentTotalSmall}</strong> hạt
            </div>
          </div>
        </div>
      </div>

      {/* ─── THẺ MẦU NHIỆM & SUY NIỆM CHỤC KINH (NẰM PHÍA TRÊN CHUỖI MÂN CÔI) ─── */}
      <div className={styles.mysteryCardWrapper}>
        <div className={styles.mysteryCard} style={{ borderColor: mysteryInfo.mystery.color }}>
          {/* Header: Season & Round Badge */}
          <div className={styles.mysteryCardHeader} style={{ background: mysteryInfo.mystery.bgGradient }}>
            <div className={styles.mysterySeasonTag}>
              <span className={styles.mysteryIcon}>{mysteryInfo.mystery.icon}</span>
              <span className={styles.mysteryName}>{mysteryInfo.mystery.name}</span>
            </div>
            <span className={styles.mysteryRoundBadge} style={{ background: mysteryInfo.mystery.badgeBg }}>
              Vòng {mysteryInfo.roundNumber}
            </span>
          </div>

          {/* Body: Current Decade & Meditation */}
          <div className={styles.mysteryBody}>
            <div className={styles.mysteryDecadeTitleRow}>
              <div className={styles.decadeBadge} style={{ color: mysteryInfo.mystery.color }}>
                Chục {displayedDecade.title} (Hạt {(displayedDecadeNumber - 1) * 10 + 1} – {displayedDecadeNumber * 10})
              </div>
              {isActiveDecade ? (
                <span className={styles.activePulseBadge}>Đang đọc</span>
              ) : (
                <button
                  type="button"
                  className={styles.backToActiveBtn}
                  onClick={() => setSelectedDecadeNumber(null)}
                  title="Quay lại chục đang đọc theo tiến độ chuỗi"
                >
                  ↩ Về chục đang đọc
                </button>
              )}
            </div>

            {/* Meditation Text from User */}
            <div className={styles.meditationText}>
              &ldquo;{displayedDecade.text}&rdquo;
            </div>

            {/* Decade Progress (if active) */}
            {isActiveDecade && (
              <div className={styles.decadeProgressWrap}>
                <div className={styles.decadeProgressText}>
                  <span>Tiến độ chục này:</span>
                  <strong>{mysteryInfo.decadeProgress}/10 hạt nhỏ</strong>
                </div>
                <div className={styles.decadeProgressBar}>
                  <div
                    className={styles.decadeProgressFill}
                    style={{
                      width: `${(mysteryInfo.decadeProgress / 10) * 100}%`,
                      backgroundColor: mysteryInfo.mystery.color,
                    }}
                  />
                </div>
                {mysteryInfo.decadeProgress === 10 && (
                  <div className={styles.decadeCompleteNote}>
                    ✨ Đã xong 10 hạt nhỏ! Đọc 1 Kinh Lạy Cha (Hạt to) để qua {mysteryInfo.currentDecadeNumber < 5 ? `Chục ${mysteryInfo.mystery.decades[mysteryInfo.currentDecadeNumber]?.title}` : 'Vòng Mầu Nhiệm mới'}!
                  </div>
                )}
              </div>
            )}

            {/* 5 Decade Navigation Buttons */}
            <div className={styles.decadeNavList}>
              {mysteryInfo.mystery.decades.map((dec) => {
                const isThisActive = dec.decadeNumber === mysteryInfo.currentDecadeNumber;
                const isSelected = dec.decadeNumber === displayedDecadeNumber;
                const isPassed = dec.decadeNumber < mysteryInfo.currentDecadeNumber;

                return (
                  <button
                    key={dec.decadeNumber}
                    type="button"
                    className={`${styles.decadeNavBtn} ${isSelected ? styles.decadeNavBtnSelected : ''} ${isThisActive ? styles.decadeNavBtnActive : ''}`}
                    onClick={() => {
                      if (dec.decadeNumber === displayedDecadeNumber) {
                        setSelectedDecadeNumber(null);
                      } else {
                        setSelectedDecadeNumber(dec.decadeNumber);
                      }
                    }}
                    title={dec.text}
                  >
                    <span>{dec.decadeNumber}</span>
                    {isPassed && <span className={styles.checkDone}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main SVG Container: Chuỗi Mân Côi nằm phía dưới, phóng to trọn vẹn */}
      <div className={styles.svgContainer}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          className={styles.rosarySvg}
        >
          <defs>
            {/* Filter: Glow Gold */}
            <filter id="glowGoldHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Filter: Glow Blue Heavenly */}
            <filter id="glowBlueHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradients */}
            <radialGradient id="haloBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#FEF3C7" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#E0F2FE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="goldBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <linearGradient id="blueBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="40%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            <linearGradient id="unlitBead" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            <linearGradient id="goldChainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            <radialGradient id="shineReflect" cx="30%" cy="30%" r="40%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* Clip path for the Blessed Mother inside oval */}
            <clipPath id="maryOvalClip">
              <ellipse
                cx={geo.cx}
                cy={geo.ovalCY}
                rx={geo.rx * 0.78}
                ry={geo.ry * 0.88}
              />
            </clipPath>
          </defs>

          {/* ─── 1. CENTER IMAGE OF OUR LADY (ĐỨC MẸ BAN ƠN) ─── */}
          {/* Radiant Halo background */}
          <ellipse
            cx={geo.cx}
            cy={geo.ovalCY}
            rx={geo.rx * 0.82}
            ry={geo.ry * 0.92}
            fill="url(#haloBgGrad)"
          />

          {/* Golden Aura Ring around Our Lady */}
          <ellipse
            cx={geo.cx}
            cy={geo.ovalCY}
            rx={geo.rx * 0.78}
            ry={geo.ry * 0.88}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* Image of Our Lady of Graces */}
          <g clipPath="url(#maryOvalClip)">
            <image
              href="/images/duc-me.jpg"
              x={geo.cx - geo.rx * 0.82}
              y={geo.ovalCY - geo.ry * 0.92}
              width={geo.rx * 1.64}
              height={geo.ry * 1.84}
              preserveAspectRatio="xMidYMid slice"
              className={styles.maryImage}
            />
          </g>

          {/* Soft inner vignette/glow over the image */}
          <ellipse
            cx={geo.cx}
            cy={geo.ovalCY}
            rx={geo.rx * 0.78}
            ry={geo.ry * 0.88}
            fill="none"
            stroke="url(#goldChainGrad)"
            strokeWidth="2.5"
          />

          {/* ─── 2. ROSARY STRING / WIRE (DÂY NỐI CHUỖI) ─── */}
          {/* Main Decade Loop Chain */}
          <path
            d={chainPathLoop}
            fill="none"
            stroke="url(#goldChainGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.rosaryChainLine}
          />

          {/* Pendant Chain */}
          <path
            d={chainPathPendant}
            fill="none"
            stroke="url(#goldChainGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.rosaryChainLine}
          />

          {/* ─── 3. BEADS (HẠT MÂN CÔI) ─── */}
          {/* Render Loop Beads */}
          {geo.loopBeads.map((bead) => {
            const litType = litMap.get(bead.position); // undefined = unlit
            const isLit = litType !== undefined;
            const isNew = newSet.has(bead.position);
            // Use actual bead_type from data if available, else fall back to geometry type
            const displayType = litType || bead.type;
            const radius = bead.type === 'large' ? 12 : 7.5;
            const isSelected = selectedBead?.id === bead.id;

            return (
              <g
                key={bead.id}
                className={styles.beadGroup}
                onClick={() => handleBeadClick(bead)}
              >
                {/* Glow aura when lit */}
                {isLit && (
                  <circle
                    cx={bead.x}
                    cy={bead.y}
                    r={radius + (displayType === 'large' ? 8 : 5)}
                    fill={displayType === 'large' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.35)'}
                    filter="url(#glowGoldHoly)"
                  />
                )}

                {/* Main Bead Circle */}
                <circle
                  cx={bead.x}
                  cy={bead.y}
                  r={radius}
                  fill={isLit ? (displayType === 'large' ? 'url(#goldBeadLit)' : 'url(#blueBeadLit)') : 'url(#unlitBead)'}
                  stroke={isSelected ? '#EF4444' : isLit ? (displayType === 'large' ? '#B45309' : '#1D4ED8') : '#475569'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className={`${styles.beadCircle} ${isLit ? styles.beadLitAnimated : ''}`}
                />

                {/* 3D Highlight Shine */}
                <circle
                  cx={bead.x - radius * 0.3}
                  cy={bead.y - radius * 0.3}
                  r={radius * 0.35}
                  fill="url(#shineReflect)"
                  pointerEvents="none"
                />

                {/* Sparkles on newly lit */}
                {isNew && (
                  <text x={bead.x - 6} y={bead.y - radius - 2} className={styles.sparkleEmoji}>
                    ✨
                  </text>
                )}

                <title>{`${bead.name}: ${bead.prayer} (${isLit ? 'Đã sáng ✓' : 'Chưa sáng'})`}</title>
              </g>
            );
          })}

          {/* Render Pendant Beads */}
          {geo.pendantBeads.map((bead) => {
            const isMedallion = bead.type === 'medallion';
            let isLit = false;
            if (isMedallion) {
              isLit = litSmallCount >= 50 && litLargeCount >= 5;
            } else if (bead.type === 'small') {
              if (bead.position === 101) isLit = litSmallCount >= 1;
              else if (bead.position === 102) isLit = litSmallCount >= 2;
              else if (bead.position === 103) isLit = litSmallCount >= 3;
            } else {
              isLit = litMap.has(bead.position);
            }

            const isNew = newSet.has(bead.position);
            const radius = isMedallion ? 16 : bead.type === 'large' ? 12 : 8;
            const isSelected = selectedBead?.id === bead.id;

            return (
              <g
                key={bead.id}
                className={styles.beadGroup}
                onClick={() => handleBeadClick(bead)}
              >
                {/* Glow aura */}
                {isLit && (
                  <circle
                    cx={bead.x}
                    cy={bead.y}
                    r={radius + (bead.type === 'large' || isMedallion ? 8 : 5)}
                    fill={bead.type === 'large' || isMedallion ? 'rgba(245, 158, 11, 0.45)' : 'rgba(59, 130, 246, 0.35)'}
                    filter={bead.type === 'large' || isMedallion ? 'url(#glowGoldHoly)' : 'url(#glowBlueHoly)'}
                  />
                )}

                {/* Medallion or Bead */}
                {isMedallion ? (
                  // Medallion Mề Đay Đức Mẹ
                  <g>
                    <circle
                      cx={bead.x}
                      cy={bead.y}
                      r={radius}
                      fill={isLit ? 'url(#goldBeadLit)' : 'url(#unlitBead)'}
                      stroke={isLit ? '#B45309' : '#475569'}
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={bead.x}
                      cy={bead.y}
                      r={radius - 3}
                      fill="none"
                      stroke={isLit ? '#FEF08A' : '#94A3B8'}
                      strokeWidth="1"
                      strokeDasharray="2 1"
                    />
                    <text
                      x={bead.x}
                      y={bead.y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isLit ? '#78350F' : '#475569'}
                      fontWeight="900"
                    >
                      M
                    </text>
                  </g>
                ) : (
                  <circle
                    cx={bead.x}
                    cy={bead.y}
                    r={radius}
                    fill={isLit ? (bead.type === 'large' ? 'url(#goldBeadLit)' : 'url(#blueBeadLit)') : 'url(#unlitBead)'}
                    stroke={isSelected ? '#EF4444' : isLit ? (bead.type === 'large' ? '#B45309' : '#1D4ED8') : '#475569'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className={`${styles.beadCircle} ${isLit ? styles.beadLitAnimated : ''}`}
                  />
                )}

                {/* Shine */}
                <circle
                  cx={bead.x - radius * 0.3}
                  cy={bead.y - radius * 0.3}
                  r={radius * 0.35}
                  fill="url(#shineReflect)"
                  pointerEvents="none"
                />

                {isNew && (
                  <text x={bead.x - 6} y={bead.y - radius - 2} className={styles.sparkleEmoji}>
                    ✨
                  </text>
                )}

                <title>{`${bead.name}: ${bead.prayer} (${isLit ? 'Đã sáng ✓' : 'Chưa sáng'})`}</title>
              </g>
            );
          })}

          {/* ─── 4. CRUCIFIX (CÂY THÁNH GIÁ) ─── */}
          <g
            className={styles.crucifixGroup}
            onClick={() =>
              handleBeadClick({
                id: 'crucifix',
                position: 0,
                type: 'cross',
                x: geo.crossX,
                y: geo.crossY,
                name: 'Cây Thánh Giá',
                prayer: 'Dấu Thánh Giá & Kinh Tin Kính',
                meaning: 'Nhân danh Cha và Con và Thánh Thần... Tôi tin kính Đức Chúa Trời...',
              })
            }
          >
            {/* Cross Drop Shadow & Glow */}
            <rect
              x={geo.crossX - 5}
              y={geo.crossY + 2}
              width="10"
              height="54"
              rx="3"
              fill="url(#goldChainGrad)"
              stroke="#78350F"
              strokeWidth="1.5"
            />
            <rect
              x={geo.crossX - 20}
              y={geo.crossY + 14}
              width="40"
              height="10"
              rx="3"
              fill="url(#goldChainGrad)"
              stroke="#78350F"
              strokeWidth="1.5"
            />
            {/* INRI Plate */}
            <rect
              x={geo.crossX - 7}
              y={geo.crossY + 5}
              width="14"
              height="6"
              rx="1"
              fill="#FEF3C7"
              stroke="#B45309"
              strokeWidth="0.5"
            />
            <text
              x={geo.crossX}
              y={geo.crossY + 10}
              textAnchor="middle"
              fontSize="5"
              fontWeight="bold"
              fill="#78350F"
            >
              INRI
            </text>

            {/* Corpus Figure (Chúa Giêsu trên Thánh Giá) */}
            <ellipse cx={geo.crossX} cy={geo.crossY + 24} rx="4" ry="7" fill="#FEF08A" opacity="0.9" />
            <circle cx={geo.crossX} cy={geo.crossY + 17} r="3" fill="#FEF08A" opacity="0.9" />
            <line
              x1={geo.crossX - 10}
              y1={geo.crossY + 18}
              x2={geo.crossX + 10}
              y2={geo.crossY + 18}
              stroke="#FEF08A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <title>Cây Thánh Giá: Dấu Thánh Giá & Kinh Tin Kính</title>
          </g>
        </svg>
      </div>

      {/* Detail Dialog / Active Bead Card */}
      {selectedBead && (
        <div className={styles.activeBeadCard}>
          <div className={styles.activeBeadHeader}>
            <div className={styles.activeBeadIcon}>
              {selectedBead.type === 'cross' ? '✟' : selectedBead.type === 'medallion' ? '👑' : selectedBead.type === 'large' ? '🌟' : '📿'}
            </div>
            <div>
              <div className={styles.activeBeadTitle}>{selectedBead.name}</div>
              <div className={styles.activeBeadPrayer}>{selectedBead.prayer}</div>
            </div>
            <button className={styles.closeActiveBtn} onClick={() => setSelectedBead(null)}>✕</button>
          </div>
          <div className={styles.activeBeadMeaning}>{selectedBead.meaning}</div>
        </div>
      )}

      {/* Progress Bars */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBarItem}>
          <span className={styles.progTitle}>50 Hạt nhỏ (Kính Mừng)</span>
          <div className={styles.track}>
            <div
              className={styles.fillSmall}
              style={{ width: `${(Math.min(litSmallCount, 50) / 50) * 100}%` }}
            />
          </div>
          <span className={styles.num}>{Math.min(litSmallCount, 50)}/50</span>
        </div>

        <div className={styles.progressBarItem}>
          <span className={styles.progTitle}>Hạt lớn (Kinh Lạy Cha)</span>
          <div className={styles.track}>
            <div
              className={styles.fillLarge}
              style={{ width: `${(Math.min(litLargeCount, 5) / 5) * 100}%` }}
            />
          </div>
          <span className={styles.num}>{Math.min(litLargeCount, 5)}/5</span>
        </div>
      </div>
    </div>
  );
}
