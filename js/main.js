// ============================================================
// main.js — Entry Point & Game Initialization
// ============================================================

// GameState is declared in config.js (loaded first)

// --- Initialize Game ---
function initGame() {
  console.log('🎮 Idle RPG v2 — Initializing Turn-Based System...');

  // 1. Create default player
  GameState.player = Player.createDefault();

  // 2. Try to load saved data
  const savedData = SaveManager.load();

  if (savedData) {
    console.log('📂 Save data found, loading...');
    SaveManager.applyLoadedData(savedData);

    // 3. Calculate offline progress
    const offlineProgress = SaveManager.calculateOfflineProgress(savedData.timestamp);

    if (offlineProgress) {
      console.log(`⏰ Offline: ${offlineProgress.seconds}s → ${offlineProgress.kills} kills, ${offlineProgress.gold} gold, ${offlineProgress.exp} exp`);
      SaveManager.applyOfflineRewards(offlineProgress);

      setTimeout(() => {
        UI.showOfflinePopup(offlineProgress);
      }, 500);
    }
  } else {
    console.log('🆕 No save data, starting fresh adventure!');
  }

  // 4. Initialize UI
  UI.init();

  // 5. Spawn first monster & start turn-based combat
  Monster.spawn();
  Combat.start();

  // 6. Start auto-save
  SaveManager.startAutoSave();

  // 7. Start UI update loop
  startUILoop();

  // 8. Update all UI
  UI.updateAll();

  console.log('✅ Game initialized successfully!');
}

// --- UI Update Loop ---
let _uiLoopTimer = null;

function startUILoop() {
  _uiLoopTimer = setInterval(() => {
    UI.updateStatusBar();

    // Dynamically refresh current active tab so buttons become clickable immediately when gold is farmed
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

// --- Start the game when DOM is ready ---
document.addEventListener('DOMContentLoaded', initGame);

// --- Debug helpers (accessible from F12 Console) ---
window.debug = {
  addGold(amount)         { GameState.player.gold += amount; UI.updateAll(); },
  addDiamond(amount)      { GameState.player.diamond += amount; UI.updateAll(); },
  addKeys(amount)         { Player.gainBossKeys(amount || 5); UI.updateAll(); },
  addStones(amount)       { Player.gainProtectionStones(amount || 5); UI.updateAll(); },
  addExp(amount)          { Player.gainExp(amount); UI.updateAll(); },
  setLevel(level)         { GameState.player.level = level; UI.updateAll(); },
  giveUnknownWeapon()     {
    const pool = CONFIG.getItemsByRarity('unknown');
    if (pool.length) Inventory.addItem(pool[0]);
    UI.updateInventory();
    UI.showToast('🎁 Đã nhận Trang bị ??? Vô Cực!');
  },
  giveMythicItem()        {
    const pool = CONFIG.getItemsByRarity('mythic');
    if (pool.length) Inventory.addItem(pool[0]);
    UI.updateInventory();
    UI.showToast('🎁 Đã nhận Trang bị Thần Thoại!');
  },
  getState()              { return JSON.parse(JSON.stringify(GameState)); },
  save()                  { SaveManager.save(); console.log('Saved!'); },
  reset()                 { SaveManager.reset(); }
};
