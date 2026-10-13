/**
 * IDLE RPG - DYNAMIC GLOBAL LEADERBOARD & CLOUD SYNC SYSTEM
 * Bảng xếp hạng toàn cầu năng động (Cấp độ, Leo Tháp, Lực Chiến) & Đồng bộ dữ liệu người chơi
 */

const Leaderboard = {
  _currentFilter: 'level', // 'level' | 'tower' | 'power'
  _cachedPlayers: [],
  _serverUrl: 'https://idle-game-ms6o.onrender.com/api',

  init() {
    this._loadInitialData();
  },

  _loadInitialData() {
    // Lấy dữ liệu local hoặc tạo danh sách đối thủ sinh động
    const saved = localStorage.getItem('idle_rpg_leaderboard_cache');
    if (saved) {
      try {
        this._cachedPlayers = JSON.parse(saved);
      } catch (e) {}
    }

    if (!this._cachedPlayers || this._cachedPlayers.length === 0) {
      this._seedInitialCompetitors();
    }

    // Tự động đồng bộ điểm số của người chơi hiện tại vào bảng xếp hạng
    this.syncCurrentPlayer();
  },

  _seedInitialCompetitors() {
    this._cachedPlayers = [
      { id: 'bot_1', name: 'Độc Cô Cầu Bại', heroId: 'hero_raiden', constellation: 6, level: 88, stage: 52, towerFloor: 65, power: 852000, lastActive: Date.now() - 3600000 },
      { id: 'bot_2', name: 'Vô Danh Kiếm Thánh', heroId: 'hero_changli', constellation: 4, level: 75, stage: 45, towerFloor: 50, power: 620000, lastActive: Date.now() - 7200000 },
      { id: 'bot_3', name: 'Thần Kiếm Tiêu Dao', heroId: 'hero_jiyan', constellation: 3, level: 68, stage: 38, towerFloor: 42, power: 480000, lastActive: Date.now() - 14400000 },
      { id: 'bot_4', name: 'Nham Vương Tông Sư', heroId: 'hero_zhongli', constellation: 2, level: 60, stage: 32, towerFloor: 35, power: 360000, lastActive: Date.now() - 28800000 },
      { id: 'bot_5', name: 'Bạch Y Hiệp Khách', heroId: 'hero_kazuha', constellation: 2, level: 54, stage: 28, towerFloor: 30, power: 275000, lastActive: Date.now() - 43200000 },
      { id: 'bot_6', name: 'Thủy Thần Ca Sĩ', heroId: 'hero_furina', constellation: 1, level: 45, stage: 22, towerFloor: 24, power: 190000, lastActive: Date.now() - 86400000 },
      { id: 'bot_7', name: 'Hỏa Cung Tân Thủ', heroId: 'hero_amber', constellation: 1, level: 32, stage: 15, towerFloor: 16, power: 95000, lastActive: Date.now() - 172800000 },
      { id: 'bot_8', name: 'Tân Binh Lữ Hành', heroId: 'hero_traveler', constellation: 0, level: 18, stage: 8, towerFloor: 9, power: 32000, lastActive: Date.now() - 259200000 }
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
    let pid = localStorage.getItem('idle_rpg_unique_uid');
    if (!pid) {
      pid = 'player_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('idle_rpg_unique_uid', pid);
    }
    return pid;
  },

  syncCurrentPlayer() {
    if (!GameState.player) return;
    const meta = SaveManager.getProfilesMeta();
    const activeSlot = meta.slots.find(s => s.id === SaveManager.getActiveSlotId());
    const playerName = activeSlot?.name || 'Chiến Binh Của Bạn';
    const activeHero = GameState.heroes?.find(h => h.id === GameState.activeHeroId) || { constellation: 0 };
    const myUid = this._getOrCreatePlayerId();

    const myProfile = {
      id: myUid,
      name: playerName,
      heroId: GameState.activeHeroId || 'hero_traveler',
      constellation: activeHero.constellation || 0,
      level: GameState.player.level || 1,
      stage: GameState.stage?.current || 1,
      towerFloor: GameState.dungeon?.towerHighestFloor || GameState.dungeon?.abyssFloor || 1,
      power: this.calculateCurrentPower(),
      lastActive: Date.now()
    };

    // Cập nhật vào danh sách cục bộ
    const idx = this._cachedPlayers.findIndex(p => p.id === myUid);
    if (idx !== -1) {
      this._cachedPlayers[idx] = Object.assign({}, myProfile, { isMe: true });
    } else {
      this._cachedPlayers.push(Object.assign({}, myProfile, { isMe: true }));
    }
    this._saveCache();

    // Thử gửi cập nhật lên máy chủ từ xa nếu có
    this._syncToServer(myProfile);
  },

  async _syncToServer(playerData) {
    try {
      const url = (typeof CONFIG !== 'undefined' && CONFIG.SERVER_URL) ? CONFIG.SERVER_URL : this._serverUrl;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
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
          if (document.getElementById('leaderboard-modal') && !document.getElementById('leaderboard-modal').classList.contains('hidden')) {
            this.render();
          }
        }
      }
    } catch (e) {}
  },

  async fetchRemoteLeaderboard() {
    try {
      const url = (typeof CONFIG !== 'undefined' && CONFIG.SERVER_URL) ? CONFIG.SERVER_URL : this._serverUrl;
      const res = await fetch(`${url}/leaderboard`).catch(() => null);
      if (res && res.ok) {
        const remoteList = await res.json();
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          const myUid = this._getOrCreatePlayerId();
          this._cachedPlayers = remoteList.map(p => Object.assign({}, p, { isMe: p.id === myUid }));
          this._saveCache();
          this.render();
        }
      }
    } catch (e) {}
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
    this.syncCurrentPlayer();
    this.fetchRemoteLeaderboard();
    const modal = document.getElementById('leaderboard-modal');
    if (!modal) return;
    this.render();
    modal.classList.remove('hidden');
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

    let html = '';
    sorted.forEach((p, index) => {
      const rank = index + 1;
      const isMe = p.isMe || p.id === this._getOrCreatePlayerId();
      const hero = CONFIG.getHeroById(p.heroId || 'hero_traveler');

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
                <strong style="color:${isMe ? '#34d399' : '#f8fafc'}; font-size:13px;">${p.name}</strong>
                ${isMe ? '<span style="background:#10b981; color:#022c22; font-size:9px; font-weight:800; padding:1px 4px; border-radius:4px; margin-left:4px;">BẠN</span>' : ''}
                <div style="font-size:11px; color:#94a3b8;">${hero?.name} (E${p.constellation || 0})</div>
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
  }
};
