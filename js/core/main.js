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

  UI.init();
  Monster.spawn();
  Combat.start();
  SaveManager.startAutoSave();
  startUILoop();
  UI.updateAll();
}

let _uiLoopTimer = null;
function startUILoop() {
  _uiLoopTimer = setInterval(() => {
    UI.updateStatusBar();
    if (UI._currentTab === 'battle') {
      UI.updateBattleStatsOnly();
    } else if (UI._currentTab === 'gacha') {
      UI.updateGacha();
    } else if (UI._currentTab === 'upgrades') {
      UI.updateUpgrades();
    } else if (UI._currentTab === 'boss') {
      UI.updateBossChamber();
    }
  }, 250);
}

document.addEventListener('DOMContentLoaded', initGame);

// Lệnh debug cho console F12
window.debug = {
  addGold: (amount) => { GameState.player.gold += amount; UI.updateAll(); },
  addDiamond: (amount) => { GameState.player.diamond += amount; UI.updateAll(); },
  addKeys: (amount = 5) => { Player.gainBossKeys(amount); UI.updateAll(); },
  addStones: (amount = 5) => { Player.gainProtectionStones(amount); UI.updateAll(); },
  addExp: (amount) => { Player.gainExp(amount); UI.updateAll(); },
  setLevel: (level) => { GameState.player.level = level; UI.updateAll(); },
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
  save: () => { SaveManager.save(); console.log('Saved!'); },
  reset: () => SaveManager.reset()
};
