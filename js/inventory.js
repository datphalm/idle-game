// ============================================================
// inventory.js — Inventory Management & Item Formatting
// ============================================================

let _itemIdCounter = 0;

const Inventory = {

  // --- Generate unique item ID ---
  _nextId() {
    return ++_itemIdCounter;
  },

  // --- Sync ID counter after load ---
  syncIdCounter() {
    let maxId = 0;
    if (GameState.inventory) {
      GameState.inventory.forEach(item => {
        if (item.id > maxId) maxId = item.id;
      });
    }
    const eq = GameState.player && GameState.player.equipment;
    if (eq) {
      for (const slot in eq) {
        if (eq[slot] && eq[slot].id > maxId) {
          maxId = eq[slot].id;
        }
      }
    }
    _itemIdCounter = maxId;
  },

  // --- Add item to inventory ---
  addItem(template) {
    if (this.isFull()) return null;

    const item = {
      id: this._nextId(),
      name: template.name,
      type: template.type,
      rarity: template.rarity,
      enhanceLevel: template.enhanceLevel || 0,
      stats: { ...template.stats }
    };

    GameState.inventory.push(item);
    return item;
  },

  // --- Remove item by ID ---
  removeItem(itemId) {
    const idx = GameState.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      GameState.inventory.splice(idx, 1);
      return true;
    }
    return false;
  },

  // --- Find item by ID ---
  findItem(itemId) {
    return GameState.inventory.find(i => i.id === itemId) || null;
  },

  // --- Equip item ---
  equipItem(itemId) {
    const item = this.findItem(itemId);
    if (!item) return false;

    const slot = item.type; // weapon, armor, accessory
    const currentlyEquipped = GameState.player.equipment[slot];

    // Unequip current item first
    if (currentlyEquipped) {
      GameState.inventory.push(currentlyEquipped);
    }

    // Equip new item
    GameState.player.equipment[slot] = item;
    this.removeItem(itemId);

    return true;
  },

  // --- Unequip slot ---
  unequipItem(slot) {
    const item = GameState.player.equipment[slot];
    if (!item) return false;

    if (this.isFull()) return false; // no room in bag

    GameState.inventory.push(item);
    GameState.player.equipment[slot] = null;

    return true;
  },

  // --- Sell item ---
  sellItem(itemId) {
    const item = this.findItem(itemId);
    if (!item) return 0;

    const basePrice = CONFIG.SELL_PRICES[item.rarity] || 10;
    const enhanceBonus = (item.enhanceLevel || 0) * 50;
    const price = basePrice + enhanceBonus;

    GameState.player.gold += price;
    this.removeItem(itemId);
    return price;
  },

  // --- Check if full ---
  isFull() {
    return GameState.inventory.length >= CONFIG.INVENTORY_MAX;
  },

  // --- Get count & free space ---
  getCount() {
    return GameState.inventory.length;
  },

  getFreeSlots() {
    return Math.max(0, CONFIG.INVENTORY_MAX - GameState.inventory.length);
  },

  // --- Get items of specific rarity in inventory ---
  getItemsByRarity(rarity) {
    return GameState.inventory.filter(i => i.rarity === rarity);
  },

  // --- Sort inventory ---
  sort() {
    const order = {
      unknown: 0,
      chaos: 1,
      mythic: 2,
      legendary: 3,
      epic: 4,
      rare: 5,
      common: 6
    };

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

  // --- Get item effective stats with enhancement multiplier ---
  getItemEffectiveStats(item) {
    if (!item || !item.stats) return {};
    const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
    const effective = {};
    for (const s in item.stats) {
      if (s === 'goldRate') {
        effective[s] = item.stats[s] * mult;
      } else {
        effective[s] = Math.floor(item.stats[s] * mult);
      }
    }
    return effective;
  },

  // --- Format tooltip for item ---
  getItemTooltip(item) {
    if (!item) return '';
    const enhanceTag = item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : '';
    const lines = [
      `${item.name}${enhanceTag}`,
      `[${CONFIG.RARITY_NAMES[item.rarity] || item.rarity}]`,
      `Loại: ${item.type === 'weapon' ? 'Vũ khí' : item.type === 'armor' ? 'Giáp' : 'Phụ kiện'}`
    ];

    const stats = this.getItemEffectiveStats(item);
    for (const stat in stats) {
      const val = stats[stat];
      switch (stat) {
        case 'attack':   lines.push(`⚔️ Tấn công: +${val}`); break;
        case 'maxHp':    lines.push(`❤️ Máu tối đa: +${val}`); break;
        case 'defense':  lines.push(`🛡️ Phòng thủ: +${val}`); break;
        case 'speed':    lines.push(`⚡ Tốc độ: +${val}`); break;
        case 'goldRate': lines.push(`💰 Tỉ lệ vàng: +${(val * 100).toFixed(0)}%`); break;
      }
    }

    if (item.enhanceLevel > 0) {
      lines.push(`🔨 Cường hóa: +${(item.enhanceLevel * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL * 100).toFixed(0)}% chỉ số`);
    }

    return lines.join('\n');
  }
};
