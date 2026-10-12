const Combat = {
  isRunning: false,
  _timer: null,
  _isReviving: false,

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (!GameState.player) GameState.player = Player.createDefault();
    if (!Monster.current) Monster.spawn();
    this._scheduleNextTurn(500);
  },

  stop() {
    this.isRunning = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  },

  // Khoảng cách giữa các lượt giảm dần khi SPD người chơi tăng
  _scheduleNextTurn(customDelay) {
    if (!this.isRunning) return;
    if (this._timer) clearTimeout(this._timer);
    const pSpeed = Player.getEffectiveSpeed();
    const delay = customDelay !== undefined ? customDelay : Math.max(350, Math.min(800, 750 - pSpeed * 4));

    this._timer = setTimeout(() => this.step(), delay);
  },

  step() {
    if (!this.isRunning) return;

    if (GameState.boss?.active) {
      if (typeof Boss !== 'undefined') Boss.step();
      this._scheduleNextTurn(700);
      return;
    }

    const p = GameState.player;

    // Hồi sinh tự động sau khi chết
    if (p.currentHp <= 0 || this._isReviving) {
      if (!this._isReviving) {
        this._isReviving = true;
        UI.addCombatLog('💀 Bạn đã tử trận! Đang hồi sinh...', 'log-danger');
        UI.updateBattle();

        setTimeout(() => {
          Player.revive();
          this._isReviving = false;
          Monster.spawn();
          UI.addCombatLog('✨ Hồi sinh thành công! Tiếp tục chiến đấu!', 'level-up');
          UI.updateBattle();
          this._scheduleNextTurn(400);
        }, CONFIG.PLAYER_REVIVE_TIME);
      }
      return;
    }

    if (!Monster.current || Monster.current.hp <= 0) {
      Monster.spawn();
      this._scheduleNextTurn(300);
      return;
    }

    const m = Monster.current;

    // 1. Lượt của Người chơi
    const pAtk = Player.getEffectiveAttack();
    const pDamage = Math.max(1, Math.floor(pAtk * (0.9 + Math.random() * 0.2)) - m.defense);
    const hitResult = Monster.takeDamage(pDamage);

    UI.showDamageNumber(pDamage, false, 'monster');
    UI.animatePlayerAttack();
    UI.animateMonsterHit();

    if (hitResult.isDead) {
      this._onMonsterKill(m);
      this._scheduleNextTurn(500);
      return;
    }

    // Đòn bồi Extra Turn khi vượt trội tốc độ
    const extraChance = Player.getExtraTurnChance(m.speed);
    if (Math.random() < extraChance) {
      UI.showExtraTurnIndicator();
      UI.addCombatLog(`⚡ <strong>TỐC ĐỘ VƯỢT TRỘI!</strong> Đánh thêm 1 lượt!`, 'log-extra');

      const extraDamage = Math.max(1, Math.floor(pDamage * 0.9));
      const extraResult = Monster.takeDamage(extraDamage);

      setTimeout(() => {
        UI.showDamageNumber(extraDamage, true, 'monster');
        UI.animateMonsterHit();
        if (extraResult.isDead) this._onMonsterKill(m);
      }, 200);

      if (extraResult.isDead) {
        this._scheduleNextTurn(650);
        return;
      }
    }

    // 2. Lượt phản công của Quái
    const mDamage = Math.max(1, Math.floor(m.attack * (0.85 + Math.random() * 0.3)) - Player.getEffectiveDefense());
    const pTakeDmg = Player.takeDamage(mDamage);

    setTimeout(() => {
      UI.showDamageNumber(mDamage, false, 'player');
      UI.animateMonsterAttack();
      UI.animatePlayerHit();

      if (pTakeDmg.isDead) {
        UI.addCombatLog(`💥 ${m.name} tung đòn chí mạng gây <strong>-${mDamage}</strong>! Bạn đã tử trận!`, 'log-danger');
      } else {
        const regen = Player.getEffectiveHpRegen();
        if (regen > 0) Player.heal(regen);
      }
      UI.updateBattle();
    }, 250);

    UI.updateBattle();
    this._scheduleNextTurn();
  },

  _onMonsterKill(m) {
    const goldEarned = Player.gainGold(m.goldReward);
    Player.gainExp(m.expReward);
    GameState.combat.monstersKilled++;

    if (GameState.combat.monstersKilled % 50 === 0) {
      Player.gainDiamond(5);
      UI.addCombatLog(`💎 Nhận 5 Kim Cương (${GameState.combat.monstersKilled} quái đã hạ)!`, 'level-up');
    }

    UI.addCombatLog(
      `☠️ Hạ gục <strong>${m.name}</strong>! ` +
      `<span class="gold-reward">+${goldEarned} 💰</span> ` +
      `<span class="exp-reward">+${m.expReward} ✨</span>`
    );

    UI.animateMonsterDeath(() => {
      Monster.spawn();
      UI.updateBattle();
    });
  },

  calculateOfflineKills(seconds) {
    const pLevel = GameState.player.level;
    const pAtk = Player.getEffectiveAttack();
    const pSpeed = Player.getEffectiveSpeed();

    const template = CONFIG.getMonsterForLevel(pLevel);
    const mHp = Math.floor(CONFIG.MONSTER_HP_BASE * Math.pow(CONFIG.MONSTER_HP_GROWTH, pLevel - 1) * (template.hpMod || 1.0));
    const mDef = Math.floor(CONFIG.MONSTER_DEF_BASE * Math.pow(CONFIG.MONSTER_DEF_GROWTH, pLevel - 1) * (template.defMod || 1.0));
    const mSpeed = Math.floor(CONFIG.MONSTER_SPD_BASE * Math.pow(CONFIG.MONSTER_SPD_GROWTH, pLevel - 1) * (template.spdMod || 1.0));
    const mGold = Math.floor(CONFIG.MONSTER_GOLD_BASE * Math.pow(CONFIG.MONSTER_GOLD_GROWTH, pLevel - 1));
    const mExp = Math.floor(CONFIG.MONSTER_EXP_BASE * Math.pow(CONFIG.MONSTER_EXP_GROWTH, pLevel - 1));

    const pDmgPerTurn = Math.max(1, pAtk - mDef);
    const extraChance = Player.getExtraTurnChance(mSpeed);
    const effectiveTurnsToKill = Math.ceil(mHp / (pDmgPerTurn * (1 + extraChance)));

    const turnTimeSec = Math.max(0.4, 0.75 - pSpeed * 0.004);
    const timePerKill = Math.max(1.0, effectiveTurnsToKill * turnTimeSec);

    const kills = Math.floor(seconds / timePerKill);
    return {
      kills: kills,
      gold: Math.floor(kills * mGold * Player.getEffectiveGoldRate()),
      exp: Math.floor(kills * mExp),
      seconds: seconds
    };
  }
};
