const SaveManager = {
  _autoSaveTimer: null,
  PROFILES_META_KEY: 'idle_rpg_profiles_meta_v1',

  // Khởi tạo và lấy danh sách hồ sơ (Mặc định 3 slot)
  getProfilesMeta() {
    let meta = null;
    try {
      const raw = localStorage.getItem(this.PROFILES_META_KEY);
      if (raw) meta = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse profiles meta:', e);
    }

    if (!meta || !Array.isArray(meta.slots)) {
      meta = {
        activeSlotId: 'slot_1',
        slots: [
          { id: 'slot_1', name: 'Chiến Binh 1', level: 1, heroId: 'hero_traveler', stage: 1, timestamp: Date.now(), isEmpty: false },
          { id: 'slot_2', name: 'Hồ Sơ 2 (Trống)', level: 0, heroId: 'hero_traveler', stage: 1, timestamp: 0, isEmpty: true },
          { id: 'slot_3', name: 'Hồ Sơ 3 (Trống)', level: 0, heroId: 'hero_traveler', stage: 1, timestamp: 0, isEmpty: true }
        ]
      };

      // Tự động di chuyển dữ liệu cũ (Backward Compatibility)
      const oldSave = localStorage.getItem(CONFIG.SAVE_KEY) || localStorage.getItem('idle_rpg_save_v1');
      if (oldSave) {
        try {
          const parsed = JSON.parse(oldSave);
          localStorage.setItem(`${CONFIG.SAVE_KEY}_slot_1`, oldSave);
          meta.slots[0].level = parsed.player?.level || 1;
          meta.slots[0].heroId = parsed.activeHeroId || 'hero_traveler';
          meta.slots[0].stage = parsed.stage?.current || 1;
          meta.slots[0].timestamp = parsed.timestamp || Date.now();
          meta.slots[0].isEmpty = false;
        } catch (e) {}
      }
      this.saveProfilesMeta(meta);
    }
    return meta;
  },

  saveProfilesMeta(meta) {
    try {
      localStorage.setItem(this.PROFILES_META_KEY, JSON.stringify(meta));
    } catch (e) {
      console.error('Failed to save profiles meta:', e);
    }
  },

  getActiveSlotId() {
    const meta = this.getProfilesMeta();
    return meta.activeSlotId || 'slot_1';
  },

  setActiveSlotId(slotId) {
    const meta = this.getProfilesMeta();
    meta.activeSlotId = slotId;
    this.saveProfilesMeta(meta);
  },

  getSlotStorageKey(slotId) {
    const id = slotId || this.getActiveSlotId();
    return `${CONFIG.SAVE_KEY}_${id}`;
  },

  save(targetSlotId) {
    const slotId = targetSlotId || this.getActiveSlotId();
    const data = {
      version: 2,
      slotId: slotId,
      timestamp: Date.now(),
      player: GameState.player,
      upgrades: GameState.upgrades,
      inventory: GameState.inventory,
      inventoryMax: GameState.inventoryMax,
      inventoryExpands: GameState.inventoryExpands,
      stage: GameState.stage,
      heroes: GameState.heroes,
      activeHeroId: GameState.activeHeroId,
      autoUpgrade: GameState.autoUpgrade,
      autoFusion: GameState.autoFusion,
      gacha: GameState.gacha,
      combat: { monstersKilled: GameState.combat.monstersKilled },
      dungeon: {
        abyssFloor: GameState.dungeon?.abyssFloor || 1,
        towerHighestFloor: GameState.dungeon?.towerHighestFloor || 1,
        dailyRuns: GameState.dungeon?.dailyRuns || { gold: 3, exp: 3, rune: 3, forge: 3 }
      },
      settings: GameState.settings || { vfxEnabled: true }
    };

    try {
      // 1. Lưu dữ liệu chi tiết của Slot
      const jsonStr = JSON.stringify(data);
      localStorage.setItem(this.getSlotStorageKey(slotId), jsonStr);

      // Đồng bộ với key save chính để tương thích các module khác
      if (slotId === this.getActiveSlotId()) {
        localStorage.setItem(CONFIG.SAVE_KEY, jsonStr);
      }

      // 2. Cập nhật Metadata danh sách hồ sơ
      const meta = this.getProfilesMeta();
      const slot = meta.slots.find(s => s.id === slotId);
      if (slot) {
        slot.level = GameState.player?.level || 1;
        slot.heroId = GameState.activeHeroId || 'hero_traveler';
        slot.stage = GameState.stage?.current || 1;
        slot.timestamp = data.timestamp;
        slot.gold = GameState.player?.gold || 0;
        slot.diamond = GameState.player?.diamond || 0;
        slot.isEmpty = false;
        this.saveProfilesMeta(meta);
      }

      GameState.lastSaveTime = data.timestamp;

      // Cập nhật shadow chữ ký số Anti-Cheat nếu có
      if (typeof AntiCheat !== 'undefined' && AntiCheat.refreshSignatures) {
        AntiCheat.refreshSignatures();
      }

      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },

  load(targetSlotId) {
    try {
      const slotId = targetSlotId || this.getActiveSlotId();
      let raw = localStorage.getItem(this.getSlotStorageKey(slotId));
      if (!raw && slotId === 'slot_1') {
        // Fallback đọc save cũ
        raw = localStorage.getItem(CONFIG.SAVE_KEY) || localStorage.getItem('idle_rpg_save_v1');
      }
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  // Chuyển đổi giữa các hồ sơ người chơi khác nhau
  switchProfile(targetSlotId) {
    if (!targetSlotId) return false;
    const currentSlot = this.getActiveSlotId();

    // 1. Lưu slot hiện tại trước khi chuyển để không mất tiến trình
    this.save(currentSlot);

    // 2. Chuyển sang slot mới
    this.setActiveSlotId(targetSlotId);
    const meta = this.getProfilesMeta();
    const slot = meta.slots.find(s => s.id === targetSlotId);

    // Dừng combat & dungeon hiện tại
    if (typeof Combat !== 'undefined') Combat.stop();
    if (GameState.dungeon) GameState.dungeon.active = false;
    if (GameState.boss) GameState.boss.active = false;

    if (!slot || slot.isEmpty) {
      // Slot trống -> Tạo nhân vật mới hoàn toàn
      this._resetToNewCharacterState();
      if (slot) {
        slot.isEmpty = false;
        slot.name = slot.name.includes('(Trống)') ? `Hiệp Sĩ ${targetSlotId.replace('slot_', '')}` : slot.name;
        this.saveProfilesMeta(meta);
      }
      this.save(targetSlotId);
    } else {
      // Đọc dữ liệu đã có
      const loaded = this.load(targetSlotId);
      if (loaded) {
        this.applyLoadedData(loaded);
      } else {
        this._resetToNewCharacterState();
        this.save(targetSlotId);
      }
    }

    // 3. Cập nhật lại toàn bộ giao diện & game loop
    if (typeof Monster !== 'undefined') Monster.spawn();
    if (typeof Combat !== 'undefined') Combat.start();
    if (typeof UI !== 'undefined') {
      UI.updateAll();
      if (UI.updateProfilesModal) UI.updateProfilesModal();
      UI.showToast(`✨ Đã chuyển sang hồ sơ [${slot?.name || targetSlotId}]!`);
    }

    if (typeof AntiCheat !== 'undefined' && AntiCheat.refreshSignatures) {
      AntiCheat.refreshSignatures();
    }

    return true;
  },

  _resetToNewCharacterState() {
    GameState.player = Player.createDefault();
    GameState.upgrades = { attack: 0, maxHp: 0, defense: 0, speed: 0, goldRate: 0, hpRegen: 0 };
    GameState.autoUpgrade = {
      enabled: false,
      selected: { attack: true, maxHp: true, defense: false, speed: false, goldRate: false, hpRegen: false }
    };
    GameState.autoFusion = {
      enabled: false,
      rarities: { common: true, rare: false, epic: false, legendary: false, mythic: false, chaos: false }
    };
    GameState.stage = { current: 1, max: 1, autoAdvance: true };
    GameState.inventory = [];
    GameState.inventoryMax = CONFIG.INVENTORY_BASE_MAX || 80;
    CONFIG.INVENTORY_MAX = GameState.inventoryMax;
    GameState.inventoryExpands = 0;
    GameState.heroes = [{ id: 'hero_traveler', constellation: 0, level: 1, skillLevels: { s1: 1, s2: 1, s3: 1 }, unlockedAt: Date.now() }];
    GameState.activeHeroId = 'hero_traveler';
    GameState.gacha = { totalPulls: 0, totalHeroPulls: 0, bannerTab: 'weapon' };
    GameState.combat = { monstersKilled: 0 };
    GameState.dungeon = {
      active: false,
      dungeonId: null,
      subMode: null,
      wave: 1,
      maxWaves: 5,
      goldEarned: 0,
      expEarned: 0,
      stonesEarned: 0,
      forgeDropsEarned: 0,
      abyssFloor: 1,
      towerHighestFloor: 1,
      autoClimb: true,
      dailyRuns: { gold: 3, exp: 3, rune: 3, forge: 3 }
    };
    GameState.boss = { active: false, bossIndex: 0, hp: 0, maxHp: 0, timer: 0, timerMax: 0, rage: 0, rageMax: 100 };
    GameState.lastSaveTime = Date.now();
  },

  renameProfile(slotId, newName) {
    if (!newName || !newName.trim()) return false;
    const meta = this.getProfilesMeta();
    const slot = meta.slots.find(s => s.id === slotId);
    if (slot) {
      slot.name = newName.trim();
      this.saveProfilesMeta(meta);
      if (typeof UI !== 'undefined' && UI.updateProfilesModal) UI.updateProfilesModal();
      return true;
    }
    return false;
  },

  deleteProfile(slotId) {
    if (slotId === this.getActiveSlotId()) {
      alert('⚠️ Không thể xóa hồ sơ đang được sử dụng! Vui lòng chuyển sang hồ sơ khác trước.');
      return false;
    }
    if (!confirm('⚠️ Bạn có chắc muốn xóa vĩnh viễn hồ sơ này?')) return false;

    localStorage.removeItem(this.getSlotStorageKey(slotId));
    const meta = this.getProfilesMeta();
    const slot = meta.slots.find(s => s.id === slotId);
    if (slot) {
      slot.isEmpty = true;
      slot.name = `Hồ Sơ ${slotId.replace('slot_', '')} (Trống)`;
      slot.level = 0;
      slot.timestamp = 0;
      this.saveProfilesMeta(meta);
    }
    if (typeof UI !== 'undefined' && UI.updateProfilesModal) UI.updateProfilesModal();
    return true;
  },

  // Xuất file lưu (Export profile)
  exportProfile(slotId) {
    const sid = slotId || this.getActiveSlotId();
    this.save(sid);
    const raw = localStorage.getItem(this.getSlotStorageKey(sid));
    if (!raw) return null;
    try {
      // Mã hóa Base64 để chống sửa đổi bậy bạ
      return btoa(unescape(encodeURIComponent(raw)));
    } catch (e) {
      return btoa(raw);
    }
  },

  // Nhập file lưu (Import profile)
  importProfile(slotId, encodedStr) {
    try {
      if (!encodedStr || !encodedStr.trim()) throw new Error('Dữ liệu rỗng');
      let decodedStr = '';
      try {
        decodedStr = decodeURIComponent(escape(atob(encodedStr.trim())));
      } catch (e) {
        decodedStr = atob(encodedStr.trim());
      }
      const parsed = JSON.parse(decodedStr);
      if (!parsed.player || typeof parsed.player.level !== 'number') {
        throw new Error('Dữ liệu không đúng định dạng');
      }

      const sid = slotId || this.getActiveSlotId();
      localStorage.setItem(this.getSlotStorageKey(sid), JSON.stringify(parsed));

      const meta = this.getProfilesMeta();
      const slot = meta.slots.find(s => s.id === sid);
      if (slot) {
        slot.isEmpty = false;
        slot.level = parsed.player.level;
        slot.heroId = parsed.activeHeroId || 'hero_traveler';
        slot.stage = parsed.stage?.current || 1;
        slot.timestamp = Date.now();
        this.saveProfilesMeta(meta);
      }

      if (sid === this.getActiveSlotId()) {
        this.applyLoadedData(parsed);
        if (typeof Monster !== 'undefined') Monster.spawn();
        if (typeof Combat !== 'undefined') Combat.start();
        if (typeof UI !== 'undefined') UI.updateAll();
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
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

    if (typeof data.inventoryMax === 'number') {
      GameState.inventoryMax = data.inventoryMax;
      CONFIG.INVENTORY_MAX = data.inventoryMax;
    }
    if (typeof data.inventoryExpands === 'number') GameState.inventoryExpands = data.inventoryExpands;

    if (data.stage) {
      Object.assign(GameState.stage, data.stage);
    }

    if (data.heroes && Array.isArray(data.heroes) && data.heroes.length > 0) {
      GameState.heroes = data.heroes;
    } else {
      // Đảm bảo luôn có ít nhất Nhà Lữ Hành mặc định
      GameState.heroes = [{ id: 'hero_traveler', constellation: 0, level: 1, skillLevels: { s1: 1, s2: 1, s3: 1 }, unlockedAt: Date.now() }];
    }

    if (data.activeHeroId) {
      GameState.activeHeroId = data.activeHeroId;
    } else if (GameState.heroes.length > 0) {
      GameState.activeHeroId = GameState.heroes[0].id;
    }

    if (data.autoUpgrade) Object.assign(GameState.autoUpgrade, data.autoUpgrade);
    if (data.autoFusion) Object.assign(GameState.autoFusion, data.autoFusion);

    if (data.gacha) Object.assign(GameState.gacha, data.gacha);
    if (data.combat) Object.assign(GameState.combat, data.combat);
    if (data.dungeon) {
      if (typeof data.dungeon.abyssFloor === 'number') GameState.dungeon.abyssFloor = data.dungeon.abyssFloor;
      if (typeof data.dungeon.towerHighestFloor === 'number') GameState.dungeon.towerHighestFloor = data.dungeon.towerHighestFloor;
      if (data.dungeon.dailyRuns) Object.assign(GameState.dungeon.dailyRuns, data.dungeon.dailyRuns);
    }
    if (GameState.boss) GameState.boss.active = false;

    if (data.settings) {
      GameState.settings = Object.assign({ vfxEnabled: true }, data.settings);
    } else if (!GameState.settings) {
      GameState.settings = { vfxEnabled: true };
    }

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
    if (!confirm('⚠️ Bạn có chắc muốn XÓA DỮ LIỆU CỦA HỒ SƠ NÀY?')) return false;
    const activeSlot = this.getActiveSlotId();
    localStorage.removeItem(this.getSlotStorageKey(activeSlot));
    const meta = this.getProfilesMeta();
    const slot = meta.slots.find(s => s.id === activeSlot);
    if (slot) {
      slot.isEmpty = true;
      slot.level = 0;
      this.saveProfilesMeta(meta);
    }
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
