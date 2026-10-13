const Dungeon = {
  currentMonster: null,
  _turnTimer: null,
  _isClimbing: false,

  canEnter(dungeonId) {
    const cfg = CONFIG.getDungeonById(dungeonId);
    if (!cfg) return false;
    if (cfg.isTower) return true;
    const key = cfg.id.replace('dungeon_', '');
    const runs = GameState.dungeon?.dailyRuns?.[key] ?? cfg.dailyLimit;
    return runs > 0;
  },

  getRemainingRuns(dungeonId) {
    const cfg = CONFIG.getDungeonById(dungeonId);
    if (!cfg || cfg.isTower) return 999;
    const key = cfg.id.replace('dungeon_', '');
    return GameState.dungeon?.dailyRuns?.[key] ?? cfg.dailyLimit;
  },

  // Khởi động từ sảnh phó bản
  start(dungeonId) {
    const cfg = CONFIG.getDungeonById(dungeonId);
    if (!cfg) return { error: 'invalid_dungeon' };

    // Nếu chọn Hư Không Tháp -> Mở giao diện Leo Tháp riêng
    if (cfg.isTower) {
      this.openTower();
      return { success: true, mode: 'tower' };
    }

    // Nếu chọn Bí Cảnh Tài Nguyên (Mỏ Vàng, EXP, Bùa, Lò Rèn)
    const key = cfg.id.replace('dungeon_', '');
    if (!GameState.dungeon.dailyRuns) {
      GameState.dungeon.dailyRuns = { gold: 3, exp: 3, rune: 3, forge: 3 };
    }
    if ((GameState.dungeon.dailyRuns[key] ?? cfg.dailyLimit) <= 0) {
      return { error: 'no_runs_left' };
    }
    GameState.dungeon.dailyRuns[key]--;

    GameState.dungeon.active = true;
    GameState.dungeon.dungeonId = dungeonId;
    GameState.dungeon.subMode = cfg.theme || key;
    GameState.dungeon.wave = 1;
    GameState.dungeon.maxWaves = cfg.waves || 5;
    GameState.dungeon.goldEarned = 0;
    GameState.dungeon.expEarned = 0;
    GameState.dungeon.stonesEarned = 0;
    GameState.dungeon.forgeDropsEarned = 0;

    // Hồi đầy máu cho người chơi khi vào bí cảnh
    Player.heal(Player.getEffectiveMaxHp());

    // Tạm dừng quái thường
    if (typeof Combat !== 'undefined') Combat.stop();

    // Mở phòng bí cảnh chuyên biệt
    if (typeof UI !== 'undefined') {
      UI.enterDungeonRoom(cfg);
      UI.showToast(`⚔️ Đã bước vào [${cfg.name}]!`);
    }

    this.spawnNextWave();
    this._scheduleNextTurn(650);
    return { success: true, mode: 'room' };
  },

  // ============================================================
  // RESOURCE DUNGEONS (MỎ VÀNG, BÍ CẢNH EXP, THÁNH ĐỊA BÙA & LÒ RÈN)
  // ============================================================
  spawnNextWave() {
    const dungeonId = GameState.dungeon.dungeonId;
    const cfg = CONFIG.getDungeonById(dungeonId);
    const wave = GameState.dungeon.wave;
    const isBossWave = wave === GameState.dungeon.maxWaves;
    const pLvl = GameState.player?.level || 1;
    // Cân bằng độ khó: Quái bám sát cấp người chơi, tăng vừa phải theo đợt để vẫn cực kỳ thử thách nhưng công bằng
    const baseLevel = Math.max(1, pLvl - 1 + Math.floor(wave * 0.8));

    let mName = 'Quái Phó Bản';
    let emoji = '👾';

    if (dungeonId === 'dungeon_gold') {
      if (isBossWave) {
        mName = '👑 Đại Vương Yêu Tinh Mỏ Vàng';
        emoji = '👑👺';
      } else {
        const pool = ['Yêu Tinh Đào Mỏ', 'Slime Quặng Vàng', 'Golem Cương Thạch Hoàng Kim'];
        mName = `${pool[(wave - 1) % pool.length]} (Đợt ${wave})`;
        emoji = wave % 2 === 1 ? '⛏️👺' : '✨🟢';
      }
    } else if (dungeonId === 'dungeon_exp') {
      if (isBossWave) {
        mName = '👑 Tinh Linh Vương Cổ Thụ Ngàn Năm';
        emoji = '👑🧚';
      } else {
        const pool = ['Tinh Linh Dạ Quang', 'Bướm Ma Lực Thần Bí', 'Pháp Sư Tinh Thể Cổ Đại'];
        mName = `${pool[(wave - 1) % pool.length]} (Đợt ${wave})`;
        emoji = wave % 2 === 1 ? '✨🧚' : '🔮🧝';
      }
    } else if (dungeonId === 'dungeon_rune') {
      if (isBossWave) {
        mName = '👑 Hộ Vệ Thạch Anh Thần Thánh';
        emoji = '👑🗿';
      } else {
        const pool = ['Hộ Vệ Thần Chú', 'Vu Nữ Ma Pháp Phong Ấn', 'Bóng Ma Tế Đàn Cổ'];
        mName = `${pool[(wave - 1) % pool.length]} (Đợt ${wave})`;
        emoji = wave % 2 === 1 ? '📜🗿' : '🛡️👻';
      }
    } else if (dungeonId === 'dungeon_forge') {
      if (isBossWave) {
        mName = '👑 Cự Nhân Hỏa Ngục Lò Rèn';
        emoji = '👑🌋';
      } else {
        const pool = ['Golem Dung Nham', 'Hỏa Hồ Hỏa Ngục', 'Chiến Binh Lò Rèn Ma Quái'];
        mName = `${pool[(wave - 1) % pool.length]} (Đợt ${wave})`;
        emoji = wave % 2 === 1 ? '🌋🗿' : '🔥😈';
      }
    }

    const hpMult = isBossWave ? 2.2 : 1.0;
    const atkMult = isBossWave ? 1.30 : 0.85;

    const hp = Math.floor(CONFIG.MONSTER_HP_BASE * Math.pow(1.040, baseLevel) * hpMult);
    const attack = Math.floor(CONFIG.MONSTER_ATK_BASE * Math.pow(1.030, baseLevel) * atkMult);
    const defense = Math.floor(CONFIG.MONSTER_DEF_BASE * Math.pow(1.020, baseLevel));
    const speed = Math.floor(CONFIG.MONSTER_SPD_BASE + baseLevel * 0.35);

    let goldReward = Math.floor(CONFIG.MONSTER_GOLD_BASE * Math.pow(1.05, baseLevel) * (cfg.goldMult || 1));
    let expReward = Math.floor(CONFIG.MONSTER_EXP_BASE * Math.pow(1.04, baseLevel) * (cfg.expMult || 1));

    if (isBossWave) {
      goldReward *= 3;
      expReward *= 3;
    }

    this.currentMonster = {
      name: mName,
      emoji: emoji,
      level: baseLevel,
      hp: hp,
      maxHp: hp,
      attack: attack,
      defense: defense,
      speed: speed,
      goldReward: goldReward,
      expReward: expReward,
      isBoss: isBossWave
    };

    if (typeof UI !== 'undefined') {
      UI.updateDungeonRoomMonster(this.currentMonster);
    }
  },

  stepRoom() {
    if (!GameState.dungeon.active || GameState.dungeon.subMode === 'tower') return;
    const m = this.currentMonster;
    const p = GameState.player;

    if (!m || m.hp <= 0) {
      this.handleRoomWaveClear();
      return;
    }

    // 1. Lượt của người chơi
    const skillRes = Player.checkTriggerHeroSkill();
    if (skillRes.triggered) {
      const dmg = skillRes.damage;
      m.hp = Math.max(0, m.hp - dmg);
      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(dmg, true, 'dungeon-monster');
        UI.animatePlayerAttack('dungeon');
        UI.animateMonsterHit('dungeon');
        if (skillRes.type === 'burst' && UI.playBurstCinematic) {
          UI.playBurstCinematic(skillRes);
        }
      }
      if (m.hp <= 0) {
        m.hp = 0;
        if (typeof UI !== 'undefined') UI.updateDungeonRoomMonster(m);
        setTimeout(() => this.handleRoomWaveClear(), 400);
        return;
      }
    } else {
      const pAtk = Player.getEffectiveAttack();
      const pDmg = Math.max(1, Math.floor(pAtk * (0.9 + Math.random() * 0.2)) - m.defense);
      m.hp = Math.max(0, m.hp - pDmg);
      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(pDmg, false, 'dungeon-monster');
        UI.animatePlayerAttack('dungeon');
        UI.animateMonsterHit('dungeon');
      }
      if (m.hp <= 0) {
        m.hp = 0;
        if (typeof UI !== 'undefined') UI.updateDungeonRoomMonster(m);
        setTimeout(() => this.handleRoomWaveClear(), 400);
        return;
      }
    }

    // 2. Lượt quái tấn công
    const mDmg = Math.max(1, Math.floor(m.attack * (0.85 + Math.random() * 0.3)) - Player.getEffectiveDefense());
    const pResult = Player.takeDamage(mDmg);

    setTimeout(() => {
      if (!GameState.dungeon.active || GameState.dungeon.subMode === 'tower') return;
      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(mDmg, false, 'dungeon-player');
        UI.animateMonsterAttack('dungeon');
        UI.animatePlayerHit('dungeon');

        const regen = Player.getEffectiveHpRegen();
        if (regen > 0 && !pResult.isDead) Player.heal(regen);

        UI.updateDungeonRoomPlayer();
      }

      if (pResult.isDead) {
        if (typeof UI !== 'undefined') {
          UI.showToast('💀 Bạn đã ngã xuống trong Bí Cảnh!');
        }
        this.forfeitRoom(false);
      }
    }, 260);

    if (typeof UI !== 'undefined') {
      UI.updateDungeonRoomMonster(m);
    }
    this._scheduleNextTurn(700);
  },

  handleRoomWaveClear() {
    const m = this.currentMonster;
    const cfg = CONFIG.getDungeonById(GameState.dungeon.dungeonId);

    const gold = Player.gainGold(m.goldReward);
    Player.gainExp(m.expReward);
    GameState.dungeon.goldEarned += gold;
    GameState.dungeon.expEarned += m.expReward;

    // Rơi bùa bảo hiểm
    if (Math.random() < (cfg.runeDropChance || 0.05)) {
      Player.gainProtectionStones(1);
      GameState.dungeon.stonesEarned++;
    }

    // Rơi trang bị rèn
    if (cfg.forgeDropChance && Math.random() < cfg.forgeDropChance) {
      if (!Inventory.isFull()) {
        const pool = CONFIG.getItemsByRarity(m.isBoss ? 'legendary' : 'epic');
        if (pool?.length) {
          Inventory.addItem(pool[Math.floor(Math.random() * pool.length)]);
          GameState.dungeon.forgeDropsEarned = (GameState.dungeon.forgeDropsEarned || 0) + 1;
        }
      }
    }

    if (typeof UI !== 'undefined') {
      UI.updateDungeonLootTracker();
      UI.showDungeonWaveClearBanner();
    }

    if (GameState.dungeon.wave >= GameState.dungeon.maxWaves) {
      setTimeout(() => this.victoryRoom(), 800);
    } else {
      GameState.dungeon.wave++;
      setTimeout(() => {
        if (!GameState.dungeon.active) return;
        this.spawnNextWave();
        if (typeof UI !== 'undefined') UI.updateDungeonRoomWaveHeader();
        this._scheduleNextTurn(750);
      }, 750);
    }
  },

  victoryRoom() {
    const cfg = CONFIG.getDungeonById(GameState.dungeon.dungeonId);
    GameState.dungeon.active = false;

    if (typeof UI !== 'undefined') {
      UI.showToast(`👑 HOÀN THÀNH: [${cfg.name}]!`);
      UI.showDungeonVictoryPopup({
        dungeon: cfg,
        gold: GameState.dungeon.goldEarned,
        exp: GameState.dungeon.expEarned,
        stones: GameState.dungeon.stonesEarned,
        forgeDrops: GameState.dungeon.forgeDropsEarned,
        diamonds: 0
      });
      UI.exitDungeonRoom();
    }

    // Tiếp tục farm quái ngoài ải
    if (typeof Combat !== 'undefined') setTimeout(() => Combat.start(), 350);
  },

  forfeitRoom(manual = true) {
    GameState.dungeon.active = false;
    this._stopTimer();
    this.currentMonster = null;
    Player.revive();

    if (typeof UI !== 'undefined') {
      if (manual) UI.showToast('🚪 Đã rời khỏi Bí Cảnh!');
      UI.exitDungeonRoom();
    }

    if (typeof Combat !== 'undefined') setTimeout(() => Combat.start(), 350);
  },

  // ============================================================
  // TOWER OF ASCENSION (HƯ KHÔNG THÁP - LEO THÁP VÔ TẬN)
  // ============================================================
  openTower() {
    if (typeof UI !== 'undefined') {
      UI.showTowerView();
    }
  },

  startTowerFloor(floor) {
    if (this._isClimbing) return;
    this._isClimbing = true;

    const currentFloor = floor || GameState.dungeon.abyssFloor || 1;
    GameState.dungeon.active = true;
    GameState.dungeon.subMode = 'tower';
    GameState.dungeon.abyssFloor = currentFloor;

    Player.heal(Player.getEffectiveMaxHp());
    if (typeof Combat !== 'undefined') Combat.stop();

    // Sinh quái hoặc Boss tầng
    const isBossFloor = currentFloor % 10 === 0;
    const baseLevel = Math.max(1, currentFloor * 3);

    let mName = '';
    let emoji = '';
    let hpMult = 1.0;
    let atkMult = 1.0;

    if (isBossFloor) {
      const bossInfo = CONFIG.getTowerBossInfo(currentFloor);
      mName = bossInfo.name;
      emoji = bossInfo.emoji;
      hpMult = bossInfo.hpMult;
      atkMult = bossInfo.atkMult;
    } else {
      mName = `Vệ Binh Hư Không (Tầng ${currentFloor})`;
      emoji = '👁️🌌';
      hpMult = 1.0 + currentFloor * 0.03;
      atkMult = 1.0 + currentFloor * 0.025;
    }

    const hp = Math.floor(CONFIG.MONSTER_HP_BASE * Math.pow(1.042, baseLevel) * hpMult);
    const attack = Math.floor(CONFIG.MONSTER_ATK_BASE * Math.pow(1.032, baseLevel) * atkMult);
    const defense = Math.floor(CONFIG.MONSTER_DEF_BASE * Math.pow(1.022, baseLevel));
    const speed = Math.floor(CONFIG.MONSTER_SPD_BASE + baseLevel * 0.4);

    const goldReward = Math.floor(CONFIG.MONSTER_GOLD_BASE * Math.pow(1.05, baseLevel) * (isBossFloor ? 6 : 2.5));
    const expReward = Math.floor(CONFIG.MONSTER_EXP_BASE * Math.pow(1.04, baseLevel) * (isBossFloor ? 6 : 2.5));

    this.currentMonster = {
      name: mName,
      emoji: emoji,
      level: baseLevel,
      hp: hp,
      maxHp: hp,
      attack: attack,
      defense: defense,
      speed: speed,
      goldReward: goldReward,
      expReward: expReward,
      isBoss: isBossFloor,
      floor: currentFloor
    };

    if (typeof UI !== 'undefined') {
      UI.enterTowerStage(this.currentMonster);
      if (isBossFloor) {
        UI.showToast(`🔥 NGHÊNH CHIẾN TRÙM THÁP TẦNG ${currentFloor}!`);
      }
    }

    this._isClimbing = false;
    this._scheduleNextTowerTurn(650);
  },

  stepTower() {
    if (!GameState.dungeon.active || GameState.dungeon.subMode !== 'tower') return;
    const m = this.currentMonster;
    const p = GameState.player;

    if (!m || m.hp <= 0) {
      this.handleTowerFloorClear();
      return;
    }

    // 1. Hiệp sĩ ra đòn
    const skillRes = Player.checkTriggerHeroSkill();
    if (skillRes.triggered) {
      const dmg = skillRes.damage;
      m.hp = Math.max(0, m.hp - dmg);
      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(dmg, true, 'tower-enemy');
        UI.animatePlayerAttack('tower');
        UI.animateMonsterHit('tower');
        if (skillRes.type === 'burst' && UI.playBurstCinematic) {
          UI.playBurstCinematic(skillRes);
        }
      }
      if (m.hp <= 0) {
        m.hp = 0;
        if (typeof UI !== 'undefined') UI.updateTowerStageEnemy(m);
        setTimeout(() => this.handleTowerFloorClear(), 400);
        return;
      }
    } else {
      const pAtk = Player.getEffectiveAttack();
      const pDmg = Math.max(1, Math.floor(pAtk * (0.9 + Math.random() * 0.2)) - m.defense);
      m.hp = Math.max(0, m.hp - pDmg);
      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(pDmg, false, 'tower-enemy');
        UI.animatePlayerAttack('tower');
        UI.animateMonsterHit('tower');
      }
      if (m.hp <= 0) {
        m.hp = 0;
        if (typeof UI !== 'undefined') UI.updateTowerStageEnemy(m);
        setTimeout(() => this.handleTowerFloorClear(), 400);
        return;
      }
    }

    // 2. Kẻ địch trên tháp phản công
    const mDmg = Math.max(1, Math.floor(m.attack * (0.85 + Math.random() * 0.3)) - Player.getEffectiveDefense());
    const pResult = Player.takeDamage(mDmg);

    setTimeout(() => {
      if (!GameState.dungeon.active || GameState.dungeon.subMode !== 'tower') return;
      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(mDmg, false, 'tower-player');
        UI.animateMonsterAttack('tower');
        UI.animatePlayerHit('tower');

        const regen = Player.getEffectiveHpRegen();
        if (regen > 0 && !pResult.isDead) Player.heal(regen);

        UI.updateTowerStagePlayer();
      }

      if (pResult.isDead) {
        this.forfeitTower(false, `Bạn đã gục ngã tại Tầng ${m.floor}! Hãy nâng cấp sức mạnh để chinh phục lại!`);
      }
    }, 260);

    if (typeof UI !== 'undefined') {
      UI.updateTowerStageEnemy(m);
    }
    this._scheduleNextTowerTurn(700);
  },

  handleTowerFloorClear() {
    const m = this.currentMonster;
    const floor = m.floor || GameState.dungeon.abyssFloor || 1;
    const isBoss = m.isBoss;

    const gold = Player.gainGold(m.goldReward);
    Player.gainExp(m.expReward);

    // Phần thưởng kim cương
    const diamondGain = isBoss ? 60 : 15;
    Player.gainDiamond(diamondGain);

    // Boss rơi bùa bảo hiểm và đồ thần thoại
    let droppedItem = null;
    if (isBoss) {
      Player.gainProtectionStones(2);
      if (!Inventory.isFull()) {
        const pool = CONFIG.getItemsByRarity(floor >= 40 ? 'chaos' : 'mythic');
        if (pool?.length) {
          droppedItem = Inventory.addItem(pool[Math.floor(Math.random() * pool.length)]);
        }
      }
    }

    // Cập nhật kỷ lục
    GameState.dungeon.towerHighestFloor = Math.max(GameState.dungeon.towerHighestFloor || 1, floor);
    const nextFloor = floor + 1;
    GameState.dungeon.abyssFloor = nextFloor;

    if (isBoss && typeof FriendAdmin !== 'undefined') {
      FriendAdmin.logAction('boss', `Chinh phục kỳ tích: Tiêu diệt Đại Trùm Tầng ${floor} Hư Không Tháp!`);
    }
    if (typeof Leaderboard !== 'undefined') {
      Leaderboard.syncCurrentPlayer();
    }

    if (typeof UI !== 'undefined') {
      UI.showTowerFloorClearBanner(floor, isBoss, diamondGain, droppedItem);
      UI.updateTowerDashboard();
    }

    const autoClimb = document.getElementById('chk-tower-auto-climb')?.checked ?? true;
    if (autoClimb) {
      setTimeout(() => {
        if (!GameState.dungeon.active || GameState.dungeon.subMode !== 'tower') return;
        this.startTowerFloor(nextFloor);
      }, 1200);
    } else {
      GameState.dungeon.active = false;
      this._stopTimer();
      if (typeof UI !== 'undefined') {
        UI.showToast(`🎉 Chiến thắng Tầng ${floor}! Hãy chuẩn bị trước khi lên tầng tiếp theo.`);
        UI.exitTowerStage();
      }
      if (typeof Combat !== 'undefined') setTimeout(() => Combat.start(), 350);
    }
  },

  forfeitTower(manual = true, message = '') {
    GameState.dungeon.active = false;
    this._stopTimer();
    this.currentMonster = null;
    Player.revive();

    if (typeof UI !== 'undefined') {
      UI.showToast(message || '🚪 Đã rút lui khỏi Hư Không Tháp!');
      UI.exitTowerStage();
      UI.updateTowerDashboard();
    }

    if (typeof Combat !== 'undefined') setTimeout(() => Combat.start(), 350);
  },

  _scheduleNextTurn(delay = 650) {
    this._stopTimer();
    this._turnTimer = setTimeout(() => this.stepRoom(), delay);
  },

  _scheduleNextTowerTurn(delay = 650) {
    this._stopTimer();
    this._turnTimer = setTimeout(() => this.stepTower(), delay);
  },

  _stopTimer() {
    if (this._turnTimer) {
      clearTimeout(this._turnTimer);
      this._turnTimer = null;
    }
  }
};
