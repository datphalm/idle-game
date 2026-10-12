// ============================================================
// save.js — Save / Load / Offline Progress (v2 with Compatibility)
// ============================================================

const SaveManager = {
  _autoSaveTimer: null,

  // --- Save game state to LocalStorage ---
  save() {
    const data = {
      version: 2,
      timestamp: Date.now(),
      player: GameState.player,
      upgrades: GameState.upgrades,
      inventory: GameState.inventory,
      gacha: GameState.gacha,
      combat: {
        monstersKilled: GameState.combat.monstersKilled
      }
    };

    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
      GameState.lastSaveTime = data.timestamp;
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },

  // --- Load game state ---
  load() {
    try {
      // Try v2 save first, then fallback to v1 save
      let raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) {
        raw = localStorage.getItem('idle_rpg_save_v1');
      }
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data) return null;

      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  // --- Apply loaded data with backwards compatibility ---
  applyLoadedData(data) {
    if (!data) return false;

    // Apply player
    if (data.player) {
      Object.assign(GameState.player, data.player);

      // Backwards compatibility defaults for new stats & items
      if (typeof GameState.player.bossKeys !== 'number') GameState.player.bossKeys = 2;
      if (typeof GameState.player.protectionStones !== 'number') GameState.player.protectionStones = 2;
      if (typeof GameState.player.baseMaxHp !== 'number') GameState.player.baseMaxHp = CONFIG.BASE_HP;
      if (typeof GameState.player.baseDefense !== 'number') GameState.player.baseDefense = CONFIG.BASE_DEFENSE;
      if (typeof GameState.player.baseSpeed !== 'number') GameState.player.baseSpeed = CONFIG.BASE_SPEED;
      if (typeof GameState.player.baseHpRegen !== 'number') GameState.player.baseHpRegen = CONFIG.BASE_HP_REGEN;
      if (typeof GameState.player.currentHp !== 'number' || GameState.player.currentHp <= 0) {
        GameState.player.currentHp = Player.getEffectiveMaxHp();
      }

      // Ensure equipment structure
      if (!GameState.player.equipment) {
        GameState.player.equipment = { weapon: null, armor: null, accessory: null };
      } else {
        for (const slot in GameState.player.equipment) {
          const item = GameState.player.equipment[slot];
          if (item && typeof item.enhanceLevel !== 'number') {
            item.enhanceLevel = 0;
          }
        }
      }
    }

    // Apply upgrades with new fields
    if (data.upgrades) {
      Object.assign(GameState.upgrades, data.upgrades);
      const defaults = { attack: 0, maxHp: 0, defense: 0, speed: 0, goldRate: 0, hpRegen: 0 };
      for (const k in defaults) {
        if (typeof GameState.upgrades[k] !== 'number') {
          GameState.upgrades[k] = 0;
        }
      }
    }

    // Apply inventory & ensure enhanceLevel
    if (data.inventory && Array.isArray(data.inventory)) {
      data.inventory.forEach(item => {
        if (typeof item.enhanceLevel !== 'number') {
          item.enhanceLevel = 0;
        }
      });
      GameState.inventory = data.inventory;
    }

    // Apply gacha
    if (data.gacha) {
      Object.assign(GameState.gacha, data.gacha);
    }

    // Apply combat
    if (data.combat) {
      Object.assign(GameState.combat, data.combat);
    }

    // Reset boss fight active state
    if (GameState.boss) {
      GameState.boss.active = false;
    }

    // Sync item ID counter
    Inventory.syncIdCounter();

    GameState.lastSaveTime = data.timestamp || Date.now();
    return true;
  },

  // --- Calculate offline progress ---
  calculateOfflineProgress(savedTimestamp) {
    const now = Date.now();
    const elapsedMs = now - savedTimestamp;
    let elapsedSeconds = Math.floor(elapsedMs / 1000);

    elapsedSeconds = Math.min(elapsedSeconds, CONFIG.MAX_OFFLINE_SECONDS);
    if (elapsedSeconds < 60) return null;

    return Combat.calculateOfflineKills(elapsedSeconds);
  },

  // --- Apply offline rewards ---
  applyOfflineRewards(progress) {
    if (!progress) return;

    GameState.player.gold += progress.gold;
    Player.gainExp(progress.exp);
    GameState.combat.monstersKilled += progress.kills;
  },

  // --- Auto Save ---
  startAutoSave() {
    this.stopAutoSave();
    this._autoSaveTimer = setInterval(() => {
      this.save();
    }, CONFIG.AUTO_SAVE_INTERVAL);

    document.addEventListener('visibilitychange', this._onVisibilityChange);
    window.addEventListener('beforeunload', this._onBeforeUnload);
  },

  stopAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  },

  _onVisibilityChange() {
    if (document.hidden) SaveManager.save();
  },

  _onBeforeUnload() {
    SaveManager.save();
  },

  // --- Reset data ---
  reset() {
    if (!confirm('⚠️ Bạn có chắc muốn XÓA TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác!')) {
      return false;
    }
    localStorage.removeItem(CONFIG.SAVE_KEY);
    localStorage.removeItem('idle_rpg_save_v1');
    location.reload();
    return true;
  },

  formatOfflineTime(seconds) {
    if (seconds < 60) return `${seconds} giây`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  }
};
