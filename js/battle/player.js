const Player = {
  createDefault() {
    return {
      level: 1,
      exp: 0,
      gold: 0,
      diamond: 100,
      bossKeys: 2,
      protectionStones: 2,
      currentHp: CONFIG.BASE_HP,
      baseMaxHp: CONFIG.BASE_HP,
      baseAttack: CONFIG.BASE_ATTACK,
      baseDefense: CONFIG.BASE_DEFENSE,
      baseSpeed: CONFIG.BASE_SPEED,
      baseGoldRate: CONFIG.BASE_GOLD_RATE,
      baseHpRegen: CONFIG.BASE_HP_REGEN,
      equipment: { weapon: null, armor: null, accessory: null }
    };
  },

  // Tính chỉ số hiệu dụng (Base + Level + Upgrades + Equipment * hệ số rèn)
  getEffectiveMaxHp() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let hp = p.baseMaxHp + (p.level - 1) * CONFIG.LEVEL_HP_BONUS + (u.maxHp || 0) * CONFIG.UPGRADES.maxHp.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.maxHp) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        hp += Math.floor(item.stats.maxHp * mult);
      }
    }
    return Math.floor(hp);
  },

  getEffectiveAttack() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let atk = p.baseAttack + (p.level - 1) * CONFIG.LEVEL_ATK_BONUS + (u.attack || 0) * CONFIG.UPGRADES.attack.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.attack) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        atk += Math.floor(item.stats.attack * mult);
      }
    }
    return Math.floor(atk);
  },

  getEffectiveDefense() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let def = p.baseDefense + (p.level - 1) * CONFIG.LEVEL_DEF_BONUS + (u.defense || 0) * CONFIG.UPGRADES.defense.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.defense) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        def += Math.floor(item.stats.defense * mult);
      }
    }
    return Math.floor(def);
  },

  getEffectiveSpeed() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let spd = p.baseSpeed + (p.level - 1) * CONFIG.LEVEL_SPD_BONUS + (u.speed || 0) * CONFIG.UPGRADES.speed.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.speed) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        spd += Math.floor(item.stats.speed * mult);
      }
    }
    return Math.floor(spd);
  },

  getEffectiveHpRegen() {
    const p = GameState.player;
    const u = GameState.upgrades;
    return Math.floor(p.baseHpRegen + (u.hpRegen || 0) * CONFIG.UPGRADES.hpRegen.bonusPerLevel);
  },

  getEffectiveGoldRate() {
    const p = GameState.player;
    const u = GameState.upgrades;
    let rate = p.baseGoldRate + (u.goldRate || 0) * CONFIG.UPGRADES.goldRate.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.goldRate) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        rate += (item.stats.goldRate * mult);
      }
    }
    return rate;
  },

  // Tỉ lệ đòn bồi dựa trên chênh lệch SPD so với mục tiêu
  getExtraTurnChance(targetSpeed) {
    const playerSpeed = this.getEffectiveSpeed();
    if (playerSpeed <= targetSpeed) return 0.05;
    const ratio = (playerSpeed - targetSpeed) / (playerSpeed + targetSpeed);
    return Math.min(CONFIG.EXTRA_TURN_CAP, 0.05 + ratio * 0.75);
  },

  takeDamage(amount) {
    const actual = Math.max(1, amount);
    GameState.player.currentHp = Math.max(0, GameState.player.currentHp - actual);
    return { damage: actual, isDead: GameState.player.currentHp <= 0 };
  },

  heal(amount) {
    const max = this.getEffectiveMaxHp();
    GameState.player.currentHp = Math.min(max, GameState.player.currentHp + Math.max(0, amount));
    return GameState.player.currentHp;
  },

  revive() {
    GameState.player.currentHp = this.getEffectiveMaxHp();
  },

  getHpPercent() {
    const max = this.getEffectiveMaxHp();
    return max <= 0 ? 0 : Math.max(0, Math.min(100, (GameState.player.currentHp / max) * 100));
  },

  gainExp(amount) {
    const p = GameState.player;
    p.exp += amount;
    let needed = CONFIG.getExpForLevel(p.level);
    let leveledUp = false;

    while (p.exp >= needed && p.level < CONFIG.LEVEL_MAX) {
      p.exp -= needed;
      p.level++;
      leveledUp = true;
      needed = CONFIG.getExpForLevel(p.level);
    }

    if (leveledUp) {
      this.heal(this.getEffectiveMaxHp());
      UI.showLevelUp(p.level);
    }
  },

  gainGold(amount) {
    const effective = Math.floor(amount * this.getEffectiveGoldRate());
    GameState.player.gold += effective;
    return effective;
  },

  gainDiamond(amount) { GameState.player.diamond += amount; },
  gainProtectionStones(count) { GameState.player.protectionStones = (GameState.player.protectionStones || 0) + count; },
  gainBossKeys(count) { GameState.player.bossKeys = (GameState.player.bossKeys || 0) + count; },

  spendGold(amount) {
    if (GameState.player.gold >= amount) {
      GameState.player.gold -= amount;
      return true;
    }
    return false;
  },

  getExpNeeded() { return CONFIG.getExpForLevel(GameState.player.level); },
  getExpProgress() { return Math.min(GameState.player.exp / this.getExpNeeded(), 1); }
};
