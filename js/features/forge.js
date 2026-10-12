const Forge = {
  // Cường hóa trang bị (+0 đến +100)
  enhanceItem(itemId, useProtectionStone) {
    let item = Inventory.findItem(itemId);
    if (!item && GameState.player?.equipment) {
      for (const slot in GameState.player.equipment) {
        if (GameState.player.equipment[slot]?.id === itemId) {
          item = GameState.player.equipment[slot];
          break;
        }
      }
    }
    if (!item) return { error: 'item_not_found' };

    const currentLevel = item.enhanceLevel || 0;
    if (currentLevel >= CONFIG.ENHANCE_MAX) return { error: 'max_level' };

    const cost = CONFIG.getEnhanceCost(currentLevel, item.rarity);
    if (!Player.spendGold(cost)) return { error: 'not_enough_gold', cost };

    const hasProtection = useProtectionStone && (GameState.player.protectionStones > 0);
    if (useProtectionStone && !hasProtection) return { error: 'no_protection_stone' };

    const rates = CONFIG.getEnhanceRates(currentLevel);
    const oldLevel = currentLevel;

    // 1. Thành công
    if (Math.random() < rates.success) {
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
      return { success: true, type: outcomeType, item, oldLevel, newLevel: item.enhanceLevel, levelsGained, cost };
    }

    // 2. Thất bại có Bùa Bảo Hiểm
    if (hasProtection) {
      GameState.player.protectionStones--;
      return { success: false, type: 'protected', item, level: item.enhanceLevel, cost, stoneUsed: true };
    }

    // 3. Thất bại không bùa: Xét tỉ lệ vỡ về 0 hoặc rớt cấp
    if (Math.random() < rates.failBreak && currentLevel > 0) {
      item.enhanceLevel = 0;
      return { success: false, type: 'break', item, oldLevel, newLevel: 0, cost };
    }

    if (Math.random() < rates.failDrop && currentLevel > 0) {
      item.enhanceLevel = Math.max(0, currentLevel - 1);
      return { success: false, type: 'downgrade', item, oldLevel, newLevel: item.enhanceLevel, cost };
    }

    return { success: false, type: 'keep', item, level: currentLevel, cost };
  },

  // Dung hợp 3 trang bị cùng bậc thành 1 trang bị bậc kế tiếp
  combineItems(itemIds) {
    if (!itemIds || itemIds.length !== CONFIG.FUSION_COUNT) return { error: 'invalid_count' };
    const items = itemIds.map(id => Inventory.findItem(id));
    if (items.some(i => !i)) return { error: 'item_missing' };

    const rarity = items[0].rarity;
    if (items.some(i => i.rarity !== rarity)) return { error: 'rarity_mismatch' };
    if (rarity === 'unknown') return { error: 'max_rarity_reached' };

    const targetRarity = CONFIG.RARITY_ORDER[CONFIG.RARITY_ORDER.indexOf(rarity) + 1];
    if (!targetRarity) return { error: 'no_higher_rarity' };

    const successRate = CONFIG.FUSION_RATES[rarity] || 0.1;
    const isSuccess = Math.random() < successRate;

    itemIds.forEach(id => Inventory.removeItem(id));

    if (isSuccess) {
      const pool = CONFIG.getItemsByRarity(targetRarity);
      const template = pool[Math.floor(Math.random() * pool.length)] || CONFIG.ITEMS.weapons[0];
      const newItem = Inventory.addItem(template);
      return { success: true, fromRarity: rarity, toRarity: targetRarity, newItem, rate: successRate };
    } else {
      const consolation = (CONFIG.SELL_PRICES[rarity] || 10) * 2;
      Player.gainGold(consolation);
      return { success: false, fromRarity: rarity, toRarity: targetRarity, consolationGold: consolation, rate: successRate };
    }
  },

  quickCombine(rarity) {
    const items = Inventory.getItemsByRarity(rarity);
    const totalGroups = Math.floor(items.length / CONFIG.FUSION_COUNT);
    if (totalGroups <= 0) return { error: 'not_enough_items', count: items.length };

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

    return { success: true, rarity, totalGroups, successes, fails, newItems, totalConsolation };
  }
};
