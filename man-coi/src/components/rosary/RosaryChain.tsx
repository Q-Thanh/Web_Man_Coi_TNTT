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
  color: 'yellow' | 'green' | 'blue' | 'red' | 'white' | 'gold';
  x: number;
  y: number;
  decadeIndex?: number;
  beadInDecade?: number;
  name: string;
  prayer: string;
  meaning: string;
}

const DECADE_COLORS: Array<'yellow' | 'green' | 'blue' | 'red' | 'white'> = [
  'yellow', // Chục 1: Vàng (Châu Á)
  'green',  // Chục 2: Xanh lá (Châu Phi)
  'blue',   // Chục 3: Xanh dương (Châu Đại Dương)
  'red',    // Chục 4: Đỏ (Châu Mỹ)
  'white',  // Chục 5: Trắng (Châu Âu)
];

function calculateRosaryGeometry(width: number, height: number, mysteryInfo?: MysteryProgressInfo) {
  // Center Rosary horizontally with an elegant, tall vertical oval shape (elip đứng theo hình mẫu)
  const cx = width / 2;
  const ovalCY = height * 0.36; // 274px
  const rx = width * 0.36; // 180px on 500px width (thon gọn chiều ngang)
  const ry = height * 0.315; // 240px on 760px height (dáng elip đứng, chừa chỗ cho chuỗi dọc)

  // Medallion at the bottom of the loop
  const medallionX = cx;
  const medallionY = ovalCY + ry; // 514px

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
    const decadeColor = DECADE_COLORS[decade - 1];

    // 10 small beads for this decade
    for (let b = 1; b <= 10; b++) {
      const angle = startAngle + currentSlot * angleStep;
      const x = cx + rx * Math.cos(angle);
      const y = ovalCY + ry * Math.sin(angle);

      loopBeads.push({
        id: `small-${globalBeadIndex}`,
        position: globalBeadIndex,
        type: 'small',
        color: decadeColor,
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
        color: 'gold',
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

  const pendantBeads: BeadPos[] = [
    // Medallion (Mề Đay Đức Mẹ)
    {
      id: 'medallion',
      position: 57,
      type: 'medallion',
      color: 'gold',
      x: cx,
      y: medallionY,
      name: 'Mề Đay Đức Mẹ (Centerpiece)',
      prayer: 'Kinh Lạy Nữ Vương',
      meaning: 'Bước 9: Sau khi hoàn tất 5 mầu nhiệm - Đọc một Kinh Lạy Nữ Vương, Kinh Trông Cậy và Các Lời Nguyện Tắt',
    },
    // Top large bead of pendant (under medallion) - Bước 4: Kinh Sáng Danh
    {
      id: 'pendant-large-2',
      position: 56,
      type: 'large',
      color: 'gold',
      x: cx,
      y: medallionY + 38,
      name: 'Hạt lớn trước Mề Đay',
      prayer: 'Kinh Sáng Danh & Lời nguyện Fatima',
      meaning: 'Bước 4: Đọc Kinh Sáng Danh',
    },
    // 3 small beads in pendant (Faith, Hope, Charity) - Bước 3
    {
      id: 'pendant-small-3',
      position: 103,
      type: 'small',
      color: 'white',
      x: cx,
      y: medallionY + 70,
      name: 'Hạt nhỏ thứ 3 (Trắng)',
      prayer: 'Kinh Kính Mừng (Ơn Đức Mến)',
      meaning: 'Bước 3: Ba Hạt Nhỏ - Mỗi hạt đọc một Kinh Kính Mừng (Cầu xin ơn Đức Mến vẹn toàn)',
    },
    {
      id: 'pendant-small-2',
      position: 102,
      type: 'small',
      color: 'green',
      x: cx,
      y: medallionY + 94,
      name: 'Hạt nhỏ thứ 2 (Xanh lá)',
      prayer: 'Kinh Kính Mừng (Ơn Đức Cậy)',
      meaning: 'Bước 3: Ba Hạt Nhỏ - Mỗi hạt đọc một Kinh Kính Mừng (Cầu xin ơn Đức Cậy vững vàng)',
    },
    {
      id: 'pendant-small-1',
      position: 101,
      type: 'small',
      color: 'red',
      x: cx,
      y: medallionY + 118,
      name: 'Hạt nhỏ thứ 1 (Đỏ)',
      prayer: 'Kinh Kính Mừng (Ơn Đức Tin)',
      meaning: 'Bước 3: Ba Hạt Nhỏ - Mỗi hạt đọc một Kinh Kính Mừng (Cầu xin ơn Đức Tin sâu sắc)',
    },
    // Bottom large bead (above crucifix) - Bước 2: Hạt lớn xanh dương
    {
      id: 'pendant-large-1',
      position: 51,
      type: 'large',
      color: 'blue',
      x: cx,
      y: medallionY + 152,
      name: 'Hạt lớn đầu tiên (Xanh dương)',
      prayer: 'Kinh Lạy Cha',
      meaning: 'Bước 2: Đọc Kinh Lạy Cha',
    },
  ];

  const crossY = medallionY + 186;

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
  const [showStepNumbers, setShowStepNumbers] = useState<boolean>(true);

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

  // Optimized SVG canvas dimensions: 500x760 gives a tall vertical oval proportion
  const dimensions = useMemo(() => {
    return { width: 500, height: 760 };
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

        {/* Nút bật/tắt hiển thị số thứ tự các bước 1-10 như ảnh hướng dẫn */}
        <button
          type="button"
          onClick={() => setShowStepNumbers(!showStepNumbers)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: showStepNumbers ? '1.5px solid #2563EB' : '1.5px solid #CBD5E1',
            background: showStepNumbers ? '#EFF6FF' : '#F8FAFC',
            color: showStepNumbers ? '#1D4ED8' : '#64748B',
            transition: 'all 0.2s ease',
          }}
          title="Bật/tắt số thứ tự các bước 1-10 lần hạt như trong hình hướng dẫn"
        >
          <span>🔢</span>
          <span>{showStepNumbers ? 'Đang hiện số bước (1-10)' : 'Hiện số bước (1-10)'}</span>
        </button>
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

            {/* Lời nguyện Fatima dưới mỗi chục */}
            <div className={styles.fatimaPrayerText}>
              <span className={styles.fatimaTag}>✝ Lời nguyện Fatima:</span>
              &ldquo;Lạy Chúa Giêsu, xin tha tội cho chúng con, xin cứu chúng con khỏi sa hỏa ngục, xin đưa các linh hồn lên thiên đàng, nhất là những linh hồn cần đến lòng Chúa thương xót hơn. Amen.&rdquo;
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
            {/* Filters for Holy Glow in 5 Mission Colors */}
            <filter id="glowGoldHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowYellowHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowGreenHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowBlueHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowRedHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowWhiteHoly" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radiant Halo background for Our Lady */}
            <radialGradient id="haloBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#FEF3C7" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#E0F2FE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* 1. Yellow Beads (Chục 1 - Châu Á) */}
            <linearGradient id="yellowBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="yellowBeadUnlit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEFCE8" />
              <stop offset="50%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>

            {/* 2. Green Beads (Chục 2 & Hạt nhỏ 2 - Châu Phi) */}
            <linearGradient id="greenBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="45%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="greenBeadUnlit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0FDF4" />
              <stop offset="50%" stopColor="#BBF7D0" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>

            {/* 3. Blue Beads (Chục 3 & Hạt lớn 1 - Châu Đại Dương) */}
            <linearGradient id="blueBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="45%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="blueBeadUnlit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EFF6FF" />
              <stop offset="50%" stopColor="#BFDBFE" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>

            {/* 4. Red Beads (Chục 4 & Hạt nhỏ 1 - Châu Mỹ) */}
            <linearGradient id="redBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="45%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id="redBeadUnlit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF2F2" />
              <stop offset="50%" stopColor="#FECACA" />
              <stop offset="100%" stopColor="#F87171" />
            </linearGradient>

            {/* 5. White Beads (Chục 5 & Hạt nhỏ 3 - Châu Âu) */}
            <linearGradient id="whiteBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="whiteBeadUnlit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Gold Beads (Hạt lớn & Mề Đay) */}
            <linearGradient id="goldBeadLit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="goldBeadUnlit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="50%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
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
              x={geo.cx - geo.rx * 0.78}
              y={geo.ovalCY - geo.ry * 0.88}
              width={geo.rx * 1.56}
              height={geo.ry * 1.76}
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

          {/* ─── 3. BEADS (HẠT MÂN CÔI THEO 5 MÀU TRUYỀN GIÁO) ─── */}
          {/* Render Loop Beads */}
          {geo.loopBeads.map((bead) => {
            const isLit = litMap.has(bead.position);
            const isNew = newSet.has(bead.position);
            const isLarge = bead.type === 'large';
            const radius = isLarge ? 12 : 7.5;
            const isSelected = selectedBead?.id === bead.id;

            // Compute style based on bead color
            let fill = 'url(#unlitBead)';
            let stroke = '#64748B';
            let glowFilter = 'url(#glowGoldHoly)';
            let auraFill = 'rgba(245, 158, 11, 0.4)';

            switch (bead.color) {
              case 'yellow':
                fill = isLit ? 'url(#yellowBeadLit)' : 'url(#yellowBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#A16207' : '#CA8A04';
                glowFilter = 'url(#glowYellowHoly)';
                auraFill = 'rgba(234, 179, 8, 0.45)';
                break;
              case 'green':
                fill = isLit ? 'url(#greenBeadLit)' : 'url(#greenBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#14532D' : '#16A34A';
                glowFilter = 'url(#glowGreenHoly)';
                auraFill = 'rgba(34, 197, 94, 0.45)';
                break;
              case 'blue':
                fill = isLit ? 'url(#blueBeadLit)' : 'url(#blueBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#1E3A8A' : '#2563EB';
                glowFilter = 'url(#glowBlueHoly)';
                auraFill = 'rgba(59, 130, 246, 0.45)';
                break;
              case 'red':
                fill = isLit ? 'url(#redBeadLit)' : 'url(#redBeadUnlit)';
                stroke = isSelected ? '#3B82F6' : isLit ? '#7F1D1D' : '#DC2626';
                glowFilter = 'url(#glowRedHoly)';
                auraFill = 'rgba(239, 68, 68, 0.45)';
                break;
              case 'white':
                fill = isLit ? 'url(#whiteBeadLit)' : 'url(#whiteBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#D97706' : '#94A3B8';
                glowFilter = 'url(#glowWhiteHoly)';
                auraFill = 'rgba(255, 255, 255, 0.65)';
                break;
              case 'gold':
              default:
                fill = isLit ? 'url(#goldBeadLit)' : 'url(#goldBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#78350F' : '#D97706';
                glowFilter = 'url(#glowGoldHoly)';
                auraFill = 'rgba(245, 158, 11, 0.45)';
                break;
            }

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
            const isLit = litMap.has(bead.position);
            const isNew = newSet.has(bead.position);
            const radius = isMedallion ? 16 : bead.type === 'large' ? 12 : 8;
            const isSelected = selectedBead?.id === bead.id;

            // Visual styles
            let fill = 'url(#unlitBead)';
            let stroke = '#64748B';
            let glowFilter = 'url(#glowGoldHoly)';
            let auraFill = 'rgba(245, 158, 11, 0.4)';

            switch (bead.color) {
              case 'blue':
                fill = isLit ? 'url(#blueBeadLit)' : 'url(#blueBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#1E3A8A' : '#2563EB';
                glowFilter = 'url(#glowBlueHoly)';
                auraFill = 'rgba(59, 130, 246, 0.45)';
                break;
              case 'red':
                fill = isLit ? 'url(#redBeadLit)' : 'url(#redBeadUnlit)';
                stroke = isSelected ? '#3B82F6' : isLit ? '#7F1D1D' : '#DC2626';
                glowFilter = 'url(#glowRedHoly)';
                auraFill = 'rgba(239, 68, 68, 0.45)';
                break;
              case 'green':
                fill = isLit ? 'url(#greenBeadLit)' : 'url(#greenBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#14532D' : '#16A34A';
                glowFilter = 'url(#glowGreenHoly)';
                auraFill = 'rgba(34, 197, 94, 0.45)';
                break;
              case 'white':
                fill = isLit ? 'url(#whiteBeadLit)' : 'url(#whiteBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#D97706' : '#94A3B8';
                glowFilter = 'url(#glowWhiteHoly)';
                auraFill = 'rgba(255, 255, 255, 0.65)';
                break;
              case 'gold':
              default:
                fill = isLit ? 'url(#goldBeadLit)' : 'url(#goldBeadUnlit)';
                stroke = isSelected ? '#EF4444' : isLit ? '#78350F' : '#D97706';
                glowFilter = 'url(#glowGoldHoly)';
                auraFill = 'rgba(245, 158, 11, 0.45)';
                break;
            }

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
                    r={radius + (bead.type === 'large' || isMedallion ? 8 : 5)}
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
                      stroke={isLit ? '#FEF08A' : '#FDE68A'}
                      strokeWidth="1"
                      strokeDasharray="2 1"
                    />
                    <text
                      x={bead.x}
                      y={bead.y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isLit ? '#78350F' : '#92400E'}
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

          {/* ─── 4. CRUCIFIX (CÂY THÁNH GIÁ - BƯỚC 1 & BƯỚC 10) ─── */}
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
                    color: 'gold',
                    x: geo.crossX,
                    y: geo.crossY,
                    name: 'Cây Thánh Giá',
                    prayer: 'Dấu Thánh Giá & Kinh Tin Kính',
                    meaning: 'Bước 1: Làm Dấu Thánh Giá và đọc Kinh Tin Kính. Bước 10: Làm Dấu và hôn Thánh Giá kết thúc.',
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

                <title>Cây Thánh Giá: Dấu Thánh Giá & Kinh Tin Kính (Bước 1 & 10)</title>
              </g>
            );
          })()}

          {/* ─── 5. NUMBERED STEP CALLOUT BADGES (CÁC BƯỚC 1 ĐẾN 10 NHƯ ẢNH HƯỚNG DẪN) ─── */}
          {showStepNumbers && (
            <g className="rosary-step-callouts">
              {[
                { step: '1', title: '1. Làm Dấu & Kinh Tin Kính', x: geo.crossX + 34, y: geo.crossY + 24, targetX: geo.crossX + 16, targetY: geo.crossY + 24, bg: '#78350F' },
                { step: '2', title: '2. Đọc Kinh Lạy Cha', x: geo.cx + 38, y: geo.medallionY + 152, targetX: geo.cx + 14, targetY: geo.medallionY + 152, bg: '#2563EB' },
                { step: '3', title: '3. Ba Hạt Nhỏ (Kính Mừng)', x: geo.cx + 38, y: geo.medallionY + 94, targetX: geo.cx + 12, targetY: geo.medallionY + 94, bg: '#DC2626' },
                { step: '4', title: '4. Đọc Kinh Sáng Danh', x: geo.cx + 38, y: geo.medallionY + 38, targetX: geo.cx + 14, targetY: geo.medallionY + 38, bg: '#D97706' },
                { step: '5', title: '5. Ngắm Mầu Nhiệm 1 & Lạy Cha', x: geo.cx - 46, y: geo.medallionY + 8, targetX: geo.cx - 18, targetY: geo.medallionY, bg: '#D97706' },
                { step: '6', title: '6. Mười Hạt Nhỏ (Chục 1 - Vàng)', x: geo.cx - geo.rx * 0.95 - 18, y: geo.ovalCY + geo.ry * 0.58, targetX: geo.cx - geo.rx * 0.95 + 6, targetY: geo.ovalCY + geo.ry * 0.58, bg: '#CA8A04' },
                { step: '7', title: '7. Kinh Sáng Danh & Fatima', x: geo.cx - geo.rx * 1.05 - 18, y: geo.ovalCY + geo.ry * 0.08, targetX: geo.cx - geo.rx * 1.05 + 6, targetY: geo.ovalCY + geo.ry * 0.08, bg: '#B45309' },
                { step: '8', title: '8. Ngắm Mầu Nhiệm 2 (Chục 2-5)', x: geo.cx - geo.rx * 0.85 - 18, y: geo.ovalCY - geo.ry * 0.65, targetX: geo.cx - geo.rx * 0.85 + 6, targetY: geo.ovalCY - geo.ry * 0.65, bg: '#16A34A' },
                { step: '9', title: '9. Kinh Lạy Nữ Vương tại Mề Đay', x: geo.cx - 46, y: geo.medallionY - 14, targetX: geo.cx - 16, targetY: geo.medallionY, bg: '#B45309' },
                { step: '10', title: '10. Hôn Thánh Giá hoàn tất', x: geo.crossX - 34, y: geo.crossY + 24, targetX: geo.crossX - 16, targetY: geo.crossY + 24, bg: '#78350F' },
              ].map((badge) => (
                <g key={badge.step} style={{ cursor: 'pointer' }}>
                  {/* Dashed pointer line */}
                  <line
                    x1={badge.x}
                    y1={badge.y}
                    x2={badge.targetX}
                    y2={badge.targetY}
                    stroke="#475569"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.75"
                  />
                  {/* Badge Circle */}
                  <circle
                    cx={badge.x}
                    cy={badge.y}
                    r="9.5"
                    fill="#FFFFFF"
                    stroke={badge.bg}
                    strokeWidth="2"
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.25))"
                  />
                  {/* Step Number Text */}
                  <text
                    x={badge.x}
                    y={badge.y + 3.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill={badge.bg}
                    fontFamily="Arial, sans-serif"
                  >
                    {badge.step}
                  </text>
                  <title>{badge.title}</title>
                </g>
              ))}
            </g>
          )}
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
