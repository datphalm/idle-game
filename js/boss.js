// ============================================================
// boss.js — Boss Chamber & Dungeon System
// ============================================================

const Boss = {
  _timerInterval: null,

  // --- Buy Boss Key ---
  buyKey() {
    const cost = this.getKeyPrice();
    if (!Player.spendGold(cost)) {
      return { success: false, error: 'not_enough_gold', cost: cost };
    }
    Player.gainBossKeys(1);
    return { success: true, count: GameState.player.bossKeys };
  },

  getKeyPrice() {
    const lvl = GameState.player ? GameState.player.level : 1;
    return Math.floor(CONFIG.BOSS_KEY_PRICE * (1 + (lvl - 1) * 0.08));
  },

  // --- Start Boss Fight ---
  startFight(bossIndex) {
    const boss = CONFIG.BOSS_LIST[bossIndex];
    if (!boss) return { success: false, error: 'invalid_boss' };

    const keys = GameState.player.bossKeys || 0;
    if (keys < boss.keyCost) {
      return { success: false, error: 'not_enough_keys', needed: boss.keyCost };
    }

    // Deduct keys
    GameState.player.bossKeys -= boss.keyCost;

    // Fully heal player for epic boss battle
    Player.heal(Player.getEffectiveMaxHp());

    GameState.boss = {
      active: true,
      bossIndex: bossIndex,
      name: boss.name,
      emoji: boss.emoji,
      hp: boss.hp,
      maxHp: boss.hp,
      attack: boss.attack,
      defense: boss.defense,
      speed: boss.speed,
      timer: boss.timer,
      timerMax: boss.timer,
      config: boss
    };

    // Start timer countdown ticker
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      if (GameState.boss && GameState.boss.active) {
        GameState.boss.timer -= 0.5;
        if (GameState.boss.timer <= 0) {
          GameState.boss.timer = 0;
          this.endFight(false, 'Hết thời gian! Boss đã nổi giận và đẩy lùi bạn!');
        }
        if (typeof UI !== 'undefined') {
          UI.updateBossChamber();
        }
      }
    }, 500);

    if (typeof UI !== 'undefined') {
      UI.updateBossChamber();
      UI.addCombatLog(`🔥 <strong>BẮT ĐẦU KHIÊU CHIẾN:</strong> ${boss.name}!`, 'log-danger');
    }

    return { success: true, boss: boss };
  },

  // --- Step in Boss Turn-Based Fight ---
  step() {
    if (!GameState.boss || !GameState.boss.active) return;

    const b = GameState.boss;
    const p = GameState.player;

    if (b.hp <= 0) {
      this.endFight(true);
      return;
    }

    if (p.currentHp <= 0) {
      this.endFight(false, 'Bạn đã bị Boss đánh bại!');
      return;
    }

    // ============================================================
    // 1. Player attacks Boss
    // ============================================================
    const pAtk = Player.getEffectiveAttack();
    const variance = 0.9 + Math.random() * 0.2;
    const rawDamage = Math.floor(pAtk * variance);
    const pDamage = Math.max(1, rawDamage - b.defense);

    b.hp -= pDamage;
    UI.showDamageNumber(pDamage, false, 'boss');
    UI.animatePlayerAttack();
    UI.animateBossHit();

    if (b.hp <= 0) {
      b.hp = 0;
      this.endFight(true);
      return;
    }

    // Extra Turn Check vs Boss Speed
    const extraChance = Player.getExtraTurnChance(b.speed);
    if (Math.random() < extraChance) {
      UI.showExtraTurnIndicator();
      UI.addCombatLog(`⚡ <strong>EXTRA TURN!</strong> Đánh liên kích lên ${b.name}!`, 'log-extra');

      const extraDamage = Math.max(1, Math.floor(pDamage * 0.9));
      b.hp -= extraDamage;

      setTimeout(() => {
        UI.showDamageNumber(extraDamage, true, 'boss');
        UI.animateBossHit();
        if (b.hp <= 0) {
          b.hp = 0;
          this.endFight(true);
        }
      }, 200);

      if (b.hp <= 0) return;
    }

    // ============================================================
    // 2. Boss counter-attacks Player
    // ============================================================
    setTimeout(() => {
      if (!GameState.boss || !GameState.boss.active) return;

      const bVariance = 0.85 + Math.random() * 0.3;
      const bRawDamage = Math.floor(b.attack * bVariance);
      const bDamage = Math.max(1, bRawDamage - Player.getEffectiveDefense());

      const pTakeDmg = Player.takeDamage(bDamage);
      UI.showDamageNumber(bDamage, false, 'player');
      UI.animateBossAttack();
      UI.animatePlayerHit();

      if (pTakeDmg.isDead) {
        this.endFight(false, 'Bạn đã ngã xuống trước sức mạnh của Boss!');
      } else {
        // Regen HP at end of round
        const regen = Player.getEffectiveHpRegen();
        if (regen > 0) Player.heal(regen);
      }

      UI.updateBossChamber();
      UI.updateStatusBar();
    }, 250);

    UI.updateBossChamber();
  },

  // --- End Boss Fight ---
  endFight(isVictory, reason) {
    if (!GameState.boss || !GameState.boss.active) return;

    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    const boss = GameState.boss.config;
    GameState.boss.active = false;

    if (isVictory) {
      // Rewards!
      const goldEarned = Player.gainGold(boss.goldReward);
      Player.gainExp(boss.expReward);

      // Check Protection Stone Drop
      let gotProtectionStone = false;
      if (Math.random() < boss.protectionStoneDropRate) {
        Player.gainProtectionStones(1);
        gotProtectionStone = true;
      }

      // Check High-tier Item Drop
      let droppedItem = null;
      if (!Inventory.isFull() && boss.itemDropPool && boss.itemDropPool.length > 0) {
        const dropRarity = boss.itemDropPool[Math.floor(Math.random() * boss.itemDropPool.length)];
        const pool = CONFIG.getItemsByRarity(dropRarity);
        if (pool && pool.length > 0) {
          const template = pool[Math.floor(Math.random() * pool.length)];
          droppedItem = Inventory.addItem(template);
        }
      }

      UI.showBossVictoryPopup({
        boss: boss,
        gold: goldEarned,
        exp: boss.expReward,
        protectionStone: gotProtectionStone,
        item: droppedItem
      });

      UI.addCombatLog(`👑 <strong>CHIẾN THẮNG BOSS:</strong> ${boss.name}!`, 'level-up');
    } else {
      Player.revive(); // revive player if fallen in boss chamber
      UI.showToast(`💀 Thất bại: ${reason || 'Không thể tiêu diệt Boss!'}`);
      UI.addCombatLog(`💀 Khiêu chiến thất bại: ${boss.name}`, 'log-danger');
    }

    UI.updateBossChamber();
    UI.updateStatusBar();
  },

  // --- Forfeit / Exit chamber ---
  forfeit() {
    if (GameState.boss && GameState.boss.active) {
      this.endFight(false, 'Bạn đã chủ động rút lui!');
    }
  }
};
