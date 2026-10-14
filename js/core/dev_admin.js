/**
 * IDLE RPG — DEVELOPER ADMIN & TEST MENU
 * Menu bí mật / Chuyên dụng dành riêng cho nhà phát triển kiểm thử tính năng (Local/Machine-only).
 */

const DevAdmin = {
  isDevMachine() {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '' || window.location.protocol === 'file:';
    const isDevSaved = localStorage.getItem('idle_rpg_dev_mode') === 'true';
    return isLocal || isDevSaved;
  },

  init() {
    // Luôn đăng ký phím tắt bí mật: Phím ~ (Backtick) hoặc F2 để mở Menu Test
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~' || e.key === 'F2') {
        e.preventDefault();
        this.toggleModal();
      }
    });

    // Cho phép kích hoạt qua click 5 lần liên tiếp vào version badge
    let clickCount = 0;
    let clickTimer = null;
    const versionEl = document.getElementById('game-version') || document.querySelector('.app-version');
    if (versionEl) {
      versionEl.style.cursor = 'pointer';
      versionEl.title = 'Nhấp 5 lần để mở Menu Test Chức Năng';
      versionEl.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 2500);
        if (clickCount >= 5) {
          clickCount = 0;
          localStorage.setItem('idle_rpg_dev_mode', 'true');
          this.toggleModal();
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('🧪 [DEV] Đã mở khóa Menu Test Chức Năng!');
          }
        }
      });
    }

    this.renderToggleButton();
  },

  renderToggleButton() {
    if (!this.isDevMachine()) return;
    if (document.getElementById('btn-dev-admin-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'btn-dev-admin-toggle';
    btn.className = 'btn-dev-toggle';
    btn.innerHTML = '🧪 TEST MENU <span style="font-size:0.65rem; opacity:0.8;">(~)</span>';
    btn.onclick = () => this.toggleModal();
    document.body.appendChild(btn);
  },

  toggleModal() {
    let modal = document.getElementById('dev-admin-modal');
    if (!modal) {
      this.createModal();
      modal = document.getElementById('dev-admin-modal');
    }
    if (modal) {
      modal.classList.toggle('hidden');
      if (!modal.classList.contains('hidden')) {
        this.updateModalInfo();
      }
    }
  },

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'dev-admin-modal';
    modal.className = 'dev-admin-modal hidden';
    modal.innerHTML = `
      <div class="dev-modal-backdrop" onclick="DevAdmin.toggleModal()"></div>
      <div class="dev-modal-panel glass-panel">
        <div class="dev-modal-header">
          <div class="dev-header-title">
            <span class="dev-badge">DEV TOOL</span>
            <h3>🧪 Menu Test Chức Năng (Admin Panel)</h3>
          </div>
          <button class="btn-close-dev" onclick="DevAdmin.toggleModal()">✕</button>
        </div>

        <div class="dev-info-bar">
          <span>🎮 Hero hiện tại: <strong id="dev-active-hero-txt" style="color:#00ffcc;">-</strong></span>
          <span>💰 Vàng: <strong id="dev-gold-txt" style="color:#ffd700;">-</strong></span>
          <span>💎 KC: <strong id="dev-diamonds-txt" style="color:#38bdf8;">-</strong></span>
          <span>Ải: <strong id="dev-stage-txt" style="color:#f43f5e;">-</strong></span>
        </div>

        <!-- Tab Navigation -->
        <div class="dev-nav-tabs">
          <button class="dev-tab-btn active" data-devtab="resources" onclick="DevAdmin.switchTab('resources')">💰 Tài Nguyên</button>
          <button class="dev-tab-btn" data-devtab="heroes" onclick="DevAdmin.switchTab('heroes')">👑 Anh Hùng & Nộ</button>
          <button class="dev-tab-btn" data-devtab="gear" onclick="DevAdmin.switchTab('gear')">⚔️ Trang Bị Bá Đạo</button>
          <button class="dev-tab-btn" data-devtab="combat" onclick="DevAdmin.switchTab('combat')">🚀 Chiến Đấu & Ải</button>
          <button class="dev-tab-btn" data-devtab="system" onclick="DevAdmin.switchTab('system')">⚙️ Hệ Thống</button>
        </div>

        <!-- Tab Content 1: Tài Nguyên -->
        <div id="dev-tab-resources" class="dev-tab-pane active">
          <div class="dev-action-group">
            <h4>💰 Thêm Vàng</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" onclick="DevAdmin.addGold(100000)">+100K Vàng</button>
              <button class="btn dev-btn" onclick="DevAdmin.addGold(10000000)">+10 Triệu Vàng</button>
              <button class="btn dev-btn dev-btn-primary" onclick="DevAdmin.addGold(1000000000)">+1 TỶ Vàng</button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>💎 Thêm Kim Cương</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" onclick="DevAdmin.addDiamonds(10000)">+10K Kim Cương</button>
              <button class="btn dev-btn" onclick="DevAdmin.addDiamonds(500000)">+500K Kim Cương</button>
              <button class="btn dev-btn dev-btn-primary" onclick="DevAdmin.addDiamonds(10000000)">+10 Triệu KC</button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>🗝️ Chìa Khóa, Vé & Nguyên Liệu Rèn</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" onclick="DevAdmin.addKeys(100)">+100 Chìa Khóa PB</button>
              <button class="btn dev-btn" onclick="DevAdmin.addBossTickets(100)">+100 Vé Boss</button>
              <button class="btn dev-btn" onclick="DevAdmin.addForgeStones(50000)">+50K Đá Cường Hóa</button>
              <button class="btn dev-btn" onclick="DevAdmin.addGachaTickets(1000)">+1000 Vé Gacha</button>
            </div>
          </div>
        </div>

        <!-- Tab Content 2: Anh Hùng & Nộ -->
        <div id="dev-tab-heroes" class="dev-tab-pane">
          <div class="dev-action-group">
            <h4>👑 Mở Khóa & Max Sức Mạnh Anh Hùng</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn dev-btn-special" onclick="DevAdmin.unlockAllHeroesE6()">
                🌟 MỞ KHÓA TẤT CẢ 7 ANH HÙNG (E6 & MAX SKILL)
              </button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>🎬 Test Nộ Tức Thì (Chọn để tung Ultimate ngay)</h4>
            <div class="dev-btn-row dev-grid-2col">
              <button class="btn dev-btn" onclick="DevAdmin.castUltimateForHero('hero_starter')">⚔️ Nộ: Hiệp Sĩ Khởi Đầu</button>
              <button class="btn dev-btn" onclick="DevAdmin.castUltimateForHero('hero_shadow_rogue')">🗡️ Nộ: Thích Khách Song Đao</button>
              <button class="btn dev-btn" onclick="DevAdmin.castUltimateForHero('hero_frost_knight')">❄️ Nộ: Băng Kiếm Sĩ</button>
              <button class="btn dev-btn" onclick="DevAdmin.castUltimateForHero('hero_spear_lancer')">⚡ Nộ: Long Thương Thủ</button>
              <button class="btn dev-btn" onclick="DevAdmin.castUltimateForHero('hero_flame_knight')">🔥 Nộ: Kiếm Sĩ Hỏa Diệm</button>
              <button class="btn dev-btn" onclick="DevAdmin.castUltimateForHero('hero_arcane_mage')">🌌 Nộ: Đại Pháp Sư Hư Không</button>
              <button class="btn dev-btn" style="background:#0284c7; border-color:#00e5ff; color:#ffffff;" onclick="DevAdmin.castUltimateForHero('hero_aetheris')">☄️ Nộ: AETHERIS (BÃO THIÊN THẠCH)</button>
              <button class="btn dev-btn dev-btn-god" onclick="DevAdmin.castUltimateForHero('hero_unknown_god')">👑 Nộ: VÔ CỰC NGHỊCH MỆNH THẦN QUÂN</button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>🔄 Đổi Ngay Nhân Vật Xuất Trận</h4>
            <div class="dev-btn-row dev-grid-2col">
              <button class="btn dev-btn" onclick="DevAdmin.setActiveHero('hero_starter')">Dùng: Hiệp Sĩ Khởi Đầu</button>
              <button class="btn dev-btn" onclick="DevAdmin.setActiveHero('hero_shadow_rogue')">Dùng: Thích Khách Song Đao</button>
              <button class="btn dev-btn" onclick="DevAdmin.setActiveHero('hero_frost_knight')">Dùng: Băng Kiếm Sĩ</button>
              <button class="btn dev-btn" onclick="DevAdmin.setActiveHero('hero_spear_lancer')">Dùng: Long Thương Thủ</button>
              <button class="btn dev-btn" onclick="DevAdmin.setActiveHero('hero_flame_knight')">Dùng: Kiếm Sĩ Hỏa Diệm</button>
              <button class="btn dev-btn" onclick="DevAdmin.setActiveHero('hero_arcane_mage')">Dùng: Đại Pháp Sư Hư Không</button>
              <button class="btn dev-btn" style="background:#0284c7; border-color:#00e5ff; color:#ffffff;" onclick="DevAdmin.setActiveHero('hero_aetheris')">Dùng: Aetheris — Tinh Vực</button>
              <button class="btn dev-btn dev-btn-god" onclick="DevAdmin.setActiveHero('hero_unknown_god')">Dùng: THẦN QUÂN VÔ CỰC</button>
            </div>
          </div>
        </div>

        <!-- Tab Content 3: Trang Bị -->
        <div id="dev-tab-gear" class="dev-tab-pane">
          <div class="dev-action-group">
            <h4>🛡️ Nhận Full Set Trang Bị Tối Thượng</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" style="background:#d97706;" onclick="DevAdmin.addGodEquipmentSet('mythic')">
                🔥 Nhận Full Set Thần Thoại +50
              </button>
              <button class="btn dev-btn" style="background:#7c3aed;" onclick="DevAdmin.addGodEquipmentSet('chaos')">
                🔮 Nhận Full Set Hỗn Mang +80
              </button>
              <button class="btn dev-btn dev-btn-god" onclick="DevAdmin.addGodEquipmentSet('unknown')">
                🌌 Nhận Full Set THẦN CẤP VÔ CỰC +100
              </button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>🎒 Tiện Ích Kho Đồ</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" onclick="DevAdmin.expandInventory(100)">📦 Mở Rộng 100 Ô Kho</button>
              <button class="btn dev-btn" onclick="DevAdmin.clearJunkGear()">🧹 Dọn Sạch Đồ Thường / Hiếm</button>
            </div>
          </div>
        </div>

        <!-- Tab Content 4: Chiến Đấu & Ải -->
        <div id="dev-tab-combat" class="dev-tab-pane">
          <div class="dev-action-group">
            <h4>🛡️ Chế Độ Thần (God Mode & One Hit)</h4>
            <div class="dev-btn-row">
              <button id="btn-dev-godmode" class="btn dev-btn" onclick="DevAdmin.toggleGodMode()">
                🛡️ Bất Tử (God Mode): TẮT
              </button>
              <button id="btn-dev-onehit" class="btn dev-btn" onclick="DevAdmin.toggleOneHitKill()">
                💥 1 Hit Tiêu Diệt Quái: TẮT
              </button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>⏩ Vượt & Chuyển Ải Nhanh</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" onclick="DevAdmin.skipStages(10)">+10 Ải</button>
              <button class="btn dev-btn" onclick="DevAdmin.skipStages(50)">+50 Ải</button>
              <button class="btn dev-btn" onclick="DevAdmin.skipStages(100)">+100 Ải</button>
              <button class="btn dev-btn dev-btn-primary" onclick="DevAdmin.setStage(500)">Nhảy đến Ải 500</button>
            </div>
          </div>

          <div class="dev-action-group">
            <h4>🏰 Mở Khóa Tính Năng & Phó Bản</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn" onclick="DevAdmin.unlockAllDungeons()">🏰 Mở Khóa Tất Cả 8 Tầng PB</button>
              <button class="btn dev-btn" onclick="DevAdmin.fillHpAndEnergy()">❤️ Hồi Đầy 100% Máu & Nộ</button>
            </div>
          </div>
        </div>

        <!-- Tab Content 5: Hệ Thống -->
        <div id="dev-tab-system" class="dev-tab-pane">
          <div class="dev-action-group">
            <h4>💾 Quản Lý Dữ Liệu Lưu</h4>
            <div class="dev-btn-row">
              <button class="btn dev-btn dev-btn-primary" onclick="DevAdmin.forceSave()">💾 Lưu Game Ngay</button>
              <button class="btn dev-btn" onclick="location.reload()">🔄 Tải Lại Trang (F5)</button>
              <button class="btn dev-btn dev-btn-danger" onclick="DevAdmin.resetAllData()">
                ⚠️ RESET SẠCH DỮ LIỆU (Bắt đầu lại)
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(modal);
  },

  switchTab(tabId) {
    document.querySelectorAll('.dev-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.devtab === tabId));
    document.querySelectorAll('.dev-tab-pane').forEach(p => p.classList.toggle('active', p.id === `dev-tab-${tabId}`));
  },

  updateModalInfo() {
    const activeId = GameState.activeHeroId || 'hero_starter';
    const heroCfg = CONFIG.getHeroById ? CONFIG.getHeroById(activeId) : null;
    const heroName = heroCfg ? heroCfg.name : activeId;

    const elHero = document.getElementById('dev-active-hero-txt');
    const elGold = document.getElementById('dev-gold-txt');
    const elDia = document.getElementById('dev-diamonds-txt');
    const elStage = document.getElementById('dev-stage-txt');

    if (elHero) elHero.textContent = heroName;
    if (elGold) elGold.textContent = (GameState.player?.gold || 0).toLocaleString();
    if (elDia) elDia.textContent = (GameState.player?.diamonds || 0).toLocaleString();
    if (elStage) elStage.textContent = `Ải ${GameState.battle?.stage || 1}`;

    const btnGod = document.getElementById('btn-dev-godmode');
    if (btnGod) {
      btnGod.textContent = GameState.godMode ? '🛡️ Bất Tử (God Mode): BẬT' : '🛡️ Bất Tử (God Mode): TẮT';
      btnGod.style.background = GameState.godMode ? '#10b981' : '';
    }
    const btnOneHit = document.getElementById('btn-dev-onehit');
    if (btnOneHit) {
      btnOneHit.textContent = GameState.oneHitKill ? '💥 1 Hit Tiêu Diệt: BẬT' : '💥 1 Hit Tiêu Diệt: TẮT';
      btnOneHit.style.background = GameState.oneHitKill ? '#f43f5e' : '';
    }
  },

  // --- ACTIONS ---
  addGold(amount) {
    if (!GameState.player) return;
    GameState.player.gold = (GameState.player.gold || 0) + amount;
    this._afterResourceChange(`💰 +${amount.toLocaleString()} Vàng`);
  },

  addDiamonds(amount) {
    if (!GameState.player) return;
    GameState.player.diamonds = (GameState.player.diamonds || 0) + amount;
    this._afterResourceChange(`💎 +${amount.toLocaleString()} Kim Cương`);
  },

  addKeys(amount) {
    if (!GameState.dungeon) GameState.dungeon = {};
    GameState.dungeon.keys = (GameState.dungeon.keys || 0) + amount;
    this._afterResourceChange(`🗝️ +${amount} Chìa Khóa Phó Bản`);
  },

  addBossTickets(amount) {
    if (!GameState.boss) GameState.boss = {};
    GameState.boss.tickets = (GameState.boss.tickets || 0) + amount;
    this._afterResourceChange(`🎟️ +${amount} Vé Khiêu Chiến Boss`);
  },

  addForgeStones(amount) {
    if (!GameState.forge) GameState.forge = {};
    GameState.forge.stones = (GameState.forge.stones || 0) + amount;
    this._afterResourceChange(`🔨 +${amount.toLocaleString()} Đá Cường Hóa`);
  },

  addGachaTickets(amount) {
    if (!GameState.player) return;
    GameState.player.heroTickets = (GameState.player.heroTickets || 0) + amount;
    this._afterResourceChange(`📜 +${amount} Vé Quay Gacha`);
  },

  unlockAllHeroesE6() {
    if (!GameState.heroes) GameState.heroes = [];
    CONFIG.HEROES_LIST.forEach(h => {
      let uh = GameState.heroes.find(x => x.id === h.id);
      if (!uh) {
        uh = { id: h.id, constellation: 6, skillLevels: { s1: 20, s2: 20, s3: 20 } };
        GameState.heroes.push(uh);
      } else {
        uh.constellation = 6;
        uh.skillLevels = { s1: 20, s2: 20, s3: 20 };
      }
    });

    if (typeof UI !== 'undefined' && UI.updateHeroesTab) UI.updateHeroesTab();
    this._afterResourceChange("👑 Đã Mở Khóa Full 8 Anh Hùng E6 & Max Kỹ Năng!");
  },

  setActiveHero(heroId) {
    const heroCfg = CONFIG.getHeroById ? CONFIG.getHeroById(heroId) : null;
    if (!heroCfg) return;

    let uh = GameState.heroes?.find(h => h.id === heroId);
    if (!uh) {
      if (!GameState.heroes) GameState.heroes = [];
      GameState.heroes.push({ id: heroId, constellation: 1, skillLevels: { s1: 1, s2: 1, s3: 1 } });
    }

    GameState.activeHeroId = heroId;
    if (typeof UI !== 'undefined') {
      if (UI.updateHeroesTab) UI.updateHeroesTab();
      if (UI.updatePlayerStats) UI.updatePlayerStats();
      if (UI.updateBattleStatsOnly) UI.updateBattleStatsOnly();
      const pSprite = document.getElementById('player-sprite');
      if (pSprite && typeof Sprites !== 'undefined') {
        pSprite.innerHTML = Sprites.getPlayerSvg('idle', heroId);
      }
    }
    this._afterResourceChange(`🔄 Đã đổi sang: ${heroCfg.name}`);
  },

  castUltimateForHero(heroId) {
    const targetId = heroId || GameState.activeHeroId || 'hero_starter';
    const heroCfg = CONFIG.getHeroById ? CONFIG.getHeroById(targetId) : null;
    if (!heroCfg) return;

    const burstSkill = (heroCfg.skills || []).find(s => s.type === 'burst') || heroCfg.skills[2];
    const modal = document.getElementById('dev-admin-modal');
    if (modal) modal.classList.add('hidden'); // Đóng modal để người chơi xem trọn vẹn Cutscene

    if (typeof UI !== 'undefined' && UI.switchTab) {
      UI.switchTab('battle');
    }

    setTimeout(() => {
      if (typeof UI !== 'undefined' && UI.playBurstCinematic) {
        UI.playBurstCinematic({
          hero: heroCfg,
          skill: burstSkill,
          damage: 9999999,
          isCrit: true,
          buffName: burstSkill?.buffDesc || 'Tuyệt Kỹ Nộ 3D',
          forcePreview: true
        });
      }
    }, 150);
  },

  addGodEquipmentSet(rarity = 'mythic') {
    if (!GameState.inventory) GameState.inventory = [];
    const enhance = rarity === 'unknown' ? 100 : rarity === 'chaos' ? 80 : 50;
    const baseMult = rarity === 'unknown' ? 10000 : rarity === 'chaos' ? 1000 : 100;

    const slots = [
      { slot: 'weapon', name: `Thánh Kiếm Diệt Thế [${CONFIG.RARITY_NAMES[rarity] || rarity}]`, stats: { attack: 25000 * baseMult } },
      { slot: 'helmet', name: `Mũ Thần Chiến Vương [${CONFIG.RARITY_NAMES[rarity] || rarity}]`, stats: { hp: 50000 * baseMult } },
      { slot: 'armor', name: `Chiến Giáp Bất Hoại [${CONFIG.RARITY_NAMES[rarity] || rarity}]`, stats: { defense: 18000 * baseMult, hp: 40000 * baseMult } },
      { slot: 'boots', name: `Hư Không Thần Hài [${CONFIG.RARITY_NAMES[rarity] || rarity}]`, stats: { speed: 80, hp: 20000 * baseMult } },
      { slot: 'ring', name: `Nhẫn Thái Sơ Vĩnh Cửu [${CONFIG.RARITY_NAMES[rarity] || rarity}]`, stats: { attack: 15000 * baseMult, hp: 30000 * baseMult } },
      { slot: 'amulet', name: `Vòng Cổ Nghịch Mệnh [${CONFIG.RARITY_NAMES[rarity] || rarity}]`, stats: { defense: 12000 * baseMult, hp: 35000 * baseMult } }
    ];

    slots.forEach(s => {
      Inventory.addItem({
        name: s.name,
        type: s.slot,
        rarity: rarity,
        enhanceLevel: enhance,
        stats: s.stats
      });
    });

    if (typeof UI !== 'undefined') {
      if (UI.updateInventory) UI.updateInventory();
      if (UI.updateBattleStatsOnly) UI.updateBattleStatsOnly();
    }
    this._afterResourceChange(`⚔️ Đã thêm Full Set ${CONFIG.RARITY_NAMES[rarity] || rarity} (+${enhance}) vào Kho đồ!`);
  },

  expandInventory(slots = 50) {
    if (GameState.player) {
      GameState.player.inventoryMax = (GameState.player.inventoryMax || 50) + slots;
    }
    if (typeof UI !== 'undefined' && UI.updateInventory) UI.updateInventory();
    this._afterResourceChange(`📦 Kho đồ đã mở rộng lên ${(GameState.player?.inventoryMax || 100)} ô!`);
  },

  clearJunkGear() {
    if (!GameState.inventory) return;
    const before = GameState.inventory.length;
    GameState.inventory = GameState.inventory.filter(i => i.rarity !== 'common' && i.rarity !== 'rare');
    const removed = before - GameState.inventory.length;
    if (typeof UI !== 'undefined' && UI.updateInventory) UI.updateInventory();
    this._afterResourceChange(`🧹 Đã dọn ${removed} trang bị Thường/Hiếm!`);
  },

  toggleGodMode() {
    GameState.godMode = !GameState.godMode;
    this.updateModalInfo();
    this._afterResourceChange(GameState.godMode ? "🛡️ Đã BẬT Chế Độ Bất Tử (God Mode)!" : "🛡️ Đã TẮT Bất Tử!");
  },

  toggleOneHitKill() {
    GameState.oneHitKill = !GameState.oneHitKill;
    this.updateModalInfo();
    this._afterResourceChange(GameState.oneHitKill ? "💥 Đã BẬT 1-Hit Kill (Sát thương cực hạn)!" : "💥 Đã TẮT 1-Hit Kill!");
  },

  skipStages(count) {
    if (!GameState.battle) GameState.battle = { stage: 1, maxStage: 1 };
    GameState.battle.stage += count;
    GameState.battle.maxStage = Math.max(GameState.battle.maxStage, GameState.battle.stage);
    if (typeof Monster !== 'undefined' && Monster.spawn) Monster.spawn();
    if (typeof UI !== 'undefined' && UI.updateStageDisplay) UI.updateStageDisplay();
    this._afterResourceChange(`⏩ Đã nhảy qua +${count} Ải (Hiện tại: Ải ${GameState.battle.stage})`);
  },

  setStage(stageNum) {
    if (!GameState.battle) GameState.battle = { stage: 1, maxStage: 1 };
    GameState.battle.stage = stageNum;
    GameState.battle.maxStage = Math.max(GameState.battle.maxStage, stageNum);
    if (typeof Monster !== 'undefined' && Monster.spawn) Monster.spawn();
    if (typeof UI !== 'undefined' && UI.updateStageDisplay) UI.updateStageDisplay();
    this._afterResourceChange(`🚀 Đã chuyển đến Ải ${stageNum}`);
  },

  unlockAllDungeons() {
    if (!GameState.dungeon) GameState.dungeon = {};
    GameState.dungeon.unlockedTier = 8;
    GameState.dungeon.keys = Math.max(GameState.dungeon.keys || 0, 50);
    if (typeof UI !== 'undefined' && UI.updateDungeon) UI.updateDungeon();
    this._afterResourceChange("🏰 Đã mở khóa tất cả 8 tầng Phó Bản!");
  },

  fillHpAndEnergy() {
    if (GameState.player) {
      GameState.player.hp = Player.getEffectiveMaxHp();
    }
    if (typeof UI !== 'undefined') {
      if (UI.updateBattleStatsOnly) UI.updateBattleStatsOnly();
      if (UI.updateStatusBar) UI.updateStatusBar();
    }
    this._afterResourceChange("❤️ Đã hồi đầy 100% Máu & Nộ!");
  },

  forceSave() {
    if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
      SaveSystem.save();
      this._afterResourceChange("💾 Dữ liệu trò chơi đã được lưu thành công!");
    }
  },

  resetAllData() {
    if (confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu và bắt đầu lại từ đầu?")) {
      localStorage.clear();
      location.reload();
    }
  },

  _afterResourceChange(msg) {
    this.updateModalInfo();
    if (typeof UI !== 'undefined') {
      if (UI.updateStatusBar) UI.updateStatusBar();
      if (UI.updatePlayerStats) UI.updatePlayerStats();
      if (UI.showToast) UI.showToast(`🧪 [DEV] ${msg}`);
    }
    if (typeof SaveSystem !== 'undefined' && SaveSystem.save) {
      SaveSystem.save();
    }
  }
};

// Tự động khởi tạo khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DevAdmin.init());
} else {
  DevAdmin.init();
}
