const Combat = {
  isRunning: false,
  _timer: null,
  _isReviving: false,

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (!GameState.player) GameState.player = Player.createDefault();
    if (!GameState.stage) GameState.stage = { current: 1, max: 1, autoAdvance: true };
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

  _scheduleNextTurn(customDelay) {
    if (!this.isRunning) return;
    if (this._timer) clearTimeout(this._timer);
    const pSpeed = Player.getEffectiveSpeed();
    const delay = customDelay !== undefined ? customDelay : Math.max(350, Math.min(800, 750 - pSpeed * 4));

    this._timer = setTimeout(() => this.step(), delay);
  },

  step() {
    if (!this.isRunning) return;

    if (GameState.boss?.active || GameState.dungeon?.active) {
      this._scheduleNextTurn(1000);
      return;
    }

    if (typeof Cinematics !== 'undefined' && Cinematics.active) {
      this._scheduleNextTurn(500);
      return;
    }

    try {
      const p = GameState.player;

      // Hồi sinh tự động sau khi chết -> TỰ ĐỘNG LÙI VỀ ẢI AN TOÀN ĐÃ VƯỢT
      if (p.currentHp <= 0 || this._isReviving) {
        if (!this._isReviving) {
          this._isReviving = true;

          // Nếu thất bại ở ải hiện tại: Tự động lùi về ải an toàn trước đó
          if (GameState.stage && GameState.stage.current > 1) {
            GameState.stage.current = Math.max(1, GameState.stage.current - 1);
            UI.addCombatLog(`🛡️ <strong>LÙI VỀ ẢI ${GameState.stage.current}!</strong> Farm quái an toàn tích lũy sức mạnh.`, 'log-danger');
          } else {
            UI.addCombatLog('💀 Bạn đã tử trận! Đang hồi sinh...', 'log-danger');
          }
          UI.updateBattle();

          setTimeout(() => {
            Player.revive();
            this._isReviving = false;
            Monster.spawn();
            UI.addCombatLog('✨ Hồi sinh thành công! Tiếp tục farm tài nguyên!', 'level-up');
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

      // --- 1. LƯỢT CỦA NGƯỜI CHƠI (XÉT KỸ NĂNG ANH HÙNG HOẶC ĐÁNH THƯỜNG) ---
      const skillRes = Player.checkTriggerHeroSkill();

      if (skillRes.triggered) {
        if (skillRes.type === 'burst' && typeof UI !== 'undefined' && UI.playBurstCinematic) {
          try {
            UI.playBurstCinematic(skillRes);
          } catch (vfxErr) {
            console.warn("Burst cinematic error caught safely:", vfxErr);
          }
        }

        // Video Cutscene Heroes: Cassius, Rhiannon and Unknown God
        if (skillRes.type === 'burst' && (skillRes.hero?.id === 'hero_cassius' || skillRes.hero?.id === 'hero_rhiannon' || skillRes.hero?.id === 'hero_unknown_god')) {
          const isCassius = (skillRes.hero?.id === 'hero_cassius');
          const isRhiannon = (skillRes.hero?.id === 'hero_rhiannon');
          const badgeName = isCassius ? '🎰 CANH BẠC VÔ CỰC' : (isRhiannon ? '✨ THẦN MỘC KHẢI HUYỀN' : '🌟 TUYỆT KỸ NỘ');
          UI.addCombatLog(
            `<strong>${badgeName} [${skillRes.hero.name}]:</strong> ` +
            `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.skill.name}</span> ` +
            (isCassius 
              ? `tung xúc xắc và lật lá bài Át Chủ Bài...` 
              : (isRhiannon ? `giương Thần Cung khai mở đại trận rừng thiêng...` : `bắt đầu giải phóng thực tại...`)),
            'log-extra'
          );

          // E6 execution check
          let actualDmg = skillRes.damage;
          if (skillRes.executeThresholdPct && (m.hp / m.maxHp) <= skillRes.executeThresholdPct) {
            actualDmg = m.hp + 999999;
          }

          const willKill = (m.hp <= actualDmg);
          const hitDelay = isRhiannon ? 8600 : (isCassius ? 3450 : 5500);
          const turnDelayKill = isRhiannon ? 10000 : (isCassius ? 5800 : 6800);
          const counterDelay = isRhiannon ? 9800 : (isCassius ? 5600 : 6500);
          const turnDelaySurvive = isRhiannon ? 10200 : (isCassius ? 5900 : 7100);

          setTimeout(() => {
            const hitResult = Monster.takeDamage(actualDmg);
            UI.showDamageNumber(actualDmg, true, 'monster', true);
            UI.screenShake();
            UI.animatePlayerSkill(null, skillRes.type);
            UI.animateMonsterHit();
            UI.updateBattleStatsOnly();

            UI.addCombatLog(
              isCassius
                ? `<strong>👑 ROYAL FLUSH JACKPOT:</strong> ` +
                  `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.hero.name}</span> ` +
                  `đập trọn bộ bài Hoàng Gia bùng nổ sát thương Hoàng Kim <strong style="color:#ffd700;">-${actualDmg}</strong>!`
                : (isRhiannon
                  ? `<strong>🏹 THẦN MỘC KHẢI HUYỀN:</strong> ` +
                    `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.hero.name}</span> ` +
                    `bắn phát thần tiễn xé rách không gian bùng nổ sát thương Thánh Mộc <strong style="color:#4ade80;">-${actualDmg}</strong>!`
                  : `<strong>💥 TỊCH DIỆT HOÀN TOÀN:</strong> ` +
                    `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.hero.name}</span> ` +
                    `chém nát không gian gây sát thương bùng nổ <strong style="color:#ff0055;">-${actualDmg}</strong>!`),
              'log-extra'
            );

            if (hitResult.isDead) {
              m.hp = 0;
              UI.updateBattleStatsOnly();
              setTimeout(() => {
                UI.animateMonsterDeath(() => {
                  UI.animatePlayerWalk(null, 500);
                  this._onMonsterKill(m);
                });
              }, 350);
            }
          }, hitDelay);

          if (willKill) {
            this._scheduleNextTurn(turnDelayKill);
            return;
          } else {
            // Quái còn sống, chờ ulti kết thúc rồi mới phản công
            setTimeout(() => {
              if (m.hp <= 0) return;
              const mDamage = Math.max(1, Math.floor(m.attack * (0.85 + Math.random() * 0.3)) - Player.getEffectiveDefense());
              const pTakeDmg = Player.takeDamage(mDamage);
              UI.showDamageNumber(mDamage, false, 'player');
              UI.animateMonsterAttack();
              UI.animatePlayerHit();

              if (pTakeDmg.isDead) {
                UI.animatePlayerDeath();
                UI.addCombatLog(`💥 ${m.name} tung đòn phản công gây <strong>-${mDamage}</strong>! Bạn đã tử trận!`, 'log-danger');
              } else {
                const regen = Player.getEffectiveHpRegen();
                if (regen > 0) Player.heal(regen);
              }
              UI.updateBattle();
            }, counterDelay);

            this._scheduleNextTurn(turnDelaySurvive);
            return;
          }
        }

        // Tung kỹ năng đặc biệt của Hero
        const hitResult = Monster.takeDamage(skillRes.damage);
        UI.showDamageNumber(skillRes.damage, true, 'monster');
        UI.animatePlayerSkill(null, skillRes.type);
        UI.animateMonsterHit();

        // Kỹ năng Cổng Xoáy Cổ Ngữ của Aetheris: Bắn liên hoàn 5 nhịp & gây choáng
        if (skillRes.hero?.id === 'hero_aetheris' && skillRes.type === 'skill') {
          m.isStunned = true;
          const hitDamage = Math.max(1, Math.floor(skillRes.damage / 5));
          for (let hit = 1; hit < 5; hit++) {
            setTimeout(() => {
              if (m.hp > 0) {
                Monster.takeDamage(hitDamage);
                UI.showDamageNumber(hitDamage, hit === 4, 'monster');
                UI.animateMonsterHit();
                UI.updateBattleStatsOnly();
              }
            }, hit * 90);
          }
        }

        // Kỹ năng Thánh Quang Ban Phước của Rhiannon (Auto-Buff Quyền Trượng Thánh Quang)
        if (skillRes.hero?.id === 'hero_rhiannon' && skillRes.type === 'skill') {
          if (typeof UI !== 'undefined' && UI.showRhiannonTreeBuff) {
            UI.showRhiannonTreeBuff();
          }
          const healAmt = Math.floor(Player.getEffectiveMaxHp() * 0.35);
          Player.heal(healAmt);
          UI.showDamageNumber(healAmt, false, 'player');
          UI.addCombatLog(
            `✨ <strong>THÁNH QUANG BAN PHƯỚC [Rhiannon]:</strong> ` +
            `Quyền Trượng Thánh Quang tỏa sáng hồi phục <strong style="color:#4ade80;">+${healAmt} HP</strong> và ban phước tăng 100% Sát thương!`,
            'log-extra'
          );
        }

        const badgeName = skillRes.type === 'burst' ? '🌟 TUYỆT KỸ NỘ' : '⚡ KỸ NĂNG NGUYÊN TỐ';
        UI.addCombatLog(
          `<strong>${badgeName} [${skillRes.hero.name}]:</strong> ` +
          `<span style="color:${skillRes.hero.elementColor}; font-weight:800;">${skillRes.skill.name}</span> ` +
          `gây sát thương hủy diệt <strong style="color:#ff0055;">-${skillRes.damage}</strong>!`,
          'log-extra'
        );

        if (hitResult.isDead) {
          m.hp = 0;
          UI.updateBattleStatsOnly();
          const deathDelay = (skillRes.type === 'burst') ? 3900 : 180;
          const nextTurnDelay = (skillRes.type === 'burst') ? 4350 : 650;
          setTimeout(() => {
            UI.animateMonsterDeath(() => {
              UI.animatePlayerWalk(null, 500);
              this._onMonsterKill(m);
            });
          }, deathDelay);
          this._scheduleNextTurn(nextTurnDelay);
          return;
        }
      } else {
        // Đòn đánh thường
        const pAtk = Player.getEffectiveAttack();
        const pDamage = Math.max(1, Math.floor(pAtk * (0.9 + Math.random() * 0.2)) - m.defense);
        const hitResult = Monster.takeDamage(pDamage);

        UI.showDamageNumber(pDamage, false, 'monster');
        UI.animatePlayerAttack();
        UI.animateMonsterHit();

        // Cơ chế Tinh Thể Vũ Trụ & Vũ Khúc Tinh Thần của Aetheris (Đổi mới hoàn toàn)
        const activeHero = Player.getActiveHeroData();
        if (activeHero?.config?.id === 'hero_aetheris') {
          Player._aetherisShards = (Player._aetherisShards || 0) + 1;
          if (Player._aetherisShards >= 3) {
            Player._aetherisShards = 0;
            const resonanceDmg = Math.floor(pDamage * 1.6);
            const extraRes = Monster.takeDamage(resonanceDmg);
            setTimeout(() => {
              UI.showDamageNumber(resonanceDmg, true, 'monster');
              UI.animateMonsterHit();
              if (extraRes.isDead) {
                m.hp = 0;
                UI.updateBattleStatsOnly();
                setTimeout(() => {
                  UI.animateMonsterDeath(() => {
                    UI.animatePlayerWalk(null, 500);
                    Combat._onMonsterKill(m);
                  });
                }, 180);
              }
            }, 120);
            Player._skill3NextReady = Math.max(0, Player._skill3NextReady - 2500);
            UI.addCombatLog(`🌌 <strong>VŨ KHÚC TINH THẦN:</strong> Thu hồi 3 Tinh Thể kích nổ bạo kích <strong style="color:#00e5ff;">-${resonanceDmg}</strong> & nạp năng lượng Nộ!`, 'log-extra');
          } else {
            const shardDmg = Math.max(1, Math.floor(pDamage * 0.45));
            Monster.takeDamage(shardDmg);
            setTimeout(() => {
              UI.showDamageNumber(shardDmg, false, 'monster');
            }, 80);
            UI.addCombatLog(`✨ Tinh Thể Tinh Linh (${Player._aetherisShards}/3) găm sâu vào đối thủ!`, 'log-normal');
          }
        }

        if (hitResult.isDead) {
          m.hp = 0;
          UI.updateBattleStatsOnly();
          setTimeout(() => {
            UI.animateMonsterDeath(() => {
              UI.animatePlayerWalk(null, 500);
              this._onMonsterKill(m);
            });
          }, 180);
          this._scheduleNextTurn(650);
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
            if (extraResult.isDead) {
              UI.animateMonsterDeath(() => {
                UI.animatePlayerWalk(null, 500);
                this._onMonsterKill(m);
              });
            }
          }, 200);

          if (extraResult.isDead) {
            this._scheduleNextTurn(700);
            return;
          }
        }
      }

      // --- 2. LƯỢT PHẢN CÔNG CỦA QUÁI ---
      if (m.isStunned) {
        m.isStunned = false;
        UI.addCombatLog(`🌀 <strong>[${m.name}]</strong> bị Cổng Xoáy Cổ Ngữ làm tê liệt, mất lượt phản công!`, 'log-extra');
        UI.updateBattleStatsOnly();
        UI.updateMonsterDisplay();
        this._scheduleNextTurn(skillRes.triggered && skillRes.type === 'burst' ? 4350 : 650);
        return;
      }
      const mDamage = Math.max(1, Math.floor(m.attack * (0.85 + Math.random() * 0.3)) - Player.getEffectiveDefense());
      const pTakeDmg = Player.takeDamage(mDamage);
      const counterDelay = (skillRes.triggered && skillRes.type === 'burst') ? 4000 : 350;

      setTimeout(() => {
        UI.showDamageNumber(mDamage, false, 'player');
        UI.animateMonsterAttack();
        UI.animatePlayerHit();

        if (pTakeDmg.isDead) {
          UI.animatePlayerDeath();
          UI.addCombatLog(`💥 ${m.name} tung đòn chí mạng gây <strong>-${mDamage}</strong>! Bạn đã tử trận!`, 'log-danger');
        } else {
          const regen = Player.getEffectiveHpRegen();
          if (regen > 0) Player.heal(regen);
        }
        UI.updateBattle();
      }, counterDelay);

      UI.updateBattleStatsOnly();
      UI.updateMonsterDisplay();
      this._scheduleNextTurn(skillRes.triggered && skillRes.type === 'burst' ? 4350 : undefined);
    } catch (err) {
      console.error("Combat step recovered from error:", err);
      this._scheduleNextTurn(600);
    }
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
      `☠️ Hạ gục <strong>${m.name}</strong> (Ải ${GameState.stage?.current || 1})! ` +
      `<span class="gold-reward">+${goldEarned} 💰</span> ` +
      `<span class="exp-reward">+${m.expReward} ✨</span>`
    );

    // TỰ ĐỘNG TIẾN ẢI KHI THẮNG QUÁI
    if (GameState.stage && GameState.stage.autoAdvance) {
      GameState.stage.current++;
      GameState.stage.max = Math.max(GameState.stage.max || 1, GameState.stage.current);
      UI.addCombatLog(`🚩 <strong>VƯỢT ẢI THÀNH CÔNG!</strong> Tiến vào Ải ${GameState.stage.current}!`, 'level-up');
    }

    UI.animateMonsterDeath(() => {
      Monster.spawn();
      UI.updateBattle();
    });
  },

  // Chọn ải thủ công
  setStage(stageNum) {
    const max = GameState.stage?.max || 1;
    const target = Math.max(1, Math.min(max, stageNum));
    GameState.stage.current = target;
    Monster.spawn();
    UI.updateBattle();
    UI.showToast(`🚩 Đã chuyển sang Ải ${target}!`);
  },

  calculateOfflineKills(seconds) {
    const stage = GameState.stage?.current || 1;
    const pAtk = Player.getEffectiveAttack();
    const pSpeed = Player.getEffectiveSpeed();

    const template = CONFIG.getMonsterForLevel(stage);
    const factor = Math.max(0, stage - 1);
    const mHp = Math.floor(CONFIG.MONSTER_HP_BASE * Math.pow(CONFIG.MONSTER_HP_GROWTH, factor) * (template.hpMod || 1.0));
    const mDef = Math.floor(CONFIG.MONSTER_DEF_BASE * Math.pow(CONFIG.MONSTER_DEF_GROWTH, factor) * (template.defMod || 1.0));
    const mSpeed = Math.floor(CONFIG.MONSTER_SPD_BASE * Math.pow(CONFIG.MONSTER_SPD_GROWTH, factor) * (template.spdMod || 1.0));
    const mGold = Math.floor(CONFIG.MONSTER_GOLD_BASE * Math.pow(CONFIG.MONSTER_GOLD_GROWTH, factor));
    const mExp = Math.floor(CONFIG.MONSTER_EXP_BASE * Math.pow(CONFIG.MONSTER_EXP_GROWTH, factor));

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
