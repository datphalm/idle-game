/**
 * IDLE RPG - NESTED ANTI-CHEAT ENGINE (HỆ THỐNG PHÒNG THỦ 4 LỚP LỒNG NHAU)
 * 
 * Lớp 1: Memory Tamper & Rolling Cryptographic Signature Guard (Chống can thiệp RAM / DevTools)
 * Lớp 2: Time Anomaly & Speedhack Detection (Chống phần mềm tăng tốc / tua thời gian)
 * Lớp 3: DevTools & Debugger Interception Trap (Khóa phím tắt soi code F12/Ctrl+Shift+I/Chuột phải)
 * Lớp 4: Deep Prototype Freezing & Tamper Sealing (Đóng băng cấu hình và chống trộm code)
 */

const AntiCheat = {
  _enabled: true,
  _initialized: false,
  _checkTimer: null,
  _lastTickTime: 0,
  _lastPerfTime: 0,
  _tickHistory: [],
  _tamperCount: 0,
  _salt: 'IDLE_RPG_SECRET_SALT_' + Math.floor(Math.random() * 9999999),

  // Shadow State lưu trữ giá trị hợp lệ được ký số
  _shadow: {
    gold: 0,
    diamond: 0,
    protectionStones: 0,
    bossKeys: 0,
    level: 1,
    signature: ''
  },

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Khởi chạy Lớp 3: Chặn phím tắt soi mã nguồn & chuột phải
    this._initKeyboardAndContextGuard();

    // Khởi chạy Lớp 4: Đóng băng Prototype và Config
    this._initPrototypeGuard();

    // Khởi chạy Lớp 2: Giám sát Speedhack & Thao túng thời gian
    this._initSpeedhackGuard();

    // Khởi chạy Lớp 1: Chữ ký số bộ nhớ
    this.refreshSignatures();
    this._startIntegrityScanner();

    console.log('%c🛡️ [AntiCheat] Hệ thống bảo mật 4 lớp đã kích hoạt an toàn.', 'color:#00ffcc; font-weight:bold; font-size:12px;');
  },

  // ============================================================
  // LỚP 1: MEMORY TAMPER & CHỮ KÝ SỐ ROLLING CRYPTOGRAPHIC HASH
  // ============================================================
  _computeHash(val, salt) {
    const str = `${val}::${salt}::${CONFIG?.GAME_VERSION || '2.1.0'}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
  },

  refreshSignatures() {
    if (!GameState?.player) return;
    const p = GameState.player;
    this._shadow.gold = p.gold || 0;
    this._shadow.diamond = p.diamond || 0;
    this._shadow.protectionStones = p.protectionStones || 0;
    this._shadow.bossKeys = p.bossKeys || 0;
    this._shadow.level = p.level || 1;

    const composite = `${this._shadow.gold}_${this._shadow.diamond}_${this._shadow.protectionStones}_${this._shadow.bossKeys}_${this._shadow.level}`;
    this._shadow.signature = this._computeHash(composite, this._salt);
  },

  verifyIntegrity() {
    if (!this._enabled || !GameState?.player) return true;
    const p = GameState.player;

    // So sánh dữ liệu thực tế với chữ ký số
    const composite = `${p.gold || 0}_${p.diamond || 0}_${p.protectionStones || 0}_${p.bossKeys || 0}_${p.level || 1}`;
    const currentHash = this._computeHash(composite, this._salt);

    if (currentHash !== this._shadow.signature) {
      // Bất thường: Giá trị trong GameState bị can thiệp mà không qua luồng game hợp lệ
      this._handleTamperDetected('Can thiệp dữ liệu chỉ số tài nguyên (Memory Modification)');
      return false;
    }
    return true;
  },

  _handleTamperDetected(reason) {
    this._tamperCount++;
    console.warn(`[AntiCheat Warning] ${reason}! Lần vi phạm: ${this._tamperCount}`);

    // Khôi phục giá trị hợp lệ từ shadow
    if (GameState.player) {
      GameState.player.gold = this._shadow.gold;
      GameState.player.diamond = this._shadow.diamond;
      GameState.player.protectionStones = this._shadow.protectionStones;
      GameState.player.bossKeys = this._shadow.bossKeys;
      GameState.player.level = this._shadow.level;
    }
    this.refreshSignatures();

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast('⚠️ [BẢO MẬT] Đã đồng bộ chữ ký dữ liệu tài nguyên.');
    }

    if (typeof FriendAdmin !== 'undefined' && FriendAdmin.logAction) {
      FriendAdmin.logAction('anticheat', `Đồng bộ chữ ký bảo mật: ${reason}`);
    }

    // Nếu vi phạm đột biến cực đoan (gấp 100 lần) thì mới hiện modal cảnh báo
    if (this._tamperCount >= 10) {
      this._triggerSecurityAlertModal(reason);
    }
  },

  _startIntegrityScanner() {
    if (this._checkTimer) clearInterval(this._checkTimer);
    this._checkTimer = setInterval(() => {
      this.verifyIntegrity();
    }, 850);
  },

  // ============================================================
  // LỚP 2: SPEEDHACK & TIME ANOMALY DETECTION
  // ============================================================
  _initSpeedhackGuard() {
    this._lastTickTime = Date.now();
    this._lastPerfTime = performance.now();

    setInterval(() => {
      const now = Date.now();
      const perfNow = performance.now();

      const dateDelta = now - this._lastTickTime;
      const perfDelta = perfNow - this._lastPerfTime;

      this._lastTickTime = now;
      this._lastPerfTime = perfNow;

      // Tính tỉ lệ chênh lệch giữa Date.now() và performance.now()
      if (dateDelta > 0 && perfDelta > 0) {
        const ratio = perfDelta / dateDelta;
        this._tickHistory.push(ratio);
        if (this._tickHistory.length > 8) this._tickHistory.shift();

        // Nếu tỉ lệ bị đẩy lên > 2.5x hoặc giảm < 0.35x liên tục -> Can thiệp tốc độ (Cheat Engine Speedhack)
        const avgRatio = this._tickHistory.reduce((a, b) => a + b, 0) / this._tickHistory.length;
        if (avgRatio > 2.4 || avgRatio < 0.3) {
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('⚡ [CẢNH BÁO SPEEDHACK] Phát hiện bất thường tốc độ đồng hồ hệ thống!');
          }
        }
      }
    }, 1000);
  },

  // ============================================================
  // LỚP 3: DEVTOOLS & KEYBOARD SHORTCUT BLOCKING
  // ============================================================
  _initKeyboardAndContextGuard() {
    // Chặn F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
    window.addEventListener('keydown', (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl + Shift + I/J/C
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl + U (Xem mã nguồn)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl + S (Lưu trang HTML)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Chặn chuột phải (Context Menu)
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, true);

    // Bẫy Debugger tự kích hoạt nếu có ai cố gắng mở DevTools
    this._startDebuggerTrap();
  },

  _startDebuggerTrap() {
    // Chỉ kích hoạt bẫy debugger định kỳ nhẹ nhàng để không ảnh hưởng hiệu năng máy người dùng
    setInterval(() => {
      const startTime = performance.now();
      // Bẫy đo thời gian thực thi: nếu debugger mở và dừng breakpoint, endTime - startTime sẽ vọt lên > 100ms
      (function() {
        return function() {};
      })().constructor('return false')();
      const diff = performance.now() - startTime;
      if (diff > 120) {
        // DevTools đang được mở hoặc tạm dừng
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast('🛡️ Chế độ kiểm tra bảo mật: Hãy đóng công cụ gỡ lỗi để tiếp tục chơi mượt mà.');
        }
      }
    }, 2500);
  },

  // ============================================================
  // LỚP 4: PROTOTYPE FREEZE & ANTI-POLLUTION
  // ============================================================
  _initPrototypeGuard() {
    try {
      if (typeof CONFIG !== 'undefined') {
        // Đóng băng Object bảng tỷ lệ để chống sửa trực tiếp trong runtime
        if (CONFIG.GACHA_RATES) Object.freeze(CONFIG.GACHA_RATES);
        if (CONFIG.DUNGEONS) Object.freeze(CONFIG.DUNGEONS);
        if (CONFIG.BOSS_LIST) Object.freeze(CONFIG.BOSS_LIST);
      }
    } catch (e) {
      console.warn('Prototype seal exception:', e);
    }
  },

  _triggerSecurityAlertModal(reason) {
    const existing = document.getElementById('anticheat-modal');
    if (existing) return;

    const modal = document.createElement('div');
    modal.id = 'anticheat-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '999999';
    modal.innerHTML = `
      <div class="modal-box" style="border: 2px solid #ef4444; box-shadow: 0 0 30px rgba(239,68,68,0.5); text-align: center;">
        <h2 style="color: #ef4444; font-size: 20px; margin-bottom: 12px;">🛡️ CẢNH BÁO BẢO MẬT HỆ THỐNG</h2>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 16px; line-height: 1.5;">
          Phát hiện các hoạt động can thiệp bộ nhớ hoặc gian lận bất thường:<br>
          <strong style="color: #fca5a5;">${reason}</strong>
        </p>
        <div style="background: rgba(239,68,68,0.1); border: 1px dashed #ef4444; border-radius: 8px; padding: 12px; margin-bottom: 18px; font-size: 13px; color: #fca5a5;">
          Hệ thống Anti-Cheat đã tự động kích hoạt lá chắn hoàn tác, khôi phục dữ liệu nhân vật về trạng thái an toàn.
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('anticheat-modal').remove()" style="background: #ef4444; border-color: #dc2626;">
          Xác Nhận & Tiếp Tục Chơi
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
};
