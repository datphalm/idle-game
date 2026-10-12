// ============================================================
// ui.js — User Interface Module (Turn-Based, Boss, Forge & Gacha)
// ============================================================

const UI = {
  _currentTab: 'battle',
  _selectedItemId: null,
  _enhanceTargetId: null,
  _fusionSelectedIds: [],
  _combatLogLines: [],
  _maxLogLines: 35,

  // --- Initialize UI bindings ---
  init() {
    // 1. Navigation Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // 2. Forge Sub-tabs (Enhance vs Fusion)
    const btnSubEnhance = document.getElementById('btn-sub-enhance');
    const btnSubFusion = document.getElementById('btn-sub-fusion');
    if (btnSubEnhance && btnSubFusion) {
      btnSubEnhance.addEventListener('click', () => this.switchForgeSub('enhance'));
      btnSubFusion.addEventListener('click', () => this.switchForgeSub('fusion'));
    }

    // 3. Forge Enhancement Actions
    const btnDoEnhance = document.getElementById('btn-do-enhance');
    if (btnDoEnhance) {
      btnDoEnhance.addEventListener('click', () => this._handleEnhanceAction());
    }

    // 4. Forge Fusion Actions
    const btnDoFusion = document.getElementById('btn-do-fusion');
    if (btnDoFusion) {
      btnDoFusion.addEventListener('click', () => this._handleFusionAction());
    }

    // Quick Combine buttons
    document.querySelectorAll('.btn-quick-combine').forEach(btn => {
      btn.addEventListener('click', () => {
        this._handleQuickCombine(btn.dataset.rarity);
      });
    });

    // 5. Boss Chamber Actions
    const btnBuyKey = document.getElementById('btn-buy-boss-key');
    if (btnBuyKey) {
      btnBuyKey.addEventListener('click', () => {
        const res = Boss.buyKey();
        if (res.success) {
          this.showToast('🗝️ Đã mua 1 Chìa Khóa Boss!');
        } else {
          this.showToast('💰 Không đủ Vàng mua Chìa Khóa!');
        }
        this.updateStatusBar();
        this.updateBossChamber();
      });
    }

    const btnForfeit = document.getElementById('btn-forfeit-boss');
    if (btnForfeit) {
      btnForfeit.addEventListener('click', () => {
        Boss.forfeit();
      });
    }

    // 6. Gacha Pull Actions
    document.getElementById('btn-gacha-single').addEventListener('click', () => this._handleGachaSingle());
    document.getElementById('btn-gacha-multi').addEventListener('click', () => this._handleGachaMulti());

    // 7. Inventory Sort & Controls
    document.getElementById('btn-sort-inv').addEventListener('click', () => {
      Inventory.sort();
      this.updateInventory();
      this.updateForge();
    });

    // 8. Item Detail Modal Actions
    document.getElementById('btn-close-detail').addEventListener('click', () => this._closeItemDetail());
    document.getElementById('btn-equip-item').addEventListener('click', () => this._handleEquipItem());
    document.getElementById('btn-sell-item').addEventListener('click', () => this._handleSellItem());
    const btnToForge = document.getElementById('btn-to-forge-item');
    if (btnToForge) {
      btnToForge.addEventListener('click', () => {
        const id = this._selectedItemId;
        this._closeItemDetail();
        this.switchTab('forge');
        this.switchForgeSub('enhance');
        this.selectEnhanceItem(id);
      });
    }

    // 9. Equipment Slots (Click to unequip)
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

    // 10. Popups Close Bindings
    document.getElementById('btn-offline-ok').addEventListener('click', () => {
      document.getElementById('offline-popup').classList.add('hidden');
    });

    document.getElementById('btn-gacha-ok').addEventListener('click', () => {
      document.getElementById('gacha-result-popup').classList.add('hidden');
    });

    const btnBossVictoryOk = document.getElementById('btn-boss-victory-ok');
    if (btnBossVictoryOk) {
      btnBossVictoryOk.addEventListener('click', () => {
        document.getElementById('boss-victory-popup').classList.add('hidden');
      });
    }

    const btnForgeResultOk = document.getElementById('btn-forge-result-ok');
    if (btnForgeResultOk) {
      btnForgeResultOk.addEventListener('click', () => {
        document.getElementById('forge-result-popup').classList.add('hidden');
      });
    }

    // 11. Save / Reset Data
    document.getElementById('btn-save').addEventListener('click', () => {
      SaveManager.save();
      this.showToast('💾 Đã lưu tiến trình!');
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      SaveManager.reset();
    });

    // Render initial upgrade cards
    this._renderUpgradeCards();
  },

  // ============================================================
  // TAB SWITCHING
  // ============================================================
  switchTab(tabName) {
    this._currentTab = tabName;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.toggle('active', section.id === `tab-${tabName}`);
    });

    this.updateTabContent(tabName);
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
    this.updateTabContent(this._currentTab);
  },

  updateTabContent(tabName) {
    switch (tabName) {
      case 'battle':    this.updateBattle(); break;
      case 'boss':      this.updateBossChamber(); break;
      case 'inventory': this.updateInventory(); break;
      case 'forge':     this.updateForge(); break;
      case 'upgrades':  this.updateUpgrades(); break;
      case 'gacha':     this.updateGacha(); break;
    }
  },

  // ============================================================
  // STATUS BAR
  // ============================================================
  updateStatusBar() {
    if (!GameState.player) return;
    const p = GameState.player;

    document.getElementById('status-level').textContent = `Lv. ${p.level}`;
    document.getElementById('status-gold').textContent = this._formatNumber(p.gold);
    document.getElementById('status-diamond').textContent = this._formatNumber(p.diamond);
    document.getElementById('status-keys').textContent = p.bossKeys || 0;
    document.getElementById('status-stones').textContent = p.protectionStones || 0;

    // EXP Bar
    const needed = Player.getExpNeeded();
    const progress = Player.getExpProgress();
    document.getElementById('exp-fill').style.width = `${progress * 100}%`;
    document.getElementById('exp-text').textContent = `${this._formatNumber(p.exp)} / ${this._formatNumber(needed)}`;
  },

  // ============================================================
  // TAB 1: BATTLE SCENE
  // ============================================================
  updateBattle() {
    this.updateBattleStatsOnly();
    this.updateMonsterDisplay();
    document.getElementById('kill-count').textContent = this._formatNumber(GameState.combat.monstersKilled);
  },

  updateBattleStatsOnly() {
    if (!GameState.player) return;
    const p = GameState.player;

    // Player Battle Side
    document.getElementById('player-battle-level').textContent = `Lv. ${p.level}`;
    const pMaxHp = Player.getEffectiveMaxHp();
    const curHp = Math.max(0, p.currentHp);
    const pHpPct = Player.getHpPercent();

    document.getElementById('player-hp-fill').style.width = `${pHpPct}%`;
    document.getElementById('player-hp-text').textContent = `${this._formatNumber(curHp)} / ${this._formatNumber(pMaxHp)}`;

    // Full Stats Panel
    document.getElementById('stat-hp').textContent = this._formatNumber(pMaxHp);
    document.getElementById('stat-attack').textContent = this._formatNumber(Player.getEffectiveAttack());
    document.getElementById('stat-defense').textContent = this._formatNumber(Player.getEffectiveDefense());
    document.getElementById('stat-speed').textContent = Player.getEffectiveSpeed();
    document.getElementById('stat-regen').textContent = `+${Player.getEffectiveHpRegen()} HP`;

    const mSpeed = Monster.current ? Monster.current.speed : 10;
    const extraChance = (Player.getExtraTurnChance(mSpeed) * 100).toFixed(0);
    document.getElementById('stat-extra-turn').textContent = `${extraChance}%`;
    document.getElementById('stat-gold-rate').textContent = `x${Player.getEffectiveGoldRate().toFixed(2)}`;
    document.getElementById('stat-exp-needed').textContent = this._formatNumber(Player.getExpNeeded());
  },

  updateMonsterDisplay() {
    const m = Monster.current;
    if (!m) return;

    document.getElementById('monster-name').textContent = m.name;
    document.getElementById('monster-level').textContent = `Lv. ${m.level}`;
    document.getElementById('monster-sprite').textContent = m.emoji;

    const hpPct = Monster.getHpPercent();
    document.getElementById('monster-hp-fill').style.width = `${hpPct}%`;
    document.getElementById('monster-hp-text').textContent = `${this._formatNumber(m.hp)} / ${this._formatNumber(m.maxHp)}`;
  },

  // Floating damage numbers
  showDamageNumber(amount, isCrit, target) {
    let container;
    if (target === 'player') {
      container = document.getElementById('player-damage-container');
    } else if (target === 'boss') {
      container = document.getElementById('boss-damage-container');
    } else {
      container = document.getElementById('monster-damage-container');
    }

    if (!container) return;

    const el = document.createElement('div');
    el.className = `damage-number ${target === 'player' ? 'damage-player' : 'damage-monster'} ${isCrit ? 'damage-crit' : ''}`;
    el.textContent = `-${amount}`;

    const xOffset = Math.random() * 60 - 30;
    el.style.left = `calc(50% + ${xOffset}px)`;
    el.style.top = `${Math.random() * 20}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 850);
  },

  showExtraTurnIndicator() {
    const banner = document.getElementById('extra-turn-banner');
    if (!banner) return;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 1200);
  },

  animatePlayerAttack() {
    const sprite = document.getElementById('player-sprite');
    if (!sprite) return;
    sprite.classList.remove('player-attack-anim');
    void sprite.offsetWidth;
    sprite.classList.add('player-attack-anim');
  },

  animatePlayerHit() {
    const sprite = document.getElementById('player-sprite');
    if (!sprite) return;
    sprite.classList.remove('hit-flash');
    void sprite.offsetWidth;
    sprite.classList.add('hit-flash');
  },

  animateMonsterAttack() {
    const sprite = document.getElementById('monster-sprite');
    if (!sprite) return;
    sprite.classList.remove('monster-attack-anim');
    void sprite.offsetWidth;
    sprite.classList.add('monster-attack-anim');
  },

  animateMonsterHit() {
    const sprite = document.getElementById('monster-sprite');
    if (!sprite) return;
    sprite.classList.remove('hit-flash');
    void sprite.offsetWidth;
    sprite.classList.add('hit-flash');
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

  animateBossAttack() {
    const sprite = document.getElementById('boss-active-sprite');
    if (!sprite) return;
    sprite.classList.remove('monster-attack-anim');
    void sprite.offsetWidth;
    sprite.classList.add('monster-attack-anim');
  },

  animateBossHit() {
    const sprite = document.getElementById('boss-active-sprite');
    if (!sprite) return;
    sprite.classList.remove('hit-flash');
    void sprite.offsetWidth;
    sprite.classList.add('hit-flash');
  },

  addCombatLog(html, className) {
    this._combatLogLines.push({ html, className });
    if (this._combatLogLines.length > this._maxLogLines) {
      this._combatLogLines.shift();
    }
    const container = document.getElementById('combat-log');
    if (!container) return;
    container.innerHTML = this._combatLogLines.map(line => {
      return `<div class="log-entry ${line.className || ''}">${line.html}</div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  },

  // ============================================================
  // TAB 2: BOSS CHAMBER
  // ============================================================
  updateBossChamber() {
    const keys = GameState.player ? GameState.player.bossKeys || 0 : 0;
    document.getElementById('boss-key-count').textContent = keys;
    document.getElementById('boss-key-price').textContent = this._formatNumber(Boss.getKeyPrice());

    const activeArena = document.getElementById('boss-active-arena');
    const bossListContainer = document.getElementById('boss-list-container');

    // If boss fight is active
    if (GameState.boss && GameState.boss.active) {
      activeArena.classList.remove('hidden');
      bossListContainer.classList.add('hidden');

      const b = GameState.boss;
      document.getElementById('boss-active-name').textContent = b.name;
      document.getElementById('boss-active-sprite').textContent = b.emoji;
      document.getElementById('boss-timer').textContent = `⏱️ ${b.timer.toFixed(1)}s`;

      const hpPct = Math.max(0, Math.min(100, (b.hp / b.maxHp) * 100));
      document.getElementById('boss-hp-fill').style.width = `${hpPct}%`;
      document.getElementById('boss-hp-text').textContent = `${this._formatNumber(Math.max(0, b.hp))} / ${this._formatNumber(b.maxHp)}`;
    } else {
      activeArena.classList.add('hidden');
      bossListContainer.classList.remove('hidden');

      // Render boss cards
      this._renderBossList();
    }
  },

  _renderBossList() {
    const container = document.getElementById('boss-list-container');
    container.innerHTML = '';

    CONFIG.BOSS_LIST.forEach((boss, index) => {
      const card = document.createElement('div');
      card.className = 'boss-card glass-panel';

      const stonePct = (boss.protectionStoneDropRate * 100).toFixed(0);
      const dropsHtml = boss.itemDropPool.map(r => {
        return `<span class="reward-tag" style="color: ${CONFIG.RARITY_COLORS[r]}">${CONFIG.RARITY_NAMES[r]}</span>`;
      }).join('');

      card.innerHTML = `
        <div class="boss-card-icon">${boss.emoji}</div>
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
          <span style="font-size:0.65rem; opacity:0.85;">(🗝️ ×${boss.keyCost})</span>
        </button>
      `;

      card.querySelector('.btn-challenge').addEventListener('click', () => {
        const res = Boss.startFight(index);
        if (!res.success) {
          if (res.error === 'not_enough_keys') {
            this.showToast(`🗝️ Cần ${res.needed} Chìa Khóa để khiêu chiến Boss này!`);
          }
        }
      });

      container.appendChild(card);
    });
  },

  showBossVictoryPopup(data) {
    document.getElementById('victory-boss-name').textContent = data.boss.name;
    document.getElementById('victory-gold').textContent = `+${this._formatNumber(data.gold)} 💰`;
    document.getElementById('victory-exp').textContent = `+${this._formatNumber(data.exp)} ✨`;

    const stoneRow = document.getElementById('victory-stone-row');
    if (data.protectionStone) {
      stoneRow.classList.remove('hidden');
    } else {
      stoneRow.classList.add('hidden');
    }

    const itemRow = document.getElementById('victory-item-row');
    if (data.item) {
      itemRow.classList.remove('hidden');
      const itemEl = document.getElementById('victory-item-name');
      itemEl.textContent = data.item.name;
      itemEl.style.color = CONFIG.RARITY_COLORS[data.item.rarity];
    } else {
      itemRow.classList.add('hidden');
    }

    document.getElementById('boss-victory-popup').classList.remove('hidden');
  },

  // ============================================================
  // TAB 3: INVENTORY
  // ============================================================
  updateInventory() {
    this._renderEquippedSlots();
    this._renderInventoryGrid();
    document.getElementById('inv-count').textContent =
      `${Inventory.getCount()} / ${CONFIG.INVENTORY_MAX}`;
  },

  _renderEquippedSlots() {
    const eq = GameState.player.equipment;

    ['weapon', 'armor', 'accessory'].forEach(slot => {
      const slotEl = document.getElementById(`slot-${slot}`);
      const nameEl = document.getElementById(`equipped-${slot}-name`);
      const item = eq[slot];

      if (item) {
        slotEl.classList.add('has-item');
        slotEl.style.borderColor = CONFIG.RARITY_COLORS[item.rarity];
        const enh = item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : '';
        nameEl.textContent = `${item.name}${enh}`;
        nameEl.style.color = CONFIG.RARITY_COLORS[item.rarity];
      } else {
        slotEl.classList.remove('has-item');
        slotEl.style.borderColor = '';
        nameEl.textContent = 'Trống';
        nameEl.style.color = 'var(--text-muted)';
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

      const typeIcon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍';
      const enhanceBadge = (item.enhanceLevel && item.enhanceLevel > 0)
        ? `<div class="enhance-tag">+${item.enhanceLevel}</div>` : '';

      el.innerHTML = `
        ${enhanceBadge}
        <div class="item-icon">${typeIcon}</div>
        <div class="item-name-short">${item.name}</div>
      `;

      el.addEventListener('click', () => this._openItemDetail(item.id));
      grid.appendChild(el);
    });

    // Empty slots
    const emptyCount = CONFIG.INVENTORY_MAX - items.length;
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

    const nameEl = document.getElementById('detail-item-name');
    nameEl.textContent = `${item.name}${enh}`;
    nameEl.style.color = CONFIG.RARITY_COLORS[item.rarity];

    const rarEl = document.getElementById('detail-item-rarity');
    rarEl.textContent = CONFIG.RARITY_NAMES[item.rarity];
    rarEl.style.color = CONFIG.RARITY_COLORS[item.rarity];

    const typeNames = { weapon: 'Vũ khí', armor: 'Giáp', accessory: 'Phụ kiện' };
    document.getElementById('detail-item-type').textContent = `Loại: ${typeNames[item.type] || item.type}`;

    // Effective Stats
    const statsHtml = [];
    const stats = Inventory.getItemEffectiveStats(item);
    for (const stat in stats) {
      const val = stats[stat];
      switch (stat) {
        case 'attack':   statsHtml.push(`⚔️ Tấn công: <strong>+${val}</strong>`); break;
        case 'maxHp':    statsHtml.push(`❤️ Máu tối đa: <strong>+${val}</strong>`); break;
        case 'defense':  statsHtml.push(`🛡️ Phòng thủ: <strong>+${val}</strong>`); break;
        case 'speed':    statsHtml.push(`⚡ Tốc độ: <strong>+${val}</strong>`); break;
        case 'goldRate': statsHtml.push(`💰 Tỉ lệ vàng: <strong>+${(val * 100).toFixed(0)}%</strong>`); break;
      }
    }
    if (item.enhanceLevel > 0) {
      statsHtml.push(`🔨 Cường hóa +${item.enhanceLevel} (+${(item.enhanceLevel * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL * 100).toFixed(0)}% chỉ số)`);
    }
    document.getElementById('detail-item-stats').innerHTML = statsHtml.join('<br>');

    // Sell Price
    const basePrice = CONFIG.SELL_PRICES[item.rarity] || 10;
    const sellPrice = basePrice + (item.enhanceLevel || 0) * 50;
    document.getElementById('btn-sell-item').textContent = `Bán (${sellPrice} 💰)`;

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

  // ============================================================
  // TAB 4: FORGE & FUSION
  // ============================================================
  updateForge() {
    this._updateEnhanceSub();
    this._updateFusionSub();
  },

  // --- Enhance Sub-View ---
  _updateEnhanceSub() {
    const protectionCount = GameState.player ? GameState.player.protectionStones || 0 : 0;
    document.getElementById('forge-protection-count').textContent = protectionCount;

    const slotBox = document.getElementById('enhance-item-slot');
    const previewBox = document.getElementById('enhance-preview');

    let item = null;
    if (this._enhanceTargetId) {
      item = Inventory.findItem(this._enhanceTargetId);
      // check equipped
      if (!item && GameState.player && GameState.player.equipment) {
        for (const s in GameState.player.equipment) {
          if (GameState.player.equipment[s] && GameState.player.equipment[s].id === this._enhanceTargetId) {
            item = GameState.player.equipment[s];
            break;
          }
        }
      }
    }

    if (item) {
      slotBox.classList.add('has-item');
      slotBox.style.borderColor = CONFIG.RARITY_COLORS[item.rarity];
      const enh = item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : '+0';
      slotBox.innerHTML = `
        <div style="font-size:2rem;">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>
        <div style="font-size:0.75rem; font-weight:700; color:${CONFIG.RARITY_COLORS[item.rarity]};">${item.name}</div>
        <div style="font-size:0.7rem; color:#fff; font-weight:800;">${enh}</div>
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

      const btnEnhance = document.getElementById('btn-do-enhance');
      btnEnhance.disabled = (curLvl >= CONFIG.ENHANCE_MAX) || (GameState.player.gold < cost);
    } else {
      slotBox.classList.remove('has-item');
      slotBox.style.borderColor = '';
      slotBox.innerHTML = `<span class="slot-placeholder">Nhấp chọn trang bị bên dưới để rèn</span>`;
      previewBox.classList.add('hidden');
    }

    // Mini Inventory Grid for selecting target
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
      const typeIcon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍';

      el.innerHTML = `
        ${enh}
        <div class="item-icon">${typeIcon}</div>
        <div class="item-name-short">${item.name}</div>
      `;

      el.addEventListener('click', () => {
        this.selectEnhanceItem(item.id);
      });
      grid.appendChild(el);
    });
  },

  _handleEnhanceAction() {
    if (!this._enhanceTargetId) return;

    const useProtection = document.getElementById('chk-use-protection').checked;
    const res = Forge.enhanceItem(this._enhanceTargetId, useProtection);

    if (res.error) {
      if (res.error === 'not_enough_gold') {
        this.showToast(`💰 Không đủ Vàng để rèn! (Cần ${this._formatNumber(res.cost)})`);
      } else if (res.error === 'no_protection_stone') {
        this.showToast('🛡️ Bạn không có Bùa Bảo Hiểm!');
      } else if (res.error === 'max_level') {
        this.showToast('⭐ Trang bị đã đạt cấp tối đa (+100)!');
      }
      return;
    }

    // Success outcome
    if (res.success) {
      let title = '🎉 RÈN THÀNH CÔNG!';
      let desc = `Lên +${res.newLevel}! (+${res.levelsGained} cấp)`;
      if (res.type === 'crit2' || res.type === 'crit3') {
        title = '⚡ BẠO KÍCH NHẢY BẬC!';
        desc = `May mắn nhảy vọt +${res.levelsGained} bậc! Hiện tại là +${res.newLevel}!`;
      }
      this.showForgeResultPopup('🔨', title, desc);
    } else {
      // Failure outcome
      if (res.type === 'protected') {
        this.showForgeResultPopup('🛡️', 'BÙA BẢO HIỂM KÍCH HOẠT!', 'Đập thất bại nhưng Bùa đã cứu trang bị, giữ nguyên cấp độ!');
      } else if (res.type === 'break') {
        this.showForgeResultPopup('💥', 'TRANG BỊ BỊ VỠ!', `Đập thất bại nặng nề! Trang bị rớt về +0!`);
      } else if (res.type === 'downgrade') {
        this.showForgeResultPopup('❌', 'RÈN THẤT BẠI!', `Rớt xuống +${res.newLevel}!`);
      } else {
        this.showForgeResultPopup('❌', 'RÈN THẤT BẠI!', `Giữ nguyên cấp độ hiện tại (+${res.level})!`);
      }
    }

    this.updateStatusBar();
    this.updateForge();
    this.updateInventory();
    this.updateBattleStatsOnly();
  },

  // --- Fusion Sub-View ---
  _updateFusionSub() {
    // 3 slots
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`fusion-slot-${i}`);
      const itemId = this._fusionSelectedIds[i];
      const item = itemId ? Inventory.findItem(itemId) : null;

      if (item) {
        slotEl.classList.add('has-item');
        slotEl.style.borderColor = CONFIG.RARITY_COLORS[item.rarity];
        slotEl.innerHTML = `
          <div style="font-size:1.4rem;">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>
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

    // Preview
    const previewBox = document.getElementById('fusion-preview');
    if (this._fusionSelectedIds.length === 3) {
      const items = this._fusionSelectedIds.map(id => Inventory.findItem(id)).filter(i => i);
      if (items.length === 3 && items[0].rarity === items[1].rarity && items[1].rarity === items[2].rarity) {
        const curRarity = items[0].rarity;
        const curIdx = CONFIG.RARITY_ORDER.indexOf(curRarity);
        const nextRarity = CONFIG.RARITY_ORDER[curIdx + 1];

        if (nextRarity) {
          previewBox.classList.remove('hidden');
          const targetEl = document.getElementById('fusion-target-rarity');
          targetEl.textContent = CONFIG.RARITY_NAMES[nextRarity];
          targetEl.style.color = CONFIG.RARITY_COLORS[nextRarity];

          const ratePct = ((CONFIG.FUSION_RATES[curRarity] || 0.1) * 100).toFixed(1);
          document.getElementById('fusion-success-rate').textContent = `${ratePct}%`;
        } else {
          previewBox.classList.add('hidden');
        }
      } else {
        previewBox.classList.add('hidden');
      }
    } else {
      previewBox.classList.add('hidden');
    }

    // Render Mini grid for fusion
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
      const typeIcon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍';

      el.innerHTML = `
        <div class="item-icon">${typeIcon}</div>
        <div class="item-name-short">${item.name}</div>
      `;

      el.addEventListener('click', () => {
        if (isSelected) {
          this._fusionSelectedIds = this._fusionSelectedIds.filter(id => id !== item.id);
        } else {
          if (this._fusionSelectedIds.length >= 3) {
            this.showToast('Đã chọn đủ 3 món để ghép!');
            return;
          }
          // Check rarity match
          if (this._fusionSelectedIds.length > 0) {
            const firstItem = Inventory.findItem(this._fusionSelectedIds[0]);
            if (firstItem && firstItem.rarity !== item.rarity) {
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
      this.showForgeResultPopup(
        '✨',
        'DUNG HỢP THÀNH CÔNG!',
        `Tạo ra trang bị bậc [${CONFIG.RARITY_NAMES[res.toRarity]}]: ${res.newItem.name}!`
      );
    } else {
      this.showForgeResultPopup(
        '💨',
        'DUNG HỢP THẤT BẠI!',
        `Nguyên liệu biến mất! Nhận an ủi +${res.consolationGold} Vàng!`
      );
    }

    this.updateInventory();
    this.updateForge();
    this.updateStatusBar();
  },

  _handleQuickCombine(rarity) {
    const res = Forge.quickCombine(rarity);
    if (res.error) {
      if (res.error === 'not_enough_items') {
        this.showToast(`Không đủ trang bị bậc [${CONFIG.RARITY_NAMES[rarity]}] để ghép nhanh (Cần ít nhất 3 món)!`);
      }
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

  // ============================================================
  // TAB 5: UPGRADES
  // ============================================================
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

      card.querySelector('.btn-upgrade').addEventListener('click', () => {
        this._handleUpgrade(type);
      });

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

  // ============================================================
  // TAB 6: GACHA
  // ============================================================
  updateGacha() {
    const count = Inventory.getCount();
    const free = Inventory.getFreeSlots();
    const isFull = Inventory.isFull();

    const countEl = document.getElementById('gacha-inv-count');
    if (countEl) countEl.textContent = `${count} / ${CONFIG.INVENTORY_MAX}`;

    const freeEl = document.getElementById('gacha-inv-free');
    if (freeEl) freeEl.textContent = isFull ? 'HẾT CHỖ TRỐNG!' : `còn ${free} chỗ trống`;

    const statusBox = document.getElementById('gacha-inv-status');
    if (statusBox) statusBox.classList.toggle('bag-full', isFull);

    const btnSingle = document.getElementById('btn-gacha-single');
    const btnMulti = document.getElementById('btn-gacha-multi');

    if (btnSingle) {
      btnSingle.disabled = !Gacha.canAffordSingle() || isFull;
    }
    if (btnMulti) {
      btnMulti.disabled = !Gacha.canAffordMulti() || (free < CONFIG.GACHA_MULTI_COUNT);
    }

    this.updateStatusBar();
  },

  _handleGachaSingle() {
    if (Inventory.isFull()) {
      this.showToast('🎒 Kho đồ đã đầy! Hãy bán hoặc ghép bớt đồ để quay.');
      return;
    }

    const res = Gacha.pull('gold');
    if (!res.success) {
      if (res.error === 'not_enough_gold') {
        this.showToast('💰 Không đủ Vàng để quay!');
      } else if (res.error === 'inventory_full') {
        this.showToast('🎒 Kho đồ đã đầy!');
      }
      return;
    }

    this._showGachaResults([res.item]);
    this.updateGacha();
    this.updateInventory();
  },

  _handleGachaMulti() {
    if (Inventory.getFreeSlots() < CONFIG.GACHA_MULTI_COUNT) {
      this.showToast(`🎒 Cần ít nhất ${CONFIG.GACHA_MULTI_COUNT} ô trống trong túi đồ để quay x10!`);
      return;
    }

    const res = Gacha.pullMulti('gold');
    if (!res.success) {
      if (res.error === 'not_enough_gold') {
        this.showToast('💰 Không đủ Vàng để quay x10!');
      } else {
        this.showToast('🎒 Không đủ chỗ trống trong kho đồ!');
      }
      return;
    }

    this._showGachaResults(res.items);
    this.updateGacha();
    this.updateInventory();
  },

  _showGachaResults(items) {
    const container = document.getElementById('gacha-result-items');
    container.innerHTML = '';

    items.forEach((item, index) => {
      const typeIcon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍';

      const card = document.createElement('div');
      card.className = `gacha-item-card rarity-${item.rarity}`;
      card.style.animationDelay = `${index * 0.08}s`;
      card.style.background = CONFIG.RARITY_BG[item.rarity];
      card.style.border = `1px solid ${CONFIG.RARITY_COLORS[item.rarity]}40`;

      card.innerHTML = `
        <div class="item-icon">${typeIcon}</div>
        <div class="item-name-short" style="color: ${CONFIG.RARITY_COLORS[item.rarity]}">${item.name}</div>
      `;

      container.appendChild(card);
    });

    document.getElementById('gacha-result-popup').classList.remove('hidden');
  },

  // ============================================================
  // OFFLINE POPUP & TOAST NOTIFICATION
  // ============================================================
  showOfflinePopup(progress) {
    if (!progress) return;

    document.getElementById('offline-time-text').textContent =
      `Bạn đã offline ${SaveManager.formatOfflineTime(progress.seconds)}`;
    document.getElementById('offline-gold').textContent =
      `+${this._formatNumber(progress.gold)} Vàng`;
    document.getElementById('offline-exp').textContent =
      `+${this._formatNumber(progress.exp)} EXP`;

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
  }
};
