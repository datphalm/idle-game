const Upgrades = {
  upgrade(type) {
    const cost = this.getCost(type);
    if (!Player.spendGold(cost)) return false;

    if (!GameState.upgrades[type]) GameState.upgrades[type] = 0;
    GameState.upgrades[type]++;

    if (type === 'maxHp') Player.heal(CONFIG.UPGRADES.maxHp.bonusPerLevel);
    return true;
  },

  getLevel(type) { return GameState.upgrades?.[type] || 0; },
  getCost(type) { return CONFIG.getUpgradeCost(type, this.getLevel(type)); },
  getBonusText(type) {
    const cfg = CONFIG.UPGRADES[type];
    return cfg ? cfg.formatBonus(this.getLevel(type)) : '+0';
  },
  canAfford(type) { return GameState.player ? GameState.player.gold >= this.getCost(type) : false; },
  isMaxed() { return false; }
};
