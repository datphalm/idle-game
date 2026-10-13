const Monster = {
  current: null,

  spawn() {
    const stage = GameState.stage?.current || 1;
    const template = CONFIG.getMonsterForLevel(stage);
    const factor = Math.max(0, stage - 1);

    const hp = Math.floor(CONFIG.MONSTER_HP_BASE * Math.pow(CONFIG.MONSTER_HP_GROWTH, factor) * (template.hpMod || 1.0));
    const attack = Math.floor(CONFIG.MONSTER_ATK_BASE * Math.pow(CONFIG.MONSTER_ATK_GROWTH, factor) * (template.atkMod || 1.0));
    const defense = Math.floor(CONFIG.MONSTER_DEF_BASE * Math.pow(CONFIG.MONSTER_DEF_GROWTH, factor) * (template.defMod || 1.0));
    const speed = Math.floor(CONFIG.MONSTER_SPD_BASE * Math.pow(CONFIG.MONSTER_SPD_GROWTH, factor) * (template.spdMod || 1.0));
    const goldReward = Math.floor(CONFIG.MONSTER_GOLD_BASE * Math.pow(CONFIG.MONSTER_GOLD_GROWTH, factor));
    const expReward = Math.floor(CONFIG.MONSTER_EXP_BASE * Math.pow(CONFIG.MONSTER_EXP_GROWTH, factor));

    this.current = {
      name: template.name,
      emoji: template.emoji,
      level: stage,
      stage: stage,
      hp: hp,
      maxHp: hp,
      attack: Math.max(3, attack),
      defense: defense,
      speed: Math.max(5, speed),
      goldReward: goldReward,
      expReward: expReward
    };

    if (typeof UI !== 'undefined') UI.updateMonsterDisplay();
    return this.current;
  },

  takeDamage(amount) {
    if (!this.current) return { damage: 0, isDead: true };
    const actual = Math.max(1, amount);
    this.current.hp -= actual;
    if (this.current.hp <= 0) {
      this.current.hp = 0;
      return { damage: actual, isDead: true };
    }
    return { damage: actual, isDead: false };
  },

  getHpPercent() {
    if (!this.current || this.current.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, (this.current.hp / this.current.maxHp) * 100));
  }
};
