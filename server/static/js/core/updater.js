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
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.webkitBackdropFilter = 'blur(10px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '999999';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';

    modal.innerHTML = `
      <div style="background: linear-gradient(155deg, #13192e, #0b0f1d); border: 2px solid #00ffcc; box-shadow: 0 0 40px rgba(0,255,204,0.4), 0 10px 40px rgba(0,0,0,0.8); max-width: 520px; width: 100%; border-radius: 16px; padding: 24px; box-sizing: border-box; position: relative; animation: modalPop 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h2 style="color: #00ffcc; font-size: 20px; margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 900;">
            🚀 BẢN CẬP NHẬT MỚI!
          </h2>
          <span style="background: rgba(0,255,204,0.15); color: #00ffcc; border: 1px solid #00ffcc; padding: 4px 12px; border-radius: 12px; font-weight: 800; font-size: 13px;">
            v${updateData.version}
          </span>
        </div>

        <p style="color: #e2e8f0; font-size: 13.5px; font-weight: 600; margin-bottom: 14px; line-height: 1.4;">
          ${updateData.title || 'Phiên bản mới đã sẵn sàng để tải về và trải nghiệm.'}
        </p>

        <div style="background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; text-align: left; max-height: 260px; overflow-y: auto;">
          <div style="color: #00ffcc; font-weight: 800; font-size: 13px; margin-bottom: 8px;">Nội dung cập nhật mới:</div>
          <ul style="color: #cbd5e1; font-size: 13px; padding-left: 18px; margin: 0; line-height: 1.6;">
            ${changelogHtml}
          </ul>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 11px; color: #94a3b8; margin-right: auto;">💡 Mẹo: Đóng và mở lại IdleRPG.exe để nạp bản mới.</span>
          <button class="btn btn-secondary" onclick="document.getElementById('update-modal').remove()" style="padding: 8px 16px; font-weight: 700;">
            Để Sau
          </button>
          <button class="btn btn-primary" onclick="location.reload()" style="background: linear-gradient(135deg, #00ffcc, #0284c7); color: #0f172a; font-weight: 900; border-color: #00ffcc; padding: 8px 18px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(0,255,204,0.4);">
            🔄 Tải Lại Game Ngay
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
};
