// ============================================================
// sprites.js — Pixel Art Sprite & Aura Generator (Crisp Vector Pixel Engine)
// ============================================================

const Sprites = {

  // ============================================================
  // 1. PIXEL HEROES & CHARACTERS (GENSHIN & WUTHERING WAVES PIXEL ART)
  // ============================================================
  // ============================================================
  // 1. DYNAMIC EQUIPPED WEAPON RENDERER (GENSHIN STYLE)
  // ============================================================
  renderEquippedWeapon(action = 'idle', customWeapon = null, scale = 1, offsetX = 0, offsetY = 0) {
    const weapon = customWeapon || GameState.player?.equipment?.weapon;
    const isAttack = action === 'attack';
    const isHit = action === 'hit';
    const isExtra = action === 'extra';

    const rot = isAttack ? 70 : isExtra ? 95 : isHit ? -30 : 15;
    const tx = 22 + offsetX + (isAttack ? 6 : isExtra ? 8 : isHit ? -8 : 0);
    const ty = 14 + offsetY + (isAttack ? -2 : isExtra ? -4 : isHit ? 4 : 0);

    const rarity = weapon ? weapon.rarity : 'common';
    const enhance = weapon ? (weapon.enhanceLevel || 0) : 0;
    const name = weapon ? weapon.name : 'Kiếm Gỗ';

    let bladeFill = '#b0bec5';
    let edgeFill = '#cfd8dc';
    let hiltFill = '#5d4037';
    let guardFill = '#8d6e63';
    let glowFilter = '';

    if (rarity === 'unknown' || name.includes('⟦')) {
      bladeFill = 'url(#void-grad)';
      edgeFill = '#00ffff';
      hiltFill = '#ffffff';
      guardFill = '#ff007f';
      glowFilter = 'filter="url(#aura-glow)"';
    } else if (rarity === 'chaos') {
      bladeFill = '#212121';
      edgeFill = '#e040fb';
      hiltFill = '#4a148c';
      guardFill = '#ffd600';
      glowFilter = 'filter="url(#raiden-glow)"';
    } else if (rarity === 'mythic') {
      bladeFill = '#d50000';
      edgeFill = '#ff6d00';
      hiltFill = '#3e2723';
      guardFill = '#ffd600';
      glowFilter = 'filter="url(#fire-grad)"';
    } else if (rarity === 'legendary') {
      bladeFill = '#ffd600';
      edgeFill = '#ffffff';
      hiltFill = '#e65100';
      guardFill = '#ffab00';
      glowFilter = 'filter="url(#sword-glow)"';
    } else if (rarity === 'epic') {
      bladeFill = '#8e24aa';
      edgeFill = '#e1bee7';
      hiltFill = '#311b92';
      guardFill = '#ba68c8';
      glowFilter = 'filter="url(#sword-glow)"';
    } else if (rarity === 'rare') {
      bladeFill = '#0288d1';
      edgeFill = '#e1f5fe';
      hiltFill = '#01579b';
      guardFill = '#4fc3f7';
      glowFilter = 'filter="url(#sword-glow)"';
    }

    let enhanceAura = '';
    if (enhance >= 80) {
      enhanceAura = `<circle cx="1" cy="-4" r="14" fill="none" stroke="#00ffff" stroke-width="1.5" opacity="0.8" class="spin-aura"/><circle cx="1" cy="-4" r="8" fill="none" stroke="#ff007f" stroke-width="1" opacity="0.6"/>`;
    } else if (enhance >= 50) {
      enhanceAura = `<circle cx="1" cy="-4" r="11" fill="none" stroke="#ff9100" stroke-width="1.5" opacity="0.75" class="pulse-aura"/>`;
    } else if (enhance >= 20) {
      enhanceAura = `<circle cx="1" cy="-4" r="8" fill="none" stroke="#00e5ff" stroke-width="1.2" opacity="0.6"/>`;
    } else if (enhance >= 10) {
      enhanceAura = `<circle cx="1" cy="-4" r="6" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.5"/>`;
    }

    return `
      <g class="equipped-weapon-sprite" transform="translate(${tx}, ${ty}) rotate(${rot}) scale(${scale})" ${glowFilter}>
        ${enhanceAura}
        <rect x="0" y="7" width="2" height="5" fill="${hiltFill}" />
        <circle cx="1" cy="12" r="1.5" fill="${guardFill}" />
        <rect x="-3" y="6" width="8" height="2" fill="${guardFill}" rx="0.5" />
        <rect x="0" y="-12" width="2" height="18" fill="${bladeFill}" />
        <rect x="1" y="-14" width="1" height="20" fill="${edgeFill}" />
        <polygon points="0,-12 1,-16 2,-12" fill="${edgeFill}" />
      </g>
    `;
  },

  // ============================================================
  // 7 DISTINCT AUTHENTIC VECTOR PIXEL HEROES & AURAS
  // ============================================================
  _getHeroStarterSvg(action) {
    const isAtk = action === 'attack';
    const isHit = action === 'hit';
    const isWalk = action === 'walk';
    const isSheathe = action === 'sheathe' || action === 'pose';
    const swordRot = isAtk ? 75 : isHit ? -25 : isSheathe ? -18 : 12;
    const swordTx = isAtk ? 34 : isSheathe ? 23 : 28;
    const swordTy = isAtk ? 28 : isSheathe ? 32 : 22;
    return `
    <svg class="pixel-sprite hero-pixel-svg hero-starter action-${action}" viewBox="0 0 54 54" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="st-glow"><feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#ffd700" flood-opacity="0.8"/></filter>
      </defs>
      <!-- Shadow -->
      <ellipse cx="27" cy="50" rx="14" ry="4" fill="rgba(0,0,0,0.35)"/>
      <!-- Trainee Red Cape -->
      <path d="M 19,25 Q ${14 - (isWalk ? 4 : 0)},38 ${16 - (isWalk ? 6 : 0)},47 Q 26,45 27,47 Q 28,38 27,25 Z" fill="#c62828"/>
      <!-- Legs & Steel Greaves -->
      <rect x="21" y="38" width="4" height="10" fill="#37474f"/>
      <rect x="27" y="38" width="4" height="10" fill="#37474f"/>
      <rect x="20" y="44" width="5" height="5" fill="#78909c"/>
      <rect x="27" y="44" width="5" height="5" fill="#78909c"/>
      <!-- Steel Breastplate -->
      <rect x="20" y="24" width="12" height="15" rx="1" fill="#90a4ae"/>
      <rect x="22" y="26" width="8" height="11" fill="#546e7a"/>
      <rect x="24" y="28" width="4" height="7" fill="#cfd8dc"/>
      <rect x="20" y="36" width="12" height="3" fill="#5d4037"/>
      <!-- Steel Helm & Blue Slit Eyes -->
      <rect x="20" y="11" width="12" height="13" rx="2" fill="#78909c"/>
      <rect x="22" y="9" width="8" height="3" fill="#b0bec5"/>
      <rect x="25" y="6" width="2" height="4" fill="#ffd700"/>
      <rect x="21" y="16" width="10" height="3" fill="#1e293b"/>
      <rect class="pixel-eye" x="23" y="16.5" width="2.5" height="2" fill="#00e5ff"/>
      <rect class="pixel-eye" x="27" y="16.5" width="2.5" height="2" fill="#00e5ff"/>
      <!-- Iron Heater Shield on Left Arm -->
      <g transform="translate(14, 24)">
        <polygon points="0,0 8,0 7,12 4,16 1,12" fill="#455a64" stroke="#b0bec5" stroke-width="1"/>
        <polygon points="2,2 6,2 5,10 4,13 3,10" fill="#78909c"/>
        <rect x="3.5" y="4" width="1" height="6" fill="#ffd700"/>
      </g>
      <!-- Steel Sword on Right Arm -->
      <g transform="translate(${swordTx}, ${swordTy}) rotate(${swordRot})">
        <rect x="-1" y="5" width="2" height="5" fill="#5d4037"/>
        <rect x="-3.5" y="4" width="7" height="1.8" fill="#ffd700" rx="0.5"/>
        <polygon points="-1.5,4 1.5,4 1,-16 0,-18 -1,-16" fill="#cfd8dc" stroke="#ffffff" stroke-width="0.5"/>
        <line x1="0" y1="3" x2="0" y2="-15" stroke="#78909c" stroke-width="0.6"/>
      </g>
    </svg>`;
  },

  _getHeroShadowRogueSvg(action) {
    const isAtk = action === 'attack';
    const isHit = action === 'hit';
    const isWalk = action === 'walk';
    const isSheathe = action === 'sheathe' || action === 'pose';
    const d1Rot = isAtk ? 85 : isSheathe ? -45 : 20;
    const d2Rot = isAtk ? -75 : isSheathe ? 45 : -140; // Reverse grip / Sheathe!
    return `
    <svg class="pixel-sprite hero-pixel-svg hero-shadow_rogue action-${action}" viewBox="0 0 54 54" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="rg-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#00e5ff" flood-opacity="0.95"/></filter>
      </defs>
      <!-- Shadow & Cyan Ground Wisps -->
      <ellipse cx="27" cy="50" rx="14" ry="4" fill="rgba(0,0,0,0.4)"/>
      <path d="M 12,49 Q 20,46 27,51 Q 38,47 44,50" stroke="#00e5ff" stroke-width="1.2" fill="none" opacity="0.6" class="spin-aura"/>
      <!-- Fluttering Midnight Cloak -->
      <path d="M 18,22 Q ${10 - (isWalk ? 8 : 0)},36 ${12 - (isWalk ? 10 : 0)},48 Q 22,46 27,48 Q 32,46 ${38 + (isWalk ? 10 : 0)},48 Q ${40 + (isWalk ? 8 : 0)},36 32,22 Z" fill="#090d16" stroke="#0f172a" stroke-width="1"/>
      <!-- Legs in Dark Tabi Ninja Wraps -->
      <rect x="21" y="38" width="4" height="10" fill="#020617"/>
      <rect x="27" y="38" width="4" height="10" fill="#020617"/>
      <rect x="20" y="44" width="5" height="5" fill="#0f172a"/>
      <rect x="27" y="44" width="5" height="5" fill="#0f172a"/>
      <!-- Shinobi Vest with Throwing Kunai Strapped -->
      <rect x="20" y="23" width="12" height="15" fill="#1e293b" rx="1"/>
      <rect x="22" y="25" width="8" height="11" fill="#0f172a"/>
      <line x1="21" y1="26" x2="31" y2="34" stroke="#00e5ff" stroke-width="1.2" opacity="0.8"/>
      <!-- Midnight Cowl / Hood & Cyan Glowing Eyes -->
      <polygon points="18,22 34,22 32,10 27,7 20,10" fill="#0f172a"/>
      <rect x="21" y="13" width="10" height="7" fill="#020617"/>
      <rect class="pixel-eye" x="22" y="15" width="3" height="2" fill="#00e5ff" filter="url(#rg-glow)"/>
      <rect class="pixel-eye" x="27" y="15" width="3" height="2" fill="#00e5ff" filter="url(#rg-glow)"/>
      <line x1="22" y1="14" x2="17" y2="12" stroke="#00e5ff" stroke-width="0.8" opacity="0.8"/>
      <line x1="30" y1="14" x2="35" y2="12" stroke="#00e5ff" stroke-width="0.8" opacity="0.8"/>
      <!-- Dual Glowing Cyan Poison Daggers (Right + Left Reverse-Grip) -->
      <g transform="translate(${isAtk ? 34 : 29}, ${isAtk ? 26 : 22}) rotate(${d1Rot})">
        <rect x="-1" y="2" width="2" height="4" fill="#1e293b"/>
        <rect x="-2.5" y="1.5" width="5" height="1" fill="#00e5ff"/>
        <polygon points="-1,1.5 1,1.5 1.5,-10 0,-13 -1.5,-10" fill="#38bdf8" stroke="#ffffff" stroke-width="0.5" filter="url(#rg-glow)"/>
      </g>
      <g transform="translate(18, ${isAtk ? 24 : 26}) rotate(${d2Rot})">
        <rect x="-1" y="2" width="2" height="4" fill="#1e293b"/>
        <rect x="-2.5" y="1.5" width="5" height="1" fill="#00e5ff"/>
        <polygon points="-1,1.5 1,1.5 1.5,-10 0,-13 -1.5,-10" fill="#00e5ff" stroke="#ffffff" stroke-width="0.5" filter="url(#rg-glow)"/>
      </g>
    </svg>`;
  },

  _getHeroFrostKnightSvg(action) {
    const isAtk = action === 'attack';
    const isHit = action === 'hit';
    const isSheathe = action === 'sheathe' || action === 'pose';
    const swordRot = isAtk ? 70 : isSheathe ? 175 : 15;
    const swordTx = isAtk ? 35 : isSheathe ? 25 : 29;
    const swordTy = isAtk ? 26 : isSheathe ? 32 : 20;
    return `
    <svg class="pixel-sprite hero-pixel-svg hero-frost_knight action-${action}" viewBox="0 0 54 54" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="fk-glow"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#80d8ff" flood-opacity="1"/></filter>
      </defs>
      <!-- Shadow & Freezing Ground Frost Ring -->
      <ellipse cx="27" cy="50" rx="15" ry="4" fill="rgba(0,0,0,0.45)"/>
      <ellipse cx="27" cy="50" rx="18" ry="4.5" fill="none" stroke="#80d8ff" stroke-width="1.2" stroke-dasharray="4,3" class="spin-aura"/>
      <!-- Orbiting Snowflake Crystals -->
      <g class="spin-aura" style="transform-origin: 27px 27px;">
        <polygon points="6,27 8,25 10,27 8,29" fill="#e0f7fa" filter="url(#fk-glow)"/>
        <polygon points="46,25 48,23 50,25 48,27" fill="#80d8ff" filter="url(#fk-glow)"/>
      </g>
      <!-- Heavy Frosted Cape -->
      <path d="M 17,23 Q 11,36 13,48 Q 27,45 37,48 Q 39,36 33,23 Z" fill="#01579b" stroke="#0288d1" stroke-width="1"/>
      <rect x="18" y="21" width="16" height="4" rx="2" fill="#e0f7fa"/>
      <!-- Spiked Ice Greaves & Boots -->
      <rect x="20" y="38" width="5" height="10" fill="#01579b"/>
      <rect x="27" y="38" width="5" height="10" fill="#01579b"/>
      <polygon points="19,45 25,45 25,48 20,48 18,46" fill="#80d8ff"/>
      <polygon points="27,45 33,45 34,46 32,48 27,48" fill="#80d8ff"/>
      <!-- Glacial Plate Armor & Glowing Frost Runes -->
      <rect x="19" y="23" width="14" height="15" fill="#0288d1" rx="1"/>
      <polygon points="21,25 31,25 29,36 23,36" fill="#03a9f4"/>
      <polygon points="26,26 27,25 28,26 27,33" fill="#ffffff" filter="url(#fk-glow)"/>
      <!-- Frosted Winged Pauldrons -->
      <polygon points="14,21 19,20 18,28 13,24" fill="#80d8ff" stroke="#ffffff" stroke-width="0.5"/>
      <polygon points="38,21 33,20 34,28 39,24" fill="#80d8ff" stroke="#ffffff" stroke-width="0.5"/>
      <!-- Crystal Crown Helm with Cyan Visor -->
      <polygon points="18,15 20,8 24,11 27,5 30,11 34,8 36,15 34,22 20,22" fill="#01579b" stroke="#80d8ff" stroke-width="0.8"/>
      <rect class="pixel-eye" x="22" y="15" width="10" height="3" rx="1" fill="#00e5ff" filter="url(#fk-glow)"/>
      <rect x="25" y="15.5" width="4" height="2" fill="#ffffff"/>
      <!-- Giant Two-Handed Frostmourne Greatsword -->
      <g transform="translate(${swordTx}, ${swordTy}) rotate(${swordRot})">
        <rect x="-1" y="6" width="2" height="7" fill="#01579b"/>
        <rect x="-4.5" y="5" width="9" height="2" fill="#80d8ff" rx="0.5"/>
        <polygon points="-2.5,5 2.5,5 2,-20 0,-24 -2,-20" fill="#80d8ff" stroke="#ffffff" stroke-width="0.8" filter="url(#fk-glow)"/>
        <line x1="0" y1="4" x2="0" y2="-19" stroke="#ffffff" stroke-width="0.8"/>
      </g>
    </svg>`;
  },

  _getHeroSpearLancerSvg(action) {
    const isAtk = action === 'attack';
    const isHit = action === 'hit';
    const isSheathe = action === 'sheathe' || action === 'pose';
    const spearRot = isAtk ? 75 : isSheathe ? 0 : 25;
    const spearTx = isAtk ? 36 : isSheathe ? 22 : 30;
    const spearTy = isAtk ? 26 : isSheathe ? 24 : 22;
    return `
    <svg class="pixel-sprite hero-pixel-svg hero-spear_lancer action-${action}" viewBox="0 0 54 54" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="sl-glow"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ffd700" flood-opacity="1"/></filter>
      </defs>
      <!-- Shadow -->
      <ellipse cx="27" cy="50" rx="15" ry="4" fill="rgba(0,0,0,0.45)"/>
      <!-- Spinning Golden Lightning Ring behind back with 4 Tomoe -->
      <g class="spin-aura" style="transform-origin: 27px 25px;">
        <circle cx="27" cy="25" r="16" fill="none" stroke="#ffd700" stroke-width="1.8" stroke-dasharray="6,4" opacity="0.85"/>
        <circle cx="27" cy="9" r="2.2" fill="#ff6f00" stroke="#ffd700" stroke-width="0.8"/>
        <circle cx="43" cy="25" r="2.2" fill="#ff6f00" stroke="#ffd700" stroke-width="0.8"/>
        <circle cx="27" cy="41" r="2.2" fill="#ff6f00" stroke="#ffd700" stroke-width="0.8"/>
        <circle cx="11" cy="25" r="2.2" fill="#ff6f00" stroke="#ffd700" stroke-width="0.8"/>
      </g>
      <!-- Imperial Crimson & Gold Cape -->
      <path d="M 18,22 Q 10,36 12,48 Q 27,45 38,48 Q 40,36 32,22 Z" fill="#b71c1c" stroke="#ffd700" stroke-width="1"/>
      <!-- Dragon Scale Greaves -->
      <rect x="20" y="38" width="5" height="10" fill="#4e342e"/>
      <rect x="27" y="38" width="5" height="10" fill="#4e342e"/>
      <rect x="19" y="43" width="6" height="5" fill="#ffd700"/>
      <rect x="27" y="43" width="6" height="5" fill="#ffd700"/>
      <!-- Imperial Golden Dragon Armor -->
      <rect x="19" y="23" width="14" height="15" fill="#ffd700" rx="1" filter="url(#sl-glow)"/>
      <polygon points="21,25 31,25 29,36 23,36" fill="#ff8f00"/>
      <polygon points="24,27 28,27 27,33 25,33" fill="#b71c1c"/>
      <!-- Dragon Crest Horn Helm -->
      <polygon points="19,16 16,8 21,11 27,6 31,11 36,8 33,16 32,22 20,22" fill="#ffb300" stroke="#ffd700" stroke-width="1"/>
      <rect x="21" y="14" width="10" height="4" fill="#212121"/>
      <rect class="pixel-eye" x="22" y="15" width="3" height="2" fill="#ffd700" filter="url(#sl-glow)"/>
      <rect class="pixel-eye" x="27" y="15" width="3" height="2" fill="#ffd700" filter="url(#sl-glow)"/>
      <!-- Magnificent Golden Long Thương (Dragon Spear) -->
      <g transform="translate(${spearTx}, ${spearTy}) rotate(${spearRot})">
        <rect x="-0.8" y="-12" width="1.6" height="34" fill="#ffd700" stroke="#ff8f00" stroke-width="0.4"/>
        <polygon points="-2,-12 2,-12 0,-15" fill="#b71c1c"/>
        <polygon points="-2.5,-15 2.5,-15 1.5,-26 0,-29 -1.5,-26" fill="#ffd700" stroke="#ffffff" stroke-width="0.8" filter="url(#sl-glow)"/>
        <line x1="0" y1="-14" x2="0" y2="-27" stroke="#ffffff" stroke-width="0.8"/>
      </g>
    </svg>`;
  },

  _getHeroFlameKnightSvg(action) {
    const isAtk = action === 'attack';
    const isSheathe = action === 'sheathe' || action === 'pose';
    const swordRot = isAtk ? 75 : isSheathe ? -40 : 18;
    const swordTx = isAtk ? 35 : isSheathe ? 22 : 29;
    const swordTy = isAtk ? 26 : isSheathe ? 18 : 20;
    return `
    <svg class="pixel-sprite hero-pixel-svg hero-flame_knight action-${action}" viewBox="0 0 54 54" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="fl-glow"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ff3d00" flood-opacity="1"/></filter>
      </defs>
      <!-- Shadow & Heat Distortion Ring -->
      <ellipse cx="27" cy="50" rx="15" ry="4" fill="rgba(0,0,0,0.5)"/>
      <ellipse cx="27" cy="50" rx="17" ry="4" fill="none" stroke="#ff3d00" stroke-width="1.5" stroke-dasharray="5,3" class="spin-aura"/>
      <!-- TWO GIANT ANIMATED FLAMING PHOENIX WINGS -->
      <g class="pulse-aura" style="transform-origin: 27px 24px;">
        <path d="M 18,26 Q 2,12 5,4 Q 16,10 17,20 Z" fill="#d50000" filter="url(#fl-glow)"/>
        <path d="M 17,24 Q 6,13 8,7 Q 15,12 16,19 Z" fill="#ff3d00"/>
        <path d="M 16,22 Q 9,14 10,9 Q 14,13 15,18 Z" fill="#ffd600"/>
        <path d="M 34,26 Q 50,12 47,4 Q 36,10 35,20 Z" fill="#d50000" filter="url(#fl-glow)"/>
        <path d="M 35,24 Q 46,13 44,7 Q 37,12 36,19 Z" fill="#ff3d00"/>
        <path d="M 36,22 Q 43,14 42,9 Q 38,13 37,18 Z" fill="#ffd600"/>
      </g>
      <!-- Volcanic Magma Greaves -->
      <rect x="20" y="38" width="5" height="10" fill="#1b0000"/>
      <rect x="27" y="38" width="5" height="10" fill="#1b0000"/>
      <polygon points="19,44 25,44 25,48 19,48" fill="#d50000"/>
      <polygon points="27,44 33,44 33,48 27,48" fill="#d50000"/>
      <!-- Volcanic Magma Plate Armor with Glowing Veins -->
      <rect x="19" y="23" width="14" height="15" fill="#212121" rx="1" stroke="#d50000" stroke-width="1"/>
      <polygon points="21,25 31,25 29,36 23,36" fill="#b71c1c"/>
      <path d="M 23,27 L 27,33 L 29,26" stroke="#ffd600" stroke-width="1.2" fill="none" filter="url(#fl-glow)"/>
      <!-- Horned Battle Helm with Blazing Horns -->
      <polygon points="18,17 15,6 20,11 27,8 32,11 37,6 34,17 32,22 20,22" fill="#1b0000" stroke="#d50000" stroke-width="1"/>
      <polygon points="15,6 17,2 20,8" fill="#ffd600" filter="url(#fl-glow)"/>
      <polygon points="37,6 35,2 32,8" fill="#ffd600" filter="url(#fl-glow)"/>
      <rect class="pixel-eye" x="22" y="15" width="3" height="2" fill="#ff3d00" filter="url(#fl-glow)"/>
      <rect class="pixel-eye" x="27" y="15" width="3" height="2" fill="#ff3d00" filter="url(#fl-glow)"/>
      <!-- Colossal Solar Greatsword Engulfed in Fire -->
      <g transform="translate(${swordTx}, ${swordTy}) rotate(${swordRot})">
        <rect x="-1" y="6" width="2" height="7" fill="#1b0000"/>
        <rect x="-5" y="5" width="10" height="2" fill="#ff3d00" rx="0.5"/>
        <polygon points="-3,5 3,5 2.5,-22 0,-26 -2.5,-22" fill="#d50000" stroke="#ffd600" stroke-width="1" filter="url(#fl-glow)"/>
        <line x1="0" y1="4" x2="0" y2="-23" stroke="#ffd600" stroke-width="1.2"/>
        <polygon points="-3,-5 0,-15 3,-8" fill="#ffd600" opacity="0.8"/>
      </g>
    </svg>`;
  },

  _getHeroArcaneMageSvg(action) {
    const isAtk = action === 'attack';
    return `
    <svg class="pixel-sprite hero-pixel-svg hero-arcane_mage action-${action}" viewBox="0 0 54 54" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="am-glow"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#d500f9" flood-opacity="1"/></filter>
      </defs>
      <!-- Shadow on Ground (Small because levitating!) -->
      <ellipse cx="27" cy="51" rx="10" ry="3" fill="rgba(0,0,0,0.3)"/>
      <!-- Levitating Entire Character Body in Mid-Air! -->
      <g class="pulse-aura" style="transform-origin: 27px 22px;">
        <!-- Pulsating Void Singularity Event Horizon Ring -->
        <circle cx="27" cy="24" r="19" fill="none" stroke="#d500f9" stroke-width="1.8" stroke-dasharray="5,5" class="spin-aura"/>
        <!-- Orbiting Twin Dark Matter Spheres with Cyan Electric Arcs -->
        <g class="spin-aura" style="transform-origin: 27px 24px;">
          <circle cx="9" cy="24" r="3.2" fill="#120522" stroke="#00e5ff" stroke-width="1" filter="url(#am-glow)"/>
          <circle cx="45" cy="24" r="3.2" fill="#120522" stroke="#d500f9" stroke-width="1" filter="url(#am-glow)"/>
          <line x1="9" y1="24" x2="16" y2="22" stroke="#00e5ff" stroke-width="0.8" opacity="0.8"/>
          <line x1="45" y1="24" x2="38" y2="22" stroke="#d500f9" stroke-width="0.8" opacity="0.8"/>
        </g>
        <!-- Flowing Celestial Starry Robes with Magenta Runes -->
        <path d="M 18,22 Q 12,34 13,44 Q 27,47 40,44 Q 41,34 34,22 Z" fill="#120522" stroke="#4a148c" stroke-width="1"/>
        <path d="M 21,24 L 27,42 L 32,24" stroke="#d500f9" stroke-width="1.2" fill="none" filter="url(#am-glow)"/>
        <!-- Mystic Archmage Cowl & Silver Star Hair -->
        <path d="M 16,14 Q 13,24 16,30" stroke="#cfd8dc" stroke-width="2" fill="none"/>
        <path d="M 36,14 Q 39,24 36,30" stroke="#cfd8dc" stroke-width="2" fill="none"/>
        <polygon points="18,18 34,18 32,7 27,3 20,7" fill="#311b92" stroke="#d500f9" stroke-width="1"/>
        <rect x="21" y="11" width="10" height="7" fill="#120522"/>
        <rect class="pixel-eye" x="22" y="13" width="2.5" height="2" fill="#d500f9" filter="url(#am-glow)"/>
        <rect class="pixel-eye" x="27" y="13" width="2.5" height="2" fill="#d500f9" filter="url(#am-glow)"/>
        <!-- Third Eye on Forehead -->
        <circle cx="26" cy="9.5" r="1.2" fill="#00e5ff" filter="url(#am-glow)"/>
        <!-- Floating Open Ancient Grimoire of the Abyss -->
        <g transform="translate(${isAtk ? 34 : 32}, ${isAtk ? 18 : 22}) rotate(${isAtk ? -15 : 12})">
          <polygon points="0,0 8,-3 8,8 0,11" fill="#4a148c" stroke="#ffd700" stroke-width="0.5"/>
          <polygon points="0,0 -8,-3 -8,8 0,11" fill="#4a148c" stroke="#ffd700" stroke-width="0.5"/>
          <polygon points="0,1 6,-2 6,7 0,9.5" fill="#f5f5f5"/>
          <polygon points="0,1 -6,-2 -6,7 0,9.5" fill="#f5f5f5"/>
          <line x1="1" y1="3" x2="5" y2="1" stroke="#d500f9" stroke-width="0.8"/>
          <line x1="-1" y1="3" x2="-5" y2="1" stroke="#00e5ff" stroke-width="0.8"/>
        </g>
      </g>
    </svg>`;
  },

  _getHeroUnknownGodSvg(action) {
    const isAtk = action === 'attack';
    const isHit = action === 'hit';
    const isWalk = action === 'walk';
    const isSheathe = action === 'sheathe' || action === 'pose';
    
    // Dynamic offsets & rotations based on combat action
    const bodyTx = isAtk ? 5 : isHit ? -4 : 0;
    const bodyTy = isSheathe ? 3 : isAtk ? 2 : 0;
    const swordRot = isSheathe ? -42 : isAtk ? 75 : isHit ? -15 : 18;
    const swordTx = isSheathe ? 24 : isAtk ? 42 : isHit ? 30 : 40;
    const swordTy = isSheathe ? 36 : isAtk ? 26 : isHit ? 28 : 34;
    const hairSway = isWalk ? -5 : isAtk ? -8 : 0;

    return `
    <svg class="pixel-sprite hero-pixel-svg hero-unknown_god action-${action}" viewBox="0 0 64 64" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="ug-glow"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ff0055" flood-opacity="1"/></filter>
        <filter id="ug-blade-glow"><feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="#ff1744" flood-opacity="1"/></filter>
        <linearGradient id="ug-blade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="30%" stop-color="#ff1744"/>
          <stop offset="100%" stop-color="#88001b"/>
        </linearGradient>
        <linearGradient id="ug-tassel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff1744"/>
          <stop offset="100%" stop-color="#be123c"/>
        </linearGradient>
      </defs>

      <!-- Ground Shadow & Drifting Blood Sakura Petals -->
      <ellipse cx="32" cy="59" rx="15" ry="4" fill="rgba(0,0,0,0.45)"/>
      <ellipse cx="32" cy="59" rx="18" ry="4.5" fill="none" stroke="rgba(255,0,85,0.3)" stroke-width="1" stroke-dasharray="4,3" class="spin-aura"/>
      <!-- Drifting Sakura Petals -->
      <polygon points="14,56 16,54 18,56 16,58" fill="#ff4d6d" opacity="0.8"/>
      <polygon points="48,53 50,51 52,53 50,55" fill="#fda4af" opacity="0.7"/>
      <polygon points="44,38 46,36 47,38 45,40" fill="#ff4d6d" opacity="0.85"/>
      <polygon points="12,28 14,26 15,28 13,30" fill="#fda4af" opacity="0.75"/>

      <g transform="translate(${bodyTx}, ${bodyTy})">
        <!-- Ponytail Flowing Behind (High Ponytail + Crimson Ribbon Tassel) -->
        <path d="M 26,14 Q ${16 + hairSway},18 ${10 + hairSway},26 Q ${8 + hairSway},36 ${12 + hairSway},42 Q ${15 + hairSway},36 ${18 + hairSway},28 Q 23,22 28,16 Z" fill="#0d0c14" stroke="#1c1926" stroke-width="1"/>
        <!-- Crimson Ribbon Knot & Dangling Tassels -->
        <circle cx="27" cy="14" r="2.5" fill="#e11d48"/>
        <path d="M 27,15 Q ${23 + hairSway * 0.5},22 ${21 + hairSway},30" stroke="url(#ug-tassel)" stroke-width="1.5" fill="none"/>
        <polygon points="${20 + hairSway},29 ${23 + hairSway},29 ${22 + hairSway},34 ${20 + hairSway},34" fill="#e11d48"/>
        <path d="M 28,15 Q ${30 + hairSway * 0.4},21 ${31 + hairSway * 0.8},28" stroke="url(#ug-tassel)" stroke-width="1.2" fill="none"/>
        <polygon points="${30 + hairSway * 0.8},27 ${32 + hairSway * 0.8},27 ${32 + hairSway * 0.8},32 ${30 + hairSway * 0.8},32" fill="#e11d48"/>

        <!-- Flowing Haori / Coat Tails Behind with Dual White Silk Linings -->
        <path d="M 24,32 Q ${16 + (isWalk ? -6 : 0)},42 ${18 + (isWalk ? -8 : 0)},56 Q 26,53 32,55 Q 38,53 44,56 Q 46,42 38,32 Z" fill="#0f0d16" stroke="#1f1b2b" stroke-width="1"/>
        <path d="M 18,56 Q 22,50 24,42" stroke="#f8fafc" stroke-width="1.2" fill="none" opacity="0.85"/>
        <path d="M 44,56 Q 40,50 38,42" stroke="#f8fafc" stroke-width="1.2" fill="none" opacity="0.85"/>

        <!-- Legs & Ninja Tabi Wraps -->
        <rect x="26" y="45" width="4" height="12" fill="#121018"/>
        <rect x="33" y="45" width="4" height="12" fill="#121018"/>
        <!-- Shinobi Boots with Crimson Accent Ties -->
        <rect x="25" y="53" width="5" height="5" fill="#09080e" rx="1"/>
        <rect x="33" y="53" width="5" height="5" fill="#09080e" rx="1"/>
        <line x1="25" y1="52" x2="30" y2="52" stroke="#e11d48" stroke-width="1"/>
        <line x1="33" y1="52" x2="38" y2="52" stroke="#e11d48" stroke-width="1"/>

        <!-- Right Thigh Tactical Holster with Buckle -->
        <rect x="34" y="46" width="3.5" height="4.5" fill="#0a0810" rx="0.8" stroke="#2a2438" stroke-width="0.6"/>
        <line x1="32" y1="47" x2="38" y2="47" stroke="#e11d48" stroke-width="1"/>
        <rect x="34.5" y="46.5" width="1.5" height="1.5" fill="#ffd700"/>

        <!-- Tactical Shinobi Bodysuit & Crimson Chest Harness -->
        <path d="M 25,27 L 38,27 L 36,44 L 27,44 Z" fill="#14111d" stroke="#241f33" stroke-width="1"/>
        <!-- Crimson Tactical Harness Straps with Gold Buckles -->
        <line x1="26" y1="30" x2="37" y2="30" stroke="#e11d48" stroke-width="1.4"/>
        <line x1="26" y1="36" x2="37" y2="36" stroke="#e11d48" stroke-width="1.4"/>
        <line x1="30" y1="27" x2="28" y2="44" stroke="#be123c" stroke-width="1.2"/>
        <line x1="33" y1="27" x2="35" y2="44" stroke="#be123c" stroke-width="1.2"/>
        <rect x="30.5" y="29" width="2" height="2" fill="#ffd700" rx="0.4"/>
        <rect x="30.5" y="35" width="2" height="2" fill="#ffd700" rx="0.4"/>
        <!-- Silver Hip Floral Sakura Pin -->
        <circle cx="26" cy="43" r="1.5" fill="#ffffff" stroke="#ffd700" stroke-width="0.5"/>

        <!-- Twin Katana Sayas (Crossed Dual Scabbards matching anime cutscene) -->
        <g transform="translate(20, 39) rotate(42)">
          <rect x="-1.8" y="0" width="3.6" height="16" fill="#14111d" stroke="#241f33" stroke-width="0.5" rx="0.6"/>
          <rect x="-1.8" y="13" width="3.6" height="2.5" fill="#ffd700" rx="0.4"/>
          <circle cx="0" cy="5" r="0.8" fill="#ffffff"/>
        </g>
        <g transform="translate(22, 38) rotate(32)">
          <rect x="-2" y="0" width="4" height="18" fill="#0c0a12" stroke="#241f33" stroke-width="0.6" rx="0.8"/>
          <rect x="-2" y="15" width="4" height="3" fill="#ffd700" rx="0.5"/>
          <rect x="-2" y="1" width="4" height="2" fill="#ffd700" rx="0.5"/>
          <circle cx="0" cy="6" r="1" fill="#ffffff"/>
          <circle cx="0" cy="10" r="0.8" fill="#ffffff"/>
          <!-- Sageo Hanging Cord -->
          <path d="M 1,4 Q 4,8 3,14" stroke="#e11d48" stroke-width="0.9" fill="none"/>
        </g>

        <!-- Neck Choker & Fair Skin -->
        <rect x="29" y="24" width="5" height="4" fill="#ffe8d6"/>
        <rect x="28.5" y="25" width="6" height="1.5" fill="#0c0a12" stroke="#e11d48" stroke-width="0.5"/>

        <!-- Head: Face & Cheek Blush -->
        <rect x="26" y="13" width="12" height="12" fill="#fff0e6" rx="2"/>
        <rect x="27" y="19" width="3" height="1.5" fill="rgba(255,100,130,0.35)" rx="0.5"/>
        <rect x="34" y="19" width="3" height="1.5" fill="rgba(255,100,130,0.35)" rx="0.5"/>

        <!-- Glowing Ruby Piercing Anime Slit Eyes & Crimson Eye Trail -->
        <g class="ug-eye-flare">
          <rect class="pixel-eye" x="28" y="16" width="3" height="2.5" rx="0.6" fill="#ff0055" filter="url(#ug-glow)"/>
          <rect x="29" y="16.5" width="1" height="1.5" fill="#ffffff"/>
          <rect class="pixel-eye" x="33" y="16" width="3" height="2.5" rx="0.6" fill="#ff0055" filter="url(#ug-glow)"/>
          <rect x="34" y="16.5" width="1" height="1.5" fill="#ffffff"/>
          <polygon points="35,17 43,15.5 38,18 41,19" fill="#ff0055" opacity="0.85" filter="url(#ug-glow)"/>
          <line x1="34" y1="17.2" x2="44" y2="15.8" stroke="#ffffff" stroke-width="0.8" opacity="0.9"/>
        </g>

        <!-- Hair: Sleek Raven Hime Bangs with Specular Shine -->
        <polygon points="25,13 39,13 38,10 32,8 26,10" fill="#0d0c14"/>
        <path d="M 27,11 Q 32,9 37,11" stroke="rgba(255,255,255,0.45)" stroke-width="0.9" fill="none"/>
        <rect x="25" y="13" width="3" height="11" fill="#0d0c14"/>
        <rect x="36" y="13" width="3" height="11" fill="#0d0c14"/>
        <polygon points="27,13 31,13 30,16 28,15" fill="#171422"/>
        <polygon points="33,13 37,13 35,16 34,15" fill="#171422"/>

        <!-- Attack Slash Flare Trail (When Attacking) -->
        ${isAtk ? `
        <path d="M 28,15 Q 56,8 63,32 Q 58,38 42,24 Z" fill="url(#ug-blade)" opacity="0.75" filter="url(#ug-blade-glow)"/>
        ` : ''}

        <!-- Drawn Primary Katana -->
        <g transform="translate(${swordTx}, ${swordTy}) rotate(${swordRot})">
          <rect x="-1" y="4" width="2.5" height="8" fill="#0c0a12" stroke="#ffd700" stroke-width="0.5" rx="0.4"/>
          <path d="M 0,12 Q 3,17 2,22" stroke="#e11d48" stroke-width="1.2" fill="none"/>
          <polygon points="1,21 3,21 2,25" fill="#be123c"/>
          <ellipse cx="0.2" cy="4" rx="4.5" ry="1.8" fill="#ffd700" stroke="#b45309" stroke-width="0.5"/>
          <polygon points="-1,3.5 1.5,3.5 1,-24 0,-28 -0.8,-24" fill="url(#ug-blade)" stroke="#ffffff" stroke-width="0.7" filter="url(#ug-blade-glow)"/>
          <line x1="0.2" y1="3" x2="0.2" y2="-26" stroke="#ffffff" stroke-width="0.6"/>
          <!-- Katana Tip Glint Star -->
          <polygon points="0,-28 1,-27 0,-26 -1,-27" fill="#ffffff"/>
          <!-- Sheathe mouth glint star when clicking into scabbard -->
          ${isSheathe ? `
          <g transform="translate(0, 4)">
            <polygon points="0,-4 3,-1 6,0 3,1 0,4 -3,1 -6,0 -3,-1" fill="#ffd700" filter="url(#ug-blade-glow)"/>
            <circle cx="0" cy="0" r="2" fill="#ffffff"/>
          </g>
          ` : ''}
        </g>
      </g>
    </svg>`;
  },

  _getHeroCassiusSvg(action) {
    const isAtk = action === 'attack';
    const isSkill = action === 'skill';
    const isSheathe = action === 'sheathe' || action === 'pose' || action === 'burst';
    const isWalk = action === 'walk';
    const isHit = action === 'hit';
    const isShowcase = action === 'showcase' || action === 'model_3d';

    let imgSrc = 'assets/characters/cassius/chibi_idle.webp';
    let extraVfx = '';

    if (isShowcase) {
      imgSrc = 'assets/characters/cassius/model_3d_full.png';
      extraVfx = '';
    } else if (isAtk) {
      imgSrc = 'assets/characters/cassius/chibi_attack.webp';
      extraVfx = '';
    } else if (isSkill) {
      imgSrc = 'assets/characters/cassius/chibi_skill.webp';
      extraVfx = '';
    } else if (isSheathe) {
      imgSrc = 'assets/characters/cassius/chibi_sheathe.webp';
      extraVfx = '';
    } else if (isHit) {
      imgSrc = 'assets/characters/cassius/chibi_hit.webp';
      extraVfx = '';
    } else if (isWalk) {
      imgSrc = 'assets/characters/cassius/chibi_walk.webp';
      extraVfx = '';
    } else {
      // Default idle - clean and unobstructed chibi
      extraVfx = '';
    }

    return `
    <svg class="pixel-sprite hero-pixel-svg hero-cassius action-${action}" viewBox="0 0 100 100" width="100%" height="100%" overflow="visible">
      ${extraVfx}
      <!-- Authentic Character Visual (Chibi / 3D Model extracted from video) -->
      <image href="${imgSrc}" xlink:href="${imgSrc}" x="3" y="4" width="94" height="89" preserveAspectRatio="xMidYMax meet"/>
    </svg>`;
  },

  _getHeroAetherisSvg(action) {
    const isAtk = action === 'attack';
    const isHit = action === 'hit';
    const isWalk = action === 'walk';

    return `
    <svg class="pixel-sprite hero-pixel-svg hero-aetheris action-${action}" viewBox="0 0 64 64" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <!-- Prismatic Crystal Wing & Shard Gradients -->
        <linearGradient id="ae-prism-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00e5ff"/>
          <stop offset="35%" stop-color="#80d8ff"/>
          <stop offset="70%" stop-color="#d500f9"/>
          <stop offset="100%" stop-color="#ffd700"/>
        </linearGradient>
        <linearGradient id="ae-staff-gem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="45%" stop-color="#00e5ff"/>
          <stop offset="100%" stop-color="#0091ea"/>
        </linearGradient>
        <linearGradient id="ae-purple-shard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e040fb"/>
          <stop offset="100%" stop-color="#4a148c"/>
        </linearGradient>
        <!-- Glow Filters -->
        <filter id="ae-glow"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00e5ff" flood-opacity="1"/></filter>
        <filter id="ae-purp-glow"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#d500f9" flood-opacity="1"/></filter>
      </defs>

      <!-- Astral Ground Ripple -->
      <ellipse cx="28" cy="58" rx="14" ry="3" fill="rgba(0,229,255,0.35)"/>

      <g class="pulse-aura" style="transform-origin: 28px 28px;">
        <!-- 1. PRISMATIC CRYSTAL WINGS (Spread wide behind him, glowing softly) -->
        <g class="spin-slow" style="transform-origin: 28px 26px;">
          <!-- Left Crystal Wing Feathers -->
          <polygon points="18,22 4,6 8,16 1,14 6,24 12,32 18,28" fill="url(#ae-prism-wing)" filter="url(#ae-glow)" opacity="0.95"/>
          <line x1="18" y1="24" x2="6" y2="10" stroke="#ffffff" stroke-width="0.8"/>
          <!-- Right Crystal Wing Feathers -->
          <polygon points="38,22 52,6 48,16 55,14 50,24 44,32 38,28" fill="url(#ae-prism-wing)" filter="url(#ae-glow)" opacity="0.95"/>
          <line x1="38" y1="24" x2="50" y2="10" stroke="#ffffff" stroke-width="0.8"/>
        </g>

        <!-- 2. ORBITING ASTRAL CRYSTAL SHARDS (Floating & rotating runes) -->
        <g class="spin-aura" style="transform-origin: 28px 28px;">
          <polygon points="9,16 12,11 15,16 12,21" fill="url(#ae-purple-shard)" stroke="#ffffff" stroke-width="0.5" filter="url(#ae-purp-glow)"/>
          <polygon points="46,14 49,9 52,14 49,19" fill="url(#ae-staff-gem)" stroke="#ffffff" stroke-width="0.5" filter="url(#ae-glow)"/>
          <polygon points="6,36 9,31 12,36 9,41" fill="url(#ae-staff-gem)" stroke="#00e5ff" stroke-width="0.5" filter="url(#ae-glow)"/>
          <polygon points="48,38 51,33 54,38 51,43" fill="url(#ae-purple-shard)" stroke="#ffd700" stroke-width="0.5" filter="url(#ae-purp-glow)"/>
        </g>

        <!-- 3. DEEP NAVY / TEAL ASTRAL WIZARD ROBES -->
        <path d="M 18,26 Q 9,42 13,52 Q 28,55 43,52 Q 47,42 38,26 Z" fill="#1a237e" stroke="#ffd700" stroke-width="1.2"/>
        <path d="M 24,32 L 24,52 L 32,52 L 32,32 Z" fill="#0d47a1" opacity="0.75"/>
        <!-- Fluffy Pure White Snow Collar -->
        <ellipse cx="28" cy="27" rx="10" ry="4.5" fill="#f5f5f5" stroke="#cfd8dc" stroke-width="1"/>
        <!-- Golden Medallion Cross Belt -->
        <rect x="23" y="36" width="10" height="2.5" rx="0.5" fill="#ffd700"/>
        <polygon points="28,34 30,37 28,40 26,37" fill="#00e5ff" filter="url(#ae-glow)"/>

        <!-- 4. SILVER / PLATINUM HAIR FLOWING -->
        <path d="M 17,16 Q 13,24 15,31 Q 20,27 20,22 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="0.5"/>
        <path d="M 39,16 Q 43,24 41,31 Q 36,27 36,22 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="0.5"/>

        <!-- 5. WIZARD HEAD & LUMINESCENT CYAN EYES -->
        <rect x="20" y="15" width="16" height="11" fill="#ffe0b2" rx="2"/>
        <!-- Luminescent Star Eyes -->
        <rect class="pixel-eye" x="22.5" y="18.5" width="3" height="2.2" fill="#00e5ff" filter="url(#ae-glow)"/>
        <rect class="pixel-eye" x="30.5" y="18.5" width="3" height="2.2" fill="#00e5ff" filter="url(#ae-glow)"/>
        <circle cx="24" cy="19.5" r="0.7" fill="#ffffff"/>
        <circle cx="32" cy="19.5" r="0.7" fill="#ffffff"/>

        <!-- 6. WIDE-BRIMMED WIZARD HAT WITH GOLD MEDALLION -->
        <!-- Wide Dark Brim -->
        <ellipse cx="28" cy="17" rx="17" ry="4.5" fill="#0f172a" stroke="#311b92" stroke-width="1.2"/>
        <!-- Purple Silk Ribbon Band -->
        <rect x="18" y="11" width="20" height="4.5" fill="#4a148c"/>
        <!-- Curving Pointed Peak Cone -->
        <path d="M 18,12 Q 22,2 35,-2 Q 33,5 38,12 Z" fill="#1a237e" stroke="#283593" stroke-width="1"/>
        <!-- Golden Medallion Clasp with Cyan Gem -->
        <circle cx="28" cy="13" r="3" fill="#ffd700" stroke="#ff8f00" stroke-width="0.8"/>
        <circle cx="28" cy="13" r="1.3" fill="#00e5ff" filter="url(#ae-glow)"/>

        <!-- 7. GOLDEN AETHER STAFF -->
        ${!isAtk ? `
        <!-- Idle / Walk Stance: Staff held upright with floating gem -->
        <g transform="translate(13, 0)">
          <!-- Golden Staff Pole -->
          <rect x="30" y="8" width="2.4" height="46" rx="1" fill="#ffd700" stroke="#ff8f00" stroke-width="0.6"/>
          <!-- Ornate Gold Crown Setting -->
          <polygon points="26,8 36,8 34,0 28,0" fill="#ffd700" stroke="#ffb300" stroke-width="0.6"/>
          <!-- Giant Glowing Diamond Gem -->
          <polygon points="31,-6 36,2 31,10 26,2" fill="url(#ae-staff-gem)" stroke="#ffffff" stroke-width="0.9" filter="url(#ae-glow)"/>
          <!-- Floating Celestial Rune Ring -->
          <ellipse cx="31" cy="2" rx="7.5" ry="2.8" fill="none" stroke="#00e5ff" stroke-width="0.9" stroke-dasharray="3,2" opacity="0.9" filter="url(#ae-glow)"/>
        </g>
        ` : `
        <!-- Attack Stance: Staff thrust forward casting Portal & Piercing Crystal Beam! -->
        <g transform="translate(0, 0)">
          <!-- Horizontal Golden Staff -->
          <line x1="26" y1="29" x2="48" y2="29" stroke="#ffd700" stroke-width="2.8" stroke-linecap="round"/>
          <polygon points="47,26 53,29 47,32" fill="#ffd700"/>
          <!-- Thrust Diamond Gem -->
          <polygon points="56,29 52,24 48,29 52,34" fill="url(#ae-staff-gem)" stroke="#ffffff" stroke-width="1" filter="url(#ae-glow)"/>
          <!-- Concentric Runic Magic Circle Rings (Portal) -->
          <ellipse cx="52" cy="29" rx="3.5" ry="14" fill="none" stroke="#d500f9" stroke-width="1.8" stroke-dasharray="4,2" filter="url(#ae-purp-glow)"/>
          <ellipse cx="52" cy="29" rx="2" ry="8" fill="none" stroke="#00e5ff" stroke-width="1.4" filter="url(#ae-glow)"/>
          <!-- Piercing Laser Beam Burst -->
          <polygon points="52,26 66,22 64,29 66,36 52,32" fill="url(#ae-prism-wing)" filter="url(#ae-glow)"/>
          <line x1="53" y1="29" x2="68" y2="29" stroke="#ffffff" stroke-width="2.2"/>
          <polygon points="60,20 65,22 61,24" fill="#00e5ff"/>
          <polygon points="61,35 66,37 62,39" fill="#d500f9"/>
        </g>
        `}
      </g>
    </svg>`;
  },

  getPlayerSvg(action = 'idle', targetHeroId = null) {
    const rawId = targetHeroId || (typeof GameState !== 'undefined' && GameState.activeHeroId) || 'hero_starter';
    const idMap = {
      hero_traveler: 'hero_starter',
      hero_kazuha: 'hero_shadow_rogue',
      hero_furina: 'hero_frost_knight',
      hero_zhongli: 'hero_spear_lancer',
      hero_jiyan: 'hero_spear_lancer',
      hero_amber: 'hero_flame_knight',
      hero_changli: 'hero_flame_knight',
      hero_raiden: 'hero_arcane_mage'
    };
    const heroId = idMap[rawId] || rawId;

    switch (heroId) {
      case 'hero_starter':
        return this._getHeroStarterSvg(action);
      case 'hero_shadow_rogue':
        return this._getHeroShadowRogueSvg(action);
      case 'hero_frost_knight':
        return this._getHeroFrostKnightSvg(action);
      case 'hero_spear_lancer':
        return this._getHeroSpearLancerSvg(action);
      case 'hero_flame_knight':
        return this._getHeroFlameKnightSvg(action);
      case 'hero_arcane_mage':
        return this._getHeroArcaneMageSvg(action);
      case 'hero_aetheris':
        return this._getHeroAetherisSvg(action);
      case 'hero_unknown_god':
        return this._getHeroUnknownGodSvg(action);
      case 'hero_cassius':
        return this._getHeroCassiusSvg(action);
      default:
        return this._getHeroCassiusSvg(action);
    }
  },
  // ============================================================
  // GENSHIN BURST CUTSCENE ANIMATED SWORD DANCE ACTOR
  // ============================================================
  // ============================================================
  // AAA BURST CUTSCENE ANIMATED SWORD DANCE ACTORS (7 PIXEL HEROES)
  // ============================================================
  getHeroSwordDanceSvg(heroId) {
    const rawId = heroId || (typeof GameState !== 'undefined' && GameState.activeHeroId) || 'hero_starter';
    const idMap = {
      hero_traveler: 'hero_starter',
      hero_amber: 'hero_flame_knight',
      hero_kazuha: 'hero_shadow_rogue',
      hero_zhongli: 'hero_spear_lancer',
      hero_jiyan: 'hero_spear_lancer',
      hero_furina: 'hero_frost_knight',
      hero_changli: 'hero_flame_knight',
      hero_raiden: 'hero_arcane_mage'
    };
    const targetId = idMap[rawId] || rawId;

    // 1. HIỆP SĨ KHỞI ĐẦU (STARTER KNIGHT — THÉP)
    if (targetId === 'hero_starter') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-starter">
        <defs>
          <linearGradient id="st-blade-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#cfd8dc"/>
            <stop offset="100%" stop-color="#78909c"/>
          </linearGradient>
          <filter id="st-steel-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#b0bec5" flood-opacity="0.9"/></filter>
        </defs>
        <g transform="translate(260, 290)">
          <path d="M -180,0 L 180,0 M -120,-10 L -60,20 L 0,-15 L 70,25 L 140,-10" stroke="#ffd700" stroke-width="3" opacity="0.8"/>
          <polygon points="-80,-20 -60,-60 -40,-25" fill="#546e7a" stroke="#b0bec5" stroke-width="1.5"/>
          <polygon points="60,-15 85,-70 105,-20" fill="#455a64" stroke="#ffd700" stroke-width="1.5"/>
          <ellipse cx="0" cy="0" rx="140" ry="25" fill="none" stroke="#90a4ae" stroke-width="2" stroke-dasharray="10,6" opacity="0.7"/>
        </g>
        <g transform="translate(260, 160)">
          <path d="M -160,80 Q 0,-140 180,-40 Q 40,-40 -160,80 Z" fill="url(#st-blade-grad)" filter="url(#st-steel-glow)" opacity="0.9"/>
          <path d="M -140,70 Q 0,-110 160,-35" stroke="#ffffff" stroke-width="4" fill="none"/>
          <circle cx="20" cy="-60" r="4" fill="#ffd700"/>
          <circle cx="-50" cy="-20" r="3" fill="#ffffff"/>
          <circle cx="110" cy="-30" r="3.5" fill="#ffd700"/>
        </g>
        <g transform="translate(195, 60) scale(3.2)">
          <rect x="14" y="24" width="16" height="20" rx="2" fill="#78909c" stroke="#cfd8dc" stroke-width="1"/>
          <rect x="16" y="26" width="12" height="16" fill="#455a64"/>
          <path d="M 12,24 Q 4,36 8,46 Q 16,38 15,26 Z" fill="#c62828"/>
          <rect x="15" y="8" width="14" height="16" rx="3" fill="#90a4ae" stroke="#cfd8dc" stroke-width="1"/>
          <rect x="18" y="14" width="8" height="3" fill="#212121"/>
          <rect x="19" y="14" width="3" height="3" fill="#00e5ff"/>
          <rect x="23" y="14" width="3" height="3" fill="#00e5ff"/>
          <path d="M 21,8 Q 22,0 28,-2 Q 24,4 23,8 Z" fill="#d32f2f"/>
          <polygon points="26,18 48,-18 52,-15 29,20" fill="url(#st-blade-grad)" stroke="#ffffff" stroke-width="1"/>
          <rect x="24" y="17" width="8" height="3" rx="1" fill="#ffd700"/>
          <rect x="23" y="19" width="3" height="6" fill="#5d4037"/>
        </g>
      </svg>`;
    }

    // 2. THÍCH KHÁCH SONG ĐAO (SHADOW ROGUE — ÁM DẠ)
    if (targetId === 'hero_shadow_rogue') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-rogue">
        <defs>
          <filter id="rg-shadow-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00e5ff" flood-opacity="0.95"/></filter>
        </defs>
        <g opacity="0.35" transform="translate(120, 100) scale(0.85)">
          <path d="M 0,0 L 50,40 L 40,80 L -10,60 Z" fill="#0f172a" stroke="#00e5ff" stroke-width="2"/>
          <line x1="-30" y1="20" x2="80" y2="70" stroke="#00e5ff" stroke-width="3"/>
        </g>
        <g opacity="0.35" transform="translate(360, 90) scale(0.85)">
          <path d="M 0,0 L 50,40 L 40,80 L -10,60 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <line x1="80" y1="10" x2="-20" y2="80" stroke="#38bdf8" stroke-width="3"/>
        </g>
        <g transform="translate(260, 175)">
          <path d="M -180,-100 Q 0,0 180,100" stroke="#00e5ff" stroke-width="7" fill="none" filter="url(#rg-shadow-glow)"/>
          <path d="M -180,-100 Q 0,0 180,100" stroke="#ffffff" stroke-width="2.5" fill="none"/>
          <path d="M 180,-100 Q 0,0 -180,100" stroke="#38bdf8" stroke-width="7" fill="none" filter="url(#rg-shadow-glow)"/>
          <path d="M 180,-100 Q 0,0 -180,100" stroke="#ffffff" stroke-width="2.5" fill="none"/>
          <circle cx="0" cy="0" r="60" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="12,8" class="spin-aura"/>
        </g>
        <g transform="translate(195, 65) scale(3.2)">
          <path d="M 14,8 Q 22,2 30,8 Q 36,22 34,44 Q 22,46 10,44 Q 10,22 14,8 Z" fill="#0f172a"/>
          <path d="M 6,26 Q 0,38 2,46 Q 12,42 12,30 Z" fill="#1e293b"/>
          <path d="M 36,26 Q 44,38 42,46 Q 32,42 32,30 Z" fill="#1e293b"/>
          <rect x="18" y="16" width="4" height="2" fill="#00e5ff" filter="url(#rg-shadow-glow)"/>
          <rect x="26" y="16" width="4" height="2" fill="#00e5ff" filter="url(#rg-shadow-glow)"/>
          <path d="M 8,14 Q 22,24 38,36" stroke="#ffffff" stroke-width="3" fill="none" filter="url(#rg-shadow-glow)"/>
          <path d="M 36,14 Q 22,24 6,36" stroke="#00e5ff" stroke-width="3" fill="none" filter="url(#rg-shadow-glow)"/>
          <circle cx="22" cy="25" r="4" fill="#ffffff"/>
        </g>
      </svg>`;
    }

    // 3. BĂNG KIẾM SĨ (FROST KNIGHT — HÀN BĂNG)
    if (targetId === 'hero_frost_knight') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-frost">
        <defs>
          <filter id="fk-ice-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00e5ff" flood-opacity="1"/></filter>
          <linearGradient id="fk-crystal-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="40%" stop-color="#80d8ff"/>
            <stop offset="100%" stop-color="#0091ea"/>
          </linearGradient>
        </defs>
        <g transform="translate(260, 260)">
          <polygon points="-160,20 -130,-140 -100,20" fill="url(#fk-crystal-grad)" stroke="#ffffff" stroke-width="2" filter="url(#fk-ice-glow)"/>
          <polygon points="-110,20 -80,-90 -60,20" fill="url(#fk-crystal-grad)" opacity="0.85"/>
          <polygon points="100,20 135,-155 165,20" fill="url(#fk-crystal-grad)" stroke="#ffffff" stroke-width="2" filter="url(#fk-ice-glow)"/>
          <polygon points="60,20 85,-105 110,20" fill="url(#fk-crystal-grad)" opacity="0.85"/>
          <polygon points="0,-180 15,-165 0,-150 -15,-165" fill="#ffffff" filter="url(#fk-ice-glow)"/>
          <ellipse cx="0" cy="15" rx="150" ry="30" fill="none" stroke="#80d8ff" stroke-width="2" stroke-dasharray="14,6" opacity="0.75"/>
        </g>
        <g transform="translate(195, 55) scale(3.3)">
          <rect x="14" y="22" width="16" height="22" rx="2" fill="#0091ea" stroke="#ffffff" stroke-width="1"/>
          <rect x="17" y="25" width="10" height="16" fill="#0277bd"/>
          <path d="M 12,22 Q 2,36 6,48 Q 16,40 14,24 Z" fill="#80d8ff" opacity="0.9"/>
          <rect x="15" y="8" width="14" height="15" rx="3" fill="#00bcd4" stroke="#ffffff" stroke-width="1"/>
          <rect x="18" y="14" width="8" height="3" fill="#e0f7fa" filter="url(#fk-ice-glow)"/>
          <polygon points="21,12 23,-25 25,-25 27,12 25,48 23,48" fill="url(#fk-crystal-grad)" stroke="#ffffff" stroke-width="1.2" filter="url(#fk-ice-glow)"/>
          <rect x="18" y="12" width="12" height="4" fill="#ffffff"/>
        </g>
      </svg>`;
    }

    // 4. LONG THƯƠNG THỦ (SPEAR LANCER — LÔI LONG)
    if (targetId === 'hero_spear_lancer') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-spear">
        <defs>
          <filter id="sl-gold-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffd700" flood-opacity="1"/></filter>
        </defs>
        <g transform="translate(260, 160)" filter="url(#sl-gold-glow)">
          <path d="M -180,60 Q -100,-150 0,-70 Q 100,0 180,-110 Q 140,80 0,60 Q -120,80 -180,60 Z" fill="none" stroke="#ffd700" stroke-width="14" stroke-linecap="round"/>
          <path d="M -180,60 Q -100,-150 0,-70 Q 100,0 180,-110 Q 140,80 0,60 Q -120,80 -180,60 Z" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          <g transform="translate(170, -100)">
            <polygon points="0,0 35,-15 45,5 20,20 -5,10" fill="#ffd700" stroke="#ffffff" stroke-width="2"/>
            <circle cx="22" cy="0" r="5" fill="#00e5ff" filter="url(#sl-gold-glow)"/>
            <line x1="30" y1="5" x2="65" y2="25" stroke="#00e5ff" stroke-width="3"/>
            <line x1="25" y1="-8" x2="55" y2="-30" stroke="#ffe082" stroke-width="3.5"/>
          </g>
          <polygon points="-70,-40 -50,-80 -58,-40 -40,-20" fill="#00e5ff"/>
          <polygon points="80,20 105,-20 95,20 120,40" fill="#00e5ff"/>
        </g>
        <g transform="translate(195, 65) scale(3.2)">
          <rect x="14" y="24" width="16" height="20" rx="2" fill="#ffb300" stroke="#ffd700" stroke-width="1"/>
          <rect x="17" y="26" width="10" height="16" fill="#ff8f00"/>
          <rect x="15" y="9" width="14" height="15" rx="3" fill="#ffd54f" stroke="#ffb300" stroke-width="1"/>
          <polygon points="22,9 25,-4 28,9" fill="#00e5ff"/>
          <rect x="18" y="15" width="8" height="3" fill="#00e5ff" filter="url(#sl-gold-glow)"/>
          <line x1="-30" y1="45" x2="65" y2="-15" stroke="#ffffff" stroke-width="4"/>
          <line x1="-30" y1="45" x2="65" y2="-15" stroke="#ffd700" stroke-width="2.5"/>
          <polygon points="62,-18 78,-26 70,-10" fill="#ffffff" stroke="#ffd700" stroke-width="1.5" filter="url(#sl-gold-glow)"/>
        </g>
      </svg>`;
    }

    // 5. KIẾM SĨ HỎA DIỆM (FLAME KNIGHT — HỎA DIỆM)
    if (targetId === 'hero_flame_knight') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-flame">
        <defs>
          <filter id="fk-fire-glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ff3d00" flood-opacity="1"/></filter>
          <linearGradient id="fk-fire-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#bf360c"/>
            <stop offset="50%" stop-color="#ff3d00"/>
            <stop offset="85%" stop-color="#ff9100"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
        <g transform="translate(260, 160)" filter="url(#fk-fire-glow)">
          <path d="M -20,20 Q -120,-40 -190,-10 Q -140,50 -20,20 Z" fill="url(#fk-fire-grad)" opacity="0.9"/>
          <path d="M -15,10 Q -90,-80 -160,-60 Q -110,-10 -15,10 Z" fill="url(#fk-fire-grad)"/>
          <path d="M 20,20 Q 120,-40 190,-10 Q 140,50 20,20 Z" fill="url(#fk-fire-grad)" opacity="0.9"/>
          <path d="M 15,10 Q 90,-80 160,-60 Q 110,-10 15,10 Z" fill="url(#fk-fire-grad)"/>
          <ellipse cx="0" cy="80" rx="150" ry="35" fill="none" stroke="#ff3d00" stroke-width="3" stroke-dasharray="16,8" class="spin-aura"/>
          <circle cx="-60" cy="-70" r="4" fill="#ffd700"/>
          <circle cx="70" cy="-90" r="5" fill="#ffffff"/>
          <circle cx="120" cy="30" r="3.5" fill="#ff9100"/>
        </g>
        <g transform="translate(260, 150)">
          <path d="M -150,90 Q 0,-150 170,-40 Q 30,-30 -150,90 Z" fill="url(#fk-fire-grad)" filter="url(#fk-fire-glow)"/>
          <path d="M -130,80 Q 0,-120 150,-35" stroke="#ffffff" stroke-width="4" fill="none"/>
        </g>
        <g transform="translate(195, 60) scale(3.3)">
          <rect x="14" y="24" width="16" height="20" rx="2" fill="#d84315" stroke="#ff6e40" stroke-width="1"/>
          <rect x="17" y="26" width="10" height="16" fill="#bf360c"/>
          <rect x="15" y="9" width="14" height="15" rx="3" fill="#ff5722" stroke="#ffab91" stroke-width="1"/>
          <rect x="18" y="15" width="8" height="3" fill="#ffd600" filter="url(#fk-fire-glow)"/>
          <polygon points="17,9 22,0 24,9 26,0 29,9" fill="#ff9100"/>
        </g>
      </svg>`;
    }

    // 6. ĐẠI PHÁP SƯ HƯ KHÔNG (ARCANE MAGE — HƯ VÔ)
    if (targetId === 'hero_arcane_mage') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-mage">
        <defs>
          <filter id="am-void-glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#b026ff" flood-opacity="1"/></filter>
        </defs>
        <g transform="translate(260, 160)">
          <circle cx="0" cy="0" r="75" fill="#050014" stroke="#b026ff" stroke-width="4" filter="url(#am-void-glow)"/>
          <circle cx="0" cy="0" r="50" fill="#000000"/>
          <circle cx="0" cy="0" r="115" fill="none" stroke="#d500f9" stroke-width="2" stroke-dasharray="14,8" class="spin-aura"/>
          <circle cx="0" cy="0" r="145" fill="none" stroke="#7c4dff" stroke-width="1.8" stroke-dasharray="20,10" class="spin-aura" style="animation-direction:reverse;"/>
          <line x1="-130" y1="-70" x2="-30" y2="-20" stroke="#e040fb" stroke-width="2.5"/>
          <line x1="120" y1="80" x2="30" y2="20" stroke="#00e5ff" stroke-width="2.5"/>
        </g>
        <g transform="translate(195, 60) scale(3.3)">
          <path d="M 14,10 Q 22,4 30,10 Q 38,24 36,46 Q 22,50 8,46 Q 8,24 14,10 Z" fill="#311b92" stroke="#b026ff" stroke-width="1"/>
          <path d="M 18,22 Q 22,20 26,22 Q 26,38 22,44 Q 18,38 18,22 Z" fill="#4a148c"/>
          <polygon points="12,12 22,-4 32,12" fill="#1a0033" stroke="#b026ff" stroke-width="1"/>
          <rect x="18" y="16" width="3" height="3" fill="#00e5ff" filter="url(#am-void-glow)"/>
          <rect x="24" y="16" width="3" height="3" fill="#00e5ff" filter="url(#am-void-glow)"/>
          <g transform="translate(22, 28)">
            <polygon points="-12,-6 -12,8 0,4 0,-8" fill="#4a148c" stroke="#ffd700" stroke-width="1"/>
            <polygon points="0,-8 0,4 12,8 12,-6" fill="#4a148c" stroke="#ffd700" stroke-width="1"/>
            <line x1="0" y1="-8" x2="0" y2="4" stroke="#ffd700" stroke-width="1.5"/>
            <circle cx="0" cy="-14" r="5" fill="#ffffff" filter="url(#am-void-glow)"/>
          </g>
        </g>
      </svg>`;
    }

    // 7. AETHERIS — TINH VỰC ĐẠI PHÁP SƯ (COSMIC ARCHMAGE — TINH KHÔNG)
    if (targetId === 'hero_aetheris') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-aetheris">
        <defs>
          <filter id="ae-super-glow"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#00e5ff" flood-opacity="1"/></filter>
          <filter id="ae-purp-super-glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#d500f9" flood-opacity="1"/></filter>
          <linearGradient id="ae-vortex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="25%" stop-color="#00e5ff"/>
            <stop offset="60%" stop-color="#d500f9"/>
            <stop offset="85%" stop-color="#311b92"/>
            <stop offset="100%" stop-color="#050014"/>
          </linearGradient>
          <linearGradient id="ae-swirl-wing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00e5ff"/>
            <stop offset="40%" stop-color="#80d8ff"/>
            <stop offset="70%" stop-color="#e040fb"/>
            <stop offset="100%" stop-color="#ffd700"/>
          </linearGradient>
        </defs>

        <!-- BACKDROP: GIANT COSMIC GALAXY VORTEX & RUNIC PORTAL RING (Image 2 Panel 2) -->
        <g transform="translate(340, 160)">
          <!-- Giant Cosmic Deep Void Core -->
          <circle cx="0" cy="0" r="135" fill="#050014" stroke="#00e5ff" stroke-width="1.5" opacity="0.95"/>
          <!-- Swirling Nebula Galaxy Arms -->
          <g class="spin-slow" style="transform-origin: 0px 0px;">
            <path d="M 0,0 Q 60,-40 110,-20 Q 140,20 100,70 Q 50,110 -20,100 Q -90,80 -110,10 Q -120,-60 -50,-100 Q 20,-120 70,-80" fill="none" stroke="url(#ae-vortex-grad)" stroke-width="18" stroke-linecap="round" filter="url(#ae-purp-super-glow)"/>
            <path d="M 0,0 Q -60,40 -110,20 Q -140,-20 -100,-70 Q -50,-110 20,-100 Q 90,-80 110,-10 Q 120,60 50,100 Q -20,120 -70,80" fill="none" stroke="url(#ae-vortex-grad)" stroke-width="12" stroke-linecap="round" filter="url(#ae-super-glow)"/>
            <circle cx="0" cy="0" r="30" fill="#ffffff" filter="url(#ae-super-glow)"/>
            <circle cx="0" cy="0" r="14" fill="#00e5ff"/>
          </g>
          <!-- Ancient Mystic Runic Magic Ring -->
          <circle cx="0" cy="0" r="145" fill="none" stroke="#d500f9" stroke-width="3" stroke-dasharray="16,8,6,8" class="spin-aura" filter="url(#ae-purp-super-glow)"/>
          <circle cx="0" cy="0" r="152" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="4,6" opacity="0.8"/>
          <!-- Runic Sigil Stamps on Ring -->
          <text x="0" y="-140" fill="#00e5ff" font-size="12" font-family="monospace" text-anchor="middle" filter="url(#ae-super-glow)">✦</text>
          <text x="140" y="5" fill="#ffd700" font-size="12" font-family="monospace" text-anchor="middle">✧</text>
          <text x="0" y="148" fill="#d500f9" font-size="12" font-family="monospace" text-anchor="middle">✦</text>
          <text x="-140" y="5" fill="#00e5ff" font-size="12" font-family="monospace" text-anchor="middle">✧</text>
          <!-- Orbiting Shattered Crystal Monoliths drawn into Vortex -->
          <polygon points="60,-70 72,-85 80,-72 70,-60" fill="#d500f9" filter="url(#ae-purp-super-glow)"/>
          <polygon points="-80,50 -95,65 -85,75 -70,62" fill="#00e5ff" filter="url(#ae-super-glow)"/>
          <polygon points="90,70 105,80 95,92 82,82" fill="#ffffff"/>
          <polygon points="-65,-80 -80,-92 -70,-102 -58,-90" fill="#e040fb"/>
        </g>

        <!-- FOREGROUND: AETHERIS FLOATING IN COSMOS WITH WINGS & GOLDEN STAFF -->
        <g transform="translate(140, 70) scale(3.5)">
          <!-- Celestial Floating Prismatic Wings -->
          <polygon points="12,22 -6,4 0,16 -8,14 -3,26 4,34 12,28" fill="url(#ae-swirl-wing)" filter="url(#ae-super-glow)"/>
          <polygon points="26,22 44,4 38,16 46,14 41,26 34,34 26,28" fill="url(#ae-swirl-wing)" filter="url(#ae-super-glow)"/>
          <!-- Navy Robe & Fur Collar -->
          <path d="M 12,25 Q 4,40 8,50 Q 19,53 30,50 Q 34,40 26,25 Z" fill="#1a237e" stroke="#ffd700" stroke-width="0.8"/>
          <ellipse cx="19" cy="25" rx="8" ry="3.5" fill="#ffffff"/>
          <rect x="15" y="33" width="8" height="2" fill="#ffd700"/>
          <!-- Silver Hair & Face -->
          <path d="M 11,16 Q 8,24 10,29 Q 14,26 14,21 Z" fill="#ffffff"/>
          <rect x="13" y="14" width="12" height="10" fill="#ffe0b2" rx="2"/>
          <rect class="pixel-eye" x="15" y="17" width="3" height="2" fill="#00e5ff" filter="url(#ae-super-glow)"/>
          <rect class="pixel-eye" x="21" y="17" width="3" height="2" fill="#00e5ff" filter="url(#ae-super-glow)"/>
          <!-- Wizard Hat with Purple Ribbon & Gold Clasp -->
          <ellipse cx="19" cy="15" rx="14" ry="4" fill="#0f172a" stroke="#311b92" stroke-width="0.8"/>
          <rect x="11" y="10" width="16" height="3.5" fill="#4a148c"/>
          <path d="M 11,11 Q 15,1 26,-2 Q 24,4 28,11 Z" fill="#1a237e" stroke="#283593" stroke-width="0.8"/>
          <circle cx="19" cy="12" r="2.2" fill="#ffd700"/>
          <circle cx="19" cy="12" r="1" fill="#00e5ff"/>
          <!-- Golden Staff Aimed into Vortex -->
          <line x1="16" y1="28" x2="42" y2="20" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="41,18 48,18 45,24 38,24" fill="#ffd700"/>
          <polygon points="50,19 45,14 41,19 45,24" fill="#00e5ff" stroke="#ffffff" stroke-width="0.8" filter="url(#ae-super-glow)"/>
          <!-- Energy Beam firing into vortex center -->
          <line x1="50" y1="19" x2="75" y2="15" stroke="#ffffff" stroke-width="3" filter="url(#ae-super-glow)"/>
          <line x1="50" y1="19" x2="75" y2="15" stroke="#00e5ff" stroke-width="1.5"/>
        </g>
      </svg>`;
    }

    // 8. QUÂN VƯƠNG BÀI BẠC CASSIUS (3D SPINE MODEL & GOLDEN CASINO ARENA)
    if (targetId === 'hero_cassius') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-cassius">
        <defs>
          <radialGradient id="cass-burst-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(255,215,0,0.4)"/>
            <stop offset="45%" stop-color="rgba(225,29,72,0.2)"/>
            <stop offset="85%" stop-color="rgba(10,10,18,0.95)"/>
            <stop offset="100%" stop-color="#000000"/>
          </radialGradient>
          <filter id="cass-burst-glow"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#ffd700" flood-opacity="1"/></filter>
          <filter id="cass-dice-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ff0044" flood-opacity="0.9"/></filter>
        </defs>

        <!-- Golden Casino Stage & Rotating Orbit -->
        <rect width="520" height="360" fill="url(#cass-burst-bg)"/>
        <ellipse cx="260" cy="300" rx="190" ry="42" fill="none" stroke="#ffd700" stroke-width="2.5" stroke-dasharray="10,6" filter="url(#cass-burst-glow)"/>
        <ellipse cx="260" cy="300" rx="150" ry="32" fill="rgba(255,215,0,0.1)"/>

        <!-- Floating Razor Cards in Orbit -->
        <g filter="url(#cass-burst-glow)">
          <g transform="translate(100, 160) rotate(-25)">
            <rect x="-14" y="-22" width="28" height="44" rx="4" fill="#ffffff" stroke="#ffd700" stroke-width="2.5"/>
            <text x="0" y="6" font-family="'Impact', sans-serif" font-size="20" fill="#e11d48" text-anchor="middle">A♠</text>
          </g>
          <g transform="translate(420, 150) rotate(20)">
            <rect x="-14" y="-22" width="28" height="44" rx="4" fill="#ffffff" stroke="#ffd700" stroke-width="2.5"/>
            <text x="0" y="6" font-family="'Impact', sans-serif" font-size="20" fill="#0f172a" text-anchor="middle">K♦</text>
          </g>
          <g transform="translate(70, 250) rotate(-10)">
            <rect x="-12" y="-18" width="24" height="36" rx="3" fill="#ffffff" stroke="#ffd700" stroke-width="2"/>
            <text x="0" y="5" font-family="'Impact', sans-serif" font-size="16" fill="#e11d48" text-anchor="middle">Q♥</text>
          </g>
          <g transform="translate(450, 240) rotate(15)">
            <rect x="-12" y="-18" width="24" height="36" rx="3" fill="#ffffff" stroke="#ffd700" stroke-width="2"/>
            <text x="0" y="5" font-family="'Impact', sans-serif" font-size="16" fill="#0f172a" text-anchor="middle">J♣</text>
          </g>
        </g>

        <!-- Floating Golden Dice with Wings -->
        <g filter="url(#cass-dice-glow)" transform="translate(130, 90)">
          <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#fffbeb" stroke="#ca8a04" stroke-width="3"/>
          <circle cx="0" cy="0" r="5" fill="#e11d48"/>
          <!-- Wings -->
          <path d="M -16,-4 Q -36,-20 -44,-2 Q -28,2 -16,6 Z" fill="#ffd700" opacity="0.85"/>
          <path d="M 16,-4 Q 36,-20 44,-2 Q 28,2 16,6 Z" fill="#ffd700" opacity="0.85"/>
        </g>

        <!-- Full 3D Spine Model of Cassius -->
        <g transform="translate(260, 185)">
          <image href="assets/characters/cassius/model_3d_full.png" xlink:href="assets/characters/cassius/model_3d_full.png" x="-180" y="-165" width="360" height="330" preserveAspectRatio="xMidYMid meet" filter="url(#cass-burst-glow)"/>
        </g>
      </svg>`;
    }

    // 9. VÔ CỰC NGHỊCH MỆNH THẦN QUÂN (UNKNOWN GOD — THÁI CƠ)
    return `
    <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-god">
      <defs>
        <filter id="ug-god-glow"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#00ffcc" flood-opacity="1"/></filter>
      </defs>
      <g transform="translate(260, 160)" filter="url(#ug-god-glow)">
        <polygon points="0,-130 130,0 0,130 -130,0" fill="none" stroke="#00ffcc" stroke-width="3" class="spin-aura"/>
        <polygon points="0,-100 100,0 0,100 -100,0" fill="none" stroke="#ff0055" stroke-width="2.5" class="spin-aura" style="animation-direction:reverse;"/>
        <circle cx="0" cy="0" r="140" fill="none" stroke="#ffd700" stroke-width="2" stroke-dasharray="10,6"/>
        <g transform="translate(-110, -80)">
          <rect x="-16" y="-16" width="32" height="32" fill="#b71c1c" stroke="#ff0055" stroke-width="2" class="spin-aura"/>
        </g>
        <g transform="translate(110, -80)">
          <rect x="-16" y="-16" width="32" height="32" fill="#b71c1c" stroke="#ff0055" stroke-width="2" class="spin-aura"/>
        </g>
        <g transform="translate(-110, 80)">
          <rect x="-16" y="-16" width="32" height="32" fill="#b71c1c" stroke="#00ffcc" stroke-width="2" class="spin-aura"/>
        </g>
        <g transform="translate(110, 80)">
          <rect x="-16" y="-16" width="32" height="32" fill="#b71c1c" stroke="#00ffcc" stroke-width="2" class="spin-aura"/>
        </g>
      </g>
      <g transform="translate(195, 55) scale(3.4)">
        <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,40 Q 30,36 26,38 Q 16,38 10,30 Z" fill="#ffffff" filter="url(#ug-god-glow)"/>
        <polygon points="14,24 32,24 36,46 10,46" fill="#ffffff" stroke="#ffd700" stroke-width="1"/>
        <polygon points="18,24 28,24 26,44 20,44" fill="#b71c1c"/>
        <polygon points="16,10 30,10 28,24 23,28 18,24" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="18" y="15" width="4" height="4" fill="#00ffcc" filter="url(#ug-god-glow)"/>
        <rect class="pixel-eye" x="24" y="15" width="4" height="4" fill="#ff0055" filter="url(#ug-god-glow)"/>
        <circle cx="20" cy="17" r="1.5" fill="#ffffff"/>
        <circle cx="26" cy="17" r="1.5" fill="#ffffff"/>
      </g>
    </svg>`;
  },
  getHeroBurstSplash(heroId) {
    return this.getHeroSwordDanceSvg(heroId);
  },


  // 2. PIXEL MONSTERS (15 QUÁI VẬT THEO TIER)
  // ============================================================
  getMonsterSvg(name, isBoss = false) {
    const n = name || '';

    // 1. Slime Xanh
    if (n.includes('Slime')) {
      return `
      <svg class="pixel-sprite monster-slime-svg" viewBox="0 0 40 40" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="10" y="16" width="20" height="16" rx="4" fill="#00e676"/>
        <rect x="8" y="20" width="24" height="12" rx="4" fill="#00c853"/>
        <rect x="12" y="14" width="16" height="4" fill="#69f0ae"/>
        <!-- Má hồng & Mắt to long lanh -->
        <rect x="14" y="20" width="3" height="4" fill="#1b5e20"/>
        <rect x="23" y="20" width="3" height="4" fill="#1b5e20"/>
        <rect x="14" y="20" width="1" height="2" fill="#ffffff"/>
        <rect x="23" y="20" width="1" height="2" fill="#ffffff"/>
        <rect x="11" y="25" width="3" height="2" fill="#ff80ab" opacity="0.6"/>
        <rect x="26" y="25" width="3" height="2" fill="#ff80ab" opacity="0.6"/>
        <rect x="18" y="26" width="4" height="2" fill="#004d40"/>
      </svg>`;
    }

    // 2. Goblin
    if (n.includes('Goblin') || n.includes('Yêu Tinh')) {
      return `
      <svg class="pixel-sprite monster-goblin-svg" viewBox="0 0 40 40" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="6,12 12,16 6,18" fill="#43a047"/>
        <polygon points="34,12 28,16 34,18" fill="#43a047"/>
        <rect x="12" y="10" width="16" height="14" fill="#66bb6a"/>
        <rect x="15" y="14" width="3" height="3" fill="#ffeb3b"/>
        <rect x="22" y="14" width="3" height="3" fill="#ffeb3b"/>
        <rect x="16" y="15" width="1" height="2" fill="#d50000"/>
        <rect x="23" y="15" width="1" height="2" fill="#d50000"/>
        <rect x="16" y="20" width="8" height="2" fill="#2e7d32"/>
        <rect x="17" y="19" width="1" height="2" fill="#ffffff"/>
        <rect x="22" y="19" width="1" height="2" fill="#ffffff"/>
        <rect x="14" y="24" width="12" height="12" fill="#6d4c41"/>
        <rect x="28" y="24" width="3" height="8" fill="#b0bec5"/>
        <rect x="27" y="32" width="5" height="2" fill="#8d6e63"/>
      </svg>`;
    }

    // 3. Skeleton / Bộ Xương
    if (n.includes('Xương') || n.includes('Skeleton')) {
      return `
      <svg class="pixel-sprite monster-skel-svg" viewBox="0 0 40 40" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="13" y="8" width="14" height="12" fill="#eceff1"/>
        <rect x="15" y="13" width="3" height="3" fill="#212121"/>
        <rect x="22" y="13" width="3" height="3" fill="#212121"/>
        <rect x="16" y="14" width="1" height="1" fill="#00e5ff"/>
        <rect x="23" y="14" width="1" height="1" fill="#00e5ff"/>
        <rect x="15" y="17" width="10" height="2" fill="#b0bec5"/>
        <rect x="16" y="17" width="1" height="2" fill="#37474f"/>
        <rect x="19" y="17" width="1" height="2" fill="#37474f"/>
        <rect x="22" y="17" width="1" height="2" fill="#37474f"/>
        <rect x="18" y="21" width="4" height="14" fill="#cfd8dc"/>
        <rect x="14" y="23" width="12" height="2" fill="#eceff1"/>
        <rect x="14" y="26" width="12" height="2" fill="#eceff1"/>
        <rect x="15" y="29" width="10" height="2" fill="#eceff1"/>
        <rect x="28" y="14" width="2" height="18" fill="#90a4ae"/>
      </svg>`;
    }

    // 4. Orc Chiến Binh
    if (n.includes('Orc')) {
      return `
      <svg class="pixel-sprite monster-orc-svg" viewBox="0 0 44 44" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="13" y="8" width="18" height="16" fill="#33691e"/>
        <rect x="16" y="16" width="3" height="2" fill="#ff1744"/>
        <rect x="25" y="16" width="3" height="2" fill="#ff1744"/>
        <rect x="17" y="18" width="2" height="4" fill="#ffffff"/>
        <rect x="25" y="18" width="2" height="4" fill="#ffffff"/>
        <rect x="10" y="24" width="24" height="14" fill="#558b2f"/>
        <rect x="11" y="24" width="6" height="6" fill="#455a64"/>
        <rect x="32" y="14" width="6" height="8" fill="#37474f"/>
        <rect x="34" y="22" width="2" height="16" fill="#795548"/>
      </svg>`;
    }

    // 5. Dark Elf
    if (n.includes('Dark Elf')) {
      return `
      <svg class="pixel-sprite monster-elf-svg" viewBox="0 0 40 40" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="8,10 14,14 8,16" fill="#5e35b1"/>
        <polygon points="32,10 26,14 32,16" fill="#5e35b1"/>
        <rect x="14" y="8" width="12" height="14" fill="#7e57c2"/>
        <rect x="13" y="6" width="14" height="6" fill="#ffffff"/>
        <rect x="16" y="13" width="2" height="2" fill="#e040fb"/>
        <rect x="22" y="13" width="2" height="2" fill="#e040fb"/>
        <rect x="13" y="22" width="14" height="16" fill="#311b92"/>
        <rect x="9" y="22" width="2" height="12" fill="#d500f9"/>
        <rect x="29" y="22" width="2" height="12" fill="#d500f9"/>
      </svg>`;
    }

    // 6. Golem Đá
    if (n.includes('Golem')) {
      return `
      <svg class="pixel-sprite monster-golem-svg" viewBox="0 0 44 44" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="14" y="6" width="16" height="12" fill="#546e7a"/>
        <rect x="17" y="11" width="3" height="2" fill="#00e5ff"/>
        <rect x="24" y="11" width="3" height="2" fill="#00e5ff"/>
        <rect x="10" y="18" width="24" height="18" fill="#37474f"/>
        <rect x="14" y="22" width="16" height="10" fill="#455a64"/>
        <rect x="12" y="20" width="4" height="4" fill="#2e7d32"/>
        <rect x="21" y="24" width="2" height="6" fill="#00e5ff"/>
        <rect x="8" y="22" width="6" height="14" fill="#263238"/>
        <rect x="30" y="22" width="6" height="14" fill="#263238"/>
      </svg>`;
    }

    // 7. Rồng Lửa / Hỏa Long / Phượng Hoàng / Thần Long
    if (n.includes('Long') || n.includes('Dragon') || n.includes('Phượng') || n.includes('Phoenix')) {
      return `
      <svg class="pixel-sprite monster-dragon-svg" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <!-- Đôi cánh rồng sải rộng -->
        <rect x="4" y="14" width="10" height="4" fill="#b71c1c"/>
        <rect x="2" y="18" width="14" height="6" fill="#d32f2f"/>
        <rect x="6" y="24" width="8" height="4" fill="#f44336"/>
        <rect x="34" y="14" width="10" height="4" fill="#b71c1c"/>
        <rect x="32" y="18" width="14" height="6" fill="#d32f2f"/>
        <rect x="34" y="24" width="8" height="4" fill="#f44336"/>

        <!-- Sừng Rồng Hoàng Kim -->
        <rect x="18" y="4" width="3" height="6" fill="#ffd600"/>
        <rect x="16" y="6" width="2" height="4" fill="#ffab00"/>
        <rect x="27" y="4" width="3" height="6" fill="#ffd600"/>
        <rect x="30" y="6" width="2" height="4" fill="#ffab00"/>

        <!-- Đầu Rồng Uy Dũng -->
        <rect x="16" y="10" width="16" height="12" fill="#c62828"/>
        <rect x="14" y="12" width="20" height="8" fill="#e53935"/>
        <rect x="18" y="8" width="12" height="4" fill="#ef5350"/>

        <!-- Mắt Rồng Thần -->
        <rect x="17" y="13" width="4" height="3" fill="#ffeb3b"/>
        <rect x="27" y="13" width="4" height="3" fill="#ffeb3b"/>
        <rect x="19" y="13" width="2" height="3" fill="#00e5ff"/>
        <rect x="27" y="13" width="2" height="3" fill="#00e5ff"/>

        <!-- Mũi và Răng Nanh Lửa -->
        <rect x="20" y="18" width="8" height="4" fill="#b71c1c"/>
        <rect x="21" y="21" width="2" height="2" fill="#ffffff"/>
        <rect x="25" y="21" width="2" height="2" fill="#ffffff"/>

        <!-- Thân Rồng và Vảy Bụng Vàng -->
        <rect x="18" y="22" width="12" height="16" fill="#d32f2f"/>
        <rect x="21" y="24" width="6" height="12" fill="#ffca28"/>
        <rect x="22" y="26" width="4" height="2" fill="#ff8f00"/>
        <rect x="22" y="30" width="4" height="2" fill="#ff8f00"/>
        <rect x="22" y="34" width="4" height="2" fill="#ff8f00"/>

        <!-- Móng Vuốt -->
        <rect x="16" y="38" width="4" height="3" fill="#ffd600"/>
        <rect x="28" y="38" width="4" height="3" fill="#ffd600"/>
      </svg>`;
    }

    // 8. Lich King / Vu Yêu Vương / Thần Quái Tối Thượng
    if (n.includes('Lich') || n.includes('Chúa Tể') || n.includes('Thần')) {
      return `
      <svg class="pixel-sprite monster-lich-svg" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="18" y="6" width="12" height="12" fill="#eceff1"/>
        <polygon points="16,6 20,2 24,6 28,2 32,6" fill="#aa00ff"/>
        <rect x="20" y="11" width="3" height="3" fill="#000000"/>
        <rect x="25" y="11" width="3" height="3" fill="#000000"/>
        <rect x="21" y="12" width="1" height="1" fill="#ea80fc"/>
        <rect x="26" y="12" width="1" height="1" fill="#ea80fc"/>
        <rect x="14" y="18" width="20" height="24" fill="#212121"/>
        <rect x="17" y="20" width="14" height="20" fill="#4a148c"/>
        <rect x="36" y="10" width="2" height="30" fill="#e040fb"/>
        <circle cx="37" cy="8" r="4" fill="#00e5ff" opacity="0.8"/>
      </svg>`;
    }

    // Mặc định: Quỷ đỏ
    return `
    <svg class="pixel-sprite monster-demon-svg" viewBox="0 0 40 40" width="100%" height="100%" shape-rendering="crispEdges">
      <polygon points="12,6 15,12 10,12" fill="#d50000"/>
      <polygon points="28,6 25,12 30,12" fill="#d50000"/>
      <rect x="12" y="12" width="16" height="14" fill="#b71c1c"/>
      <rect x="15" y="16" width="3" height="3" fill="#ffff00"/>
      <rect x="22" y="16" width="3" height="3" fill="#ffff00"/>
      <rect x="16" y="17" width="1" height="2" fill="#000000"/>
      <rect x="23" y="17" width="1" height="2" fill="#000000"/>
      <rect x="16" y="22" width="8" height="2" fill="#212121"/>
      <rect x="13" y="26" width="14" height="12" fill="#880e4f"/>
    </svg>`;
  },

  // ============================================================
  // 3. PIXEL BOSSES (4 ĐẠI BOSS KHỔNG LỒ)
  // ============================================================
  getBossSvg(bossId) {
    if (bossId === 'boss_slime_king') {
      return `
      <svg class="pixel-sprite boss-pixel-svg boss-slime-king" viewBox="0 0 56 56" width="100%" height="100%" shape-rendering="crispEdges">
        <!-- Vương Miện Hoàng Gia Đính Ngọc -->
        <rect x="18" y="4" width="20" height="4" fill="#ffd600"/>
        <rect x="16" y="2" width="4" height="4" fill="#ffd600"/>
        <rect x="26" y="0" width="4" height="5" fill="#ffd600"/>
        <rect x="36" y="2" width="4" height="4" fill="#ffd600"/>
        <rect x="27" y="1" width="2" height="2" fill="#ff1744"/>
        <rect x="17" y="3" width="2" height="2" fill="#00e5ff"/>
        <rect x="37" y="3" width="2" height="2" fill="#00e5ff"/>

        <!-- Thân Vua Slime Ngọc Bích Bồng Bềnh -->
        <rect x="14" y="10" width="28" height="36" rx="6" fill="#00e676"/>
        <rect x="8" y="18" width="40" height="28" rx="8" fill="#00c853"/>
        <rect x="6" y="26" width="44" height="20" rx="10" fill="#00b248"/>
        <!-- Điểm sáng ngọc bích -->
        <rect x="14" y="12" width="8" height="4" fill="#b9f6ca" opacity="0.8"/>
        <rect x="12" y="16" width="4" height="8" fill="#b9f6ca" opacity="0.8"/>

        <!-- Mắt Anime To Long Lanh -->
        <rect x="16" y="24" width="6" height="8" rx="2" fill="#004d40"/>
        <rect x="34" y="24" width="6" height="8" rx="2" fill="#004d40"/>
        <rect x="16" y="24" width="3" height="4" fill="#ffffff"/>
        <rect x="34" y="24" width="3" height="4" fill="#ffffff"/>
        <rect x="18" y="29" width="2" height="2" fill="#69f0ae"/>
        <rect x="36" y="29" width="2" height="2" fill="#69f0ae"/>

        <!-- Má hồng dễ thương -->
        <rect x="12" y="32" width="5" height="3" rx="1" fill="#ff4081" opacity="0.6"/>
        <rect x="39" y="32" width="5" height="3" rx="1" fill="#ff4081" opacity="0.6"/>

        <!-- Nụ cười Quái Vương -->
        <rect x="25" y="34" width="6" height="3" rx="1" fill="#00332c"/>
      </svg>`;
    }

    if (bossId === 'boss_skeleton_warlord') {
      return `
      <svg class="pixel-sprite boss-pixel-svg boss-skel-warlord" viewBox="0 0 56 56" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="12,14 16,8 20,14" fill="#ffc107"/>
        <polygon points="44,14 40,8 36,14" fill="#ffc107"/>
        <rect x="18" y="10" width="20" height="16" fill="#ffe082"/>

        <rect x="22" y="16" width="4" height="4" fill="#212121"/>
        <rect x="30" y="16" width="4" height="4" fill="#212121"/>
        <rect x="23" y="17" width="2" height="2" fill="#d500f9"/>
        <rect x="31" y="17" width="2" height="2" fill="#d500f9"/>
        <rect x="22" y="22" width="12" height="3" fill="#ffb300"/>

        <rect x="10" y="26" width="10" height="8" fill="#ffa000"/>
        <rect x="36" y="26" width="10" height="8" fill="#ffa000"/>
        <rect x="18" y="26" width="20" height="22" fill="#ffc107"/>
        <rect x="22" y="28" width="12" height="18" fill="#ffe082"/>

        <rect x="44" y="12" width="4" height="32" fill="#ffd54f"/>
        <rect x="42" y="14" width="8" height="6" fill="#ff8f00"/>
      </svg>`;
    }

    if (bossId === 'boss_demon_lord') {
      return `
      <svg class="pixel-sprite boss-pixel-svg boss-demon-lord" viewBox="0 0 56 56" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="4,16 18,22 8,36" fill="#212121"/>
        <polygon points="52,16 38,22 48,36" fill="#212121"/>
        <polygon points="8,20 18,24 12,32" fill="#b71c1c"/>
        <polygon points="48,20 38,24 44,32" fill="#b71c1c"/>

        <path d="M 16,14 Q 10,4 20,4 L 20,10 Z" fill="#b71c1c"/>
        <path d="M 40,14 Q 46,4 36,4 L 36,10 Z" fill="#b71c1c"/>
        <rect x="18" y="10" width="20" height="16" fill="#d50000"/>

        <rect x="21" y="15" width="4" height="4" fill="#ffeb3b"/>
        <rect x="31" y="15" width="4" height="4" fill="#ffeb3b"/>
        <rect x="22" y="16" width="2" height="2" fill="#ff1744"/>
        <rect x="32" y="16" width="2" height="2" fill="#ff1744"/>

        <rect x="18" y="26" width="20" height="22" fill="#880e4f"/>
        <rect x="22" y="28" width="12" height="12" fill="#b71c1c"/>
        <rect x="24" y="30" width="8" height="8" fill="#ff5722"/>
      </svg>`;
    }

    // boss_chaos_dragon
    return `
    <svg class="pixel-sprite boss-pixel-svg boss-chaos-dragon" viewBox="0 0 60 60" width="100%" height="100%" shape-rendering="crispEdges">
      <polygon points="2,14 20,22 6,40" fill="#4a148c"/>
      <polygon points="58,14 40,22 54,40" fill="#4a148c"/>
      <polygon points="8,18 20,24 12,34" fill="#7b1fa2"/>
      <polygon points="52,18 40,24 48,34" fill="#7b1fa2"/>

      <polygon points="20,10 24,2 26,10" fill="#212121"/>
      <polygon points="40,10 36,2 34,10" fill="#212121"/>
      <polygon points="24,8 30,0 36,8" fill="#e040fb"/>
      <rect x="22" y="10" width="16" height="16" fill="#311b92"/>

      <rect x="25" y="16" width="3" height="3" fill="#00e5ff"/>
      <rect x="32" y="16" width="3" height="3" fill="#00e5ff"/>
      <rect x="26" y="17" width="1" height="1" fill="#ffffff"/>
      <rect x="33" y="17" width="1" height="1" fill="#ffffff"/>

      <rect x="22" y="26" width="16" height="24" fill="#4a148c"/>
      <rect x="26" y="28" width="8" height="14" fill="#aa00ff"/>
      <circle cx="30" cy="34" r="3" fill="#00e5ff" opacity="0.9"/>
    </svg>`;
  },

  // ============================================================
  // 4. PIXEL ITEMS (VŨ KHÍ, GIÁP, PHỤ KIỆN THEO PHẨM CẤP CÓ AURA)
  // ============================================================
  getItemSvg(item) {
    if (!item) return '';
    const type = item.type || 'weapon';
    const rarity = item.rarity || 'common';
    const name = item.name || '';

    if (type === 'weapon') {
      return this._renderWeaponPixel(name, rarity);
    } else if (type === 'armor') {
      return this._renderArmorPixel(name, rarity);
    } else {
      return this._renderAccessoryPixel(name, rarity);
    }
  },

  _renderWeaponPixel(name, rarity) {
    if (rarity === 'unknown' || name.includes('THÁI CỔ')) {
      return `
      <svg class="pixel-item-svg item-weapon-unknown" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="14" fill="none" stroke="url(#prism-grad)" stroke-width="1.5" opacity="0.8" class="spin-aura"/>
        <rect x="6" y="22" width="4" height="4" fill="#ffd700"/>
        <rect x="8" y="20" width="4" height="4" fill="#ff007f"/>
        <rect x="10" y="18" width="4" height="4" fill="#00ffff"/>
        <polygon points="12,18 26,4 28,6 14,20" fill="url(#prism-grad)"/>
        <polygon points="14,16 26,4 27,5 15,17" fill="#ffffff"/>
      </svg>`;
    }

    if (rarity === 'chaos' || name.includes('Hư Không')) {
      return `
      <svg class="pixel-item-svg item-weapon-chaos" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#d500f9" stroke-width="1" opacity="0.6"/>
        <rect x="7" y="21" width="4" height="4" fill="#311b92"/>
        <rect x="9" y="19" width="4" height="4" fill="#aa00ff"/>
        <polygon points="11,17 25,3 27,5 13,19" fill="#212121"/>
        <polygon points="12,16 25,3 26,4 13,17" fill="#e040fb"/>
      </svg>`;
    }

    if (rarity === 'mythic' || name.includes('Huyết') || name.includes('Thiên Cung')) {
      return `
      <svg class="pixel-item-svg item-weapon-mythic" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="6" y="22" width="4" height="4" fill="#3e2723"/>
        <rect x="8" y="20" width="5" height="3" fill="#ff6f00"/>
        <polygon points="11,17 26,2 28,4 13,19" fill="#d50000"/>
        <polygon points="12,16 26,2 27,3 13,17" fill="#ffab00"/>
      </svg>`;
    }

    if (rarity === 'legendary' || name.includes('Thần Kiếm') || name.includes('Long Tuyền')) {
      return `
      <svg class="pixel-item-svg item-weapon-legendary" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="6" y="22" width="4" height="4" fill="#e65100"/>
        <rect x="8" y="20" width="5" height="4" fill="#ffd600"/>
        <polygon points="11,17 26,2 28,4 13,19" fill="#ffea00"/>
        <polygon points="12,16 26,2 27,3 13,17" fill="#ffffff"/>
      </svg>`;
    }

    if (rarity === 'epic' || name.includes('Hắc') || name.includes('Lôi')) {
      return `
      <svg class="pixel-item-svg item-weapon-epic" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="6" y="22" width="4" height="4" fill="#311b92"/>
        <rect x="8" y="20" width="4" height="4" fill="#7e57c2"/>
        <polygon points="11,17 25,3 27,5 13,19" fill="#9c27b0"/>
        <polygon points="12,16 25,3 26,4 13,17" fill="#e1bee7"/>
      </svg>`;
    }

    if (rarity === 'rare') {
      return `
      <svg class="pixel-item-svg item-weapon-rare" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <rect x="6" y="22" width="4" height="4" fill="#01579b"/>
        <rect x="8" y="20" width="4" height="4" fill="#4fc3f7"/>
        <polygon points="11,17 25,3 27,5 13,19" fill="#00b0ff"/>
        <polygon points="12,16 25,3 26,4 13,17" fill="#e1f5fe"/>
      </svg>`;
    }

    // Common
    return `
    <svg class="pixel-item-svg item-weapon-common" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
      <rect x="6" y="22" width="4" height="4" fill="#4e342e"/>
      <rect x="8" y="20" width="4" height="3" fill="#8d6e63"/>
      <polygon points="11,17 24,4 26,6 13,19" fill="#b0bec5"/>
      <polygon points="12,16 24,4 25,5 13,17" fill="#cfd8dc"/>
    </svg>`;
  },

  _renderArmorPixel(name, rarity) {
    if (rarity === 'unknown' || name.includes('BẤT TỬ')) {
      return `
      <svg class="pixel-item-svg item-armor-unknown" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="13" fill="none" stroke="url(#prism-grad)" stroke-width="1.5" class="spin-aura"/>
        <polygon points="8,8 24,8 22,24 16,28 10,24" fill="url(#prism-grad)"/>
        <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#ffffff" opacity="0.9"/>
      </svg>`;
    }

    if (rarity === 'chaos') {
      return `
      <svg class="pixel-item-svg item-armor-chaos" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="8,8 24,8 22,24 16,28 10,24" fill="#212121"/>
        <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#7b1fa2"/>
        <circle cx="16" cy="16" r="3" fill="#e040fb"/>
      </svg>`;
    }

    if (rarity === 'mythic') {
      return `
      <svg class="pixel-item-svg item-armor-mythic" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="8,8 24,8 22,24 16,28 10,24" fill="#b71c1c"/>
        <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#ff5722"/>
        <circle cx="16" cy="16" r="3" fill="#ffeb3b"/>
      </svg>`;
    }

    if (rarity === 'legendary') {
      return `
      <svg class="pixel-item-svg item-armor-legendary" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="8,8 24,8 22,24 16,28 10,24" fill="#f57f17"/>
        <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#ffd600"/>
        <polygon points="13,12 19,12 16,18" fill="#ffffff"/>
      </svg>`;
    }

    if (rarity === 'epic') {
      return `
      <svg class="pixel-item-svg item-armor-epic" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="8,8 24,8 22,24 16,28 10,24" fill="#4a148c"/>
        <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#9c27b0"/>
      </svg>`;
    }

    if (rarity === 'rare') {
      return `
      <svg class="pixel-item-svg item-armor-rare" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <polygon points="8,8 24,8 22,24 16,28 10,24" fill="#01579b"/>
        <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#03a9f4"/>
      </svg>`;
    }

    // Common
    return `
    <svg class="pixel-item-svg item-armor-common" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
      <polygon points="8,8 24,8 22,24 16,28 10,24" fill="#455a64"/>
      <polygon points="10,10 22,10 20,22 16,25 12,22" fill="#78909c"/>
    </svg>`;
  },

  _renderAccessoryPixel(name, rarity) {
    if (rarity === 'unknown' || name.includes('VÔ CỰC')) {
      return `
      <svg class="pixel-item-svg item-acc-unknown" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="11" fill="none" stroke="url(#prism-grad)" stroke-width="3" class="spin-aura"/>
        <circle cx="16" cy="16" r="5" fill="#ffffff" filter="url(#sword-glow)"/>
      </svg>`;
    }

    if (rarity === 'chaos') {
      return `
      <svg class="pixel-item-svg item-acc-chaos" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="10" fill="none" stroke="#aa00ff" stroke-width="2.5"/>
        <circle cx="16" cy="16" r="4" fill="#000000"/>
        <circle cx="16" cy="16" r="2" fill="#00e5ff"/>
      </svg>`;
    }

    if (rarity === 'mythic') {
      return `
      <svg class="pixel-item-svg item-acc-mythic" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="9" fill="none" stroke="#d50000" stroke-width="2.5"/>
        <circle cx="16" cy="16" r="4" fill="#ffab00"/>
      </svg>`;
    }

    if (rarity === 'legendary') {
      return `
      <svg class="pixel-item-svg item-acc-legendary" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="9" fill="none" stroke="#ffab00" stroke-width="2.5"/>
        <polygon points="16,10 19,16 16,18 13,16" fill="#ffd600"/>
      </svg>`;
    }

    if (rarity === 'epic') {
      return `
      <svg class="pixel-item-svg item-acc-epic" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="8" fill="none" stroke="#7e57c2" stroke-width="2"/>
        <circle cx="16" cy="16" r="3.5" fill="#e040fb"/>
      </svg>`;
    }

    if (rarity === 'rare') {
      return `
      <svg class="pixel-item-svg item-acc-rare" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
        <circle cx="16" cy="16" r="8" fill="none" stroke="#00b0ff" stroke-width="2"/>
        <circle cx="16" cy="16" r="3" fill="#e1f5fe"/>
      </svg>`;
    }

    // Common
    return `
    <svg class="pixel-item-svg item-acc-common" viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges">
      <circle cx="16" cy="16" r="7" fill="none" stroke="#8d6e63" stroke-width="2"/>
      <circle cx="16" cy="16" r="2" fill="#b0bec5"/>
    </svg>`;
  },

  // ============================================================
  // 5. SLASH FX (HIỆU ỨNG VỆT CHÉM VŨ KHÍ)
  // ============================================================
  // ============================================================
  // 5. SLASH FX (HIỆU ỨNG VỆT CHÉM VŨ KHÍ)
  // ============================================================
  getSlashFxSvg(type = 'normal') {
    let gradColor1 = '#00ffff';
    let gradColor2 = '#00e5ff';
    let gradColor3 = '#ffffff';
    let glowColor = '#00ffff';

    if (type === 'cassius_card') {
      const uid = 'cass_card_' + Math.floor(Math.random() * 100000);
      return `
      <svg class="pixel-slash-fx fx-cassius-card" viewBox="0 0 120 120" width="100%" height="100%" style="overflow:visible;">
        <defs>
          <linearGradient id="${uid}-blade" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffd700" stop-opacity="0.1"/>
            <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.95"/>
            <stop offset="70%" stop-color="#ffd700" stop-opacity="1"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
          </linearGradient>
          <filter id="${uid}-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#ffd700" flood-opacity="0.9"/>
          </filter>
        </defs>

        <!-- Golden Razor Slash Crescent Curve -->
        <path d="M 12,98 Q 50,18 108,24 Q 65,48 12,98 Z" fill="url(#${uid}-blade)" filter="url(#${uid}-glow)"/>
        <path d="M 24,86 Q 54,28 102,28 Q 62,42 24,86 Z" fill="#ffffff" opacity="0.9"/>

        <!-- 1. Flying Ace of Spades Card (Leading projectile) -->
        <g transform="translate(86, 32) rotate(26)" filter="url(#${uid}-glow)">
          <rect x="-8" y="-12" width="16" height="24" rx="2" fill="#ffffff" stroke="#ffd700" stroke-width="1.4"/>
          <!-- Spade icon -->
          <path d="M 0,-6 C-3,-2 -4,1.2 0,3.5 C4,1.2 3,-2 0,-6 Z" fill="#0f172a"/>
          <polygon points="-1.5,3.2 1.5,3.2 0.8,6 -0.8,6" fill="#0f172a"/>
          <text x="-5.5" y="-5.5" font-family="'Courier New', monospace" font-size="5" font-weight="900" fill="#ca8a04">A</text>
        </g>

        <!-- 2. Trailing King of Diamonds Card -->
        <g transform="translate(52, 58) rotate(-16)">
          <rect x="-6" y="-9" width="12" height="18" rx="1.6" fill="#fffbeb" stroke="#ffd700" stroke-width="1.2"/>
          <polygon points="0,-4 -3,0 0,4 3,0" fill="#e11d48"/>
          <text x="-4" y="-3.5" font-family="'Courier New', monospace" font-size="4" font-weight="900" fill="#e11d48">K</text>
        </g>

        <!-- 3. Trailing Queen Card -->
        <g transform="translate(26, 82) rotate(-38)">
          <rect x="-5" y="-7.5" width="10" height="15" rx="1.4" fill="#ffffff" stroke="#ffd700" stroke-width="1"/>
          <circle cx="0" cy="0" r="2" fill="#0f172a"/>
        </g>

        <!-- Golden Sparkles & Suit Glints -->
        <polygon points="98,18 100,14 102,18 100,22" fill="#ffffff"/>
        <polygon points="40,36 42,32 44,36 42,40" fill="#ffd700"/>
        <polygon points="76,68 78,64 80,68 78,72" fill="#ffd700"/>
      </svg>`;
    }

    if (type === 'extra') {
      gradColor1 = '#ff007f';
      gradColor2 = '#ffd700';
      gradColor3 = '#ffffff';
      glowColor = '#ff007f';
    } else if (type === 'skill') {
      gradColor1 = '#a855f7';
      gradColor2 = '#00e5ff';
      gradColor3 = '#ffffff';
      glowColor = '#a855f7';
    } else if (type === 'burst') {
      gradColor1 = '#ff1744';
      gradColor2 = '#ffd700';
      gradColor3 = '#ffffff';
      glowColor = '#ff3d00';
    }

    const uid = 'slash_' + Math.floor(Math.random() * 100000);
    return `
    <svg class="pixel-slash-fx fx-${type}" viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible;">
      <defs>
        <linearGradient id="${uid}-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${gradColor1}" stop-opacity="0.1"/>
          <stop offset="50%" stop-color="${gradColor2}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${gradColor3}" stop-opacity="1"/>
        </linearGradient>
        <filter id="${uid}-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${glowColor}" flood-opacity="1"/>
        </filter>
      </defs>
      <path d="M 10,88 Q 45,15 92,20 Q 55,42 10,88 Z" fill="url(#${uid}-grad)" filter="url(#${uid}-glow)"/>
      <path d="M 22,78 Q 48,26 86,24 Q 52,36 22,78 Z" fill="#ffffff" opacity="0.95"/>
      <circle cx="50" cy="30" r="3" fill="#ffffff" filter="url(#${uid}-glow)"/>
      <circle cx="72" cy="22" r="2.5" fill="${gradColor2}"/>
      <circle cx="32" cy="52" r="2" fill="${gradColor1}"/>
    </svg>`;
  },

  // ============================================================
  // 6. GENSHIN-STYLE CLOSE-UP EYE CUT-IN SLASH BANNERS (PHASE 0)
  // ============================================================
  getHeroEyeCutinSvg(heroId) {
    const rawId = heroId || (typeof GameState !== 'undefined' && GameState.activeHeroId) || 'hero_starter';
    const idMap = {
      hero_traveler: 'hero_starter',
      hero_amber: 'hero_flame_knight',
      hero_kazuha: 'hero_shadow_rogue',
      hero_zhongli: 'hero_spear_lancer',
      hero_jiyan: 'hero_spear_lancer',
      hero_furina: 'hero_frost_knight',
      hero_changli: 'hero_flame_knight',
      hero_raiden: 'hero_arcane_mage'
    };
    const targetId = idMap[rawId] || rawId;

    switch (targetId) {
      case 'hero_starter':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-starter">
          <defs>
            <linearGradient id="st-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(15,23,42,0)"/>
              <stop offset="15%" stop-color="#0f172a"/>
              <stop offset="50%" stop-color="#334155"/>
              <stop offset="85%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="rgba(15,23,42,0)"/>
            </linearGradient>
            <filter id="st-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.9"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#st-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#94a3b8" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffd700" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(255,255,255,0.12)" text-anchor="middle" letter-spacing="18">開 山 破 石</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-6 Q 0,-20 48,-2 Q 10,16 -55,-6 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="14" ry="11" fill="#334155"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#94a3b8" filter="url(#st-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -60,-10 Q 5,-28 55,-4" stroke="#e2e8f0" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-6 Q -110,-15 -190,-5" stroke="#ffd700" stroke-width="2.5" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-20 55,-6 Q 10,16 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="14" ry="11" fill="#334155"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#94a3b8" filter="url(#st-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-28 60,-10" stroke="#e2e8f0" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-6 Q 110,-15 190,-5" stroke="#ffd700" stroke-width="2.5" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_shadow_rogue':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-rogue">
          <defs>
            <linearGradient id="rg-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(10,15,30,0)"/>
              <stop offset="15%" stop-color="#0a0f1e"/>
              <stop offset="50%" stop-color="#0284c7"/>
              <stop offset="85%" stop-color="#0a0f1e"/>
              <stop offset="100%" stop-color="rgba(10,15,30,0)"/>
            </linearGradient>
            <filter id="rg-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00e5ff" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#rg-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00e5ff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#38bdf8" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(0,229,255,0.12)" text-anchor="middle" letter-spacing="18">幻 影 絶 殺</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#0369a1"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#00e5ff" filter="url(#rg-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#38bdf8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#0369a1"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#00e5ff" filter="url(#rg-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#38bdf8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_frost_knight':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-frost">
          <defs>
            <linearGradient id="fk-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(3,43,67,0)"/>
              <stop offset="15%" stop-color="#032b43"/>
              <stop offset="50%" stop-color="#0288d1"/>
              <stop offset="85%" stop-color="#032b43"/>
              <stop offset="100%" stop-color="rgba(3,43,67,0)"/>
            </linearGradient>
            <filter id="fk-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#80d8ff" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#fk-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00e5ff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffffff" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(128,216,255,0.15)" text-anchor="middle" letter-spacing="18">氷 封 絶 域</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-6 Q 0,-20 48,-2 Q 10,16 -55,-6 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="14" ry="11" fill="#01579b"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#00e5ff" filter="url(#fk-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -60,-10 Q 5,-28 55,-4" stroke="#80d8ff" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-6 Q -110,-15 -190,-5" stroke="#ffffff" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-20 55,-6 Q 10,16 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="14" ry="11" fill="#01579b"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#00e5ff" filter="url(#fk-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-28 60,-10" stroke="#80d8ff" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-6 Q 110,-15 190,-5" stroke="#ffffff" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_spear_lancer':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-spear">
          <defs>
            <linearGradient id="sl-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(35,25,0,0)"/>
              <stop offset="15%" stop-color="#231900"/>
              <stop offset="50%" stop-color="#ff8f00"/>
              <stop offset="85%" stop-color="#231900"/>
              <stop offset="100%" stop-color="rgba(35,25,0,0)"/>
            </linearGradient>
            <filter id="sl-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffd700" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#sl-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ffd700" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#00e5ff" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(255,215,0,0.15)" text-anchor="middle" letter-spacing="18">金 龍 破 天</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#e65100"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ffd700" filter="url(#sl-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#00e5ff"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#ffb300" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#e65100"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ffd700" filter="url(#sl-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#00e5ff"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#ffb300" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_flame_knight':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-flame">
          <defs>
            <linearGradient id="fl-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(35,5,0,0)"/>
              <stop offset="15%" stop-color="#230500"/>
              <stop offset="50%" stop-color="#d50000"/>
              <stop offset="85%" stop-color="#230500"/>
              <stop offset="100%" stop-color="rgba(35,5,0,0)"/>
            </linearGradient>
            <filter id="fl-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff3d00" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#fl-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ff3d00" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffd600" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(255,61,0,0.15)" text-anchor="middle" letter-spacing="18">燎 原 烈 火</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-22 48,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="14" ry="11" fill="#b71c1c"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ff3d00" filter="url(#fl-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffd600"/>
              <path d="M -60,-12 Q 5,-30 55,-4" stroke="#d50000" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#ff9100" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-22 55,-8 Q 10,18 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="14" ry="11" fill="#b71c1c"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ff3d00" filter="url(#fl-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffd600"/>
              <path d="M -55,-4 Q -5,-30 60,-12" stroke="#d50000" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#ff9100" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_arcane_mage':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-arcane">
          <defs>
            <linearGradient id="am-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(18,5,34,0)"/>
              <stop offset="15%" stop-color="#120522"/>
              <stop offset="50%" stop-color="#4a148c"/>
              <stop offset="85%" stop-color="#120522"/>
              <stop offset="100%" stop-color="rgba(18,5,34,0)"/>
            </linearGradient>
            <filter id="am-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#d500f9" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#am-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#b026ff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#00e5ff" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(176,38,255,0.15)" text-anchor="middle" letter-spacing="18">黒 洞 寂 滅</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -60,-8 Q 0,-24 50,-2 Q 10,18 -60,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="16" ry="12" fill="#311b92"/>
              <ellipse cx="2" cy="0" rx="10" ry="10" fill="#d500f9" filter="url(#am-eye-glow)"/>
              <circle cx="2" cy="0" r="4" fill="#00e5ff"/>
              <path d="M -65,-12 Q 5,-32 60,-4" stroke="#e040fb" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-20 -180,-10" stroke="#00ffff" stroke-width="2.5" fill="none" opacity="0.9"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 60,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="16" ry="12" fill="#311b92"/>
              <ellipse cx="-2" cy="0" rx="10" ry="10" fill="#d500f9" filter="url(#am-eye-glow)"/>
              <circle cx="-2" cy="0" r="4" fill="#00e5ff"/>
              <path d="M -60,-4 Q -5,-32 65,-12" stroke="#e040fb" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-20 180,-10" stroke="#00ffff" stroke-width="2.5" fill="none" opacity="0.9"/>
            </g>
          </g>
        </svg>`;

      case 'hero_aetheris':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-aetheris">
          <defs>
            <linearGradient id="ae-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(5,0,20,0)"/>
              <stop offset="15%" stop-color="#050014"/>
              <stop offset="50%" stop-color="#1a237e"/>
              <stop offset="85%" stop-color="#050014"/>
              <stop offset="100%" stop-color="rgba(5,0,20,0)"/>
            </linearGradient>
            <filter id="ae-eye-glint"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00e5ff" flood-opacity="1"/></filter>
            <filter id="ae-lightning-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#d500f9" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#ae-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00e5ff" stroke-width="3.5" filter="url(#ae-eye-glint)"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#d500f9" stroke-width="3.5" filter="url(#ae-lightning-glow)"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="52" font-weight="900" fill="rgba(0,229,255,0.14)" text-anchor="middle" letter-spacing="18">萬 星 玄 滅</text>

          <!-- Cosmic Background Stars & Spiral Arc -->
          <path d="M 60,110 Q 320,10 580,30" stroke="#80d8ff" stroke-width="1.5" stroke-dasharray="4,6" fill="none" opacity="0.6"/>
          <circle cx="120" cy="30" r="1.5" fill="#ffffff"/>
          <circle cx="520" cy="95" r="2" fill="#ffd700"/>
          <circle cx="480" cy="25" r="1.5" fill="#00e5ff"/>

          <!-- Purple Crackling Lightning Arcs (Image 2 Panel 1) -->
          <path d="M 80,45 L 130,25 L 145,55 L 200,30" stroke="#d500f9" stroke-width="3" fill="none" filter="url(#ae-lightning-glow)"/>
          <path d="M 440,30 L 490,60 L 510,35 L 560,70" stroke="#d500f9" stroke-width="3" fill="none" filter="url(#ae-lightning-glow)"/>

          <!-- Eyes & Hat Tilt Close-Up Stage (Image 2 Panel 1 & 3) -->
          <g transform="translate(320, 65)">
            <!-- Left Eye (Cyan with Supernova 4-Point Star Glint - Panel 3) -->
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="16" ry="12" fill="#0d47a1"/>
              <ellipse cx="2" cy="0" rx="10" ry="10" fill="#00e5ff" filter="url(#ae-eye-glint)"/>
              <!-- 4-Point Star Core -->
              <polygon points="2,-7 4,-1 10,0 4,1 2,7 0,1 -6,0 0,-1" fill="#ffffff" filter="url(#ae-eye-glint)"/>
              <circle cx="2" cy="0" r="2.5" fill="#ffffff"/>
              <!-- Upper Eyelid & Gold Accent -->
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#ffd700" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>

            <!-- Right Eye (Cyan with Star Glint) -->
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="16" ry="12" fill="#0d47a1"/>
              <ellipse cx="-2" cy="0" rx="10" ry="10" fill="#00e5ff" filter="url(#ae-eye-glint)"/>
              <!-- 4-Point Star Core -->
              <polygon points="-2,-7 0,-1 6,0 0,1 -2,7 -4,1 -10,0 -4,-1" fill="#ffffff" filter="url(#ae-eye-glint)"/>
              <circle cx="-2" cy="0" r="2.5" fill="#ffffff"/>
              <!-- Upper Eyelid & Gold Accent -->
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#ffd700" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#d500f9" stroke-width="3" fill="none"/>
            </g>

            <!-- Center Hat Brim Shadow & Tilting Glove Hand (Image 2 Panel 1) -->
            <path d="M -180,-30 Q 0,-50 180,-30 L 170,-22 Q 0,-40 -170,-22 Z" fill="#0f172a" stroke="#4a148c" stroke-width="1.5"/>
            <!-- Hand holding brim -->
            <polygon points="-15,-38 15,-38 12,-24 -12,-24" fill="#37474f" stroke="#ffd700" stroke-width="1.2"/>
            <circle cx="0" cy="-31" r="3.5" fill="#ffd700"/>
          </g>
        </svg>`;

      case 'hero_cassius':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-cassius">
          <defs>
            <linearGradient id="cass-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(17,17,25,0)"/>
              <stop offset="15%" stop-color="#111119"/>
              <stop offset="50%" stop-color="#451a03"/>
              <stop offset="85%" stop-color="#111119"/>
              <stop offset="100%" stop-color="rgba(17,17,25,0)"/>
            </linearGradient>
            <filter id="cass-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffd700" flood-opacity="1"/></filter>
            <filter id="cass-red-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ff0044" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#cass-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ffd700" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ff0044" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="52" font-weight="900" fill="rgba(255,215,0,0.16)" text-anchor="middle" letter-spacing="18">運 命 豪 賭</text>
          
          <g transform="translate(320, 65)">
            <!-- Left Eye: Golden Hypnotic Spiral Swirl Eye -->
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="16" ry="12" fill="#451a03"/>
              <ellipse cx="2" cy="0" rx="10" ry="10" fill="#ffd700" filter="url(#cass-eye-glow)"/>
              <!-- Spiral -->
              <path d="M 0,-4 Q 4,-4 4,0 Q 4,4 0,4 Q -4,4 -4,0 Q -4,-2 0,-2" fill="none" stroke="#78350f" stroke-width="1.8"/>
              <circle cx="2" cy="0" r="2.2" fill="#ffffff"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#ffd700" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#facc15" stroke-width="3" fill="none"/>
            </g>

            <!-- Right Eye: Glowing Crimson Slit Predator Eye -->
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="16" ry="12" fill="#450a0a"/>
              <ellipse cx="-2" cy="0" rx="10" ry="10" fill="#ff0044" filter="url(#cass-red-glow)"/>
              <line x1="-2" y1="-8" x2="-2" y2="8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#ff0044" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#ffd700" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      default: // hero_unknown_god
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-unknown">
          <defs>
            <linearGradient id="ug-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(0,13,26,0)"/>
              <stop offset="15%" stop-color="#000d1a"/>
              <stop offset="50%" stop-color="#880e4f"/>
              <stop offset="85%" stop-color="#000d1a"/>
              <stop offset="100%" stop-color="rgba(0,13,26,0)"/>
            </linearGradient>
            <filter id="ug-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00ffcc" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#ug-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00ffcc" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ff0055" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="54" font-weight="900" fill="rgba(0,255,204,0.15)" text-anchor="middle" letter-spacing="18">無 極 創 生</text>
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#b71c1c"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#00ffcc" filter="url(#ug-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#ff0055" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#00ffcc" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#b71c1c"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#00ffcc" filter="url(#ug-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#ff0055" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#00ffcc" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;
    }
  }
};
