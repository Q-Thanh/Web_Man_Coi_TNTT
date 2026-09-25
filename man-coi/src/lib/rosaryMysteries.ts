export interface RosaryDecade {
  decadeNumber: number; // 1 to 5
  title: string;        // "Thứ nhất", "Thứ hai", ...
  text: string;         // Exact text requested by user
  shortName: string;    // "Thiên Thần truyền tin", ...
  prayerFruit: string;  // "Ta hãy xin cho được lòng khiêm nhường", ...
}

export interface RosaryMystery {
  id: string;
  name: string;      // "Năm Sự Vui", "Năm Sự Sáng", "Năm Sự Thương", "Năm Sự Mừng"
  season: string;    // "Mùa Vui", "Mùa Sáng", "Mùa Thương", "Mùa Mừng"
  icon: string;
  color: string;
  bgGradient: string;
  badgeBg: string;
  decades: RosaryDecade[];
}

export const ROSARY_MYSTERIES: RosaryMystery[] = [
  // ── 1. NĂM SỰ VUI ──
  {
    id: 'vui',
    name: 'Năm Sự Vui',
    season: 'Mùa Vui',
    icon: '🌸',
    color: '#2563EB',
    bgGradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    badgeBg: '#1D4ED8',
    decades: [
      {
        decadeNumber: 1,
        title: 'Thứ nhất',
        text: 'Thứ nhất: Thiên Thần truyền tin cho Đức Bà chịu thai, Ta hãy xin cho được lòng khiêm nhường.',
        shortName: 'Thiên Thần truyền tin',
        prayerFruit: 'Ta hãy xin cho được lòng khiêm nhường',
      },
      {
        decadeNumber: 2,
        title: 'Thứ hai',
        text: 'Thứ hai: Đức Bà đi viếng bà Isave, Ta hãy xin cho được lòng yêu người.',
        shortName: 'Đức Bà đi viếng',
        prayerFruit: 'Ta hãy xin cho được lòng yêu người',
      },
      {
        decadeNumber: 3,
        title: 'Thứ ba',
        text: 'Thứ ba: Đức Bà sinh Chúa Giêsu nơi hang đá, Ta hãy xin cho được lòng khó nghèo.',
        shortName: 'Sinh Chúa Giêsu',
        prayerFruit: 'Ta hãy xin cho được lòng khó nghèo',
      },
      {
        decadeNumber: 4,
        title: 'Thứ bốn',
        text: 'Thứ bốn: Đức Bà dâng Chúa Giêsu trong Đền Thờ, Ta hãy xin cho được lòng vâng phục.',
        shortName: 'Dâng Chúa trong Đền Thờ',
        prayerFruit: 'Ta hãy xin cho được lòng vâng phục',
      },
      {
        decadeNumber: 5,
        title: 'Thứ năm',
        text: 'Thứ năm: Đức Bà tìm gặp Chúa Giêsu trong đền Thánh, Ta hãy xin cho được giữ nghĩa cùng Chúa luôn.',
        shortName: 'Tìm gặp Chúa Giêsu',
        prayerFruit: 'Ta hãy xin cho được giữ nghĩa cùng Chúa luôn',
      },
    ],
  },

  // ── 2. NĂM SỰ SÁNG ──
  {
    id: 'sang',
    name: 'Năm Sự Sáng',
    season: 'Mùa Sáng',
    icon: '☀️',
    color: '#D97706',
    bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    badgeBg: '#B45309',
    decades: [
      {
        decadeNumber: 1,
        title: 'Thứ nhất',
        text: 'Thứ nhất: Đức Chúa Giêsu chịu phép Rửa tại sông Giođan, ta hãy xin cho được sống xứng đáng là con cái Chúa.',
        shortName: 'Chịu phép Rửa',
        prayerFruit: 'Ta hãy xin cho được sống xứng đáng là con cái Chúa',
      },
      {
        decadeNumber: 2,
        title: 'Thứ hai',
        text: 'Thứ hai: Đức Chúa Giêsu dự tiệc cưới Cana. Ta hãy xin cho được vững tin vào quyền năng của Ngài.',
        shortName: 'Tiệc cưới Cana',
        prayerFruit: 'Ta hãy xin cho được vững tin vào quyền năng của Ngài',
      },
      {
        decadeNumber: 3,
        title: 'Thứ ba',
        text: 'Thứ ba: Đức Chúa Giêsu rao giảng Nước Trời và kêu gọi sám hối. Ta hãy xin cho được hoán cải và đón nhận Tin Mừng.',
        shortName: 'Rao giảng Nước Trời',
        prayerFruit: 'Ta hãy xin cho được hoán cải và đón nhận Tin Mừng',
      },
      {
        decadeNumber: 4,
        title: 'Thứ tư',
        text: 'Thứ tư: Đức Chúa Giêsu biến hình trên núi. Ta hãy xin cho được lắng nghe và thực hành lời Chúa.',
        shortName: 'Biến hình trên núi',
        prayerFruit: 'Ta hãy xin cho được lắng nghe và thực hành lời Chúa',
      },
      {
        decadeNumber: 5,
        title: 'Thứ năm',
        text: 'Thứ năm: Chúa Giêsu lập bí tích Thánh Thể. Ta hãy xin cho được năng kết hợp cùng Chúa Giêsu Thánh Thể.',
        shortName: 'Lập bí tích Thánh Thể',
        prayerFruit: 'Ta hãy xin cho được năng kết hợp cùng Chúa Giêsu Thánh Thể',
      },
    ],
  },

  // ── 3. NĂM SỰ THƯƠNG ──
  {
    id: 'thuong',
    name: 'Năm Sự Thương',
    season: 'Mùa Thương',
    icon: '✝️',
    color: '#DC2626',
    bgGradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
    badgeBg: '#B91C1C',
    decades: [
      {
        decadeNumber: 1,
        title: 'Thứ nhất',
        text: 'Thứ nhất: Chúa Giêsu lo buồn đổ mồ hôi máu, Ta hãy xin cho được ăn năn tội nên.',
        shortName: 'Lo buồn đổ mồ hôi máu',
        prayerFruit: 'Ta hãy xin cho được ăn năn tội nên',
      },
      {
        decadeNumber: 2,
        title: 'Thứ hai',
        text: 'Thứ hai: Chúa Giêsu chịu đánh đòn, Ta hãy xin cho được hãm mình chịu khó bằng lòng.',
        shortName: 'Chịu đánh đòn',
        prayerFruit: 'Ta hãy xin cho được hãm mình chịu khó bằng lòng',
      },
      {
        decadeNumber: 3,
        title: 'Thứ ba',
        text: 'Thứ ba: Chúa Giêsu chịu đội mão gai, Ta hãy xin cho được chịu mọi sự sỉ nhục bằng lòng.',
        shortName: 'Đội mão gai',
        prayerFruit: 'Ta hãy xin cho được chịu mọi sự sỉ nhục bằng lòng',
      },
      {
        decadeNumber: 4,
        title: 'Thứ bốn',
        text: 'Thứ bốn: Chúa Giêsu vác cây thập giá, Ta hãy xin cho được vác thánh giá theo chân Chúa.',
        shortName: 'Vác cây thập giá',
        prayerFruit: 'Ta hãy xin cho được vác thánh giá theo chân Chúa',
      },
      {
        decadeNumber: 5,
        title: 'Thứ năm',
        text: 'Thứ năm: Chúa Giêsu chịu chết trên cây thập giá, Ta hãy xin cho được đóng đinh tính xác thịt vào thánh giá Chúa.',
        shortName: 'Chịu chết trên thập giá',
        prayerFruit: 'Ta hãy xin cho được đóng đinh tính xác thịt vào thánh giá Chúa',
      },
    ],
  },

  // ── 4. NĂM SỰ MỪNG ──
  {
    id: 'mung',
    name: 'Năm Sự Mừng',
    season: 'Mùa Mừng',
    icon: '👑',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    badgeBg: '#047857',
    decades: [
      {
        decadeNumber: 1,
        title: 'Thứ nhất',
        text: 'Thứ nhất: Chúa Giêsu sống lại, Ta hãy xin cho được sống lại thật về phần linh hồn.',
        shortName: 'Chúa sống lại',
        prayerFruit: 'Ta hãy xin cho được sống lại thật về phần linh hồn',
      },
      {
        decadeNumber: 2,
        title: 'Thứ hai',
        text: 'Thứ hai: Chúa Giêsu lên trời. Ta hãy xin cho được lòng ái mộ những sự trên trời.',
        shortName: 'Chúa lên trời',
        prayerFruit: 'Ta hãy xin cho được lòng ái mộ những sự trên trời',
      },
      {
        decadeNumber: 3,
        title: 'Thứ ba',
        text: 'Thứ ba: Chúa Thánh Thần hiện xuống. Ta hãy xin cho được lòng đầy dẫy mọi ơn Đức Chúa Thánh Thần.',
        shortName: 'Thánh Thần hiện xuống',
        prayerFruit: 'Ta hãy xin cho được lòng đầy dẫy mọi ơn Đức Chúa Thánh Thần',
      },
      {
        decadeNumber: 4,
        title: 'Thứ bốn',
        text: 'Thứ bốn: Đức Chúa Trời cho Đức Bà lên trời. Ta hãy xin ơn chết lành trong tay Đức Mẹ.',
        shortName: 'Đức Bà lên trời',
        prayerFruit: 'Ta hãy xin ơn chết lành trong tay Đức Mẹ',
      },
      {
        decadeNumber: 5,
        title: 'Thứ năm',
        text: 'Thứ năm: Đức Chúa Trời thưởng Đức Mẹ trên trời. Ta hãy xin Đức Mẹ phù hộ cho ta được thưởng cùng Đức Mẹ trên nước thiên đàng.',
        shortName: 'Thưởng Đức Mẹ trên trời',
        prayerFruit: 'Ta hãy xin Đức Mẹ phù hộ cho ta được thưởng cùng Đức Mẹ trên nước thiên đàng',
      },
    ],
  },
];

export interface MysteryProgressInfo {
  roundNumber: number;        // 1, 2, 3, ... (1-indexed loop counter)
  mysteryIndex: number;       // 0..3 (0: Vui, 1: Sáng, 2: Thương, 3: Mừng)
  mystery: RosaryMystery;
  currentDecadeNumber: number;// 1..5
  currentDecade: RosaryDecade;
  beadsInRound: number;       // 0..50
  decadeProgress: number;     // 0..10
  isRoundComplete: boolean;
  totalCompletedRounds: number;
}

/**
 * Calculates the current Mystery and Decade based on total small beads read.
 * Each round consists of 50 small beads (5 decades x 10 beads).
 * Round 1: Năm Sự Vui -> Round 2: Năm Sự Sáng -> Round 3: Năm Sự Thương -> Round 4: Năm Sự Mừng -> Loops to Vui...
 */
export function getMysteryProgress(totalSmallBeads: number, totalLargeBeads: number = 0): MysteryProgressInfo {
  const safeSmall = Math.max(0, totalSmallBeads || 0);
  const safeLarge = Math.max(0, totalLargeBeads || 0);

  const totalCompletedRounds = Math.floor(safeSmall / 50);

  // If safeSmall is an exact multiple of 50 and > 0, it means the user just finished this round (50/50)
  const isExact50 = safeSmall > 0 && safeSmall % 50 === 0;

  const currentRoundIndex = isExact50 ? (totalCompletedRounds - 1) : totalCompletedRounds;
  const roundNumber = currentRoundIndex + 1;
  const mysteryIndex = currentRoundIndex % 4;
  const mystery = ROSARY_MYSTERIES[mysteryIndex];

  const beadsInRound = isExact50 ? 50 : (safeSmall % 50);

  // Large beads in the current round (0..5)
  const largeInRound = safeLarge % 5;

  // Determine current decade (1 to 5)
  // Automatically advances when moving past 10 small beads OR when the large divider bead is prayed
  let currentDecadeNumber = 1;
  if (beadsInRound === 0) {
    currentDecadeNumber = 1;
  } else if (beadsInRound < 10) {
    currentDecadeNumber = 1;
  } else if (beadsInRound === 10) {
    currentDecadeNumber = (largeInRound >= 1) ? 2 : 1;
  } else if (beadsInRound < 20) {
    currentDecadeNumber = 2;
  } else if (beadsInRound === 20) {
    currentDecadeNumber = (largeInRound >= 2) ? 3 : 2;
  } else if (beadsInRound < 30) {
    currentDecadeNumber = 3;
  } else if (beadsInRound === 30) {
    currentDecadeNumber = (largeInRound >= 3) ? 4 : 3;
  } else if (beadsInRound < 40) {
    currentDecadeNumber = 4;
  } else if (beadsInRound === 40) {
    currentDecadeNumber = (largeInRound >= 4) ? 5 : 4;
  } else {
    currentDecadeNumber = 5;
  }

  const currentDecade = mystery.decades[currentDecadeNumber - 1];

  // Progress within the current 10 beads of this decade
  let decadeProgress = 0;
  if (beadsInRound === 0) {
    decadeProgress = 0;
  } else {
    const remainder = beadsInRound % 10;
    if (remainder === 0) {
      // If we auto-advanced to the next decade because the large bead was prayed, decadeProgress for the new decade is 0
      const isAdvancedDueToLarge =
        (beadsInRound === 10 && currentDecadeNumber === 2) ||
        (beadsInRound === 20 && currentDecadeNumber === 3) ||
        (beadsInRound === 30 && currentDecadeNumber === 4) ||
        (beadsInRound === 40 && currentDecadeNumber === 5);
      decadeProgress = isAdvancedDueToLarge ? 0 : 10;
    } else {
      decadeProgress = remainder;
    }
  }

  return {
    roundNumber,
    mysteryIndex,
    mystery,
    currentDecadeNumber,
    currentDecade,
    beadsInRound,
    decadeProgress,
    isRoundComplete: beadsInRound === 50,
    totalCompletedRounds,
  };
}
