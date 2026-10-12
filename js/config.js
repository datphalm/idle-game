// ============================================================
// config.js — Game Configuration & Constants
// ============================================================

// --- Global Game State ---
const GameState = {
  player: null,
  upgrades: {
    attack: 0,
    maxHp: 0,
    defense: 0,
    speed: 0,
    goldRate: 0,
    hpRegen: 0
  },
  inventory: [],
  gacha: {
    totalPulls: 0
  },
  combat: {
    monstersKilled: 0
  },
  boss: {
    active: false,
    bossIndex: 0,
    hp: 0,
    maxHp: 0,
    timer: 0,
    timerMax: 0
  },
  lastSaveTime: Date.now()
};

const CONFIG = {
  // --- Combat Defaults (Player base) ---
  BASE_HP: 120,
  BASE_ATTACK: 15,
  BASE_DEFENSE: 3,
  BASE_SPEED: 12,           // Action speed (determines turn rate & extra turn chance)
  BASE_GOLD_RATE: 1.0,
  BASE_HP_REGEN: 2,         // HP regen per turn

  // --- Level / EXP ---
  EXP_BASE: 80,
  EXP_GROWTH: 1.45,
  LEVEL_HP_BONUS: 20,       // +HP per level
  LEVEL_ATK_BONUS: 3,       // +ATK per level
  LEVEL_DEF_BONUS: 1,       // +DEF per level
  LEVEL_SPD_BONUS: 0.5,     // +SPD per level
  LEVEL_MAX: 999,

  // --- Turn-based Combat Parameters ---
  COMBAT_TURN_BASE_DELAY: 650, // ms per turn step
  PLAYER_REVIVE_TIME: 2000,    // 2s auto-revive after death
  EXTRA_TURN_CAP: 0.75,        // max 75% chance for extra turn

  // --- Monster Base Scaling ---
  MONSTER_HP_BASE: 60,
  MONSTER_HP_GROWTH: 1.22,
  MONSTER_ATK_BASE: 8,
  MONSTER_ATK_GROWTH: 1.18,
  MONSTER_DEF_BASE: 1,
  MONSTER_DEF_GROWTH: 1.15,
  MONSTER_SPD_BASE: 10,
  MONSTER_SPD_GROWTH: 1.08,
  MONSTER_GOLD_BASE: 12,
  MONSTER_GOLD_GROWTH: 1.14,
  MONSTER_EXP_BASE: 20,
  MONSTER_EXP_GROWTH: 1.16,

  // --- Upgrade System ---
  UPGRADES: {
    attack: {
      name: 'Sát Thương',
      icon: '⚔️',
      bonusPerLevel: 4,
      costBase: 40,
      costGrowth: 1.30,
      formatBonus: (lvl) => `+${lvl * 4} ATK`
    },
    maxHp: {
      name: 'Máu Tối Đa',
      icon: '❤️',
      bonusPerLevel: 30,
      costBase: 40,
      costGrowth: 1.28,
      formatBonus: (lvl) => `+${lvl * 30} HP`
    },
    defense: {
      name: 'Phòng Thủ',
      icon: '🛡️',
      bonusPerLevel: 2,
      costBase: 50,
      costGrowth: 1.32,
      formatBonus: (lvl) => `+${lvl * 2} DEF`
    },
    speed: {
      name: 'Tốc Độ',
      icon: '⚡',
      bonusPerLevel: 1.5,
      costBase: 60,
      costGrowth: 1.35,
      formatBonus: (lvl) => `+${(lvl * 1.5).toFixed(1)} SPD`
    },
    goldRate: {
      name: 'Tỉ Lệ Vàng',
      icon: '💰',
      bonusPerLevel: 0.08,
      costBase: 80,
      costGrowth: 1.38,
      formatBonus: (lvl) => `+${(lvl * 8).toFixed(0)}% Vàng`
    },
    hpRegen: {
      name: 'Hồi Máu',
      icon: '🧪',
      bonusPerLevel: 3,
      costBase: 70,
      costGrowth: 1.33,
      formatBonus: (lvl) => `+${lvl * 3} HP/Lượt`
    }
  },

  // --- Gacha System ---
  GACHA_COST_SINGLE: 100,
  GACHA_COST_MULTI: 900,
  GACHA_MULTI_COUNT: 10,

  // User requirement: ??? is 0.000001 (1 in a million), chaos is extremely rare
  GACHA_RATES: {
    common:    0.55,
    rare:      0.30,
    epic:      0.12,
    legendary: 0.028949,
    mythic:    0.001,
    chaos:     0.00005,
    unknown:   0.000001
  },

  // --- Inventory ---
  INVENTORY_MAX: 80,

  // --- Rarity System (7 tiers) ---
  RARITY_ORDER: ['common', 'rare', 'epic', 'legendary', 'mythic', 'chaos', 'unknown'],

  RARITY_NAMES: {
    common:    'Thường',
    rare:      'Hiếm',
    epic:      'Sử Thi',
    legendary: 'Huyền Thoại',
    mythic:    'Thần Thoại',
    chaos:     'Hỗn Mang',
    unknown:   '???'
  },

  RARITY_COLORS: {
    common:    '#9e9e9e',
    rare:      '#3b82f6',
    epic:      '#a855f7',
    legendary: '#f59e0b',
    mythic:    '#ef4444',
    chaos:     '#b026ff',
    unknown:   '#00ffcc'
  },

  RARITY_BG: {
    common:    'rgba(158, 158, 158, 0.12)',
    rare:      'rgba(59, 130, 246, 0.12)',
    epic:      'rgba(168, 85, 247, 0.14)',
    legendary: 'rgba(245, 158, 11, 0.15)',
    mythic:    'rgba(239, 68, 68, 0.18)',
    chaos:     'rgba(176, 38, 255, 0.20)',
    unknown:   'rgba(0, 255, 204, 0.25)'
  },

  // --- Sell Prices ---
  SELL_PRICES: {
    common:    15,
    rare:      60,
    epic:      250,
    legendary: 1000,
    mythic:    5000,
    chaos:     25000,
    unknown:   1000000
  },

  // --- Fusion / Ghép Đồ ---
  FUSION_COUNT: 3, // Requires 3 items of same rarity
  FUSION_RATES: {
    common:    0.85, // common -> rare
    rare:      0.70, // rare -> epic
    epic:      0.50, // epic -> legendary
    legendary: 0.30, // legendary -> mythic
    mythic:    0.10, // mythic -> chaos
    chaos:     0.015 // chaos -> ??? (1.5% success rate!)
  },

  // --- Enhancement / Rèn (+0 to +100) ---
  ENHANCE_MAX: 100,
  ENHANCE_STAT_BONUS_PER_LEVEL: 0.02, // +2% item stat per + level (+100 is +200% stat!)

  getEnhanceCost(level, rarity) {
    const rarityMultiplier = {
      common: 1,
      rare: 1.5,
      epic: 2.2,
      legendary: 3.5,
      mythic: 6,
      chaos: 12,
      unknown: 30
    }[rarity] || 1;
    return Math.floor((60 + Math.pow(level, 1.85) * 25) * rarityMultiplier);
  },

  getEnhanceRates(level) {
    if (level < 10) {
      // 0 -> 9: Easy, no drop, no break
      const success = 0.95 - level * 0.015;
      return {
        success: success,
        greatSuccess2: 0.08, // +2 level
        greatSuccess3: 0.02, // +3 level
        failDrop: 0,
        failBreak: 0
      };
    } else if (level < 30) {
      // 10 -> 29: Moderate, failure might drop 1 level
      const success = 0.80 - (level - 10) * 0.015;
      return {
        success: Math.max(0.45, success),
        greatSuccess2: 0.05,
        greatSuccess3: 0.01,
        failDrop: 0.25,
        failBreak: 0
      };
    } else if (level < 60) {
      // 30 -> 59: Hard, fail drops 1 level, 2% break
      const success = 0.45 - (level - 30) * 0.007;
      return {
        success: Math.max(0.22, success),
        greatSuccess2: 0.03,
        greatSuccess3: 0.005,
        failDrop: 0.50,
        failBreak: 0.02
      };
    } else if (level < 85) {
      // 60 -> 84: Very hard, fail drops 1-2 levels, 3.5% break
      const success = 0.22 - (level - 60) * 0.005;
      return {
        success: Math.max(0.09, success),
        greatSuccess2: 0.015,
        greatSuccess3: 0.002,
        failDrop: 0.70,
        failBreak: 0.035
      };
    } else {
      // 85 -> 99: Legendary tier, 5% break, low success
      const success = 0.09 - (level - 85) * 0.004;
      return {
        success: Math.max(0.03, success),
        greatSuccess2: 0.008,
        greatSuccess3: 0.001,
        failDrop: 0.80,
        failBreak: 0.05
      };
    }
  },

  // --- Boss System ---
  BOSS_KEY_PRICE: 2000, // Initial key price
  BOSS_LIST: [
    {
      id: 'boss_slime_king',
      name: 'Vua Slime Khổng Lồ',
      emoji: '👑🟢',
      desc: 'Quái vương đầm lầy, lượng máu dồi dào',
      hp: 1200,
      attack: 30,
      defense: 6,
      speed: 12,
      timer: 45, // seconds
      keyCost: 1,
      goldReward: 5000,
      expReward: 3000,
      protectionStoneDropRate: 0.25, // 25% drop rate
      itemDropPool: ['rare', 'epic']
    },
    {
      id: 'boss_skeleton_warlord',
      name: 'Vua Xương Hoàng Kim',
      emoji: '👑💀',
      desc: 'Chiến tướng hầm ngục với giáp trụ hoàng kim',
      hp: 6500,
      attack: 95,
      defense: 25,
      speed: 18,
      timer: 50,
      keyCost: 2,
      goldReward: 25000,
      expReward: 18000,
      protectionStoneDropRate: 0.35,
      itemDropPool: ['epic', 'legendary']
    },
    {
      id: 'boss_demon_lord',
      name: 'Chúa Tể Địa Ngục',
      emoji: '👑👹',
      desc: 'Bạo chúa bóng tối với sát thương thiêu đốt',
      hp: 38000,
      attack: 350,
      defense: 80,
      speed: 26,
      timer: 60,
      keyCost: 3,
      goldReward: 150000,
      expReward: 100000,
      protectionStoneDropRate: 0.50,
      itemDropPool: ['legendary', 'mythic']
    },
    {
      id: 'boss_chaos_dragon',
      name: 'Cổ Long Hỗn Mang',
      emoji: '👑🐉',
      desc: 'Rồng thần viễn cổ nắm giữ sức mạnh hư không',
      hp: 250000,
      attack: 1600,
      defense: 350,
      speed: 38,
      timer: 75,
      keyCost: 5,
      goldReward: 1000000,
      expReward: 750000,
      protectionStoneDropRate: 0.75,
      itemDropPool: ['mythic', 'chaos']
    }
  ],

  // --- Normal Monsters (Turn-based stats) ---
  MONSTERS: [
    { name: 'Slime Xanh',         emoji: '🟢', tier: 1,  hpMod: 1.0, atkMod: 1.0, defMod: 1.0, spdMod: 1.0 },
    { name: 'Yêu Tinh Goblin',    emoji: '👺', tier: 3,  hpMod: 1.2, atkMod: 1.2, defMod: 1.1, spdMod: 1.3 },
    { name: 'Bộ Xương Kiếm Sĩ',   emoji: '💀', tier: 5,  hpMod: 1.4, atkMod: 1.4, defMod: 1.2, spdMod: 1.1 },
    { name: 'Chiến Binh Orc',     emoji: '👹', tier: 8,  hpMod: 1.8, atkMod: 1.7, defMod: 1.5, spdMod: 0.9 },
    { name: 'Sát Thủ Dark Elf',   emoji: '🧝', tier: 12, hpMod: 1.7, atkMod: 2.1, defMod: 1.3, spdMod: 1.6 },
    { name: 'Tiểu Quỷ Hỏa Ngục',  emoji: '😈', tier: 16, hpMod: 2.3, atkMod: 2.4, defMod: 1.6, spdMod: 1.3 },
    { name: 'Khổng Lồ Đá Golem',  emoji: '🗿', tier: 20, hpMod: 3.2, atkMod: 2.2, defMod: 2.8, spdMod: 0.7 },
    { name: 'Bóng Ma Hư Vô',      emoji: '👻', tier: 25, hpMod: 2.6, atkMod: 3.0, defMod: 1.8, spdMod: 1.8 },
    { name: 'Nhân Ngưu Cuồng Nộ', emoji: '🐂', tier: 32, hpMod: 3.8, atkMod: 3.5, defMod: 2.3, spdMod: 1.2 },
    { name: 'Hỏa Long Trưởng Thành', emoji: '🐉', tier: 40, hpMod: 5.0, atkMod: 4.8, defMod: 3.2, spdMod: 1.5 },
    { name: 'Chúa Tể Bóng Tối',   emoji: '🌑', tier: 50, hpMod: 7.0, atkMod: 6.5, defMod: 4.5, spdMod: 1.8 },
    { name: 'Phượng Hoàng Bất Tử', emoji: '🔥', tier: 65, hpMod: 9.0, atkMod: 8.5, defMod: 5.5, spdMod: 2.2 },
    { name: 'Cửu Đầu Xà Hydra',   emoji: '🐍', tier: 80, hpMod: 12.0, atkMod: 11.0, defMod: 7.0, spdMod: 1.9 },
    { name: 'Vu Yêu Vương Lich',  emoji: '☠️', tier: 100, hpMod: 16.0, atkMod: 15.0, defMod: 9.0, spdMod: 2.4 },
    { name: 'Thần Long Thái Sơ',  emoji: '🌟', tier: 130, hpMod: 24.0, atkMod: 22.0, defMod: 14.0, spdMod: 2.8 }
  ],

  // --- Item Database (Expanded with 7 Rarity Tiers and Multi-stats) ---
  ITEMS: {
    weapons: [
      // Common
      { name: 'Dao Gỉ Sét',           type: 'weapon', rarity: 'common',    stats: { attack: 4, speed: 1 } },
      { name: 'Kiếm Gỗ',              type: 'weapon', rarity: 'common',    stats: { attack: 6, speed: 1 } },
      { name: 'Đoản Đao Sắt',         type: 'weapon', rarity: 'common',    stats: { attack: 9, speed: 2 } },
      // Rare
      { name: 'Kiếm Bạc Thép Tinh',   type: 'weapon', rarity: 'rare',      stats: { attack: 18, speed: 4 } },
      { name: 'Đoản Kiếm Phong Linh',  type: 'weapon', rarity: 'rare',      stats: { attack: 24, speed: 8 } },
      { name: 'Trường Thương Băng',    type: 'weapon', rarity: 'rare',      stats: { attack: 30, speed: 3 } },
      // Epic
      { name: 'Hắc Kiếm Tử Thần',      type: 'weapon', rarity: 'epic',      stats: { attack: 55, speed: 10 } },
      { name: 'Lôi Thần Trảm',        type: 'weapon', rarity: 'epic',      stats: { attack: 72, speed: 14 } },
      // Legendary
      { name: 'Thần Kiếm Vạn Cổ',     type: 'weapon', rarity: 'legendary', stats: { attack: 140, speed: 22 } },
      { name: 'Long Tuyền Trảm Ma',   type: 'weapon', rarity: 'legendary', stats: { attack: 190, speed: 28 } },
      // Mythic
      { name: 'Huyết Kiếm Ma Hoàng',  type: 'weapon', rarity: 'mythic',    stats: { attack: 450, speed: 45 } },
      { name: 'Thiên Cung Thái Hư',   type: 'weapon', rarity: 'mythic',    stats: { attack: 620, speed: 60 } },
      // Chaos
      { name: 'Hắc Ám Hư Không Kiếm', type: 'weapon', rarity: 'chaos',     stats: { attack: 1800, speed: 110 } },
      // ??? (Super OP)
      { name: '⟦ THÁI CỔ NGHỊCH THIÊN TRẢM ⟧', type: 'weapon', rarity: 'unknown', stats: { attack: 9999, speed: 250 } }
    ],
    armors: [
      // Common
      { name: 'Áo Vải Bố',            type: 'armor', rarity: 'common',    stats: { maxHp: 30, defense: 2 } },
      { name: 'Giáp Da Sói',          type: 'armor', rarity: 'common',    stats: { maxHp: 50, defense: 4 } },
      { name: 'Áo Giáp Đồng Cũ',      type: 'armor', rarity: 'common',    stats: { maxHp: 80, defense: 7 } },
      // Rare
      { name: 'Giáp Sắt Cường Hóa',   type: 'armor', rarity: 'rare',      stats: { maxHp: 160, defense: 15 } },
      { name: 'Áo Choàng Bóng Tối',   type: 'armor', rarity: 'rare',      stats: { maxHp: 220, defense: 20 } },
      { name: 'Giáp Băng Tinh',        type: 'armor', rarity: 'rare',      stats: { maxHp: 290, defense: 26 } },
      // Epic
      { name: 'Giáp Rồng Lửa',        type: 'armor', rarity: 'epic',      stats: { maxHp: 550, defense: 45 } },
      { name: 'Thiên Binh Thiết Giáp',type: 'armor', rarity: 'epic',      stats: { maxHp: 750, defense: 60 } },
      // Legendary
      { name: 'Thiên Giáp Hoàng Kim', type: 'armor', rarity: 'legendary', stats: { maxHp: 1600, defense: 120 } },
      { name: 'Chân Long Bảo Giáp',   type: 'armor', rarity: 'legendary', stats: { maxHp: 2200, defense: 160 } },
      // Mythic
      { name: 'Bất Diệt Thần Y',      type: 'armor', rarity: 'mythic',    stats: { maxHp: 5500, defense: 380 } },
      { name: 'Hỗn Nguyên Thánh Giáp',type: 'armor', rarity: 'mythic',    stats: { maxHp: 8000, defense: 520 } },
      // Chaos
      { name: 'Vạn Tượng Hư Vô Khải', type: 'armor', rarity: 'chaos',     stats: { maxHp: 25000, defense: 1600 } },
      // ??? (Super OP)
      { name: '⟦ BẤT TỬ BẤT DIỆT THẦN QUÂN KHẢI ⟧', type: 'armor', rarity: 'unknown', stats: { maxHp: 88888, defense: 5555 } }
    ],
    accessories: [
      // Common
      { name: 'Nhẫn Đồng Thô',        type: 'accessory', rarity: 'common',    stats: { goldRate: 0.05, maxHp: 20 } },
      { name: 'Dây Chuyền Đá Xám',    type: 'accessory', rarity: 'common',    stats: { speed: 2, attack: 3 } },
      { name: 'Vòng Gỗ Hộ Thân',      type: 'accessory', rarity: 'common',    stats: { defense: 3, maxHp: 25 } },
      // Rare
      { name: 'Nhẫn Bạc May Mắn',     type: 'accessory', rarity: 'rare',      stats: { goldRate: 0.15, speed: 5, attack: 8 } },
      { name: 'Bùa Hộ Mệnh Phong Ấn', type: 'accessory', rarity: 'rare',      stats: { defense: 12, maxHp: 120, speed: 6 } },
      { name: 'Ngọc Bội Lam Tinh',    type: 'accessory', rarity: 'rare',      stats: { attack: 14, defense: 8, maxHp: 100 } },
      // Epic
      { name: 'Nhẫn Xích Long',       type: 'accessory', rarity: 'epic',      stats: { attack: 28, speed: 12, goldRate: 0.25 } },
      { name: 'Vòng Cổ Ma Thuật',     type: 'accessory', rarity: 'epic',      stats: { maxHp: 400, defense: 30, speed: 15 } },
      // Legendary
      { name: 'Hoàng Đế Thần Giới',   type: 'accessory', rarity: 'legendary', stats: { attack: 75, maxHp: 1000, speed: 25, goldRate: 0.50 } },
      { name: 'Long Nhãn Thần Châu',   type: 'accessory', rarity: 'legendary', stats: { attack: 95, defense: 70, speed: 32, maxHp: 1200 } },
      // Mythic
      { name: 'Lục Đạo Luân Hồi Giới',type: 'accessory', rarity: 'mythic',    stats: { attack: 280, maxHp: 3500, defense: 180, speed: 50, goldRate: 1.2 } },
      { name: 'Thiên Mệnh Thần Châu',  type: 'accessory', rarity: 'mythic',    stats: { attack: 380, maxHp: 4500, defense: 240, speed: 65, goldRate: 1.5 } },
      // Chaos
      { name: 'Hư Không Chi Tâm',     type: 'accessory', rarity: 'chaos',     stats: { attack: 1100, maxHp: 15000, defense: 800, speed: 120, goldRate: 3.5 } },
      // ??? (Super OP)
      { name: '⟦ VÔ CỰC NGHỊCH MỆNH THẦN CHÂU ⟧', type: 'accessory', rarity: 'unknown', stats: { attack: 6666, maxHp: 66666, defense: 3333, speed: 200, goldRate: 10.0 } }
    ]
  },

  // --- Save Configuration ---
  AUTO_SAVE_INTERVAL: 20000,
  MAX_OFFLINE_SECONDS: 86400,
  SAVE_KEY: 'idle_rpg_save_v2'
};

// --- Helper Functions ---
CONFIG.getExpForLevel = function(level) {
  return Math.floor(this.EXP_BASE * Math.pow(level, this.EXP_GROWTH));
};

CONFIG.getUpgradeCost = function(type, currentLevel) {
  const cfg = this.UPGRADES[type];
  if (!cfg) return Infinity;
  return Math.floor(cfg.costBase * Math.pow(cfg.costGrowth, currentLevel));
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
  const all = [
    ...this.ITEMS.weapons,
    ...this.ITEMS.armors,
    ...this.ITEMS.accessories
  ];
  return all.filter(item => item.rarity === rarity);
};
