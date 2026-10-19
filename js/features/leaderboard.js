/**
 * IDLE RPG - DYNAMIC GLOBAL LEADERBOARD & CLOUD SYNC SYSTEM
 * Bảng xếp hạng toàn cầu năng động (Cấp độ, Leo Tháp, Lực Chiến) & Đồng bộ vĩnh viễn mọi người chơi (kể cả Offline)
 */

const Leaderboard = {
  _currentFilter: 'level', // 'level' | 'tower' | 'power'
  _cachedPlayers: [],
  _serverUrl: 'https://idle-game-ypvy.onrender.com/api',
  _isSyncing: false,
  _syncStatus: 'idle', // 'idle' | 'loading' | 'online' | 'offline'

  init() {
    this._loadInitialData();
  },

  _loadInitialData() {
    try {
      fetch('server_config.json').then(r => r.json()).then(cfg => {
        if (cfg && cfg.apiServer) {
          this._serverUrl = cfg.apiServer;
          if (typeof CONFIG !== 'undefined') CONFIG.SERVER_URL = cfg.apiServer;
        }
      }).catch(() => {});
    } catch (e) {}

    const saved = localStorage.getItem('idle_rpg_leaderboard_cache');
    if (saved) {
      try {
        this._cachedPlayers = JSON.parse(saved);
      } catch (e) {}
    }

    if (!this._cachedPlayers || this._cachedPlayers.length === 0) {
      this._seedInitialCompetitors();
    }

    setTimeout(() => {
      this.syncCurrentPlayer();
    }, 1500);
  },

  _seedInitialCompetitors() {
    this._cachedPlayers = [
      { id: 'bot_1', name: 'Độc Cô Cầu Bại', heroId: 'hero_unknown_god', constellation: 6, level: 88, stage: 52, towerFloor: 65, power: 852000, lastActive: Date.now() - 3600000 },
      { id: 'bot_2', name: 'Pháp Vương Hư Không', heroId: 'hero_arcane_mage', constellation: 4, level: 75, stage: 45, towerFloor: 50, power: 620000, lastActive: Date.now() - 7200000 },
      { id: 'bot_3', name: 'Hỏa Kiếm Thần Sầu', heroId: 'hero_flame_knight', constellation: 3, level: 68, stage: 38, towerFloor: 42, power: 480000, lastActive: Date.now() - 14400000 },
      { id: 'bot_4', name: 'Hoàng Kim Thương Bá', heroId: 'hero_spear_lancer', constellation: 2, level: 60, stage: 32, towerFloor: 35, power: 360000, lastActive: Date.now() - 28800000 },
      { id: 'bot_5', name: 'Băng Kiếm Thánh Nữ', heroId: 'hero_frost_knight', constellation: 2, level: 54, stage: 28, towerFloor: 30, power: 275000, lastActive: Date.now() - 43200000 },
      { id: 'bot_6', name: 'Ám Dạ Thích Khách', heroId: 'hero_shadow_rogue', constellation: 1, level: 45, stage: 22, towerFloor: 24, power: 190000, lastActive: Date.now() - 86400000 },
      { id: 'bot_7', name: 'Hiệp Sĩ Khởi Đầu', heroId: 'hero_starter', constellation: 1, level: 32, stage: 15, towerFloor: 16, power: 95000, lastActive: Date.now() - 172800000 },
      { id: 'bot_8', name: 'Tân Binh Luyện Kiếm', heroId: 'hero_starter', constellation: 0, level: 18, stage: 8, towerFloor: 9, power: 32000, lastActive: Date.now() - 259200000 }
    ];
    this._saveCache();
  },

  _saveCache() {
    localStorage.setItem('idle_rpg_leaderboard_cache', JSON.stringify(this._cachedPlayers));
  },

  calculateCurrentPower() {
    const p = GameState.player;
    if (!p) return 1000;
    const hp = Player.getEffectiveMaxHp();
    const atk = Player.getEffectiveAttack();
    const def = Player.getEffectiveDefense();
    const spd = Player.getEffectiveSpeed();
    return Math.floor(atk * 4.5 + hp * 0.8 + def * 3.0 + spd * 15);
  },

  _getOrCreatePlayerId() {
    const slotId = (typeof SaveManager !== 'undefined') ? SaveManager.getActiveSlotId() : 'slot_1';
    const key = `idle_rpg_uid_${slotId}`;
    let pid = localStorage.getItem(key);
    if (!pid) {
      if (slotId === 'slot_1' && localStorage.getItem('idle_rpg_unique_uid')) {
        pid = localStorage.getItem('idle_rpg_unique_uid');
      } else {
        pid = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      }
      localStorage.setItem(key, pid);
    }
    return pid;
  },

  syncCurrentPlayer(isManual = false) {
    if (!GameState.player) return;
    const meta = SaveManager.getProfilesMeta();
    const activeSlot = meta.slots.find(s => s.id === SaveManager.getActiveSlotId());
    const playerName = activeSlot?.name || 'Chiến Binh Của Bạn';
    const activeHero = GameState.heroes?.find(h => h.id === GameState.activeHeroId) || { constellation: 0 };
    const myUid = this._getOrCreatePlayerId();

    const myProfile = {
      id: myUid,
      name: playerName,
      heroId: GameState.activeHeroId || 'hero_starter',
      constellation: activeHero.constellation || 0,
      level: GameState.player.level || 1,
      stage: GameState.stage?.current || 1,
      towerFloor: GameState.dungeon?.towerHighestFloor || GameState.dungeon?.abyssFloor || 1,
      power: this.calculateCurrentPower(),
      lastActive: Date.now(),
      // Truyền danh sách đối thủ đã biết để máy chủ tự động phục hồi nếu máy chủ bị restart
      knownPlayers: this._cachedPlayers.filter(p => p.id !== myUid).slice(0, 30)
    };

    // Cập nhật ngay vào danh sách hiển thị cục bộ
    const idx = this._cachedPlayers.findIndex(p => p.id === myUid);
    if (idx !== -1) {
      this._cachedPlayers[idx] = Object.assign({}, this._cachedPlayers[idx], myProfile, { isMe: true });
    } else {
      this._cachedPlayers.push(Object.assign({}, myProfile, { isMe: true }));
    }
    this._saveCache();
    this.render();

    // Gửi đồng bộ lên máy chủ đám mây
    this._syncToServer(myProfile, isManual);
  },

  async _syncToServer(playerData, isManual = false) {
    if (this._isSyncing) return;
    this._isSyncing = true;
    this._updateSyncStatusBadge('loading');

    try {
      const url = (typeof CONFIG !== 'undefined' && CONFIG.SERVER_URL) ? CONFIG.SERVER_URL : this._serverUrl;
      const controller = new AbortController();
      // Cho 15s để Render Free kịp tỉnh dậy nếu đang ngủ (Cold start)
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(`${url}/player/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData),
        signal: controller.signal
      }).catch(() => null);
      
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const remoteList = await res.json();
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          const myUid = this._getOrCreatePlayerId();
          this._cachedPlayers = remoteList.map(p => Object.assign({}, p, { isMe: p.id === myUid }));
          this._saveCache();
          this._updateSyncStatusBadge('online');
          this.render();
          if (isManual && typeof UI !== 'undefined') {
            UI.showToast('✅ Đã cập nhật Bảng Xếp Hạng mới nhất từ Cloud!');
          }
          return;
        }
      }
      
      this._updateSyncStatusBadge('offline');
    } catch (e) {
      this._updateSyncStatusBadge('offline');
    } finally {
      this._isSyncing = false;
    }
  },

  async fetchRemoteLeaderboard(isManual = false) {
    if (this._isSyncing) return;
    this._isSyncing = true;
    this._updateSyncStatusBadge('loading');

    try {
      const url = (typeof CONFIG !== 'undefined' && CONFIG.SERVER_URL) ? CONFIG.SERVER_URL : this._serverUrl;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(`${url}/leaderboard`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const remoteList = await res.json();
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          const myUid = this._getOrCreatePlayerId();
          this._cachedPlayers = remoteList.map(p => Object.assign({}, p, { isMe: p.id === myUid }));
          this._saveCache();
          this._updateSyncStatusBadge('online');
          this.render();
          if (isManual && typeof UI !== 'undefined') {
            UI.showToast('✅ Bảng Xếp Hạng đã được làm mới!');
          }
          return;
        }
      }
      this._updateSyncStatusBadge('offline');
    } catch (e) {
      this._updateSyncStatusBadge('offline');
    } finally {
      this._isSyncing = false;
    }
  },

  _updateSyncStatusBadge(status) {
    this._syncStatus = status;
    const badge = document.getElementById('lb-sync-badge');
    if (!badge) return;

    const count = this._cachedPlayers.length;
    if (status === 'loading') {
      badge.innerHTML = '⏳ Đang đồng bộ Cloud...';
      badge.style.background = 'rgba(234, 179, 8, 0.15)';
      badge.style.color = '#eab308';
      badge.style.borderColor = '#eab308';
    } else if (status === 'online') {
      badge.innerHTML = `🟢 Trực Tuyến (${count} người chơi)`;
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#10b981';
      badge.style.borderColor = '#10b981';
    } else {
      badge.innerHTML = `⚪ Bộ Nhớ Tạm (${count} người chơi)`;
      badge.style.background = 'rgba(148, 163, 184, 0.15)';
      badge.style.color = '#94a3b8';
      badge.style.borderColor = '#94a3b8';
    }
  },

  getSortedPlayers(filter = 'level') {
    const list = [...this._cachedPlayers];
    if (filter === 'level') {
      list.sort((a, b) => b.level !== a.level ? b.level - a.level : b.power - a.power);
    } else if (filter === 'tower') {
      list.sort((a, b) => b.towerFloor !== a.towerFloor ? b.towerFloor - a.towerFloor : b.power - a.power);
    } else if (filter === 'power') {
      list.sort((a, b) => b.power - a.power);
    }
    return list;
  },

  openModal() {
    const modal = document.getElementById('leaderboard-modal');
    if (!modal) return;
    this.render();
    modal.classList.remove('hidden');

    // Đồng bộ và tải dữ liệu mới nhất khi mở bảng xếp hạng
    this.syncCurrentPlayer(false);
  },

  refresh() {
    this.syncCurrentPlayer(true);
  },

  promptRename() {
    const meta = SaveManager.getProfilesMeta();
    const activeSlot = meta.slots.find(s => s.id === SaveManager.getActiveSlotId());
    const curName = activeSlot?.name || 'Chiến Binh Của Bạn';
    const newName = prompt('Nhập tên hiển thị của bạn trên Bảng Xếp Hạng:', curName);
    if (newName && newName.trim() && newName.trim() !== curName) {
      SaveManager.renameProfile(SaveManager.getActiveSlotId(), newName.trim());
      this.syncCurrentPlayer(true);
      if (typeof UI !== 'undefined') {
        UI.showToast(`✅ Đã đổi tên hiển thị thành: ${newName.trim()}`);
      }
    }
  },

  _formatLastActive(timestamp, isMe) {
    if (isMe) return '<span style="color:#10b981; font-weight:700;">🟢 Online (Bạn)</span>';
    if (!timestamp) return '<span style="color:#94a3b8;">⚪ Offline</span>';
    const diff = Math.max(0, Date.now() - timestamp);
    if (diff < 3 * 60 * 1000) {
      return '<span style="color:#10b981; font-weight:700;">🟢 Online</span>';
    }
    if (diff < 60 * 60 * 1000) {
      const m = Math.max(1, Math.floor(diff / 60000));
      return `<span style="color:#94a3b8;">⚪ Off ${m}p trước</span>`;
    }
    if (diff < 24 * 3600 * 1000) {
      const h = Math.floor(diff / 3600000);
      return `<span style="color:#94a3b8;">⚪ Off ${h}h trước</span>`;
    }
    const d = Math.floor(diff / 86400000);
    return `<span style="color:#64748b;">⚪ Off ${d} ngày trước</span>`;
  },

  render(filter = null) {
    if (filter) this._currentFilter = filter;
    const sorted = this.getSortedPlayers(this._currentFilter);
    const container = document.getElementById('leaderboard-table-body');
    if (!container) return;

    // Cập nhật tab active
    document.querySelectorAll('.btn-lb-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this._currentFilter);
    });

    const myUid = this._getOrCreatePlayerId();
    let html = '';
    sorted.forEach((p, index) => {
      const rank = index + 1;
      const isMe = p.isMe || p.id === myUid;
      const hero = CONFIG.getHeroById(p.heroId || 'hero_starter');
      const statusHtml = this._formatLastActive(p.lastActive, isMe);

      let rankBadge = `<span style="font-weight:bold; font-size:14px; color:#94a3b8;">#${rank}</span>`;
      if (rank === 1) rankBadge = `<span style="font-size:20px;">🥇</span>`;
      else if (rank === 2) rankBadge = `<span style="font-size:18px;">🥈</span>`;
      else if (rank === 3) rankBadge = `<span style="font-size:16px;">🥉</span>`;

      html += `
        <tr style="background:${isMe ? 'rgba(16,185,129,0.12)' : (rank % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent')}; border-bottom:1px solid rgba(255,255,255,0.05); text-align:center;">
          <td style="padding:10px 8px;">${rankBadge}</td>
          <td style="padding:10px 8px; text-align:left;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">${hero?.icon || '⚔️'}</span>
              <div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <strong style="color:${isMe ? '#34d399' : '#f8fafc'}; font-size:13.5px;">${p.name}</strong>
                  ${isMe ? '<span style="background:#10b981; color:#022c22; font-size:9px; font-weight:800; padding:1px 5px; border-radius:4px;">BẠN</span>' : ''}
                </div>
                <div style="font-size:11px; color:#94a3b8; display:flex; align-items:center; gap:6px; margin-top:2px;">
                  <span>${hero?.name} (E${p.constellation || 0})</span>
                  <span>•</span>
                  ${statusHtml}
                </div>
              </div>
            </div>
          </td>
          <td style="padding:10px 8px; font-weight:bold; color:#60a5fa;">Lv.${p.level}</td>
          <td style="padding:10px 8px; color:#fbbf24; font-weight:bold;">Ải ${p.stage || 1}</td>
          <td style="padding:10px 8px; color:#f43f5e; font-weight:bold;">Tầng ${p.towerFloor || 1}</td>
          <td style="padding:10px 8px; color:#a855f7; font-weight:bold;">${p.power ? p.power.toLocaleString() : '---'}</td>
        </tr>
      `;
    });

    container.innerHTML = html;
    this._updateSyncStatusBadge(this._syncStatus);
  }
};
