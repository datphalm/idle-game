const UI = {
  _currentTab: 'battle',
  _selectedItemId: null,
  _enhanceTargetId: null,
  _fusionSelectedIds: [],
  _combatLogLines: [],
  _maxLogLines: 35,
  _bossListRendered: false,

  init() {
    this._ensureDynamicUiElements();

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
      btn.onclick = () => this._handleQuickCombine(btn.dataset.rarity);
    });

    // Stage navigation
    document.getElementById('btn-stage-prev')?.addEventListener('click', () => this._handleStagePrev());
    document.getElementById('btn-stage-next')?.addEventListener('click', () => this._handleStageNext());
    document.getElementById('chk-auto-stage')?.addEventListener('change', (e) => {
      if (GameState.stage) GameState.stage.autoAdvance = e.target.checked;
    });
    document.getElementById('chk-auto-burst')?.addEventListener('change', (e) => {
      if (!GameState.settings) GameState.settings = {};
      GameState.settings.autoBurst = e.target.checked;
      GameState.autoBurst = e.target.checked;
      SaveManager.save();
    });

    // Expand Inventory
    document.getElementById('btn-expand-inv')?.addEventListener('click', () => this._handleExpandInventory());

    // Auto Fusion controls
    document.getElementById('chk-auto-fusion')?.addEventListener('change', (e) => {
      if (GameState.autoFusion) GameState.autoFusion.enabled = e.target.checked;
    });
    ['common', 'rare', 'epic', 'legendary', 'mythic', 'chaos'].forEach(r => {
      const el = document.getElementById(`chk-fuse-${r}`);
      if (el) {
        el.onchange = (e) => {
          if (!GameState.autoFusion) GameState.autoFusion = { enabled: false, rarities: {} };
          GameState.autoFusion.rarities[r] = e.target.checked;
        };
      }
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
          if (overlay.id === 'offline-popup' && GameState.isOfflineModalActive) {
            GameState.isOfflineModalActive = false;
            if (typeof Combat !== 'undefined') {
              Combat.start();
              Combat._scheduleNextTurn(400);
            }
            UI.addCombatLog('⚔️ Bắt đầu cuộc phiêu lưu!', 'log-player');
          }
          overlay.classList.add('hidden');
        }
      });
    });

    // ESC key to close popups
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const off = document.getElementById('offline-popup');
        if (off && !off.classList.contains('hidden') && GameState.isOfflineModalActive) {
          GameState.isOfflineModalActive = false;
          if (typeof Combat !== 'undefined') {
            Combat.start();
            Combat._scheduleNextTurn(400);
          }
          UI.addCombatLog('⚔️ Bắt đầu cuộc phiêu lưu!', 'log-player');
        }
        document.querySelectorAll('.popup-overlay:not(.hidden)').forEach(p => p.classList.add('hidden'));
      }
    });

    // Close button on offline popup
    document.getElementById('btn-close-offline-popup')?.addEventListener('click', () => {
      document.getElementById('offline-popup').classList.add('hidden');
      if (GameState.isOfflineModalActive) {
        GameState.isOfflineModalActive = false;
        if (typeof Combat !== 'undefined') {
          Combat.start();
          Combat._scheduleNextTurn(400);
        }
        UI.addCombatLog('⚔️ Bắt đầu cuộc phiêu lưu!', 'log-player');
      }
    });

    // Popups OK buttons
    document.getElementById('btn-offline-ok').addEventListener('click', () => {
      document.getElementById('offline-popup').classList.add('hidden');
      if (GameState.isOfflineModalActive) {
        GameState.isOfflineModalActive = false;
        if (typeof Combat !== 'undefined') {
          Combat.start();
          Combat._scheduleNextTurn(400);
        }
        UI.addCombatLog('⚔️ Bắt đầu cuộc phiêu lưu!', 'log-player');
      }
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

    this.renderHeroSkillsHudLayout();
    this._renderUpgradeCards();
    this._syncAutoControls();
    this.updateVfxToggleDisplay();
    this._startSkillCooldownTicker();
  },

  renderHeroSkillsHudLayout() {
    const activeHeroId = GameState.activeHeroId || 'hero_starter';
    const isCassius = (activeHeroId === 'hero_cassius');
    const isTrisa = (activeHeroId === 'hero_trisa' || activeHeroId === 'hero_rhiannon');
    const isHilde = (activeHeroId === 'hero_hilde');
    const isHeide = (activeHeroId === 'hero_heide');
    const isMeilin = (activeHeroId === 'hero_meilin');
    const isCardBurst = (isCassius || isTrisa || isHilde || isHeide || isMeilin);
    const heroCfg = CONFIG.getHeroById(activeHeroId);
    const s2 = heroCfg?.skills?.find(s => s.type === 'active');
    const s3 = heroCfg?.skills?.find(s => s.type === 'burst') || heroCfg?.skills?.[2];

    const prefixList = [
      { pfx: 'hud', s2Id: 'hud-skill-2', s3Id: 'hud-skill-3' },
      { pfx: 'boss-hud', s2Id: 'boss-hud-skill-2', s3Id: 'boss-hud-skill-3' },
      { pfx: 'dungeon-hud', s2Id: 'dungeon-hud-skill-2', s3Id: 'dungeon-hud-skill-3' },
      { pfx: 'tower-hud', s2Id: 'tower-hud-skill-2', s3Id: 'tower-hud-skill-3' }
    ];

    prefixList.forEach(({ pfx, s2Id, s3Id }) => {
      const s2El = document.getElementById(s2Id);
      const s3El = document.getElementById(s3Id);

      // 1. Skill 2: Ẩn với các tướng thẻ bài (tự động kích hoạt trong trận đấu)
      if (s2El) {
        if (isCardBurst) {
          s2El.style.display = 'none';
        } else {
          s2El.style.display = 'flex';
          const s2Icon = document.getElementById(`${pfx}-s2-icon`);
          if (s2Icon && s2) s2Icon.textContent = s2.icon || '⚡';
        }
      }

      // 2. Skill 3: Thẻ bài Tarot cho các tướng độc bản, nút tròn tiêu chuẩn cho các tướng khác
      if (s3El) {
        if (isCardBurst) {
          let cardImg = 'assets/characters/cassius/art_skill_ultimate.png';
          let cardClass = 'card-cassius';
          if (isTrisa) {
            cardImg = 'assets/characters/trisa/art_skill_ultimate.png';
            cardClass = 'card-trisa';
          } else if (isHilde) {
            cardImg = 'assets/characters/hilde/art_skill_ultimate.png';
            cardClass = 'card-hilde';
          } else if (isHeide) {
            cardImg = 'assets/characters/heide/art_skill_ultimate.png';
            cardClass = 'card-heide';
          } else if (isMeilin) {
            cardImg = 'assets/characters/meilin/art_skill_ultimate.png';
            cardClass = 'card-meilin';
          }

          s3El.className = 'skill-hud-item skill-hud-burst-wrapper';
          s3El.innerHTML = `
            <div class="burst-card-container">
              <div class="skill-burst-card is-ready ${cardClass}" id="${pfx}-burst-card" role="button" tabindex="0">
                <div class="burst-card-inner">
                  <img src="${cardImg}" class="burst-card-img" alt="Tuyệt Kỹ Nộ" />
                  <div class="burst-card-cd-overlay" id="${pfx}-s3-fill"></div>
                  <div class="burst-card-frame"></div>
                </div>
              </div>
              <span class="burst-card-status-text" id="${pfx}-s3-timer">Sẵn sàng</span>
            </div>
          `;
        } else {
          s3El.className = 'skill-hud-item';
          s3El.innerHTML = `
            <div class="skill-hud-circle burst-circle is-ready" id="${pfx}-burst-card" role="button" tabindex="0" title="${s3?.name || 'Tuyệt Kỹ Nộ'}">
              <div class="skill-hud-fill" id="${pfx}-s3-fill"></div>
              <span class="skill-hud-icon" id="${pfx}-s3-icon">${s3?.icon || '🌟'}</span>
            </div>
            <span class="skill-hud-timer" id="${pfx}-s3-timer">Sẵn sàng</span>
          `;
        }
      }
    });

    this.updateHeroGroundCircles(activeHeroId);
    this._bindBurstCardEvents();
  },

  updateHeroGroundCircles(heroId) {
    const rawId = heroId || (typeof GameState !== 'undefined' && GameState.activeHeroId) || 'hero_starter';
    const idMap = {
      hero_traveler: 'hero_starter',
      hero_kazuha: 'hero_shadow_rogue',
      hero_furina: 'hero_frost_knight',
      hero_zhongli: 'hero_spear_lancer',
      hero_jiyan: 'hero_spear_lancer',
      hero_amber: 'hero_flame_knight',
      hero_changli: 'hero_flame_knight',
      hero_raiden: 'hero_arcane_mage'
    };
    const targetId = idMap[rawId] || rawId;
    const heroCfg = typeof CONFIG !== 'undefined' ? CONFIG.getHeroById(targetId) : null;

    const themes = {
      hero_cassius: {
        primary: '#ffd700',
        secondary: '#f59e0b',
        dark: '#ca8a04',
        glow: 'rgba(255, 215, 0, 0.85)',
        stroke1: 'rgba(255, 215, 0, 0.45)',
        stroke2: 'rgba(255, 215, 0, 0.75)'
      },
      hero_trisa: {
        primary: '#ef4444',
        secondary: '#dc2626',
        dark: '#991b1b',
        glow: 'rgba(239, 68, 68, 0.9)',
        stroke1: 'rgba(239, 68, 68, 0.45)',
        stroke2: 'rgba(220, 38, 38, 0.85)'
      },
      hero_hilde: {
        primary: '#38bdf8',
        secondary: '#0284c7',
        dark: '#0369a1',
        glow: 'rgba(56, 189, 248, 0.9)',
        stroke1: 'rgba(56, 189, 248, 0.45)',
        stroke2: 'rgba(14, 165, 233, 0.85)'
      },
      hero_heide: {
        primary: '#c084fc',
        secondary: '#a855f7',
        dark: '#7e22ce',
        glow: 'rgba(192, 132, 252, 0.9)',
        stroke1: 'rgba(192, 132, 252, 0.45)',
        stroke2: 'rgba(168, 85, 247, 0.85)'
      },
      hero_meilin: {
        primary: '#34d399',
        secondary: '#10b981',
        dark: '#059669',
        glow: 'rgba(52, 211, 153, 0.9)',
        stroke1: 'rgba(52, 211, 153, 0.45)',
        stroke2: 'rgba(16, 185, 129, 0.85)'
      },
      hero_starter: {
        primary: '#cbd5e1',
        secondary: '#94a3b8',
        dark: '#64748b',
        glow: 'rgba(203, 213, 225, 0.8)',
        stroke1: 'rgba(203, 213, 225, 0.45)',
        stroke2: 'rgba(148, 163, 184, 0.8)'
      },
      hero_shadow_rogue: {
        primary: '#60a5fa',
        secondary: '#3b82f6',
        dark: '#1d4ed8',
        glow: 'rgba(96, 165, 250, 0.85)',
        stroke1: 'rgba(96, 165, 250, 0.45)',
        stroke2: 'rgba(59, 130, 246, 0.85)'
      },
      hero_frost_knight: {
        primary: '#00e5ff',
        secondary: '#00b4d8',
        dark: '#0077b6',
        glow: 'rgba(0, 229, 255, 0.9)',
        stroke1: 'rgba(0, 229, 255, 0.45)',
        stroke2: 'rgba(0, 180, 216, 0.85)'
      },
      hero_spear_lancer: {
        primary: '#facc15',
        secondary: '#eab308',
        dark: '#ca8a04',
        glow: 'rgba(250, 204, 21, 0.85)',
        stroke1: 'rgba(250, 204, 21, 0.45)',
        stroke2: 'rgba(234, 179, 8, 0.85)'
      },
      hero_flame_knight: {
        primary: '#ff5722',
        secondary: '#f97316',
        dark: '#c2410c',
        glow: 'rgba(255, 87, 34, 0.9)',
        stroke1: 'rgba(255, 87, 34, 0.45)',
        stroke2: 'rgba(249, 115, 22, 0.85)'
      },
      hero_arcane_mage: {
        primary: '#d8b4fe',
        secondary: '#b026ff',
        dark: '#7c3aed',
        glow: 'rgba(176, 38, 255, 0.9)',
        stroke1: 'rgba(216, 180, 254, 0.45)',
        stroke2: 'rgba(176, 38, 255, 0.85)'
      },
      hero_aetheris: {
        primary: '#38bdf8',
        secondary: '#00e5ff',
        dark: '#0284c7',
        glow: 'rgba(0, 229, 255, 0.9)',
        stroke1: 'rgba(56, 189, 248, 0.45)',
        stroke2: 'rgba(0, 229, 255, 0.85)'
      }
    };

    const t = themes[targetId] || {
      primary: heroCfg?.elementColor || '#ffd700',
      secondary: heroCfg?.elementColor || '#f59e0b',
      dark: '#1e293b',
      glow: (heroCfg?.elementColor || '#ffd700') + 'dd',
      stroke1: (heroCfg?.elementColor || '#ffd700') + '77',
      stroke2: (heroCfg?.elementColor || '#ffd700') + 'cc'
    };

    const circleSvg = `
      <svg viewBox="0 0 160 50" width="100%" height="100%" class="stationary-ground-svg" style="filter: drop-shadow(0 0 10px ${t.glow});">
        <defs>
          <radialGradient id="hero-ground-grad-${targetId}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${t.primary}" stop-opacity="0.38"/>
            <stop offset="65%" stop-color="${t.secondary}" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="${t.dark}" stop-opacity="0"/>
          </radialGradient>
          <filter id="ground-ring-glow-${targetId}">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="${t.primary}" flood-opacity="0.9"/>
          </filter>
        </defs>
        <ellipse cx="80" cy="25" rx="72" ry="20" fill="url(#hero-ground-grad-${targetId})"/>
        <ellipse cx="80" cy="25" rx="66" ry="17" fill="none" stroke="${t.stroke1}" stroke-width="1.5" stroke-dasharray="6,4" filter="url(#ground-ring-glow-${targetId})"/>
        <ellipse cx="80" cy="25" rx="52" ry="13" fill="none" stroke="${t.stroke2}" stroke-width="1.8"/>
        <circle cx="14" cy="25" r="2.2" fill="${t.primary}"/>
        <circle cx="146" cy="25" r="2.2" fill="${t.primary}"/>
      </svg>
    `;

    ['player-ground-circle', 'boss-player-ground-circle', 'dungeon-player-ground-circle', 'tower-player-ground-circle'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = circleSvg;
    });
  },

  _bindBurstCardEvents() {
    const cardSelectors = [
      { cardId: 'hud-burst-card' },
      { cardId: 'boss-burst-card' },
      { cardId: 'dungeon-burst-card' },
      { cardId: 'tower-burst-card' }
    ];

    cardSelectors.forEach(({ cardId }) => {
      const cardEl = document.getElementById(cardId);
      if (!cardEl) return;

      // Mouse Hover Preview (For Cassius, Trisa, Hilde, Heide, Mei Lin!)
      cardEl.onmouseenter = () => {
        const curHero = GameState.activeHeroId;
        const validHeroes = ['hero_cassius', 'hero_trisa', 'hero_rhiannon', 'hero_hilde', 'hero_heide', 'hero_meilin'];
        if (!validHeroes.includes(curHero)) return;
        const showcase = document.getElementById('hero-hover-showcase');
        if (!showcase) return;

        const charImg = showcase.querySelector('.showcase-character-img');
        const titleSpan = showcase.querySelector('.showcase-roman-title');
        const kanjiSpan = showcase.querySelector('.showcase-jp-kanji');
        const quoteSpan = showcase.querySelector('.showcase-jp-quote');

        showcase.classList.remove('showcase-cassius', 'showcase-trisa', 'showcase-hilde', 'showcase-heide', 'showcase-meilin');

        if (curHero === 'hero_trisa' || curHero === 'hero_rhiannon') {
          showcase.classList.add('showcase-trisa');
          if (charImg) charImg.src = 'assets/characters/trisa/hover_3d_idle.webp';
          if (titleSpan) titleSpan.textContent = 'TRISA · HẮC ÁM NỮ HOÀNG';
          if (kanjiSpan) kanjiSpan.textContent = 'トリサ · 深淵の影刃';
          if (quoteSpan) quoteSpan.textContent = '『血の月が昇るとき、影より現れ魂を刈り取る』';
        } else if (curHero === 'hero_hilde') {
          showcase.classList.add('showcase-hilde');
          if (charImg) charImg.src = 'assets/characters/hilde/hover_3d_idle.webp';
          if (titleSpan) titleSpan.textContent = 'HILDE · THÁNH KỴ SĨ BĂNG GIÁ';
          if (kanjiSpan) kanjiSpan.textContent = 'ヒルデ · 極寒の聖女';
          if (quoteSpan) quoteSpan.textContent = '『凍てつく刃が、悪しき魂を裁く！』';
        } else if (curHero === 'hero_heide') {
          showcase.classList.add('showcase-heide');
          if (charImg) charImg.src = 'assets/characters/heide/hover_3d_idle.webp';
          if (titleSpan) titleSpan.textContent = 'HEIDE · THIÊN PHONG LÔI ĐAO';
          if (kanjiSpan) kanjiSpan.textContent = 'ハイデ · 迅雷の疾風';
          if (quoteSpan) quoteSpan.textContent = '『風が叫び、雷が切り裂く！』';
        } else if (curHero === 'hero_meilin') {
          showcase.classList.add('showcase-meilin');
          if (charImg) charImg.src = 'assets/characters/meilin/hover_3d_idle.webp';
          if (titleSpan) titleSpan.textContent = 'MEI LIN · BÁ VƯƠNG LONG QUYỀN';
          if (kanjiSpan) kanjiSpan.textContent = 'メイリン · 蒼龍の拳聖';
          if (quoteSpan) quoteSpan.textContent = '『龍の怒りを受けよ！破天一撃！』';
        } else {
          showcase.classList.add('showcase-cassius');
          if (charImg) charImg.src = 'assets/characters/cassius/hover_3d_idle.webp';
          if (titleSpan) titleSpan.textContent = 'CASSIUS · BÀN CƯỢC HOÀNG KIM';
          if (kanjiSpan) kanjiSpan.textContent = 'カシウス · 黄金の賭場';
          if (quoteSpan) quoteSpan.textContent = '『運命をベットしろ、全てを奪うか、全てを失うか』';
        }
        showcase.classList.add('showcase-active');
      };

      cardEl.onmouseleave = () => {
        const showcase = document.getElementById('hero-hover-showcase');
        if (showcase) showcase.classList.remove('showcase-active');
      };

      // Manual Activation Click
      cardEl.onclick = (e) => {
        e.stopPropagation();
        this.handleManualBurstClick();
      };
    });
  },

  handleManualBurstClick() {
    const res = Player.triggerManualBurst();
    if (!res.success) {
      if (res.reason === 'cooldown') {
        this.showToast(`⏳ Tuyệt kỹ đang hồi chiêu (${res.remainingSec}s)!`);
        document.querySelectorAll('.skill-burst-card').forEach(c => {
          c.classList.remove('shake-card');
          void c.offsetWidth;
          c.classList.add('shake-card');
        });
      }
      return;
    }

    // Dismiss 3D hover preview and left-side showcase immediately on click
    document.querySelectorAll('.burst-card-3d-preview').forEach(p => p.classList.remove('preview-active'));
    const showcase = document.getElementById('hero-hover-showcase');
    if (showcase) showcase.classList.remove('showcase-active');

    // Trigger turn immediately if combat is running
    if (typeof Combat !== 'undefined' && Combat.isRunning && !Combat._isReviving && !(typeof Cinematics !== 'undefined' && Cinematics.active)) {
      if (Combat._timer) {
        clearTimeout(Combat._timer);
        Combat._timer = null;
      }
      Combat.step();
    } else if (typeof Boss !== 'undefined' && GameState.boss?.active && !(typeof Cinematics !== 'undefined' && Cinematics.active)) {
      Boss._stepFight();
    }

    this.updateSkillCooldowns();
  },

  _startSkillCooldownTicker() {
    if (this._skillTickerInterval) clearInterval(this._skillTickerInterval);
    this._skillTickerInterval = setInterval(() => {
      this.updateSkillCooldowns();
    }, 60);
  },

  _syncAutoGachaControls() {
    this._ensureDynamicUiElements();
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

  _ensureDynamicUiElements() {
    // 1. Tùy chọn Quay x1000 trong #sel-auto-gacha-batch
    const selBatch = document.getElementById('sel-auto-gacha-batch');
    if (selBatch && !selBatch.querySelector('option[value="1000"]')) {
      const opt = document.createElement('option');
      opt.value = '1000';
      opt.textContent = 'Quay ×1000 (Tiết kiệm 20%)';
      selBatch.appendChild(opt);
    }

    // 2. Tùy chọn dừng Gacha trong #sel-auto-gacha-stop
    const selStop = document.getElementById('sel-auto-gacha-stop');
    if (selStop) {
      const stopOptions = [
        { val: 'none', text: 'Không dừng (Quay đến hết tiền/chỗ)' },
        { val: 'legendary', text: 'Huyền Thoại (Cam) trở lên' },
        { val: 'mythic', text: 'Thần Thoại (Đỏ) trở lên' },
        { val: 'chaos', text: 'Hỗn Mang (Tím Đậm) trở lên' },
        { val: 'unknown', text: '??? (Vô Cực)' }
      ];
      stopOptions.forEach(item => {
        if (!selStop.querySelector(`option[value="${item.val}"]`)) {
          const opt = document.createElement('option');
          opt.value = item.val;
          opt.textContent = item.text;
          selStop.appendChild(opt);
        }
      });
    }

    // 3. Nút bấm Quay x1000 trong #gacha-buttons
    const gachaBtns = document.getElementById('gacha-buttons');
    if (gachaBtns) {
      let btn1000 = document.getElementById('btn-gacha-1000');
      if (!btn1000) {
        btn1000 = document.createElement('button');
        btn1000.className = 'btn btn-gacha btn-gacha-1000';
        btn1000.id = 'btn-gacha-1000';
        btn1000.innerHTML = `
          <span class="gacha-btn-label">Quay ×1000</span>
          <span class="gacha-btn-cost" id="gacha-cost-1000">💰 80,000</span>
          <span class="gacha-discount">-20% Đại Gia</span>
        `;
        gachaBtns.appendChild(btn1000);
      }
      btn1000.onclick = () => this._handleGachaPull(1000);
    }

    // 4. Các checkbox Tự Động Dung Hợp trong #forge-sub-fusion
    const forgeFusion = document.getElementById('forge-sub-fusion');
    const autoChkRow = forgeFusion ? forgeFusion.querySelector('.auto-checkboxes-row') : document.querySelector('.auto-checkboxes-row');
    if (autoChkRow) {
      const fuseTiers = [
        { id: 'chk-fuse-common', rarity: 'common', html: '<span>Thường ➔ Hiếm</span>' },
        { id: 'chk-fuse-rare', rarity: 'rare', html: '<span>Hiếm ➔ Sử Thi</span>' },
        { id: 'chk-fuse-epic', rarity: 'epic', html: '<span>Sử Thi ➔ Huyền Thoại</span>' },
        { id: 'chk-fuse-legendary', rarity: 'legendary', html: '<span>Huyền Thoại ➔ Thần Thoại</span>' },
        { id: 'chk-fuse-mythic', rarity: 'mythic', html: '<span style="color:#f87171; font-weight:700;">Thần Thoại ➔ Hỗn Mang</span>' },
        { id: 'chk-fuse-chaos', rarity: 'chaos', html: '<span style="color:#c084fc; font-weight:800;">Hỗn Mang ➔ ???</span>' }
      ];
      fuseTiers.forEach(t => {
        let chk = document.getElementById(t.id);
        if (!chk) {
          const label = document.createElement('label');
          label.className = 'chk-item';
          label.innerHTML = `<input type="checkbox" id="${t.id}"> ${t.html}`;
          autoChkRow.appendChild(label);
          chk = label.querySelector('input');
        }
        chk.onchange = (e) => {
          if (!GameState.autoFusion) GameState.autoFusion = { enabled: false, rarities: {} };
          GameState.autoFusion.rarities[t.rarity] = e.target.checked;
        };
      });
    }

    // 5. Nút Ghép Nhanh Hàng Loạt trong .quick-combine-btns
    const quickCombineContainer = forgeFusion ? forgeFusion.querySelector('.quick-combine-btns') : document.querySelector('.quick-combine-btns');
    if (quickCombineContainer) {
      const quickBtns = [
        { rarity: 'common', text: 'Thường ➔ Hiếm' },
        { rarity: 'rare', text: 'Hiếm ➔ Sử Thi' },
        { rarity: 'epic', text: 'Sử Thi ➔ Huyền Thoại' },
        { rarity: 'legendary', text: 'Huyền Thoại ➔ Thần Thoại', style: 'border-color:#f59e0b; color:#fbbf24;' },
        { rarity: 'mythic', text: 'Thần Thoại ➔ Hỗn Mang', style: 'border-color:#ef4444; color:#f87171;' },
        { rarity: 'chaos', text: 'Hỗn Mang ➔ ???', style: 'border-color:#a855f7; color:#c084fc;' }
      ];
      quickBtns.forEach(qb => {
        let btn = quickCombineContainer.querySelector(`.btn-quick-combine[data-rarity="${qb.rarity}"]`);
        if (!btn) {
          btn = document.createElement('button');
          btn.className = 'btn btn-small btn-secondary btn-quick-combine';
          btn.dataset.rarity = qb.rarity;
          if (qb.style) btn.style.cssText = qb.style;
          btn.textContent = qb.text;
          quickCombineContainer.appendChild(btn);
        }
        btn.onclick = () => this._handleQuickCombine(qb.rarity);
      });
    }

    // 6. Bán Nhanh Theo Phẩm Chất trong Tab Kho Đồ
    const invControls = document.querySelector('#tab-inventory .inventory-controls') || document.querySelector('#tab-inventory .tab-header-actions') || document.getElementById('btn-sort-inv')?.parentElement;
    if (invControls && !document.getElementById('btn-quick-sell-rarity')) {
      const wrap = document.createElement('div');
      wrap.className = 'quick-sell-wrapper';
      wrap.style.cssText = 'display:inline-flex; align-items:center; gap:4px; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); margin-right:6px;';
      wrap.innerHTML = `
        <span style="font-size:11px; color:#94a3b8;">Bán nhanh:</span>
        <select id="sel-quick-sell-rarity" class="custom-select" style="font-size:11px; padding:2px 4px; height:26px;">
          <option value="common">Chỉ Đồ Thường (Trắng)</option>
          <option value="common,rare" selected>Thường + Hiếm (Trắng & Lam)</option>
          <option value="common,rare,epic">Sử Thi trở xuống (Tím/Lam/Trắng)</option>
        </select>
        <button id="btn-quick-sell-rarity" class="btn btn-small btn-danger" style="padding:2px 8px; font-size:11px;" title="Bán tất cả trang bị theo phẩm chất đã chọn">💰 Bán</button>
      `;
      const btnSell = wrap.querySelector('#btn-quick-sell-rarity');
      btnSell.onclick = () => {
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
      };
      invControls.insertBefore(wrap, invControls.firstChild);
    }

    // 7. Tự Động Nâng Kỹ Năng trong Tab Nhân Vật
    const tabHeroes = document.getElementById('tab-heroes');
    if (tabHeroes && !document.getElementById('chk-auto-hero-skill')) {
      const skillBar = document.createElement('div');
      skillBar.className = 'glass-panel auto-hero-skill-bar';
      skillBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:10px 14px;';
      skillBar.innerHTML = `
        <label class="toggle-switch-label" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="chk-auto-hero-skill">
          <span class="toggle-title" style="font-size:13px; color:#f1f5f9;">⚡ <strong>Tự Động Nâng Kỹ Năng</strong> (Tự tiêu vàng nâng skill khi đủ điều kiện)</span>
        </label>
        <button id="btn-reset-heroes-debug" class="btn btn-small btn-danger" title="Khắc phục nhân vật bị lỗi max C6 từ phiên bản cũ">🔄 Reset Cung Mệnh Nhân Vật</button>
      `;
      const chkSkill = skillBar.querySelector('#chk-auto-hero-skill');
      chkSkill.onchange = (e) => {
        GameState.autoHeroSkill = e.target.checked;
      };
      const btnReset = skillBar.querySelector('#btn-reset-heroes-debug');
      btnReset.onclick = () => {
        if (confirm('Bạn có chắc chắn muốn reset toàn bộ Cung Mệnh (E0) của nhân vật? Vàng nâng cấp sẽ không được hoàn trả.')) {
          if (GameState.heroes) {
            GameState.heroes.forEach(h => {
              h.constellation = 0;
            });
            this.showToast('✅ Đã reset toàn bộ tướng về Cung Mệnh E0!');
            this.updateHeroesTab();
            SaveSystem.save();
          }
        }
      };
      tabHeroes.insertBefore(skillBar, tabHeroes.firstChild);
    }

    // 8. Nút Đổi Tên & Làm Mới trong Leaderboard Modal
    const lbModal = document.getElementById('leaderboard-modal');
    if (lbModal && !document.getElementById('btn-lb-rename')) {
      const filterRow = lbModal.querySelector('.btn-lb-tab')?.parentElement;
      if (filterRow && !filterRow.querySelector('.lb-action-btns')) {
        const actDiv = document.createElement('div');
        actDiv.className = 'lb-action-btns';
        actDiv.style.cssText = 'display:flex; gap:6px; margin-left:auto;';
        actDiv.innerHTML = `
          <button id="btn-lb-rename" class="btn btn-small btn-secondary" style="font-size:11px; padding:3px 8px;" title="Đổi tên nhân vật hiển thị trên BXH">✏️ Đổi Tên</button>
          <button id="btn-lb-refresh" class="btn btn-small btn-secondary" style="font-size:11px; padding:3px 8px;" title="Làm mới BXH từ Cloud">🔄 Làm Mới</button>
        `;
        actDiv.querySelector('#btn-lb-rename').onclick = () => Leaderboard.promptRename();
        actDiv.querySelector('#btn-lb-refresh').onclick = () => Leaderboard.refresh();
        filterRow.appendChild(actDiv);
      }
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
    if (this._currentHeroLayoutId !== GameState.activeHeroId) {
      this._currentHeroLayoutId = GameState.activeHeroId;
      this.renderHeroSkillsHudLayout();
    }
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

    const chkAutoBurst = document.getElementById('chk-auto-burst');
    if (chkAutoBurst) chkAutoBurst.checked = !!(GameState.settings?.autoBurst ?? GameState.autoBurst ?? true);
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

    const prefixMap = [
      { pfx: 'hud', cardId: 'hud-burst-card' },
      { pfx: 'boss-hud', cardId: 'boss-burst-card' },
      { pfx: 'dungeon-hud', cardId: 'dungeon-burst-card' },
      { pfx: 'tower-hud', cardId: 'tower-burst-card' }
    ];

    prefixMap.forEach(({ pfx, cardId }) => {
      // Skill 2
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

      // Skill 3 (Burst Card)
      const cardEl = document.getElementById(cardId);
      const s3Fill = document.getElementById(`${pfx}-s3-fill`);
      const s3Timer = document.getElementById(`${pfx}-s3-timer`);

      if (progress.s3.ready) {
        if (cardEl) {
          cardEl.classList.add('is-ready');
          cardEl.classList.remove('is-charging');
        }
        if (s3Fill) s3Fill.style.height = '0%';
        const isCardHud = (heroCfg.id === 'hero_cassius' || heroCfg.id === 'hero_trisa' || heroCfg.id === 'hero_rhiannon' || heroCfg.id === 'hero_hilde' || heroCfg.id === 'hero_heide' || heroCfg.id === 'hero_meilin');
        if (s3Timer) {
          s3Timer.textContent = 'Sẵn sàng';
          s3Timer.className = isCardHud ? 'burst-card-status-text skill-ready' : 'skill-hud-timer skill-ready';
        }
      } else {
        if (cardEl) {
          cardEl.classList.remove('is-ready');
          cardEl.classList.add('is-charging');
        }
        if (s3Fill) s3Fill.style.height = `${100 - progress.s3.pct}%`;
        const isCardHud = (heroCfg.id === 'hero_cassius' || heroCfg.id === 'hero_trisa' || heroCfg.id === 'hero_rhiannon' || heroCfg.id === 'hero_hilde' || heroCfg.id === 'hero_heide' || heroCfg.id === 'hero_meilin');
        if (s3Timer) {
          s3Timer.textContent = `${progress.s3.remainingSec}s`;
          s3Timer.className = isCardHud ? 'burst-card-status-text' : 'skill-hud-timer';
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
    this._ensureDynamicUiElements();
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
    // Nếu nhân vật đang trong hoạt ảnh chém vũ khí hoặc dùng skill hoặc đang chiếu Cinematic, không bị ghi đè bởi idle
    if ((this._isPlayerAnimating || (typeof Cinematics !== 'undefined' && Cinematics.active)) && action === 'idle') {
      return;
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
    if (mSprite && !(typeof Cinematics !== 'undefined' && Cinematics.active)) {
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

  showDamageNumber(amount, isCrit, target, isBurst = false) {
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
    const critClass = isBurst ? 'damage-burst' : (isCrit ? 'damage-crit' : '');
    el.className = `damage-number ${isTargetPlayer ? 'damage-player' : 'damage-monster'} ${critClass}`;
    el.textContent = `-${this._formatNumber(amount)}`;
    el.style.left = `calc(50% + ${Math.random() * 40 - 20}px)`;
    el.style.top = `${Math.random() * 10}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), isBurst ? 1300 : 850);
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
    if (typeof Cinematics !== 'undefined' && Cinematics.active) return;
    const isBoss = GameState.boss?.active;
    const bannerId = isBoss ? 'boss-extra-turn-banner' : 'extra-turn-banner';
    const banner = document.getElementById(bannerId);
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 1200);
    }

    const pSpriteId = isBoss ? 'boss-player-sprite' : 'player-sprite';
    const pSprite = document.getElementById(pSpriteId);
    const activeHero = GameState.activeHeroId || 'hero_starter';
    const isSpecialHero = (activeHero === 'hero_cassius' || activeHero === 'hero_trisa' || activeHero === 'hero_rhiannon' || activeHero === 'hero_hilde' || activeHero === 'hero_heide' || activeHero === 'hero_meilin');
    if (pSprite && typeof Sprites !== 'undefined') {
      let extraAction = 'extra';
      if (activeHero === 'hero_trisa' || activeHero === 'hero_rhiannon') extraAction = 'attack5';
      else if (activeHero === 'hero_hilde') extraAction = 'attack3';
      else if (activeHero === 'hero_heide') extraAction = 'attack4';
      else if (activeHero === 'hero_meilin') extraAction = 'attack4';
      else if (activeHero === 'hero_cassius') extraAction = 'attack';

      pSprite.innerHTML = Sprites.getPlayerSvg(extraAction, activeHero);
      pSprite.className = isSpecialHero
        ? 'fighter-avatar player-attack-anim'
        : `fighter-avatar player-extra-anim hero-extra-${activeHero}`;
      clearTimeout(this._playerAnimTimer);
      const extraDuration = (activeHero === 'hero_trisa' || activeHero === 'hero_rhiannon') ? 650 : 540;
      this._playerAnimTimer = setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle', activeHero);
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, extraDuration);
    }
    if (!isSpecialHero) {
      const targetSlash = isBoss ? 'slash-fx-boss' : 'slash-fx-monster';
      this._triggerSlashFx(targetSlash, 'extra');
    }
  },

  animatePlayerAttack(mode) {
    if (typeof Cinematics !== 'undefined' && Cinematics.active) return;
    this._isPlayerAnimating = true;
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
    const activeHero = GameState.activeHeroId || 'hero_starter';

    if (!this._attackComboCounts) this._attackComboCounts = {};
    const curCombo = this._attackComboCounts[activeHero] || 0;
    this._attackComboCounts[activeHero] = curCombo + 1;

    let atkAction = 'attack';
    let attackDuration = 340;

    if (activeHero === 'hero_trisa' || activeHero === 'hero_rhiannon') {
      const step = curCombo % 5;
      if (step === 0) {
        atkAction = 'attack';
        attackDuration = 520;
      } else if (step === 1) {
        atkAction = 'attack2';
        attackDuration = 540;
      } else if (step === 2) {
        atkAction = 'attack3';
        attackDuration = 560;
      } else if (step === 3) {
        atkAction = 'attack4';
        attackDuration = 560;
      } else {
        atkAction = 'attack5';
        attackDuration = 620;
      }
    } else if (activeHero === 'hero_hilde') {
      const step = curCombo % 5;
      if (step === 0) {
        atkAction = 'attack';
        attackDuration = 500;
      } else if (step === 1) {
        atkAction = 'attack2';
        attackDuration = 520;
      } else if (step === 2) {
        atkAction = 'attack3';
        attackDuration = 540;
      } else if (step === 3) {
        atkAction = 'attack4';
        attackDuration = 520;
      } else {
        atkAction = 'attack5';
        attackDuration = 560;
      }
    } else if (activeHero === 'hero_heide') {
      const step = curCombo % 5;
      if (step === 0) {
        atkAction = 'attack';
        attackDuration = 520;
      } else if (step === 1) {
        atkAction = 'attack2';
        attackDuration = 500;
      } else if (step === 2) {
        atkAction = 'attack3';
        attackDuration = 540;
      } else if (step === 3) {
        atkAction = 'attack4';
        attackDuration = 560;
      } else {
        atkAction = 'attack5';
        attackDuration = 600;
      }
    } else if (activeHero === 'hero_meilin') {
      const step = curCombo % 5;
      if (step === 0) {
        atkAction = 'attack';
        attackDuration = 480;
      } else if (step === 1) {
        atkAction = 'attack2';
        attackDuration = 520;
      } else if (step === 2) {
        atkAction = 'attack3';
        attackDuration = 520;
      } else if (step === 3) {
        atkAction = 'attack4';
        attackDuration = 540;
      } else {
        atkAction = 'attack5';
        attackDuration = 580;
      }
    }

    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.innerHTML = Sprites.getPlayerSvg(atkAction, activeHero);
      pSprite.className = `fighter-avatar player-attack-anim hero-attack-${activeHero} action-${atkAction}`;
      clearTimeout(this._playerAnimTimer);
      this._playerAnimTimer = setTimeout(() => {
        this._isPlayerAnimating = false;
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle', activeHero);
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, attackDuration);
    }
    const hasEmbeddedVfx = (activeHero === 'hero_cassius' || activeHero === 'hero_trisa' || activeHero === 'hero_rhiannon' || activeHero === 'hero_hilde' || activeHero === 'hero_heide' || activeHero === 'hero_meilin');
    if (!hasEmbeddedVfx) {
      const slashType = 'normal';
      this._triggerSlashFx(targetSlash, slashType);
    }
  },

  animatePlayerHit(mode) {
    if (typeof Cinematics !== 'undefined' && Cinematics.active) return;
    let pSpriteId = 'player-sprite';
    if (mode === 'dungeon') pSpriteId = 'dungeon-player-sprite';
    else if (mode === 'tower') pSpriteId = 'tower-player-sprite';
    else if (GameState.boss?.active) pSpriteId = 'boss-player-sprite';

    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      const activeHero = GameState.activeHeroId || 'hero_starter';
      pSprite.innerHTML = Sprites.getPlayerSvg('hit', activeHero);
      pSprite.className = 'fighter-avatar hit-flash';
      setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle', activeHero);
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 280);
    } else {
      this._triggerAnim(pSpriteId, 'hit-flash');
    }
  },

  animatePlayerSkill(mode, skillType = 'skill') {
    if (typeof Cinematics !== 'undefined' && Cinematics.active && skillType === 'burst') return;
    this._isPlayerAnimating = true;
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
    const activeHero = GameState.activeHeroId || 'hero_starter';
    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.innerHTML = Sprites.getPlayerSvg(skillType === 'burst' ? 'burst' : 'skill', activeHero);
      pSprite.className = `fighter-avatar player-skill-anim`;
      clearTimeout(this._playerAnimTimer);
      const duration = skillType === 'burst' ? 950 : 750;
      this._playerAnimTimer = setTimeout(() => {
        this._isPlayerAnimating = false;
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle', activeHero);
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, duration);
    }
    const hasEmbeddedVfx = (activeHero === 'hero_cassius' || activeHero === 'hero_trisa' || activeHero === 'hero_rhiannon' || activeHero === 'hero_hilde' || activeHero === 'hero_heide' || activeHero === 'hero_meilin');
    if (!hasEmbeddedVfx) {
      this._triggerSlashFx(targetSlash, skillType === 'burst' ? 'burst' : 'skill');
    }
  },

  animatePlayerWalk(mode, duration = 600) {
    if (typeof Cinematics !== 'undefined' && Cinematics.active) return;
    let pSpriteId = 'player-sprite';
    if (mode === 'dungeon') pSpriteId = 'dungeon-player-sprite';
    else if (mode === 'tower') pSpriteId = 'tower-player-sprite';
    else if (GameState.boss?.active) pSpriteId = 'boss-player-sprite';

    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      const activeHero = GameState.activeHeroId || 'hero_starter';
      const delay = this._isPlayerAnimating ? 140 : 0;
      setTimeout(() => {
        this._isPlayerAnimating = false;
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('walk', activeHero);
          pSprite.className = `fighter-avatar player-walk-anim`;
          clearTimeout(this._playerAnimTimer);
          this._playerAnimTimer = setTimeout(() => {
            if (pSprite) {
              pSprite.innerHTML = Sprites.getPlayerSvg('idle', activeHero);
              pSprite.className = 'fighter-avatar player-idle';
            }
          }, duration);
        }
      }, delay);
    }
  },

  animatePlayerDeath(mode) {
    let pSpriteId = 'player-sprite';
    if (mode === 'dungeon') pSpriteId = 'dungeon-player-sprite';
    else if (mode === 'tower') pSpriteId = 'tower-player-sprite';
    else if (GameState.boss?.active) pSpriteId = 'boss-player-sprite';

    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.innerHTML = Sprites.getPlayerSvg('death');
      pSprite.className = `fighter-avatar player-death-anim`;
    }
  },

  animateMonsterAttack(mode) {
    if (typeof Cinematics !== 'undefined' && Cinematics.active) return;
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

  animateMonsterHit(mode, force = false) {
    const isEndingPhase = document.getElementById('arena-stage')?.classList.contains('phase-3-sheathe');
    if (typeof Cinematics !== 'undefined' && Cinematics.active && !isEndingPhase && !force) return;
    if (mode === 'dungeon') {
      this._triggerAnim('dungeon-monster-sprite', 'hit-flash', force);
    } else if (mode === 'tower') {
      this._triggerAnim('tower-enemy-sprite', 'hit-flash', force);
    } else {
      this._triggerAnim('monster-sprite', 'hit-flash', force);
    }
  },

  animateBossAttack() {
    this._triggerAnim('boss-active-sprite', 'monster-attack-anim');
    this._triggerSlashFx('boss-player-slash-fx', 'normal');
  },

  animateBossHit(force = false) {
    this._triggerAnim('boss-active-sprite', 'hit-flash', force);
    this._triggerSlashFx('slash-fx-boss', 'normal');
  },

  _triggerSlashFx(containerId, type = 'normal') {
    // Tắt toàn bộ hiệu ứng vệt chém theo yêu cầu người dùng
    return;
  },


  _triggerAnim(elementId, className, force = false) {
    const isEndingPhase = document.getElementById('arena-stage')?.classList.contains('phase-3-sheathe');
    if (typeof Cinematics !== 'undefined' && Cinematics.active && !isEndingPhase && !force && (elementId === 'player-sprite' || elementId === 'monster-sprite')) return;
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
    const activeHeroId = GameState.activeHeroId || 'hero_starter';
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
    this._ensureDynamicUiElements();
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
      el.innerHTML = '<div class="empty-slot-socket"><span class="empty-slot-glyph">◇</span></div>';
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
    this._ensureDynamicUiElements();
    this._syncAutoControls();
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
    this._ensureDynamicUiElements();
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
    this._ensureDynamicUiElements();
    const chk = document.getElementById('chk-auto-hero-skill');
    if (chk) chk.checked = !!GameState.autoHeroSkill;
    this._renderHeroShowcase();
    this._renderHeroCollection();
  },

  _renderHeroShowcase() {
    const container = document.getElementById('active-hero-showcase');
    if (!container) return;

    const activeId = GameState.activeHeroId || 'hero_starter';
    const heroCfg = CONFIG.getHeroById(activeId);
    const userHero = GameState.heroes?.find(h => h.id === activeId) || { constellation: 0, skillLevels: { s1: 1, s2: 1, s3: 1 } };
    const skills = heroCfg.skills || [];

    const avatarSvg = (activeId === 'hero_cassius')
      ? `<img src="assets/characters/cassius/model_3d_bust.png" alt="Cassius Bust" style="width:100%; height:100%; object-fit:cover; object-position:center top; border-radius:inherit;" />`
      : ((activeId === 'hero_trisa' || activeId === 'hero_rhiannon')
        ? `<img src="assets/characters/trisa/model_3d_bust.png" alt="Trisa Bust" style="width:100%; height:100%; object-fit:cover; object-position:center top; border-radius:inherit;" />`
        : (typeof Sprites !== 'undefined' ? Sprites.getPlayerSvg('idle', activeId) : '👑'));
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
        <div class="skill-card skill-card-enhanced ${sk.type}-card" id="hero-skill-card-${skKey}">
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
              <span class="skill-lvl-badge" id="skill-lvl-badge-${skKey}">Cấp ${skLevel}</span>
              <span class="skill-cost-txt" id="skill-cost-txt-${skKey}">💰 ${this._formatNumber(upgradeCost)}</span>
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
        ${activeId === 'hero_cassius' ? `
        <div class="hero-3d-stage-banner" style="margin-bottom: 14px; position: relative; border-radius: 12px; background: radial-gradient(circle at 50% 50%, rgba(255,215,0,0.15) 0%, rgba(20,20,32,0.85) 65%, #0b0b12 100%); border: 1px solid rgba(255,215,0,0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(255,215,0,0.08); overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px 20px; gap: 20px;">
          <div style="position: absolute; top: 10px; right: 12px; font-size: 0.68rem; font-weight: 800; color: #ffd700; background: rgba(0,0,0,0.6); border: 1px solid #ffd700; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px;">
            ✨ Authentic 3D Spine Model & Chibi
          </div>
          <div style="width: 140px; height: 160px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.8));">
            <img src="assets/characters/cassius/model_3d_full.png" alt="Cassius 3D Model" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #ffd700; display: flex; align-items: center; gap: 8px;">
              <span>🎲 Quỷ Diện & Xúc Xắc Cánh Dơi</span>
              <span style="font-size: 0.7rem; color: #facc15; background: rgba(250,204,21,0.15); border: 1px solid rgba(250,204,21,0.4); padding: 1px 6px; border-radius: 4px;">Exclusive Model</span>
            </div>
            <div style="font-size: 0.75rem; color: #cbd5e1; line-height: 1.45;">
              Tái hiện nguyên bản từ mô hình 3D Spine: Quân Vương Cassius với áo choàng tuxedo tà đuôi lượn sóng, gậy Spade quyền trượng, tay máy hoàng kim cùng Quỷ Xí Ngầu bay lượn và phi bài Tarot bách phát bách trúng.
            </div>
          </div>
        </div>
        ` : ''}
        ${(activeId === 'hero_trisa' || activeId === 'hero_rhiannon') ? `
        <div class="hero-3d-stage-banner" style="margin-bottom: 14px; position: relative; border-radius: 12px; background: radial-gradient(circle at 50% 50%, rgba(220,38,38,0.22) 0%, rgba(30,12,15,0.88) 65%, #0d0608 100%); border: 1px solid rgba(220,38,38,0.45); box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(220,38,38,0.1); overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px 20px; gap: 20px;">
          <div style="position: absolute; top: 10px; right: 12px; font-size: 0.68rem; font-weight: 800; color: #ef4444; background: rgba(0,0,0,0.6); border: 1px solid #ef4444; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px;">
            🩸 Authentic Animated WebP & Chibi
          </div>
          <div style="width: 140px; height: 160px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.8));">
            <img src="assets/characters/trisa/hover_3d_idle.webp" alt="Trisa Animated Model" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #ef4444; display: flex; align-items: center; gap: 8px;">
              <span>🗡️ Hắc Ám Nữ Hoàng & Huyết Nguyệt Chi Nhẫn</span>
              <span style="font-size: 0.7rem; color: #f87171; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); padding: 1px 6px; border-radius: 4px;">Exclusive Model</span>
            </div>
            <div style="font-size: 0.75rem; color: #cbd5e1; line-height: 1.45;">
              Tái hiện nguyên bản từ mô hình hoạt ảnh: Hắc Ám Nữ Hoàng Trisa với song đao bóng đêm trảm kích chớp nhoáng, sở hữu Huyết Nguyệt Trảm Sát xuyên phá không gian và tuyệt kỹ kết liễu tối thượng.
            </div>
          </div>
        </div>
        ` : ''}
        ${activeId === 'hero_hilde' ? `
        <div class="hero-3d-stage-banner" style="margin-bottom: 14px; position: relative; border-radius: 12px; background: radial-gradient(circle at 50% 50%, rgba(56,189,248,0.22) 0%, rgba(10,25,47,0.88) 65%, #050d1a 100%); border: 1px solid rgba(56,189,248,0.45); box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(56,189,248,0.1); overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px 20px; gap: 20px;">
          <div style="position: absolute; top: 10px; right: 12px; font-size: 0.68rem; font-weight: 800; color: #38bdf8; background: rgba(0,0,0,0.6); border: 1px solid #38bdf8; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px;">
            ❄️ Authentic Animated WebP & Chibi
          </div>
          <div style="width: 140px; height: 160px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.8));">
            <img src="assets/characters/hilde/hover_3d_idle.webp" alt="Hilde Animated Model" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
              <span>❄️ Thánh Nữ Băng Giá Hilde</span>
              <span style="font-size: 0.7rem; color: #7dd3fc; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4); padding: 1px 6px; border-radius: 4px;">Exclusive Model</span>
            </div>
            <div style="font-size: 0.75rem; color: #cbd5e1; line-height: 1.45;">
              Tái hiện nguyên bản từ mô hình hoạt ảnh: Nữ Thánh Kỵ Sĩ Băng Giá Hilde sở hữu Thánh Trảm Băng Tuyết trảm diệt tà ác, tạo khiên băng tuyệt đối và đóng băng chiến trường.
            </div>
          </div>
        </div>
        ` : ''}
        ${activeId === 'hero_heide' ? `
        <div class="hero-3d-stage-banner" style="margin-bottom: 14px; position: relative; border-radius: 12px; background: radial-gradient(circle at 50% 50%, rgba(16,185,129,0.22) 0%, rgba(6,30,25,0.88) 65%, #031410 100%); border: 1px solid rgba(16,185,129,0.45); box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(16,185,129,0.1); overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px 20px; gap: 20px;">
          <div style="position: absolute; top: 10px; right: 12px; font-size: 0.68rem; font-weight: 800; color: #10b981; background: rgba(0,0,0,0.6); border: 1px solid #10b981; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px;">
            ⚡ Authentic Animated WebP & Chibi
          </div>
          <div style="width: 140px; height: 160px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.8));">
            <img src="assets/characters/heide/hover_3d_idle.webp" alt="Heide Animated Model" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 8px;">
              <span>⚡ Thiên Phong Lôi Đao Heide</span>
              <span style="font-size: 0.7rem; color: #34d399; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); padding: 1px 6px; border-radius: 4px;">Exclusive Model</span>
            </div>
            <div style="font-size: 0.75rem; color: #cbd5e1; line-height: 1.45;">
              Tái hiện nguyên bản từ mô hình hoạt ảnh: Kiếm khách cuồng lôi Heide với kiếm pháp lôi phong thần tốc, sở hữu tuyệt kỹ Thiên Cung Lôi Bộc giáng sét chấn diệt vạn vật.
            </div>
          </div>
        </div>
        ` : ''}
        ${activeId === 'hero_meilin' ? `
        <div class="hero-3d-stage-banner" style="margin-bottom: 14px; position: relative; border-radius: 12px; background: radial-gradient(circle at 50% 50%, rgba(245,158,11,0.22) 0%, rgba(35,20,5,0.88) 65%, #150a02 100%); border: 1px solid rgba(245,158,11,0.45); box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(245,158,11,0.1); overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px 20px; gap: 20px;">
          <div style="position: absolute; top: 10px; right: 12px; font-size: 0.68rem; font-weight: 800; color: #f59e0b; background: rgba(0,0,0,0.6); border: 1px solid #f59e0b; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px;">
            🐉 Authentic Animated WebP & Chibi
          </div>
          <div style="width: 140px; height: 160px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.8));">
            <img src="assets/characters/meilin/hover_3d_idle.webp" alt="Mei Lin Animated Model" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 8px;">
              <span>🐉 Bá Vương Long Quyền Mei Lin</span>
              <span style="font-size: 0.7rem; color: #fbbf24; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); padding: 1px 6px; border-radius: 4px;">Exclusive Model</span>
            </div>
            <div style="font-size: 0.75rem; color: #cbd5e1; line-height: 1.45;">
              Tái hiện nguyên bản từ mô hình hoạt ảnh: Quyền Thánh Long Tộc Mei Lin vận khí hóa rồng, giáng đòn Long Thần Bạt Quyền hủy diệt thiên địa và oanh tạc cực hạn.
            </div>
          </div>
        </div>
        ` : ''}
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
        const activeHeroData = (typeof Player !== 'undefined' && Player.getActiveHeroData) ? Player.getActiveHeroData() : null;
        const baseAtk = (typeof Player !== 'undefined' && Player.getEffectiveAttack) ? Player.getEffectiveAttack() : 1000;
        const previewDmg = Math.floor(baseAtk * (burstSkill?.dmgMult || 50.0) * (1 + (activeHeroData?.burstDmgBonus || 0)));
        if (typeof Cinematics !== 'undefined' && Cinematics.playBurst) {
          Cinematics.playBurst({
            hero: heroCfg,
            skill: burstSkill,
            damage: previewDmg,
            isCrit: true,
            buffName: burstSkill?.buffDesc || 'Tuyệt Kỹ Nộ 3D',
            forcePreview: true
          });
        }
      });
    });
  },

  updateHeroesTabAffordability() {
    const activeId = GameState.activeHeroId || 'hero_starter';
    const userHero = GameState.heroes?.find(h => h.id === activeId);
    if (!userHero) return;
    const playerGold = GameState.player?.gold || 0;
    ['s1', 's2', 's3'].forEach(skKey => {
      const skLevel = userHero.skillLevels?.[skKey] || 1;
      const cost = skKey === 's1' ? skLevel * 3000 : skKey === 's2' ? skLevel * 5000 : skLevel * 10000;
      const canAfford = playerGold >= cost;
      const btn = document.querySelector(`.btn-skill-upgrade[data-skill="${skKey}"]`);
      if (btn && btn.disabled === canAfford) {
        btn.disabled = !canAfford;
      }
    });
  },

  _handleUpgradeHeroSkill(skKey) {
    const activeId = GameState.activeHeroId || 'hero_starter';
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
    const newLevel = userHero.skillLevels[skKey];
    const newCost = skKey === 's1' ? newLevel * 3000 : skKey === 's2' ? newLevel * 5000 : newLevel * 10000;

    // Cập nhật DOM in-place không render lại toàn bộ Tab để chống giật hover
    const lvlBadge = document.getElementById(`skill-lvl-badge-${skKey}`);
    if (lvlBadge) lvlBadge.textContent = `Cấp ${newLevel}`;
    const costTxt = document.getElementById(`skill-cost-txt-${skKey}`);
    if (costTxt) costTxt.innerHTML = `💰 ${this._formatNumber(newCost)}`;
    const upBtn = document.querySelector(`.btn-skill-upgrade[data-skill="${skKey}"]`);
    if (upBtn) upBtn.disabled = (GameState.player?.gold || 0) < newCost;

    this.showToast(`✨ Nâng cấp kỹ năng lên Cấp ${newLevel}! (-${this._formatNumber(cost)} 💰)`);
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
      card.className = `hero-roster-card ${isActive ? 'active-hero' : ''} ${!isOwned ? 'locked-hero' : 'owned-hero'}`;
      card.style.borderColor = isActive ? '#00ffcc' : isOwned ? `${hero.elementColor}60` : 'rgba(255,255,255,0.12)';

      const elemIcon = hero.element === 'fire' ? '🔥' : hero.element === 'ice' ? '❄️' : hero.element === 'lightning' ? '⚡' : hero.element === 'dark' ? '🩸' : hero.element === 'wind' ? '🌪️' : '⚔️';
      const avatarHtml = typeof Sprites !== 'undefined'
        ? `<div class="hero-card-avatar ${!isOwned ? 'locked-avatar' : ''}"><div class="avatar-fallback-icon" style="position:absolute; font-size:1.6rem; opacity:0.35; pointer-events:none;">${elemIcon}</div>${Sprites.getPlayerSvg('idle', hero.id)}${!isOwned ? '<div class="avatar-lock-overlay">🔒</div>' : ''}</div>`
        : `<div class="hero-card-avatar" style="font-size:1.8rem;">${elemIcon}</div>`;

      const activeTag = isActive ? `<span class="hero-active-tag">✓ ĐANG DÙNG</span>` : '';
      const cBadge = isOwned
        ? `<span class="hero-card-c-badge">E${userHero.constellation || 0}</span>`
        : `<span class="hero-card-lock-badge">🔒 Chưa mở</span>`;

      const actionState = isActive
        ? `<div class="hero-card-state state-deployed">Đang Xuất Trận</div>`
        : isOwned
          ? `<button class="btn btn-small btn-hero-select" style="width:100%; font-size:0.68rem; padding:3px 6px; font-weight:800; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff; border-radius:4px; border:none; cursor:pointer;">⚔️ Xuất Trận</button>`
          : `<div class="hero-card-state state-locked" style="font-size:0.62rem; color:#f59e0b; margin-top:2px;">(Quay Gacha)</div>`;

      card.innerHTML = `
        ${activeTag}
        <div class="hero-card-top-row">
          <span class="rate-badge rate-${hero.rarity}" style="font-size:0.58rem; padding:1px 5px;">${CONFIG.RARITY_NAMES[hero.rarity]}</span>
          <span class="hero-card-elem" style="color:${hero.elementColor}; font-size:0.65rem;">${hero.elementName}</span>
        </div>
        ${avatarHtml}
        <div class="hero-card-name" style="color: ${hero.elementColor || '#fff'};" title="${hero.name}">${hero.name}</div>
        <div class="hero-card-sub" style="font-size:0.62rem; color:var(--text-muted); margin-bottom:4px;">${hero.title}</div>
        <div style="margin-bottom:6px;">${cBadge}</div>
        ${actionState}
      `;

      card.addEventListener('click', () => {
        if (!isOwned) {
          this.showToast(`🔒 Hãy quay Banner Anh Hùng để chiêu mộ ${hero.name}!`);
          return;
        }
        if (isActive) {
          this.showToast(`👑 ${hero.name} đang xuất chiến rồi!`);
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

    // Dismiss showcase and 3D preview
    const showcase = document.getElementById('hero-hover-showcase');
    if (showcase) showcase.classList.remove('showcase-active');

    this.renderHeroSkillsHudLayout();
    this.showToast(`👑 Đã đổi tướng xuất chiến: [${heroCfg.name}]!`);
    if (typeof Cinematics !== 'undefined' && Cinematics.preloadHeroVideo) {
      Cinematics.preloadHeroVideo(heroId);
    }
    this.updateBattle();
    this.updateHeroesTab();
    this.updateStatusBar();
  },

  showOfflinePopup(progress) {
    if (!progress) return;
    GameState.isOfflineModalActive = true;
    document.getElementById('offline-time-text').textContent = `Bạn đã offline ${SaveManager.formatOfflineTime(progress.seconds)}`;
    document.getElementById('offline-gold').textContent = `+${this._formatNumber(progress.gold)} Vàng`;
    document.getElementById('offline-exp').textContent = `+${this._formatNumber(progress.exp)} EXP`;
    document.getElementById('offline-popup').classList.remove('hidden');
    this.setPlayerAction('idle');
    this.setMonsterAction('idle');
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
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
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
    if (typeof Dungeon !== 'undefined' && Dungeon.checkDailyReset) {
      Dungeon.checkDailyReset();
    }
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
    // Hide 3D hover preview and left-side showcase if open
    document.querySelectorAll('.burst-card-3d-preview').forEach(p => p.classList.remove('preview-active'));
    const showcase = document.getElementById('hero-hover-showcase');
    if (showcase) showcase.classList.remove('showcase-active');

    if (GameState.settings && GameState.settings.vfxEnabled === false && !skillRes?.forcePreview) {
      return;
    }
    try {
      if (typeof Cinematics !== 'undefined' && Cinematics.playBurst) {
        Cinematics.playBurst(skillRes);
      }
    } catch (err) {
      console.warn("Burst cinematic error caught safely in UI:", err);
    }
  },

  // ============================================================
  // AUTO HERO SKILL UPGRADE & RESET HEROES
  // ============================================================
  runAutoHeroSkillUpgrade() {
    if (!GameState.autoHeroSkill) return;
    const activeId = GameState.activeHeroId || 'hero_starter';
    const userHero = GameState.heroes?.find(h => h.id === activeId);
    if (!userHero) return;
    const heroCfg = CONFIG.getHeroById(activeId);
    if (!heroCfg?.skills) return;

    ['s1', 's2', 's3'].forEach((skKey, idx) => {
      const skLevel = userHero.skillLevels?.[skKey] || 1;
      const cost = skKey === 's1' ? skLevel * 3000 : skKey === 's2' ? skLevel * 5000 : skLevel * 10000;
      const maxLvl = CONFIG.SKILL_MAX_LEVEL || 1000;
      if (GameState.player && (GameState.player.gold || 0) >= cost && skLevel < maxLvl) {
        if (Player.spendGold(cost)) {
          userHero.skillLevels[skKey] = skLevel + 1;
          const newLevel = userHero.skillLevels[skKey];
          const newCost = skKey === 's1' ? newLevel * 3000 : skKey === 's2' ? newLevel * 5000 : newLevel * 10000;

          // Cập nhật DOM in-place không huỷ HTML để không làm giật hover
          const lvlElem = document.getElementById(`skill-lvl-badge-${skKey}`);
          if (lvlElem) lvlElem.textContent = `Cấp ${newLevel}`;
          const costElem = document.getElementById(`skill-cost-txt-${skKey}`);
          if (costElem) costElem.innerHTML = `💰 ${this._formatNumber(newCost)}`;
          const btn = document.querySelector(`.btn-skill-upgrade[data-skill="${skKey}"]`);
          if (btn) btn.disabled = (GameState.player?.gold || 0) < newCost;

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
      const hero = CONFIG.getHeroById(slot.heroId || 'hero_starter');
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
