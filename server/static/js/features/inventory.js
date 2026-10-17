let _itemIdCounter = 0;

const Inventory = {
  _nextId() { return ++_itemIdCounter; },

  syncIdCounter() {
    let maxId = 0;
    if (GameState.inventory) {
      GameState.inventory.forEach(item => { if (item.id > maxId) maxId = item.id; });
    }
    const eq = GameState.player?.equipment;
    if (eq) {
      for (const slot in eq) {
        if (eq[slot]?.id > maxId) maxId = eq[slot].id;
      }
    }
    _itemIdCounter = maxId;
  },

  addItem(template) {
    if (this.isFull()) return null;
    const item = {
      id: this._nextId(),
      name: template.name,
      type: template.type,
      rarity: template.rarity,
      enhanceLevel: template.enhanceLevel || 0,
      refinement: template.type === 'weapon' ? (template.refinement || 1) : undefined,
      stats: { ...template.stats }
    };
    GameState.inventory.push(item);
    return item;
  },

  removeItem(itemId) {
    const idx = GameState.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      GameState.inventory.splice(idx, 1);
      return true;
    }
    return false;
  },

  findItem(itemId) {
    return GameState.inventory.find(i => i.id === itemId) || null;
  },

  equipItem(itemId) {
    const item = this.findItem(itemId);
    if (!item) return false;
    const slot = item.type;
    const currentlyEquipped = GameState.player.equipment[slot];

    if (currentlyEquipped) GameState.inventory.push(currentlyEquipped);
    GameState.player.equipment[slot] = item;
    this.removeItem(itemId);
    return true;
  },

  unequipItem(slot) {
    const item = GameState.player.equipment[slot];
    if (!item || this.isFull()) return false;
    GameState.inventory.push(item);
    GameState.player.equipment[slot] = null;
    return true;
  },

  sellItem(itemId) {
    const item = this.findItem(itemId);
    if (!item) return 0;
    const price = (CONFIG.SELL_PRICES[item.rarity] || 15) + (item.enhanceLevel || 0) * 50;
    Player.gainGold(price);
    this.removeItem(itemId);
    return price;
  },

  sellAllByRarities(rarities) {
    if (!Array.isArray(rarities)) rarities = [rarities];
    const toSell = GameState.inventory.filter(i => rarities.includes(i.rarity));
    if (toSell.length === 0) return { count: 0, totalGold: 0 };

    let totalGold = 0;
    toSell.forEach(item => {
      const price = (CONFIG.SELL_PRICES[item.rarity] || 15) + (item.enhanceLevel || 0) * 50;
      totalGold += price;
    });

    Player.gainGold(totalGold);
    GameState.inventory = GameState.inventory.filter(i => !rarities.includes(i.rarity));
    return { count: toSell.length, totalGold };
  },

  getMaxSlots() {
    return GameState.inventoryMax || CONFIG.INVENTORY_MAX || 80;
  },

  getExpandCost() {
    return CONFIG.getInventoryExpandCost(GameState.inventoryExpands || 0);
  },

  expand() {
    const curMax = this.getMaxSlots();
    if (curMax >= CONFIG.INVENTORY_MAX_LIMIT) return { success: false, error: 'limit_reached' };

    const cost = this.getExpandCost();
    if (!Player.spendGold(cost)) return { success: false, error: 'not_enough_gold', cost };

    GameState.inventoryExpands = (GameState.inventoryExpands || 0) + 1;
    GameState.inventoryMax = curMax + CONFIG.INVENTORY_EXPAND_STEP;
    CONFIG.INVENTORY_MAX = GameState.inventoryMax;

    return { success: true, newMax: GameState.inventoryMax, cost };
  },

  isFull() { return GameState.inventory.length >= this.getMaxSlots(); },
  getCount() { return GameState.inventory.length; },
  getFreeSlots() { return Math.max(0, this.getMaxSlots() - GameState.inventory.length); },
  getItemsByRarity(rarity) { return GameState.inventory.filter(i => i.rarity === rarity); },

  sort() {
    const order = { unknown: 0, chaos: 1, mythic: 2, legendary: 3, epic: 4, rare: 5, common: 6 };
    GameState.inventory.sort((a, b) => {
      const ra = order[a.rarity] ?? 99;
      const rb = order[b.rarity] ?? 99;
      if (ra !== rb) return ra - rb;
      const ea = a.enhanceLevel || 0;
      const eb = b.enhanceLevel || 0;
      if (ea !== eb) return eb - ea;
      return a.name.localeCompare(b.name);
    });
  },

  getItemEffectiveStats(item) {
    if (!item?.stats) return {};
    const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
    const effective = {};
    for (const s in item.stats) {
      effective[s] = s === 'goldRate' ? item.stats[s] * mult : Math.floor(item.stats[s] * mult);
    }
    return effective;
  },

  getItemTooltip(item) {
    if (!item) return '';
    const enh = item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : '';
    const ref = item.type === 'weapon' ? ` [Tinh Luyện R${item.refinement || 1}]` : '';
    const lines = [
      `${item.name}${enh}${ref}`,
      `[${CONFIG.RARITY_NAMES[item.rarity] || item.rarity}]`,
      `Loại: ${item.type === 'weapon' ? 'Vũ khí' : item.type === 'armor' ? 'Giáp' : 'Phụ kiện'}`
    ];

    const stats = this.getItemEffectiveStats(item);
    for (const s in stats) {
      const v = stats[s];
      switch (s) {
        case 'attack':   lines.push(`⚔️ Tấn công: +${v}`); break;
        case 'maxHp':    lines.push(`❤️ Máu tối đa: +${v}`); break;
        case 'defense':  lines.push(`🛡️ Phòng thủ: +${v}`); break;
        case 'speed':    lines.push(`⚡ Tốc độ: +${v}`); break;
        case 'goldRate': lines.push(`💰 Tỉ lệ vàng: +${(v * 100).toFixed(0)}%`); break;
      }
    }
    if (item.enhanceLevel > 0) {
      lines.push(`🔨 Cường hóa: +${(item.enhanceLevel * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL * 100).toFixed(0)}% chỉ số`);
    }
    return lines.join('\n');
  }
};
