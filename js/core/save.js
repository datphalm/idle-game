const SaveManager = {
  _autoSaveTimer: null,

  save() {
    const data = {
      version: 2,
      timestamp: Date.now(),
      player: GameState.player,
      upgrades: GameState.upgrades,
      inventory: GameState.inventory,
      gacha: GameState.gacha,
      combat: { monstersKilled: GameState.combat.monstersKilled }
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

  load() {
    try {
      // Hỗ trợ đọc save v2 hoặc fallback save v1
      let raw = localStorage.getItem(CONFIG.SAVE_KEY) || localStorage.getItem('idle_rpg_save_v1');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  // Khôi phục dữ liệu và gán giá trị mặc định cho dữ liệu cũ (tương thích ngược)
  applyLoadedData(data) {
    if (!data) return false;

    if (data.player) {
      Object.assign(GameState.player, data.player);
      if (typeof GameState.player.bossKeys !== 'number') GameState.player.bossKeys = 2;
      if (typeof GameState.player.protectionStones !== 'number') GameState.player.protectionStones = 2;
      if (typeof GameState.player.baseMaxHp !== 'number') GameState.player.baseMaxHp = CONFIG.BASE_HP;
      if (typeof GameState.player.baseDefense !== 'number') GameState.player.baseDefense = CONFIG.BASE_DEFENSE;
      if (typeof GameState.player.baseSpeed !== 'number') GameState.player.baseSpeed = CONFIG.BASE_SPEED;
      if (typeof GameState.player.baseHpRegen !== 'number') GameState.player.baseHpRegen = CONFIG.BASE_HP_REGEN;
      if (typeof GameState.player.currentHp !== 'number' || GameState.player.currentHp <= 0) {
        GameState.player.currentHp = Player.getEffectiveMaxHp();
      }

      if (!GameState.player.equipment) {
        GameState.player.equipment = { weapon: null, armor: null, accessory: null };
      } else {
        for (const slot in GameState.player.equipment) {
          const item = GameState.player.equipment[slot];
          if (item && typeof item.enhanceLevel !== 'number') item.enhanceLevel = 0;
        }
      }
    }

    if (data.upgrades) {
      Object.assign(GameState.upgrades, data.upgrades);
      const defaults = { attack: 0, maxHp: 0, defense: 0, speed: 0, goldRate: 0, hpRegen: 0 };
      for (const k in defaults) {
        if (typeof GameState.upgrades[k] !== 'number') GameState.upgrades[k] = 0;
      }
    }

    if (data.inventory && Array.isArray(data.inventory)) {
      data.inventory.forEach(item => {
        if (typeof item.enhanceLevel !== 'number') item.enhanceLevel = 0;
      });
      GameState.inventory = data.inventory;
    }

    if (data.gacha) Object.assign(GameState.gacha, data.gacha);
    if (data.combat) Object.assign(GameState.combat, data.combat);
    if (GameState.boss) GameState.boss.active = false;

    Inventory.syncIdCounter();
    GameState.lastSaveTime = data.timestamp || Date.now();
    return true;
  },

  calculateOfflineProgress(savedTimestamp) {
    const elapsedSeconds = Math.min(
      Math.floor((Date.now() - savedTimestamp) / 1000),
      CONFIG.MAX_OFFLINE_SECONDS
    );
    if (elapsedSeconds < 60) return null;
    return Combat.calculateOfflineKills(elapsedSeconds);
  },

  applyOfflineRewards(progress) {
    if (!progress) return;
    GameState.player.gold += progress.gold;
    Player.gainExp(progress.exp);
    GameState.combat.monstersKilled += progress.kills;
  },

  startAutoSave() {
    this.stopAutoSave();
    this._autoSaveTimer = setInterval(() => this.save(), CONFIG.AUTO_SAVE_INTERVAL);
    document.addEventListener('visibilitychange', () => { if (document.hidden) SaveManager.save(); });
    window.addEventListener('beforeunload', () => SaveManager.save());
  },

  stopAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  },

  reset() {
    if (!confirm('⚠️ Bạn có chắc muốn XÓA TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác!')) return false;
    localStorage.removeItem(CONFIG.SAVE_KEY);
    localStorage.removeItem('idle_rpg_save_v1');
    location.reload();
    return true;
  },

  formatOfflineTime(seconds) {
    if (seconds < 60) return `${seconds} giây`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
  }
};
