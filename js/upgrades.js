// ============================================================
// upgrades.js — Upgrade System (HP, DEF, SPD, ATK, Gold, Regen)
// ============================================================

const Upgrades = {

  // --- Upgrade a stat ---
  upgrade(type) {
    const cost = this.getCost(type);
    if (!Player.spendGold(cost)) return false;

    if (!GameState.upgrades[type]) {
      GameState.upgrades[type] = 0;
    }
    GameState.upgrades[type]++;

    // If maxHp upgraded, also heal the player by the gained HP
    if (type === 'maxHp') {
      Player.heal(CONFIG.UPGRADES.maxHp.bonusPerLevel);
    }

    return true;
  },

  // --- Get current level ---
  getLevel(type) {
    return (GameState.upgrades && GameState.upgrades[type]) || 0;
  },

  // --- Get cost for next level ---
  getCost(type) {
    const level = this.getLevel(type);
    return CONFIG.getUpgradeCost(type, level);
  },

  // --- Get formatted bonus string ---
  getBonusText(type) {
    const cfg = CONFIG.UPGRADES[type];
    if (!cfg) return '+0';
    const level = this.getLevel(type);
    return cfg.formatBonus(level);
  },

  // --- Check if can afford ---
  canAfford(type) {
    if (!GameState.player) return false;
    return GameState.player.gold >= this.getCost(type);
  },

  // --- Check if maxed ---
  isMaxed(type) {
    return false; // Unlimited progression
  }
};
