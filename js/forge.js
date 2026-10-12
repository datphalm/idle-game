// ============================================================
// forge.js — Enhancement (+1 to +100) & Fusion System
// ============================================================

const Forge = {

  // ============================================================
  // ENHANCEMENT SYSTEM (+0 -> +100)
  // ============================================================

  enhanceItem(itemId, useProtectionStone) {
    // Find in inventory or equipped items
    let item = Inventory.findItem(itemId);
    let isEquipped = false;
    let equippedSlot = null;

    if (!item && GameState.player && GameState.player.equipment) {
      for (const slot in GameState.player.equipment) {
        if (GameState.player.equipment[slot] && GameState.player.equipment[slot].id === itemId) {
          item = GameState.player.equipment[slot];
          isEquipped = true;
          equippedSlot = slot;
          break;
        }
      }
    }

    if (!item) return { error: 'item_not_found' };

    const currentLevel = item.enhanceLevel || 0;
    if (currentLevel >= CONFIG.ENHANCE_MAX) {
      return { error: 'max_level' };
    }

    const cost = CONFIG.getEnhanceCost(currentLevel, item.rarity);
    if (!Player.spendGold(cost)) {
      return { error: 'not_enough_gold', cost: cost };
    }

    // Check protection stone
    const hasProtection = useProtectionStone && (GameState.player.protectionStones > 0);
    if (useProtectionStone && !hasProtection) {
      return { error: 'no_protection_stone' };
    }

    const rates = CONFIG.getEnhanceRates(currentLevel);
    const roll = Math.random();
    const oldLevel = currentLevel;

    // --- SUCCESS ---
    if (roll < rates.success) {
      const critRoll = Math.random();
      let levelsGained = 1;
      let outcomeType = 'success';

      if (critRoll < rates.greatSuccess3 && currentLevel + 3 <= CONFIG.ENHANCE_MAX) {
        levelsGained = 3;
        outcomeType = 'crit3';
      } else if (critRoll < (rates.greatSuccess2 + rates.greatSuccess3) && currentLevel + 2 <= CONFIG.ENHANCE_MAX) {
        levelsGained = 2;
        outcomeType = 'crit2';
      }

      item.enhanceLevel = Math.min(CONFIG.ENHANCE_MAX, currentLevel + levelsGained);

      return {
        success: true,
        type: outcomeType,
        item: item,
        oldLevel: oldLevel,
        newLevel: item.enhanceLevel,
        levelsGained: levelsGained,
        cost: cost
      };
    }

    // --- FAILURE ---
    // If protection stone was used:
    if (hasProtection) {
      GameState.player.protectionStones--;
      return {
        success: false,
        type: 'protected',
        item: item,
        level: item.enhanceLevel,
        cost: cost,
        stoneUsed: true
      };
    }

    // Without protection stone: check Break or Downgrade
    const breakRoll = Math.random();
    if (breakRoll < rates.failBreak && currentLevel > 0) {
      // BREAK: Resets to +0!
      item.enhanceLevel = 0;
      return {
        success: false,
        type: 'break',
        item: item,
        oldLevel: oldLevel,
        newLevel: 0,
        cost: cost
      };
    }

    const dropRoll = Math.random();
    if (dropRoll < rates.failDrop && currentLevel > 0) {
      // DOWNGRADE: -1 level
      item.enhanceLevel = Math.max(0, currentLevel - 1);
      return {
        success: false,
        type: 'downgrade',
        item: item,
        oldLevel: oldLevel,
        newLevel: item.enhanceLevel,
        cost: cost
      };
    }

    // Normal Fail: Keep current level
    return {
      success: false,
      type: 'keep',
      item: item,
      level: currentLevel,
      cost: cost
    };
  },

  // ============================================================
  // FUSION SYSTEM (GHÉP ĐỒ 3 MÓN)
  // ============================================================

  combineItems(itemIds) {
    if (!itemIds || itemIds.length !== CONFIG.FUSION_COUNT) {
      return { error: 'invalid_count' };
    }

    const items = itemIds.map(id => Inventory.findItem(id));
    if (items.some(i => !i)) {
      return { error: 'item_missing' };
    }

    const rarity = items[0].rarity;
    if (items.some(i => i.rarity !== rarity)) {
      return { error: 'rarity_mismatch' };
    }

    if (rarity === 'unknown') {
      return { error: 'max_rarity_reached' };
    }

    // Determine target rarity
    const currentIndex = CONFIG.RARITY_ORDER.indexOf(rarity);
    const targetRarity = CONFIG.RARITY_ORDER[currentIndex + 1];
    if (!targetRarity) {
      return { error: 'no_higher_rarity' };
    }

    const successRate = CONFIG.FUSION_RATES[rarity] || 0.1;
    const isSuccess = Math.random() < successRate;

    // Remove the 3 ingredient items
    itemIds.forEach(id => Inventory.removeItem(id));

    if (isSuccess) {
      const pool = CONFIG.getItemsByRarity(targetRarity);
      const template = pool[Math.floor(Math.random() * pool.length)] || CONFIG.ITEMS.weapons[0];
      const newItem = Inventory.addItem(template);

      return {
        success: true,
        fromRarity: rarity,
        toRarity: targetRarity,
        newItem: newItem,
        rate: successRate
      };
    } else {
      // Consolation reward
      const consolation = (CONFIG.SELL_PRICES[rarity] || 10) * 2;
      Player.gainGold(consolation);

      return {
        success: false,
        fromRarity: rarity,
        toRarity: targetRarity,
        consolationGold: consolation,
        rate: successRate
      };
    }
  },

  // --- Auto/Quick combine all unequipped items of given rarity ---
  quickCombine(rarity) {
    const items = Inventory.getItemsByRarity(rarity);
    const totalGroups = Math.floor(items.length / CONFIG.FUSION_COUNT);

    if (totalGroups <= 0) {
      return { error: 'not_enough_items', count: items.length };
    }

    let successes = 0;
    let fails = 0;
    const newItems = [];
    let totalConsolation = 0;

    for (let g = 0; g < totalGroups; g++) {
      const groupIds = [items[g * 3].id, items[g * 3 + 1].id, items[g * 3 + 2].id];
      const res = this.combineItems(groupIds);

      if (res.success) {
        successes++;
        if (res.newItem) newItems.push(res.newItem);
      } else {
        fails++;
        totalConsolation += (res.consolationGold || 0);
      }
    }

    return {
      success: true,
      rarity: rarity,
      totalGroups: totalGroups,
      successes: successes,
      fails: fails,
      newItems: newItems,
      totalConsolation: totalConsolation
    };
  }
};
