// ============================================================
// player.js — Player Module (Turn-Based Stats & Lifecycle)
// ============================================================

const Player = {
  // --- Initialize / Default ---
  createDefault() {
    return {
      level: 1,
      exp: 0,
      gold: 0,
      diamond: 100,
      bossKeys: 2,           // Starting boss keys
      protectionStones: 2,   // Starting protection stones
      currentHp: CONFIG.BASE_HP,
      baseMaxHp: CONFIG.BASE_HP,
      baseAttack: CONFIG.BASE_ATTACK,
      baseDefense: CONFIG.BASE_DEFENSE,
      baseSpeed: CONFIG.BASE_SPEED,
      baseGoldRate: CONFIG.BASE_GOLD_RATE,
      baseHpRegen: CONFIG.BASE_HP_REGEN,
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      }
    };
  },

  // --- Effective Max HP ---
  getEffectiveMaxHp() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let hp = p.baseMaxHp + (p.level - 1) * CONFIG.LEVEL_HP_BONUS + (u.maxHp || 0) * CONFIG.UPGRADES.maxHp.bonusPerLevel;

    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item && item.stats && item.stats.maxHp) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        hp += Math.floor(item.stats.maxHp * mult);
      }
    }
    return Math.floor(hp);
  },

  // --- Effective Attack ---
  getEffectiveAttack() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let atk = p.baseAttack + (p.level - 1) * CONFIG.LEVEL_ATK_BONUS + (u.attack || 0) * CONFIG.UPGRADES.attack.bonusPerLevel;

    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item && item.stats && item.stats.attack) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        atk += Math.floor(item.stats.attack * mult);
      }
    }
    return Math.floor(atk);
  },

  // --- Effective Defense ---
  getEffectiveDefense() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let def = p.baseDefense + (p.level - 1) * CONFIG.LEVEL_DEF_BONUS + (u.defense || 0) * CONFIG.UPGRADES.defense.bonusPerLevel;

    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item && item.stats && item.stats.defense) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        def += Math.floor(item.stats.defense * mult);
      }
    }
    return Math.floor(def);
  },

  // --- Effective Speed ---
  getEffectiveSpeed() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let spd = p.baseSpeed + (p.level - 1) * CONFIG.LEVEL_SPD_BONUS + (u.speed || 0) * CONFIG.UPGRADES.speed.bonusPerLevel;

    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item && item.stats && item.stats.speed) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        spd += Math.floor(item.stats.speed * mult);
      }
    }
    return Math.floor(spd);
  },

  // --- Effective HP Regen per turn ---
  getEffectiveHpRegen() {
    const p = GameState.player;
    const u = GameState.upgrades;
    const regen = p.baseHpRegen + (u.hpRegen || 0) * CONFIG.UPGRADES.hpRegen.bonusPerLevel;
    return Math.floor(regen);
  },

  // --- Effective Gold Rate ---
  getEffectiveGoldRate() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let rate = p.baseGoldRate + (u.goldRate || 0) * CONFIG.UPGRADES.goldRate.bonusPerLevel;

    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item && item.stats && item.stats.goldRate) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        rate += (item.stats.goldRate * mult);
      }
    }
    return rate;
  },

  // --- Extra Turn Chance relative to Target Speed ---
  getExtraTurnChance(targetSpeed) {
    const playerSpeed = this.getEffectiveSpeed();
    if (playerSpeed <= targetSpeed) {
      return 0.05; // 5% base lucky turn
    }
    const ratio = (playerSpeed - targetSpeed) / (playerSpeed + targetSpeed);
    const chance = 0.05 + ratio * 0.75;
    return Math.min(CONFIG.EXTRA_TURN_CAP, chance);
  },

  // --- Health Management ---
  takeDamage(amount) {
    const p = GameState.player;
    const actualDamage = Math.max(1, amount);
    p.currentHp = Math.max(0, p.currentHp - actualDamage);
    return {
      damage: actualDamage,
      isDead: p.currentHp <= 0
    };
  },

  heal(amount) {
    const p = GameState.player;
    const max = this.getEffectiveMaxHp();
    p.currentHp = Math.min(max, p.currentHp + Math.max(0, amount));
    return p.currentHp;
  },

  revive() {
    const p = GameState.player;
    p.currentHp = this.getEffectiveMaxHp();
  },

  getHpPercent() {
    const max = this.getEffectiveMaxHp();
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, (GameState.player.currentHp / max) * 100));
  },

  // --- Gain EXP & Auto Level Up ---
  gainExp(amount) {
    const p = GameState.player;
    p.exp += amount;

    let leveledUp = false;
    let needed = CONFIG.getExpForLevel(p.level);

    while (p.exp >= needed && p.level < CONFIG.LEVEL_MAX) {
      p.exp -= needed;
      p.level++;
      leveledUp = true;
      needed = CONFIG.getExpForLevel(p.level);
    }

    if (leveledUp) {
      // Heal to max on level up
      this.heal(this.getEffectiveMaxHp());
      UI.showLevelUp(p.level);
    }
  },

  // --- Currencies ---
  gainGold(amount) {
    const effective = Math.floor(amount * this.getEffectiveGoldRate());
    GameState.player.gold += effective;
    return effective;
  },

  gainDiamond(amount) {
    GameState.player.diamond += amount;
  },

  gainProtectionStones(count) {
    GameState.player.protectionStones = (GameState.player.protectionStones || 0) + count;
  },

  gainBossKeys(count) {
    GameState.player.bossKeys = (GameState.player.bossKeys || 0) + count;
  },

  spendGold(amount) {
    if (GameState.player.gold >= amount) {
      GameState.player.gold -= amount;
      return true;
    }
    return false;
  },

  // --- EXP Calculations ---
  getExpNeeded() {
    return CONFIG.getExpForLevel(GameState.player.level);
  },

  getExpProgress() {
    const needed = this.getExpNeeded();
    return Math.min(GameState.player.exp / needed, 1);
  }
};
