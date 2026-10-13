// Global state
const GameState = {
  player: null,
  upgrades: { attack: 0, maxHp: 0, defense: 0, speed: 0, goldRate: 0, hpRegen: 0 },
  autoUpgrade: {
    enabled: false,
    selected: { attack: true, maxHp: true, defense: false, speed: false, goldRate: false, hpRegen: false }
  },
  autoFusion: {
    enabled: false,
    rarities: { common: true, rare: false, epic: false, legendary: false, mythic: false, chaos: false }
  },
  stage: { current: 1, max: 1, autoAdvance: true },
  inventory: [],
  inventoryMax: 80,
  inventoryExpands: 0,
  heroes: [],
  activeHeroId: 'hero_traveler',
  gacha: { totalPulls: 0, totalHeroPulls: 0, bannerTab: 'weapon' },
  autoGacha: {
    enabled: false,
    banner: 'weapon',
    tier: 10,
    stopOnRarity: 'legendary'
  },
  autoHeroSkill: {
    enabled: false
  },
  currentTab: 'battle',
  dungeon: {
    active: false,
    dungeonId: null,
    subMode: null,
    wave: 1,
    maxWaves: 5,
    goldEarned: 0,
    expEarned: 0,
    stonesEarned: 0,
    forgeDropsEarned: 0,
    abyssFloor: 1,
    towerHighestFloor: 1,
    autoClimb: true,
    dailyRuns: { gold: 3, exp: 3, rune: 3, forge: 3 }
  },
  combat: { monstersKilled: 0 },
  boss: { active: false, bossIndex: 0, hp: 0, maxHp: 0, timer: 0, timerMax: 0, rage: 0, rageMax: 100 },
  settings: {
    vfxEnabled: true
  },
  lastSaveTime: Date.now()
};

const CONFIG = {
  // Player base stats (Khởi đầu hào phóng hơn để người chơi dễ dàng đánh quái đầu tiên)
  BASE_HP: 150,
  BASE_ATTACK: 18,
  BASE_DEFENSE: 4,
  BASE_SPEED: 12,
  BASE_GOLD_RATE: 1.0,
  BASE_HP_REGEN: 3,

  // Level scaling
  EXP_BASE: 70,
  EXP_GROWTH: 1.25,
  LEVEL_HP_BONUS: 35,
  LEVEL_ATK_BONUS: 5,
  LEVEL_DEF_BONUS: 2,
  LEVEL_SPD_BONUS: 1,
  LEVEL_MAX: 999,

  // Combat loop
  COMBAT_TURN_BASE_DELAY: 650,
  PLAYER_REVIVE_TIME: 1500,
  EXTRA_TURN_CAP: 0.75, // Tỉ lệ đòn bồi tối đa 75%

  // Normal monsters scaling (Cân bằng chuẩn: Ải 1 dễ tiếp cận, quái chết sau 3-4 hit, càng leo ải cao càng khó x10)
  MONSTER_HP_BASE: 52,        // Quái ải 1 chỉ 52 HP (Tân thủ đánh 3-4 phát là hạ gục)
  MONSTER_HP_GROWTH: 1.070,   // Leo ải tăng trưởng mạnh theo cấp số nhân
  MONSTER_ATK_BASE: 7,        // Quái ải 1 đánh chỉ 7 dmg (Người chơi giáp 4 nhận 3 dmg, hồi máu bù đắp an toàn)
  MONSTER_ATK_GROWTH: 1.052,
  MONSTER_DEF_BASE: 0,        // Ải 1 quái 0 giáp để người chơi cảm nhận trọn vẹn lực đánh
  MONSTER_DEF_GROWTH: 1.042,
  MONSTER_SPD_BASE: 8,
  MONSTER_SPD_GROWTH: 1.020,
  MONSTER_GOLD_BASE: 6,       // Vàng khởi điểm hợp lý để sớm mua được nâng cấp đầu tiên
  MONSTER_GOLD_GROWTH: 1.032,
  MONSTER_EXP_BASE: 26,       // Đánh 3 con quái là lên ngay Lv 2 (Hồi đầy máu)!
  MONSTER_EXP_GROWTH: 1.034,

  UPGRADES: {
    attack:   { name: 'Sát Thương', icon: '⚔️', bonusPerLevel: 4,   costBase: 20, costGrowth: 1.30, formatBonus: (l) => `+${l * 4} ATK` },
    maxHp:    { name: 'Máu Tối Đa', icon: '❤️', bonusPerLevel: 30,  costBase: 20, costGrowth: 1.28, formatBonus: (l) => `+${l * 30} HP` },
    defense:  { name: 'Phòng Thủ', icon: '🛡️', bonusPerLevel: 2,   costBase: 30, costGrowth: 1.32, formatBonus: (l) => `+${l * 2} DEF` },
    speed:    { name: 'Tốc Độ',   icon: '⚡', bonusPerLevel: 1.5, costBase: 45, costGrowth: 1.35, formatBonus: (l) => `+${(l * 1.5).toFixed(1)} SPD` },
    goldRate: { name: 'Tỉ Lệ Vàng',icon: '💰', bonusPerLevel: 0.05,costBase: 70, costGrowth: 1.40, formatBonus: (l) => `+${(l * 5).toFixed(0)}% Vàng` },
    hpRegen:  { name: 'Hồi Máu',   icon: '🧪', bonusPerLevel: 3,   costBase: 50, costGrowth: 1.34, formatBonus: (l) => `+${l * 3} HP/Lượt` }
  },

  GACHA_COST_SINGLE: 250,
  GACHA_COST_MULTI: 2250,
  GACHA_COST_100: 22000,
  GACHA_COST_1000: 210000,
  GACHA_MULTI_COUNT: 10,

  // Mở rộng Balo bằng Vàng
  INVENTORY_BASE_MAX: 80,
  INVENTORY_EXPAND_STEP: 5,
  INVENTORY_MAX_LIMIT: 500,
  getInventoryExpandCost(expands = 0) {
    return Math.floor(25000 * Math.pow(1.40, expands));
  },

  // Tỉ lệ Gacha Thử Thách Khắc Nghiệt: Đồ xịn cực kỳ quý hiếm
  GACHA_RATES: {
    common:    0.72,
    rare:      0.21,
    epic:      0.058,
    legendary: 0.010949, // Huyền Thoại giảm còn ~1.1%
    mythic:    0.00095,   // Thần Thoại ~0.095%
    chaos:     0.00005,   // Hỗn Mang ~0.005%
    unknown:   0.000001   // ??? 1 trong 1 triệu
  },

  // Tinh Luyện Vũ Khí (Weapon Refinement R1 - R5)
  WEAPON_REFINEMENT: {
    maxRank: 5,
    getBonus(rank = 1) {
      const bonuses = [0, 0.15, 0.35, 0.60, 1.0];
      return bonuses[Math.min(5, Math.max(1, rank)) - 1] || 0;
    }
  },

  INVENTORY_MAX: 80,
  RARITY_ORDER: ['common', 'rare', 'epic', 'legendary', 'mythic', 'chaos', 'unknown'],

  RARITY_NAMES: {
    common: 'Thường', rare: 'Hiếm', epic: 'Sử Thi',
    legendary: 'Huyền Thoại', mythic: 'Thần Thoại', chaos: 'Hỗn Mang', unknown: '???'
  },

  RARITY_COLORS: {
    common: '#9e9e9e', rare: '#3b82f6', epic: '#a855f7',
    legendary: '#f59e0b', mythic: '#ef4444', chaos: '#b026ff', unknown: '#00ffcc'
  },

  RARITY_BG: {
    common: 'rgba(158,158,158,0.12)', rare: 'rgba(59,130,246,0.12)',
    epic: 'rgba(168,85,247,0.14)', legendary: 'rgba(245,158,11,0.15)',
    mythic: 'rgba(239,68,68,0.18)', chaos: 'rgba(176,38,255,0.20)', unknown: 'rgba(0,255,204,0.25)'
  },

  SELL_PRICES: {
    common: 15, rare: 50, epic: 180, legendary: 600,
    mythic: 3000, chaos: 15000, unknown: 100000
  },

  // Ghép đồ 3 món cùng bậc
  FUSION_COUNT: 3,
  FUSION_RATES: {
    common: 0.85, rare: 0.70, epic: 0.50,
    legendary: 0.30, mythic: 0.15, chaos: 0.05 // 15% lên Hỗn Mang, 5% lên ???
  },

  ENHANCE_MAX: 100,
  ENHANCE_STAT_BONUS_PER_LEVEL: 0.02, // +2% stats mỗi cấp rèn

  getEnhanceCost(level, rarity) {
    const mult = { common: 1, rare: 1.5, epic: 2.2, legendary: 3.5, mythic: 6, chaos: 12, unknown: 30 }[rarity] || 1;
    return Math.floor((60 + Math.pow(level, 1.85) * 25) * mult);
  },

  // Tỉ lệ thành công, bạo kích (+2/+3), rớt cấp và vỡ về 0 theo mốc (ĐỘ KHÓ HARDCORE CAO CẤP)
  getEnhanceRates(level) {
    if (level < 6) {
      // +0 đến +5: Khởi đầu
      return { success: 0.80 - level * 0.025, greatSuccess2: 0.04, greatSuccess3: 0.01, failDrop: 0, failBreak: 0 };
    } else if (level < 16) {
      // +6 đến +15: Bắt đầu rớt cấp và có tỉ lệ vỡ nhẹ
      return { success: Math.max(0.38, 0.65 - (level - 6) * 0.025), greatSuccess2: 0.03, greatSuccess3: 0.005, failDrop: 0.40, failBreak: 0.03 };
    } else if (level < 36) {
      // +16 đến +35: Khốc liệt
      return { success: Math.max(0.18, 0.38 - (level - 16) * 0.010), greatSuccess2: 0.02, greatSuccess3: 0.002, failDrop: 0.65, failBreak: 0.08 };
    } else if (level < 66) {
      // +36 đến +65: Tử địa lò rèn
      return { success: Math.max(0.07, 0.18 - (level - 36) * 0.004), greatSuccess2: 0.01, greatSuccess3: 0.001, failDrop: 0.75, failBreak: 0.15 };
    } else if (level < 86) {
      // +66 đến +85: Cực hạn
      return { success: Math.max(0.025, 0.07 - (level - 66) * 0.0022), greatSuccess2: 0.005, greatSuccess3: 0.0005, failDrop: 0.80, failBreak: 0.20 };
    } else {
      // +86 đến +100: Địa ngục rèn thần khí (Thành công cực thấp, 1/4 vỡ về 0 nếu không có bùa)
      return { success: Math.max(0.008, 0.025 - (level - 86) * 0.0012), greatSuccess2: 0.002, greatSuccess3: 0.0001, failDrop: 0.85, failBreak: 0.25 };
    }
  },

  BOSS_KEY_PRICE: 2000,
  BOSS_LIST: [
    {
      id: 'boss_slime_king',
      name: 'Vua Slime Khổng Lồ',
      title: 'Quái Vương Đầm Lầy Bất Tử',
      emoji: '👑🟢',
      elementColor: '#00e676',
      desc: 'Quái vương đầm lầy, máu dồi dào, sở hữu khả năng phân bào hủy diệt',
      hp: 8000, attack: 110, defense: 25, speed: 18, timer: 45, keyCost: 1,
      goldReward: 15000, expReward: 8000, protectionStoneDropRate: 0.12, itemDropPool: ['rare', 'epic'],
      skills: [
        { id: 'bs_acid', name: 'Axit Hủy Diệt', icon: '🧪', dmgMult: 1.6, type: 'special', desc: 'Phun axit đậm đặc gây 160% sát thương và ăn mòn giáp!' },
        { id: 'bs_slam', name: 'Đại Phân Bào Đè Bẹp', icon: '💥', dmgMult: 2.6, type: 'ultimate', desc: 'Phóng vút lên trời rồi dập nát chiến trường gây 260% sát thương cực đại!' }
      ]
    },
    {
      id: 'boss_skeleton_warlord',
      name: 'Vua Xương Hoàng Kim',
      title: 'Chiến Tướng Cổ Đại Hầm Ngục',
      emoji: '👑💀',
      elementColor: '#ffd700',
      desc: 'Chiến tướng hầm ngục giáp trụ hoàng kim, kiếm khí chém nát trời đất',
      hp: 38000, attack: 320, defense: 85, speed: 28, timer: 50, keyCost: 2,
      goldReward: 65000, expReward: 35000, protectionStoneDropRate: 0.18, itemDropPool: ['epic', 'legendary'],
      skills: [
        { id: 'bs_slash', name: 'Hoàng Kim Tam Trảm', icon: '⚔️', dmgMult: 2.2, type: 'special', desc: 'Vung đại đao chém 3 nhát liên hoàn chớp nhoáng gây 220% sát thương!' },
        { id: 'bs_howl', name: 'Tiếng Thét Đoạt Hồn', icon: '💀', dmgMult: 3.2, type: 'ultimate', desc: 'Tiếng gầm từ địa ngục làm kinh hoàng đối thủ gây 320% sát thương bạo kích!' }
      ]
    },
    {
      id: 'boss_demon_lord',
      name: 'Chúa Tể Địa Ngục',
      title: 'Bạo Chúa Vô Gián Ma Giới',
      emoji: '👑👹',
      elementColor: '#ef4444',
      desc: 'Bạo chúa bóng tối sát thương thiêu đốt, ma hỏa hắc ám nuốt chửng linh hồn',
      hp: 180000, attack: 950, defense: 220, speed: 45, timer: 60, keyCost: 3,
      goldReward: 300000, expReward: 180000, protectionStoneDropRate: 0.25, itemDropPool: ['legendary', 'mythic'],
      skills: [
        { id: 'bs_hellfire', name: 'Hỏa Ngục Hắc Ám', icon: '🔥', dmgMult: 2.5, type: 'special', desc: 'Thiêu đốt không gian bằng ngọn lửa ma giới gây 250% sát thương!' },
        { id: 'bs_cataclysm', name: 'Diệt Thế Cuồng Nộ', icon: '👹', dmgMult: 3.8, type: 'ultimate', desc: 'Giải phóng ma năng hắc ám hủy diệt toàn cõi gây 380% sát thương cực hạn!' }
      ]
    },
    {
      id: 'boss_chaos_dragon',
      name: 'Cổ Long Hỗn Mang',
      title: 'Thần Thú Khai Thiên Hư Vô',
      emoji: '👑🐉',
      elementColor: '#a855f7',
      desc: 'Rồng thần viễn cổ nắm giữ sức mạnh hư không, có thể bóp nghẹt các chiều không gian',
      hp: 850000, attack: 2800, defense: 600, speed: 70, timer: 75, keyCost: 5,
      goldReward: 1500000, expReward: 1000000, protectionStoneDropRate: 0.35, itemDropPool: ['mythic', 'chaos'],
      skills: [
        { id: 'bs_breath', name: 'Long Tức Hư Vô', icon: '🌌', dmgMult: 3.2, type: 'special', desc: 'Phun chùm năng lượng hủy diệt vũ trụ gây 320% sát thương xuyên thấu!' },
        { id: 'bs_rift', name: 'Vết Nứt Hư Không', icon: '🐲', dmgMult: 4.8, type: 'ultimate', desc: 'Xé toạc ranh giới không gian tạo lỗ đen bóp nghẹt gây 480% sát thương tuyệt đối!' }
      ]
    }
  ],

  MONSTERS: [
    { name: 'Slime Xanh', emoji: '🟢', tier: 1, hpMod: 1.0, atkMod: 1.0, defMod: 0.0, spdMod: 0.8 },
    { name: 'Yêu Tinh Goblin', emoji: '👺', tier: 3, hpMod: 1.2, atkMod: 1.2, defMod: 1.1, spdMod: 1.3 },
    { name: 'Bộ Xương Kiếm Sĩ', emoji: '💀', tier: 5, hpMod: 1.4, atkMod: 1.4, defMod: 1.2, spdMod: 1.1 },
    { name: 'Chiến Binh Orc', emoji: '👹', tier: 8, hpMod: 1.8, atkMod: 1.7, defMod: 1.5, spdMod: 0.9 },
    { name: 'Sát Thủ Dark Elf', emoji: '🧝', tier: 12, hpMod: 1.7, atkMod: 2.1, defMod: 1.3, spdMod: 1.6 },
    { name: 'Tiểu Quỷ Hỏa Ngục', emoji: '😈', tier: 16, hpMod: 2.3, atkMod: 2.4, defMod: 1.6, spdMod: 1.3 },
    { name: 'Khổng Lồ Đá Golem', emoji: '🗿', tier: 20, hpMod: 3.2, atkMod: 2.2, defMod: 2.8, spdMod: 0.7 },
    { name: 'Bóng Ma Hư Vô', emoji: '👻', tier: 25, hpMod: 2.6, atkMod: 3.0, defMod: 1.8, spdMod: 1.8 },
    { name: 'Nhân Ngưu Cuồng Nộ', emoji: '🐂', tier: 32, hpMod: 3.8, atkMod: 3.5, defMod: 2.3, spdMod: 1.2 },
    { name: 'Hỏa Long', emoji: '🐉', tier: 40, hpMod: 5.0, atkMod: 4.8, defMod: 3.2, spdMod: 1.5 },
    { name: 'Chúa Tể Bóng Tối', emoji: '🌑', tier: 50, hpMod: 7.0, atkMod: 6.5, defMod: 4.5, spdMod: 1.8 },
    { name: 'Phượng Hoàng Bất Tử', emoji: '🔥', tier: 65, hpMod: 9.0, atkMod: 8.5, defMod: 5.5, spdMod: 2.2 },
    { name: 'Cửu Đầu Xà Hydra', emoji: '🐍', tier: 80, hpMod: 12.0, atkMod: 11.0, defMod: 7.0, spdMod: 1.9 },
    { name: 'Vu Yêu Vương Lich', emoji: '☠️', tier: 100, hpMod: 16.0, atkMod: 15.0, defMod: 9.0, spdMod: 2.4 },
    { name: 'Thần Long Thái Sơ', emoji: '🌟', tier: 130, hpMod: 24.0, atkMod: 22.0, defMod: 14.0, spdMod: 2.8 }
  ],

  ITEMS: {
    weapons: [
      { name: 'Dao Gỉ Sét', type: 'weapon', rarity: 'common', stats: { attack: 4, speed: 1 } },
      { name: 'Kiếm Gỗ', type: 'weapon', rarity: 'common', stats: { attack: 6, speed: 1 } },
      { name: 'Đoản Đao Sắt', type: 'weapon', rarity: 'common', stats: { attack: 9, speed: 2 } },
      { name: 'Kiếm Bạc Thép Tinh', type: 'weapon', rarity: 'rare', stats: { attack: 18, speed: 4 } },
      { name: 'Đoản Kiếm Phong Linh', type: 'weapon', rarity: 'rare', stats: { attack: 24, speed: 8 } },
      { name: 'Trường Thương Băng', type: 'weapon', rarity: 'rare', stats: { attack: 30, speed: 3 } },
      { name: 'Hắc Kiếm Tử Thần', type: 'weapon', rarity: 'epic', stats: { attack: 55, speed: 10 } },
      { name: 'Lôi Thần Trảm', type: 'weapon', rarity: 'epic', stats: { attack: 72, speed: 14 } },
      { name: 'Thần Kiếm Vạn Cổ', type: 'weapon', rarity: 'legendary', stats: { attack: 140, speed: 22 } },
      { name: 'Long Tuyền Trảm Ma', type: 'weapon', rarity: 'legendary', stats: { attack: 190, speed: 28 } },
      { name: 'Huyết Kiếm Ma Hoàng', type: 'weapon', rarity: 'mythic', stats: { attack: 450, speed: 45 } },
      { name: 'Thiên Cung Thái Hư', type: 'weapon', rarity: 'mythic', stats: { attack: 620, speed: 60 } },
      { name: 'Hắc Ám Hư Không Kiếm', type: 'weapon', rarity: 'chaos', stats: { attack: 1800, speed: 110 } },
      { name: '⟦ THÁI CỔ NGHỊCH THIÊN TRẢM ⟧', type: 'weapon', rarity: 'unknown', stats: { attack: 9999, speed: 250 } }
    ],
    armors: [
      { name: 'Áo Vải Bố', type: 'armor', rarity: 'common', stats: { maxHp: 30, defense: 2 } },
      { name: 'Giáp Da Sói', type: 'armor', rarity: 'common', stats: { maxHp: 50, defense: 4 } },
      { name: 'Áo Giáp Đồng Cũ', type: 'armor', rarity: 'common', stats: { maxHp: 80, defense: 7 } },
      { name: 'Giáp Sắt Cường Hóa', type: 'armor', rarity: 'rare', stats: { maxHp: 160, defense: 15 } },
      { name: 'Áo Choàng Bóng Tối', type: 'armor', rarity: 'rare', stats: { maxHp: 220, defense: 20 } },
      { name: 'Giáp Băng Tinh', type: 'armor', rarity: 'rare', stats: { maxHp: 290, defense: 26 } },
      { name: 'Giáp Rồng Lửa', type: 'armor', rarity: 'epic', stats: { maxHp: 550, defense: 45 } },
      { name: 'Thiên Binh Thiết Giáp', type: 'armor', rarity: 'epic', stats: { maxHp: 750, defense: 60 } },
      { name: 'Thiên Giáp Hoàng Kim', type: 'armor', rarity: 'legendary', stats: { maxHp: 1600, defense: 120 } },
      { name: 'Chân Long Bảo Giáp', type: 'armor', rarity: 'legendary', stats: { maxHp: 2200, defense: 160 } },
      { name: 'Bất Diệt Thần Y', type: 'armor', rarity: 'mythic', stats: { maxHp: 5500, defense: 380 } },
      { name: 'Hỗn Nguyên Thánh Giáp', type: 'armor', rarity: 'mythic', stats: { maxHp: 8000, defense: 520 } },
      { name: 'Vạn Tượng Hư Vô Khải', type: 'armor', rarity: 'chaos', stats: { maxHp: 25000, defense: 1600 } },
      { name: '⟦ BẤT TỬ BẤT DIỆT THẦN QUÂN KHẢI ⟧', type: 'armor', rarity: 'unknown', stats: { maxHp: 88888, defense: 5555 } }
    ],
    accessories: [
      { name: 'Nhẫn Đồng Thô', type: 'accessory', rarity: 'common', stats: { goldRate: 0.05, maxHp: 20 } },
      { name: 'Dây Chuyền Đá Xám', type: 'accessory', rarity: 'common', stats: { speed: 2, attack: 3 } },
      { name: 'Vòng Gỗ Hộ Thân', type: 'accessory', rarity: 'common', stats: { defense: 3, maxHp: 25 } },
      { name: 'Nhẫn Bạc May Mắn', type: 'accessory', rarity: 'rare', stats: { goldRate: 0.15, speed: 5, attack: 8 } },
      { name: 'Bùa Hộ Mệnh Phong Ấn', type: 'accessory', rarity: 'rare', stats: { defense: 12, maxHp: 120, speed: 6 } },
      { name: 'Ngọc Bội Lam Tinh', type: 'accessory', rarity: 'rare', stats: { attack: 14, defense: 8, maxHp: 100 } },
      { name: 'Nhẫn Xích Long', type: 'accessory', rarity: 'epic', stats: { attack: 28, speed: 12, goldRate: 0.25 } },
      { name: 'Vòng Cổ Ma Thuật', type: 'accessory', rarity: 'epic', stats: { maxHp: 400, defense: 30, speed: 15 } },
      { name: 'Hoàng Đế Thần Giới', type: 'accessory', rarity: 'legendary', stats: { attack: 75, maxHp: 1000, speed: 25, goldRate: 0.50 } },
      { name: 'Long Nhãn Thần Châu', type: 'accessory', rarity: 'legendary', stats: { attack: 95, defense: 70, speed: 32, maxHp: 1200 } },
      { name: 'Lục Đạo Luân Hồi Giới', type: 'accessory', rarity: 'mythic', stats: { attack: 280, maxHp: 3500, defense: 180, speed: 50, goldRate: 1.2 } },
      { name: 'Thiên Mệnh Thần Châu', type: 'accessory', rarity: 'mythic', stats: { attack: 380, maxHp: 4500, defense: 240, speed: 65, goldRate: 1.5 } },
      { name: 'Hư Không Chi Tâm', type: 'accessory', rarity: 'chaos', stats: { attack: 1100, maxHp: 15000, defense: 800, speed: 120, goldRate: 3.5 } },
      { name: '⟦ VÔ CỰC NGHỊCH MỆNH THẦN CHÂU ⟧', type: 'accessory', rarity: 'unknown', stats: { attack: 6666, maxHp: 66666, defense: 3333, speed: 200, goldRate: 10.0 } }
    ]
  },

  // Danh sách Anh Hùng & Nhân Vật (Phong cách Genshin Impact & Wuthering Waves)
  HEROES_LIST: [
    {
      id: 'hero_traveler',
      name: 'Nhà Lữ Hành',
      title: 'Hiệp Sĩ Khởi Đầu',
      rarity: 'common',
      element: 'anemo',
      elementName: 'Phong 🍃',
      elementColor: '#00e676',
      atkBonusPct: 0.05, hpBonusPct: 0.05, defBonusPct: 0.05, spdBonus: 2,
      skills: [
        { id: 's1', name: 'Ý Chí Khởi Hành', type: 'passive', icon: '✨', desc: 'Tăng vĩnh viễn 8% Sát thương và 5% Tốc độ đánh.', bonusAtk: 0.08 },
        { id: 's2', name: 'Phong Nhận Trảm', type: 'active', icon: '🌪️', cd: 6, dmgMult: 1.8, desc: 'Tụ gió chém bão lốc gây 180% ATK sát thương Phong.' },
        { id: 's3', name: 'Hoang Phong Cuồng Triều', type: 'burst', icon: '🌀', cd: 16, dmgMult: 4.5, desc: 'Tạo lốc xoáy khổng lồ cuốn phăng địch gây 450% ATK sát thương.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Cuồng Phong Hộ Thân', desc: 'Tăng 15% Sát thương và +10% Tốc độ đánh.', bonusAtk: 0.15, extraSpd: 2 },
        { level: 2, name: 'E2: Phong Nhận Bão Tố', desc: 'Hồi chiêu Phong Nhận Trảm giảm 1.5s, sát thương tăng thêm 40%.', cdReduction: 1.5, skillDmgMult: 0.40 },
        { level: 3, name: 'E3: Ý Chí Phiêu Lưu', desc: 'Cấp kỹ năng bị động +3. Tăng vĩnh viễn 25% ATK & DEF.', bonusAtk: 0.25, bonusDef: 0.25 },
        { level: 4, name: 'E4: Lốc Gió Chắn Đòn', desc: 'Khi nhận sát thương có 35% tỉ lệ giảm 40% sát thương phải chịu.', uniquePassive: 'wind_shield' },
        { level: 5, name: 'E5: Bão Táp Thần Phong', desc: 'Cấp Nộ Tuyệt Kỹ Hoang Phong Cuồng Triều +3. Sát thương Nộ tăng thêm 80%.', burstDmgMult: 0.80 },
        { level: 6, name: 'E6: Thiên Phong Thức Tỉnh', desc: 'Đòn đánh kèm lốc xoáy gây thêm 150% ATK, tăng 35% tỉ lệ đòn bồi Extra Turn!', extraTurnBonus: 0.35, uniquePassive: 'wind_slashes' }
      ]
    },
    {
      id: 'hero_amber',
      name: 'Amber',
      title: 'Kỵ Sĩ Trinh Sát Tây Phong',
      rarity: 'rare',
      element: 'pyro',
      elementName: 'Hỏa 🔥',
      elementColor: '#ff7043',
      atkBonusPct: 0.12, hpBonusPct: 0.10, defBonusPct: 0.08, spdBonus: 6,
      skills: [
        { id: 's1', name: 'Tia Lửa Trinh Sát', type: 'passive', icon: '🔥', desc: 'Tăng 15% Sát thương và tăng 15% lượng Vàng nhận được.', bonusAtk: 0.15, bonusGold: 0.15 },
        { id: 's2', name: 'Quán Quân Baron Bunny', type: 'active', icon: '🐰', cd: 5.5, dmgMult: 2.2, desc: 'Ném búp bê khiêu khích phát nổ gây 220% ATK sát thương Hỏa.' },
        { id: 's3', name: 'Mưa Tên Rực Lửa (Fiery Rain)', type: 'burst', icon: '🏹', cd: 13, dmgMult: 5.8, desc: 'Bắn mưa mũi tên lửa từ bầu trời thiêu rụi mục tiêu gây 580% ATK sát thương.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Nhất Tiễn Song Điêu', desc: 'Đòn đánh thường bắn thêm 1 mũi tên lửa phụ gây 75% sát thương.', uniquePassive: 'double_arrow' },
        { level: 2, name: 'E2: Bộc Phá Baron Bunny', desc: 'Bunny nổ gây thêm 100% sát thương Hỏa và giảm hồi chiêu 1.5s.', cdReduction: 1.5, skillDmgMult: 1.0 },
        { level: 3, name: 'E3: Tia Lửa Thiêu Đốt', desc: 'Cấp kỹ năng bị động +3. Tăng 35% ATK và +30% Vàng rơi.', bonusAtk: 0.35, bonusGold: 0.30 },
        { level: 4, name: 'E4: Khiên Lửa Tây Phong', desc: 'Giảm 25% sát thương nhận vào, tự thiêu đốt quái mỗi lượt.', bonusDef: 0.30 },
        { level: 5, name: 'E5: Hỏa Vũ Cuồng Nộ', desc: 'Cấp Nộ Mưa Tên Rực Lửa +3. Sát thương Nộ tăng thêm 90%.', burstDmgMult: 0.90 },
        { level: 6, name: 'E6: Bão Lửa Liêu Nguyên', desc: 'Sau khi tung Nộ, tăng 50% Tốc độ đánh và 60% Sát thương toàn đội!', extraSpd: 15, uniquePassive: 'fire_storm' }
      ]
    },
    {
      id: 'hero_kazuha',
      name: 'Kaedehara Kazuha',
      title: 'Phong Lãng Khách Tụ Địch',
      rarity: 'epic',
      element: 'anemo',
      elementName: 'Phong 🍃',
      elementColor: '#69f0ae',
      atkBonusPct: 0.20, hpBonusPct: 0.15, defBonusPct: 0.10, spdBonus: 10,
      skills: [
        { id: 's1', name: 'Thiên Hướng Thi Ca', type: 'passive', icon: '🍃', desc: 'Tăng 25% Sát thương và tăng 15% tỉ lệ đòn bồi Extra Turn.', bonusAtk: 0.25 },
        { id: 's2', name: 'Chihayaburu (Gió Lốc Bạt Mây)', type: 'active', icon: '🍂', cd: 6, dmgMult: 2.6, desc: 'Lướt gió chém rơi từ trên không gây 260% ATK sát thương Phong.' },
        { id: 's3', name: 'Vạn Diệp Nhất Hoang', type: 'burst', icon: '🍁', cd: 14, dmgMult: 7.2, desc: 'Mở rộng Vùng Lá Phong thi triển nhát kiếm thi văn gây 720% ATK sát thương cực lớn.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Xích Trảm Xuyên Mây', desc: 'Tung Nộ lập tức làm mới 100% hồi chiêu của Kỹ năng Chihayaburu!', uniquePassive: 'reset_skill2_on_burst' },
        { level: 2, name: 'E2: Gió Cuốn Sơn Hà', desc: 'Tăng 35% tỉ lệ đòn bồi Extra Turn và +45% Sát thương Phong.', extraTurnBonus: 0.35, bonusAtk: 0.45 },
        { level: 3, name: 'E3: Thu Sương Tụ Hội', desc: 'Cấp kỹ năng Chihayaburu +3. Sát thương kỹ năng tăng 60%.', skillDmgMult: 0.60 },
        { level: 4, name: 'E4: Thi Ca Lãng Tử', desc: 'Hồi phục 10% Max HP mỗi khi tung kỹ năng, tăng 30% Tốc độ chạy.', extraSpd: 12, uniquePassive: 'kazuha_heal' },
        { level: 5, name: 'E5: Vạn Diệp Phong Lưu', desc: 'Cấp Nộ Vạn Diệp Nhất Hoang +3. Vùng lá phong tồn tại vĩnh viễn.', burstDmgMult: 1.2 },
        { level: 6, name: 'E6: Huyết Mạch Phong Kiếm', desc: 'Đính kèm Phong vào kiếm, đòn đánh xuyên 40% giáp của đối thủ và bạo kích liên tục!', uniquePassive: 'anemo_infusion' }
      ]
    },
    {
      id: 'hero_zhongli',
      name: 'Zhongli',
      title: 'Nham Vương Trấn Thế',
      rarity: 'legendary',
      element: 'geo',
      elementName: 'Nham 🪨',
      elementColor: '#ffab00',
      atkBonusPct: 0.25, hpBonusPct: 0.40, defBonusPct: 0.35, spdBonus: 5,
      skills: [
        { id: 's1', name: 'Khiên Ngọc Nham Thạch', type: 'passive', icon: '🛡️', desc: 'Tăng 40% Phòng thủ và tự hồi 5% Max HP mỗi lượt đánh.', bonusDef: 0.40 },
        { id: 's2', name: 'Địa Tâm Thạch Trụ', type: 'active', icon: '🗿', cd: 7, dmgMult: 2.8, desc: 'Tạo cột đá Nham cộng hưởng gây 280% ATK sát thương và làm choáng kẻ địch.' },
        { id: 's3', name: 'Thiên Tinh Giáng Trần', type: 'burst', icon: '☄️', cd: 15, dmgMult: 9.0, desc: 'Gọi thiên thạch từ bầu trời nghiền nát mục tiêu gây 900% ATK sát thương Nham hủy diệt.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Thạch Trụ Song Trùng', desc: 'Tạo thêm 1 cột đá Nham cộng hưởng kép, tăng 60% sát thương Skill 2.', skillDmgMult: 0.60 },
        { level: 2, name: 'E2: Thạch Hồn Hộ Thể', desc: 'Khi kích hoạt Nộ Thiên Tinh, nhận lớp giáp Nham hấp thụ 100% Max HP!', uniquePassive: 'shield_burst' },
        { level: 3, name: 'E3: Ngọc Nham Kiên Cố', desc: 'Cấp Kỹ năng Địa Tâm Thạch Trụ +3. Tăng 50% Phòng thủ.', bonusDef: 0.50 },
        { level: 4, name: 'E4: Thiên Tinh Trừ Tà', desc: 'Thiên Tinh kéo dài thời gian Hóa Đá của đối thủ và tăng 50% sát thương.', burstDmgMult: 0.50 },
        { level: 5, name: 'E5: Trấn Nhương Thương Hải', desc: 'Cấp Nộ Thiên Tinh Giáng Trần +3. Sát thương Nộ tăng gấp đôi.', burstDmgMult: 1.0 },
        { level: 6, name: 'E6: Nham Vương Kim Thân', desc: 'Lớp giáp Nham chuyển hóa 40% sát thương nhận vào thành HỒI MÁU! Bất tử trước mọi Boss.', uniquePassive: 'zhongli_vamp_shield' }
      ]
    },
    {
      id: 'hero_jiyan',
      name: 'Jiyan (Tướng Quân Cơ Diễm)',
      title: 'Thanh Long Phá Trận',
      rarity: 'legendary',
      element: 'anemo',
      elementName: 'Thanh Long 🐉',
      elementColor: '#00e5ff',
      atkBonusPct: 0.35, hpBonusPct: 0.25, defBonusPct: 0.20, spdBonus: 15,
      skills: [
        { id: 's1', name: 'Long Hồn Chiến Ý', type: 'passive', icon: '🐲', desc: 'Tăng 35% Sát thương và tăng 25% tốc độ tấn công.', bonusAtk: 0.35 },
        { id: 's2', name: 'Phong Trảm Thương Long', type: 'active', icon: '🗡️', cd: 5.5, dmgMult: 3.2, desc: 'Múa thương hóa rồng quét ngang gây 320% ATK sát thương xé rách phòng thủ.' },
        { id: 's3', name: 'Thương Long Vạn Nhận Quy Tông', type: 'burst', icon: '🌪️', cd: 13, dmgMult: 10.5, desc: 'Triệu hồi Chân Long giáng thế càn quét chiến trường gây 1050% ATK sát thương bão tố.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Thương Long Tụ Khí', desc: 'Thêm 1 lần sử dụng Phong Trảm Thương Long không tốn hồi chiêu.', uniquePassive: 'extra_charge' },
        { level: 2, name: 'E2: Bá Vương Chiến Ý', desc: 'Vào trận nhận ngay +50% Sát thương và +25% Tốc độ đánh.', bonusAtk: 0.50, extraSpd: 15 },
        { level: 3, name: 'E3: Long Hồn Thức Tỉnh', desc: 'Cấp kỹ năng Phong Trảm +3. Sát thương thương thuật tăng 70%.', skillDmgMult: 0.70 },
        { level: 4, name: 'E4: Long Lân Bất Hoại', desc: 'Bỏ qua 40% Phòng thủ của toàn bộ quái vật và Boss.', uniquePassive: 'def_shred_40' },
        { level: 5, name: 'E5: Chân Long Xuất Thế', desc: 'Cấp Nộ Thương Long Vạn Nhận +3. Sát thương rồng tăng 120%.', burstDmgMult: 1.2 },
        { level: 6, name: 'E6: Thương Long Thần Uy', desc: 'Mỗi đòn đánh thường tung thêm Đao Khí Chân Long gây 300% ATK bạo kích cực đại!', uniquePassive: 'dragon_slash_e6' }
      ]
    },
    {
      id: 'hero_furina',
      name: 'Furina',
      title: 'Thủy Thần Ca Vũ Kịch',
      rarity: 'mythic',
      element: 'hydro',
      elementName: 'Thủy 💧',
      elementColor: '#29b6f6',
      atkBonusPct: 0.30, hpBonusPct: 0.35, defBonusPct: 0.20, spdBonus: 12,
      skills: [
        { id: 's1', name: 'Khúc Hoan Ca Muôn Dân', type: 'passive', icon: '🎭', desc: 'Tăng 30% Sát thương toàn thể và tăng 50% tỉ lệ rơi Vàng.', bonusGold: 0.50 },
        { id: 's2', name: 'Đoàn Khách Thủy Triều', type: 'active', icon: '🦀', cd: 6, dmgMult: 3.0, desc: 'Triệu hồi bạn bè Thủy sinh tấn công liên hoàn gây 300% ATK sát thương Thủy.' },
        { id: 's3', name: 'Vũ Điệu Muôn Dân Vạn Tuế', type: 'burst', icon: '🌊', cd: 14, dmgMult: 9.8, desc: 'Mở sân khấu nhạc kịch đại dương dâng sóng thần gây 980% ATK sát thương cuồng nộ.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Tình Ca Biển Cả', desc: 'Vào trận nhận ngay tối đa điểm Hoan Ca, tăng vĩnh viễn 50% Sát thương.', bonusAtk: 0.50 },
        { level: 2, name: 'E2: Thủy Triều Dâng Cao', desc: 'Giới hạn Max HP tăng 60%, sát thương kỹ năng tăng theo Máu tối đa.', bonusHp: 0.60 },
        { level: 3, name: 'E3: Sân Khấu Kịch Nghệ', desc: 'Cấp kỹ năng Đoàn Khách Thủy Triều +3. Sát thương thủy sinh tăng 80%.', skillDmgMult: 0.80 },
        { level: 4, name: 'E4: Hồi Âm Biển Sâu', desc: 'Tự hồi 12% Max HP mỗi lượt và tăng 100% tỉ lệ Vàng nhận được.', bonusGold: 1.0, uniquePassive: 'furina_regen' },
        { level: 5, name: 'E5: Khúc Hoan Ca Vạn Niên', desc: 'Cấp Nộ Vũ Điệu Muôn Dân +3. Sát thương sóng thần tăng gấp đôi.', burstDmgMult: 1.0 },
        { level: 6, name: 'E6: Vương Miện Vạn Thủy', desc: 'Đòn đánh thường chuyển thành Trảm Kích Thủy Thần gây 40% Max HP sát thương Thủy thuần khiết!', uniquePassive: 'furina_hp_slash' }
      ]
    },
    {
      id: 'hero_changli',
      name: 'Changli (Trường Ly)',
      title: 'Hỏa Phượng Liêu Nguyên',
      rarity: 'chaos',
      element: 'pyro',
      elementName: 'Hỏa 🔥',
      elementColor: '#ff1744',
      atkBonusPct: 0.50, hpBonusPct: 0.30, defBonusPct: 0.25, spdBonus: 22,
      skills: [
        { id: 's1', name: 'Xích Hỏa Phần Thiên', type: 'passive', icon: '🪶', desc: 'Tăng 50% Sát thương bạo kích và bỏ qua 20% giáp của mọi kẻ thù.', bonusAtk: 0.50 },
        { id: 's2', name: 'Chu Tước Nghịch Vũ', type: 'active', icon: '🔥', cd: 5, dmgMult: 4.2, desc: 'Biến hóa thành bóng phượng hoàng lướt chém lửa gây 420% ATK sát thương Hỏa.' },
        { id: 's3', name: 'Phượng Hoàng Niết Bàn Tuyệt Kỹ', type: 'burst', icon: '🦚', cd: 12, dmgMult: 14.0, desc: 'Triệu hồi Hỏa Phượng thiêu rụi toàn cõi gây 1400% ATK sát thương Hỏa thiêu đốt.' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Xích Hỏa Chiêm Đoán', desc: 'Tung kỹ năng tăng 40% ATK và miễn nhiễm bị đẩy lùi.', bonusAtk: 0.40 },
        { level: 2, name: 'E2: Phượng Vũ Nghịch Hỏa', desc: 'Tăng 35% Tỉ lệ Bạo kích và 70% Sát thương Bạo kích.', bonusAtk: 0.50, extraTurnBonus: 0.25 },
        { level: 3, name: 'E3: Chu Tước Luyện Hỏa', desc: 'Cấp kỹ năng Chu Tước Nghịch Vũ +3. Sát thương Hỏa Phượng tăng 80%.', skillDmgMult: 0.80 },
        { level: 4, name: 'E4: Thiêu Rụi Càn Khôn', desc: 'Đòn đánh thiêu đốt làm giảm 35% Giáp kẻ thù liên tục.', uniquePassive: 'def_shred_35' },
        { level: 5, name: 'E5: Niết Bàn Trùng Sinh', desc: 'Cấp Nộ Phượng Hoàng Niết Bàn +3. Khi hấp hối lập tức hồi sinh 100% HP (hồi chiêu 60s).', uniquePassive: 'phoenix_revive' },
        { level: 6, name: 'E6: Phượng Hoàng Thần Hỏa', desc: 'Nộ tuyệt kỹ bỏ qua 50% giáp của Boss, gây thêm Vụ Nổ Thần Hỏa 600% ATK cực kỳ chấn động!', uniquePassive: 'changli_super_burst' }
      ]
    },
    {
      id: 'hero_raiden',
      name: 'Raiden Shogun (Lôi Thần Ei)',
      title: 'Lôi Đình Tịch Diệt Vĩnh Cửu',
      rarity: 'chaos',
      element: 'electro',
      elementName: 'Lôi ⚡',
      elementColor: '#d500f9',
      atkBonusPct: 0.60, hpBonusPct: 0.35, defBonusPct: 0.30, spdBonus: 28,
      skills: [
        { id: 's1', name: 'Thần Mâu Vĩnh Cửu', type: 'passive', icon: '⚡', desc: 'Tăng 60% Sát thương và tăng 35% tốc độ tấn công, đòn đánh luôn kèm sét giật.', bonusAtk: 0.60 },
        { id: 's2', name: 'Lôi Phạt Thần Uy', type: 'active', icon: '🗡️', cd: 4.5, dmgMult: 4.8, desc: 'Chém nhát kiếm Lôi phạt không gian gây 480% ATK sát thương điện giật làm tê liệt mục tiêu.' },
        { id: 's3', name: 'Mộng Tưởng Nhất Đao (Musou no Hitotachi)', type: 'burst', icon: '⚔️', cd: 11, dmgMult: 18.0, desc: 'Rút bảo kiếm từ lồng ngực chém đứt lìa không gian thời gian gây 1800% ATK sát thương hủy diệt!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Ác Ma Dục Vọng', desc: 'Tốc độ tích lũy Ý Lực Lôi Phạt tăng 100%, +40% Sát thương Lôi.', bonusAtk: 0.40 },
        { level: 2, name: 'E2: Trảm Phá Thiết Giáp', desc: '⚡ Mộng Tưởng Nhất Đao BỎ QUA 60% PHÒNG THỦ CỦA TOÀN BỘ KẺ ĐỊCH! (Đỉnh cao sức mạnh Lôi Thần)', uniquePassive: 'def_shred_60' },
        { level: 3, name: 'E3: Chân Lý Lôi Đình', desc: 'Cấp Nộ Mộng Tưởng Nhất Đao +3. Sát thương nhát chém tăng 150%.', burstDmgMult: 1.5 },
        { level: 4, name: 'E4: Lời Thề Vĩnh Cửu', desc: 'Sau khi chém Nộ, tăng 40% ATK vĩnh viễn và hồi máu 15% Max HP.', bonusAtk: 0.40 },
        { level: 5, name: 'E5: Phạt Thần Xuất Thế', desc: 'Cấp kỹ năng Lôi Phạt Thần Uy +3. Thời gian hồi chiêu giảm 1s.', cdReduction: 1.0 },
        { level: 6, name: 'E6: Thời Không Ngưng Trệ', desc: 'Nhát chém ngưng đọng thời gian, giảm 2s hồi chiêu toàn bộ kỹ năng mỗi đòn trúng, sấm sét Lôi Thần giật 350% ATK!', uniquePassive: 'raiden_timestop' }
      ]
    },
    {
      id: 'hero_unknown_god',
      name: 'Thiên Lý Khởi Nguyên (???)',
      title: 'Chúa Tể Hư Vô Vạn Vật',
      rarity: 'unknown',
      element: 'void',
      elementName: 'Hư Vô 🌌',
      elementColor: '#00ffcc',
      atkBonusPct: 2.0, hpBonusPct: 1.5, defBonusPct: 1.0, spdBonus: 60,
      skills: [
        { id: 's1', name: 'Thần Quyền Vô Cực', type: 'passive', icon: '🌌', desc: 'Tăng 200% Sát thương toàn thể, miễn nhiễm mọi hiệu ứng xấu và nhận 100% tỉ lệ đòn bồi.', bonusAtk: 2.0 },
        { id: 's2', name: 'Hư Không Phân Rã', type: 'active', icon: '⬛', cd: 4, dmgMult: 10.0, desc: 'Triệu hồi khối lập phương màu đỏ phong ấn và bóp nghẹt đối thủ gây 1000% ATK sát thương hư vô.' },
        { id: 's3', name: 'Tịch Diệt Thế Giới (Genesis Collapse)', type: 'burst', icon: '🌠', cd: 9, dmgMult: 50.0, desc: 'Tái tạo trật tự vũ trụ hủy diệt toàn bộ thực tại gây 5000% ATK sát thương Thần Thánh Vô Cực!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Khởi Nguyên Vô Giới', desc: 'Tăng 150% Sát thương toàn thể và +100% Máu tối đa.', bonusAtk: 1.5, bonusHp: 1.0 },
        { level: 2, name: 'E2: Khối Vuông Không Gian', desc: 'Skill 2 phong ấn đối thủ 2 lượt, đối thủ hoàn toàn bị bất động!', uniquePassive: 'freeze_enemy_2turns' },
        { level: 3, name: 'E3: Quyền Năng Sáng Thế', desc: 'Cấp kỹ năng Hư Không Phân Rã +3. Sát thương tăng gấp đôi.', skillDmgMult: 1.0 },
        { level: 4, name: 'E4: Trật Tự Bất Hoại', desc: 'Miễn nhiễm hoàn toàn 60% mọi sát thương nhận vào từ vũ trụ.', bonusDef: 1.0 },
        { level: 5, name: 'E5: Tịch Diệt Tinh Cầu', desc: 'Cấp Nộ Tịch Diệt Thế Giới +3. Sát thương Nộ tăng gấp 3 lần!', burstDmgMult: 2.0 },
        { level: 6, name: 'E6: ⟦ VÔ THƯỢNG THẦN LINH ⟧', desc: 'Tuyệt đỉnh tối thượng: Đòn đánh thường kèm Hư Vô Trảm 800% ATK, đòn Nộ hủy diệt kết liễu thẳng mọi kẻ thù dưới 25% HP!', uniquePassive: 'execute_god_e6' }
      ]
    }
  ],

  // Hệ Thống Phó Bản & Tháp Thí Luyện Độc Bản
  DUNGEONS: [
    {
      id: 'dungeon_gold',
      name: 'Mỏ Vàng Hoàng Kim',
      icon: '🪙',
      badge: 'MỎ VÀNG',
      badgeColor: '#ffd700',
      theme: 'gold',
      desc: 'Hang động quặng vàng lấp lánh, tiêu diệt Yêu Tinh Đào Mỏ thu hoạch gấp 25 lần Vàng!',
      waves: 5,
      goldMult: 25,
      expMult: 1,
      runeDropChance: 0.10,
      dailyLimit: 3
    },
    {
      id: 'dungeon_exp',
      name: 'Bí Cảnh Tinh Linh Cổ Xưa',
      icon: '✨',
      badge: 'BÍ CẢNH EXP',
      badgeColor: '#00e5ff',
      theme: 'exp',
      desc: 'Thánh địa mạch ngầm ma pháp ngàn năm, hấp thụ đại lượng EXP thăng cấp vũ bão gấp 20 lần!',
      waves: 5,
      goldMult: 1,
      expMult: 20,
      runeDropChance: 0.10,
      dailyLimit: 3
    },
    {
      id: 'dungeon_rune',
      name: 'Thánh Địa Bùa Chú',
      icon: '🛡️',
      badge: 'THÁNH ĐỊA BÙA',
      badgeColor: '#b026ff',
      theme: 'rune',
      desc: 'Điện thờ cổ linh thiêng lưu giữ ấn chú hộ thân, tỉ lệ cực cao rơi Bùa Bảo Hiểm Rèn Thần Khí!',
      waves: 5,
      goldMult: 4,
      expMult: 4,
      runeDropChance: 0.28,
      dailyLimit: 3
    },
    {
      id: 'dungeon_forge',
      name: 'Thánh Địa Rèn & Khoáng Thạch',
      icon: '🔨',
      badge: 'LÒ RÈN THẦN KHÍ',
      badgeColor: '#ff5722',
      theme: 'forge',
      desc: 'Lò rèn dung nham địa ngục, săn tìm khoáng thạch quý hiếm, Đá Cường Hóa & Trang Bị Thần Khí!',
      waves: 5,
      goldMult: 6,
      expMult: 5,
      forgeDropChance: 0.40,
      dailyLimit: 3
    },
    {
      id: 'dungeon_abyss',
      name: 'Hư Không Tháp (Leo Tháp Vô Tận)',
      icon: '🌌',
      badge: 'LEO THÁP',
      badgeColor: '#ff0055',
      theme: 'tower',
      desc: 'Leo tháp vô tận đối đầu quái vật hư không tăng dần độ khó. Cứ mỗi 10 tầng chạm trán 1 ĐẠI TRÙM THÁP cực mạnh! Nhận Kim Cương 💎 và Thần Khí ???',
      waves: 1,
      isTower: true,
      dailyLimit: 999
    }
  ],

  GAME_VERSION: '2.2.3',
  UPDATE_URL: 'https://idle-game-ms6o.onrender.com/api/version',
  SERVER_URL: 'https://idle-game-ms6o.onrender.com/api',
  AUTO_SAVE_INTERVAL: 20000,
  MAX_OFFLINE_SECONDS: 86400,
  SAVE_KEY: 'idle_rpg_save_v2'
};

CONFIG.getExpForLevel = function(level) {
  return Math.floor(this.EXP_BASE * Math.pow(level, this.EXP_GROWTH));
};

CONFIG.getUpgradeCost = function(type, currentLevel) {
  const cfg = this.UPGRADES[type];
  return cfg ? Math.floor(cfg.costBase * Math.pow(cfg.costGrowth, currentLevel)) : Infinity;
};

CONFIG.getMonsterForLevel = function(playerLevel) {
  let best = this.MONSTERS[0];
  for (let i = this.MONSTERS.length - 1; i >= 0; i--) {
    if (playerLevel >= this.MONSTERS[i].tier) {
      best = this.MONSTERS[i];
      break;
    }
  }
  return best;
};

CONFIG.getItemsByRarity = function(rarity) {
  const all = [...this.ITEMS.weapons, ...this.ITEMS.armors, ...this.ITEMS.accessories];
  return all.filter(item => item.rarity === rarity);
};

CONFIG.getHeroById = function(heroId) {
  return this.HEROES_LIST.find(h => h.id === heroId) || this.HEROES_LIST[0];
};

CONFIG.getHeroesByRarity = function(rarity) {
  return this.HEROES_LIST.filter(h => h.rarity === rarity);
};

CONFIG.getDungeonById = function(dungeonId) {
  return this.DUNGEONS.find(d => d.id === dungeonId) || this.DUNGEONS[0];
};

CONFIG.getTowerBossInfo = function(floor) {
  const bossPresets = [
    { title: 'Khổng Lồ Tinh Thể Hư Không', emoji: '👑💎', desc: 'Hộ vệ tinh thể kết tinh ma năng trấn giữ tháp sơ cấp', hpMult: 3.6, atkMult: 2.2 },
    { title: 'Hắc Ám Kiếm Thánh Viễn Cổ', emoji: '👑⚔️', desc: 'Kiếm hồn bất tử sử dụng kiếm khí hư không chém nát vạn vật', hpMult: 4.8, atkMult: 2.6 },
    { title: 'Ma Hoàng Hỏa Ngục Hỗn Mang', emoji: '👑🔥', desc: 'Bạo chúa thiêu đốt hư không bằng ngọn lửa vĩnh cửu', hpMult: 6.0, atkMult: 3.0 },
    { title: 'Long Thần Băng Phong Thái Cổ', emoji: '👑❄️', desc: 'Chúa tể hàn băng đóng băng vạn vật vũ trụ', hpMult: 7.5, atkMult: 3.5 },
    { title: 'Cổ Thần Hư Vô Tối Thượng', emoji: '👑🌌', desc: 'Thực thể siêu việt nắm giữ sức mạnh bản nguyên vũ trụ', hpMult: 9.5, atkMult: 4.2 }
  ];
  const idx = Math.max(0, Math.floor((floor / 10) - 1)) % bossPresets.length;
  const cycle = Math.floor((floor - 1) / (10 * bossPresets.length)) + 1;
  const base = bossPresets[idx] || bossPresets[0];
  return {
    name: `${base.title}${cycle > 1 ? ` (Vòng ${cycle})` : ''}`,
    emoji: base.emoji,
    desc: base.desc,
    hpMult: base.hpMult * (1 + (cycle - 1) * 0.5),
    atkMult: base.atkMult * (1 + (cycle - 1) * 0.4)
  };
};
