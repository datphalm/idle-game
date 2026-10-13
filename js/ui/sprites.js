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
  // 2. PIXEL HEROES & CHARACTERS (ALL 9 HEROES WITH BLINKING EYES & EQUIPPED WEAPON)
  // ============================================================
  getPlayerSvg(action = 'idle', targetHeroId = null) {
    const heroId = targetHeroId || GameState.activeHeroId || 'hero_traveler';
    const equippedWeaponSvg = this.renderEquippedWeapon(action);

    // 1. RAIDEN SHOGUN (LÔI THẦN EI — 6★ HỖN MANG)
    if (heroId === 'hero_raiden') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-raiden action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="raiden-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#d500f9" flood-opacity="0.95"/></filter>
        <!-- Hào quang Vòng Lôi Đình Thần Ma & Tomoe sau lưng -->
        <g class="hero-ambient-aura raiden-aura">
          <circle cx="24" cy="20" r="19" fill="none" stroke="#d500f9" stroke-width="1.8" stroke-dasharray="4,4" class="spin-aura"/>
          <circle cx="24" cy="2" r="2.5" fill="#e040fb" class="pulse-aura"/>
          <circle cx="8" cy="26" r="2.5" fill="#e040fb" class="pulse-aura"/>
          <circle cx="40" cy="26" r="2.5" fill="#e040fb" class="pulse-aura"/>
          <polygon points="23,0 25,0 23.5,2.5 25.5,2.5 22.5,6 23.5,3.5 22,3.5" fill="#ffd600" class="spark-fx"/>
        </g>
        <!-- Tóc tím dài buông xõa & bím tóc -->
        <rect x="14" y="8" width="20" height="26" rx="4" fill="#4a148c"/>
        <rect x="12" y="14" width="6" height="24" fill="#7b1fa2"/>
        <rect x="30" y="14" width="6" height="24" fill="#7b1fa2"/>
        <!-- Khuôn mặt anime & Mắt chớp Lôi tím -->
        <rect x="17" y="12" width="14" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="16" width="3" height="3" fill="#d500f9"/>
        <rect class="pixel-eye" x="26" y="16" width="3" height="3" fill="#d500f9"/>
        <rect x="20" y="16" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="16" width="1" height="1" fill="#ffffff"/>
        <!-- Kimono Đen Tím Mitsudomoe Hoàng Gia -->
        <rect x="16" y="23" width="16" height="18" fill="#311b92"/>
        <rect x="18" y="25" width="12" height="14" fill="#ba68c8"/>
        <rect x="20" y="29" width="8" height="4" fill="#ffd600"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 2. CHANGLI (TRƯỜNG LY — 6★ HỖN MANG HỎA PHƯỢNG)
    if (heroId === 'hero_changli') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-changli action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="changli-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#ff1744" flood-opacity="0.95"/></filter>
        <!-- Hào quang Cánh Phượng Hoàng & Đốm Lửa Bập Bùng -->
        <g class="hero-ambient-aura changli-aura">
          <path d="M 12,24 Q 2,14 6,8 Q 14,14 15,22 Z" fill="#ff1744" opacity="0.7" class="changli-wing-l"/>
          <path d="M 36,24 Q 46,14 42,8 Q 34,14 33,22 Z" fill="#ff1744" opacity="0.7" class="changli-wing-r"/>
          <circle cx="11" cy="10" r="1.5" fill="#ffd600" class="ember-float-1"/>
          <circle cx="37" cy="12" r="1.8" fill="#ff9100" class="ember-float-2"/>
          <circle cx="24" cy="3" r="1.5" fill="#ff3d00" class="ember-float-3"/>
        </g>
        <!-- Tóc đỏ rực lửa & lông vũ phượng hoàng -->
        <rect x="14" y="7" width="20" height="27" rx="4" fill="#c62828"/>
        <rect x="10" y="13" width="6" height="25" fill="#ff5252"/>
        <rect x="32" y="13" width="6" height="25" fill="#ff5252"/>
        <!-- Mặt & Mắt Hỏa hồng ngọc chớp -->
        <rect x="17" y="11" width="14" height="11" fill="#ffecb3"/>
        <rect class="pixel-eye" x="19" y="15" width="3" height="3" fill="#ff1744"/>
        <rect class="pixel-eye" x="26" y="15" width="3" height="3" fill="#ff1744"/>
        <rect x="20" y="15" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="15" width="1" height="1" fill="#ffffff"/>
        <!-- Trang phục Hỏa Vũ Trắng Đỏ Hoàng Kim -->
        <rect x="16" y="22" width="16" height="18" fill="#ffffff"/>
        <rect x="18" y="24" width="12" height="15" fill="#d32f2f"/>
        <rect x="20" y="28" width="8" height="4" fill="#ffd600"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 3. FURINA (THỦY THẦN — 5★ THẦN THOẠI)
    if (heroId === 'hero_furina') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-furina action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="furina-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#29b6f6" flood-opacity="0.9"/></filter>
        <!-- Hào quang Giọt Nước Tinh Thể & Vương Miện Thủy Triều -->
        <g class="hero-ambient-aura furina-aura">
          <circle cx="8" cy="16" r="3" fill="#e1f5fe" stroke="#00e5ff" stroke-width="1" opacity="0.8" class="bubble-float-1"/>
          <circle cx="40" cy="14" r="2.5" fill="#e1f5fe" stroke="#00e5ff" stroke-width="1" opacity="0.8" class="bubble-float-2"/>
          <circle cx="10" cy="36" r="2" fill="#e1f5fe" stroke="#00e5ff" stroke-width="0.8" opacity="0.7" class="bubble-float-3"/>
          <path d="M 20,4 L 24,1 L 28,4 L 26,6 L 22,6 Z" fill="#ffd600" opacity="0.95" class="pulse-aura"/>
        </g>
        <!-- Mũ chóp quý tộc Pháp màu xanh biển -->
        <rect x="18" y="2" width="12" height="8" fill="#01579b"/>
        <rect x="14" y="9" width="20" height="3" fill="#0288d1"/>
        <!-- Tóc trắng ngả xanh nước -->
        <rect x="14" y="11" width="20" height="22" rx="3" fill="#e1f5fe"/>
        <rect x="11" y="17" width="5" height="18" fill="#81d4fa"/>
        <rect x="32" y="17" width="5" height="18" fill="#81d4fa"/>
        <!-- Mắt Thủy Lam chớp -->
        <rect x="17" y="13" width="14" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="17" width="3" height="3" fill="#0288d1"/>
        <rect class="pixel-eye" x="26" y="17" width="3" height="3" fill="#00bcd4"/>
        <rect x="20" y="17" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="17" width="1" height="1" fill="#ffffff"/>
        <!-- Áo vest đuôi tôm xanh biển quý phái -->
        <rect x="16" y="24" width="16" height="17" fill="#0277bd"/>
        <rect x="20" y="26" width="8" height="10" fill="#ffffff"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 4. JIYAN (KỴ SĨ LONG NGÂM — 4★ HUYỀN THOẠI WUTHERING WAVES)
    if (heroId === 'hero_jiyan') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-jiyan action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="jiyan-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#00e5ff" flood-opacity="0.9"/></filter>
        <!-- Hào quang Thanh Long Khí & Ngọn Giáo Gió -->
        <g class="hero-ambient-aura jiyan-aura">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="6,4" class="spin-aura-reverse"/>
          <path d="M 4,22 Q 10,6 24,5 Q 38,6 44,22" fill="none" stroke="#00bfa5" stroke-width="2.2" opacity="0.85" class="dragon-coil"/>
          <polygon points="42,18 46,22 42,26 43,22" fill="#69f0ae" class="pulse-aura"/>
        </g>
        <!-- Tóc xanh ngọc đuôi ngựa chiến tướng -->
        <rect x="15" y="8" width="18" height="24" rx="3" fill="#004d40"/>
        <rect x="12" y="14" width="5" height="22" fill="#00897b"/>
        <rect x="31" y="14" width="5" height="22" fill="#00897b"/>
        <!-- Mặt & Mắt Rồng Phong Ngọc chớp -->
        <rect x="17" y="12" width="14" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="16" width="3" height="3" fill="#00e5ff"/>
        <rect class="pixel-eye" x="26" y="16" width="3" height="3" fill="#00e5ff"/>
        <rect x="20" y="16" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="16" width="1" height="1" fill="#ffffff"/>
        <!-- Giáp vảy Thanh Long đen ngọc -->
        <rect x="16" y="23" width="16" height="18" fill="#1b5e20"/>
        <rect x="19" y="25" width="10" height="14" fill="#00bfa5"/>
        <rect x="21" y="28" width="6" height="4" fill="#ffd600"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 5. ZHONGLI (NHAM VƯƠNG ĐẾ QUÂN — 4★ HUYỀN THOẠI)
    if (heroId === 'hero_zhongli') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-zhongli action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="zhongli-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#ffb300" flood-opacity="0.9"/></filter>
        <!-- Hào quang Khiên Kim Nham Hộ Thể & Vòng Ấn Nham Cổ -->
        <g class="hero-ambient-aura zhongli-aura">
          <circle cx="24" cy="24" r="21" fill="none" stroke="#ffb300" stroke-width="1.2" stroke-dasharray="8,4" opacity="0.8" class="spin-aura"/>
          <rect x="4" y="16" width="6" height="6" fill="#f57f17" stroke="#ffd54f" stroke-width="1" rx="1" transform="rotate(45 7 19)" class="geo-shield-l"/>
          <rect x="37" y="16" width="6" height="6" fill="#f57f17" stroke="#ffd54f" stroke-width="1" rx="1" transform="rotate(45 40 19)" class="geo-shield-r"/>
        </g>
        <!-- Tóc nâu umber đuôi sam chấm vàng -->
        <rect x="15" y="8" width="18" height="25" rx="3" fill="#2d1d13"/>
        <rect x="12" y="14" width="5" height="22" fill="#3e2723"/>
        <rect x="31" y="14" width="5" height="22" fill="#3e2723"/>
        <rect x="22" y="32" width="4" height="8" fill="#ffb300"/> <!-- Đuôi tóc hổ phách -->
        <!-- Mặt & Mắt Hổ Phách Đế Quân chớp -->
        <rect x="17" y="12" width="14" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="16" width="3" height="3" fill="#ff8f00"/>
        <rect class="pixel-eye" x="26" y="16" width="3" height="3" fill="#ff8f00"/>
        <rect x="20" y="16" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="16" width="1" height="1" fill="#ffffff"/>
        <!-- Áo dạ tiệc Nham Vương đen vàng sang trọng -->
        <rect x="16" y="23" width="16" height="18" fill="#212121"/>
        <rect x="19" y="25" width="10" height="14" fill="#424242"/>
        <rect x="21" y="26" width="6" height="8" fill="#ffd54f"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 6. KAZUHA (KAEDEHARA KAZUHA — 3★ SỬ THI)
    if (heroId === 'hero_kazuha') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-kazuha action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="kazuha-glow"><feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#a855f7" flood-opacity="0.85"/></filter>
        <!-- Hào quang Lá Phong Đỏ Xoáy Bay & Vòng Phong Thần -->
        <g class="hero-ambient-aura kazuha-aura">
          <circle cx="24" cy="24" r="19" fill="none" stroke="#80cbc4" stroke-width="1.2" stroke-dasharray="5,6" opacity="0.65" class="spin-aura"/>
          <path d="M 8,14 Q 14,8 10,6 Q 6,10 8,14 Z" fill="#d32f2f" class="leaf-swirl-1"/>
          <path d="M 38,18 Q 42,12 38,10 Q 34,14 38,18 Z" fill="#ff7043" class="leaf-swirl-2"/>
          <path d="M 22,3 Q 26,1 28,4 Q 24,6 22,3 Z" fill="#f44336" class="leaf-swirl-3"/>
        </g>
        <!-- Tóc bạch kim với lọn tóc đỏ lá phong -->
        <rect x="15" y="8" width="18" height="24" rx="3" fill="#eceff1"/>
        <rect x="12" y="14" width="5" height="20" fill="#cfd8dc"/>
        <rect x="31" y="14" width="5" height="20" fill="#cfd8dc"/>
        <rect x="26" y="10" width="3" height="14" fill="#d32f2f"/> <!-- Lọn tóc đỏ phong -->
        <!-- Khăn quàng lá phong đỏ -->
        <polygon points="14,24 34,24 24,30" fill="#d32f2f"/>
        <!-- Mặt & Mắt Phong Lãng Khách chớp -->
        <rect x="17" y="12" width="14" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="16" width="3" height="3" fill="#c62828"/>
        <rect class="pixel-eye" x="26" y="16" width="3" height="3" fill="#c62828"/>
        <rect x="20" y="16" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="16" width="1" height="1" fill="#ffffff"/>
        <!-- Trang phục Samurai Lãng Khách xám đen xanh -->
        <rect x="16" y="25" width="16" height="16" fill="#37474f"/>
        <rect x="18" y="27" width="12" height="12" fill="#00897b"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 7. AMBER (QUÁN QUÂN LƯỚT GIÓ — 2★ HIẾM)
    if (heroId === 'hero_amber') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-amber action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="amber-glow"><feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#ff9800" flood-opacity="0.85"/></filter>
        <!-- Hào quang Tia Lửa Bắn Pháo Hoa & Ngôi Sao Quán Quân -->
        <g class="hero-ambient-aura amber-aura">
          <circle cx="8" cy="16" r="2" fill="#ffd600" class="sparkle-pop-1"/>
          <circle cx="40" cy="14" r="2.5" fill="#ff5722" class="sparkle-pop-2"/>
          <polygon points="24,2 25,4 27,4 25.5,5.5 26,7.5 24,6 22,7.5 22.5,5.5 21,4 23,4" fill="#ffd600" class="pulse-aura"/>
        </g>
        <!-- Băng đô tai thỏ đỏ đặc trưng -->
        <polygon points="18,3 21,9 15,9" fill="#d32f2f"/>
        <polygon points="30,3 33,9 27,9" fill="#d32f2f"/>
        <rect x="16" y="8" width="16" height="3" fill="#b71c1c"/>
        <!-- Tóc nâu sẫm dài -->
        <rect x="15" y="10" width="18" height="24" rx="3" fill="#4e342e"/>
        <rect x="12" y="15" width="5" height="22" fill="#3e2723"/>
        <rect x="31" y="15" width="5" height="22" fill="#3e2723"/>
        <!-- Mặt & Mắt Hổ Phách tươi sáng chớp -->
        <rect x="17" y="12" width="14" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="16" width="3" height="3" fill="#f57c00"/>
        <rect class="pixel-eye" x="26" y="16" width="3" height="3" fill="#f57c00"/>
        <rect x="20" y="16" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="16" width="1" height="1" fill="#ffffff"/>
        <!-- Đồng phục Trinh Sát Kỵ Sĩ Đỏ Trắng -->
        <rect x="16" y="23" width="16" height="18" fill="#d32f2f"/>
        <rect x="19" y="25" width="10" height="12" fill="#ffffff"/>
        <rect x="21" y="28" width="6" height="4" fill="#ffd54f"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 8. THIÊN LÝ KHỞI NGUYÊN (7★ ??? VÔ CỰC)
    if (heroId === 'hero_unknown_god') {
      return `
      <svg class="pixel-sprite hero-pixel-svg hero-unknown action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
        <filter id="void-glow"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00ffcc" flood-opacity="1"/></filter>
        <!-- Hào quang 4 Lập Phương Hư Vô 3D Đa Chiều Quay Quanh Thân -->
        <g class="hero-ambient-aura void-aura">
          <circle cx="24" cy="24" r="21" fill="none" stroke="#00ffff" stroke-width="1.5" stroke-dasharray="3,3" class="spin-aura"/>
          <g class="void-cube-1">
            <rect x="4" y="4" width="7" height="7" fill="#ff0055" stroke="#00ffff" stroke-width="0.8" rx="1"/>
            <rect x="6" y="6" width="3" height="3" fill="#ffffff" opacity="0.8"/>
          </g>
          <g class="void-cube-2">
            <rect x="37" y="4" width="7" height="7" fill="#00ffff" stroke="#ff0055" stroke-width="0.8" rx="1"/>
            <rect x="39" y="6" width="3" height="3" fill="#ffffff" opacity="0.8"/>
          </g>
          <g class="void-cube-3">
            <rect x="3" y="33" width="7" height="7" fill="#00ffff" stroke="#ff0055" stroke-width="0.8" rx="1"/>
            <rect x="5" y="35" width="3" height="3" fill="#ffffff" opacity="0.8"/>
          </g>
          <g class="void-cube-4">
            <rect x="38" y="33" width="7" height="7" fill="#ff0055" stroke="#00ffff" stroke-width="0.8" rx="1"/>
            <rect x="40" y="35" width="3" height="3" fill="#ffffff" opacity="0.8"/>
          </g>
        </g>
        <!-- Tóc trắng thần linh bồng bềnh -->
        <rect x="13" y="6" width="22" height="28" rx="4" fill="#ffffff"/>
        <rect x="10" y="12" width="6" height="26" fill="#e0f7fa"/>
        <rect x="32" y="12" width="6" height="26" fill="#e0f7fa"/>
        <!-- Mắt Thần Vàng Kim chớp & Viền Đỏ Thần Bí -->
        <rect x="17" y="10" width="14" height="12" fill="#fff3e0"/>
        <rect class="pixel-eye" x="19" y="14" width="3" height="3" fill="#ffd600"/>
        <rect class="pixel-eye" x="26" y="14" width="3" height="3" fill="#ffd600"/>
        <rect x="20" y="14" width="1" height="1" fill="#ffffff"/>
        <rect x="27" y="14" width="1" height="1" fill="#ffffff"/>
        <!-- Áo Thần Thánh Đen Đỏ Vô Cực -->
        <rect x="16" y="22" width="16" height="19" fill="#1a1a2e"/>
        <rect x="18" y="24" width="12" height="15" fill="#ff0055"/>
        <!-- Vũ khí đang trang bị -->
        ${equippedWeaponSvg}
      </svg>`;
    }

    // 9. NHÀ LỮ HÀNH / TRAVELER (1★ THƯỜNG KHỞI ĐẦU)
    return `
    <svg class="pixel-sprite player-pixel-svg action-${action}" viewBox="0 0 48 48" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <filter id="sword-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#00ffff" flood-opacity="0.9"/>
        </filter>
      </defs>
      <!-- Hào quang Vòng Phong Hoa & Tinh Thần Lữ Hành -->
      <g class="hero-ambient-aura traveler-aura">
        <circle cx="24" cy="24" r="19" fill="none" stroke="#ffca28" stroke-width="1.2" stroke-dasharray="6,4" opacity="0.75" class="spin-aura"/>
        <polygon points="24,2 25,4 27,4 25.5,5.5 26,7.5 24,6 22,7.5 22.5,5.5 21,4 23,4" fill="#00e5ff" opacity="0.85" class="pulse-aura"/>
      </g>
      <!-- Khăn quàng & Áo choàng Phong bay sau lưng -->
      <g class="player-cape">
        <rect x="12" y="20" width="6" height="16" fill="#ffca28"/>
        <rect x="10" y="22" width="4" height="16" fill="#f57f17"/>
      </g>
      <!-- Tóc vàng óng Lữ Hành -->
      <rect x="15" y="8" width="18" height="20" rx="3" fill="#fbc02d"/>
      <rect x="12" y="12" width="5" height="16" fill="#f57f17"/>
      <rect x="31" y="12" width="5" height="16" fill="#f57f17"/>
      <!-- Chân & Giáp -->
      <rect x="18" y="38" width="4" height="6" fill="#37474f"/>
      <rect x="26" y="38" width="4" height="6" fill="#37474f"/>
      <rect x="18" y="22" width="12" height="16" fill="#5d4037"/>
      <rect x="20" y="24" width="8" height="12" fill="#cfd8dc"/>
      <!-- Khuôn mặt & Mắt vàng lữ hành chớp -->
      <rect x="17" y="11" width="14" height="11" fill="#ffe0b2"/>
      <rect class="pixel-eye" x="19" y="15" width="3" height="3" fill="#f57c17"/>
      <rect class="pixel-eye" x="26" y="15" width="3" height="3" fill="#f57c17"/>
      <rect x="20" y="15" width="1" height="1" fill="#ffffff"/>
      <rect x="27" y="15" width="1" height="1" fill="#ffffff"/>
      <!-- Vũ khí đang trang bị -->
      ${equippedWeaponSvg}
    </svg>`;
  },

  getHeroAvatarSvg(heroId) {
    return this.getPlayerSvg('idle', heroId);
  },

  // ============================================================
  // BANNER PIXEL ART ILLUSTRATIONS
  // ============================================================
  getWeaponBannerSvg() {
    return `
    <svg class="banner-visual-svg" viewBox="0 0 540 160" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <radialGradient id="banner-sky" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#1e1035"/>
          <stop offset="50%" stop-color="#0d091e"/>
          <stop offset="100%" stop-color="#05030b"/>
        </radialGradient>
        <linearGradient id="pedestal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffd54f"/>
          <stop offset="100%" stop-color="#795548"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="540" height="160" fill="url(#banner-sky)"/>
      <rect x="30" y="20" width="2" height="2" fill="#ffffff" opacity="0.8"/>
      <rect x="90" y="45" width="3" height="3" fill="#ffe082" opacity="0.9"/>
      <rect x="150" y="15" width="2" height="2" fill="#80d8ff" opacity="0.7"/>
      <rect x="210" y="35" width="3" height="3" fill="#ffffff" opacity="0.85"/>
      <rect x="330" y="25" width="2" height="2" fill="#ffe082" opacity="0.8"/>
      <rect x="390" y="50" width="3" height="3" fill="#00e5ff" opacity="0.9"/>
      <rect x="470" y="18" width="2" height="2" fill="#ffffff" opacity="0.8"/>
      <rect x="510" y="40" width="2" height="2" fill="#ffd54f" opacity="0.75"/>
      <circle cx="270" cy="80" r="60" fill="none" stroke="#6a1b9a" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5"/>
      <circle cx="270" cy="80" r="75" fill="none" stroke="#ffd600" stroke-width="0.8" opacity="0.3"/>
      <polygon points="210,145 330,145 350,160 190,160" fill="#212121"/>
      <rect x="230" y="125" width="80" height="20" fill="url(#pedestal-grad)"/>
      <rect x="245" y="122" width="50" height="3" fill="#fff9c4"/>
      <polygon points="270,40 220,160 320,160" fill="#ffeb3b" opacity="0.12"/>
      <polygon points="270,20 180,160 360,160" fill="#00e5ff" opacity="0.08"/>
      <!-- Left: Huyết Kiếm (Mythic) -->
      <g transform="translate(140, 50) rotate(-22)">
        <rect x="0" y="35" width="4" height="12" fill="#3e2723"/>
        <rect x="-6" y="32" width="16" height="4" fill="#ffd600"/>
        <rect x="0" y="-30" width="4" height="62" fill="#d50000"/>
        <polygon points="2,-36 -2,-30 6,-30" fill="#ffeb3b"/>
      </g>
      <!-- Center: Thần Khí ??? -->
      <g transform="translate(268, 30)">
        <circle cx="2" cy="15" r="30" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.85"/>
        <circle cx="2" cy="15" r="42" fill="none" stroke="#ff007f" stroke-width="1" opacity="0.5"/>
        <rect x="0" y="55" width="4" height="18" fill="#ffffff"/>
        <circle cx="2" cy="74" r="4" fill="#ffd700"/>
        <rect x="-10" y="50" width="24" height="6" fill="#00e5ff" rx="2"/>
        <rect x="-2" y="-40" width="8" height="90" fill="#00ffcc"/>
        <polygon points="2,-52 -5,-38 9,-38" fill="#ffffff"/>
        <rect x="-20" y="10" width="4" height="4" fill="#00ffff"/>
        <rect x="25" y="-10" width="4" height="4" fill="#ff007f"/>
      </g>
      <!-- Right: Hư Không Kiếm (Chaos) -->
      <g transform="translate(395, 50) rotate(22)">
        <rect x="0" y="35" width="4" height="12" fill="#212121"/>
        <rect x="-6" y="32" width="16" height="4" fill="#aa00ff"/>
        <rect x="0" y="-30" width="4" height="62" fill="#311b92"/>
        <rect x="1" y="-32" width="2" height="64" fill="#e040fb"/>
        <polygon points="2,-36 -2,-30 6,-30" fill="#ffffff"/>
      </g>
      <rect x="20" y="132" width="130" height="20" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="85" y="146" fill="#ffd700" font-size="10" font-weight="bold" font-family="'Courier New', monospace" text-anchor="middle">★ ĐỈNH CAO THẦN KHÍ ★</text>
      <rect x="390" y="132" width="130" height="20" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="455" y="146" fill="#00e5ff" font-size="10" font-weight="bold" font-family="'Courier New', monospace" text-anchor="middle">★ TỈ LỆ NÂNG CAO ★</text>
    </svg>`;
  },

  getHeroBannerSvg() {
    return `
    <svg class="banner-visual-svg" viewBox="0 0 540 160" width="100%" height="100%" shape-rendering="crispEdges">
      <defs>
        <radialGradient id="hero-banner-sky" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#2a0845"/>
          <stop offset="60%" stop-color="#120524"/>
          <stop offset="100%" stop-color="#06020c"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="540" height="160" fill="url(#hero-banner-sky)"/>
      <circle cx="270" cy="75" r="55" fill="none" stroke="#d500f9" stroke-width="2" opacity="0.6"/>
      <circle cx="270" cy="75" r="68" fill="none" stroke="#7c4dff" stroke-width="1" stroke-dasharray="8,6" opacity="0.5"/>
      <path d="M 0,140 Q 150,110 270,135 T 540,115 L 540,160 L 0,160 Z" fill="rgba(106,27,154,0.3)"/>
      <path d="M 0,148 Q 180,125 270,145 T 540,135 L 540,160 L 0,160 Z" fill="rgba(213,0,249,0.2)"/>
      <!-- Changli -->
      <g transform="translate(100, 20) scale(2.2)">
        <rect x="14" y="8" width="18" height="22" rx="3" fill="#c62828"/>
        <rect x="11" y="13" width="5" height="20" fill="#ff5252"/>
        <rect x="30" y="13" width="5" height="20" fill="#ff5252"/>
        <rect x="17" y="11" width="12" height="10" fill="#ffecb3"/>
        <rect class="pixel-eye" x="19" y="14" width="3" height="3" fill="#ff1744"/>
        <rect class="pixel-eye" x="25" y="14" width="3" height="3" fill="#ff1744"/>
        <rect x="16" y="21" width="14" height="18" fill="#ffffff"/>
        <rect x="18" y="23" width="10" height="14" fill="#d32f2f"/>
        <rect x="20" y="27" width="6" height="4" fill="#ffd600"/>
        <rect x="27" y="12" width="2" height="22" fill="#ff6d00" transform="rotate(25 27 12)"/>
      </g>
      <!-- Raiden Shogun -->
      <g transform="translate(225, 10) scale(2.6)">
        <rect x="14" y="10" width="18" height="24" rx="4" fill="#4a148c"/>
        <rect x="12" y="15" width="5" height="22" fill="#7b1fa2"/>
        <rect x="29" y="15" width="5" height="22" fill="#7b1fa2"/>
        <rect x="17" y="12" width="12" height="11" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="15" width="3" height="3" fill="#d500f9"/>
        <rect class="pixel-eye" x="25" y="15" width="3" height="3" fill="#d500f9"/>
        <rect x="16" y="23" width="14" height="18" fill="#311b92"/>
        <rect x="18" y="25" width="10" height="14" fill="#ba68c8"/>
        <rect x="20" y="29" width="6" height="4" fill="#ffd600"/>
        <rect x="30" y="2" width="2" height="36" fill="#ffd54f" transform="rotate(18 30 2)"/>
        <polygon points="30,0 34,8 30,8" fill="#e040fb" transform="rotate(18 30 2)"/>
      </g>
      <!-- Furina & Traveler -->
      <g transform="translate(370, 25) scale(2.2)">
        <rect x="18" y="4" width="10" height="7" fill="#01579b"/>
        <rect x="14" y="11" width="18" height="20" rx="3" fill="#e1f5fe"/>
        <rect x="11" y="16" width="5" height="16" fill="#81d4fa"/>
        <rect x="30" y="16" width="5" height="16" fill="#81d4fa"/>
        <rect x="17" y="13" width="12" height="10" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="19" y="16" width="3" height="3" fill="#0288d1"/>
        <rect class="pixel-eye" x="25" y="16" width="3" height="3" fill="#0288d1"/>
        <rect x="16" y="23" width="14" height="16" fill="#0277bd"/>
      </g>
      <rect x="20" y="132" width="150" height="20" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="95" y="146" fill="#ff5252" font-size="10" font-weight="bold" font-family="'Courier New', monospace" text-anchor="middle">★ TRƯỜNG LY: HỎA VŨ ★</text>
      <rect x="370" y="132" width="150" height="20" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="445" y="146" fill="#d500f9" font-size="10" font-weight="bold" font-family="'Courier New', monospace" text-anchor="middle">★ LÔI THẦN: VĨNH CỬU ★</text>
    </svg>`;
  },

  // ============================================================
  // GENSHIN BURST CUTSCENE ANIMATED SWORD DANCE ACTOR
  // ============================================================
  getHeroSwordDanceSvg(heroId) {
    // 1. ZHONGLI — ARCHETYPE: "THE CALM GOD & MONUMENTAL GEO STELE" (ARMS CROSSED, ZERO WEAPON DANCE)
    if (heroId === 'hero_zhongli') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-zhongli">
        <defs>
          <filter id="zl-gold-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffd54f" flood-opacity="1"/></filter>
        </defs>
        <!-- Ancient Liyue Monolith Stele (Bia Đá Nham Vương Khổng Lồ) -->
        <g transform="translate(260, 180)" opacity="0.85">
          <rect x="-45" y="-140" width="90" height="260" rx="6" fill="#3e2723" stroke="#ffb300" stroke-width="3" filter="url(#zl-gold-glow)"/>
          <rect x="-35" y="-130" width="70" height="240" rx="4" fill="#2d1d13"/>
          <!-- Runic Inscriptions on Stele -->
          <line x1="-25" y1="-100" x2="25" y2="-100" stroke="#ffd54f" stroke-width="2"/>
          <line x1="-20" y1="-70" x2="20" y2="-70" stroke="#ffd54f" stroke-width="2"/>
          <polygon points="0,-50 15,-30 0,-10 -15,-30" fill="none" stroke="#ffb300" stroke-width="2"/>
          <line x1="-25" y1="20" x2="25" y2="20" stroke="#ffd54f" stroke-width="2"/>
          <line x1="-20" y1="50" x2="20" y2="50" stroke="#ffd54f" stroke-width="2"/>
          <polygon points="0,70 12,90 0,110 -12,90" fill="#ffd54f"/>
          <!-- Rotating Geo Glyph Ring in 3D perspective -->
          <ellipse cx="0" cy="80" rx="150" ry="40" fill="none" stroke="#ffb300" stroke-width="2.5" stroke-dasharray="16,8" class="spin-aura"/>
        </g>
        <!-- 4 Hovering Geo Diamond Rhombus Prisms -->
        <g class="geo-shield-l" transform="translate(80, 130)">
          <polygon points="22,0 44,22 22,44 0,22" fill="#f57f17" stroke="#ffd54f" stroke-width="2.5" filter="url(#zl-gold-glow)"/>
        </g>
        <g class="geo-shield-r" transform="translate(400, 130)">
          <polygon points="22,0 44,22 22,44 0,22" fill="#f57f17" stroke="#ffd54f" stroke-width="2.5" filter="url(#zl-gold-glow)"/>
        </g>
        <!-- Zhongli Majestic Stance: Arms Crossed, Divine Authority -->
        <g transform="translate(195, 50) scale(3.4)">
          <!-- Hair & Amber Tip Ponytail -->
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#2d1d13"/>
          <path d="M 8,14 Q 4,24 8,36 Q 14,28 12,18 Z" fill="#3e2723"/>
          <path d="M 36,12 Q 42,22 38,36 Q 34,28 34,18 Z" fill="#ffb300"/>
          <!-- Face & Eyes -->
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffe0b2"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#ff8f00"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#ff8f00"/>
          <rect x="19" y="16" width="2" height="2" fill="#ffd54f"/>
          <rect x="26" y="16" width="2" height="2" fill="#ffd54f"/>
          <!-- Suit & Robe -->
          <polygon points="14,28 34,28 38,42 10,42" fill="#212121"/>
          <!-- ARMS CROSSED POSE (Khoanh tay trước ngực uy nghiêm) -->
          <rect x="12" y="30" width="24" height="6" rx="2" fill="#ffd54f"/>
          <rect x="15" y="32" width="18" height="4" fill="#3e2723"/>
          <polygon points="18,36 30,36 26,42 22,42" fill="#ffd54f"/>
        </g>
      </svg>`;
    }

    // 2. RAIDEN SHOGUN — ARCHETYPE: "MUSOU ISSHIN DRAWN FROM THE CHEST"
    if (heroId === 'hero_raiden') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-raiden">
        <defs>
          <filter id="rd-burst-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#d500f9" flood-opacity="1"/></filter>
        </defs>
        <!-- Mitsudomoe Electro Ring of Eternity -->
        <g transform="translate(260, 170)">
          <circle cx="0" cy="0" r="125" fill="none" stroke="#d500f9" stroke-width="3" stroke-dasharray="14,8" class="spin-aura"/>
          <circle cx="0" cy="-125" r="10" fill="#e040fb" filter="url(#rd-burst-glow)"/>
          <circle cx="-108" cy="62" r="10" fill="#e040fb" filter="url(#rd-burst-glow)"/>
          <circle cx="108" cy="62" r="10" fill="#e040fb" filter="url(#rd-burst-glow)"/>
        </g>
        <!-- Musou Isshin Sword Draw (From Chest Stance) -->
        <g class="raiden-sword-draw" transform="translate(225, 80)">
          <!-- Blinding Violet Tachi Blade Rising from Heart -->
          <path d="M 24,-110 Q 34,0 24,105" stroke="#ffffff" stroke-width="7" fill="none" filter="url(#rd-burst-glow)"/>
          <path d="M 24,-110 Q 34,0 24,105" stroke="#d500f9" stroke-width="3" fill="none"/>
          <!-- Golden Tsuba & Purple Hilt -->
          <rect x="16" y="95" width="16" height="5" fill="#ffd600"/>
          <rect x="22" y="100" width="4" height="30" fill="#311b92"/>
          <!-- Electric Arcs Radiating from Blade -->
          <polygon points="28,-75 42,-50 30,-45 46,-20 24,-30" fill="#ffd600"/>
          <polygon points="16,-10 4,10 16,15 2,42 22,30" fill="#00ffff"/>
        </g>
        <!-- Raiden Animated Figure -->
        <g transform="translate(195, 50) scale(3.4)">
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#4a148c"/>
          <path d="M 8,14 Q 4,24 8,36 Q 14,28 12,18 Z" fill="#7b1fa2"/>
          <path d="M 36,12 Q 42,22 38,36 Q 34,28 34,18 Z" fill="#7b1fa2"/>
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffe0b2"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#d500f9"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#d500f9"/>
          <rect x="19" y="16" width="2" height="2" fill="#ffffff"/>
          <rect x="26" y="16" width="2" height="2" fill="#ffffff"/>
          <polygon points="14,28 34,28 38,42 10,42" fill="#311b92"/>
          <polygon points="18,28 30,28 26,42 22,42" fill="#ba68c8"/>
        </g>
      </svg>`;
    }

    // 3. THIÊN LÝ KHỞI NGUYÊN — ARCHETYPE: "ZERO-G LEVITATION & SINGULARITY COLLAPSE"
    if (heroId === 'hero_unknown_god') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-unknown">
        <defs>
          <filter id="ug-cube-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00ffff" flood-opacity="1"/></filter>
        </defs>
        <!-- 6 Orbiting Void Hypercubes on Fingertips -->
        <g class="unknown-cubes-summon" transform="translate(260, 160)">
          <g transform="translate(-140, -100)" filter="url(#ug-cube-glow)">
            <polygon points="22,0 44,11 22,22 0,11" fill="#00ffff"/><polygon points="0,11 22,22 22,44 0,33" fill="#00838f"/><polygon points="22,22 44,11 44,33 22,44" fill="#00acc1"/>
          </g>
          <g transform="translate(100, -100)">
            <polygon points="26,0 52,13 26,26 0,13" fill="#ff0055"/><polygon points="0,13 26,26 26,52 0,39" fill="#880e4f"/><polygon points="26,26 52,13 52,39 26,52" fill="#c2185b"/>
          </g>
          <g transform="translate(-120, 70)">
            <polygon points="24,0 48,12 24,24 0,12" fill="#ff0055"/><polygon points="0,12 24,24 24,48 0,36" fill="#880e4f"/><polygon points="24,24 48,12 48,36 24,48" fill="#c2185b"/>
          </g>
          <g transform="translate(90, 70)" filter="url(#ug-cube-glow)">
            <polygon points="24,0 48,12 24,24 0,12" fill="#00ffff"/><polygon points="0,12 24,24 24,48 0,36" fill="#00838f"/><polygon points="24,24 48,12 48,36 24,48" fill="#00acc1"/>
          </g>
        </g>
        <!-- Thiên Lý Zero-G Levitation Model (Bàn tay vươn ra hội tụ lỗ đen) -->
        <g transform="translate(195, 40) scale(3.4)">
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#ffffff"/>
          <path d="M 6,12 Q 2,22 8,36 Q 14,28 12,18 Z" fill="#e0f7fa"/>
          <path d="M 36,10 Q 44,20 40,36 Q 34,28 34,18 Z" fill="#e0f7fa"/>
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#fff3e0"/>
          <polygon points="24,10 26,13 24,16 22,13" fill="#ff0055"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#ffd600"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#ffd600"/>
          <rect x="19" y="17" width="3" height="3" fill="#ff0055"/>
          <rect x="26" y="17" width="3" height="3" fill="#ff0055"/>
          <polygon points="14,28 34,28 38,42 10,42" fill="#120024"/>
          <!-- Outstretched divine hand reaching to camera -->
          <circle cx="34" cy="32" r="5" fill="#000000" stroke="#00ffff" stroke-width="1.5"/>
          <polygon points="18,28 30,28 26,42 22,42" fill="#ff0055"/>
        </g>
      </svg>`;
    }

    // 4. CHANGLI — ARCHETYPE: "AIRBORNE DIVING PHOENIX COMET"
    if (heroId === 'hero_changli') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-changli">
        <defs>
          <filter id="cl-fire-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ff1744" flood-opacity="1"/></filter>
        </defs>
        <!-- Giant Flaming Phoenix Wings (Sải cánh 460px rực lửa) -->
        <g transform="translate(260, 160)" opacity="0.95" filter="url(#cl-fire-glow)">
          <path d="M 0,0 Q -110,-95 -220,-45 Q -140,-10 -70,25 Z" fill="#ff1744"/>
          <path d="M 0,0 Q 110,-95 220,-45 Q 140,-10 70,25 Z" fill="#ff1744"/>
          <path d="M 0,0 Q -80,-65 -160,-30 Q -100,-8 -50,18 Z" fill="#ffd600"/>
          <path d="M 0,0 Q 80,-65 160,-30 Q 100,-8 50,18 Z" fill="#ffd600"/>
        </g>
        <!-- Changli Descending Comet Sword Angle -->
        <g class="changli-blade-dance" transform="translate(225, 75)">
          <path d="M -70,45 Q 20,-90 100,-20" stroke="#ffd600" stroke-width="7" fill="none" filter="url(#cl-fire-glow)"/>
          <path d="M -60,50 Q 20,-80 90,-15" stroke="#ffffff" stroke-width="3" fill="none"/>
          <circle cx="20" cy="25" r="8" fill="#ffd600"/>
          <line x1="20" y1="25" x2="70" y2="-25" stroke="#ff1744" stroke-width="5"/>
        </g>
        <!-- Changli Airborne Model -->
        <g transform="translate(195, 45) scale(3.4)">
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#c62828"/>
          <path d="M 8,14 Q 4,24 8,36 Q 14,28 12,18 Z" fill="#ff5252"/>
          <path d="M 36,12 Q 42,22 38,36 Q 34,28 34,18 Z" fill="#ff5252"/>
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffecb3"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#ff1744"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#ff1744"/>
          <rect x="19" y="16" width="2" height="2" fill="#ffffff"/>
          <rect x="26" y="16" width="2" height="2" fill="#ffffff"/>
          <polygon points="14,28 34,28 38,42 10,42" fill="#ffffff"/>
          <polygon points="18,28 30,28 26,42 22,42" fill="#d32f2f"/>
        </g>
      </svg>`;
    }

    // 5. FURINA — ARCHETYPE: "GRAND VERSAILLES OPERA BALLET & TOP-HAT BOW"
    if (heroId === 'hero_furina') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-furina">
        <!-- Theatrical Spotlight Cone & Water Ripples -->
        <g transform="translate(260, 20)">
          <polygon points="0,0 -160,320 160,320" fill="url(#fr-spotlight-grad)" opacity="0.35"/>
          <ellipse cx="0" cy="300" rx="140" ry="25" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="10,6" class="spin-aura"/>
        </g>
        <!-- Floating Crystal Bubbles & Musical Notes -->
        <circle cx="110" cy="150" r="16" fill="rgba(225,245,254,0.4)" stroke="#00e5ff" stroke-width="2" class="bubble-float-1"/>
        <circle cx="410" cy="130" r="20" fill="rgba(225,245,254,0.3)" stroke="#81d4fa" stroke-width="2" class="bubble-float-2"/>
        <!-- Silver Cane Baton Flourish -->
        <g class="furina-rapier-dance" transform="translate(220, 85)">
          <line x1="22" y1="-85" x2="22" y2="85" stroke="#00e5ff" stroke-width="5" stroke-linecap="round"/>
          <line x1="22" y1="-85" x2="22" y2="85" stroke="#ffffff" stroke-width="2"/>
          <circle cx="22" cy="75" r="9" fill="#ffd600" stroke="#01579b" stroke-width="2"/>
        </g>
        <!-- Furina Ballet Curtsy Model with Silk Top-Hat -->
        <g transform="translate(195, 45) scale(3.4)">
          <polygon points="18,0 30,0 28,8 20,8" fill="#01579b"/>
          <rect x="14" y="8" width="20" height="3" fill="#0288d1"/>
          <path d="M 12,8 Q 22,2 34,8 Q 42,20 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#e1f5fe"/>
          <polygon points="16,12 32,12 30,26 24,32 18,26" fill="#ffe0b2"/>
          <rect class="pixel-eye" x="18" y="17" width="5" height="5" fill="#0288d1"/>
          <rect class="pixel-eye" x="25" y="17" width="5" height="5" fill="#00bcd4"/>
          <rect x="19" y="17" width="2" height="2" fill="#ffffff"/>
          <rect x="26" y="17" width="2" height="2" fill="#ffffff"/>
          <polygon points="14,28 34,28 38,42 10,42" fill="#0277bd"/>
          <polygon points="18,28 30,28 26,42 22,42" fill="#ffffff"/>
        </g>
      </svg>`;
    }

    // 6. KAZUHA — ARCHETYPE: "ZEN SAMURAI IAIDO CROUCH & MAPLE WHIRLWIND"
    if (heroId === 'hero_kazuha') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-kazuha">
        <!-- Sumi-E Ink Swirl & Scarlet Maple Leaves -->
        <g fill="#d32f2f">
          <polygon points="90,110 98,102 96,114 104,116 94,122 96,130 88,124 80,128 84,120 76,116 86,114" class="leaf-swirl-1"/>
          <polygon points="410,100 420,92 418,104 426,106 416,112 418,120 410,114 402,118 406,110 398,106 408,104" class="leaf-swirl-2"/>
        </g>
        <!-- Iaido Katana Draw: Thumb Popped on Tsuba -->
        <g class="kazuha-iaido-slash" transform="translate(210, 85)">
          <path d="M -50,-65 Q 20,20 110,-20" stroke="#d32f2f" stroke-width="7" fill="none"/>
          <path d="M -40,-55 Q 20,15 100,-15" stroke="#ffffff" stroke-width="2.5" fill="none"/>
          <line x1="10" y1="20" x2="-25" y2="55" stroke="#cfd8dc" stroke-width="5"/>
          <rect x="8" y="18" width="7" height="7" fill="#ffd600"/>
        </g>
        <!-- Kazuha Resolute Samurai Figure -->
        <g transform="translate(195, 45) scale(3.4)">
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#eceff1"/>
          <path d="M 24,2 Q 28,12 26,24 Q 22,14 24,2 Z" fill="#d32f2f"/>
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffe0b2"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#c62828"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#c62828"/>
          <polygon points="14,26 34,26 30,34 18,34" fill="#d32f2f"/>
          <polygon points="14,32 34,32 38,42 10,42" fill="#37474f"/>
        </g>
      </svg>`;
    }

    // 7. JIYAN — ARCHETYPE: "MOUNTED CAVALRY CHARGE ATOP QINGLOONG DRAGON"
    if (heroId === 'hero_jiyan') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-jiyan">
        <!-- Dragon Body Coiling Underneath Rider -->
        <path d="M 60,220 Q 260,80 460,220" stroke="#00e5ff" stroke-width="6" stroke-dasharray="14,8" fill="none" class="dragon-coil"/>
        <!-- Leveling the Emerald Dragon Spear Forward like a Heavy Lance -->
        <g class="jiyan-spear-twirl" transform="translate(220, 80)">
          <line x1="24" y1="-95" x2="24" y2="105" stroke="#00bfa5" stroke-width="6" stroke-linecap="round"/>
          <polygon points="24,-125 38,-90 10,-90" fill="#69f0ae" stroke="#00e5ff" stroke-width="2.5"/>
          <circle cx="24" cy="-85" r="8" fill="#ffd600"/>
        </g>
        <!-- Jiyan Dragon General Figure -->
        <g transform="translate(195, 45) scale(3.4)">
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#004d40"/>
          <rect x="16" y="8" width="16" height="3" fill="#ffd600"/>
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffe0b2"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#00e5ff"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#00e5ff"/>
          <polygon points="14,28 34,28 38,42 10,42" fill="#1b5e20"/>
          <polygon points="18,28 30,28 26,42 22,42" fill="#00bfa5"/>
        </g>
      </svg>`;
    }

    // 8. AMBER — ARCHETYPE: "TACTICAL KNEELING SNIPER & FLARE ARROW LAUNCH"
    if (heroId === 'hero_amber') {
      return `
      <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-amber">
        <!-- Dancing Baron Bunny Decoy -->
        <g transform="translate(70, 110)" fill="#d32f2f">
          <circle cx="25" cy="25" r="22"/>
          <polygon points="14,8 19,-12 24,8"/><polygon points="26,8 31,-12 36,8"/>
          <circle cx="18" cy="22" r="3.5" fill="#ffffff"/>
          <polygon points="30,22 36,20 36,24" fill="#ffffff"/>
        </g>
        <!-- Aiming High-Angle Flare Rocket to the Sky -->
        <g class="amber-bow-pull" transform="translate(215, 80)">
          <path d="M 0,-70 Q 55,0 0,70" stroke="#d32f2f" stroke-width="5" fill="none"/>
          <line x1="0" y1="-70" x2="-22" y2="0" stroke="#ffd600" stroke-width="2.5"/>
          <line x1="0" y1="70" x2="-22" y2="0" stroke="#ffd600" stroke-width="2.5"/>
          <line x1="-35" y1="0" x2="70" y2="0" stroke="#ff9800" stroke-width="4"/>
          <polygon points="75,0 62,-7 62,7" fill="#ffd600"/>
        </g>
        <!-- Amber Outrider Model -->
        <g transform="translate(195, 45) scale(3.4)">
          <polygon points="18,0 22,-8 26,0" fill="#d32f2f"/>
          <polygon points="26,0 30,-8 34,0" fill="#d32f2f"/>
          <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#4e342e"/>
          <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffe0b2"/>
          <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#f57c00"/>
          <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#f57c00"/>
          <polygon points="14,28 34,28 38,42 10,42" fill="#d32f2f"/>
          <polygon points="18,28 30,28 26,42 22,42" fill="#ffffff"/>
        </g>
      </svg>`;
    }

    // 9. NHÀ LỮ HÀNH / TRAVELER — ARCHETYPE: "MID-AIR DUAL-ELEMENTAL X-STRIKE"
    return `
    <svg viewBox="0 0 520 360" width="100%" height="100%" class="burst-actor-svg burst-actor-traveler">
      <!-- 4-Pointed Primogem Celestial Constellation -->
      <polygon points="260,30 266,48 284,54 266,60 260,78 254,60 236,54 254,48" fill="#ffd54f" class="pulse-aura"/>
      <circle cx="260" cy="180" r="125" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-dasharray="12,8" class="spin-aura"/>
      <!-- Dual Crossed Swords (Anemo Cyan + Geo Amber) -->
      <g class="traveler-wind-gather" transform="translate(220, 80)">
        <line x1="0" y1="-70" x2="50" y2="70" stroke="#00e5ff" stroke-width="5" stroke-linecap="round"/>
        <line x1="50" y1="-70" x2="0" y2="70" stroke="#ffd54f" stroke-width="5" stroke-linecap="round"/>
        <circle cx="25" cy="0" r="10" fill="#ffffff"/>
      </g>
      <!-- Traveler Figure -->
      <g transform="translate(195, 45) scale(3.4)">
        <path d="M 12,2 Q 22,-4 34,2 Q 42,16 38,38 Q 30,34 26,36 Q 16,36 10,28 Z" fill="#fbc02d"/>
        <polygon points="16,10 32,10 30,26 24,32 18,26" fill="#ffe0b2"/>
        <rect class="pixel-eye" x="18" y="16" width="5" height="5" fill="#f57c17"/>
        <rect class="pixel-eye" x="25" y="16" width="5" height="5" fill="#f57c17"/>
        <polygon points="14,28 34,28 38,42 10,42" fill="#5d4037"/>
        <polygon points="18,28 30,28 26,42 22,42" fill="#cfd8dc"/>
      </g>
    </svg>`;
  },
  getHeroBurstSplash(heroId) {
    return this.getHeroSwordDanceSvg(heroId);
  },


  // ============================================================
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
  getSlashFxSvg(type = 'normal') {
    return `
    <svg class="pixel-slash-fx fx-${type}" viewBox="0 0 64 64" width="100%" height="100%">
      <path d="M 8,52 Q 32,8 58,12 Q 34,26 8,52 Z" fill="url(#slash-grad)"/>
      <path d="M 14,46 Q 32,14 54,16 Q 34,22 14,46 Z" fill="#ffffff" opacity="0.9"/>
    </svg>`;
  },

  // ============================================================
  // 6. GENSHIN-STYLE CLOSE-UP EYE CUT-IN SLASH BANNERS (PHASE 0)
  // ============================================================
  getHeroEyeCutinSvg(heroId) {
    switch (heroId) {
      case 'hero_raiden':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-raiden">
          <defs>
            <linearGradient id="rd-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(18,5,34,0)"/>
              <stop offset="15%" stop-color="#120522"/>
              <stop offset="50%" stop-color="#311b92"/>
              <stop offset="85%" stop-color="#120522"/>
              <stop offset="100%" stop-color="rgba(18,5,34,0)"/>
            </linearGradient>
            <filter id="rd-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#e040fb" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#rd-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#d500f9" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#00e5ff" stroke-width="3"/>
          <!-- Speed Streaks -->
          <g stroke="rgba(224,64,251,0.3)" stroke-width="1.5">
            <line x1="40" y1="25" x2="320" y2="25"/><line x1="180" y1="50" x2="580" y2="50"/>
            <line x1="60" y1="80" x2="420" y2="80"/><line x1="220" y1="105" x2="600" y2="105"/>
          </g>
          <!-- Watermark Kanji -->
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(213,0,249,0.12)" text-anchor="middle" letter-spacing="18">無 想 一 刀</text>
          <!-- Fierce Raiden Eyes -->
          <g transform="translate(320, 65)">
            <!-- Left Eye -->
            <g transform="translate(-110, 0)">
              <path d="M -60,-8 Q 0,-24 50,-2 Q 10,18 -60,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="16" ry="12" fill="#4a148c"/>
              <ellipse cx="2" cy="0" rx="10" ry="10" fill="#d500f9" filter="url(#rd-eye-glow)"/>
              <circle cx="2" cy="0" r="4" fill="#ffffff"/>
              <!-- Eyelash / Eyebrow -->
              <path d="M -65,-12 Q 5,-32 60,-4" stroke="#e040fb" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <!-- Lightning Eye Flare Trail -->
              <path d="M -50,-8 Q -100,-20 -180,-10" stroke="#00ffff" stroke-width="2.5" fill="none" opacity="0.9"/>
            </g>
            <!-- Right Eye -->
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 60,-8 Q 60,-8 10,18 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="16" ry="12" fill="#4a148c"/>
              <ellipse cx="-2" cy="0" rx="10" ry="10" fill="#d500f9" filter="url(#rd-eye-glow)"/>
              <circle cx="-2" cy="0" r="4" fill="#ffffff"/>
              <!-- Eyelash / Eyebrow -->
              <path d="M -60,-4 Q -5,-32 65,-12" stroke="#e040fb" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <!-- Lightning Eye Flare Trail -->
              <path d="M 50,-8 Q 100,-20 180,-10" stroke="#00ffff" stroke-width="2.5" fill="none" opacity="0.9"/>
            </g>
          </g>
        </svg>`;

      case 'hero_zhongli':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-zhongli">
          <defs>
            <linearGradient id="zl-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(25,18,8,0)"/>
              <stop offset="15%" stop-color="#191208"/>
              <stop offset="50%" stop-color="#4e342e"/>
              <stop offset="85%" stop-color="#191208"/>
              <stop offset="100%" stop-color="rgba(25,18,8,0)"/>
            </linearGradient>
            <filter id="zl-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffd54f" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#zl-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ffd54f" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ff8f00" stroke-width="3"/>
          <!-- Speed Streaks -->
          <g stroke="rgba(255,213,79,0.3)" stroke-width="1.5">
            <line x1="50" y1="20" x2="300" y2="20"/><line x1="150" y1="55" x2="590" y2="55"/>
            <line x1="70" y1="85" x2="400" y2="85"/><line x1="200" y1="110" x2="610" y2="110"/>
          </g>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(255,213,79,0.12)" text-anchor="middle" letter-spacing="18">天 動 万 象</text>
          <!-- Piercing Amber Eyes of the Geo Archon -->
          <g transform="translate(320, 65)">
            <!-- Left Eye -->
            <g transform="translate(-110, 0)">
              <path d="M -55,-6 Q 0,-20 48,-2 Q 10,16 -55,-6 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#e65100"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ffd54f" filter="url(#zl-eye-glow)"/>
              <polygon points="2,-5 6,0 2,5 -2,0" fill="#ffffff"/>
              <path d="M -60,-10 Q 5,-28 55,-4" stroke="#ff8f00" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <!-- Amber Eye Flare Trail -->
              <path d="M -50,-6 Q -110,-15 -190,-5" stroke="#ffd54f" stroke-width="3" fill="none"/>
            </g>
            <!-- Right Eye -->
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-20 55,-6 Q 10,16 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#e65100"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ffd54f" filter="url(#zl-eye-glow)"/>
              <polygon points="-2,-5 2,0 -2,5 -6,0" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-28 60,-10" stroke="#ff8f00" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <!-- Amber Eye Flare Trail -->
              <path d="M 50,-6 Q 110,-15 190,-5" stroke="#ffd54f" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_changli':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-changli">
          <defs>
            <linearGradient id="cl-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(38,10,10,0)"/>
              <stop offset="15%" stop-color="#260a0a"/>
              <stop offset="50%" stop-color="#b71c1c"/>
              <stop offset="85%" stop-color="#260a0a"/>
              <stop offset="100%" stop-color="rgba(38,10,10,0)"/>
            </linearGradient>
            <filter id="cl-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff1744" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#cl-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ff1744" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffd600" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(255,23,68,0.15)" text-anchor="middle" letter-spacing="18">離 火 燎 天</text>
          <!-- Changli Ruby Phoenix Eyes -->
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#b71c1c"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ff1744" filter="url(#cl-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffeb3b"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#ff1744" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#ff9100" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#b71c1c"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ff1744" filter="url(#cl-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffeb3b"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#ff1744" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#ff9100" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_unknown_god':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-unknown">
          <defs>
            <linearGradient id="ug-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(10,10,20,0)"/>
              <stop offset="15%" stop-color="#0a0a14"/>
              <stop offset="50%" stop-color="#240046"/>
              <stop offset="85%" stop-color="#0a0a14"/>
              <stop offset="100%" stop-color="rgba(10,10,20,0)"/>
            </linearGradient>
            <filter id="ug-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00ffff" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#ug-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00ffff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ff0055" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(0,255,255,0.12)" text-anchor="middle" letter-spacing="18">天 理 創 生</text>
          <!-- Divine Golden Eyes with Red Cross Pupils -->
          <g transform="translate(320, 65)">
            <polygon points="0,-25 5,-15 0,-5 -5,-15" fill="#ff0055"/>
            <g transform="translate(-110, 0)">
              <path d="M -55,-6 Q 0,-20 48,-2 Q 10,16 -55,-6 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="14" ry="11" fill="#ffd600" filter="url(#ug-eye-glow)"/>
              <!-- Cross Star Pupil -->
              <polygon points="2,-7 4,-2 9,0 4,2 2,7 0,2 -5,0 0,-2" fill="#ff0055"/>
              <path d="M -60,-10 Q 5,-28 55,-4" stroke="#ffffff" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-6 Q -110,-15 -190,-5" stroke="#00ffff" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-20 55,-6 Q 10,16 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="14" ry="11" fill="#ffd600" filter="url(#ug-eye-glow)"/>
              <polygon points="-2,-7 0,-2 5,0 0,2 -2,7 -4,2 -9,0 -4,-2" fill="#ff0055"/>
              <path d="M -55,-4 Q -5,-28 60,-10" stroke="#ffffff" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-6 Q 110,-15 190,-5" stroke="#00ffff" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_furina':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-furina">
          <defs>
            <linearGradient id="fr-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(5,20,38,0)"/>
              <stop offset="15%" stop-color="#051426"/>
              <stop offset="50%" stop-color="#0277bd"/>
              <stop offset="85%" stop-color="#051426"/>
              <stop offset="100%" stop-color="rgba(5,20,38,0)"/>
            </linearGradient>
            <filter id="fr-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00e5ff" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#fr-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00e5ff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffffff" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(0,229,255,0.12)" text-anchor="middle" letter-spacing="18">審 判 終 幕</text>
          <!-- Furina Dramatic Heterochromia Eyes -->
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#01579b"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#0288d1" filter="url(#fr-eye-glow)"/>
              <circle cx="0" cy="-2" r="3.5" fill="#ffffff"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#00e5ff" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#81d4fa" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#006064"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#00bcd4" filter="url(#fr-eye-glow)"/>
              <circle cx="0" cy="-2" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#00e5ff" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#81d4fa" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_kazuha':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-kazuha">
          <defs>
            <linearGradient id="kz-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(15,15,18,0)"/>
              <stop offset="15%" stop-color="#0f0f12"/>
              <stop offset="50%" stop-color="#37474f"/>
              <stop offset="85%" stop-color="#0f0f12"/>
              <stop offset="100%" stop-color="rgba(15,15,18,0)"/>
            </linearGradient>
            <filter id="kz-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff1744" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#kz-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ff1744" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffffff" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(255,23,68,0.12)" text-anchor="middle" letter-spacing="18">万 葉 一 刀</text>
          <!-- Kazuha Resolute Ruby Samurai Eyes -->
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-6 Q 0,-20 48,-2 Q 10,16 -55,-6 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#b71c1c"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ff1744" filter="url(#kz-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -60,-10 Q 5,-28 55,-4" stroke="#d32f2f" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-6 Q -110,-15 -190,-5" stroke="#ff5252" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-20 55,-6 Q 10,16 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#b71c1c"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ff1744" filter="url(#kz-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-28 60,-10" stroke="#d32f2f" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-6 Q 110,-15 190,-5" stroke="#ff5252" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_jiyan':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-jiyan">
          <defs>
            <linearGradient id="jy-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(5,25,20,0)"/>
              <stop offset="15%" stop-color="#051914"/>
              <stop offset="50%" stop-color="#004d40"/>
              <stop offset="85%" stop-color="#051914"/>
              <stop offset="100%" stop-color="rgba(5,25,20,0)"/>
            </linearGradient>
            <filter id="jy-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00e5ff" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#jy-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00e5ff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#69f0ae" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(0,229,255,0.12)" text-anchor="middle" letter-spacing="18">青 龍 破 空</text>
          <!-- Jiyan Dragon General Eyes -->
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-24 50,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="15" ry="11" fill="#004d40"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#00e5ff" filter="url(#jy-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#69f0ae"/>
              <path d="M -60,-12 Q 5,-32 55,-4" stroke="#00bfa5" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#64ffda" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -50,-2 Q 0,-24 55,-8 Q 10,18 -50,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="15" ry="11" fill="#004d40"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#00e5ff" filter="url(#jy-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#69f0ae"/>
              <path d="M -55,-4 Q -5,-32 60,-12" stroke="#00bfa5" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#64ffda" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      case 'hero_amber':
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-amber">
          <defs>
            <linearGradient id="ab-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(30,10,5,0)"/>
              <stop offset="15%" stop-color="#1e0a05"/>
              <stop offset="50%" stop-color="#bf360c"/>
              <stop offset="85%" stop-color="#1e0a05"/>
              <stop offset="100%" stop-color="rgba(30,10,5,0)"/>
            </linearGradient>
            <filter id="ab-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff9800" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#ab-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#ff9800" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffeb3b" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(255,152,0,0.15)" text-anchor="middle" letter-spacing="18">烈 火 燎 原</text>
          <!-- Amber Energetic Outrider Eyes -->
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-8 Q 0,-22 48,-2 Q 10,18 -55,-8 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="14" ry="11" fill="#e65100"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ff9800" filter="url(#ab-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffeb3b"/>
              <path d="M -60,-12 Q 5,-30 55,-4" stroke="#d84315" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-8 Q -100,-25 -190,-12" stroke="#ffb74d" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-22 55,-8 Q 10,18 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="14" ry="11" fill="#e65100"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ff9800" filter="url(#ab-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffeb3b"/>
              <path d="M -55,-4 Q -5,-30 60,-12" stroke="#d84315" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-8 Q 100,-25 190,-12" stroke="#ffb74d" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;

      default: // Traveler
        return `
        <svg viewBox="0 0 640 130" width="100%" height="100%" class="eye-cutin-svg eye-cutin-traveler">
          <defs>
            <linearGradient id="tv-cutin-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(10,25,20,0)"/>
              <stop offset="15%" stop-color="#0a1914"/>
              <stop offset="50%" stop-color="#00695c"/>
              <stop offset="85%" stop-color="#0a1914"/>
              <stop offset="100%" stop-color="rgba(10,25,20,0)"/>
            </linearGradient>
            <filter id="tv-eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffd54f" flood-opacity="1"/></filter>
          </defs>
          <polygon points="20,0 640,0 620,130 0,130" fill="url(#tv-cutin-bg)"/>
          <line x1="30" y1="0" x2="630" y2="0" stroke="#00e5ff" stroke-width="3"/>
          <line x1="10" y1="130" x2="610" y2="130" stroke="#ffd54f" stroke-width="3"/>
          <text x="320" y="80" font-family="'Courier New', monospace" font-size="64" font-weight="900" fill="rgba(255,213,79,0.15)" text-anchor="middle" letter-spacing="18">星 海 旅 人</text>
          <!-- Traveler Steadfast Golden Eyes -->
          <g transform="translate(320, 65)">
            <g transform="translate(-110, 0)">
              <path d="M -55,-6 Q 0,-20 48,-2 Q 10,16 -55,-6 Z" fill="#ffffff"/>
              <ellipse cx="2" cy="0" rx="14" ry="11" fill="#f57c00"/>
              <ellipse cx="2" cy="0" rx="9" ry="9" fill="#ffd54f" filter="url(#tv-eye-glow)"/>
              <circle cx="2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -60,-10 Q 5,-28 55,-4" stroke="#fbc02d" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M -50,-6 Q -110,-15 -190,-5" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>
            <g transform="translate(110, 0)">
              <path d="M -48,-2 Q 0,-20 55,-6 Q 10,16 -48,-2 Z" fill="#ffffff"/>
              <ellipse cx="-2" cy="0" rx="14" ry="11" fill="#f57c00"/>
              <ellipse cx="-2" cy="0" rx="9" ry="9" fill="#ffd54f" filter="url(#tv-eye-glow)"/>
              <circle cx="-2" cy="0" r="3.5" fill="#ffffff"/>
              <path d="M -55,-4 Q -5,-28 60,-10" stroke="#fbc02d" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M 50,-6 Q 110,-15 190,-5" stroke="#00e5ff" stroke-width="3" fill="none"/>
            </g>
          </g>
        </svg>`;
    }
  }
};

