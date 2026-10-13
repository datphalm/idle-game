/**
 * IDLE RPG - AUTO UPDATER MODULE
 * Tự động kiểm tra phiên bản mới nhất từ máy chủ từ xa khi khởi chạy game.
 */

const Updater = {
  _checked: false,

  init() {
    // Tự động kiểm tra cập nhật ngầm sau khi game vào ổn định (3.5s)
    setTimeout(() => {
      this.checkForUpdates(true);
    }, 3500);
  },

  async checkForUpdates(silent = false) {
    const currentVersion = CONFIG.GAME_VERSION || '2.1.0';
    const updateUrl = CONFIG.UPDATE_URL;

    try {
      // Thử fetch manifest cập nhật từ xa
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(updateUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.version && this._isNewerVersion(data.version, currentVersion)) {
          this.showUpdateModal(data);
          return true;
        }
      }

      // Nếu không có bản mới
      if (!silent && typeof UI !== 'undefined') {
        UI.showToast(`✨ Bạn đang sử dụng phiên bản mới nhất (${currentVersion})!`);
      }
      return false;
    } catch (e) {
      if (!silent) {
        if (typeof UI !== 'undefined') {
          UI.showToast(`✨ Đang chạy phiên bản hiện tại (${currentVersion})`);
        }
      }
      return false;
    }
  },

  _isNewerVersion(remote, current) {
    const rParts = remote.split('.').map(n => parseInt(n, 10) || 0);
    const cParts = current.split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] || 0;
      const c = cParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
    return false;
  },

  showUpdateModal(updateData) {
    const existing = document.getElementById('update-modal');
    if (existing) existing.remove();

    const changelogHtml = (updateData.changelog || [
      'Nâng cấp hệ thống và vá lỗi tối ưu hiệu năng',
      'Cân bằng lại độ khó và trang bị mới'
    ]).map(item => `<li style="margin-bottom: 6px;">✨ ${item}</li>`).join('');

    const modal = document.createElement('div');
    modal.id = 'update-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
      <div class="modal-box" style="border: 2px solid #00ffcc; box-shadow: 0 0 30px rgba(0,255,204,0.3); max-width: 500px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h2 style="color: #00ffcc; font-size: 20px; margin: 0; display: flex; align-items: center; gap: 8px;">
            🚀 BẢN CẬP NHẬT MỚI!
          </h2>
          <span style="background: rgba(0,255,204,0.15); color: #00ffcc; border: 1px solid #00ffcc; padding: 2px 10px; border-radius: 12px; font-weight: bold; font-size: 13px;">
            v${updateData.version}
          </span>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 14px;">
          ${updateData.title || 'Phiên bản mới đã sẵn sàng để tải về và trải nghiệm.'}
        </p>

        <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; text-align: left;">
          <div style="color: #e2e8f0; font-weight: bold; font-size: 13px; margin-bottom: 8px;">Nội dung cập nhật:</div>
          <ul style="color: #cbd5e1; font-size: 13px; padding-left: 18px; margin: 0; line-height: 1.5;">
            ${changelogHtml}
          </ul>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn btn-secondary" onclick="document.getElementById('update-modal').remove()">
            Để Sau
          </button>
          <a class="btn btn-primary" href="${updateData.downloadUrl || '#'}" target="_blank" style="background: #00ffcc; color: #0f172a; font-weight: bold; border-color: #00ffcc; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;" onclick="document.getElementById('update-modal').remove()">
            📥 Tải Bản Cập Nhật Ngay
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
};
