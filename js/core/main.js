function initGame() {
  GameState.player = Player.createDefault();

  const savedData = SaveManager.load();
  if (savedData) {
    SaveManager.applyLoadedData(savedData);
    const offlineProgress = SaveManager.calculateOfflineProgress(savedData.timestamp);
    if (offlineProgress) {
      SaveManager.applyOfflineRewards(offlineProgress);
      setTimeout(() => UI.showOfflinePopup(offlineProgress), 500);
    }
  }

  // Khởi tạo các giá trị mặc định cho Anh Hùng và Ải nếu chưa có
  if (!GameState.heroes || GameState.heroes.length === 0) {
    GameState.heroes = [{ id: 'hero_starter', constellation: 0, level: 1, skillLevels: { s1: 1, s2: 1, s3: 1 }, unlockedAt: Date.now() }];
  }
  if (!GameState.activeHeroId) {
    GameState.activeHeroId = 'hero_starter';
  }
  if (!GameState.stage) {
    GameState.stage = { current: 1, max: 1, autoAdvance: true };
  }
  if (!GameState.dungeon) {
    GameState.dungeon = { active: false, dungeonId: null, wave: 1, maxWaves: 5, abyssFloor: 1, dailyRuns: { gold: 3, exp: 3, rune: 3 } };
  }
  if (!GameState.autoGacha) {
    GameState.autoGacha = { enabled: false, stopAtRarity: 'chaos', batchSize: 10 };
  }
  if (!GameState.settings) {
    GameState.settings = { vfxEnabled: true };
  }
  if (GameState.player && (GameState.player.currentHp <= 0 || !GameState.player.currentHp)) {
    Player.revive();
  }

  UI.init();
  Monster.spawn();
  Combat.start();
  SaveManager.startAutoSave();
  startUILoop();
  UI.updateAll();

  // Khởi động Hệ Thống Bảo Mật 4 Lớp, Kiểm Tra Cập Nhật, Bảng Xếp Hạng & Admin Logs
  if (typeof AntiCheat !== 'undefined') AntiCheat.init();
  if (typeof Updater !== 'undefined') Updater.init();
  if (typeof Leaderboard !== 'undefined') Leaderboard.init();
  if (typeof FriendAdmin !== 'undefined') FriendAdmin.init();
}

let _uiLoopTimer = null;
let _autoTickCounter = 0;

function startUILoop() {
  _uiLoopTimer = setInterval(() => {
    UI.updateStatusBar();
    _autoTickCounter++;

    // Tự động nâng cấp stat & Kỹ năng anh hùng khi được bật (kiểm tra mỗi 500ms)
    if (_autoTickCounter % 2 === 0) {
      runAutoUpgrade();
      if (typeof UI !== 'undefined' && UI.runAutoHeroSkillUpgrade) {
        UI.runAutoHeroSkillUpgrade();
      }
    }

    // Tự động dung hợp khi được bật (kiểm tra mỗi 1000ms)
    if (_autoTickCounter % 4 === 0) {
      runAutoFusion();
    }

    // Tự động gacha khi được bật (kiểm tra mỗi 750ms)
    if (_autoTickCounter % 3 === 0) {
      if (typeof Gacha !== 'undefined' && Gacha.runAutoGacha) {
        Gacha.runAutoGacha();
      }
    }

    // Tự động đồng bộ trạng thái Online lên Bảng Xếp Hạng mỗi 30 giây (120 ticks * 250ms)
    if (_autoTickCounter % 120 === 0) {
      if (typeof Leaderboard !== 'undefined' && Leaderboard.syncCurrentPlayer) {
        Leaderboard.syncCurrentPlayer();
      }
    }

    if (UI._currentTab === 'battle') {
      UI.updateBattleStatsOnly();
      UI.updateSkillCooldowns();
      UI.updateStageDisplay();
    } else if (UI._currentTab === 'heroes') {
      UI.updateHeroesTab();
    } else if (UI._currentTab === 'gacha') {
      UI.updateGacha();
    } else if (UI._currentTab === 'upgrades') {
      UI.updateUpgrades();
    } else if (UI._currentTab === 'boss') {
      UI.updateBossChamber();
    } else if (UI._currentTab === 'dungeon') {
      UI.updateDungeonTab();
    }
  }, 250);
}

function runAutoUpgrade() {
  if (!GameState.autoUpgrade?.enabled) return;
  const selected = GameState.autoUpgrade.selected || {};
  let upgradedAny = false;

  for (const type in selected) {
    if (selected[type] && Upgrades.canAfford(type)) {
      if (Upgrades.upgrade(type)) {
        upgradedAny = true;
      }
    }
  }

  if (upgradedAny) {
    UI.updateBattleStatsOnly();
    if (UI._currentTab === 'upgrades') UI.updateUpgrades();
    UI.updateStatusBar();
  }
}

function runAutoFusion() {
  if (!GameState.autoFusion?.enabled) return;
  const rarities = GameState.autoFusion.rarities || {};
  let fusedAny = false;

  for (const r in rarities) {
    if (rarities[r]) {
      const items = Inventory.getItemsByRarity(r);
      if (items.length >= CONFIG.FUSION_COUNT) {
        const res = Forge.quickCombine(r);
        if (res.success && res.totalGroups > 0) {
          fusedAny = true;
        }
      }
    }
  }

  if (fusedAny) {
    UI.updateInventory();
    if (UI._currentTab === 'forge') UI.updateForge();
    UI.updateStatusBar();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Lệnh debug cho console F12
window.debug = {
  addGold: (amount) => { GameState.player.gold += amount; UI.updateAll(); },
  addDiamond: (amount) => { GameState.player.diamond += amount; UI.updateAll(); },
  addKeys: (amount = 5) => { Player.gainBossKeys(amount); UI.updateAll(); },
  addStones: (amount = 5) => { Player.gainProtectionStones(amount); UI.updateAll(); },
  addExp: (amount) => { Player.gainExp(amount); UI.updateAll(); },
  setLevel: (level) => { GameState.player.level = level; UI.updateAll(); },
  setStage: (stage) => { Combat.setStage(stage); },
  giveHero: (heroId) => {
    const heroCfg = CONFIG.getHeroById(heroId);
    Gacha._addOrUpgradeHero(heroCfg);
    UI.updateAll();
    UI.showToast(`🎁 Đã mở khóa/nâng cấp ${heroCfg.name}!`);
  },
  unlockAllHeroes: () => {
    CONFIG.HEROES_LIST.forEach(h => Gacha._addOrUpgradeHero(h));
    UI.updateAll();
    UI.showToast('🎁 Đã mở khóa toàn bộ dàn Anh Hùng!');
  },
  giveUnknownWeapon: () => {
    const pool = CONFIG.getItemsByRarity('unknown');
    if (pool.length) Inventory.addItem(pool[0]);
    UI.updateInventory();
    UI.showToast('🎁 Đã nhận Trang bị ??? Vô Cực!');
  },
  giveMythicItem: () => {
    const pool = CONFIG.getItemsByRarity('mythic');
    if (pool.length) Inventory.addItem(pool[0]);
    UI.updateInventory();
    UI.showToast('🎁 Đã nhận Trang bị Thần Thoại!');
  },
  getState: () => JSON.parse(JSON.stringify(GameState)),
  resetHeroes: () => { if (typeof UI !== 'undefined') UI.resetHeroesDebug(); },
  save: () => { SaveManager.save(); console.log('Saved!'); },
  reset: () => SaveManager.reset()
};
