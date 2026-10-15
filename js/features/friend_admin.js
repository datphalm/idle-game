/**
 * IDLE RPG - FRIEND ACCOUNT MANAGER & ACTIVITY LOG TRACKER
 * Quản lý thông tin tài khoản bạn bè, theo dõi lịch sử hoạt động và kiểm tra nhật ký (Logs)
 */

const FriendAdmin = {
  _logs: [],
  _serverUrl: 'https://idle-game-ypvy.onrender.com/api',

  init() {
    this._loadLogs();
  },

  _loadLogs() {
    try {
      const raw = localStorage.getItem('idle_rpg_friend_logs');
      if (raw) this._logs = JSON.parse(raw);
    } catch (e) {}

    if (!this._logs || this._logs.length === 0) {
      this._seedInitialLogs();
    }
  },

  _seedInitialLogs() {
    this._logs = [
      { id: 1, time: Date.now() - 3600000, player: 'Độc Cô Cầu Bại', type: 'gacha', tag: 'GACHA', color: '#d500f9', message: 'Chiêu mộ thành công Raiden Shogun (E6) cực phẩm!' },
      { id: 2, time: Date.now() - 7200000, player: 'Vô Danh Kiếm Thánh', type: 'forge', tag: 'RÈN', color: '#ff5722', message: 'Đập thành công Thần Kiếm +15 (Thần Thoại) không cần bùa!' },
      { id: 3, time: Date.now() - 10800000, player: 'Thần Kiếm Tiêu Dao', type: 'boss', tag: 'TRÙM', color: '#ef4444', message: 'Hạ gục Hắc Long Tầng 40 Hư Không Tháp!' },
      { id: 4, time: Date.now() - 18000000, player: 'Nham Vương Tông Sư', type: 'anticheat', tag: 'BẢO MẬT', color: '#10b981', message: 'Hệ thống Anti-Cheat quét toàn vẹn: An toàn 100%.' }
    ];
    this._saveLogs();
  },

  _saveLogs() {
    try {
      localStorage.setItem('idle_rpg_friend_logs', JSON.stringify(this._logs.slice(0, 150)));
    } catch (e) {}
  },

  // Ghi nhật ký hành động của người chơi
  logAction(type, message, details = {}) {
    const meta = SaveManager.getProfilesMeta();
    const activeSlot = meta.slots.find(s => s.id === SaveManager.getActiveSlotId());
    const playerName = activeSlot?.name || 'Chiến Binh Của Bạn';

    const typeMeta = {
      gacha: { tag: 'GACHA', color: '#d500f9' },
      forge: { tag: 'RÈN ĐỒ', color: '#ff5722' },
      boss:  { tag: 'SĂN BOSS', color: '#ef4444' },
      level: { tag: 'CẤP ĐỘ', color: '#3b82f6' },
      anticheat: { tag: 'CẢNH BÁO BẢO MẬT', color: '#f59e0b' }
    }[type] || { tag: 'HOẠT ĐỘNG', color: '#10b981' };

    const entry = {
      id: Date.now() + Math.random(),
      time: Date.now(),
      player: playerName,
      type: type,
      tag: typeMeta.tag,
      color: typeMeta.color,
      message: message,
      details: details
    };

    this._logs.unshift(entry);
    if (this._logs.length > 200) this._logs.pop();
    this._saveLogs();

    // Đồng bộ log lên server nếu có kết nối
    this._syncLogToServer(entry);
  },

  async _syncLogToServer(logEntry) {
    try {
      const url = (typeof CONFIG !== 'undefined' && CONFIG.SERVER_URL) ? CONFIG.SERVER_URL : this._serverUrl;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(`${url}/admin/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeoutId);
    } catch (e) {}
  },

  async fetchRemoteLogs() {
    try {
      const url = (typeof CONFIG !== 'undefined' && CONFIG.SERVER_URL) ? CONFIG.SERVER_URL : this._serverUrl;
      const res = await fetch(`${url}/admin/logs`).catch(() => null);
      if (res && res.ok) {
        const serverLogs = await res.json();
        if (Array.isArray(serverLogs) && serverLogs.length > 0) {
          this._logs = serverLogs;
          this._saveLogs();
          this.render();
        }
      }
    } catch (e) {}
  },

  openAdminModal() {
    this.fetchRemoteLogs();
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    this.render();
    modal.classList.remove('hidden');
  },

  render(filterType = 'all') {
    // 1. Render danh sách hồ sơ bạn bè & tài khoản
    const meta = SaveManager.getProfilesMeta();
    const accountsContainer = document.getElementById('admin-accounts-list');
    if (accountsContainer) {
      let accHtml = '';
      meta.slots.forEach(slot => {
        const hero = CONFIG.getHeroById(slot.heroId || 'hero_starter');
        const timeStr = slot.timestamp ? new Date(slot.timestamp).toLocaleString('vi-VN') : 'Chưa đăng nhập';
        accHtml += `
          <div class="glass-panel" style="padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">${slot.isEmpty ? '👤' : (hero?.icon || '⚔️')}</span>
              <div>
                <strong style="color:#60a5fa; font-size:13px;">${slot.name} (${slot.id.toUpperCase()})</strong>
                <div style="font-size:11px; color:#94a3b8;">
                  ${slot.isEmpty ? '(Slot trống)' : `Cấp: <b style="color:#f8fafc;">Lv.${slot.level}</b> | Ải: <b style="color:#fbbf24;">${slot.stage || 1}</b> | Lần cuối: ${timeStr}`}
                </div>
              </div>
            </div>
            <div style="font-size:12px; color:#34d399; font-weight:bold;">
              ${slot.isEmpty ? '---' : `💰 ${(slot.gold || 0).toLocaleString()} | 💎 ${(slot.diamond || 0).toLocaleString()}`}
            </div>
          </div>
        `;
      });
      accountsContainer.innerHTML = accHtml;
    }

    // 2. Render nhật ký hoạt động (Logs)
    const logsContainer = document.getElementById('admin-logs-list');
    if (logsContainer) {
      const filtered = filterType === 'all' ? this._logs : this._logs.filter(l => l.type === filterType);
      if (filtered.length === 0) {
        logsContainer.innerHTML = `<div style="text-align:center; color:#64748b; padding:20px;">Chưa có nhật ký hoạt động nào.</div>`;
        return;
      }

      let logHtml = '';
      filtered.forEach(l => {
        const dateStr = new Date(l.time).toLocaleTimeString('vi-VN');
        logHtml += `
          <div style="padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:${l.color}20; color:${l.color}; border:1px solid ${l.color}; font-weight:bold; font-size:10px; padding:2px 6px; border-radius:4px;">
                ${l.tag}
              </span>
              <strong style="color:#e2e8f0;">[${l.player}]:</strong>
              <span style="color:#cbd5e1;">${l.message}</span>
            </div>
            <span style="color:#64748b; font-size:11px; white-space:nowrap;">${dateStr}</span>
          </div>
        `;
      });
      logsContainer.innerHTML = logHtml;
    }
  }
};
