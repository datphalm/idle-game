const Boss = {
  _timerInterval: null,
  _actionInterval: null,

  buyKey() {
    const cost = this.getKeyPrice();
    if (!Player.spendGold(cost)) return { success: false, error: 'not_enough_gold', cost };
    Player.gainBossKeys(1);
    return { success: true, count: GameState.player.bossKeys };
  },

  getKeyPrice() {
    const lvl = GameState.player?.level || 1;
    return Math.floor(CONFIG.BOSS_KEY_PRICE * (1 + (lvl - 1) * 0.08));
  },

  startFight(bossIndex) {
    const boss = CONFIG.BOSS_LIST[bossIndex];
    if (!boss) return { success: false, error: 'invalid_boss' };

    if (!Player.spendBossKeys(boss.keyCost)) {
      return { success: false, error: 'not_enough_keys', needed: boss.keyCost };
    }
    Player.heal(Player.getEffectiveMaxHp());

    GameState.boss = {
      active: true,
      bossIndex,
      id: boss.id,
      name: boss.name,
      title: boss.title || 'Đại Boss Huyền Thoại',
      emoji: boss.emoji,
      hp: boss.hp,
      maxHp: boss.hp,
      attack: boss.attack,
      defense: boss.defense,
      speed: boss.speed,
      timer: boss.timer,
      timerMax: boss.timer,
      rage: 0,
      rageMax: 100,
      skills: boss.skills || [],
      config: boss
    };

    // Tạm dừng vòng lặp quái thường để tập trung đánh Boss
    if (typeof Combat !== 'undefined') Combat.stop();

    if (typeof UI !== 'undefined') {
      UI.switchTab('boss');
      UI.updateBossChamber();
      UI.addCombatLog(`🔥 <strong>BẮT ĐẦU ĐẠI CHIẾN SOLO BOSS:</strong> ${boss.name}!`, 'log-danger');
      UI.showToast(`🔥 Solo Boss: ${boss.name}!`);
    }

    this._startBattleLoop();
    return { success: true, boss };
  },

  _startBattleLoop() {
    this._stopAllIntervals();

    // 1. Đồng hồ đếm ngược (mỗi 1 giây trừ 1s)
    this._timerInterval = setInterval(() => {
      if (!GameState.boss?.active) {
        this._stopAllIntervals();
        return;
      }

      GameState.boss.timer -= 1;
      if (GameState.boss.timer <= 0) {
        GameState.boss.timer = 0;
        this.endFight(false, 'Hết thời gian khiêu chiến! Boss đã đẩy lùi bạn!');
        return;
      }

      if (typeof UI !== 'undefined') UI.updateBossChamber();
    }, 1000);

    // 2. Nhịp giao tranh đánh theo lượt độc lập (mỗi 750ms)
    this._actionInterval = setInterval(() => {
      this._stepFight();
    }, 750);
  },

  _stepFight() {
    if (!GameState.boss?.active) return;
    const b = GameState.boss;
    const p = GameState.player;

    if (b.hp <= 0) { this.endFight(true); return; }
    if (p.currentHp <= 0) { this.endFight(false, 'Bạn đã bị Boss đánh bại!'); return; }

    // --- LƯỢT NGƯỜI CHƠI TẤN CÔNG BOSS (KỸ NĂNG ANH HÙNG HOẶC ĐÁNH THƯỜNG) ---
    const skillRes = Player.checkTriggerHeroSkill();
    let pDmg = 0;

    if (skillRes.triggered) {
      pDmg = skillRes.damage;
      if (skillRes.type === 'burst' && typeof UI !== 'undefined' && UI.playBurstCinematic) {
        try { UI.playBurstCinematic(skillRes); } catch(e) {}
      }

      const isVideoCutscene = (skillRes.type === 'burst' && (skillRes.hero?.id === 'hero_unknown_god' || skillRes.hero?.id === 'hero_cassius' || skillRes.hero?.id === 'hero_trisa' || skillRes.hero?.id === 'hero_rhiannon'));
      if (isVideoCutscene) {
        const isCassius = (skillRes.hero?.id === 'hero_cassius');
        const isTrisa = (skillRes.hero?.id === 'hero_trisa' || skillRes.hero?.id === 'hero_rhiannon');
        const hitDelay = isTrisa ? 2750 : (isCassius ? 3000 : 5500);
        setTimeout(() => {
          if (!GameState.boss?.active) return;
          b.hp = Math.max(0, b.hp - pDmg);
          if (typeof UI !== 'undefined') {
            UI.showDamageNumber(pDmg, true, 'boss', true);
            UI.screenShake();
            UI.animatePlayerSkill('boss', skillRes.type);
            UI.animateBossHit(true);
            UI.updateBossChamber();
            const badgeName = isCassius ? '🎰 CANH BẠC VÔ CỰC' : (isTrisa ? '🩸 HUYẾT NGUYỆT TRẢM SÁT' : '🌟 TUYỆT KỸ NỘ');
            UI.addCombatLog(
              `<strong>${badgeName} [${skillRes.hero.name}]:</strong> ` +
              `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.skill.name}</span> ` +
              `gây <strong style="color:${skillRes.hero.elementColor};">-${pDmg}</strong> lên Boss!`,
              'log-extra'
            );
          }
          if (b.hp <= 0) {
            b.hp = 0;
            if (typeof UI !== 'undefined') UI.updateBossChamber();
            setTimeout(() => this.endFight(true), 450);
          }
        }, hitDelay);
      } else {
        b.hp = Math.max(0, b.hp - pDmg);
        if (typeof UI !== 'undefined') {
          UI.showDamageNumber(pDmg, true, 'boss');
          UI.animatePlayerSkill('boss', skillRes.type);
          UI.animateBossHit();
          UI.updateBossChamber();
          const badgeName = skillRes.type === 'burst' ? '🌟 TUYỆT KỸ NỘ' : '⚡ KỸ NĂNG';
          UI.addCombatLog(
            `<strong>${badgeName} [${skillRes.hero.name}]:</strong> ` +
            `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.skill.name}</span> ` +
            `gây <strong style="color:#ff0055;">-${pDmg}</strong> lên Boss!`,
            'log-extra'
          );
        }
      }
    } else {
      const pAtk = Player.getEffectiveAttack();
      pDmg = Math.max(1, Math.floor(pAtk * (0.9 + Math.random() * 0.2)) - b.defense);
      b.hp = Math.max(0, b.hp - pDmg);

      if (typeof UI !== 'undefined') {
        UI.showDamageNumber(pDmg, false, 'boss');
        UI.animatePlayerAttack('boss');
        UI.animateBossHit();
        UI.updateBossChamber();
      }
    }

    if (b.hp <= 0 && !isVideoCutscene) {
      b.hp = 0;
      if (typeof UI !== 'undefined') UI.updateBossChamber();
      setTimeout(() => this.endFight(true), 450);
      return;
    }

    // --- ĐÒN BỒI EXTRA TURN NẾU TỐC ĐỘ CAO ---
    const extraChance = Player.getExtraTurnChance(b.speed);
    if (Math.random() < extraChance && !isVideoCutscene) {
      const extraDmg = Math.max(1, Math.floor(pDmg * 0.85));
      b.hp = Math.max(0, b.hp - extraDmg);

      setTimeout(() => {
        if (!GameState.boss?.active) return;
        if (typeof UI !== 'undefined') {
          UI.showExtraTurnIndicator();
          UI.showDamageNumber(extraDmg, true, 'boss');
          UI.animateBossHit();
          UI.updateBossChamber();
        }
        if (b.hp <= 0) {
          b.hp = 0;
          if (typeof UI !== 'undefined') UI.updateBossChamber();
          setTimeout(() => this.endFight(true), 450);
        }
      }, 200);

      if (b.hp <= 0) return;
    }

    const bossCounterDelay = isVideoCutscene
      ? (((skillRes.hero?.id === 'hero_trisa' || skillRes.hero?.id === 'hero_rhiannon')) ? 3100 : ((skillRes.hero?.id === 'hero_cassius') ? 5400 : 6600))
      : ((skillRes.triggered && skillRes.type === 'burst') ? 4000 : 600);
    setTimeout(() => {
      if (!GameState.boss?.active) return;
      b.rage = Math.min(100, (b.rage || 0) + 25);

      let bDmg = 0;
      let usedSkill = null;

      if (b.rage >= 100 && b.skills && b.skills.length > 0) {
        // Boss kích hoạt kỹ năng đặc biệt
        usedSkill = b.skills[Math.floor(Math.random() * b.skills.length)];
        bDmg = Math.max(1, Math.floor(b.attack * (usedSkill.dmgMult || 2.2)) - Player.getEffectiveDefense());
        b.rage = 0;
      } else {
        // Đòn đánh thường
        bDmg = Math.max(1, Math.floor(b.attack * (0.85 + Math.random() * 0.3)) - Player.getEffectiveDefense());
      }

      const pResult = Player.takeDamage(bDmg);

      if (typeof UI !== 'undefined') {
        if (usedSkill) {
          UI.showBossSkillWarning(b, usedSkill);
          UI.showDamageNumber(bDmg, true, 'player');
          if (UI.screenShake) UI.screenShake();
          UI.addCombatLog(
            `⚠️ <strong style="color:#ff1744;">[BOSS TUYỆT KỸ]:</strong> ` +
            `<span style="color:#ffd700; font-weight:800;">${b.name}</span> tung ` +
            `<span style="color:#ff3d00; font-weight:800;">【${usedSkill.name}】</span> ` +
            `gây bạo kích <strong style="color:#ff0055;">-${bDmg}</strong>!`,
            'log-danger'
          );
        } else {
          UI.showDamageNumber(bDmg, false, 'player');
        }

        UI.animateBossAttack();
        UI.animatePlayerHit('boss');

        const regen = Player.getEffectiveHpRegen();
        if (regen > 0 && !pResult.isDead) Player.heal(regen);

        UI.updateBossChamber();
        UI.updateStatusBar();
      }

      if (pResult.isDead) {
        if (typeof UI !== 'undefined') UI.animatePlayerDeath('boss');
        this.endFight(false, 'Bạn đã ngã xuống trước sức mạnh của Boss!');
      }
    }, bossCounterDelay);
  },

  _stopAllIntervals() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    if (this._actionInterval) {
      clearInterval(this._actionInterval);
      this._actionInterval = null;
    }
  },

  endFight(isVictory, reason) {
    if (!GameState.boss?.active) return;
    this._stopAllIntervals();

    const boss = GameState.boss.config || CONFIG.BOSS_LIST[GameState.boss.bossIndex];
    GameState.boss.active = false;
    if (typeof UI !== 'undefined' && UI.hideBossSkillWarning) {
      UI.hideBossSkillWarning();
    }

    if (isVictory) {
      const goldEarned = Player.gainGold(boss.goldReward);
      Player.gainExp(boss.expReward);

      // Tỉ lệ rơi Bùa Bảo Hiểm
      let gotProtectionStone = Math.random() < boss.protectionStoneDropRate;
      if (gotProtectionStone) Player.gainProtectionStones(1);

      // Tỉ lệ rơi trang bị hiếm
      let droppedItem = null;
      if (!Inventory.isFull() && boss.itemDropPool?.length > 0) {
        const dropRarity = boss.itemDropPool[Math.floor(Math.random() * boss.itemDropPool.length)];
        const pool = CONFIG.getItemsByRarity(dropRarity);
        if (pool?.length) droppedItem = Inventory.addItem(pool[Math.floor(Math.random() * pool.length)]);
      }

      if (typeof UI !== 'undefined') {
        UI.showBossVictoryPopup({ boss, gold: goldEarned, exp: boss.expReward, protectionStone: gotProtectionStone, item: droppedItem });
        UI.addCombatLog(`👑 <strong>CHIẾN THẮNG BOSS:</strong> ${boss.name}!`, 'level-up');
      }

      if (typeof FriendAdmin !== 'undefined') {
        FriendAdmin.logAction('boss', `Đại chiến thắng lợi: Trảm sát Boss [${boss.name}] nhận +${goldEarned.toLocaleString()} Vàng!`);
      }
      if (typeof Leaderboard !== 'undefined') {
        Leaderboard.syncCurrentPlayer();
      }
    } else {
      Player.revive();
      if (typeof UI !== 'undefined') {
        UI.showToast(`💀 Thất bại: ${reason || 'Không thể tiêu diệt Boss!'}`);
        UI.addCombatLog(`💀 Khiêu chiến thất bại: ${boss.name}`, 'log-danger');
      }
    }

    // Khởi động lại vòng lặp quái thường sau khi trận Boss kết thúc
    if (typeof Combat !== 'undefined') {
      setTimeout(() => Combat.start(), 300);
    }

    if (typeof UI !== 'undefined') {
      UI._bossListRendered = false;
      UI.updateBossChamber();
      UI.updateStatusBar();
      UI.updateBattle();
    }
  },

  forfeit() {
    if (GameState.boss?.active) this.endFight(false, 'Bạn đã chủ động rút lui!');
  }
};
