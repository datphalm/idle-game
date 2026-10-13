const UI = {
  _currentTab: 'battle',
  _selectedItemId: null,
  _enhanceTargetId: null,
  _fusionSelectedIds: [],
  _combatLogLines: [],
  _maxLogLines: 35,
  _bossListRendered: false,

  init() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Forge sub-tabs
    document.getElementById('btn-sub-enhance')?.addEventListener('click', () => this.switchForgeSub('enhance'));
    document.getElementById('btn-sub-fusion')?.addEventListener('click', () => this.switchForgeSub('fusion'));
    document.getElementById('btn-do-enhance')?.addEventListener('click', () => this._handleEnhanceAction());
    document.getElementById('btn-do-fusion')?.addEventListener('click', () => this._handleFusionAction());

    document.querySelectorAll('.btn-quick-combine').forEach(btn => {
      btn.addEventListener('click', () => this._handleQuickCombine(btn.dataset.rarity));
    });

    // Stage navigation
    document.getElementById('btn-stage-prev')?.addEventListener('click', () => this._handleStagePrev());
    document.getElementById('btn-stage-next')?.addEventListener('click', () => this._handleStageNext());
    document.getElementById('chk-auto-stage')?.addEventListener('change', (e) => {
      if (GameState.stage) GameState.stage.autoAdvance = e.target.checked;
    });

    // Expand Inventory
    document.getElementById('btn-expand-inv')?.addEventListener('click', () => this._handleExpandInventory());

    // Auto Fusion controls
    document.getElementById('chk-auto-fusion')?.addEventListener('change', (e) => {
      if (GameState.autoFusion) GameState.autoFusion.enabled = e.target.checked;
    });
    ['common', 'rare', 'epic', 'legendary'].forEach(r => {
      document.getElementById(`chk-fuse-${r}`)?.addEventListener('change', (e) => {
        if (!GameState.autoFusion) GameState.autoFusion = { enabled: false, rarities: {} };
        GameState.autoFusion.rarities[r] = e.target.checked;
      });
    });

    // Auto Upgrade controls
    document.getElementById('chk-auto-upgrade')?.addEventListener('change', (e) => {
      if (GameState.autoUpgrade) GameState.autoUpgrade.enabled = e.target.checked;
    });
    ['attack', 'maxHp', 'defense', 'speed', 'goldRate', 'hpRegen'].forEach(s => {
      document.getElementById(`chk-up-${s}`)?.addEventListener('change', (e) => {
        if (!GameState.autoUpgrade) GameState.autoUpgrade = { enabled: false, selected: {} };
        GameState.autoUpgrade.selected[s] = e.target.checked;
      });
    });

    // Boss actions
    document.getElementById('btn-buy-boss-key')?.addEventListener('click', () => {
      const res = Boss.buyKey();
      this.showToast(res.success ? '🗝️ Đã mua 1 Chìa Khóa Boss!' : '💰 Không đủ Vàng mua Chìa Khóa!');
      this.updateStatusBar();
      this._bossListRendered = false;
      this.updateBossChamber();
    });

    document.getElementById('btn-forfeit-boss')?.addEventListener('click', () => Boss.forfeit());

    // Dungeon Forfeit
    document.getElementById('btn-forfeit-dungeon')?.addEventListener('click', () => {
      if (typeof Dungeon !== 'undefined') Dungeon.forfeit(true);
    });

    // Dedicated Dungeon Room & Tower Controls
    document.getElementById('btn-leave-dungeon-room')?.addEventListener('click', () => {
      if (typeof Dungeon !== 'undefined') Dungeon.forfeitRoom(true);
    });
    document.getElementById('btn-back-to-dungeons')?.addEventListener('click', () => {
      if (typeof Dungeon !== 'undefined') Dungeon.forfeitTower(true);
      document.getElementById('tower-view')?.classList.add('hidden');
      document.getElementById('dungeon-selection-view')?.classList.remove('hidden');
    });
    document.getElementById('btn-start-tower-fight')?.addEventListener('click', () => {
      if (typeof Dungeon !== 'undefined') {
        Dungeon.startTowerFloor(GameState.dungeon?.abyssFloor || 1);
      }
    });
    document.getElementById('btn-forfeit-tower')?.addEventListener('click', () => {
      if (typeof Dungeon !== 'undefined') Dungeon.forfeitTower(true);
    });
    document.getElementById('chk-tower-auto-climb')?.addEventListener('change', (e) => {
      if (GameState.dungeon) GameState.dungeon.autoClimb = e.target.checked;
    });

    // Gacha Banner Switcher
    document.getElementById('btn-banner-weapon')?.addEventListener('click', () => this._switchGachaBanner('weapon'));
    document.getElementById('btn-banner-hero')?.addEventListener('click', () => this._switchGachaBanner('hero'));

    // Gacha Pull Buttons (x1, x10, x100, x1000)
    document.getElementById('btn-gacha-1')?.addEventListener('click', () => this._handleGachaPull(1));
    document.getElementById('btn-gacha-10')?.addEventListener('click', () => this._handleGachaPull(10));
    document.getElementById('btn-gacha-100')?.addEventListener('click', () => this._handleGachaPull(100));
    document.getElementById('btn-gacha-1000')?.addEventListener('click', () => this._handleGachaPull(1000));

    // Quick Sell by Rarity
    document.getElementById('btn-quick-sell-rarity')?.addEventListener('click', () => {
      const sel = document.getElementById('sel-quick-sell-rarity');
      const val = sel ? sel.value : 'common,rare';
      const rarities = val.split(',').map(s => s.trim()).filter(Boolean);
      const res = Inventory.sellAllByRarities(rarities);
      if (res.count > 0) {
        this.showToast(`💰 Đã bán nhanh ${res.count} trang bị, thu về +${this._formatNumber(res.totalGold)} Vàng!`);
      } else {
        this.showToast('🎒 Không có trang bị nào thuộc phẩm chất này để bán!');
      }
      this.updateInventory();
      this.updateStatusBar();
      this.updateForge();
    });

    // Auto Gacha Controls
    document.getElementById('chk-auto-gacha')?.addEventListener('change', (e) => {
      if (!GameState.autoGacha) GameState.autoGacha = { enabled: false, stopAtRarity: 'chaos', batchSize: 10 };
      GameState.autoGacha.enabled = e.target.checked;
      this._syncAutoGachaControls();
      this.updateGacha();
    });
    document.getElementById('sel-auto-gacha-stop')?.addEventListener('change', (e) => {
      if (!GameState.autoGacha) GameState.autoGacha = { enabled: false, stopAtRarity: 'chaos', batchSize: 10 };
      GameState.autoGacha.stopAtRarity = e.target.value;
      GameState.autoGacha.stopOnRarity = e.target.value;
    });
    document.getElementById('sel-auto-gacha-batch')?.addEventListener('change', (e) => {
      if (!GameState.autoGacha) GameState.autoGacha = { enabled: false, stopAtRarity: 'chaos', batchSize: 10 };
      const bSize = parseInt(e.target.value, 10) || 10;
      GameState.autoGacha.batchSize = bSize;
      GameState.autoGacha.tier = bSize;
    });

    // Auto Hero Skill Upgrade
    document.getElementById('chk-auto-hero-skill')?.addEventListener('change', (e) => {
      GameState.autoHeroSkill = e.target.checked;
    });

    // Reset Heroes E0 Debug Button
    document.getElementById('btn-reset-heroes-debug')?.addEventListener('click', () => {
      this.resetHeroesDebug();
    });

    // Inventory sort
    document.getElementById('btn-sort-inv').addEventListener('click', () => {
      Inventory.sort();
      this.updateInventory();
      this.updateForge();
    });

    // Item detail modal actions
    document.getElementById('btn-close-detail').addEventListener('click', () => this._closeItemDetail());
    document.getElementById('btn-equip-item').addEventListener('click', () => this._handleEquipItem());
    document.getElementById('btn-sell-item').addEventListener('click', () => this._handleSellItem());
    document.getElementById('btn-to-forge-item')?.addEventListener('click', () => {
      const id = this._selectedItemId;
      this._closeItemDetail();
      this.switchTab('forge');
      this.switchForgeSub('enhance');
      this.selectEnhanceItem(id);
    });

    // Equipment slot click unequip
    document.querySelectorAll('.equip-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const slotType = slot.dataset.slot;
        if (GameState.player.equipment[slotType]) {
          if (Inventory.unequipItem(slotType)) {
            this.updateInventory();
            this.updateBattle();
            this.showToast('Đã tháo trang bị!');
          } else {
            this.showToast('🎒 Kho đồ đã đầy, không thể tháo!');
          }
        }
      });
    });

    // Universal popup close buttons [✕]
    document.querySelectorAll('.popup-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const popup = e.target.closest('.popup-overlay');
        if (popup) popup.classList.add('hidden');
      });
    });

    // Click outside to close popups
    document.querySelectorAll('.popup-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
        }
      });
    });

    // ESC key to close popups
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.popup-overlay:not(.hidden)').forEach(p => p.classList.add('hidden'));
      }
    });

    // Popups OK buttons
    document.getElementById('btn-offline-ok').addEventListener('click', () => {
      document.getElementById('offline-popup').classList.add('hidden');
    });
    document.getElementById('btn-gacha-ok').addEventListener('click', () => {
      document.getElementById('gacha-result-popup').classList.add('hidden');
    });
    document.getElementById('btn-boss-victory-ok')?.addEventListener('click', () => {
      document.getElementById('boss-victory-popup').classList.add('hidden');
    });
    document.getElementById('btn-dungeon-victory-ok')?.addEventListener('click', () => {
      document.getElementById('dungeon-victory-popup')?.classList.add('hidden');
    });
    document.getElementById('btn-close-dungeon-victory-popup')?.addEventListener('click', () => {
      document.getElementById('dungeon-victory-popup')?.classList.add('hidden');
    });
    document.getElementById('btn-forge-result-ok')?.addEventListener('click', () => {
      document.getElementById('forge-result-popup').classList.add('hidden');
    });

    // Save, reset, profiles and update
    document.getElementById('btn-save').addEventListener('click', () => {
      SaveManager.save();
      this.showToast('💾 Đã lưu tiến trình!');
    });
    document.getElementById('btn-reset').addEventListener('click', () => SaveManager.reset());

    document.getElementById('btn-profiles')?.addEventListener('click', () => {
      this.openProfilesModal();
    });
    document.getElementById('btn-close-profile-modal')?.addEventListener('click', () => {
      document.getElementById('profile-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-close-profile-btn')?.addEventListener('click', () => {
      document.getElementById('profile-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-check-update')?.addEventListener('click', () => {
      if (typeof Updater !== 'undefined') Updater.checkForUpdates(false);
    });
    document.getElementById('btn-export-profile')?.addEventListener('click', () => {
      this.handleExportProfile();
    });
    document.getElementById('btn-import-profile')?.addEventListener('click', () => {
      this.handleImportProfile();
    });

    // Global Leaderboard modal
    document.getElementById('btn-leaderboard')?.addEventListener('click', () => {
      if (typeof Leaderboard !== 'undefined') Leaderboard.openModal();
    });
    document.getElementById('btn-close-leaderboard-modal')?.addEventListener('click', () => {
      document.getElementById('leaderboard-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-close-lb-btn')?.addEventListener('click', () => {
      document.getElementById('leaderboard-modal')?.classList.add('hidden');
    });

    // Friend Admin & Logs modal
    document.getElementById('btn-admin-logs')?.addEventListener('click', () => {
      if (typeof FriendAdmin !== 'undefined') FriendAdmin.openAdminModal();
    });
    document.getElementById('btn-close-admin-modal')?.addEventListener('click', () => {
      document.getElementById('admin-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-close-admin-btn')?.addEventListener('click', () => {
      document.getElementById('admin-modal')?.classList.add('hidden');
    });

    // Toggle Hiệu Ứng (VFX Toggle)
    document.getElementById('btn-toggle-vfx')?.addEventListener('click', () => {
      this.toggleVfx();
    });
    document.getElementById('chk-toggle-vfx')?.addEventListener('change', (e) => {
      this.toggleVfx(e.target.checked);
    });

    this._renderUpgradeCards();
    this._syncAutoControls();
    this.updateVfxToggleDisplay();
    this._startSkillCooldownTicker();
  },

  _startSkillCooldownTicker() {
    if (this._skillTickerInterval) clearInterval(this._skillTickerInterval);
    this._skillTickerInterval = setInterval(() => {
      this.updateSkillCooldowns();
    }, 60);
  },

  _syncAutoGachaControls() {
    const chk = document.getElementById('chk-auto-gacha');
    if (chk && GameState.autoGacha) {
      chk.checked = !!GameState.autoGacha.enabled;
    }
    const badge = document.getElementById('auto-gacha-status');
    if (badge) {
      const on = GameState.autoGacha?.enabled;
      badge.textContent = on ? 'Đang tự quay...' : 'Đang tắt';
      badge.style.color = on ? '#00e5ff' : '#aaa';
    }
    const selStop = document.getElementById('sel-auto-gacha-stop');
    if (selStop && (GameState.autoGacha?.stopAtRarity || GameState.autoGacha?.stopOnRarity)) {
      selStop.value = GameState.autoGacha.stopAtRarity || GameState.autoGacha.stopOnRarity;
    }
    const selBatch = document.getElementById('sel-auto-gacha-batch');
    if (selBatch && (GameState.autoGacha?.batchSize || GameState.autoGacha?.tier)) {
      selBatch.value = String(GameState.autoGacha.batchSize || GameState.autoGacha.tier);
    }
  },

  toggleVfx(forceState = null) {
    if (!GameState.settings) GameState.settings = { vfxEnabled: true };
    if (forceState !== null) {
      GameState.settings.vfxEnabled = !!forceState;
    } else {
      GameState.settings.vfxEnabled = !GameState.settings.vfxEnabled;
    }
    this.updateVfxToggleDisplay();
    SaveManager.save();
    this.showToast(GameState.settings.vfxEnabled ? '✨ Đã BẬT hiệu ứng kỹ năng & nộ 3D!' : '💤 Đã TẮT hiệu ứng (Chế độ mượt mà & siêu nhẹ máy)');
  },

  updateVfxToggleDisplay() {
    const isEnabled = GameState.settings ? GameState.settings.vfxEnabled !== false : true;
    const btn = document.getElementById('btn-toggle-vfx');
    if (btn) {
      btn.textContent = isEnabled ? '✨ FX: BẬT' : '💤 FX: TẮT';
      btn.style.background = isEnabled ? 'rgba(236,72,153,0.25)' : 'rgba(100,116,139,0.25)';
      btn.style.borderColor = isEnabled ? '#ec4899' : '#64748b';
      btn.style.color = isEnabled ? '#f472b6' : '#94a3b8';
    }
    const chk = document.getElementById('chk-toggle-vfx');
    if (chk) {
      chk.checked = isEnabled;
    }
  },

  switchTab(tabName) {
    this._currentTab = tabName;
    GameState.currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${tabName}`));
    this.updateTabContent(tabName);
  },

  isBattleViewActive() {
    const tab = this._currentTab || GameState.currentTab || 'battle';
    if (tab === 'battle') return true;
    if (tab === 'boss' && GameState.boss?.active) return true;
    if (tab === 'dungeon' && GameState.dungeon?.active) return true;
    return false;
  },

  switchForgeSub(subName) {
    document.getElementById('btn-sub-enhance').classList.toggle('active', subName === 'enhance');
    document.getElementById('btn-sub-fusion').classList.toggle('active', subName === 'fusion');
    document.getElementById('forge-sub-enhance').classList.toggle('active', subName === 'enhance');
    document.getElementById('forge-sub-fusion').classList.toggle('active', subName === 'fusion');
    this.updateForge();
  },

  updateAll() {
    this.updateStatusBar();
    this.updateVfxToggleDisplay();
    this.updateTabContent(this._currentTab);
  },

  updateTabContent(tabName) {
    switch (tabName) {
      case 'battle':    this.updateBattle(); break;
      case 'heroes':    this.updateHeroesTab(); break;
      case 'boss':      this.updateBossChamber(); break;
      case 'dungeon':   this.updateDungeonTab(); break;
      case 'inventory': this.updateInventory(); break;
      case 'forge':     this.updateForge(); break;
      case 'upgrades':  this.updateUpgrades(); break;
      case 'gacha':     this.updateGacha(); break;
    }
  },

  updateStatusBar() {
    if (!GameState.player) return;
    const p = GameState.player;

    document.getElementById('status-level').textContent = `Lv. ${p.level}`;
    document.getElementById('status-gold').textContent = this._formatNumber(p.gold);
    document.getElementById('status-diamond').textContent = this._formatNumber(p.diamond);
    document.getElementById('status-keys').textContent = p.bossKeys || 0;
    document.getElementById('status-stones').textContent = p.protectionStones || 0;

    const needed = Player.getExpNeeded();
    const progress = Player.getExpProgress();
    document.getElementById('exp-fill').style.width = `${progress * 100}%`;
    document.getElementById('exp-text').textContent = `${this._formatNumber(p.exp)} / ${this._formatNumber(needed)}`;
  },

  updateBattle() {
    this.updateStageDisplay();
    this.updateSkillCooldowns();
    this.updateBattleStatsOnly();
    this.updatePlayerDisplay();
    this.updateMonsterDisplay();
    this.updateDungeonArena();
    document.getElementById('kill-count').textContent = this._formatNumber(GameState.combat.monstersKilled);
  },

  updateStageDisplay() {
    if (!GameState.stage) GameState.stage = { current: 1, max: 1, autoAdvance: true };
    const currEl = document.getElementById('battle-stage-curr');
    const maxEl = document.getElementById('battle-stage-max');
    if (currEl) currEl.textContent = GameState.stage.current;
    if (maxEl) maxEl.textContent = GameState.stage.max;

    const btnPrev = document.getElementById('btn-stage-prev');
    const btnNext = document.getElementById('btn-stage-next');
    if (btnPrev) btnPrev.disabled = GameState.stage.current <= 1;
    if (btnNext) btnNext.disabled = GameState.stage.current >= GameState.stage.max;

    const chkAuto = document.getElementById('chk-auto-stage');
    if (chkAuto) chkAuto.checked = !!GameState.stage.autoAdvance;
  },

  _handleStagePrev() {
    if (!GameState.stage || GameState.stage.current <= 1) return;
    Combat.setStage(GameState.stage.current - 1);
  },

  _handleStageNext() {
    if (!GameState.stage || GameState.stage.current >= GameState.stage.max) return;
    Combat.setStage(GameState.stage.current + 1);
  },

  updateSkillCooldowns() {
    const heroCfg = CONFIG.getHeroById(GameState.activeHeroId);
    if (!heroCfg) return;
    const progress = Player.getSkillCooldownProgress();

    const prefixes = ['hud', 'boss-hud', 'dungeon-hud', 'tower-hud'];
    prefixes.forEach(pfx => {
      const s2IconEl = document.getElementById(`${pfx}-s2-icon`);
      const s3IconEl = document.getElementById(`${pfx}-s3-icon`);
      if (s2IconEl && heroCfg.skills?.[1]) s2IconEl.textContent = heroCfg.skills[1].icon;
      if (s3IconEl && heroCfg.skills?.[2]) s3IconEl.textContent = heroCfg.skills[2].icon;

      const s2Fill = document.getElementById(`${pfx}-s2-fill`);
      const s2Timer = document.getElementById(`${pfx}-s2-timer`);
      if (s2Fill) s2Fill.style.height = `${100 - progress.s2.pct}%`;
      if (s2Timer) {
        if (progress.s2.ready) {
          s2Timer.textContent = 'Sẵn sàng';
          s2Timer.className = 'skill-hud-timer skill-ready';
        } else {
          s2Timer.textContent = `${progress.s2.remainingSec}s`;
          s2Timer.className = 'skill-hud-timer';
        }
      }

      const s3Fill = document.getElementById(`${pfx}-s3-fill`);
      const s3Timer = document.getElementById(`${pfx}-s3-timer`);
      if (s3Fill) s3Fill.style.height = `${100 - progress.s3.pct}%`;
      if (s3Timer) {
        if (progress.s3.ready) {
          s3Timer.textContent = 'Sẵn sàng';
          s3Timer.className = 'skill-hud-timer skill-ready';
        } else {
          s3Timer.textContent = `${progress.s3.remainingSec}s`;
          s3Timer.className = 'skill-hud-timer';
        }
      }
    });
  },

  _handleExpandInventory() {
    const res = Inventory.expand();
    if (res.success) {
      this.showToast(`🎒 Đã mở rộng túi đồ lên ${res.newMax} ô! (-${this._formatNumber(res.cost)} 💰)`);
      this.updateInventory();
      this.updateStatusBar();
    } else if (res.error === 'not_enough_gold') {
      this.showToast(`💰 Cần ${this._formatNumber(res.cost)} Vàng để mở rộng thêm 5 ô!`);
    } else if (res.error === 'limit_reached') {
      this.showToast('🎒 Đã đạt giới hạn tối đa 500 ô đồ!');
    }
  },

  _syncAutoControls() {
    const autoU = GameState.autoUpgrade;
    if (autoU) {
      const chkU = document.getElementById('chk-auto-upgrade');
      if (chkU) chkU.checked = !!autoU.enabled;
      for (const s in autoU.selected) {
        const el = document.getElementById(`chk-up-${s}`);
        if (el) el.checked = !!autoU.selected[s];
      }
    }
    const autoF = GameState.autoFusion;
    if (autoF) {
      const chkF = document.getElementById('chk-auto-fusion');
      if (chkF) chkF.checked = !!autoF.enabled;
      for (const r in autoF.rarities) {
        const el = document.getElementById(`chk-fuse-${r}`);
        if (el) el.checked = !!autoF.rarities[r];
      }
    }
  },

  updatePlayerDisplay(action = 'idle') {
    const el = document.getElementById('player-sprite');
    if (!el) return;
    const heroCfg = CONFIG.getHeroById(GameState.activeHeroId);
    const nameEl = document.getElementById('player-battle-name');
    if (nameEl && heroCfg) {
      nameEl.textContent = heroCfg.name;
      nameEl.style.color = heroCfg.elementColor || '#fff';
    }
    if (typeof Sprites !== 'undefined') {
      el.innerHTML = Sprites.getPlayerSvg(action, GameState.activeHeroId);
      if (action === 'idle') el.className = 'fighter-avatar player-idle';
    }
  },

  updateBattleStatsOnly() {
    if (!GameState.player) return;
    const p = GameState.player;
    const pMaxHp = Player.getEffectiveMaxHp();
    const curHp = Math.max(0, p.currentHp);

    document.getElementById('player-battle-level').textContent = `Lv. ${p.level}`;
    document.getElementById('player-hp-fill').style.width = `${Player.getHpPercent()}%`;
    document.getElementById('player-hp-text').textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(pMaxHp)}`;

    document.getElementById('stat-hp').textContent = this._formatNumber(pMaxHp);
    document.getElementById('stat-attack').textContent = this._formatNumber(Player.getEffectiveAttack());
    document.getElementById('stat-defense').textContent = this._formatNumber(Player.getEffectiveDefense());
    document.getElementById('stat-speed').textContent = Player.getEffectiveSpeed();
    document.getElementById('stat-regen').textContent = `+${Player.getEffectiveHpRegen()} HP`;

    const mSpeed = Monster.current?.speed || 10;
    document.getElementById('stat-extra-turn').textContent = `${(Player.getExtraTurnChance(mSpeed) * 100).toFixed(0)}%`;
    document.getElementById('stat-gold-rate').textContent = `x${Player.getEffectiveGoldRate().toFixed(2)}`;
    document.getElementById('stat-exp-needed').textContent = this._formatNumber(Player.getExpNeeded());
  },

  updateMonsterDisplay() {
    const m = (GameState.dungeon?.active && typeof Dungeon !== 'undefined' && Dungeon.currentMonster)
      ? Dungeon.currentMonster
      : Monster.current;
    if (!m) return;

    document.getElementById('monster-name').textContent = m.name;
    document.getElementById('monster-level').textContent = `Lv. ${m.level}`;
    const mSprite = document.getElementById('monster-sprite');
    if (mSprite) {
      if (typeof Sprites !== 'undefined') {
        mSprite.innerHTML = Sprites.getMonsterSvg(m.name);
        mSprite.className = 'fighter-avatar monster-idle';
      } else {
        mSprite.textContent = m.emoji;
      }
    }

    const maxHp = m.maxHp || m.hp || 1;
    const curHp = Math.max(0, m.hp);
    const hpPct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
    const mFill = document.getElementById('monster-hp-fill');
    if (mFill) mFill.style.width = `${hpPct}%`;
    const mText = document.getElementById('monster-hp-text');
    if (mText) mText.textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(maxHp)}`;
  },

  showDamageNumber(amount, isCrit, target) {
    let id = 'monster-damage-container';
    if (target === 'player') {
      if (GameState.boss?.active) id = 'boss-player-damage-container';
      else if (GameState.dungeon?.active && GameState.dungeon.subMode === 'tower') id = 'tower-player-damage-container';
      else if (GameState.dungeon?.active) id = 'dungeon-player-damage-container';
      else id = 'player-damage-container';
    } else if (target === 'boss') {
      id = 'boss-damage-container';
    } else if (target === 'dungeon-monster') {
      id = 'dungeon-monster-damage-container';
    } else if (target === 'dungeon-player') {
      id = 'dungeon-player-damage-container';
    } else if (target === 'tower-enemy') {
      id = 'tower-enemy-damage-container';
    } else if (target === 'tower-player') {
      id = 'tower-player-damage-container';
    }
    const container = document.getElementById(id);
    if (!container) return;

    const isTargetPlayer = target === 'player' || target === 'dungeon-player' || target === 'tower-player';
    const el = document.createElement('div');
    el.className = `damage-number ${isTargetPlayer ? 'damage-player' : 'damage-monster'} ${isCrit ? 'damage-crit' : ''}`;
    el.textContent = `-${this._formatNumber(amount)}`;
    el.style.left = `calc(50% + ${Math.random() * 50 - 25}px)`;
    el.style.top = `${Math.random() * 15}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 850);
  },

  screenShake() {
    if (GameState.settings && GameState.settings.vfxEnabled === false) return;
    const el = document.body;
    el.classList.remove('screen-shake-intense');
    void el.offsetWidth;
    el.classList.add('screen-shake-intense');
    setTimeout(() => el.classList.remove('screen-shake-intense'), 400);
  },

  showExtraTurnIndicator() {
    const isBoss = GameState.boss?.active;
    const bannerId = isBoss ? 'boss-extra-turn-banner' : 'extra-turn-banner';
    const banner = document.getElementById(bannerId);
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 1200);
    }

    const pSpriteId = isBoss ? 'boss-player-sprite' : 'player-sprite';
    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      const activeHero = GameState.activeHeroId || 'hero_traveler';
      pSprite.innerHTML = Sprites.getPlayerSvg('extra');
      pSprite.className = `fighter-avatar player-extra-anim hero-extra-${activeHero}`;
      clearTimeout(this._playerAnimTimer);
      this._playerAnimTimer = setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 420);
    }
    const targetSlash = isBoss ? 'slash-fx-boss' : 'slash-fx-monster';
    this._triggerSlashFx(targetSlash, 'extra');
  },

  animatePlayerAttack(mode) {
    let pSpriteId = 'player-sprite';
    let targetSlash = 'slash-fx-monster';
    if (mode === 'dungeon') {
      pSpriteId = 'dungeon-player-sprite';
      targetSlash = 'dungeon-monster-slash-fx';
    } else if (mode === 'tower') {
      pSpriteId = 'tower-player-sprite';
      targetSlash = 'tower-enemy-slash-fx';
    } else if (GameState.boss?.active) {
      pSpriteId = 'boss-player-sprite';
      targetSlash = 'slash-fx-boss';
    }
    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      const activeHero = GameState.activeHeroId || 'hero_traveler';
      pSprite.innerHTML = Sprites.getPlayerSvg('attack');
      pSprite.className = `fighter-avatar player-attack-anim hero-attack-${activeHero}`;
      clearTimeout(this._playerAnimTimer);
      this._playerAnimTimer = setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 350);
    }
    this._triggerSlashFx(targetSlash, 'normal');
  },

  animatePlayerHit(mode) {
    let pSpriteId = 'player-sprite';
    if (mode === 'dungeon') pSpriteId = 'dungeon-player-sprite';
    else if (mode === 'tower') pSpriteId = 'tower-player-sprite';
    else if (GameState.boss?.active) pSpriteId = 'boss-player-sprite';

    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.innerHTML = Sprites.getPlayerSvg('hit');
      pSprite.className = 'fighter-avatar hit-flash';
      setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 250);
    } else {
      this._triggerAnim(pSpriteId, 'hit-flash');
    }
  },

  animateMonsterAttack(mode) {
    if (mode === 'dungeon') {
      this._triggerAnim('dungeon-monster-sprite', 'monster-attack-anim');
      this._triggerSlashFx('dungeon-player-slash-fx', 'normal');
    } else if (mode === 'tower') {
      this._triggerAnim('tower-enemy-sprite', 'monster-attack-anim');
      this._triggerSlashFx('tower-player-slash-fx', 'normal');
    } else {
      this._triggerAnim('monster-sprite', 'monster-attack-anim');
      this._triggerSlashFx('slash-fx-player', 'normal');
    }
  },

  animateMonsterHit(mode) {
    if (mode === 'dungeon') {
      this._triggerAnim('dungeon-monster-sprite', 'hit-flash');
    } else if (mode === 'tower') {
      this._triggerAnim('tower-enemy-sprite', 'hit-flash');
    } else {
      this._triggerAnim('monster-sprite', 'hit-flash');
    }
  },

  animateBossAttack() {
    this._triggerAnim('boss-active-sprite', 'monster-attack-anim');
    this._triggerSlashFx('boss-player-slash-fx', 'normal');
  },

  animateBossHit() {
    this._triggerAnim('boss-active-sprite', 'hit-flash');
    this._triggerSlashFx('slash-fx-boss', 'normal');
  },

  _triggerSlashFx(containerId, type = 'normal') {
    if (GameState.settings && GameState.settings.vfxEnabled === false) return;
    const container = document.getElementById(containerId);
    if (!container || typeof Sprites === 'undefined') return;
    container.innerHTML = Sprites.getSlashFxSvg(type);
    container.classList.remove('hidden', 'slash-fx-anim', 'slash-fx-extra');
    void container.offsetWidth;
    container.classList.add(type === 'extra' ? 'slash-fx-extra' : 'slash-fx-anim');
    setTimeout(() => {
      container.classList.add('hidden');
      container.innerHTML = '';
    }, 450);
  },

  _triggerAnim(elementId, className) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  },

  animateMonsterDeath(callback) {
    const sprite = document.getElementById('monster-sprite');
    if (!sprite) { if (callback) callback(); return; }
    sprite.style.transform = 'scale(0) rotate(30deg)';
    sprite.style.opacity = '0';
    setTimeout(() => {
      sprite.style.transform = '';
      sprite.style.opacity = '';
      if (callback) callback();
    }, 350);
  },

  addCombatLog(html, className) {
    this._combatLogLines.push({ html, className });
    if (this._combatLogLines.length > this._maxLogLines) this._combatLogLines.shift();
    const container = document.getElementById('combat-log');
    if (!container) return;
    container.innerHTML = this._combatLogLines.map(l => `<div class="log-entry ${l.className || ''}">${l.html}</div>`).join('');
    container.scrollTop = container.scrollHeight;
  },

  updateBossChamber() {
    const keyCountEl = document.getElementById('boss-key-count');
    if (keyCountEl) keyCountEl.textContent = GameState.player?.bossKeys || 0;
    const keyPriceEl = document.getElementById('boss-key-price');
    if (keyPriceEl) keyPriceEl.textContent = this._formatNumber(Boss.getKeyPrice());

    const activeArena = document.getElementById('boss-active-arena');
    const bossListContainer = document.getElementById('boss-list-container');

    if (GameState.boss?.active) {
      if (activeArena) activeArena.classList.remove('hidden');
      if (bossListContainer) bossListContainer.classList.add('hidden');

      const b = GameState.boss;
      const p = GameState.player;

      // 1. Cập nhật phe Hiệp Sĩ trong Boss Arena
      const pNameEl = document.getElementById('boss-player-name');
      if (pNameEl) pNameEl.textContent = 'Hiệp Sĩ';
      const pLvlEl = document.getElementById('boss-player-level');
      if (pLvlEl) pLvlEl.textContent = `Lv. ${p.level}`;

      const pSpriteEl = document.getElementById('boss-player-sprite');
      if (pSpriteEl && typeof Sprites !== 'undefined') {
        if (!pSpriteEl.dataset.rendered) {
          pSpriteEl.innerHTML = Sprites.getPlayerSvg('idle');
          pSpriteEl.dataset.rendered = '1';
          pSpriteEl.className = 'fighter-avatar player-idle';
        }
      }

      const pMaxHp = Player.getEffectiveMaxHp();
      const pCurHp = Math.max(0, p.currentHp);
      const pHpPct = Math.max(0, Math.min(100, (pCurHp / pMaxHp) * 100));
      const pHpFill = document.getElementById('boss-player-hp-fill');
      if (pHpFill) pHpFill.style.width = `${pHpPct}%`;
      const pHpText = document.getElementById('boss-player-hp-text');
      if (pHpText) pHpText.textContent = `${this._formatNumber(pCurHp)} / ${this._formatNumber(pMaxHp)}`;

      // 2. Cập nhật phe Đại Boss
      const bNameEl = document.getElementById('boss-active-name');
      if (bNameEl) bNameEl.textContent = b.name;

      const stageTitleEl = document.getElementById('boss-arena-stage-title');
      if (stageTitleEl) stageTitleEl.textContent = `SOLO BOSS: ${b.name.toUpperCase()}`;

      // Rage Bar
      const ragePct = Math.min(100, b.rage || 0);
      const rageFill = document.getElementById('boss-rage-fill');
      if (rageFill) rageFill.style.width = `${ragePct}%`;
      const rageText = document.getElementById('boss-rage-text');
      if (rageText) rageText.textContent = `Nộ Khí Boss: ${ragePct}%${ragePct >= 100 ? ' ⚠️ TUYỆT KỸ ĐÃ SẴN SÀNG!' : ''}`;

      // Boss Skills Tags
      const skillListEl = document.getElementById('boss-skills-tag-list');
      if (skillListEl && b.skills && skillListEl.dataset.renderedBossId !== b.id) {
        skillListEl.innerHTML = b.skills.map(sk => `<span class="boss-skill-tag" title="${sk.desc}">${sk.icon} ${sk.name}</span>`).join('');
        skillListEl.dataset.renderedBossId = b.id;
      }

      // Hero Skills Cooldown HUD trong Solo Boss Arena
      this.updateBossHeroSkillsHud();

      const bossSpriteEl = document.getElementById('boss-active-sprite');
      if (bossSpriteEl && typeof Sprites !== 'undefined') {
        const bossId = b.id || b.config?.id || (b.bossIndex !== undefined ? CONFIG.BOSS_LIST[b.bossIndex]?.id : '');
        if (bossSpriteEl.dataset.renderedId !== bossId) {
          bossSpriteEl.innerHTML = Sprites.getBossSvg(bossId);
          bossSpriteEl.dataset.renderedId = bossId;
          bossSpriteEl.className = 'fighter-avatar boss-sprite boss-idle';
        }
      }

      const timerEl = document.getElementById('boss-timer');
      if (timerEl) timerEl.textContent = `⏱️ ${Math.max(0, b.timer)}s`;

      const bHpPct = Math.max(0, Math.min(100, (b.hp / b.maxHp) * 100));
      const bHpFill = document.getElementById('boss-hp-fill');
      if (bHpFill) bHpFill.style.width = `${bHpPct}%`;
      const bHpText = document.getElementById('boss-hp-text');
      if (bHpText) bHpText.textContent = `${this._formatNumber(Math.max(0, b.hp))} / ${this._formatNumber(b.maxHp)}`;
    } else {
      if (activeArena) activeArena.classList.add('hidden');
      if (bossListContainer) {
        bossListContainer.classList.remove('hidden');
        if (!this._bossListRendered) {
          this._renderBossList();
          this._bossListRendered = true;
        }
      }
    }
  },

  showBossSkillWarning(boss, skill) {
    const alertEl = document.getElementById('boss-skill-alert');
    const textEl = document.getElementById('boss-skill-alert-text');
    if (alertEl && textEl) {
      textEl.textContent = `【TUYỆT KỸ BOSS】 ${boss.name.toUpperCase()} THI TRIỂN: 【${skill.name.toUpperCase()}】!`;
      alertEl.classList.remove('hidden');
      if (this._bossSkillAlertTimer) clearTimeout(this._bossSkillAlertTimer);
      this._bossSkillAlertTimer = setTimeout(() => {
        alertEl.classList.add('hidden');
      }, 2500);
    }
  },

  hideBossSkillWarning() {
    const alertEl = document.getElementById('boss-skill-alert');
    if (alertEl) alertEl.classList.add('hidden');
  },

  updateHeroSkillsHudGeneric(prefix) {
    const activeHeroId = GameState.activeHeroId || 'hero_traveler';
    const heroCfg = CONFIG.getHeroById(activeHeroId);
    if (!heroCfg) return;
    const skills = heroCfg.skills || [];
    const s2 = skills.find(s => s.type === 'active');
    const s3 = skills.find(s => s.type === 'burst');
    const cdProgress = Player.getSkillCooldownProgress ? Player.getSkillCooldownProgress() : null;

    const s2Icon = document.getElementById(`${prefix}-hud-s2-icon`);
    const s2Timer = document.getElementById(`${prefix}-hud-s2-timer`);
    const s2Fill = document.getElementById(`${prefix}-hud-s2-fill`);
    if (s2Icon && s2) s2Icon.textContent = s2.icon || '⚡';
    if (cdProgress && cdProgress.s2) {
      if (s2Timer) s2Timer.textContent = cdProgress.s2.ready ? 'Sẵn sàng' : `${cdProgress.s2.remainingSec}s`;
      if (s2Fill) s2Fill.style.height = cdProgress.s2.ready ? '0%' : `${100 - cdProgress.s2.pct}%`;
    }

    const s3Icon = document.getElementById(`${prefix}-hud-s3-icon`);
    const s3Timer = document.getElementById(`${prefix}-hud-s3-timer`);
    const s3Fill = document.getElementById(`${prefix}-hud-s3-fill`);
    if (s3Icon && s3) s3Icon.textContent = s3.icon || '🌟';
    if (cdProgress && cdProgress.s3) {
      if (s3Timer) s3Timer.textContent = cdProgress.s3.ready ? 'SẴN SÀNG!' : `${cdProgress.s3.remainingSec}s`;
      if (s3Fill) s3Fill.style.height = cdProgress.s3.ready ? '0%' : `${100 - cdProgress.s3.pct}%`;
    }
  },

  updateBossHeroSkillsHud() {
    this.updateHeroSkillsHudGeneric('boss');
  },

  _renderBossList() {
    const container = document.getElementById('boss-list-container');
    if (!container) return;
    container.innerHTML = '';

    CONFIG.BOSS_LIST.forEach((boss, index) => {
      const card = document.createElement('div');
      card.className = 'boss-card glass-panel';
      const stonePct = (boss.protectionStoneDropRate * 100).toFixed(0);
      const dropsHtml = boss.itemDropPool.map(r => `
        <span class="reward-tag tag-rarity" style="color: ${CONFIG.RARITY_COLORS[r]}; border-color: ${CONFIG.RARITY_COLORS[r]}40;">
          ${CONFIG.RARITY_NAMES[r]}
        </span>
      `).join(' ');

      const bossIconHtml = typeof Sprites !== 'undefined'
        ? `<div class="boss-card-svg-box">${Sprites.getBossSvg(boss.id)}</div>`
        : `<div style="font-size: 2rem;">${boss.emoji}</div>`;

      card.innerHTML = `
        <div class="boss-card-icon">${bossIconHtml}</div>
        <div class="boss-card-info">
          <div class="boss-card-title">${boss.name}</div>
          <div class="boss-card-desc">${boss.desc}</div>
          <div class="boss-card-stats">
            <span>❤️ ${this._formatNumber(boss.hp)}</span>
            <span>⚔️ ${boss.attack}</span>
            <span>🛡️ ${boss.defense}</span>
            <span>⚡ ${boss.speed}</span>
          </div>
          <div class="boss-rewards-preview">
            <span class="reward-tag tag-stone">🛡️ ${stonePct}% Rơi Bùa</span>
            ${dropsHtml}
          </div>
        </div>
        <button class="btn btn-primary btn-challenge" data-boss-idx="${index}">
          Khiêu Chiến
          <span style="font-size:0.68rem; opacity:0.9; margin-left: 2px;">(🗝️ ×${boss.keyCost})</span>
        </button>
      `;

      card.querySelector('.btn-challenge').addEventListener('click', () => {
        const res = Boss.startFight(index);
        if (!res.success && res.error === 'not_enough_keys') {
          this.showToast(`🗝️ Cần ${res.needed} Chìa Khóa để khiêu chiến Boss này!`);
        }
      });
      container.appendChild(card);
    });
  },

  showBossVictoryPopup(data) {
    document.getElementById('victory-boss-name').textContent = data.boss.name;
    document.getElementById('victory-gold').textContent = `+${this._formatNumber(data.gold)} 💰`;
    document.getElementById('victory-exp').textContent = `+${this._formatNumber(data.exp)} ✨`;

    document.getElementById('victory-stone-row').classList.toggle('hidden', !data.protectionStone);
    const itemRow = document.getElementById('victory-item-row');
    if (data.item) {
      itemRow.classList.remove('hidden');
      const itemEl = document.getElementById('victory-item-name');
      const itemIconHtml = typeof Sprites !== 'undefined'
        ? `<span style="display:inline-block; vertical-align:middle; width:24px; height:24px; margin-right:6px;">${Sprites.getItemSvg(data.item)}</span>`
        : '';
      itemEl.innerHTML = `${itemIconHtml}${data.item.name}`;
      itemEl.style.color = CONFIG.RARITY_COLORS[data.item.rarity];
    } else {
      itemRow.classList.add('hidden');
    }
    document.getElementById('boss-victory-popup').classList.remove('hidden');
  },

  updateInventory() {
    this._renderEquippedSlots();
    this._renderInventoryGrid();
    const cur = Inventory.getCount();
    const max = Inventory.getMaxSlots();
    document.getElementById('inv-count').textContent = `${cur} / ${max}`;

    const costEl = document.getElementById('expand-inv-cost');
    if (costEl) costEl.textContent = this._formatNumber(Inventory.getExpandCost());
    const expandBtn = document.getElementById('btn-expand-inv');
    if (expandBtn) {
      if (max >= CONFIG.INVENTORY_MAX_LIMIT) {
        expandBtn.disabled = true;
        expandBtn.textContent = 'Đã đạt giới hạn tối đa';
      } else {
        expandBtn.disabled = (GameState.player?.gold || 0) < Inventory.getExpandCost();
      }
    }
  },

  _renderEquippedSlots() {
    const eq = GameState.player.equipment;
    ['weapon', 'armor', 'accessory'].forEach(slot => {
      const slotEl = document.getElementById(`slot-${slot}`);
      const nameEl = document.getElementById(`equipped-${slot}-name`);
      const iconEl = slotEl ? slotEl.querySelector('.slot-icon') : null;
      const item = eq[slot];

      if (item) {
        slotEl.classList.add('has-item');
        slotEl.style.borderColor = CONFIG.RARITY_COLORS[item.rarity];
        const enh = item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : '';
        nameEl.textContent = `${item.name}${enh}`;
        nameEl.style.color = CONFIG.RARITY_COLORS[item.rarity];
        if (iconEl) {
          iconEl.innerHTML = typeof Sprites !== 'undefined'
            ? `<div style="width:34px; height:34px; margin:0 auto; display:flex; align-items:center; justify-content:center;">${Sprites.getItemSvg(item)}</div>`
            : (slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : '💍');
        }
      } else {
        slotEl.classList.remove('has-item');
        slotEl.style.borderColor = '';
        nameEl.textContent = 'Trống';
        nameEl.style.color = 'var(--text-muted)';
        if (iconEl) {
          iconEl.innerHTML = slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : '💍';
        }
      }
    });
  },

  _renderInventoryGrid() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    const items = GameState.inventory;

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `inv-item rarity-${item.rarity}`;
      el.dataset.itemId = item.id;
      const enh = item.enhanceLevel > 0 ? `<div class="enhance-tag">+${item.enhanceLevel}</div>` : '';
      const iconHtml = typeof Sprites !== 'undefined'
        ? `<div class="item-icon">${Sprites.getItemSvg(item)}</div>`
        : `<div class="item-icon">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

      el.innerHTML = `
        ${enh}
        ${iconHtml}
        <div class="item-name-short">${item.name}</div>
      `;
      el.addEventListener('click', () => this._openItemDetail(item.id));
      grid.appendChild(el);
    });

    const maxSlots = Inventory.getMaxSlots();
    const emptyCount = maxSlots - items.length;
    for (let i = 0; i < emptyCount; i++) {
      const el = document.createElement('div');
      el.className = 'inv-item-empty';
      grid.appendChild(el);
    }
  },

  _openItemDetail(itemId) {
    const item = Inventory.findItem(itemId);
    if (!item) return;
    this._selectedItemId = itemId;
    const enh = item.enhanceLevel > 0 ? ` (+${item.enhanceLevel})` : '';

    const iconBox = document.getElementById('detail-item-icon');
    if (iconBox && typeof Sprites !== 'undefined') {
      iconBox.innerHTML = Sprites.getItemSvg(item);
    }

    const nameEl = document.getElementById('detail-item-name');
    nameEl.textContent = `${item.name}${enh}`;
    nameEl.style.color = CONFIG.RARITY_COLORS[item.rarity];

    const rarEl = document.getElementById('detail-item-rarity');
    rarEl.textContent = CONFIG.RARITY_NAMES[item.rarity];
    rarEl.style.color = CONFIG.RARITY_COLORS[item.rarity];

    const typeNames = { weapon: 'Vũ khí', armor: 'Giáp', accessory: 'Phụ kiện' };
    document.getElementById('detail-item-type').textContent = `Loại: ${typeNames[item.type] || item.type}`;

    const statsHtml = [];
    const stats = Inventory.getItemEffectiveStats(item);
    for (const s in stats) {
      const v = stats[s];
      switch (s) {
        case 'attack':   statsHtml.push(`⚔️ Tấn công: <strong>+${v}</strong>`); break;
        case 'maxHp':    statsHtml.push(`❤️ Máu tối đa: <strong>+${v}</strong>`); break;
        case 'defense':  statsHtml.push(`🛡️ Phòng thủ: <strong>+${v}</strong>`); break;
        case 'speed':    statsHtml.push(`⚡ Tốc độ: <strong>+${v}</strong>`); break;
        case 'goldRate': statsHtml.push(`💰 Tỉ lệ vàng: <strong>+${(v * 100).toFixed(0)}%</strong>`); break;
      }
    }
    if (item.enhanceLevel > 0) {
      statsHtml.push(`🔨 Cường hóa +${item.enhanceLevel} (+${(item.enhanceLevel * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL * 100).toFixed(0)}% chỉ số)`);
    }
    document.getElementById('detail-item-stats').innerHTML = statsHtml.join('<br>');

    const price = (CONFIG.SELL_PRICES[item.rarity] || 10) + (item.enhanceLevel || 0) * 50;
    document.getElementById('btn-sell-item').textContent = `Bán (${price} 💰)`;
    document.getElementById('item-detail-popup').classList.remove('hidden');
  },

  _closeItemDetail() {
    document.getElementById('item-detail-popup').classList.add('hidden');
    this._selectedItemId = null;
  },

  _handleEquipItem() {
    if (this._selectedItemId === null) return;
    if (Inventory.equipItem(this._selectedItemId)) {
      this._closeItemDetail();
      this.updateInventory();
      this.updateBattle();
      this.showToast('Đã trang bị thành công!');
    }
  },

  _handleSellItem() {
    if (this._selectedItemId === null) return;
    const price = Inventory.sellItem(this._selectedItemId);
    if (price > 0) {
      this._closeItemDetail();
      this.updateInventory();
      this.updateStatusBar();
      this.showToast(`💰 Bán được ${price} Vàng!`);
    }
  },

  updateForge() {
    this._updateEnhanceSub();
    this._updateFusionSub();
  },

  _updateEnhanceSub() {
    document.getElementById('forge-protection-count').textContent = GameState.player?.protectionStones || 0;
    const slotBox = document.getElementById('enhance-item-slot');
    const previewBox = document.getElementById('enhance-preview');

    let item = null;
    if (this._enhanceTargetId) {
      item = Inventory.findItem(this._enhanceTargetId);
      if (!item && GameState.player?.equipment) {
        for (const s in GameState.player.equipment) {
          if (GameState.player.equipment[s]?.id === this._enhanceTargetId) {
            item = GameState.player.equipment[s];
            break;
          }
        }
      }
    }

    if (item) {
      slotBox.classList.add('has-item');
      slotBox.style.borderColor = CONFIG.RARITY_COLORS[item.rarity];
      const spriteHtml = typeof Sprites !== 'undefined'
        ? `<div style="width:48px; height:48px; margin:0 auto 4px; display:flex; align-items:center; justify-content:center;">${Sprites.getItemSvg(item)}</div>`
        : `<div style="font-size:2rem;">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

      slotBox.innerHTML = `
        ${spriteHtml}
        <div style="font-size:0.75rem; font-weight:700; color:${CONFIG.RARITY_COLORS[item.rarity]};">${item.name}</div>
        <div style="font-size:0.75rem; color:#fff; font-weight:800;">+${item.enhanceLevel || 0}</div>
      `;

      previewBox.classList.remove('hidden');
      const curLvl = item.enhanceLevel || 0;
      document.getElementById('enhance-current-lvl').textContent = `+${curLvl}`;
      document.getElementById('enhance-next-lvl').textContent = `+${Math.min(CONFIG.ENHANCE_MAX, curLvl + 1)}`;

      const rates = CONFIG.getEnhanceRates(curLvl);
      document.getElementById('rate-success').textContent = `${(rates.success * 100).toFixed(1)}%`;
      document.getElementById('rate-crit').textContent = `${((rates.greatSuccess2 + rates.greatSuccess3) * 100).toFixed(1)}%`;
      document.getElementById('rate-drop').textContent = `${(rates.failDrop * 100).toFixed(1)}%`;
      document.getElementById('rate-break').textContent = `${(rates.failBreak * 100).toFixed(1)}%`;

      const cost = CONFIG.getEnhanceCost(curLvl, item.rarity);
      document.getElementById('enhance-cost-tag').textContent = `💰 ${this._formatNumber(cost)}`;
      document.getElementById('btn-do-enhance').disabled = (curLvl >= CONFIG.ENHANCE_MAX) || (GameState.player.gold < cost);
    } else {
      slotBox.classList.remove('has-item');
      slotBox.style.borderColor = '';
      slotBox.innerHTML = `<span class="slot-placeholder">Nhấp chọn trang bị bên dưới để rèn</span>`;
      previewBox.classList.add('hidden');
    }
    this._renderForgeMiniGrid();
  },

  selectEnhanceItem(itemId) {
    this._enhanceTargetId = itemId;
    this._updateEnhanceSub();
  },

  _renderForgeMiniGrid() {
    const grid = document.getElementById('forge-inv-grid');
    if (!grid) return;
    grid.innerHTML = '';

    GameState.inventory.forEach(item => {
      const el = document.createElement('div');
      el.className = `inv-item rarity-${item.rarity} ${this._enhanceTargetId === item.id ? 'selected-forge-item' : ''}`;
      const enh = item.enhanceLevel > 0 ? `<div class="enhance-tag">+${item.enhanceLevel}</div>` : '';
      const iconHtml = typeof Sprites !== 'undefined'
        ? `<div class="item-icon">${Sprites.getItemSvg(item)}</div>`
        : `<div class="item-icon">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

      el.innerHTML = `${enh}${iconHtml}<div class="item-name-short">${item.name}</div>`;
      el.addEventListener('click', () => this.selectEnhanceItem(item.id));
      grid.appendChild(el);
    });
  },

  _handleEnhanceAction() {
    if (!this._enhanceTargetId) return;
    const useProtection = document.getElementById('chk-use-protection').checked;
    const res = Forge.enhanceItem(this._enhanceTargetId, useProtection);

    if (res.error) {
      if (res.error === 'not_enough_gold') this.showToast(`💰 Không đủ Vàng để rèn! (Cần ${this._formatNumber(res.cost)})`);
      else if (res.error === 'no_protection_stone') this.showToast('🛡️ Bạn không có Bùa Bảo Hiểm!');
      else if (res.error === 'max_level') this.showToast('⭐ Trang bị đã đạt cấp tối đa (+100)!');
      return;
    }

    const slotBox = document.getElementById('enhance-item-slot');

    if (res.success) {
      const isCrit = res.type === 'crit2' || res.type === 'crit3';
      const msg = isCrit
        ? `⚡ BẠO KÍCH NHẢY +${res.levelsGained} BẬC! LÊN +${res.newLevel}! 🎉`
        : `✨ Rèn thành công lên +${res.newLevel}! (+${res.levelsGained})`;
      this.showToast(msg);

      if (slotBox) {
        slotBox.classList.remove('enhance-flash-success');
        void slotBox.offsetWidth;
        slotBox.classList.add('enhance-flash-success');
      }
    } else {
      if (res.type === 'protected') {
        this.showToast(`🛡️ Bùa Bảo Hiểm đã bảo vệ trang bị! Giữ nguyên +${res.level}`);
        if (slotBox) {
          slotBox.classList.remove('enhance-flash-protected');
          void slotBox.offsetWidth;
          slotBox.classList.add('enhance-flash-protected');
        }
      } else if (res.type === 'break') {
        this.showForgeResultPopup('💥', 'TRANG BỊ BỊ VỠ VỀ 0!', 'Đập thất bại nặng nề! Trang bị rớt về +0!');
      } else if (res.type === 'downgrade') {
        this.showToast(`❌ Thất bại: Rớt xuống +${res.newLevel}!`);
      } else {
        this.showToast(`❌ Rèn thất bại! Giữ nguyên +${res.level}`);
      }
    }

    this.updateStatusBar();
    this.updateForge();
    this.updateInventory();
    this.updateBattleStatsOnly();
  },

  _updateFusionSub() {
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`fusion-slot-${i}`);
      const itemId = this._fusionSelectedIds[i];
      const item = itemId ? Inventory.findItem(itemId) : null;

      if (item) {
        slotEl.classList.add('has-item');
        slotEl.style.borderColor = CONFIG.RARITY_COLORS[item.rarity];
        const iconHtml = typeof Sprites !== 'undefined'
          ? `<div style="width:38px; height:38px; margin:0 auto 2px; display:flex; align-items:center; justify-content:center;">${Sprites.getItemSvg(item)}</div>`
          : `<div style="font-size:1.4rem;">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

        slotEl.innerHTML = `
          ${iconHtml}
          <div style="font-size:0.62rem; color:${CONFIG.RARITY_COLORS[item.rarity]}; font-weight:700;">${item.name}</div>
        `;
        slotEl.onclick = () => {
          this._fusionSelectedIds.splice(i, 1);
          this._updateFusionSub();
        };
      } else {
        slotEl.classList.remove('has-item');
        slotEl.style.borderColor = '';
        slotEl.innerHTML = `<span>Trống</span>`;
        slotEl.onclick = null;
      }
    }

    const previewBox = document.getElementById('fusion-preview');
    if (this._fusionSelectedIds.length === 3) {
      const items = this._fusionSelectedIds.map(id => Inventory.findItem(id)).filter(Boolean);
      if (items.length === 3 && items[0].rarity === items[1].rarity && items[1].rarity === items[2].rarity) {
        const curRarity = items[0].rarity;
        const nextRarity = CONFIG.RARITY_ORDER[CONFIG.RARITY_ORDER.indexOf(curRarity) + 1];

        if (nextRarity) {
          previewBox.classList.remove('hidden');
          const targetEl = document.getElementById('fusion-target-rarity');
          targetEl.textContent = CONFIG.RARITY_NAMES[nextRarity];
          targetEl.style.color = CONFIG.RARITY_COLORS[nextRarity];
          document.getElementById('fusion-success-rate').textContent = `${((CONFIG.FUSION_RATES[curRarity] || 0.1) * 100).toFixed(1)}%`;
        } else {
          previewBox.classList.add('hidden');
        }
      } else {
        previewBox.classList.add('hidden');
      }
    } else {
      previewBox.classList.add('hidden');
    }
    this._renderFusionMiniGrid();
  },

  _renderFusionMiniGrid() {
    const grid = document.getElementById('fusion-inv-grid');
    if (!grid) return;
    grid.innerHTML = '';

    GameState.inventory.forEach(item => {
      const isSelected = this._fusionSelectedIds.includes(item.id);
      const el = document.createElement('div');
      el.className = `inv-item rarity-${item.rarity} ${isSelected ? 'selected-fusion-item' : ''}`;
      const iconHtml = typeof Sprites !== 'undefined'
        ? `<div class="item-icon">${Sprites.getItemSvg(item)}</div>`
        : `<div class="item-icon">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

      el.innerHTML = `${iconHtml}<div class="item-name-short">${item.name}</div>`;
      el.addEventListener('click', () => {
        if (isSelected) {
          this._fusionSelectedIds = this._fusionSelectedIds.filter(id => id !== item.id);
        } else {
          if (this._fusionSelectedIds.length >= 3) {
            this.showToast('Đã chọn đủ 3 món để ghép!');
            return;
          }
          if (this._fusionSelectedIds.length > 0) {
            const first = Inventory.findItem(this._fusionSelectedIds[0]);
            if (first && first.rarity !== item.rarity) {
              this.showToast('Phải chọn 3 món cùng phẩm cấp!');
              return;
            }
          }
          this._fusionSelectedIds.push(item.id);
        }
        this._updateFusionSub();
      });
      grid.appendChild(el);
    });
  },

  _handleFusionAction() {
    if (this._fusionSelectedIds.length !== 3) return;
    const res = Forge.combineItems(this._fusionSelectedIds);
    this._fusionSelectedIds = [];

    if (res.error) {
      this.showToast('Lỗi ghép đồ: ' + res.error);
      this._updateFusionSub();
      return;
    }

    if (res.success) {
      this.showForgeResultPopup('✨', 'DUNG HỢP THÀNH CÔNG!', `Tạo ra trang bị [${CONFIG.RARITY_NAMES[res.toRarity]}]: ${res.newItem.name}!`);
    } else {
      this.showForgeResultPopup('💨', 'DUNG HỢP THẤT BẠI!', `Nguyên liệu biến mất! Nhận an ủi +${res.consolationGold} Vàng!`);
    }

    this.updateInventory();
    this.updateForge();
    this.updateStatusBar();
  },

  _handleQuickCombine(rarity) {
    const res = Forge.quickCombine(rarity);
    if (res.error === 'not_enough_items') {
      this.showToast(`Không đủ trang bị bậc [${CONFIG.RARITY_NAMES[rarity]}] để ghép nhanh (Cần ít nhất 3 món)!`);
      return;
    }
    this.showToast(`✨ Ghép nhanh: Thành công ${res.successes} / ${res.totalGroups} lần!`);
    this.updateInventory();
    this.updateForge();
    this.updateStatusBar();
  },

  showForgeResultPopup(icon, title, desc) {
    document.getElementById('forge-result-icon').textContent = icon;
    document.getElementById('forge-result-title').textContent = title;
    document.getElementById('forge-result-desc').textContent = desc;
    document.getElementById('forge-result-popup').classList.remove('hidden');
  },

  _renderUpgradeCards() {
    const container = document.getElementById('upgrade-cards-list');
    container.innerHTML = '';

    for (const type in CONFIG.UPGRADES) {
      const cfg = CONFIG.UPGRADES[type];
      const card = document.createElement('div');
      card.className = 'upgrade-card glass-panel';
      card.id = `card-upgrade-${type}`;

      card.innerHTML = `
        <div class="upgrade-icon">${cfg.icon}</div>
        <div class="upgrade-info">
          <h3>${cfg.name}</h3>
          <div class="upgrade-level">Cấp: <span id="lvl-upgrade-${type}">0</span></div>
          <div class="upgrade-effect">Chỉ số: <span id="bonus-upgrade-${type}">+0</span></div>
        </div>
        <button class="btn btn-upgrade" id="btn-upgrade-${type}" data-type="${type}">
          Nâng cấp
          <span class="upgrade-cost" id="cost-upgrade-${type}">💰 50</span>
        </button>
      `;
      card.querySelector('.btn-upgrade').addEventListener('click', () => this._handleUpgrade(type));
      container.appendChild(card);
    }
  },

  updateUpgrades() {
    for (const type in CONFIG.UPGRADES) {
      const lvl = Upgrades.getLevel(type);
      const bonusText = Upgrades.getBonusText(type);
      const cost = Upgrades.getCost(type);

      const lvlEl = document.getElementById(`lvl-upgrade-${type}`);
      if (lvlEl) lvlEl.textContent = lvl;
      const bonusEl = document.getElementById(`bonus-upgrade-${type}`);
      if (bonusEl) bonusEl.textContent = bonusText;
      const costEl = document.getElementById(`cost-upgrade-${type}`);
      if (costEl) costEl.textContent = `💰 ${this._formatNumber(cost)}`;
      const btn = document.getElementById(`btn-upgrade-${type}`);
      if (btn) btn.disabled = !Upgrades.canAfford(type);
    }
    this.updateStatusBar();
  },

  _handleUpgrade(type) {
    if (Upgrades.upgrade(type)) {
      this.updateUpgrades();
      this.updateBattleStatsOnly();
      this.showToast('⬆️ Nâng cấp thành công!');
    }
  },

  _switchGachaBanner(bannerType) {
    if (!GameState.gacha) GameState.gacha = { totalPulls: 0, totalHeroPulls: 0, bannerTab: 'weapon' };
    GameState.gacha.bannerTab = bannerType;

    const btnW = document.getElementById('btn-banner-weapon');
    const btnH = document.getElementById('btn-banner-hero');
    if (btnW) btnW.classList.toggle('active', bannerType === 'weapon');
    if (btnH) btnH.classList.toggle('active', bannerType === 'hero');

    const titleEl = document.getElementById('banner-title');
    const subEl = document.getElementById('banner-subtitle');

    if (bannerType === 'weapon') {
      if (titleEl) titleEl.textContent = '✨ Vận Mệnh Thần Binh ✨';
      if (subEl) subEl.textContent = 'Quay tìm vũ khí truyền thuyết & thần khí bí ẩn ???';
    } else {
      if (titleEl) titleEl.textContent = '👑 Vận Mệnh Thần Ma ✨';
      if (subEl) subEl.textContent = 'Chiêu mộ anh hùng: Lôi Thần Ei, Hỏa Phượng Changli, Thiên Lý ???';
    }

    this.updateGacha();
  },

  updateGacha() {
    const isHero = GameState.gacha?.bannerTab === 'hero';
    const count = Inventory.getCount();
    const free = Inventory.getFreeSlots();
    const isFull = Inventory.isFull();
    const maxSlots = Inventory.getMaxSlots();

    const countEl = document.getElementById('gacha-inv-count');
    if (countEl) countEl.textContent = `${count} / ${maxSlots}`;
    const freeEl = document.getElementById('gacha-inv-free');
    if (freeEl) freeEl.textContent = isFull ? 'HẾT CHỖ TRỐNG!' : `còn ${free} chỗ trống`;
    const statusBox = document.getElementById('gacha-inv-status');
    if (statusBox) {
      statusBox.style.display = isHero ? 'none' : 'block';
      statusBox.classList.toggle('bag-full', isFull);
    }

    const costs = [
      { id: '1', count: 1 },
      { id: '10', count: 10 },
      { id: '100', count: 100 },
      { id: '1000', count: 1000 }
    ];

    costs.forEach(c => {
      const costVal = Gacha.getCost(c.count, isHero);
      const costEl = document.getElementById(`gacha-cost-${c.id}`);
      if (costEl) costEl.textContent = `💰 ${this._formatNumber(costVal)}`;
      const btn = document.getElementById(`btn-gacha-${c.id}`);
      if (btn) {
        const canAfford = Gacha.canAfford(c.count, isHero);
        if (isHero) {
          btn.disabled = !canAfford;
        } else {
          const spaceOk = c.count <= 10 ? free >= c.count : true;
          btn.disabled = !canAfford || !spaceOk;
        }
      }
    });

    const artContainer = document.getElementById('banner-visual-art');
    if (artContainer && typeof Sprites !== 'undefined') {
      artContainer.innerHTML = isHero ? Sprites.getHeroBannerSvg() : Sprites.getWeaponBannerSvg();
    }

    const autoGachaChk = document.getElementById('chk-auto-gacha');
    if (autoGachaChk && GameState.autoGacha) {
      autoGachaChk.checked = !!GameState.autoGacha.enabled;
    }
    const autoStatusBadge = document.getElementById('auto-gacha-status');
    if (autoStatusBadge) {
      const on = GameState.autoGacha?.enabled;
      autoStatusBadge.textContent = on ? 'Đang tự quay...' : 'Đang tắt';
      autoStatusBadge.style.color = on ? '#00e5ff' : '#aaa';
    }

    this.updateStatusBar();
  },

  _handleGachaPull(count) {
    const isHero = GameState.gacha?.bannerTab === 'hero';
    if (isHero) {
      if (!Gacha.canAfford(count, true)) {
        this.showToast('💰 Không đủ Vàng để chiêu mộ Anh Hùng!');
        return;
      }
      const res = Gacha.pullHero(count);
      if (res.error) {
        this.showToast('💰 Không đủ Vàng để chiêu mộ!');
        return;
      }
      this._showHeroGachaResults(res.results, res.statsSummary, count);
    } else {
      if (!Gacha.canAfford(count, false)) {
        this.showToast('💰 Không đủ Vàng để quay Vũ Khí!');
        return;
      }
      if (count <= 10 && Inventory.getFreeSlots() < count) {
        this.showToast(`🎒 Cần ít nhất ${count} ô trống trong túi đồ để quay!`);
        return;
      }
      const res = Gacha.pullWeapon(count);
      if (res.error) {
        this.showToast(res.error === 'not_enough_gold' ? '💰 Không đủ Vàng!' : '🎒 Kho đồ không đủ chỗ!');
        return;
      }
      this._showWeaponGachaResults(res.items, res.statsSummary, res.autoSoldGold, count);
    }

    this.updateGacha();
    this.updateInventory();
    this.updateStatusBar();
  },

  _showWeaponGachaResults(items, statsSummary, autoSoldGold, pullCount) {
    const container = document.getElementById('gacha-result-items');
    container.innerHTML = '';

    if (pullCount > 10) {
      const summaryBox = document.createElement('div');
      summaryBox.className = 'gacha-mass-summary';
      summaryBox.style.cssText = 'width:100%; padding:10px; margin-bottom:12px; background:rgba(0,0,0,0.5); border-radius:8px; border:1px solid rgba(255,255,255,0.2);';

      let summaryHtml = `<h3 style="color:#ffd700; margin-bottom:8px; font-size:1rem;">🎁 Tổng kết Quay ×${pullCount} món:</h3><div style="display:flex; flex-wrap:wrap; gap:6px; font-size:0.78rem;">`;
      for (const r of CONFIG.RARITY_ORDER) {
        if (statsSummary[r] > 0) {
          summaryHtml += `<span style="background:${CONFIG.RARITY_BG[r]}; color:${CONFIG.RARITY_COLORS[r]}; padding:3px 8px; border-radius:4px; border:1px solid ${CONFIG.RARITY_COLORS[r]}40;">${CONFIG.RARITY_NAMES[r]}: <strong>${statsSummary[r]}</strong></span>`;
        }
      }
      summaryHtml += `</div>`;
      if (autoSoldGold > 0) {
        summaryHtml += `<div style="margin-top:8px; color:#10b981; font-weight:700; font-size:0.75rem;">💰 Tự bán đồ thường khi kho đầy: +${this._formatNumber(autoSoldGold)} Vàng</div>`;
      }
      summaryBox.innerHTML = summaryHtml;
      container.appendChild(summaryBox);

      const highTierItems = items.filter(i => ['legendary', 'mythic', 'chaos', 'unknown'].includes(i.rarity));
      const displayItems = highTierItems.length > 0 ? highTierItems.slice(0, 16) : items.slice(0, 8);

      displayItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = `gacha-item-card rarity-${item.rarity}`;
        card.style.background = CONFIG.RARITY_BG[item.rarity];
        card.style.border = `1px solid ${CONFIG.RARITY_COLORS[item.rarity]}40`;

        const iconHtml = typeof Sprites !== 'undefined'
          ? `<div class="item-icon" style="width:36px; height:36px; margin:0 auto 4px; display:flex; align-items:center; justify-content:center;">${Sprites.getItemSvg(item)}</div>`
          : `<div class="item-icon">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

        card.innerHTML = `${iconHtml}<div class="item-name-short" style="color: ${CONFIG.RARITY_COLORS[item.rarity]}">${item.name}</div>`;
        container.appendChild(card);
      });
    } else {
      items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `gacha-item-card rarity-${item.rarity}`;
        card.style.animationDelay = `${index * 0.08}s`;
        card.style.background = CONFIG.RARITY_BG[item.rarity];
        card.style.border = `1px solid ${CONFIG.RARITY_COLORS[item.rarity]}40`;

        const iconHtml = typeof Sprites !== 'undefined'
          ? `<div class="item-icon" style="width:36px; height:36px; margin:0 auto 4px; display:flex; align-items:center; justify-content:center;">${Sprites.getItemSvg(item)}</div>`
          : `<div class="item-icon">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>`;

        card.innerHTML = `${iconHtml}<div class="item-name-short" style="color: ${CONFIG.RARITY_COLORS[item.rarity]}">${item.name}</div>`;
        container.appendChild(card);
      });
    }

    document.getElementById('gacha-result-popup').classList.remove('hidden');
  },

  _showHeroGachaResults(results, statsSummary, pullCount) {
    const container = document.getElementById('gacha-result-items');
    container.innerHTML = '';

    if (pullCount > 10) {
      const summaryBox = document.createElement('div');
      summaryBox.className = 'gacha-mass-summary';
      summaryBox.style.cssText = 'width:100%; padding:10px; margin-bottom:12px; background:rgba(0,0,0,0.5); border-radius:8px; border:1px solid rgba(255,255,255,0.2);';

      let summaryHtml = `<h3 style="color:#ffd700; margin-bottom:8px; font-size:1rem;">👑 Chiêu Mộ ×${pullCount} Anh Hùng:</h3><div style="display:flex; flex-wrap:wrap; gap:6px; font-size:0.78rem;">`;
      for (const r of CONFIG.RARITY_ORDER) {
        if (statsSummary[r] > 0) {
          summaryHtml += `<span style="background:${CONFIG.RARITY_BG[r]}; color:${CONFIG.RARITY_COLORS[r]}; padding:3px 8px; border-radius:4px; border:1px solid ${CONFIG.RARITY_COLORS[r]}40;">${CONFIG.RARITY_NAMES[r]}: <strong>${statsSummary[r]}</strong></span>`;
        }
      }
      summaryHtml += `</div>`;
      summaryBox.innerHTML = summaryHtml;
      container.appendChild(summaryBox);

      const topResults = results.filter(r => ['epic', 'legendary', 'mythic', 'chaos', 'unknown'].includes(r.hero.rarity));
      const displayResults = topResults.length > 0 ? topResults.slice(0, 12) : results.slice(0, 8);

      displayResults.forEach(r => this._renderHeroResultCard(container, r));
    } else {
      results.forEach((r, idx) => {
        this._renderHeroResultCard(container, r, idx);
      });
    }

    document.getElementById('gacha-result-popup').classList.remove('hidden');
  },

  _renderHeroResultCard(container, r, idx = 0) {
    const card = document.createElement('div');
    card.className = `gacha-item-card rarity-${r.hero.rarity}`;
    card.style.animationDelay = `${idx * 0.08}s`;
    card.style.background = CONFIG.RARITY_BG[r.hero.rarity];
    card.style.border = `1px solid ${CONFIG.RARITY_COLORS[r.hero.rarity] || '#a855f7'}`;
    card.style.padding = '8px 6px';

    const avatarHtml = typeof Sprites !== 'undefined'
      ? `<div style="width:42px; height:42px; margin:0 auto 4px;">${Sprites.getPlayerSvg('idle', r.hero.id)}</div>`
      : `<div style="font-size:1.8rem;">👑</div>`;

    let badgeText = r.isNew
      ? `<span style="background:#10b981; color:#fff; font-size:0.58rem; font-weight:800; padding:1px 5px; border-radius:4px;">✨ MỚI (E0)</span>`
      : (r.refundGold 
          ? `<span style="background:#ef4444; color:#fff; font-size:0.58rem; font-weight:800; padding:1px 5px; border-radius:4px;">MAX E6 (+${this._formatNumber(r.refundGold)}💰)</span>`
          : `<span style="background:#f59e0b; color:#fff; font-size:0.58rem; font-weight:800; padding:1px 5px; border-radius:4px;">⭐ Cung Mệnh E${r.constellation}</span>`);

    card.innerHTML = `
      ${avatarHtml}
      <div style="font-size:0.75rem; font-weight:800; color:${r.hero.elementColor || '#fff'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.hero.name}</div>
      <div style="margin-top:4px;">${badgeText}</div>
    `;
    container.appendChild(card);
  },

  updateHeroesTab() {
    const chk = document.getElementById('chk-auto-hero-skill');
    if (chk) chk.checked = !!GameState.autoHeroSkill;
    this._renderHeroShowcase();
    this._renderHeroCollection();
  },

  _renderHeroShowcase() {
    const container = document.getElementById('active-hero-showcase');
    if (!container) return;

    const activeId = GameState.activeHeroId || 'hero_traveler';
    const heroCfg = CONFIG.getHeroById(activeId);
    const userHero = GameState.heroes?.find(h => h.id === activeId) || { constellation: 0, skillLevels: { s1: 1, s2: 1, s3: 1 } };
    const skills = heroCfg.skills || [];

    const avatarSvg = typeof Sprites !== 'undefined' ? Sprites.getPlayerSvg('idle', activeId) : '👑';
    const cBadge = userHero.constellation > 0 ? `Cung Mệnh E${userHero.constellation}` : 'Cung Mệnh E0';
    const constellationBonus = (userHero.constellation || 0) * 20;

    const skillsHtml = skills.map((sk, idx) => {
      const skKey = `s${idx + 1}`;
      const skLevel = userHero.skillLevels?.[skKey] || 1;
      const upgradeCost = skKey === 's1' ? skLevel * 3000 : skKey === 's2' ? skLevel * 5000 : skLevel * 10000;
      const canAfford = (GameState.player?.gold || 0) >= upgradeCost;

      const typeLabel = sk.type === 'passive' ? 'Nội Tại' : sk.type === 'burst' ? 'Tuyệt Kỹ Nộ' : 'Chiến Kỹ';
      const typeClass = sk.type === 'passive' ? 'passive-badge' : sk.type === 'burst' ? 'burst-badge' : 'active-badge';
      const cdTag = sk.cd ? `<span style="font-size:0.65rem; color:#00ffcc; margin-left:4px;">⏱️ ${sk.cd}s</span>` : '';

      return `
        <div class="skill-card skill-card-enhanced ${sk.type}-card">
          <div class="skill-card-glow-bg"></div>
          <div class="skill-card-header">
            <div class="skill-icon-wrapper" style="border-color:${heroCfg.elementColor || '#a855f7'}; box-shadow:0 0 10px ${heroCfg.elementColor || '#a855f7'}40;">
              <span class="skill-icon-big">${sk.icon}</span>
            </div>
            <div class="skill-title-block">
              <div class="skill-name-txt">${sk.name}</div>
              <div class="skill-meta-tags">
                <span class="skill-type-tag ${typeClass}">${typeLabel}</span>
                <span class="skill-elem-tag" style="color:${heroCfg.elementColor}; border-color:${heroCfg.elementColor}60;">${heroCfg.elementName}</span>
                ${cdTag}
              </div>
            </div>
          </div>
          <div class="skill-desc-txt">${sk.desc}</div>
          <div class="skill-card-footer">
            <div class="skill-level-row">
              <span class="skill-lvl-badge">Cấp ${skLevel}</span>
              <span class="skill-cost-txt">💰 ${this._formatNumber(upgradeCost)}</span>
            </div>
            <button class="btn btn-primary btn-skill-upgrade" data-skill="${skKey}" ${!canAfford ? 'disabled' : ''}>
              ✨ Nâng Cấp
            </button>
            ${sk.type === 'burst' ? `
            <button class="btn btn-preview-burst" style="margin-top: 6px; width: 100%; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; font-weight: 800; font-size: 0.75rem; padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.25); cursor: pointer; text-shadow: 0 1px 3px rgba(0,0,0,0.6); box-shadow: 0 2px 8px rgba(239,68,68,0.35);">
              🎬 Thử Nghiệm Nộ 3D x1000
            </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="hero-showcase-card">
        <div class="hero-main-header">
          <div class="hero-big-avatar" style="border-color: ${heroCfg.elementColor || '#a855f7'};">
            ${avatarSvg}
          </div>
          <div class="hero-header-meta">
            <div class="hero-title-row">
              <span class="hero-name-big" style="color: ${heroCfg.elementColor || '#fff'};">${heroCfg.name}</span>
              <span class="hero-element-badge" style="border-color:${heroCfg.elementColor}; color:${heroCfg.elementColor};">${heroCfg.elementName}</span>
              <span class="hero-constellation-badge">${cBadge}</span>
              <span class="rate-badge rate-${heroCfg.rarity}">${CONFIG.RARITY_NAMES[heroCfg.rarity]}</span>
            </div>
            <div class="hero-sub-title">${heroCfg.title}</div>
            <div class="hero-passives-bar" style="margin-top:8px;">
              <span>⚔️ Sát thương: <strong>+${((heroCfg.atkBonusPct || 0) * 100).toFixed(0)}%</strong></span>
              <span>❤️ Máu: <strong>+${((heroCfg.hpBonusPct || 0) * 100).toFixed(0)}%</strong></span>
              <span>🛡️ Giáp: <strong>+${((heroCfg.defBonusPct || 0) * 100).toFixed(0)}%</strong></span>
              <span>⚡ Tốc độ: <strong>+${heroCfg.spdBonus || 0}</strong></span>
              ${constellationBonus > 0 ? `<span style="color:#ffd700;">✨ Buff Cung mệnh: <strong>+${constellationBonus}%</strong> toàn chỉ số!</span>` : ''}
            </div>
          </div>
        </div>

        <h3 class="panel-title" style="margin-top:6px; margin-bottom:4px; font-size:0.95rem;">⚡ Kỹ Năng Nhân Vật (Tự động kích hoạt trong trận)</h3>
        <div class="hero-skills-grid">
          ${skillsHtml}
        </div>

        <h3 class="panel-title" style="margin-top:16px; margin-bottom:8px; font-size:0.95rem; display:flex; align-items:center; gap:6px;">
          👑 Cung Mệnh & Mốc Sức Mạnh Độc Bản (E0 — E6)
          <span style="font-size:0.75rem; color:#f59e0b; font-weight:normal;">(Quay bản sao để mở khóa các mốc)</span>
        </h3>
        <div class="eidolons-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:8px;">
          ${(heroCfg.eidolons || []).map(e => {
            const isUnlocked = userHero.constellation >= e.level;
            return `
              <div style="background:${isUnlocked ? 'rgba(245,158,11,0.1)' : 'rgba(15,23,42,0.6)'}; border:1px solid ${isUnlocked ? '#f59e0b' : 'rgba(255,255,255,0.08)'}; border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:4px; opacity:${isUnlocked ? '1' : '0.55'};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:${isUnlocked ? '#fbbf24' : '#94a3b8'}; font-size:0.82rem;">${e.name}</strong>
                  <span style="font-size:0.65rem; padding:2px 6px; border-radius:4px; font-weight:800; background:${isUnlocked ? '#10b981' : 'rgba(255,255,255,0.1)'}; color:${isUnlocked ? '#fff' : '#64748b'};">
                    ${isUnlocked ? '✓ ĐÃ MỞ KHÓA' : '🔒 KHÓA'}
                  </span>
                </div>
                <div style="color:${isUnlocked ? '#e2e8f0' : '#64748b'}; font-size:0.72rem; line-height:1.4;">${e.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-skill-upgrade').forEach(btn => {
      btn.addEventListener('click', () => this._handleUpgradeHeroSkill(btn.dataset.skill));
    });

    container.querySelectorAll('.btn-preview-burst').forEach(btn => {
      btn.addEventListener('click', () => {
        const burstSkill = skills.find(s => s.type === 'burst') || skills[skills.length - 1];
        if (typeof Cinematics !== 'undefined' && Cinematics.playBurst) {
          Cinematics.playBurst({
            hero: heroCfg,
            skill: burstSkill,
            damage: 999999,
            isCrit: true,
            buffName: burstSkill?.buffDesc || 'Tuyệt Kỹ Nộ 3D',
            forcePreview: true
          });
        }
      });
    });
  },

  _handleUpgradeHeroSkill(skKey) {
    const activeId = GameState.activeHeroId || 'hero_traveler';
    let userHero = GameState.heroes?.find(h => h.id === activeId);
    if (!userHero) return;

    if (!userHero.skillLevels) userHero.skillLevels = { s1: 1, s2: 1, s3: 1 };
    const curLevel = userHero.skillLevels[skKey] || 1;
    const cost = skKey === 's1' ? curLevel * 3000 : skKey === 's2' ? curLevel * 5000 : curLevel * 10000;

    if (!Player.spendGold(cost)) {
      this.showToast('💰 Không đủ Vàng để nâng cấp kỹ năng!');
      return;
    }

    userHero.skillLevels[skKey] = curLevel + 1;
    this.showToast(`✨ Nâng cấp kỹ năng lên Cấp ${userHero.skillLevels[skKey]}! (-${this._formatNumber(cost)} 💰)`);
    this.updateHeroesTab();
    this.updateBattleStatsOnly();
    this.updateStatusBar();
  },

  _renderHeroCollection() {
    const grid = document.getElementById('heroes-collection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CONFIG.HEROES_LIST.forEach(hero => {
      const userHero = GameState.heroes?.find(h => h.id === hero.id);
      const isOwned = !!userHero;
      const isActive = GameState.activeHeroId === hero.id;

      const card = document.createElement('div');
      card.className = `hero-roster-card ${isActive ? 'active-hero' : ''} ${!isOwned ? 'locked-hero' : ''}`;
      card.style.borderColor = isActive ? '#00ffcc' : isOwned ? `${hero.elementColor}60` : 'rgba(255,255,255,0.1)';

      const avatarHtml = typeof Sprites !== 'undefined'
        ? `<div class="hero-card-avatar">${Sprites.getPlayerSvg('idle', hero.id)}</div>`
        : `<div class="hero-card-avatar" style="font-size:1.8rem;">👑</div>`;

      const activeTag = isActive ? `<span class="hero-active-tag">XUẤT CHIẾN</span>` : '';
      const cBadge = isOwned ? `<span class="hero-card-c-badge">E${userHero.constellation || 0}</span>` : `<span style="font-size:0.62rem; color:var(--text-muted);">🔒 Chưa mở</span>`;

      card.innerHTML = `
        ${activeTag}
        ${avatarHtml}
        <div class="hero-card-name" style="color: ${hero.elementColor || '#fff'};">${hero.name}</div>
        <div class="hero-card-rarity" style="color: ${CONFIG.RARITY_COLORS[hero.rarity]};">${CONFIG.RARITY_NAMES[hero.rarity]}</div>
        ${cBadge}
      `;

      card.addEventListener('click', () => {
        if (!isOwned) {
          this.showToast(`🔒 Hãy quay Banner Anh Hùng để chiêu mộ ${hero.name}!`);
          return;
        }
        if (isActive) {
          this.showToast(`${hero.name} đang xuất chiến rồi!`);
          return;
        }
        this._handleSelectActiveHero(hero.id);
      });

      grid.appendChild(card);
    });
  },

  _handleSelectActiveHero(heroId) {
    GameState.activeHeroId = heroId;
    Player._skill2NextReady = 0;
    Player._skill3NextReady = 0;
    const heroCfg = CONFIG.getHeroById(heroId);

    this.showToast(`👑 Đã đổi tướng xuất chiến: [${heroCfg.name}]!`);
    this.updateBattle();
    this.updateHeroesTab();
    this.updateStatusBar();
  },

  showOfflinePopup(progress) {
    if (!progress) return;
    document.getElementById('offline-time-text').textContent = `Bạn đã offline ${SaveManager.formatOfflineTime(progress.seconds)}`;
    document.getElementById('offline-gold').textContent = `+${this._formatNumber(progress.gold)} Vàng`;
    document.getElementById('offline-exp').textContent = `+${this._formatNumber(progress.exp)} EXP`;
    document.getElementById('offline-popup').classList.remove('hidden');
  },

  showLevelUp(level) {
    const toast = document.createElement('div');
    toast.className = 'level-up-toast';
    toast.textContent = `⭐ Level Up: ${level}!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);

    this.addCombatLog(`🎉 <span class="level-up">Lên cấp ${level}! Đầy lại sinh lực!</span>`);
    this.updateStatusBar();
  },

  showToast(message) {
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'level-up-toast toast-notification';
    toast.style.fontSize = '0.9rem';
    toast.style.top = '10%';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  },

  _formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e4) return (num / 1e3).toFixed(1) + 'K';
    return (num || 0).toLocaleString('vi-VN');
  },

  // ============================================================
  // DUNGEON SYSTEM UI
  // ============================================================
  updateDungeonTab() {
    const list = document.getElementById('dungeon-cards-list');
    if (!list) return;
    list.innerHTML = '';

    CONFIG.DUNGEONS.forEach(d => {
      const card = document.createElement('div');
      card.className = 'dungeon-card glass-panel';
      card.style.borderColor = `${d.badgeColor}40`;

      const runsLeft = typeof Dungeon !== 'undefined' ? Dungeon.getRemainingRuns(d.id) : 3;
      const isTower = !!d.isTower;
      const floorInfo = isTower ? `Tầng hiện tại: <strong>Tầng ${GameState.dungeon?.abyssFloor || 1}</strong> (Vô hạn)` : `Lượt hôm nay: <strong>${runsLeft} / ${d.dailyLimit}</strong>`;
      const canEnter = typeof Dungeon !== 'undefined' ? Dungeon.canEnter(d.id) : true;

      card.innerHTML = `
        <div class="dungeon-card-header">
          <span class="dungeon-badge" style="background:${d.badgeColor}22; color:${d.badgeColor}; border:1px solid ${d.badgeColor}66;">${d.badge}</span>
          <span class="dungeon-runs">${floorInfo}</span>
        </div>
        <div class="dungeon-card-body">
          <div class="dungeon-icon">${d.icon}</div>
          <h3 class="dungeon-name">${d.name}</h3>
          <p class="dungeon-desc">${d.desc}</p>
        </div>
        <div class="dungeon-card-footer">
          <button class="btn btn-primary btn-dungeon-enter" data-dungeon="${d.id}" ${canEnter ? '' : 'disabled'}>
            ${canEnter ? (isTower ? '🚀 Tiến Vào Leo Tháp' : '⚔️ Vào Phòng Bí Cảnh') : '🔒 Đã Hết Lượt Hôm Nay'}
          </button>
        </div>
      `;

      card.querySelector('.btn-dungeon-enter')?.addEventListener('click', () => {
        if (typeof Dungeon !== 'undefined') {
          const res = Dungeon.start(d.id);
          if (res.error === 'no_runs_left') {
            this.showToast('🔒 Bạn đã hết số lượt vào phó bản này hôm nay!');
          }
        }
      });

      list.appendChild(card);
    });
  },

  updateDungeonArena() {
    // Kept for backward compatibility
  },

  // ============================================================
  // DEDICATED IN-DUNGEON ROOMS (MỎ VÀNG, EXP, BÙA, LÒ RÈN)
  // ============================================================
  enterDungeonRoom(cfg) {
    const selView = document.getElementById('dungeon-selection-view');
    const towerView = document.getElementById('tower-view');
    const roomEl = document.getElementById('dungeon-active-room');
    if (selView) selView.classList.add('hidden');
    if (towerView) towerView.classList.add('hidden');
    if (!roomEl) return;

    roomEl.className = `glass-panel dungeon-room-container theme-${cfg.theme || 'gold'}`;
    roomEl.classList.remove('hidden');

    const titleEl = document.getElementById('dungeon-room-title');
    const subEl = document.getElementById('dungeon-room-subtitle');
    const iconEl = document.getElementById('dungeon-room-icon');
    const waveEl = document.getElementById('dungeon-room-wave');

    if (titleEl) titleEl.textContent = cfg.name;
    if (subEl) subEl.textContent = cfg.desc;
    if (iconEl) iconEl.textContent = cfg.icon;
    if (waveEl) waveEl.textContent = `ĐỢT 1 / ${cfg.waves || 5}`;

    // Reset tracker
    this.updateDungeonLootTracker();
    this.updateDungeonRoomPlayer();
  },

  updateDungeonRoomWaveHeader() {
    const waveEl = document.getElementById('dungeon-room-wave');
    if (waveEl && GameState.dungeon) {
      const isBoss = GameState.dungeon.wave === GameState.dungeon.maxWaves;
      waveEl.textContent = isBoss ? '👑 ĐỢT BOSS CUỐI (5/5)' : `ĐỢT ${GameState.dungeon.wave} / ${GameState.dungeon.maxWaves}`;
      waveEl.style.color = isBoss ? '#ff1744' : '#ffd700';
    }
  },

  updateDungeonRoomPlayer() {
    const p = GameState.player;
    if (!p) return;
    const nameEl = document.getElementById('dungeon-player-name');
    const lvlEl = document.getElementById('dungeon-player-level');
    if (nameEl) nameEl.textContent = 'Hiệp Sĩ';
    if (lvlEl) lvlEl.textContent = `Lv. ${p.level}`;

    const spriteEl = document.getElementById('dungeon-player-sprite');
    if (spriteEl && typeof Sprites !== 'undefined' && !spriteEl.dataset.rendered) {
      spriteEl.innerHTML = Sprites.getPlayerSvg('idle');
      spriteEl.dataset.rendered = '1';
      spriteEl.className = 'fighter-avatar player-idle';
    }

    const curHp = Math.max(0, p.currentHp);
    const maxHp = Player.getEffectiveMaxHp();
    const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

    const fill = document.getElementById('dungeon-player-hp-fill');
    const text = document.getElementById('dungeon-player-hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(maxHp)}`;

    this.updateHeroSkillsHudGeneric('dungeon');
  },

  updateDungeonRoomMonster(m) {
    if (!m) return;
    const nameEl = document.getElementById('dungeon-monster-name');
    const lvlEl = document.getElementById('dungeon-monster-level');
    if (nameEl) nameEl.textContent = m.name;
    if (lvlEl) lvlEl.textContent = `Lv. ${m.level}`;

    const spriteEl = document.getElementById('dungeon-monster-sprite');
    if (spriteEl && typeof Sprites !== 'undefined') {
      spriteEl.innerHTML = Sprites.getMonsterSvg(m.name, m.isBoss);
    }

    const curHp = Math.max(0, m.hp);
    const maxHp = m.maxHp || 1;
    const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

    const fill = document.getElementById('dungeon-monster-hp-fill');
    const text = document.getElementById('dungeon-monster-hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(maxHp)}`;
  },

  updateDungeonLootTracker() {
    const gEl = document.getElementById('track-loot-gold');
    const expEl = document.getElementById('track-loot-exp');
    const rEl = document.getElementById('track-loot-rune');
    const fEl = document.getElementById('track-loot-forge');

    if (gEl) gEl.textContent = this._formatNumber(GameState.dungeon?.goldEarned || 0);
    if (expEl) expEl.textContent = this._formatNumber(GameState.dungeon?.expEarned || 0);
    if (rEl) rEl.textContent = GameState.dungeon?.stonesEarned || 0;
    if (fEl) fEl.textContent = GameState.dungeon?.forgeDropsEarned || 0;
  },

  showDungeonWaveClearBanner() {
    const banner = document.getElementById('dungeon-wave-cleared-banner');
    if (!banner) return;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 700);
  },

  exitDungeonRoom() {
    const roomEl = document.getElementById('dungeon-active-room');
    const selView = document.getElementById('dungeon-selection-view');
    if (roomEl) roomEl.classList.add('hidden');
    if (selView) selView.classList.remove('hidden');
    this.updateDungeonTab();
  },

  // ============================================================
  // TOWER OF ASCENSION (HƯ KHÔNG THÁP - LEO THÁP VÔ TẬN)
  // ============================================================
  showTowerView() {
    const selView = document.getElementById('dungeon-selection-view');
    const roomEl = document.getElementById('dungeon-active-room');
    const towerView = document.getElementById('tower-view');

    if (selView) selView.classList.add('hidden');
    if (roomEl) roomEl.classList.add('hidden');
    if (towerView) towerView.classList.remove('hidden');

    this.updateTowerDashboard();
  },

  updateTowerDashboard() {
    const floor = GameState.dungeon?.abyssFloor || 1;
    const highest = GameState.dungeon?.towerHighestFloor || floor;

    const floorNumEl = document.getElementById('tower-current-floor-num');
    const btnFloorEl = document.getElementById('tower-btn-floor-num');
    const highestEl = document.getElementById('tower-highest-record');
    const bossAlertEl = document.getElementById('tower-next-boss-alert');

    if (floorNumEl) floorNumEl.textContent = floor;
    if (btnFloorEl) btnFloorEl.textContent = floor;
    if (highestEl) highestEl.textContent = highest;

    if (bossAlertEl) {
      if (floor % 10 === 0) {
        bossAlertEl.textContent = '🔥 CẢNH BÁO: TẦNG NÀY LÀ ĐẠI TRÙM THÁP!';
        bossAlertEl.style.color = '#ff1744';
      } else {
        const nextBossFloor = Math.ceil(floor / 10) * 10;
        bossAlertEl.textContent = `⚠️ Trùm Tháp tiếp theo: Tầng ${nextBossFloor}`;
        bossAlertEl.style.color = '#f87171';
      }
    }

    // Render Ladder Rows
    const ladderList = document.getElementById('tower-ladder-list');
    if (ladderList) {
      ladderList.innerHTML = '';
      const startF = Math.max(1, floor - 3);
      const endF = floor + 3;

      for (let f = endF; f >= startF; f--) {
        const row = document.createElement('div');
        const isCurrent = f === floor;
        const isCleared = f < floor;
        const isBoss = f % 10 === 0;

        row.className = `ladder-row ${isCurrent ? 'current-floor' : ''} ${isCleared ? 'cleared-floor' : ''} ${isBoss ? 'boss-floor' : ''}`;
        row.innerHTML = `
          <span>${isBoss ? '👑' : '🗼'} TẦNG ${f}${isBoss ? ' [ĐẠI TRÙM]' : ''}</span>
          <span>${isCurrent ? '🔥 ĐANG THÁCH ĐẤU' : (isCleared ? '✓ ĐÃ VƯỢT' : '🔒 CHƯA MỞ')}</span>
        `;
        ladderList.appendChild(row);
      }
    }
  },

  enterTowerStage(monster) {
    const stage = document.getElementById('tower-active-stage');
    if (!stage) return;
    stage.classList.remove('hidden');

    const badgeEl = document.getElementById('tower-arena-floor-badge');
    if (badgeEl) {
      badgeEl.textContent = `🗼 TẦNG ${monster.floor}${monster.isBoss ? ' • 👑 ĐẠI TRÙM THÁP' : ''}`;
    }

    this.updateTowerStagePlayer();
    this.updateTowerStageEnemy(monster);
  },

  updateTowerStagePlayer() {
    const p = GameState.player;
    if (!p) return;
    const nameEl = document.getElementById('tower-player-name');
    const lvlEl = document.getElementById('tower-player-level');
    if (nameEl) nameEl.textContent = 'Hiệp Sĩ';
    if (lvlEl) lvlEl.textContent = `Lv. ${p.level}`;

    const spriteEl = document.getElementById('tower-player-sprite');
    if (spriteEl && typeof Sprites !== 'undefined' && !spriteEl.dataset.rendered) {
      spriteEl.innerHTML = Sprites.getPlayerSvg('idle');
      spriteEl.dataset.rendered = '1';
      spriteEl.className = 'fighter-avatar player-idle';
    }

    const curHp = Math.max(0, p.currentHp);
    const maxHp = Player.getEffectiveMaxHp();
    const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

    const fill = document.getElementById('tower-player-hp-fill');
    const text = document.getElementById('tower-player-hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(maxHp)}`;

    this.updateHeroSkillsHudGeneric('tower');
  },

  updateTowerStageEnemy(m) {
    if (!m) return;
    const nameEl = document.getElementById('tower-enemy-name');
    const lvlEl = document.getElementById('tower-enemy-level');
    if (nameEl) nameEl.textContent = m.name;
    if (lvlEl) lvlEl.textContent = `Lv. ${m.level}`;

    const spriteEl = document.getElementById('tower-enemy-sprite');
    if (spriteEl && typeof Sprites !== 'undefined') {
      spriteEl.innerHTML = Sprites.getMonsterSvg(m.name, m.isBoss);
    }

    const curHp = Math.max(0, m.hp);
    const maxHp = m.maxHp || 1;
    const pct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

    const fill = document.getElementById('tower-enemy-hp-fill');
    const text = document.getElementById('tower-enemy-hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(maxHp)}`;
  },

  showTowerFloorClearBanner(floor, isBoss, diamonds, item) {
    const banner = document.getElementById('tower-floor-clear-banner');
    if (banner) {
      banner.textContent = `🎉 QUA TẦNG ${floor}! (+${diamonds} 💎)${isBoss ? ' 👑 DIỆT TRÙM THÀNH CÔNG!' : ''}`;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 1000);
    }
    if (isBoss) {
      this.showToast(`👑 Chinh phục Trùm Tháp Tầng ${floor}! Nhận +${diamonds} 💎 & Bùa Bảo Hiểm 🛡️!`);
    }
  },

  exitTowerStage() {
    const stage = document.getElementById('tower-active-stage');
    if (stage) stage.classList.add('hidden');
  },

  showDungeonVictoryPopup(rewards) {
    if (!rewards) return;
    const nameEl = document.getElementById('dungeon-victory-name');
    if (nameEl) nameEl.textContent = rewards.dungeon?.name || 'Phó Bản';

    const goldEl = document.getElementById('dungeon-victory-gold');
    if (goldEl) goldEl.textContent = `+${this._formatNumber(rewards.gold)} 💰`;

    const expEl = document.getElementById('dungeon-victory-exp');
    if (expEl) expEl.textContent = `+${this._formatNumber(rewards.exp)} ✨`;

    const stoneRow = document.getElementById('dungeon-victory-stones-row');
    const stoneEl = document.getElementById('dungeon-victory-stones');
    if (stoneRow && stoneEl) {
      if (rewards.stones > 0) {
        stoneRow.classList.remove('hidden');
        stoneEl.textContent = `+${rewards.stones} 🛡️`;
      } else {
        stoneRow.classList.add('hidden');
      }
    }

    const diamondRow = document.getElementById('dungeon-victory-diamonds-row');
    const diamondEl = document.getElementById('dungeon-victory-diamonds');
    if (diamondRow && diamondEl) {
      if (rewards.diamonds > 0) {
        diamondRow.classList.remove('hidden');
        diamondEl.textContent = `+${rewards.diamonds} 💎`;
      } else {
        diamondRow.classList.add('hidden');
      }
    }

    const popup = document.getElementById('dungeon-victory-popup');
    if (popup) popup.classList.remove('hidden');
  },

  // ============================================================
  // GENSHIN BURST ULTIMATE CINEMATIC CUTSCENE
  // ============================================================
  playBurstCinematic(skillRes) {
    if (GameState.settings && GameState.settings.vfxEnabled === false && !skillRes?.forcePreview) {
      return;
    }
    if (typeof Cinematics !== 'undefined' && Cinematics.playBurst) {
      Cinematics.playBurst(skillRes);
      return;
    }
  },

  // ============================================================
  // AUTO HERO SKILL UPGRADE & RESET HEROES
  // ============================================================
  runAutoHeroSkillUpgrade() {
    if (!GameState.autoHeroSkill) return;
    const activeId = GameState.activeHeroId || 'hero_traveler';
    const userHero = GameState.heroes?.find(h => h.id === activeId);
    if (!userHero) return;
    const heroCfg = CONFIG.getHeroById(activeId);
    if (!heroCfg?.skills) return;

    ['s1', 's2', 's3'].forEach((skKey, idx) => {
      const skLevel = userHero.skillLevels?.[skKey] || 1;
      const cost = skKey === 's1' ? skLevel * 3000 : skKey === 's2' ? skLevel * 5000 : skLevel * 10000;
      if (GameState.player && (GameState.player.gold || 0) >= cost && skLevel < 50) {
        if (Player.spendGold(cost)) {
          userHero.skillLevels[skKey] = skLevel + 1;
          if (this._currentTab === 'heroes') {
            this.updateHeroesTab();
          }
          this.updateStatusBar();
        }
      }
    });
  },

  resetHeroesDebug() {
    if (!confirm('Bạn có chắc chắn muốn Reset toàn bộ Anh Hùng về E0 Lv.1 để khắc phục lỗi từ phiên bản cũ không? (Nhân vật đã sở hữu vẫn được giữ lại)')) return;
    if (GameState.heroes) {
      GameState.heroes.forEach(h => {
        h.constellation = 0;
        h.skillLevels = { s1: 1, s2: 1, s3: 1 };
      });
      SaveManager.save();
      this.showToast('✅ Đã Reset thành công toàn bộ Nhân vật về Cung Mệnh 0 (E0)!');
      this.updateHeroesTab();
    }
  },

  // ============================================================
  // MULTI-PROFILE ACCOUNTS & SAVE MANAGEMENT
  // ============================================================
  openProfilesModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    this.updateProfilesModal();
    modal.classList.remove('hidden');
  },

  updateProfilesModal() {
    const meta = SaveManager.getProfilesMeta();
    const activeSlotId = SaveManager.getActiveSlotId();

    const badge = document.getElementById('current-slot-badge');
    if (badge) {
      badge.textContent = `Đang chơi: Slot ${activeSlotId.replace('slot_', '')}`;
    }

    const container = document.getElementById('profile-slots-list');
    if (!container) return;

    let html = '';
    meta.slots.forEach(slot => {
      const isActive = slot.id === activeSlotId;
      const isEmpty = !!slot.isEmpty;
      const hero = CONFIG.getHeroById(slot.heroId || 'hero_traveler');
      const timeStr = slot.timestamp ? new Date(slot.timestamp).toLocaleString('vi-VN') : 'Chưa có';

      html += `
        <div class="glass-panel" style="padding: 14px 16px; border-radius: 10px; border: 1px solid ${isActive ? '#10b981' : 'rgba(255,255,255,0.1)'}; background: ${isActive ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.6)'}; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 32px; width: 48px; height: 48px; border-radius: 8px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
              ${isEmpty ? '👤' : (hero?.icon || '⚔️')}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="color: ${isActive ? '#34d399' : '#f8fafc'}; font-size: 15px;">
                  ${slot.name}
                </strong>
                ${isActive ? '<span style="background: #10b981; color: #022c22; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px;">ĐANG CHƠI</span>' : ''}
                <button class="btn btn-small" onclick="UI.promptRenameProfile('${slot.id}', '${slot.name}')" style="padding: 2px 6px; font-size: 11px; background: transparent; border: 1px solid rgba(255,255,255,0.2);" title="Đổi tên nhân vật">✏️</button>
              </div>
              <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                ${isEmpty 
                  ? '<span style="color: #64748b;">(Hồ sơ trống - Sẵn sàng tạo nhân vật mới)</span>' 
                  : `Cấp: <b style="color: #60a5fa;">Lv.${slot.level}</b> | Ải: <b style="color: #fbbf24;">Ải ${slot.stage || 1}</b> | Lưu: <span style="color: #cbd5e1;">${timeStr}</span>`
                }
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            ${isActive ? `
              <span style="color: #10b981; font-size: 12px; font-weight: 600;">✓ Hoạt động</span>
            ` : `
              <button class="btn btn-primary btn-small" onclick="UI.switchProfileSlot('${slot.id}')" style="background: #2563eb; border-color: #3b82f6;">
                ${isEmpty ? '➕ Tạo & Vào Chơi' : '▶ Chuyển Sang Slot Này'}
              </button>
            `}
            ${!isActive && !isEmpty ? `
              <button class="btn btn-danger-small btn-small" onclick="UI.deleteProfileSlot('${slot.id}')" title="Xóa hồ sơ">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  promptRenameProfile(slotId, oldName) {
    const newName = prompt('Nhập tên mới cho nhân vật:', oldName);
    if (newName && newName.trim()) {
      SaveManager.renameProfile(slotId, newName);
      this.updateProfilesModal();
      this.showToast('✅ Đã đổi tên thành công!');
    }
  },

  switchProfileSlot(slotId) {
    SaveManager.switchProfile(slotId);
  },

  deleteProfileSlot(slotId) {
    SaveManager.deleteProfile(slotId);
  },

  handleExportProfile() {
    const data = SaveManager.exportProfile();
    if (!data) {
      this.showToast('⚠️ Không tìm thấy dữ liệu để xuất!');
      return;
    }
    navigator.clipboard?.writeText(data).then(() => {
      this.showToast('📋 Đã sao chép mã lưu trữ vào bộ nhớ tạm!');
      prompt('Mã sao lưu nhân vật của bạn (Đã copy):', data);
    }).catch(() => {
      prompt('Mã sao lưu nhân vật của bạn (Hãy copy đoạn mã dưới đây):', data);
    });
  },

  handleImportProfile() {
    const raw = prompt('Dán chuỗi mã lưu trữ nhân vật vào đây:');
    if (!raw || !raw.trim()) return;
    const ok = SaveManager.importProfile(null, raw.trim());
    if (ok) {
      this.showToast('🎉 Nhập dữ liệu hồ sơ thành công!');
      document.getElementById('profile-modal')?.classList.add('hidden');
    } else {
      alert('❌ Dữ liệu mã lưu trữ không hợp lệ hoặc đã bị lỗi định dạng!');
    }
  }
};
