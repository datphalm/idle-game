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
  activeHeroId: 'hero_cassius',
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
    dailyRuns: { gold: 3, exp: 3, rune: 3, forge: 3 },
    lastResetDate: new Date().toDateString()
  },
  combat: { monstersKilled: 0 },
  boss: { active: false, bossIndex: 0, hp: 0, maxHp: 0, timer: 0, timerMax: 0, rage: 0, rageMax: 100 },
  settings: {
    vfxEnabled: true,
    autoBurst: true
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
  SKILL_MAX_LEVEL: 1000,

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

  // Danh sách Anh Hùng Pixel (Chuẩn 7 Phẩm Cấp: Thường -> ???)
  HEROES_LIST: [
    {
      id: 'hero_starter',
      name: 'Hiệp Sĩ Khởi Đầu',
      title: 'Tân Thủ Tập Sự Chiến Trường',
      rarity: 'common',
      element: 'physical',
      elementName: 'Thép ⚔️',
      elementColor: '#94a3b8',
      pixelArchetype: 'starter_knight',
      atkBonusPct: 0.05, hpBonusPct: 0.05, defBonusPct: 0.05, spdBonus: 2,
      skills: [
        { id: 's1', name: 'Ý Chí Tập Sự', type: 'passive', icon: '✨', desc: 'Tăng 10% Sát thương và 5% Tốc độ đánh.', bonusAtk: 0.10 },
        { id: 's2', name: 'Tập Tự Trảm', type: 'active', icon: '⚔️', cd: 5.0, dmgMult: 2.0, desc: 'Nhát chém chữ thập cơ bản gây 200% ATK sát thương Thép.' },
        { id: 's3', name: 'Khai Sơn Phá Thạch', type: 'burst', icon: '💥', cd: 12.0, dmgMult: 5.5, desc: 'Dồn toàn lực dậm kiếm chém nứt mặt đất gây 550% ATK sát thương uy lực!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Ý Chí Bất Khuất', desc: 'Tăng 15% Sát thương và +10% Tốc độ đánh.', bonusAtk: 0.15, extraSpd: 2 },
        { level: 2, name: 'E2: Kiếm Khí Thép', desc: 'Hồi chiêu Tập Tự Trảm giảm 1.0s, sát thương tăng thêm 35%.', cdReduction: 1.0, skillDmgMult: 0.35 },
        { level: 3, name: 'E3: Khổ Luyện Thành Tài', desc: 'Cấp kỹ năng bị động +3. Tăng vĩnh viễn 25% ATK & DEF.', bonusAtk: 0.25, bonusDef: 0.25 },
        { level: 4, name: 'E4: Khiên Sắt Kiên Cố', desc: 'Khi nhận sát thương có 30% tỉ lệ giảm 35% sát thương phải chịu.', uniquePassive: 'starter_iron_shield' },
        { level: 5, name: 'E5: Phá Thạch Thần Lực', desc: 'Cấp Nộ Tuyệt Kỹ Khai Sơn Phá Thạch +3. Sát thương Nộ tăng thêm 75%.', burstDmgMult: 0.75 },
        { level: 6, name: 'E6: Khởi Nguyên Anh Hùng', desc: 'Đòn đánh kèm đao khí gây thêm 140% ATK, tăng 30% tỉ lệ đòn bồi Extra Turn!', extraTurnBonus: 0.30, uniquePassive: 'starter_slashes' }
      ]
    },
    {
      id: 'hero_shadow_rogue',
      name: 'Thích Khách Song Đao',
      title: 'Bóng Ma Đoạt Hồn Ám Dạ',
      rarity: 'rare',
      element: 'anemo',
      elementName: 'Ám Dạ 🗡️',
      elementColor: '#3b82f6',
      pixelArchetype: 'shadow_rogue',
      atkBonusPct: 0.15, hpBonusPct: 0.10, defBonusPct: 0.08, spdBonus: 10,
      skills: [
        { id: 's1', name: 'Ám Sát Bản Năng', type: 'passive', icon: '🗡️', desc: 'Tăng 18% Sát thương, +15% Tỉ lệ Bạo kích và +15% Tốc độ đánh.', bonusAtk: 0.18 },
        { id: 's2', name: 'Song Đao Loạn Vũ', type: 'active', icon: '💨', cd: 4.8, dmgMult: 2.8, desc: 'Lướt bóng đêm ra sau lưng đối thủ chém 4 nhát song đao chớp nhoáng gây 280% ATK sát thương.' },
        { id: 's3', name: 'Ảo Ảnh Tuyệt Sát', type: 'burst', icon: '👥', cd: 12.0, dmgMult: 7.5, desc: 'Phân thân thành vô số bóng mờ trảm sát liên hoàn gây 750% ATK sát thương bạo kích!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Ảnh Bộ Vô Tung', desc: 'Tăng 25% Tốc độ di chuyển và +25% sát thương Bạo kích.', extraSpd: 10, bonusAtk: 0.25 },
        { level: 2, name: 'E2: Đoạt Mệnh Song Đao', desc: 'Song Đao Loạn Vũ giảm 1.0s hồi chiêu, khi chí mạng lập tức hồi lại 1 lần đánh.', cdReduction: 1.0, skillDmgMult: 0.40 },
        { level: 3, name: 'E3: Thuật Thích Khách', desc: 'Cấp kỹ năng Ám Sát +3. Tăng 40% Sát thương toàn diện.', bonusAtk: 0.40 },
        { level: 4, name: 'E4: Khí Tức Bóng Tối', desc: 'Có 30% tỉ lệ né tránh hoàn toàn đòn tấn công của đối thủ.', uniquePassive: 'shadow_dodge' },
        { level: 5, name: 'E5: Huyễn Ảnh Cuồng Phong', desc: 'Cấp Nộ Ảo Ảnh Tuyệt Sát +3. Sát thương tăng thêm 80%.', burstDmgMult: 0.8 },
        { level: 6, name: 'E6: Tử Thần Đoạt Hồn', desc: 'Đòn đánh thường có 40% tỉ lệ chém thêm 2 nhát đao khí bóng tối 180% ATK bạo kích!', uniquePassive: 'rogue_shadow_slashes' }
      ]
    },
    {
      id: 'hero_frost_knight',
      name: 'Băng Kiếm Sĩ',
      title: 'Chiến Tướng Băng Hà Vĩnh Cửu',
      rarity: 'epic',
      element: 'cryo',
      elementName: 'Hàn Băng ❄️',
      elementColor: '#00e5ff',
      pixelArchetype: 'frost_knight',
      atkBonusPct: 0.25, hpBonusPct: 0.25, defBonusPct: 0.20, spdBonus: 12,
      skills: [
        { id: 's1', name: 'Băng Tinh Hộ Thể', type: 'passive', icon: '🛡️', desc: 'Tăng 30% Phòng thủ, giảm 20% sát thương nhận vào và tự hồi 5% Max HP mỗi lượt.', bonusDef: 0.30 },
        { id: 's2', name: 'Hàn Băng Thập Tự Trảm', type: 'active', icon: '🗡️', cd: 5.5, dmgMult: 3.5, desc: 'Vung kiếm băng chém chữ thập gây 350% ATK sát thương Hàn Băng và làm chậm quái.' },
        { id: 's3', name: 'Băng Phong Tuyệt Vực', type: 'burst', icon: '❄️', cd: 12.5, dmgMult: 9.8, desc: 'Triệu hồi bão chông băng nhọn đâm xuyên từ lòng đất gây 980% ATK sát thương và đóng băng kẻ địch!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Hàn Sương Phá Giáp', desc: 'Đòn đánh làm giảm 30% Giáp kẻ thù trong suốt trận chiến.', uniquePassive: 'frost_def_shred' },
        { level: 2, name: 'E2: Băng Khiên Tinh Thể', desc: 'Khi tung Nộ lập tức nhận lớp giáp Băng hấp thụ sát thương tương đương 60% Max HP!', uniquePassive: 'frost_shield_burst' },
        { level: 3, name: 'E3: Tâm Băng Vô Cực', desc: 'Cấp kỹ năng Thập Tự Trảm +3. Sát thương kiếm băng tăng 60%.', skillDmgMult: 0.60 },
        { level: 4, name: 'E4: Huyết Mạch Băng Hà', desc: 'Hồi phục 12% Max HP mỗi khi tung kỹ năng, miễn nhiễm choáng.', bonusHp: 0.35 },
        { level: 5, name: 'E5: Băng Tuyết Cuồng Triều', desc: 'Cấp Nộ Băng Phong Tuyệt Vực +3. Sát thương bão băng tăng gấp đôi.', burstDmgMult: 1.0 },
        { level: 6, name: 'E6: Cực Hàn Thần Uy', desc: 'Đòn đánh thường chuyển thành Trảm Kích Băng Cực Hạn gây thêm 25% Max HP sát thương bỏ qua phòng thủ!', uniquePassive: 'frost_hp_slash' }
      ]
    },
    {
      id: 'hero_spear_lancer',
      name: 'Long Thương Thủ',
      title: 'Đệ Nhất Long Thương Hoàng Gia',
      rarity: 'legendary',
      element: 'electro',
      elementName: 'Lôi Long ⚡',
      elementColor: '#ffd700',
      pixelArchetype: 'spear_lancer',
      atkBonusPct: 0.40, hpBonusPct: 0.30, defBonusPct: 0.25, spdBonus: 20,
      skills: [
        { id: 's1', name: 'Thương Tâm Hợp Nhất', type: 'passive', icon: '⚡', desc: 'Tăng 40% Sát thương, +30% Tốc độ đánh và tăng 35% tỉ lệ đòn bồi Extra Turn!', bonusAtk: 0.40, extraTurnBonus: 0.35 },
        { id: 's2', name: 'Lôi Thương Xuyên Thấu', type: 'active', icon: '🔱', cd: 5.0, dmgMult: 4.2, desc: 'Đâm mũi trường thương bọc sấm sét chớp nhoáng gây 420% ATK sát thương xuyên thấu.' },
        { id: 's3', name: 'Kim Long Phá Thiên', type: 'burst', icon: '🐉', cd: 12.0, dmgMult: 13.5, desc: 'Khai mở long hồn phóng đại thương phá vỡ không gian gây 1350% ATK sát thương sấm rồng hủy diệt!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Thần Hành Vô Ảnh', desc: 'Tăng thêm 25% Tốc độ đánh và +40% sát thương đòn bồi Extra Turn.', bonusAtk: 0.30, extraSpd: 15 },
        { level: 2, name: 'E2: Lôi Đình Thương Ý', desc: 'Lôi Thương Xuyên Thấu giảm 1.5s hồi chiêu, hồi chiêu xong tự động bồi thêm 1 phát đâm.', cdReduction: 1.5, skillDmgMult: 0.60 },
        { level: 3, name: 'E3: Long Hồn Chiến Pháp', desc: 'Cấp kỹ năng Thương Tâm +3. Tăng 60% Sát thương toàn đội.', bonusAtk: 0.60 },
        { level: 4, name: 'E4: Phá Trận Thần Thương', desc: 'Mọi đòn đánh đều bỏ qua 45% phòng thủ của Boss và quái vật.', uniquePassive: 'lancer_def_shred' },
        { level: 5, name: 'E5: Cửu Tiêu Long Ngâm', desc: 'Cấp Nộ Kim Long Phá Thiên +3. Sát thương rồng sấm tăng thêm 130%.', burstDmgMult: 1.3 },
        { level: 6, name: 'E6: Vạn Thương Quy Tông', desc: 'Mỗi đòn đánh thường tung thêm Đao Khí Chân Long gây 320% ATK bạo kích cực đại!', uniquePassive: 'lancer_dragon_slash' }
      ]
    },
    {
      id: 'hero_flame_knight',
      name: 'Kiếm Sĩ Hỏa Diệm',
      title: 'Bậc Thầy Trảm Kích Rực Lửa',
      rarity: 'mythic',
      element: 'pyro',
      elementName: 'Hỏa Diệm 🔥',
      elementColor: '#ff3d00',
      pixelArchetype: 'flame_knight',
      atkBonusPct: 0.55, hpBonusPct: 0.40, defBonusPct: 0.30, spdBonus: 22,
      skills: [
        { id: 's1', name: 'Hỏa Hồn Bất Diệt', type: 'passive', icon: '🔥', desc: 'Tăng 55% Sát thương và tăng 45% sát thương Bạo kích Hỏa.', bonusAtk: 0.55 },
        { id: 's2', name: 'Hỏa Diệm Đoạt Mệnh', type: 'active', icon: '⚔️', cd: 4.8, dmgMult: 4.8, desc: 'Vung đại kiếm rực lửa chém bùng nổ gây 480% ATK sát thương Hỏa.' },
        { id: 's3', name: 'Thiêu Càn Liệu Khôn', type: 'burst', icon: '🌋', cd: 12.0, dmgMult: 16.5, desc: 'Cắm đại kiếm xuống đất kích phát trận địa cột lửa hủy diệt gây 1650% ATK sát thương cực đại!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Hỏa Lực Trùng Trùng', desc: 'Tăng 45% Sát thương và +20% Tốc độ đánh.', bonusAtk: 0.45, extraSpd: 10 },
        { level: 2, name: 'E2: Liệt Diệm Kiếm Khí', desc: 'Hỏa Diệm Đoạt Mệnh giảm 1.5s hồi chiêu và gây thêm 80% sát thương.', cdReduction: 1.5, skillDmgMult: 0.80 },
        { level: 3, name: 'E3: Hỏa Ma Thức Tỉnh', desc: 'Cấp kỹ năng Hỏa Hồn Bất Diệt +3. Tăng 50% Sát thương bạo kích.', bonusAtk: 0.50 },
        { level: 4, name: 'E4: Giáp Lửa Bất Diệt', desc: 'Giảm 30% sát thương nhận vào, tự thiêu đốt quái vật mỗi hiệp.', bonusDef: 0.35 },
        { level: 5, name: 'E5: Vạn Hỏa Triều Quy', desc: 'Cấp Nộ Thiêu Càn Liệu Khôn +3. Sát thương Nộ tăng thêm 120%.', burstDmgMult: 1.2 },
        { level: 6, name: 'E6: Hỏa Thần Giáng Thế', desc: 'Nhát chém Nộ bỏ qua 50% giáp của đối thủ, kích phát vụ nổ hỏa diệm liên tiếp 450% ATK!', uniquePassive: 'flame_super_burst' }
      ]
    },
    {
      id: 'hero_arcane_mage',
      name: 'Đại Pháp Sư Hư Không',
      title: 'Chủ Nhân Cổ Thư Cấm Thuật',
      rarity: 'chaos',
      element: 'void',
      elementName: 'Hư Vô 🔮',
      elementColor: '#b026ff',
      pixelArchetype: 'arcane_mage',
      atkBonusPct: 0.75, hpBonusPct: 0.50, defBonusPct: 0.35, spdBonus: 28,
      skills: [
        { id: 's1', name: 'Ma Đạo Cổ Thư', type: 'passive', icon: '📖', desc: 'Tăng 75% Sát thương, miễn nhiễm suy yếu và tự hồi phục 10% Max HP mỗi hiệp đấu.', bonusAtk: 0.75 },
        { id: 's2', name: 'Hư Vô Phù Chú', type: 'active', icon: '🔮', cd: 4.5, dmgMult: 5.8, desc: 'Khai mở cổ thư cấm thuật bắn chùm ấn chú hư không ma thuật gây 580% ATK sát thương Hư Vô.' },
        { id: 's3', name: 'Hắc Động Tịch Diệt', type: 'burst', icon: '🌌', cd: 11.5, dmgMult: 22.0, desc: 'Triệu hồi pháp trận hắc động bóp nghẹt và nghiền nát không thời gian gây 2200% ATK sát thương bạo kích tuyệt đối!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Bí Thuật Khởi Nguyên', desc: 'Tăng 60% Sát thương phép thuật và +30% Tốc độ đánh.', bonusAtk: 0.60, extraSpd: 15 },
        { level: 2, name: 'E2: Trọng Lực Hư Không', desc: 'Kỹ năng Hư Vô Phù Chú làm tê liệt đối thủ 1 lượt và giảm 50% Giáp đối thủ.', uniquePassive: 'void_gravity' },
        { level: 3, name: 'E3: Ma Pháp Tối Thượng', desc: 'Cấp kỹ năng Cổ Thư +3. Sát thương kỹ năng tăng 80%.', skillDmgMult: 0.80 },
        { level: 4, name: 'E4: Khiên Ma Pháp Vĩnh Hằng', desc: 'Hấp thụ 40% sát thương nhận vào chuyển hóa thành hồi máu.', uniquePassive: 'mage_vamp_shield' },
        { level: 5, name: 'E5: Hắc Động Vô Tận', desc: 'Cấp Nộ Hắc Động Tịch Diệt +3. Sát thương tăng gấp đôi.', burstDmgMult: 1.0 },
        { level: 6, name: 'E6: Ma Thần Tái Thế', desc: 'Tung Nộ bỏ qua 60% giáp của Boss, gây thêm Vụ Nổ Hư Không 650% ATK chấn động toàn cõi!', uniquePassive: 'mage_singularity_e6' }
      ]
    },
    {
      id: 'hero_aetheris',
      name: 'Aetheris — Tinh Vực Đại Pháp Sư',
      title: 'Chúa Tể Tinh Cầu & Vạn Cổ Tinh Linh',
      rarity: 'chaos',
      element: 'astral',
      elementName: 'Tinh Không 🌌✨',
      elementColor: '#00e5ff',
      pixelArchetype: 'aetheris_archmage',
      atkBonusPct: 1.2, hpBonusPct: 0.9, defBonusPct: 0.6, spdBonus: 45,
      skills: [
        { 
          id: 's1', 
          name: 'Tinh Thể Hội Tụ & Hóa Thân Thái Thần', 
          type: 'passive', 
          icon: '💠', 
          desc: '3 Tinh Thể Tinh Linh bay quanh người. Đòn đánh cơ bản phóng Tinh Thể khắc Ấn Bụi Sao (tích 3 ấn tự kích nổ 320% ATK). Khi máu dưới 60%, hóa thân Tinh Linh Vương bất tử 2 lượt và hồi 8% HP!', 
          bonusAtk: 1.0,
          uniquePassive: 'aetheris_transcendence'
        },
        { 
          id: 's2', 
          name: 'Cổng Xoáy Cổ Ngữ: Trận Pháp Tinh Thể', 
          type: 'active', 
          icon: '🌀', 
          cd: 4.2, 
          dmgMult: 8.5, 
          desc: 'Mở Cổng Xoáy Cổ Ngữ bắn chùm Tia Sáng Tinh Thể 5 nhịp liên hoàn, phóng lốc sấm sét làm choáng đối thủ và giảm 40% Giáp!',
          multiHit: 5,
          defShred: 0.40
        },
        { 
          id: 's3', 
          name: 'Vạn Tinh Huyền Diệt: Bão Thiên Thạch Vũ Trụ', 
          type: 'burst', 
          icon: '☄️', 
          cd: 10.5, 
          dmgMult: 35.0, 
          desc: 'Tuyệt kỹ tối thượng: Mở Hố Đen Thiên Hà, khai mở đại pháo la-de xé rách không thời gian và dội bão thiên thạch hủy diệt toàn cõi gây 3500% ATK sát thương cực đại!'
        }
      ],
      eidolons: [
        { level: 1, name: 'E1: Tinh Bụi Vĩnh Hằng', desc: 'Tăng 60% Sát thương và tăng số Tinh Thể Tinh Linh tối đa, +25 Tốc độ đánh.', bonusAtk: 0.60, extraSpd: 25 },
        { level: 2, name: 'E2: Vòng Cổ Ngữ Thấu Kính', desc: 'Cổng Xoáy Skill 2 giảm 1.2s hồi chiêu, bắn thêm 3 nhịp tia tinh thể và giảm thêm 30% Giáp quái.', cdReduction: 1.2, skillDmgMult: 0.8 },
        { level: 3, name: 'E3: Vương Miện Tinh Không', desc: 'Cấp kỹ năng Hóa Thân Tinh Linh +3. Tăng 80% Sát thương Tinh Không.', bonusAtk: 0.80 },
        { level: 4, name: 'E4: Hộ Thể Tinh Cầu', desc: 'Khi nhận sát thương chí tử, đôi cánh pha lê tạo màn chắn hấp thụ 100% sát thương và lập tức hồi 50% HP.', uniquePassive: 'aetheris_crystal_barrier' },
        { level: 5, name: 'E5: Khai Mở Thiên Hà', desc: 'Cấp Nộ Tuyệt Kỹ +3. Sát thương Bão Thiên Thạch tăng thêm 150%.', burstDmgMult: 1.5 },
        { level: 6, name: 'E6: Chúa Tể Vạn Cổ Tinh Không', desc: 'Mọi đòn đánh đều kèm Tia La-de Cổ Ngữ 400% ATK, Tuyệt Kỹ Nộ triệu hồi Siêu Hố Đen bóp nghẹt quái vật, bỏ qua 70% Phòng Thủ của Boss!', uniquePassive: 'aetheris_cosmic_sovereign' }
      ]
    },
    /*
    {
      id: 'hero_unknown_god',
      name: '⟦ VÔ CỰC NGHỊCH MỆNH THẦN QUÂN ⟧',
      title: 'Chúa Tể Thái Sơ Vô Thượng',
      rarity: 'unknown',
      element: 'cosmic',
      elementName: 'Hư Vô Thần Cấp 🌌',
      elementColor: '#00ffcc',
      pixelArchetype: 'unknown_god',
      atkBonusPct: 2.0, hpBonusPct: 1.5, defBonusPct: 1.0, spdBonus: 60,
      skills: [
        { id: 's1', name: 'Thần Quyền Vô Cực', type: 'passive', icon: '🌌', desc: 'Tăng 200% Sát thương toàn thể, miễn nhiễm mọi hiệu ứng xấu và nhận 100% tỉ lệ đòn bồi.', bonusAtk: 2.0 },
        { id: 's2', name: 'Hư Không Phân Rã', type: 'active', icon: '⬛', cd: 4.0, dmgMult: 10.0, desc: 'Triệu hồi khối lập phương màu đỏ phong ấn và bóp nghẹt đối thủ gây 1000% ATK sát thương hư vô.' },
        { id: 's3', name: 'Tịch Diệt Thế Giới (Genesis Collapse)', type: 'burst', icon: '🌠', cd: 9.0, dmgMult: 50.0, desc: 'Tái tạo trật tự vũ trụ hủy diệt toàn bộ thực tại gây 5000% ATK sát thương Thần Thánh Vô Cực!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Khởi Nguyên Vô Giới', desc: 'Tăng 150% Sát thương toàn thể và +100% Máu tối đa.', bonusAtk: 1.5, bonusHp: 1.0 },
        { level: 2, name: 'E2: Khối Vuông Không Gian', desc: 'Skill 2 phong ấn đối thủ 2 lượt, đối thủ hoàn toàn bị bất động!', uniquePassive: 'freeze_enemy_2turns' },
        { level: 3, name: 'E3: Quyền Năng Sáng Thế', desc: 'Cấp kỹ năng Hư Không Phân Rã +3. Sát thương tăng gấp đôi.', skillDmgMult: 1.0 },
        { level: 4, name: 'E4: Trật Tự Bất Hoại', desc: 'Miễn nhiễm hoàn toàn 60% mọi sát thương nhận vào từ vũ trụ.', bonusDef: 1.0 },
        { level: 5, name: 'E5: Tịch Diệt Tinh Cầu', desc: 'Cấp Nộ Tịch Diệt Thế Giới +3. Sát thương Nộ tăng gấp 3 lần!', burstDmgMult: 2.0 },
        { level: 6, name: 'E6: ⟦ VÔ THƯỢNG THẦN LINH ⟧', desc: 'Tuyệt đỉnh tối thượng: Đòn đánh thường kèm Hư Vô Trảm 800% ATK, đòn Nộ hủy diệt kết liễu thẳng mọi kẻ thù dưới 25% HP!', uniquePassive: 'execute_god_e6' }
      ]
    },
    */
    {
      id: 'hero_cassius',
      name: '⟦ CASSIUS • QUÂN VƯƠNG BÀI BẠC ⟧',
      title: 'Bậc Thầy Vận Mệnh & Xúc Xắc Ma Thuật',
      rarity: 'unknown',
      element: 'fate',
      elementName: 'Vận Mệnh Hoàng Kim ♠️🎲',
      elementColor: '#ffd700',
      pixelArchetype: 'cassius',
      atkBonusPct: 2.2, hpBonusPct: 1.6, defBonusPct: 1.2, spdBonus: 70,
      skills: [
        { id: 's1', name: 'Vận Mệnh Xúc Xắc (Destiny Dice)', type: 'passive', icon: '🎲', desc: 'Tăng 220% Sát thương toàn thể. Đổ xúc xắc vàng may mắn mỗi 6s (1=Khiên 50% HP, 2=Tốc độ +50%, 3=Hút máu 35%, 4=Vàng +100%, 5=Chí mạng +50%, 6=JACKPOT x3 Sát thương!).', bonusAtk: 2.2 },
        { id: 's2', name: 'Thần Bài Cắt Gió & Quỷ Diện', type: 'active', icon: '♠️', cd: 3.5, dmgMult: 12.0, desc: 'Lướt tới vung tay phóng loạt phi bài Tarot cắt nát đối thủ, triệu hồi Quỷ Diện khóa chiêu và giảm 50% Giáp đối thủ trong 2.5s.' },
        { id: 's3', name: 'Canh Bạc Vô Cực (All-In Jackpot)', type: 'burst', icon: '👑', cd: 8.0, dmgMult: 65.0, desc: 'Tái hiện đỉnh cao điện ảnh sòng bạc: Tung xí ngầu vàng, lật lá Át Chủ Bài và đập nát bộ bài Hoàng Gia Jack-Queen-King-Joker lên bàn cược gây 6500% ATK sát thương Hoàng Kim Vô Cực!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Vận Mệnh Tất Thắng', desc: 'Tăng 180% Sát thương toàn thể, tỉ lệ đổ xúc xắc vào mặt 5 và 6 tăng vọt 200%.', bonusAtk: 1.8, bonusHp: 1.0 },
        { level: 2, name: 'E2: Bẫy Bài Ảo Ảnh', desc: 'Mọi đòn đánh thường đều phóng thêm 3 phi bài Tarot xuyên thấu gây 300% ATK.', uniquePassive: 'cassius_card_barrage' },
        { level: 3, name: 'E3: Quỷ Diện Thao Túng', desc: 'Cấp kỹ năng Thần Bài Cắt Gió +3. Sát thương tăng gấp đôi và kẻ địch bị choáng vĩnh viễn trong thời gian trúng chiêu.', skillDmgMult: 1.0 },
        { level: 4, name: 'E4: Bàn Cược Bất Tử', desc: 'Khi nhận sát thương chí tử, tung xí ngầu: Nếu đổ từ 2-6 lập tức miễn nhiễm tử vong 5s và hồi phục 100% Máu tối đa!', uniquePassive: 'cassius_gamble_immortal' },
        { level: 5, name: 'E5: Hoàng Triều Át Bích', desc: 'Cấp Nộ Canh Bạc Vô Cực +3. Sát thương Tuyệt Kỹ Nộ tăng thêm 250%!', burstDmgMult: 2.5 },
        { level: 6, name: 'E6: ⟦ VUA SÒNG BẠC TOÀN TRI ⟧', desc: 'Mọi đòn đánh luôn duy trì hiệu ứng JACKPOT tối thượng, Tuyệt Kỹ Nộ lập tức kết liễu thẳng đối thủ dưới 35% HP!', uniquePassive: 'cassius_execute_e6' }
      ]
    },
    {
      id: 'hero_trisa',
      name: '⟦ TRISA • HẮC ÁM NỮ HOÀNG ⟧',
      title: 'Hắc Ám Nữ Hoàng & Huyết Nguyệt Chi Nhẫn',
      rarity: 'unknown',
      element: 'chaos',
      elementName: 'Huyết Nguyệt Hắc Ám 🩸🗡️',
      elementColor: '#dc2626',
      pixelArchetype: 'trisa',
      atkBonusPct: 2.5, hpBonusPct: 1.8, defBonusPct: 1.3, spdBonus: 75,
      skills: [
        { id: 's1', name: 'Huyết Nguyệt Đoạt Hồn (Blood Moon Harvest)', type: 'passive', icon: '🩸', desc: 'Tăng 250% Sát thương toàn thể. Đòn đánh kèm Lưỡi Đao Huyết Nguyệt xé rách không gian, bỏ qua 50% Giáp đối thủ và hồi 5% HP mỗi đòn đánh.', bonusAtk: 2.5 },
        { id: 's2', name: 'Ảnh Kiếm Hắc Ám (Shadow Blade Execution)', type: 'active', icon: '🗡️', cd: 6.0, dmgMult: 4.5, desc: 'Tự động kích hoạt trong trận đấu: Vung song đao bóng đêm trảm kích bão lốc gây 450% ATK, hồi 35% HP tối đa và tăng 100% Sát thương bạo kích trong 4 giây.' },
        { id: 's3', name: 'Huyết Nguyệt Trảm Sát (Blood Moon Annihilation)', type: 'burst', icon: '⚔️', cd: 8.0, dmgMult: 75.0, desc: 'Khai mở tuyệt kỹ Hắc Ám Nữ Hoàng: Xuyên phá thời không, tung nhát chém Huyết Nguyệt diệt thế gây 7500% ATK sát thương Hỗn Mang bạo kích!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Lưỡi Đao Hư Không', desc: 'Tăng 200% Sát thương toàn thể, tốc độ đánh +45 và tăng 40% Tỉ lệ bạo kích.', bonusAtk: 2.0, bonusHp: 1.0 },
        { level: 2, name: 'E2: Áo Choàng Bóng Tối', desc: 'Nhận thêm khiên bóng đêm bảo hộ 50% HP và tăng 50% Tỉ lệ bạo kích trong 5 giây.', uniquePassive: 'trisa_shadow_shield' },
        { level: 3, name: 'E3: Vũ Điệu Đoạt Mệnh', desc: 'Cấp kỹ năng Ảnh Kiếm Hắc Ám +3. Sát thương nhận vào giảm 50% vĩnh viễn.', bonusDef: 1.0 },
        { level: 4, name: 'E4: Huyết Nguyệt Bất Tử', desc: 'Khi nhận sát thương chí tử, bóng đêm lập tức hồi sinh 100% Máu và tiến vào trạng thái Miễn nhiễm sát thương trong 4 giây!', uniquePassive: 'trisa_immortal_rebirth' },
        { level: 5, name: 'E5: Thâm Uyên Cuồng Nộ', desc: 'Cấp Nộ Huyết Nguyệt Trảm Sát +3. Sát thương Tuyệt Kỹ Nộ tăng thêm 250%!', burstDmgMult: 2.5 },
        { level: 6, name: 'E6: ⟦ NỮ HOÀNG HUYẾT NGUYỆT TOÀN NĂNG ⟧', desc: 'Mọi đòn đánh đều kèm Trảm Kích Huyết Nguyệt 500% ATK, Tuyệt Kỹ Nộ lập tức kết liễu thẳng mọi kẻ thù dưới 40% HP!', uniquePassive: 'trisa_execute_e6' }
      ]
    },
    {
      id: 'hero_hilde',
      name: '⟦ HILDE • THÁNH NỮ BĂNG QUANG ⟧',
      title: 'Thánh Nữ Băng Quang & Trọng Kiếm Thần Thánh',
      rarity: 'unknown',
      element: 'ice',
      elementName: 'Băng Tuyết Thần Thánh ❄️⚔️',
      elementColor: '#38bdf8',
      pixelArchetype: 'hilde',
      atkBonusPct: 2.4, hpBonusPct: 2.0, defBonusPct: 1.5, spdBonus: 65,
      skills: [
        { id: 's1', name: 'Băng Ngân Thánh Quang (Frost Starlight)', type: 'passive', icon: '❄️', desc: 'Tăng 240% Sát thương toàn thể. Đòn đánh kèm Băng Ngân trảm kích tạo hiệu ứng Tê Cóng giảm 40% Tốc độ và 30% Giáp đối thủ.', bonusAtk: 2.4 },
        { id: 's2', name: 'Thánh Thuẫn Băng Giá (Aegis of Glaciers)', type: 'active', icon: '🛡️', cd: 6.0, dmgMult: 5.0, desc: 'Tự động kích hoạt: Giáp băng tuyệt đối hấp thụ 50% HP sát thương, phản lại 300% ATK sát thương băng và hồi 25% HP tối đa.' },
        { id: 's3', name: 'Băng Cực Thần Kiếm (Absolute Zero Execution)', type: 'burst', icon: '⚔️', cd: 8.0, dmgMult: 75.0, desc: 'Khai mở cội nguồn Băng Tuyết: Giáng đòn trảm kích Tuyệt Đối Băng Phong đóng băng không gian gây 7500% ATK sát thương Băng Cực vạn trượng!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Băng Sương Vô Tận', desc: 'Tăng 200% Sát thương toàn thể, khiên băng tăng thêm 50% dung lượng.', bonusAtk: 2.0, bonusHp: 1.0 },
        { level: 2, name: 'E2: Hàn Băng Phản Kích', desc: 'Khiên băng phát nổ gây 400% ATK khi hết hạn.', uniquePassive: 'hilde_frost_retaliate' },
        { level: 3, name: 'E3: Thánh Quang Khải Hoàn', desc: 'Cấp kỹ năng Thánh Thuẫn Băng Giá +3, phòng ngự +50%.', bonusDef: 1.0 },
        { level: 4, name: 'E4: Băng Tâm Bất Tử', desc: 'Khi nhận sát thương chí tử, hóa thành tượng băng bất tử hồi phục 100% HP trong 4s!', uniquePassive: 'hilde_immortal_rebirth' },
        { level: 5, name: 'E5: Bão Tuyết Thái Cổ', desc: 'Cấp Nộ Băng Cực Thần Kiếm +3, sát thương Nộ +250%!', burstDmgMult: 2.5 },
        { level: 6, name: 'E6: ⟦ NỮ THẦN BĂNG QUANG TOÀN TRI ⟧', desc: 'Tuyệt Kỹ Nộ lập tức đóng băng vĩnh viễn và kết liễu thẳng kẻ thù dưới 38% HP!', uniquePassive: 'hilde_execute_e6' }
      ]
    },
    {
      id: 'hero_heide',
      name: '⟦ HEIDE • PHONG LÔI KIẾM THÁNH ⟧',
      title: 'Phong Lôi Kiếm Thánh & Lưỡi Kiếm Siêu Thanh',
      rarity: 'unknown',
      element: 'lightning',
      elementName: 'Phong Lôi Bão Tố ⚡🌪️',
      elementColor: '#a855f7',
      pixelArchetype: 'heide',
      atkBonusPct: 2.6, hpBonusPct: 1.7, defBonusPct: 1.2, spdBonus: 85,
      skills: [
        { id: 's1', name: 'Tốc Độ Siêu Thanh (Supersonic Blade)', type: 'passive', icon: '⚡', desc: 'Tăng 260% Sát thương toàn thể. Tốc độ đánh tăng 100%, bỏ qua 50% Giáp đối thủ và tăng 50% Tỉ lệ bạo kích.', bonusAtk: 2.6 },
        { id: 's2', name: 'Lôi Quang Trảm Kích (Thunderclap Flash)', type: 'active', icon: '🗡️', cd: 5.5, dmgMult: 6.0, desc: 'Tự động kích hoạt: Lướt siêu thanh trảm kích bão lốc tia sét gây 600% ATK, làm tê liệt đối thủ 2 giây và tăng 120% Sát thương bạo kích.' },
        { id: 's3', name: 'Phong Lôi Đoạt Diệt (Vortex Lightning Judgement)', type: 'burst', icon: '⚡', cd: 8.0, dmgMult: 80.0, desc: 'Tuyệt kỹ kiếm thuật tối thượng: Xé toạc thời không tung một nhát chém sấm sét kết liễu gây 8000% ATK sát thương Lôi Điện bạo kích!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Lưỡi Kiếm Tích Điện', desc: 'Tăng 220% Sát thương toàn thể, tốc độ đánh +60.', bonusAtk: 2.2, bonusHp: 1.0 },
        { level: 2, name: 'E2: Bão Sét Liên Hoàn', desc: 'Đòn đánh thường có 50% tỉ lệ kích hoạt đòn bồi Lôi Điện 400% ATK.', uniquePassive: 'heide_lightning_strike' },
        { level: 3, name: 'E3: Âm Nhẫn Phong Cuồng', desc: 'Cấp kỹ năng Lôi Quang Trảm Kích +3.', skillDmgMult: 1.0 },
        { level: 4, name: 'E4: Lôi Thần Hóa Thân', desc: 'Khi nhận sát thương chí tử, hóa thành tia chớp hồi 100% HP và miễn nhiễm sát thương 4s!', uniquePassive: 'heide_immortal_rebirth' },
        { level: 5, name: 'E5: Thiên Lôi Diệt Thế', desc: 'Cấp Nộ Phong Lôi Đoạt Diệt +3, sát thương Nộ +250%!', burstDmgMult: 2.5 },
        { level: 6, name: 'E6: ⟦ KIẾM THÁNH TỐC ĐỘ VÔ CỰC ⟧', desc: 'Tuyệt Kỹ Nộ lập tức kết liễu mọi kẻ thù dưới 40% HP!', uniquePassive: 'heide_execute_e6' }
      ]
    },
    {
      id: 'hero_meilin',
      name: '⟦ MEI LIN • THẦN LONG QUYỀN THÁNH ⟧',
      title: 'Thần Long Quyền Thánh & Tinh Linh Võ Đạo',
      rarity: 'unknown',
      element: 'wind',
      elementName: 'Thần Long Thiên Khí 🐉🍃',
      elementColor: '#10b981',
      pixelArchetype: 'meilin',
      atkBonusPct: 2.5, hpBonusPct: 1.9, defBonusPct: 1.4, spdBonus: 75,
      skills: [
        { id: 's1', name: 'Khí Công Thần Long (Dragon Qi Circulation)', type: 'passive', icon: '🐉', desc: 'Tăng 250% Sát thương toàn thể. Đòn đánh kèm sóng chấn động Long Khí gây sát thương lan và hồi 5% HP tối đa mỗi đòn đánh.', bonusAtk: 2.5 },
        { id: 's2', name: 'Long Quyền Phá Hư (Dragon Fist Shockwave)', type: 'active', icon: '👊', cd: 6.0, dmgMult: 5.5, desc: 'Tự động kích hoạt: Tung chuỗi liên hoàn quyền rồng cuộn sóng gây 550% ATK, hất tung làm choáng đối thủ và tăng 100% Sát thương kỹ năng trong 5 giây.' },
        { id: 's3', name: 'Thần Long Hàng Thế (Ascending Dragon Roar)', type: 'burst', icon: '🐲', cd: 8.0, dmgMult: 75.0, desc: 'Triệu hồi Chân Long Thần Thánh giáng lâm: Cuộn mình phóng quyền rồng phá nát thiên địa gây 7500% ATK sát thương Phong Thần bạo kích!' }
      ],
      eidolons: [
        { level: 1, name: 'E1: Long Lân Chiến Giáp', desc: 'Tăng 200% Sát thương toàn thể, giảm 30% sát thương nhận vào.', bonusAtk: 2.0, bonusHp: 1.0 },
        { level: 2, name: 'E2: Khí Huyết Cuồn Cuộn', desc: 'Long Quyền hồi thêm 25% Máu tối đa và tăng 40% Bạo kích.', uniquePassive: 'meilin_dragon_blood' },
        { level: 3, name: 'E3: Chân Long Bí Quyết', desc: 'Cấp kỹ năng Long Quyền Phá Hư +3.', skillDmgMult: 1.0 },
        { level: 4, name: 'E4: Bất Tử Long Hồn', desc: 'Khi nhận sát thương chí tử, Long Hồn bảo vệ hồi sinh 100% HP và bất tử trong 4 giây!', uniquePassive: 'meilin_immortal_rebirth' },
        { level: 5, name: 'E5: Long Thần Nộ Hống', desc: 'Cấp Nộ Thần Long Hàng Thế +3, sát thương Nộ +250%!', burstDmgMult: 2.5 },
        { level: 6, name: 'E6: ⟦ QUYỀN THÁNH THIÊN THẦN VÔ ĐỊCH ⟧', desc: 'Mọi đòn đánh đều phóng sóng rồng 500% ATK, Tuyệt Kỹ Nộ lập tức kết liễu kẻ thù dưới 38% HP!', uniquePassive: 'meilin_execute_e6' }
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

  GAME_VERSION: '2.9.9',
  UPDATE_URL: 'https://idle-game-ypvy.onrender.com/api/version',
  SERVER_URL: 'https://idle-game-ypvy.onrender.com/api',
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
  if (heroId === 'hero_unknown_god') {
    return this.HEROES_LIST.find(h => h.id === 'hero_cassius') || this.HEROES_LIST[0];
  }
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

CONFIG.getHeroPixelArchetype = function(heroId) {
  const hero = this.getHeroById(heroId);
  if (hero && hero.pixelArchetype) return hero.pixelArchetype;
  const defaults = {
    hero_starter: 'starter_knight',
    hero_shadow_rogue: 'shadow_rogue',
    hero_frost_knight: 'frost_knight',
    hero_spear_lancer: 'spear_lancer',
    hero_flame_knight: 'flame_knight',
    hero_arcane_mage: 'arcane_mage',
    hero_unknown_god: 'unknown_god',
    hero_cassius: 'cassius',
    hero_trisa: 'trisa',
    hero_hilde: 'hilde',
    hero_heide: 'heide',
    hero_meilin: 'meilin',
    hero_rhiannon: 'trisa',
    // Fallback migration mapping
    hero_traveler: 'starter_knight',
    hero_amber: 'flame_knight',
    hero_changli: 'flame_knight',
    hero_furina: 'frost_knight',
    hero_zhongli: 'spear_lancer',
    hero_jiyan: 'spear_lancer',
    hero_raiden: 'arcane_mage',
    hero_kazuha: 'shadow_rogue'
  };
  return defaults[heroId] || 'starter_knight';
};

