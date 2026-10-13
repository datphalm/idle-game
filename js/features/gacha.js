const Gacha = {
  // ==========================================
  // 1. BANNER TRANG BỊ & THẦN BINH
  // ==========================================
  pullWeapon(count = 1) {
    let cost = CONFIG.GACHA_COST_SINGLE;
    if (count === 10) cost = CONFIG.GACHA_COST_MULTI;
    else if (count === 100) cost = CONFIG.GACHA_COST_100;
    else if (count === 1000) cost = CONFIG.GACHA_COST_1000;
    else cost = CONFIG.GACHA_COST_SINGLE * count;

    if (GameState.player.gold < cost) return { error: 'not_enough_gold', cost };

    const freeSlots = Inventory.getFreeSlots();
    // Nếu quay số lượng lớn (100, 1000), tự động bán đồ thường hoặc ghép đồ nếu túi đầy
    if (count <= 10 && freeSlots < count) {
      return { error: 'inventory_not_enough_space', needed: count, free: freeSlots };
    }

    Player.spendGold(cost);

    const items = [];
    const statsSummary = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0, chaos: 0, unknown: 0 };
    let autoSoldGold = 0;

    for (let i = 0; i < count; i++) {
      const rarity = this._rollRarity();
      statsSummary[rarity] = (statsSummary[rarity] || 0) + 1;

      // Nếu kho đầy khi quay x100 hoặc x1000: Tự động bán đồ thường/hiếm để lấy vàng
      if (Inventory.isFull() && (rarity === 'common' || rarity === 'rare')) {
        const sellPrice = CONFIG.SELL_PRICES[rarity] || 10;
        Player.gainGold(sellPrice);
        autoSoldGold += sellPrice;
        continue;
      }

      const pool = CONFIG.getItemsByRarity(rarity);
      const template = (pool?.length) ? pool[Math.floor(Math.random() * pool.length)] : CONFIG.ITEMS.weapons[0];
      const addedItem = Inventory.addItem(template);
      if (addedItem) {
        items.push(addedItem);
        if (rarity === 'mythic' || rarity === 'chaos') {
          if (typeof FriendAdmin !== 'undefined') {
            FriendAdmin.logAction('gacha', `Triệu hồi vũ khí cực phẩm [${addedItem.name}] (${CONFIG.RARITIES[rarity]?.name || rarity})!`);
          }
        }
      }
    }

    GameState.gacha.totalPulls = (GameState.gacha.totalPulls || 0) + count;
    return { success: true, count, items, statsSummary, autoSoldGold, type: 'weapon' };
  },

  // ==========================================
  // 2. BANNER ANH HÙNG & NHÂN VẬT (GENSHIN / WUTHERING WAVES)
  // ==========================================
  pullHero(count = 1) {
    let cost = CONFIG.GACHA_COST_SINGLE * 2; // Gacha tướng tốn gấp đôi vàng
    if (count === 10) cost = CONFIG.GACHA_COST_MULTI * 2;
    else if (count === 100) cost = CONFIG.GACHA_COST_100 * 2;
    else if (count === 1000) cost = CONFIG.GACHA_COST_1000 * 2;
    else cost = (CONFIG.GACHA_COST_SINGLE * 2) * count;

    if (GameState.player.gold < cost) return { error: 'not_enough_gold', cost };

    Player.spendGold(cost);

    const results = [];
    const statsSummary = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0, chaos: 0, unknown: 0 };

    for (let i = 0; i < count; i++) {
      const rarity = this._rollRarity();
      statsSummary[rarity] = (statsSummary[rarity] || 0) + 1;

      let heroPool = CONFIG.getHeroesByRarity(rarity);
      if (!heroPool || heroPool.length === 0) {
        // Fallback an toàn: nếu không có tướng bậc đó thì rớt vào common/rare, tuyệt đối KHÔNG random toàn bộ!
        heroPool = CONFIG.getHeroesByRarity('common');
      }

      const template = (heroPool && heroPool.length > 0)
        ? heroPool[Math.floor(Math.random() * heroPool.length)]
        : CONFIG.HEROES_LIST[0];

      const heroResult = this._addOrUpgradeHero(template);
      results.push(heroResult);
    }

    GameState.gacha.totalHeroPulls = (GameState.gacha.totalHeroPulls || 0) + count;
    return { success: true, count, results, statsSummary, type: 'hero' };
  },

  _addOrUpgradeHero(template) {
    if (!GameState.heroes) GameState.heroes = [];
    let existing = GameState.heroes.find(h => h.id === template.id);

    if (existing) {
      // Đã có -> Tăng Cung Mệnh (Constellation E1 đến E6)
      if (existing.constellation < 6) {
        existing.constellation++;
        if (typeof FriendAdmin !== 'undefined') {
          FriendAdmin.logAction('gacha', `Nâng cấp tướng [${template.name}] lên Cung Mệnh E${existing.constellation}!`);
        }
        if (typeof Leaderboard !== 'undefined') Leaderboard.syncCurrentPlayer();
        return { hero: template, isNew: false, constellation: existing.constellation, action: 'constellation_up' };
      } else {
        // E6 max -> Đổi thành 50000 Vàng an ủi
        Player.gainGold(50000);
        if (typeof FriendAdmin !== 'undefined') {
          FriendAdmin.logAction('gacha', `Quay trùng tướng [${template.name}] (Đã đạt E6 MAX), chuyển thành 50,000 Vàng!`);
        }
        return { hero: template, isNew: false, constellation: 6, action: 'max_shards_gold', refundGold: 50000 };
      }
    } else {
      // Nhân vật mới (E0)
      const newHero = {
        id: template.id,
        constellation: 0,
        level: 1,
        skillLevels: { s1: 1, s2: 1, s3: 1 },
        unlockedAt: Date.now()
      };
      GameState.heroes.push(newHero);
      if (typeof FriendAdmin !== 'undefined') {
        FriendAdmin.logAction('gacha', `Chiêu mộ thành công tướng mới [${template.name}] (E0)!`);
      }
      if (typeof Leaderboard !== 'undefined') Leaderboard.syncCurrentPlayer();
      return { hero: template, isNew: true, constellation: 0, action: 'new_unlock' };
    }
  },

  _rollRarity() {
    const roll = Math.random();
    const rates = CONFIG.GACHA_RATES;
    let cumulative = 0;

    for (const rarity of CONFIG.RARITY_ORDER) {
      cumulative += rates[rarity] || 0;
      if (roll < cumulative) return rarity;
    }
    return 'common';
  },

  canAfford(count, isHero = false) {
    return (GameState.player?.gold || 0) >= this.getCost(count, isHero);
  },

  canAffordSingle(isHero = false) { return this.canAfford(1, isHero); },
  canAffordMulti(isHero = false) { return this.canAfford(10, isHero); },

  getCost(count, isHero = false) {
    let cost = CONFIG.GACHA_COST_SINGLE;
    if (count === 10) cost = CONFIG.GACHA_COST_MULTI;
    else if (count === 100) cost = CONFIG.GACHA_COST_100;
    else if (count === 1000) cost = CONFIG.GACHA_COST_1000;
    else cost = CONFIG.GACHA_COST_SINGLE * count;
    return isHero ? cost * 2 : cost;
  },

  runAutoGacha() {
    if (!GameState.autoGacha?.enabled) return;
    const isHero = GameState.autoGacha.banner === 'hero';
    const tier = GameState.autoGacha.tier || 10;
    const stopRarity = GameState.autoGacha.stopOnRarity || 'legendary';

    if (!this.canAfford(tier, isHero)) {
      GameState.autoGacha.enabled = false;
      if (typeof UI !== 'undefined') {
        UI.showToast('💰 Tự động Gacha đã dừng: Không đủ Vàng!');
        UI._syncAutoGachaControls();
      }
      return;
    }

    if (!isHero && tier <= 10 && Inventory.getFreeSlots() < tier) {
      GameState.autoGacha.enabled = false;
      if (typeof UI !== 'undefined') {
        UI.showToast('🎒 Tự động Gacha đã dừng: Kho đồ đã đầy!');
        UI._syncAutoGachaControls();
      }
      return;
    }

    const res = isHero ? this.pullHero(tier) : this.pullWeapon(tier);
    if (!res || res.error) {
      GameState.autoGacha.enabled = false;
      if (typeof UI !== 'undefined') UI._syncAutoGachaControls();
      return;
    }

    // Kiểm tra xem có trúng phẩm chất cần dừng hay không
    if (stopRarity && stopRarity !== 'none') {
      const stopOrderIdx = CONFIG.RARITY_ORDER.indexOf(stopRarity);
      let hitTarget = false;
      let highestHit = '';

      for (let i = CONFIG.RARITY_ORDER.length - 1; i >= stopOrderIdx; i--) {
        const r = CONFIG.RARITY_ORDER[i];
        if (res.statsSummary && res.statsSummary[r] > 0) {
          hitTarget = true;
          highestHit = CONFIG.RARITY_NAMES[r];
          break;
        }
      }

      if (hitTarget) {
        GameState.autoGacha.enabled = false;
        if (typeof UI !== 'undefined') {
          UI.showToast(`🎉 Tự động Gacha dừng lại: Đã trúng phẩm chất [${highestHit}]!`);
          UI._syncAutoGachaControls();
        }
      }
    }

    if (typeof UI !== 'undefined') {
      if (UI._currentTab === 'gacha') UI.updateGacha();
      UI.updateInventory();
      UI.updateStatusBar();
    }
  }
};
