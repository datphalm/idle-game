// ============================================================
// gacha.js — Gacha System (No Pity, 7 Tiers with Ultra-Rare ???)
// ============================================================

const Gacha = {

  // --- Single pull ---
  pull(currency) {
    currency = currency || 'gold';
    const cost = CONFIG.GACHA_COST_SINGLE;

    if (currency === 'gold') {
      if (GameState.player.gold < cost) return { error: 'not_enough_gold' };
      if (Inventory.isFull()) return { error: 'inventory_full' };
      GameState.player.gold -= cost;
    } else {
      if (GameState.player.diamond < cost) return { error: 'not_enough_diamond' };
      if (Inventory.isFull()) return { error: 'inventory_full' };
      GameState.player.diamond -= cost;
    }

    const item = this._rollItem();
    GameState.gacha.totalPulls = (GameState.gacha.totalPulls || 0) + 1;

    return { success: true, item: item };
  },

  // --- Multi pull (10x) ---
  pullMulti(currency) {
    currency = currency || 'gold';
    const cost = CONFIG.GACHA_COST_MULTI;

    if (currency === 'gold') {
      if (GameState.player.gold < cost) return { error: 'not_enough_gold' };
      if (Inventory.getFreeSlots() < CONFIG.GACHA_MULTI_COUNT) return { error: 'inventory_not_enough_space' };
      GameState.player.gold -= cost;
    } else {
      const diamondCost = Math.floor(cost / 10);
      if (GameState.player.diamond < diamondCost) return { error: 'not_enough_diamond' };
      if (Inventory.getFreeSlots() < CONFIG.GACHA_MULTI_COUNT) return { error: 'inventory_not_enough_space' };
      GameState.player.diamond -= diamondCost;
    }

    const items = [];
    for (let i = 0; i < CONFIG.GACHA_MULTI_COUNT; i++) {
      const item = this._rollItem();
      items.push(item);
    }

    GameState.gacha.totalPulls = (GameState.gacha.totalPulls || 0) + CONFIG.GACHA_MULTI_COUNT;
    return { success: true, items: items };
  },

  // --- Internal: Roll one item ---
  _rollItem() {
    const rarity = this._rollRarity();
    const pool = CONFIG.getItemsByRarity(rarity);

    // Fallback to common if pool is empty
    const template = (pool && pool.length > 0)
      ? pool[Math.floor(Math.random() * pool.length)]
      : CONFIG.ITEMS.weapons[0];

    const item = Inventory.addItem(template);
    return item || { ...template, id: -1 };
  },

  // --- Roll rarity based on GACHA_RATES ---
  _rollRarity() {
    const roll = Math.random();
    const rates = CONFIG.GACHA_RATES;
    let cumulative = 0;

    for (const rarity of CONFIG.RARITY_ORDER) {
      cumulative += rates[rarity] || 0;
      if (roll < cumulative) {
        return rarity;
      }
    }
    return 'common';
  },

  // --- Check affordability ---
  canAffordSingle() {
    return GameState.player && GameState.player.gold >= CONFIG.GACHA_COST_SINGLE;
  },

  canAffordMulti() {
    return GameState.player && GameState.player.gold >= CONFIG.GACHA_COST_MULTI;
  }
};
