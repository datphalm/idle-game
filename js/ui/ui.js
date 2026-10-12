const UI = {
  _currentTab: 'battle',
  _selectedItemId: null,
  _enhanceTargetId: null,
  _fusionSelectedIds: [],
  _combatLogLines: [],
  _maxLogLines: 35,

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

    // Boss actions
    document.getElementById('btn-buy-boss-key')?.addEventListener('click', () => {
      const res = Boss.buyKey();
      this.showToast(res.success ? '🗝️ Đã mua 1 Chìa Khóa Boss!' : '💰 Không đủ Vàng mua Chìa Khóa!');
      this.updateStatusBar();
      this.updateBossChamber();
    });

    document.getElementById('btn-forfeit-boss')?.addEventListener('click', () => Boss.forfeit());

    // Gacha buttons
    document.getElementById('btn-gacha-single').addEventListener('click', () => this._handleGachaSingle());
    document.getElementById('btn-gacha-multi').addEventListener('click', () => this._handleGachaMulti());

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

    // Popups close buttons
    document.getElementById('btn-offline-ok').addEventListener('click', () => {
      document.getElementById('offline-popup').classList.add('hidden');
    });
    document.getElementById('btn-gacha-ok').addEventListener('click', () => {
      document.getElementById('gacha-result-popup').classList.add('hidden');
    });
    document.getElementById('btn-boss-victory-ok')?.addEventListener('click', () => {
      document.getElementById('boss-victory-popup').classList.add('hidden');
    });
    document.getElementById('btn-forge-result-ok')?.addEventListener('click', () => {
      document.getElementById('forge-result-popup').classList.add('hidden');
    });

    // Save and reset
    document.getElementById('btn-save').addEventListener('click', () => {
      SaveManager.save();
      this.showToast('💾 Đã lưu tiến trình!');
    });
    document.getElementById('btn-reset').addEventListener('click', () => SaveManager.reset());

    this._renderUpgradeCards();
  },

  switchTab(tabName) {
    this._currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${tabName}`));
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
    this.updateBattleStatsOnly();
    this.updateMonsterDisplay();
    document.getElementById('kill-count').textContent = this._formatNumber(GameState.combat.monstersKilled);
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
    const m = Monster.current;
    if (!m) return;
    document.getElementById('monster-name').textContent = m.name;
    document.getElementById('monster-level').textContent = `Lv. ${m.level}`;
    document.getElementById('monster-sprite').textContent = m.emoji;
    document.getElementById('monster-hp-fill').style.width = `${Monster.getHpPercent()}%`;
    document.getElementById('monster-hp-text').textContent = `${this._formatNumber(m.hp)} / ${this._formatNumber(m.maxHp)}`;
  },

  showDamageNumber(amount, isCrit, target) {
    const id = target === 'player' ? 'player-damage-container' : target === 'boss' ? 'boss-damage-container' : 'monster-damage-container';
    const container = document.getElementById(id);
    if (!container) return;

    const el = document.createElement('div');
    el.className = `damage-number ${target === 'player' ? 'damage-player' : 'damage-monster'} ${isCrit ? 'damage-crit' : ''}`;
    el.textContent = `-${amount}`;
    el.style.left = `calc(50% + ${Math.random() * 60 - 30}px)`;
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

  animatePlayerAttack() { this._triggerAnim('player-sprite', 'player-attack-anim'); },
  animatePlayerHit()    { this._triggerAnim('player-sprite', 'hit-flash'); },
  animateMonsterAttack(){ this._triggerAnim('monster-sprite', 'monster-attack-anim'); },
  animateMonsterHit()   { this._triggerAnim('monster-sprite', 'hit-flash'); },
  animateBossAttack()   { this._triggerAnim('boss-active-sprite', 'monster-attack-anim'); },
  animateBossHit()      { this._triggerAnim('boss-active-sprite', 'hit-flash'); },

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
    document.getElementById('boss-key-count').textContent = GameState.player?.bossKeys || 0;
    document.getElementById('boss-key-price').textContent = this._formatNumber(Boss.getKeyPrice());

    const activeArena = document.getElementById('boss-active-arena');
    const bossListContainer = document.getElementById('boss-list-container');

    if (GameState.boss?.active) {
      activeArena.classList.remove('hidden');
      bossListContainer.classList.add('hidden');

      const b = GameState.boss;
      document.getElementById('boss-active-name').textContent = b.name;
      document.getElementById('boss-active-sprite').textContent = b.emoji;
      document.getElementById('boss-timer').textContent = `⏱️ ${b.timer.toFixed(1)}s`;
      document.getElementById('boss-hp-fill').style.width = `${Math.max(0, Math.min(100, (b.hp / b.maxHp) * 100))}%`;
      document.getElementById('boss-hp-text').textContent = `${this._formatNumber(Math.max(0, b.hp))} / ${this._formatNumber(b.maxHp)}`;
    } else {
      activeArena.classList.add('hidden');
      bossListContainer.classList.remove('hidden');
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
      const dropsHtml = boss.itemDropPool.map(r => `<span class="reward-tag" style="color: ${CONFIG.RARITY_COLORS[r]}">${CONFIG.RARITY_NAMES[r]}</span>`).join('');

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
      itemEl.textContent = data.item.name;
      itemEl.style.color = CONFIG.RARITY_COLORS[data.item.rarity];
    } else {
      itemRow.classList.add('hidden');
    }
    document.getElementById('boss-victory-popup').classList.remove('hidden');
  },

  updateInventory() {
    this._renderEquippedSlots();
    this._renderInventoryGrid();
    document.getElementById('inv-count').textContent = `${Inventory.getCount()} / ${CONFIG.INVENTORY_MAX}`;
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
      const enh = item.enhanceLevel > 0 ? `<div class="enhance-tag">+${item.enhanceLevel}</div>` : '';

      el.innerHTML = `
        ${enh}
        <div class="item-icon">${typeIcon}</div>
        <div class="item-name-short">${item.name}</div>
      `;
      el.addEventListener('click', () => this._openItemDetail(item.id));
      grid.appendChild(el);
    });

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
      slotBox.innerHTML = `
        <div style="font-size:2rem;">${item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍'}</div>
        <div style="font-size:0.75rem; font-weight:700; color:${CONFIG.RARITY_COLORS[item.rarity]};">${item.name}</div>
        <div style="font-size:0.7rem; color:#fff; font-weight:800;">+${item.enhanceLevel || 0}</div>
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
      const typeIcon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍';

      el.innerHTML = `${enh}<div class="item-icon">${typeIcon}</div><div class="item-name-short">${item.name}</div>`;
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

    if (res.success) {
      const isCrit = res.type === 'crit2' || res.type === 'crit3';
      const title = isCrit ? '⚡ BẠO KÍCH NHẢY BẬC!' : '🎉 RÈN THÀNH CÔNG!';
      const desc = isCrit ? `May mắn nhảy vọt +${res.levelsGained} bậc! Lên +${res.newLevel}!` : `Lên +${res.newLevel}! (+${res.levelsGained} cấp)`;
      this.showForgeResultPopup('🔨', title, desc);
    } else {
      if (res.type === 'protected') this.showForgeResultPopup('🛡️', 'BÙA BẢO HIỂM KÍCH HOẠT!', 'Đập thất bại nhưng Bùa đã bảo vệ trang bị, giữ nguyên cấp!');
      else if (res.type === 'break') this.showForgeResultPopup('💥', 'TRANG BỊ BỊ VỠ!', 'Đập thất bại nặng nề! Trang bị rớt về +0!');
      else if (res.type === 'downgrade') this.showForgeResultPopup('❌', 'RÈN THẤT BẠI!', `Rớt xuống +${res.newLevel}!`);
      else this.showForgeResultPopup('❌', 'RÈN THẤT BẠI!', `Giữ nguyên cấp độ hiện tại (+${res.level})!`);
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
      const typeIcon = item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '💍';

      el.innerHTML = `<div class="item-icon">${typeIcon}</div><div class="item-name-short">${item.name}</div>`;
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
    if (btnSingle) btnSingle.disabled = !Gacha.canAffordSingle() || isFull;
    if (btnMulti) btnMulti.disabled = !Gacha.canAffordMulti() || (free < CONFIG.GACHA_MULTI_COUNT);

    this.updateStatusBar();
  },

  _handleGachaSingle() {
    if (Inventory.isFull()) {
      this.showToast('🎒 Kho đồ đã đầy! Hãy bán hoặc ghép bớt đồ để quay.');
      return;
    }
    const res = Gacha.pull('gold');
    if (!res.success) {
      this.showToast(res.error === 'not_enough_gold' ? '💰 Không đủ Vàng để quay!' : '🎒 Kho đồ đã đầy!');
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
      this.showToast(res.error === 'not_enough_gold' ? '💰 Không đủ Vàng để quay x10!' : '🎒 Không đủ chỗ trống trong kho đồ!');
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
  }
};
