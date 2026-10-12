// ============================================================
// monster.js — Monster Module (Turn-Based Combat Stats)
// ============================================================

const Monster = {
  current: null,

  // --- Spawn a new monster scaled to player level ---
  spawn() {
    const pLevel = GameState.player.level;
    const template = CONFIG.getMonsterForLevel(pLevel);

    const levelFactor = pLevel - 1;

    const hp = Math.floor(
      CONFIG.MONSTER_HP_BASE * Math.pow(CONFIG.MONSTER_HP_GROWTH, levelFactor) * (template.hpMod || 1.0)
    );
    const attack = Math.floor(
      CONFIG.MONSTER_ATK_BASE * Math.pow(CONFIG.MONSTER_ATK_GROWTH, levelFactor) * (template.atkMod || 1.0)
    );
    const defense = Math.floor(
      CONFIG.MONSTER_DEF_BASE * Math.pow(CONFIG.MONSTER_DEF_GROWTH, levelFactor) * (template.defMod || 1.0)
    );
    const speed = Math.floor(
      CONFIG.MONSTER_SPD_BASE * Math.pow(CONFIG.MONSTER_SPD_GROWTH, levelFactor) * (template.spdMod || 1.0)
    );
    const goldReward = Math.floor(
      CONFIG.MONSTER_GOLD_BASE * Math.pow(CONFIG.MONSTER_GOLD_GROWTH, levelFactor)
    );
    const expReward = Math.floor(
      CONFIG.MONSTER_EXP_BASE * Math.pow(CONFIG.MONSTER_EXP_GROWTH, levelFactor)
    );

    this.current = {
      name: template.name,
      emoji: template.emoji,
      level: pLevel,
      hp: hp,
      maxHp: hp,
      attack: Math.max(3, attack),
      defense: defense,
      speed: Math.max(5, speed),
      goldReward: goldReward,
      expReward: expReward
    };

    if (typeof UI !== 'undefined') {
      UI.updateMonsterDisplay();
    }
    return this.current;
  },

  // --- Take damage ---
  takeDamage(amount) {
    if (!this.current) return { damage: 0, isDead: true };

    const actualDamage = Math.max(1, amount);
    this.current.hp -= actualDamage;

    if (this.current.hp <= 0) {
      this.current.hp = 0;
      return { damage: actualDamage, isDead: true };
    }
    return { damage: actualDamage, isDead: false };
  },

  // --- Get HP percentage ---
  getHpPercent() {
    if (!this.current || this.current.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, (this.current.hp / this.current.maxHp) * 100));
  }
};
