import re

file_path = r'c:\Users\letme\OneDrive\Desktop\idle game\js\ui\ui.js'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Wire new event listeners in init()
init_target = """    // Dungeon Forfeit
    document.getElementById('btn-forfeit-dungeon')?.addEventListener('click', () => {
      if (typeof Dungeon !== 'undefined') Dungeon.forfeit(true);
    });"""

init_replacement = """    // Dungeon Forfeit
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
    });"""

assert init_target in code, "init_target not found!"
code = code.replace(init_target, init_replacement)

# 2. Add isBattleViewActive to switchTab
switch_target = """  switchTab(tabName) {
    this._currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${tabName}`));
    this.updateTabContent(tabName);
  },"""

switch_replacement = """  switchTab(tabName) {
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
  },"""

assert switch_target in code, "switch_target not found!"
code = code.replace(switch_target, switch_replacement)

# 3. Update showDamageNumber and animation methods
dmg_target = """  showDamageNumber(amount, isCrit, target) {
    let id = 'monster-damage-container';
    if (target === 'player') {
      id = GameState.boss?.active ? 'boss-player-damage-container' : 'player-damage-container';
    } else if (target === 'boss') {
      id = 'boss-damage-container';
    }
    const container = document.getElementById(id);
    if (!container) return;

    const el = document.createElement('div');
    el.className = `damage-number ${target === 'player' ? 'damage-player' : 'damage-monster'} ${isCrit ? 'damage-crit' : ''}`;
    el.textContent = `-${this._formatNumber(amount)}`;
    el.style.left = `calc(50% + ${Math.random() * 50 - 25}px)`;
    el.style.top = `${Math.random() * 15}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 850);
  },"""

dmg_replacement = """  showDamageNumber(amount, isCrit, target) {
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
    el.className = `damage-number ${isTargetPlayer ? 'damage-player' : 'damage-monster'} ${isCrit ? 'damage-crit' : ''}`;
    el.textContent = `-${this._formatNumber(amount)}`;
    el.style.left = `calc(50% + ${Math.random() * 50 - 25}px)`;
    el.style.top = `${Math.random() * 15}px`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 850);
  },

  screenShake() {
    const el = document.body;
    el.classList.remove('screen-shake-intense');
    void el.offsetWidth;
    el.classList.add('screen-shake-intense');
    setTimeout(() => el.classList.remove('screen-shake-intense'), 400);
  },"""

assert dmg_target in code, "dmg_target not found!"
code = code.replace(dmg_target, dmg_replacement)

# 4. Update animatePlayerAttack & animatePlayerHit & animateMonsterAttack & animateMonsterHit
anim_target = """  animatePlayerAttack() {
    const isBoss = GameState.boss?.active;
    const pSpriteId = isBoss ? 'boss-player-sprite' : 'player-sprite';
    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      const activeHero = GameState.activeHeroId || 'hero_traveler';
      pSprite.innerHTML = Sprites.getPlayerSvg('attack');
      pSprite.className = `fighter-avatar player-attack-anim hero-attack-${activeHero}`;
      clearTimeout(this._playerAnimTimer);
      this._playerAnimTimer = setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 350);
    }
    const targetSlash = isBoss ? 'slash-fx-boss' : 'slash-fx-monster';
    this._triggerSlashFx(targetSlash, 'normal');
  },

  animatePlayerHit() {
    const isBoss = GameState.boss?.active;
    const pSpriteId = isBoss ? 'boss-player-sprite' : 'player-sprite';
    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.innerHTML = Sprites.getPlayerSvg('hit');
      pSprite.className = 'fighter-avatar hit-flash';
      setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 250);
    } else {
      this._triggerAnim(pSpriteId, 'hit-flash');
    }
  },

  animateMonsterAttack() {
    this._triggerAnim('monster-sprite', 'monster-attack-anim');
    this._triggerSlashFx('slash-fx-player', 'normal');
  },

  animateMonsterHit() {
    this._triggerAnim('monster-sprite', 'hit-flash');
  },"""

anim_replacement = """  animatePlayerAttack(mode) {
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
    if (pSprite && typeof Sprites !== 'undefined') {
      const activeHero = GameState.activeHeroId || 'hero_traveler';
      pSprite.innerHTML = Sprites.getPlayerSvg('attack');
      pSprite.className = `fighter-avatar player-attack-anim hero-attack-${activeHero}`;
      clearTimeout(this._playerAnimTimer);
      this._playerAnimTimer = setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 350);
    }
    this._triggerSlashFx(targetSlash, 'normal');
  },

  animatePlayerHit(mode) {
    let pSpriteId = 'player-sprite';
    if (mode === 'dungeon') pSpriteId = 'dungeon-player-sprite';
    else if (mode === 'tower') pSpriteId = 'tower-player-sprite';
    else if (GameState.boss?.active) pSpriteId = 'boss-player-sprite';

    const pSprite = document.getElementById(pSpriteId);
    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.innerHTML = Sprites.getPlayerSvg('hit');
      pSprite.className = 'fighter-avatar hit-flash';
      setTimeout(() => {
        if (pSprite) {
          pSprite.innerHTML = Sprites.getPlayerSvg('idle');
          pSprite.className = 'fighter-avatar player-idle';
        }
      }, 250);
    } else {
      this._triggerAnim(pSpriteId, 'hit-flash');
    }
  },

  animateMonsterAttack(mode) {
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

  animateMonsterHit(mode) {
    if (mode === 'dungeon') {
      this._triggerAnim('dungeon-monster-sprite', 'hit-flash');
    } else if (mode === 'tower') {
      this._triggerAnim('tower-enemy-sprite', 'hit-flash');
    } else {
      this._triggerAnim('monster-sprite', 'hit-flash');
    }
  },"""

assert anim_target in code, "anim_target not found!"
code = code.replace(anim_target, anim_replacement)

# 5. Update updateBossChamber with Rage, Alert, and Hero Skills HUD
boss_target = """      // 2. Cập nhật phe Đại Boss
      const bNameEl = document.getElementById('boss-active-name');
      if (bNameEl) bNameEl.textContent = b.name;"""

boss_replacement = """      // 2. Cập nhật phe Đại Boss
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
      this.updateBossHeroSkillsHud();"""

assert boss_target in code, "boss_target not found!"
code = code.replace(boss_target, boss_replacement)

# Add showBossSkillWarning and hideBossSkillWarning and updateBossHeroSkillsHud
boss_extra_methods = """  showBossSkillWarning(boss, skill) {
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

  updateBossHeroSkillsHud() {
    const activeHeroId = GameState.activeHeroId || 'hero_traveler';
    const heroCfg = CONFIG.getHeroById(activeHeroId);
    if (!heroCfg) return;
    const skills = heroCfg.skills || [];
    const s2 = skills.find(s => s.type === 'active');
    const s3 = skills.find(s => s.type === 'burst');

    const s2Icon = document.getElementById('boss-hud-s2-icon');
    const s2Timer = document.getElementById('boss-hud-s2-timer');
    const s2Fill = document.getElementById('boss-hud-s2-fill');
    if (s2Icon && s2) s2Icon.textContent = s2.icon || '⚡';
    if (s2 && Player._skillCooldowns && Player._skillCooldowns.s2) {
      const remaining = Math.max(0, Math.ceil((Player._skillCooldowns.s2 - Date.now()) / 1000));
      if (remaining > 0) {
        if (s2Timer) s2Timer.textContent = `${remaining}s`;
        if (s2Fill) s2Fill.style.height = `${(remaining / s2.cd) * 100}%`;
      } else {
        if (s2Timer) s2Timer.textContent = 'Sẵn sàng';
        if (s2Fill) s2Fill.style.height = '0%';
      }
    }

    const s3Icon = document.getElementById('boss-hud-s3-icon');
    const s3Timer = document.getElementById('boss-hud-s3-timer');
    const s3Fill = document.getElementById('boss-hud-s3-fill');
    if (s3Icon && s3) s3Icon.textContent = s3.icon || '🌟';
    if (s3 && Player._skillCooldowns && Player._skillCooldowns.s3) {
      const remaining = Math.max(0, Math.ceil((Player._skillCooldowns.s3 - Date.now()) / 1000));
      if (remaining > 0) {
        if (s3Timer) s3Timer.textContent = `${remaining}s`;
        if (s3Fill) s3Fill.style.height = `${(remaining / s3.cd) * 100}%`;
      } else {
        if (s3Timer) s3Timer.textContent = 'SẴN SÀNG!';
        if (s3Fill) s3Fill.style.height = '0%';
      }
    }
  },
"""

render_boss_target = "  _renderBossList() {"
assert render_boss_target in code, "_renderBossList not found!"
code = code.replace(render_boss_target, boss_extra_methods + "\n  _renderBossList() {")

# 6. Replace old updateDungeonArena and add full room & tower UI methods
dungeon_target = """  updateDungeonArena() {
    const banner = document.getElementById('dungeon-active-banner');
    if (!banner) return;
    if (GameState.dungeon?.active) {
      banner.classList.remove('hidden');
      const cfg = CONFIG.getDungeonById(GameState.dungeon.dungeonId);
      const titleEl = document.getElementById('dungeon-banner-title');
      const waveEl = document.getElementById('dungeon-banner-wave');
      if (titleEl && cfg) titleEl.textContent = `🏰 ${cfg.name}`;
      if (waveEl) {
        if (cfg?.isTower) {
          waveEl.textContent = `Tầng ${GameState.dungeon.abyssFloor || 1} (Đợt ${GameState.dungeon.wave}/${GameState.dungeon.maxWaves})`;
        } else {
          waveEl.textContent = `Đợt ${GameState.dungeon.wave}/${GameState.dungeon.maxWaves}`;
        }
      }
    } else {
      banner.classList.add('hidden');
    }
  },"""

dungeon_replacement = """  updateDungeonArena() {
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
  },"""

assert dungeon_target in code, "dungeon_target not found!"
code = code.replace(dungeon_target, dungeon_replacement)

# Write modified code
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("ui.js successfully patched!")
