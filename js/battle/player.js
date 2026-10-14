const Player = {
  // Trạng thái hồi chiêu kỹ năng thời gian thực trong trận đấu (ms timestamp)
  _skill2NextReady: 0,
  _skill3NextReady: 0,

  createDefault() {
    return {
      level: 1,
      exp: 0,
      gold: 50, // Quà khởi đầu 50 Vàng giúp người chơi nâng cấp chỉ số ngay khi vào game
      diamond: 100,
      bossKeys: 2,
      protectionStones: 2,
      currentHp: CONFIG.BASE_HP,
      baseMaxHp: CONFIG.BASE_HP,
      baseAttack: CONFIG.BASE_ATTACK,
      baseDefense: CONFIG.BASE_DEFENSE,
      baseSpeed: CONFIG.BASE_SPEED,
      baseGoldRate: CONFIG.BASE_GOLD_RATE,
      baseHpRegen: CONFIG.BASE_HP_REGEN,
      equipment: { weapon: null, armor: null, accessory: null }
    };
  },

  // Lấy dữ liệu Hero đang xuất chiến (Kèm toàn bộ Buff Cung Mệnh E1-E6 và Tinh Luyện Vũ Khí R1-R5)
  getActiveHeroData() {
    const activeId = GameState.activeHeroId || 'hero_starter';
    const heroCfg = CONFIG.getHeroById(activeId);
    const userHero = GameState.heroes?.find(h => h.id === activeId) || { constellation: 0, level: 1, skillLevels: { s1: 1, s2: 1, s3: 1 } };
    const curEidolon = userHero.constellation || 0; // 0 = E0, 1 = E1, ... 6 = E6

    // Tính toán cộng dồn từ các mốc Cung Mệnh đã mở khóa (E1 đến E[curEidolon])
    let bonusAtk = 0;
    let bonusHp = 0;
    let bonusDef = 0;
    let extraSpd = 0;
    let extraGoldRate = 0;
    let extraTurnBonus = 0;
    let cdReduction = 0;
    let skillDmgBonus = 0;
    let burstDmgBonus = 0;
    const unlockedPassives = [];

    if (heroCfg?.eidolons && curEidolon > 0) {
      for (let i = 0; i < curEidolon; i++) {
        const e = heroCfg.eidolons[i];
        if (!e) continue;
        if (e.bonusAtk) bonusAtk += e.bonusAtk;
        if (e.bonusHp) bonusHp += e.bonusHp;
        if (e.bonusDef) bonusDef += e.bonusDef;
        if (e.extraSpd) extraSpd += e.extraSpd;
        if (e.bonusGold) extraGoldRate += e.bonusGold;
        if (e.extraTurnBonus) extraTurnBonus += e.extraTurnBonus;
        if (e.cdReduction) cdReduction += e.cdReduction;
        if (e.skillDmgMult) skillDmgBonus += e.skillDmgMult;
        if (e.burstDmgMult) burstDmgBonus += e.burstDmgMult;
        if (e.uniquePassive) unlockedPassives.push(e.uniquePassive);
      }
    }

    // Tinh luyện vũ khí hiện tại (Refinement R1 - R5)
    const equippedWeapon = GameState.player?.equipment?.weapon;
    const weaponRefinement = equippedWeapon?.refinement || 1;
    const weaponRefinementMult = 1 + (CONFIG.WEAPON_REFINEMENT?.getBonus(weaponRefinement) || 0);

    return {
      config: heroCfg,
      userHero,
      curEidolon,
      unlockedPassives,
      cdReduction,
      skillDmgBonus,
      burstDmgBonus,
      extraTurnBonus,
      weaponRefinement,
      weaponRefinementMult,
      totalAtkMult: (1 + (heroCfg.atkBonusPct || 0) + bonusAtk + (heroCfg.skills?.[0]?.bonusAtk || 0)) * weaponRefinementMult,
      totalHpMult: 1 + (heroCfg.hpBonusPct || 0) + bonusHp,
      totalDefMult: 1 + (heroCfg.defBonusPct || 0) + bonusDef + (heroCfg.skills?.[0]?.bonusDef || 0),
      extraSpd: (heroCfg.spdBonus || 0) + extraSpd,
      extraGoldRate: (heroCfg.skills?.[0]?.bonusGold || 0) + extraGoldRate
    };
  },

  getEffectiveMaxHp() {
    const p = GameState.player;
    const u = GameState.upgrades;
    const hero = this.getActiveHeroData();

    let hp = p.baseMaxHp + (p.level - 1) * CONFIG.LEVEL_HP_BONUS + (u.maxHp || 0) * CONFIG.UPGRADES.maxHp.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.maxHp) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        hp += Math.floor(item.stats.maxHp * mult);
      }
    }
    return Math.floor(hp * hero.totalHpMult);
  },

  getEffectiveAttack() {
    if (GameState.oneHitKill) return 999999999;
    const p = GameState.player;
    const u = GameState.upgrades;
    const hero = this.getActiveHeroData();

    let atk = p.baseAttack + (p.level - 1) * CONFIG.LEVEL_ATK_BONUS + (u.attack || 0) * CONFIG.UPGRADES.attack.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.attack) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        atk += Math.floor(item.stats.attack * mult);
      }
    }
    return Math.floor(atk * hero.totalAtkMult);
  },

  getEffectiveDefense() {
    const p = GameState.player;
    const u = GameState.upgrades;
    const hero = this.getActiveHeroData();

    let def = p.baseDefense + (p.level - 1) * CONFIG.LEVEL_DEF_BONUS + (u.defense || 0) * CONFIG.UPGRADES.defense.bonusPerLevel;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.defense) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        def += Math.floor(item.stats.defense * mult);
      }
    }
    return Math.floor(def * hero.totalDefMult);
  },

  getEffectiveSpeed() {
    const p = GameState.player;
    const u = GameState.upgrades;
    const hero = this.getActiveHeroData();

    let spd = p.baseSpeed + (p.level - 1) * CONFIG.LEVEL_SPD_BONUS + (u.speed || 0) * CONFIG.UPGRADES.speed.bonusPerLevel + hero.extraSpd;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.speed) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        spd += Math.floor(item.stats.speed * mult);
      }
    }
    return Math.floor(spd);
  },

  getEffectiveHpRegen() {
    const p = GameState.player;
    const u = GameState.upgrades;
    return Math.floor(p.baseHpRegen + (u.hpRegen || 0) * CONFIG.UPGRADES.hpRegen.bonusPerLevel);
  },

  getEffectiveGoldRate() {
    const p = GameState.player;
    const u = GameState.upgrades;
    const hero = this.getActiveHeroData();

    let rate = p.baseGoldRate + (u.goldRate || 0) * CONFIG.UPGRADES.goldRate.bonusPerLevel + hero.extraGoldRate;
    for (const slot in p.equipment) {
      const item = p.equipment[slot];
      if (item?.stats?.goldRate) {
        const mult = 1 + (item.enhanceLevel || 0) * CONFIG.ENHANCE_STAT_BONUS_PER_LEVEL;
        rate += (item.stats.goldRate * mult);
      }
    }
    return rate;
  },

  getExtraTurnChance(targetSpeed) {
    const hero = this.getActiveHeroData();
    const playerSpeed = this.getEffectiveSpeed();
    const baseExtra = hero.extraTurnBonus || 0;
    if (playerSpeed <= targetSpeed) return Math.min(CONFIG.EXTRA_TURN_CAP, 0.05 + baseExtra);
    const ratio = (playerSpeed - targetSpeed) / (playerSpeed + targetSpeed);
    return Math.min(CONFIG.EXTRA_TURN_CAP, 0.05 + ratio * 0.75 + baseExtra);
  },

  // Kiểm tra và tự động kích hoạt kỹ năng Hero trong trận đấu
  checkTriggerHeroSkill() {
    const now = Date.now();
    const hero = this.getActiveHeroData();
    const skills = hero.config?.skills || [];
    const skill2 = skills[1]; // Elemental Skill
    const skill3 = skills[2]; // Elemental Burst (Nộ)

    // Ưu tiên nộ tuyệt kỹ (Skill 3) nếu đã hồi
    if (skill3 && now >= this._skill3NextReady) {
      const cd = Math.max(3, skill3.cd - (hero.cdReduction || 0));
      this._skill3NextReady = now + (cd * 1000);
      const userHero = hero.userHero;
      const skillLevel = userHero.skillLevels?.s3 || 1;
      const baseDmg = this.getEffectiveAttack() * (skill3.dmgMult * (1 + (skillLevel - 1) * 0.1));
      const dmg = Math.floor(baseDmg * (1 + (hero.burstDmgBonus || 0)));

      // Kazuha E1: Tung Nộ lập tức làm mới 100% hồi chiêu của Skill 2!
      if (hero.unlockedPassives.includes('reset_skill2_on_burst')) {
        this._skill2NextReady = 0;
      }
      // Zhongli E2: Nhận khiên Nham tương đương hồi 50% HP
      if (hero.unlockedPassives.includes('shield_burst')) {
        this.heal(this.getEffectiveMaxHp() * 0.5);
      }

      return { 
        triggered: true, 
        type: 'burst', 
        skill: skill3, 
        damage: dmg, 
        hero: hero.config,
        defShredPct: hero.unlockedPassives.includes('aetheris_cosmic_sovereign') ? 0.70 : (hero.unlockedPassives.includes('def_shred_60') ? 0.60 : (hero.unlockedPassives.includes('def_shred_40') ? 0.40 : 0))
      };
    }

    // Tiếp theo xét kỹ năng nguyên tố (Skill 2)
    if (skill2 && now >= this._skill2NextReady) {
      const cd = Math.max(2, skill2.cd - (hero.cdReduction || 0));
      this._skill2NextReady = now + (cd * 1000);
      const userHero = hero.userHero;
      const skillLevel = userHero.skillLevels?.s2 || 1;
      const baseDmg = this.getEffectiveAttack() * (skill2.dmgMult * (1 + (skillLevel - 1) * 0.08));
      const dmg = Math.floor(baseDmg * (1 + (hero.skillDmgBonus || 0)));
      return { triggered: true, type: 'skill', skill: skill2, damage: dmg, hero: hero.config };
    }

    return { triggered: false };
  },

  getSkillCooldownProgress() {
    const now = Date.now();
    const hero = this.getActiveHeroData();
    const skills = hero.config?.skills || [];
    const skill2 = skills[1];
    const skill3 = skills[2];

    const s2Total = (skill2?.cd || 6) * 1000;
    const s2Remaining = Math.max(0, this._skill2NextReady - now);
    const s2Pct = Math.min(100, Math.max(0, ((s2Total - s2Remaining) / s2Total) * 100));

    const s3Total = (skill3?.cd || 15) * 1000;
    const s3Remaining = Math.max(0, this._skill3NextReady - now);
    const s3Pct = Math.min(100, Math.max(0, ((s3Total - s3Remaining) / s3Total) * 100));

    return {
      s2: { pct: s2Pct, ready: s2Remaining <= 0, remainingSec: (s2Remaining / 1000).toFixed(1) },
      s3: { pct: s3Pct, ready: s3Remaining <= 0, remainingSec: (s3Remaining / 1000).toFixed(1) }
    };
  },

  takeDamage(amount) {
    if (GameState.godMode) return { damage: 0, isDead: false };
    const actual = Math.max(1, amount);

    // Aetheris E4: Hộ Thể Tinh Cầu (Crystal Barrier)
    const activeHero = this.getActiveHeroData();
    if (activeHero?.unlockedPassives?.includes('aetheris_crystal_barrier') && GameState.player.currentHp - actual <= 0) {
      if (!this._lastBarrierUsed || Date.now() - this._lastBarrierUsed > 45000) {
        this._lastBarrierUsed = Date.now();
        GameState.player.currentHp = Math.floor(this.getEffectiveMaxHp() * 0.5);
        if (typeof UI !== 'undefined') {
          UI.addCombatLog(`🛡️ <strong>HỘ THỂ TINH CẦU:</strong> Đôi cánh pha lê đỡ đòn chí tử và hồi phục 50% HP!`, 'log-extra');
          UI.showDamageNumber('BẢO HỘ!', false, 'player');
        }
        return { damage: 0, isDead: false };
      }
    }

    GameState.player.currentHp = Math.max(0, GameState.player.currentHp - actual);
    return { damage: actual, isDead: GameState.player.currentHp <= 0 };
  },

  heal(amount) {
    const max = this.getEffectiveMaxHp();
    GameState.player.currentHp = Math.min(max, GameState.player.currentHp + Math.max(0, amount));
    return GameState.player.currentHp;
  },

  revive() {
    GameState.player.currentHp = this.getEffectiveMaxHp();
  },

  getHpPercent() {
    const max = this.getEffectiveMaxHp();
    return max <= 0 ? 0 : Math.max(0, Math.min(100, (GameState.player.currentHp / max) * 100));
  },

  gainExp(amount) {
    const p = GameState.player;
    p.exp += amount;
    let needed = CONFIG.getExpForLevel(p.level);
    let leveledUp = false;

    while (p.exp >= needed && p.level < CONFIG.LEVEL_MAX) {
      p.exp -= needed;
      p.level++;
      leveledUp = true;
      needed = CONFIG.getExpForLevel(p.level);
    }

    if (leveledUp) {
      this.heal(this.getEffectiveMaxHp());
      if (typeof UI !== 'undefined') UI.showLevelUp(p.level);
      if (typeof FriendAdmin !== 'undefined') {
        FriendAdmin.logAction('level', `Đột phá cảnh giới! Đạt cấp độ Lv.${p.level}.`);
      }
      if (typeof Leaderboard !== 'undefined') {
        Leaderboard.syncCurrentPlayer();
      }
    }
    if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
  },

  gainGold(amount) {
    const effective = Math.floor(amount * this.getEffectiveGoldRate());
    GameState.player.gold += effective;
    if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
    return effective;
  },

  gainDiamond(amount) {
    GameState.player.diamond += amount;
    if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
  },

  gainProtectionStones(count) {
    GameState.player.protectionStones = (GameState.player.protectionStones || 0) + count;
    if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
  },

  gainBossKeys(count) {
    GameState.player.bossKeys = (GameState.player.bossKeys || 0) + count;
    if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
  },

  spendBossKeys(count) {
    if ((GameState.player?.bossKeys || 0) >= count) {
      GameState.player.bossKeys -= count;
      if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
      return true;
    }
    return false;
  },

  spendGold(amount) {
    if (GameState.player.gold >= amount) {
      GameState.player.gold -= amount;
      if (typeof AntiCheat !== 'undefined') AntiCheat.refreshSignatures();
      return true;
    }
    return false;
  },

  getExpNeeded() { return CONFIG.getExpForLevel(GameState.player.level); },
  getExpProgress() { return Math.min(GameState.player.exp / this.getExpNeeded(), 1); }
};
