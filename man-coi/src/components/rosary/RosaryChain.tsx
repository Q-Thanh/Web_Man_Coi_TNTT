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
// - The Pendant (Tail): Medallion -> 3 Small beads -> 1 Large bead -> Crucifix (Thánh Giá)

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
  // Center Rosary horizontally with an elegant, tall vertical oval shape
  const cx = width / 2;
  const ovalCY = height * 0.36; // 274px
  const rx = width * 0.36; // 180px on 500px width
  const ry = height * 0.315; // 240px on 760px height

  // Medallion at the bottom of the loop
  const medallionX = cx;
  const medallionY = ovalCY + ry; // 514px

  // The 5 decades around the ellipse
  const bottomGap = 0.28;
  const startAngle = Math.PI / 2 + bottomGap; // Bottom-left starting clockwise
  const endAngle = Math.PI / 2 - bottomGap + 2 * Math.PI; // Bottom-right
  const totalSweep = endAngle - startAngle;

  const loopBeads: BeadPos[] = [];
  let globalBeadIndex = 1;

  // 5 decades = 5 groups of 10 small beads, with 4 large beads in between
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

    // Large separator bead after decade 1, 2, 3, 4
    if (decade < 5) {
      const angle = startAngle + currentSlot * angleStep;
      const x = cx + rx * Math.cos(angle);
      const y = ovalCY + ry * Math.sin(angle);

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
  const pendantBeads: BeadPos[] = [
    // Medallion (Mề Đay Đức Mẹ)
    {
      id: 'medallion',
      position: 57,
      type: 'medallion',
      x: cx,
      y: medallionY,
      name: 'Mề Đay Đức Mẹ (Centerpiece)',
      prayer: 'Kinh Lạy Nữ Vương',
      meaning: 'Đọc Kinh Lạy Nữ Vương, Kinh Trông Cậy và Các Lời Nguyện Tắt',
    },
    // 3 small beads in pendant (Faith, Hope, Charity)
    {
      id: 'pendant-small-3',
      position: 103,
      type: 'small',
      x: cx,
      y: medallionY + 46,
      name: 'Hạt nhỏ thứ 3 (Ơn Đức Mến)',
      prayer: 'Kinh Kính Mừng (Ơn Đức Mến)',
      meaning: 'Kinh Kính Mừng - Cầu xin ơn Đức Mến vẹn toàn',
    },
    {
      id: 'pendant-small-2',
      position: 102,
      type: 'small',
      x: cx,
      y: medallionY + 70,
      name: 'Hạt nhỏ thứ 2 (Ơn Đức Cậy)',
      prayer: 'Kinh Kính Mừng (Ơn Đức Cậy)',
      meaning: 'Kinh Kính Mừng - Cầu xin ơn Đức Cậy vững vàng',
    },
    {
      id: 'pendant-small-1',
      position: 101,
      type: 'small',
      x: cx,
      y: medallionY + 94,
      name: 'Hạt nhỏ thứ 1 (Ơn Đức Tin)',
      prayer: 'Kinh Kính Mừng (Ơn Đức Tin)',
      meaning: 'Kinh Kính Mừng - Cầu xin ơn Đức Tin sâu sắc',
    },
    // Bottom large bead (above crucifix)
    {
      id: 'pendant-large-1',
      position: 51,
      type: 'large',
      x: cx,
      y: medallionY + 128,
      name: 'Hạt lớn đầu tiên',
      prayer: 'Kinh Lạy Cha (Khởi đầu)',
      meaning: 'Đọc Kinh Lạy Cha khởi đầu chuỗi',
    },
  ];

  const crossY = medallionY + 162;

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

  // Automatically reset any manual preview when bead progress advances
  useEffect(() => {
    setSelectedDecadeNumber(null);
  }, [mysteryInfo.currentDecadeNumber, currentTotalSmall, currentTotalLarge]);

  const displayedDecadeNumber = selectedDecadeNumber ?? mysteryInfo.currentDecadeNumber;
  const displayedDecade = mysteryInfo.mystery.decades[displayedDecadeNumber - 1];
  const isActiveDecade = displayedDecadeNumber === mysteryInfo.currentDecadeNumber;

  // Dimensions
  const dimensions = useMemo(() => {
    return { width: 500, height: 760 };
  }, []);

  const { width, height } = dimensions;

  const geo = useMemo(
    () => calculateRosaryGeometry(width, height, mysteryInfo),
    [width, height, mysteryInfo]
  );

  // Map of lit bead positions
  const litMap = useMemo(() => {
    const map = new Map<number, string>();
    beads.forEach(b => { if (b.isLit) map.set(b.position, b.type || 'small'); });
    return map;
  }, [beads]);

  const litSmallCount = useMemo(() => {
    return mysteryInfo.beadsInRound;
  }, [mysteryInfo.beadsInRound]);

  const litLargeCount = useMemo(() => {
    const prevRoundLarge = (mysteryInfo.roundNumber - 1) * 5;
    return Math.max(0, Math.min(5, currentTotalLarge - prevRoundLarge));
  }, [mysteryInfo.roundNumber, currentTotalLarge]);

  const newSet = useMemo(() => {
    const s = new Set<number>();
    beads.forEach(b => { if (b.isNew) s.add(b.position); });
    return s;
  }, [beads]);

  const litCount = beads.filter(b => b.isLit).length;

  // Build SVG path for chain wire
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
              VÒNG {mysteryInfo.roundNumber}
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

            {/* Lời nguyện Fatima dưới mỗi chục */}
            <div className={styles.fatimaPrayerText}>
              <span className={styles.fatimaTag}>✝ Lời nguyện Fatima:</span>
              &ldquo;Lạy Chúa Giêsu, xin tha tội cho chúng con, xin cứu chúng con khỏi sa hỏa ngục, xin đưa các linh hồn lên thiên đàng, nhất là những linh hồn cần đến lòng Chúa thương xót hơn. Amen.&rdquo;
            </div>

            {/* Decade Progress */}
            <div className={styles.decadeProgressWrap}>
              <div className={styles.decadeProgressText}>
                <span>Tiến độ chục này:</span>
                <strong>{isActiveDecade ? mysteryInfo.decadeProgress : (displayedDecadeNumber < mysteryInfo.currentDecadeNumber ? 10 : 0)}/10 hạt nhỏ</strong>
              </div>
              <div className={styles.decadeProgressBar}>
                <div
                  className={styles.decadeProgressFill}
                  style={{
                    width: `${((isActiveDecade ? mysteryInfo.decadeProgress : (displayedDecadeNumber < mysteryInfo.currentDecadeNumber ? 10 : 0)) / 10) * 100}%`,
                    backgroundColor: mysteryInfo.mystery.color,
                  }}
                />
              </div>
              {isActiveDecade && mysteryInfo.decadeProgress === 10 && (
                <div className={styles.decadeCompleteNote}>
                  ✨ Đã xong 10 hạt nhỏ! Đọc 1 Kinh Lạy Cha (Hạt to) để qua {mysteryInfo.currentDecadeNumber < 5 ? `Chục ${mysteryInfo.mystery.decades[mysteryInfo.currentDecadeNumber]?.title}` : 'Vòng Mầu Nhiệm mới'}!
                </div>
              )}
            </div>

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

      {/* ─── SVG ROSARY CHAIN CANVAS ─── */}
      <div className={styles.svgContainer}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.rosarySvg}
          style={{ width: '100%', height: 'auto', maxHeight: '720px' }}
        >
          <defs>
            {/* Soft Holy Glow Filter for Blue Beads */}
            <filter id="glowBlueHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft Holy Glow Filter for Gold Beads & Cross */}
            <filter id="glowGoldHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
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

            {/* Gold Lit Bead (Hạt lớn & Mề Đay) */}
            <linearGradient id="goldBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Blue Lit Bead (Hạt nhỏ Kính Mừng truyền thống ban đầu) */}
            <linearGradient id="blueBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="40%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            {/* Unlit Bead (Hạt ngọc xám bạc thanh thoát ban đầu) */}
            <linearGradient id="unlitBead" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            {/* Chain Wire Gradient */}
            <linearGradient id="goldChainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Shine Reflection */}
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
              x={geo.cx - geo.rx * 0.78}
              y={geo.ovalCY - geo.ry * 0.88}
              width={geo.rx * 1.56}
              height={geo.ry * 1.76}
              preserveAspectRatio="xMidYMid slice"
              className={styles.maryImage}
            />
          </g>

          {/* ─── 2. ROSARY CHAIN WIRE ─── */}
          <path
            d={chainPathLoop}
            fill="none"
            stroke="#B45309"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.rosaryChainLine}
          />

          {/* Pendant Chain Wire */}
          <line
            x1={geo.cx}
            y1={geo.medallionY}
            x2={geo.cx}
            y2={geo.crossY}
            stroke="#B45309"
            strokeWidth="2.8"
            strokeLinecap="round"
            className={styles.rosaryChainLine}
          />

          {/* ─── 3. BEADS (GIỮ NGUYÊN MÀU SẮC BAN ĐẦU CỦA VÒNG CHUỖI) ─── */}
          {/* Loop Beads (50 hạt nhỏ xanh dương + 4 hạt lớn vàng) */}
          {geo.loopBeads.map((bead) => {
            const isLarge = bead.type === 'large';
            const isLit = isLarge
              ? (bead.decadeIndex ? bead.decadeIndex <= litLargeCount : false)
              : (bead.position <= litSmallCount);
            const isNew = newSet.has(bead.position);
            const radius = isLarge ? 12 : 7.5;
            const isSelected = selectedBead?.id === bead.id;

            const fill = isLit ? (isLarge ? 'url(#goldBeadLit)' : 'url(#blueBeadLit)') : 'url(#unlitBead)';
            const stroke = isSelected ? '#EF4444' : isLit ? (isLarge ? '#B45309' : '#1D4ED8') : '#475569';
            const glowFilter = isLarge ? 'url(#glowGoldHoly)' : 'url(#glowBlueHoly)';
            const auraFill = isLarge ? 'rgba(245, 158, 11, 0.45)' : 'rgba(59, 130, 246, 0.35)';

            return (
              <g
                key={bead.id}
                className={styles.beadGroup}
                onClick={() => handleBeadClick(bead)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow aura when lit */}
                {isLit && (
                  <circle
                    cx={bead.x}
                    cy={bead.y}
                    r={radius + (isLarge ? 8 : 5)}
                    fill={auraFill}
                    filter={glowFilter}
                  />
                )}

                {/* Main Bead Circle */}
                <circle
                  cx={bead.x}
                  cy={bead.y}
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 3 : isLit ? 1.8 : 1.2}
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

          {/* Render Pendant Beads (Chuỗi đuôi) */}
          {geo.pendantBeads.map((bead) => {
            const isMedallion = bead.type === 'medallion';
            const isLarge = bead.type === 'large';
            const isLit = litMap.has(bead.position);
            const isNew = newSet.has(bead.position);
            const radius = isMedallion ? 16 : isLarge ? 12 : 8;
            const isSelected = selectedBead?.id === bead.id;

            const fill = isLit ? (isLarge || isMedallion ? 'url(#goldBeadLit)' : 'url(#blueBeadLit)') : 'url(#unlitBead)';
            const stroke = isSelected ? '#EF4444' : isLit ? (isLarge || isMedallion ? '#B45309' : '#1D4ED8') : '#475569';
            const glowFilter = (isLarge || isMedallion) ? 'url(#glowGoldHoly)' : 'url(#glowBlueHoly)';
            const auraFill = (isLarge || isMedallion) ? 'rgba(245, 158, 11, 0.45)' : 'rgba(59, 130, 246, 0.35)';

            return (
              <g
                key={bead.id}
                className={styles.beadGroup}
                onClick={() => handleBeadClick(bead)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow aura */}
                {isLit && (
                  <circle
                    cx={bead.x}
                    cy={bead.y}
                    r={radius + (isLarge || isMedallion ? 8 : 5)}
                    fill={auraFill}
                    filter={glowFilter}
                  />
                )}

                {/* Medallion or Bead */}
                {isMedallion ? (
                  <g>
                    <circle
                      cx={bead.x}
                      cy={bead.y}
                      r={radius}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 3 : 2.5}
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
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 3 : isLit ? 1.8 : 1.2}
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
          {(() => {
            const isCrossLit = litMap.has(0);
            return (
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
                    meaning: 'Làm Dấu Thánh Giá và đọc Kinh Tin Kính khi mở đầu; Làm Dấu và hôn kính Thánh Giá khi hoàn tất.',
                  })
                }
                style={{ cursor: 'pointer' }}
              >
                {/* Cross Holy Glow when lit */}
                {isCrossLit && (
                  <>
                    <circle
                      cx={geo.crossX}
                      cy={geo.crossY + 24}
                      r={36}
                      fill="rgba(245, 158, 11, 0.45)"
                      filter="url(#glowGoldHoly)"
                    />
                    <circle
                      cx={geo.crossX}
                      cy={geo.crossY + 24}
                      r={48}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.75"
                    />
                    <text x={geo.crossX - 18} y={geo.crossY - 4} className={styles.sparkleEmoji}>
                      ✨
                    </text>
                    <text x={geo.crossX + 10} y={geo.crossY - 4} className={styles.sparkleEmoji}>
                      ✨
                    </text>
                  </>
                )}

                {/* Cross Wooden Body */}
                <rect
                  x={geo.crossX - 5}
                  y={geo.crossY + 2}
                  width="10"
                  height="54"
                  rx="3"
                  fill={isCrossLit ? 'url(#goldBeadLit)' : 'url(#goldChainGrad)'}
                  stroke={isCrossLit ? '#B45309' : '#78350F'}
                  strokeWidth="1.5"
                />
                <rect
                  x={geo.crossX - 20}
                  y={geo.crossY + 14}
                  width="40"
                  height="10"
                  rx="3"
                  fill={isCrossLit ? 'url(#goldBeadLit)' : 'url(#goldChainGrad)'}
                  stroke={isCrossLit ? '#B45309' : '#78350F'}
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
                <ellipse cx={geo.crossX} cy={geo.crossY + 24} rx="4" ry="7" fill={isCrossLit ? '#FFFFFF' : '#FEF08A'} opacity="0.95" />
                <circle cx={geo.crossX} cy={geo.crossY + 17} r="3" fill={isCrossLit ? '#FFFFFF' : '#FEF08A'} opacity="0.95" />
                <line
                  x1={geo.crossX - 10}
                  y1={geo.crossY + 18}
                  x2={geo.crossX + 10}
                  y2={geo.crossY + 18}
                  stroke={isCrossLit ? '#FFFFFF' : '#FEF08A'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <title>Cây Thánh Giá: Dấu Thánh Giá & Kinh Tin Kính</title>
              </g>
            );
          })()}
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
