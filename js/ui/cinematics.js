// ============================================================
// cinematics.js — x1000 GOD-TIER 3D WEBGL (THREE.JS) & WEB AUDIO SFX BURST ENGINE
// 60-144 FPS ULTRA-SMOOTH GPU-ACCELERATED CINEMATIC DIRECTING
// ============================================================

const Cinematics = {
  // 2D Overlay Canvas
  canvas: null,
  ctx: null,

  // 3D WebGL (Three.js) Engine
  threeCanvas: null,
  threeRenderer: null,
  threeScene: null,
  threeCamera: null,
  threeObjects: {},

  // Lifecycle & Performance
  animId: null,
  active: false,
  width: 0,
  height: 0,
  lastTime: 0,
  audioCtx: null,

  init() {
    this.canvas = document.getElementById('burst-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d', { alpha: true });
    }

    this.threeCanvas = document.getElementById('burst-three-canvas');
    if (this.threeCanvas && typeof THREE !== 'undefined' && !this.threeRenderer) {
      try {
        this.threeRenderer = new THREE.WebGLRenderer({
          canvas: this.threeCanvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
        this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);

        this.threeScene = new THREE.Scene();
        this.threeCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      } catch (e) {
        console.warn('Three.js WebGL initialization fallback:', e);
      }
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;

    if (this.canvas) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    if (this.threeRenderer && this.threeCamera) {
      this.threeRenderer.setSize(w, h);
      this.threeCamera.aspect = w / h;
      this.threeCamera.updateProjectionMatrix();
    }
  },

  // ============================================================
  // WEB AUDIO SYNTHESIZER SFX ENGINE (CINEMATIC MULTI-STAGE AUDIO)
  // ============================================================
  _getAudioCtx() {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      return null;
    }
  },

  playBurstAudio(heroId, phase) {
    const ctx = this._getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    try {
      if (phase === 'intro') {
        if (heroId === 'hero_furina') {
          // Playful water chime / harpsichord arpeggio
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            g.gain.setValueAtTime(0.25, now + idx * 0.07);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.35);
          });
        } else if (heroId === 'hero_kazuha') {
          // Silent breeze & sharp metallic tsuba click ("CHING")
          const click = ctx.createOscillator();
          const clickG = ctx.createGain();
          click.type = 'triangle';
          click.frequency.setValueAtTime(3400, now + 0.22);
          clickG.gain.setValueAtTime(0.38, now + 0.22);
          clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          click.connect(clickG);
          clickG.connect(ctx.destination);
          click.start(now + 0.22);
          click.stop(now + 0.35);
        } else if (heroId === 'hero_amber') {
          // Tactical radar lock-on beeps
          [880, 1760, 2640].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            g.gain.setValueAtTime(0.14, now + idx * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.08);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.1);
          });
        } else {
          // Sharp blade unsheath & energy wind
          const osc1 = ctx.createOscillator();
          const g = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(2600, now);
          osc1.frequency.exponentialRampToValueAtTime(3900, now + 0.35);
          g.gain.setValueAtTime(0.24, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
          osc1.connect(g);
          g.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.38);
        }
      } else if (phase === 'climax') {
        // Massive Sub-bass 38Hz earthquake body punch
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(130, now);
        subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.75);
        subGain.gain.setValueAtTime(0.75, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.8);

        if (heroId === 'hero_zhongli') {
          // Ancient temple bronze bell resonance
          const bell = ctx.createOscillator();
          const bellG = ctx.createGain();
          bell.type = 'sine';
          bell.frequency.setValueAtTime(310, now);
          bellG.gain.setValueAtTime(0.5, now);
          bellG.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
          bell.connect(bellG);
          bellG.connect(ctx.destination);
          bell.start(now);
          bell.stop(now + 1.3);
        } else if (heroId === 'hero_raiden') {
          // High-voltage lightning crackle zap
          const zap = ctx.createOscillator();
          const zapG = ctx.createGain();
          zap.type = 'sawtooth';
          zap.frequency.setValueAtTime(1100, now);
          zap.frequency.exponentialRampToValueAtTime(70, now + 0.38);
          zapG.gain.setValueAtTime(0.4, now);
          zapG.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
          zap.connect(zapG);
          zapG.connect(ctx.destination);
          zap.start(now);
          zap.stop(now + 0.42);
        } else if (heroId === 'hero_furina') {
          // Grand water surge
          const water = ctx.createOscillator();
          const waterG = ctx.createGain();
          water.type = 'triangle';
          water.frequency.setValueAtTime(220, now);
          water.frequency.exponentialRampToValueAtTime(750, now + 0.55);
          waterG.gain.setValueAtTime(0.35, now);
          waterG.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          water.connect(waterG);
          waterG.connect(ctx.destination);
          water.start(now);
          water.stop(now + 0.65);
        } else {
          // High-energy explosion detonation
          const bSize = Math.floor(ctx.sampleRate * 0.5);
          const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
          const d = b.getChannelData(0);
          for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = b;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1500, now);
          filter.frequency.exponentialRampToValueAtTime(70, now + 0.48);
          const expGain = ctx.createGain();
          expGain.gain.setValueAtTime(0.55, now);
          expGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          noise.connect(filter);
          filter.connect(expGain);
          expGain.connect(ctx.destination);
          noise.start(now);
        }
      }
    } catch (e) {}
  },

  // ============================================================
  // MAIN ENTRY POINT FOR BURST ULTIMATE CINEMATIC
  // ============================================================
  playBurst(skillRes) {
    if (!skillRes) return;

    // Nếu người chơi tắt hiệu ứng (VFX Off) và không phải bấm Thử Nghiệm thì bỏ qua cutscene
    if (!skillRes.forcePreview && GameState.settings && GameState.settings.vfxEnabled === false) {
      return;
    }

    // Chỉ phát hoạt ảnh cutscene khi người chơi đang xem màn hình chiến đấu
    // (Tab Chiến Đấu, Solo Boss Arena, hoặc Phòng Bí Cảnh / Tháp Thí Luyện)
    // hoặc khi người chơi nhấn nút Thử Nghiệm Nộ
    if (!skillRes.forcePreview && typeof UI !== 'undefined' && UI.isBattleViewActive && !UI.isBattleViewActive()) {
      return;
    }

    if (!this.threeRenderer) this.init();
    this.active = true;
    this.resize();

    const hero = skillRes.hero;
    const heroId = hero.id;
    const overlay = document.getElementById('burst-cinematic-overlay');
    const arenaStage = document.getElementById('arena-stage');
    const actorStage = document.getElementById('burst-actor-stage');
    const eyeCutin = document.getElementById('burst-eye-cutin');
    const shatterContainer = document.getElementById('burst-shatter-container');
    const impactFlash = document.getElementById('burst-impact-flash');
    const kanjiStamp = document.getElementById('burst-kanji-stamp');
    const heroTitle = document.getElementById('burst-hero-title');
    const heroName = document.getElementById('burst-hero-name');
    const skillName = document.getElementById('burst-skill-name');

    const KANJI_MAP = {
      hero_zhongli: '⟦ 天 動 万 象 ⟧',
      hero_raiden: '⟦ 夢 想 一 刀 ⟧',
      hero_unknown_god: '⟦ 天 理 創 生 ⟧',
      hero_changli: '⟦ 離 火 燎 天 ⟧',
      hero_furina: '⟦ 審 判 終 幕 ⟧',
      hero_kazuha: '⟦ 万 葉 一 刀 ⟧',
      hero_jiyan: '⟦ 青 龍 破 空 ⟧',
      hero_amber: '⟦ 烈 火 燎 原 ⟧',
      hero_traveler: '⟦ 星 海 旅 人 ⟧',
    };

    // 1. Setup Kanji Stamp & Titles
    if (kanjiStamp) {
      kanjiStamp.textContent = KANJI_MAP[heroId] || '⟦ 極 意 ⟧';
      kanjiStamp.style.color = hero.elementColor || '#ffd700';
    }
    if (heroTitle) heroTitle.textContent = hero.title || 'HUYỀN THOẠI CHIẾN TƯỚNG';
    if (heroName) {
      heroName.textContent = hero.name;
      heroName.style.color = hero.elementColor || '#ffd700';
    }
    if (skillName) skillName.textContent = `⚔️ ${skillRes.skill.name} ⚔️`;

    // 2. Trigger Phase 0: Close-Up Eye Slash Cut-In Banner
    if (eyeCutin && typeof Sprites !== 'undefined' && Sprites.getHeroEyeCutinSvg) {
      eyeCutin.innerHTML = Sprites.getHeroEyeCutinSvg(heroId);
      eyeCutin.classList.remove('cutin-active');
      void eyeCutin.offsetWidth;
      eyeCutin.classList.add('cutin-active');
    }

    // Play Phase 0 Audio
    this.playBurstAudio(heroId, 'intro');

    // 3. Inject Hero's Unique Archetype Stance Model
    if (actorStage && typeof Sprites !== 'undefined') {
      actorStage.innerHTML = Sprites.getHeroSwordDanceSvg ? Sprites.getHeroSwordDanceSvg(heroId) : Sprites.getHeroBurstSplash(heroId);
      actorStage.classList.remove('actor-strike-exit');
    }

    // 4. Show Overlay & Hero-Themed CSS
    if (overlay) {
      overlay.className = `burst-overlay burst-active theme-${heroId}`;
    }

    // 5. Build Genuine 3D WebGL Scene
    this._buildHero3DScene(heroId);

    // 6. Dynamic 3D Camera Tilt on 2D Arena
    if (arenaStage) {
      arenaStage.classList.add('camera-3d-active');
      this._apply3DCameraAngle(arenaStage, heroId);
    }

    // 7. Delta-Time 60-144 FPS Rendering Loop
    const startTime = performance.now();
    this.lastTime = startTime;
    const duration = 2100;
    let impactFired = false;
    const particles = this._createParticlesForHero(heroId);

    if (this.animId) cancelAnimationFrame(this.animId);

    const render = (now) => {
      if (!this.active) return;
      const dt = Math.min(0.033, (now - this.lastTime) / 1000);
      this.lastTime = now;

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Phase 1 -> Phase 2 Transition at 750ms (~0.357 progress)
      if (progress >= 0.357 && !impactFired) {
        impactFired = true;

        if (actorStage) actorStage.classList.add('actor-strike-exit');

        if (overlay) {
          overlay.classList.add('hitstop-active');
          setTimeout(() => overlay && overlay.classList.remove('hitstop-active'), 65);
        }

        if (impactFlash) {
          impactFlash.classList.add('impact-active');
          setTimeout(() => impactFlash && impactFlash.classList.remove('impact-active'), 140);
        }

        this._spawnShatterShards(shatterContainer);
        this.playBurstAudio(heroId, 'climax');

        const appEl = document.getElementById('app');
        if (appEl) {
          appEl.classList.remove('screen-shake-intense', 'screen-shake-light');
          void appEl.offsetWidth;
          appEl.classList.add('screen-shake-intense');
          setTimeout(() => appEl && appEl.classList.remove('screen-shake-intense'), 550);
        }
      }

      // Update & Render Genuine 3D WebGL Scene
      if (this.threeRenderer && this.threeScene && this.threeCamera) {
        this._updateHero3DScene(heroId, progress, elapsed, dt);
        this.threeRenderer.render(this.threeScene, this.threeCamera);
      }

      // Render 2D Speedlines & Flare Overlay
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this._draw2DOverlay(heroId, progress, elapsed, dt, particles);
      }

      if (progress < 1) {
        this.animId = requestAnimationFrame(render);
      } else {
        this._finishBurst();
      }
    };

    this.animId = requestAnimationFrame(render);
  },

  _spawnShatterShards(container) {
    if (!container) return;
    container.innerHTML = '';
    const shardCount = 18;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;

    for (let i = 0; i < shardCount; i++) {
      const shard = document.createElement('div');
      shard.className = 'shatter-shard shard-fly';
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 220 + Math.random() * (W * 0.45);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const rot = (Math.random() - 0.5) * 720;
      const w = 36 + Math.random() * 70;
      const h = 28 + Math.random() * 52;

      shard.style.left = `${cx}px`;
      shard.style.top = `${cy}px`;
      shard.style.width = `${w}px`;
      shard.style.height = `${h}px`;
      shard.style.setProperty('--tx', `${tx}px`);
      shard.style.setProperty('--ty', `${ty}px`);
      shard.style.setProperty('--rot', `${rot}deg`);
      shard.style.clipPath = `polygon(${Math.random() * 30}% 0%, 100% ${Math.random() * 40}%, ${60 + Math.random() * 40}% 100%, 0% ${70 + Math.random() * 30}%)`;

      container.appendChild(shard);
    }
  },

  _finishBurst() {
    this.active = false;
    if (this.animId) cancelAnimationFrame(this.animId);

    const overlay = document.getElementById('burst-cinematic-overlay');
    const arenaStage = document.getElementById('arena-stage');
    const actorStage = document.getElementById('burst-actor-stage');
    const eyeCutin = document.getElementById('burst-eye-cutin');
    const shatterContainer = document.getElementById('burst-shatter-container');

    if (eyeCutin) {
      eyeCutin.innerHTML = '';
      eyeCutin.classList.remove('cutin-active');
    }
    if (shatterContainer) shatterContainer.innerHTML = '';

    if (actorStage) {
      setTimeout(() => {
        actorStage.innerHTML = '';
        actorStage.classList.remove('actor-strike-exit');
      }, 200);
    }

    if (overlay) {
      overlay.classList.remove('hitstop-active');
      overlay.classList.add('burst-fade-out');
      setTimeout(() => {
        overlay.className = 'burst-overlay hidden';
        if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
        this._cleanHero3DScene();
      }, 250);
    }

    if (arenaStage) {
      arenaStage.style.transform = '';
      setTimeout(() => arenaStage.classList.remove('camera-3d-active'), 300);
    }
  },

  _apply3DCameraAngle(stage, heroId) {
    switch (heroId) {
      case 'hero_raiden':
        stage.style.transform = 'perspective(900px) rotateX(24deg) rotateY(-18deg) scale(1.35) translateZ(45px)';
        break;
      case 'hero_changli':
        stage.style.transform = 'perspective(900px) rotateX(18deg) rotateY(22deg) rotateZ(-4deg) scale(1.32)';
        break;
      case 'hero_unknown_god':
        stage.style.transform = 'perspective(800px) rotateX(32deg) rotateY(-12deg) rotateZ(8deg) scale(1.42)';
        break;
      case 'hero_zhongli':
        stage.style.transform = 'perspective(850px) rotateX(-22deg) translateY(-25px) scale(1.38)';
        break;
      case 'hero_furina':
        stage.style.transform = 'perspective(900px) rotateX(14deg) rotateY(-20deg) scale(1.3)';
        break;
      case 'hero_kazuha':
        stage.style.transform = 'perspective(850px) rotateX(26deg) rotateY(16deg) scale(1.36)';
        break;
      case 'hero_jiyan':
        stage.style.transform = 'perspective(900px) rotateX(15deg) rotateY(-18deg) rotateZ(6deg) scale(1.38)';
        break;
      case 'hero_amber':
        stage.style.transform = 'perspective(850px) rotateX(28deg) scale(1.32)';
        break;
      default:
        stage.style.transform = 'perspective(900px) rotateX(18deg) rotateZ(4deg) scale(1.34)';
        break;
    }
  },

  // ============================================================
  // GENUINE 3D WEBGL (THREE.JS) SCENE BUILDER FOR EACH HERO (x1000 GOD-TIER)
  // ============================================================
  _buildHero3DScene(heroId) {
    if (!this.threeScene || typeof THREE === 'undefined') return;
    this._cleanHero3DScene();

    const scene = this.threeScene;
    this.threeObjects = {};

    // 1. Universal Cosmic Starfield Backdrop (2000 3D Star Points)
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount * 3; s += 3) {
      starPos[s] = (Math.random() - 0.5) * 120;
      starPos[s + 1] = (Math.random() - 0.5) * 120;
      starPos[s + 2] = -40 - Math.random() * 60;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.85 });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);
    this.threeObjects.starfield = starfield;

    // 2. Base Directional & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    this.threeObjects.ambientLight = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);
    this.threeObjects.dirLight = dirLight;

    switch (heroId) {
      // ----------------------------------------------------
      // 1. ZHONGLI — 3D METEORITE ASTEROID, GEO STELE & 12 ERUPTING PILLARS
      // ----------------------------------------------------
      case 'hero_zhongli': {
        // Monumental Geo Stele Pillar
        const steleGeo = new THREE.BoxGeometry(2.6, 8.5, 0.9);
        const steleMat = new THREE.MeshStandardMaterial({
          color: 0x3e2723,
          roughness: 0.45,
          emissive: 0xffb300,
          emissiveIntensity: 0.9
        });
        const steleMesh = new THREE.Mesh(steleGeo, steleMat);
        steleMesh.position.set(0, -0.2, -4.5);
        scene.add(steleMesh);
        this.threeObjects.stele = steleMesh;

        // Concentric Ground Geo Glyph Rings
        const ringGeo = new THREE.RingGeometry(3.8, 7.2, 6);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(0, -4.5, 0);
        scene.add(ringMesh);
        this.threeObjects.groundRing = ringMesh;

        // Colossal 3D Faceted Asteroid
        const meteorGeo = new THREE.DodecahedronGeometry(4.2, 1);
        const meteorMat = new THREE.MeshStandardMaterial({
          color: 0xf57f17,
          roughness: 0.35,
          flatShading: true,
          emissive: 0xff8f00,
          emissiveIntensity: 2.4
        });
        const meteorMesh = new THREE.Mesh(meteorGeo, meteorMat);
        meteorMesh.position.set(14, 42, -14);
        scene.add(meteorMesh);
        this.threeObjects.meteor = meteorMesh;

        // 4 Orbiting Satellite Rocks around Meteor
        const satellites = [];
        for (let sat = 0; sat < 4; sat++) {
          const satGeo = new THREE.DodecahedronGeometry(0.8, 0);
          const satMat = new THREE.MeshStandardMaterial({ color: 0xffb300, emissive: 0xff6f00, emissiveIntensity: 2.0, flatShading: true });
          const satMesh = new THREE.Mesh(satGeo, satMat);
          meteorMesh.add(satMesh);
          satellites.push(satMesh);
        }
        this.threeObjects.satellites = satellites;

        // 12 Erupting 3D Hexagonal Basalt Pillars
        const pillars = [];
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const r = 6.5 + (i % 2) * 2;
          const pGeo = new THREE.CylinderGeometry(0.65, 0.95, 8.5, 6);
          const pMat = new THREE.MeshStandardMaterial({
            color: 0x4e342e,
            emissive: 0xffb300,
            emissiveIntensity: 1.1,
            flatShading: true
          });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.set(Math.cos(angle) * r, -14, Math.sin(angle) * r);
          scene.add(pMesh);
          pillars.push(pMesh);
        }
        this.threeObjects.pillars = pillars;

        // Flaring Golden Impact PointLight
        const impactLight = new THREE.PointLight(0xffd54f, 0, 60);
        impactLight.position.set(0, -3.5, 0);
        scene.add(impactLight);
        this.threeObjects.impactLight = impactLight;
        break;
      }

      // ----------------------------------------------------
      // 2. RAIDEN SHOGUN — 3D SPLIT SPACE GRID, 40 SHARDS & MUSOU LIGHTBLADE
      // ----------------------------------------------------
      case 'hero_raiden': {
        const grid1 = new THREE.GridHelper(36, 24, 0xd500f9, 0x4a148c);
        grid1.position.set(0, -1.2, 0);
        scene.add(grid1);
        this.threeObjects.grid1 = grid1;

        const grid2 = new THREE.GridHelper(36, 24, 0x00ffff, 0x311b92);
        grid2.position.set(0, 1.2, 0);
        scene.add(grid2);
        this.threeObjects.grid2 = grid2;

        // 40 3D Spatial Glass Mirror Shards that scatter on slash
        const shards = [];
        for (let sh = 0; sh < 40; sh++) {
          const sGeo = new THREE.BoxGeometry(0.8 + Math.random() * 1.2, 0.1, 0.8 + Math.random() * 1.2);
          const sMat = new THREE.MeshBasicMaterial({ color: sh % 2 === 0 ? 0xe040fb : 0x00ffff, transparent: true, opacity: 0.7, wireframe: true });
          const sMesh = new THREE.Mesh(sGeo, sMat);
          sMesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 10);
          sMesh.userData = {
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            vz: (Math.random() - 0.5) * 12,
            vRot: (Math.random() - 0.5) * 5
          };
          scene.add(sMesh);
          shards.push(sMesh);
        }
        this.threeObjects.shards = shards;

        // 3D Colossal Musou Blade Beam Torus Wave
        const bladeGeo = new THREE.TorusGeometry(9.5, 0.5, 16, 140, Math.PI * 0.9);
        const bladeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending });
        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
        bladeMesh.rotation.z = -Math.PI / 4;
        bladeMesh.position.set(0, 0, -2);
        bladeMesh.scale.set(0, 0, 0);
        scene.add(bladeMesh);
        this.threeObjects.blade = bladeMesh;

        // 3D Mitsudomoe Halo
        const torusGeo = new THREE.TorusGeometry(4.2, 0.2, 16, 64);
        const torusMat = new THREE.MeshBasicMaterial({ color: 0xd500f9, blending: THREE.AdditiveBlending });
        const torusMesh = new THREE.Mesh(torusGeo, torusMat);
        torusMesh.position.set(0, 0, -3.5);
        scene.add(torusMesh);
        this.threeObjects.torus = torusMesh;
        break;
      }

      // ----------------------------------------------------
      // 3. FURINA — 3D OPERA REFLECTIVE STAGE, 6 LIGHT CONES & DOLPHINS
      // ----------------------------------------------------
      case 'hero_furina': {
        const floorGeo = new THREE.PlaneGeometry(40, 40);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x01579b, roughness: 0.1, metalness: 0.85 });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set(0, -3.8, 0);
        scene.add(floorMesh);
        this.threeObjects.floor = floorMesh;

        // 6 Volumetric Spotlight Cones
        const spotlights = [];
        for (let s = 0; s < 6; s++) {
          const coneGeo = new THREE.ConeGeometry(3.8, 28, 32, 1, true);
          const coneMat = new THREE.MeshBasicMaterial({
            color: s % 2 === 0 ? 0x00e5ff : 0x81d4fa,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          });
          const coneMesh = new THREE.Mesh(coneGeo, coneMat);
          coneMesh.position.set((s - 2.5) * 4.5, 9, -2);
          coneMesh.rotation.x = Math.PI;
          scene.add(coneMesh);
          spotlights.push(coneMesh);
        }
        this.threeObjects.spotlights = spotlights;

        // 2 3D Leaping Water Spirit Dolphins
        const dolphins = [];
        for (let d = 0; d < 2; d++) {
          const dGeo = new THREE.ConeGeometry(0.8, 3.2, 12);
          const dMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, blending: THREE.AdditiveBlending });
          const dMesh = new THREE.Mesh(dGeo, dMat);
          dMesh.position.set((d === 0 ? -5 : 5), -3.8, 0);
          scene.add(dMesh);
          dolphins.push(dMesh);
        }
        this.threeObjects.dolphins = dolphins;

        // 80 Floating 3D Bubble Spheres
        const bubbles = [];
        for (let b = 0; b < 80; b++) {
          const bGeo = new THREE.SphereGeometry(Math.random() * 0.45 + 0.15, 16, 16);
          const bMat = new THREE.MeshBasicMaterial({ color: 0x80deea, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set((Math.random() - 0.5) * 22, -3.5 + Math.random() * 9, (Math.random() - 0.5) * 16);
          scene.add(bMesh);
          bubbles.push(bMesh);
        }
        this.threeObjects.bubbles = bubbles;
        break;
      }

      // ----------------------------------------------------
      // 4. KAZUHA — 400+ 3D JAPANESE MOMIJI MAPLE LEAVES & IAIDO ARC
      // ----------------------------------------------------
      case 'hero_kazuha': {
        const leaves = [];
        const leafGeo = new THREE.PlaneGeometry(0.6, 0.6);
        for (let l = 0; l < 260; l++) {
          const leafMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.45 ? 0xd32f2f : 0xff5722,
            side: THREE.DoubleSide
          });
          const leafMesh = new THREE.Mesh(leafGeo, leafMat);
          leafMesh.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 20);
          leafMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          leafMesh.userData = {
            rotSpeed: (Math.random() - 0.5) * 5,
            speedY: Math.random() * 2.5 + 1.2,
            speedX: (Math.random() - 0.5) * 3.5
          };
          scene.add(leafMesh);
          leaves.push(leafMesh);
        }
        this.threeObjects.leaves = leaves;

        // 3D Iaido Slash Torus
        const arcGeo = new THREE.TorusGeometry(7.5, 0.28, 16, 120, Math.PI * 1.6);
        const arcMat = new THREE.MeshBasicMaterial({ color: 0xff1744, blending: THREE.AdditiveBlending });
        const arcMesh = new THREE.Mesh(arcGeo, arcMat);
        arcMesh.rotation.x = Math.PI / 2;
        arcMesh.scale.set(0, 0, 0);
        scene.add(arcMesh);
        this.threeObjects.slashArc = arcMesh;
        break;
      }

      // ----------------------------------------------------
      // 5. CHANGLI — 3D FLAMING PHOENIX BIRD WITH WING OSCILLATION
      // ----------------------------------------------------
      case 'hero_changli': {
        const phoenixGroup = new THREE.Group();

        // Phoenix Fuselage Core
        const bodyGeo = new THREE.ConeGeometry(1.4, 4.5, 16);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b, blending: THREE.AdditiveBlending });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.rotation.x = -Math.PI / 3;
        phoenixGroup.add(bodyMesh);

        // Huge Multi-Segmented Wings
        const lWingGeo = new THREE.PlaneGeometry(7.5, 3.2);
        const wingMat = new THREE.MeshBasicMaterial({ color: 0xff1744, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const lWing = new THREE.Mesh(lWingGeo, wingMat);
        lWing.position.set(-4.5, 0, 0);
        phoenixGroup.add(lWing);
        this.threeObjects.lWing = lWing;

        const rWing = new THREE.Mesh(lWingGeo, wingMat);
        rWing.position.set(4.5, 0, 0);
        phoenixGroup.add(rWing);
        this.threeObjects.rWing = rWing;

        phoenixGroup.position.set(0, 18, -12);
        scene.add(phoenixGroup);
        this.threeObjects.phoenix = phoenixGroup;
        break;
      }

      // ----------------------------------------------------
      // 6. THIÊN LÝ — 12 3D VOID TESSERACT HYPERCUBES & ACCRETION DISK
      // ----------------------------------------------------
      case 'hero_unknown_god': {
        const cubes = [];
        for (let i = 0; i < 12; i++) {
          const cGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
          const cMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x00ffff : 0xff0055,
            wireframe: true
          });
          const cMesh = new THREE.Mesh(cGeo, cMat);
          scene.add(cMesh);
          cubes.push(cMesh);
        }
        this.threeObjects.cubes = cubes;

        // Singularity Black Hole Sphere
        const holeGeo = new THREE.SphereGeometry(2.2, 32, 32);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const holeMesh = new THREE.Mesh(holeGeo, holeMat);
        scene.add(holeMesh);
        this.threeObjects.blackHole = holeMesh;

        // Accretion Disk
        const diskGeo = new THREE.RingGeometry(2.4, 5.5, 64);
        const diskMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const diskMesh = new THREE.Mesh(diskGeo, diskMat);
        diskMesh.rotation.x = Math.PI / 2.4;
        scene.add(diskMesh);
        this.threeObjects.disk = diskMesh;
        break;
      }

      // ----------------------------------------------------
      // 7. JIYAN — 36-SEGMENT QINGLOONG DRAGON & 30 EMERALD SPEARS
      // ----------------------------------------------------
      case 'hero_jiyan': {
        const dragonSegments = [];
        for (let s = 0; s < 36; s++) {
          const sGeo = new THREE.DodecahedronGeometry(1.8 - s * 0.035, 0);
          const sMat = new THREE.MeshStandardMaterial({
            color: s === 0 ? 0x004d40 : 0x00bfa5,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.9,
            flatShading: true
          });
          const sMesh = new THREE.Mesh(sGeo, sMat);
          sMesh.position.set(-18 + s * 1.1, 0, -4);
          scene.add(sMesh);
          dragonSegments.push(sMesh);
        }
        this.threeObjects.dragon = dragonSegments;

        // 30 3D Emerald Wind Spears
        const spears = [];
        for (let sp = 0; sp < 30; sp++) {
          const spGeo = new THREE.CylinderGeometry(0.08, 0.28, 5, 6);
          const spMat = new THREE.MeshBasicMaterial({ color: 0x64ffda, blending: THREE.AdditiveBlending });
          const spMesh = new THREE.Mesh(spGeo, spMat);
          spMesh.rotation.z = Math.PI / 3;
          spMesh.position.set((Math.random() - 0.5) * 18, Math.random() * 9, -2);
          scene.add(spMesh);
          spears.push(spMesh);
        }
        this.threeObjects.spears = spears;
        break;
      }

      // ----------------------------------------------------
      // 8. AMBER — 3D HOLOGRAPHIC RADAR & 48 ARTILLERY ROCKETS
      // ----------------------------------------------------
      case 'hero_amber': {
        const radarGeo = new THREE.RingGeometry(2.5, 7.5, 48);
        const radarMat = new THREE.MeshBasicMaterial({ color: 0xff5722, side: THREE.DoubleSide, wireframe: true });
        const radarMesh = new THREE.Mesh(radarGeo, radarMat);
        radarMesh.rotation.x = Math.PI / 2;
        radarMesh.position.set(0, -3.8, 0);
        scene.add(radarMesh);
        this.threeObjects.radar = radarMesh;

        // 48 Rockets
        const rockets = [];
        for (let r = 0; r < 48; r++) {
          const rGeo = new THREE.ConeGeometry(0.28, 1.8, 8);
          const rMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
          const rMesh = new THREE.Mesh(rGeo, rMat);
          rMesh.rotation.x = Math.PI;
          rMesh.position.set((Math.random() - 0.5) * 18, 20 + Math.random() * 14, (Math.random() - 0.5) * 9);
          scene.add(rMesh);
          rockets.push(rMesh);
        }
        this.threeObjects.rockets = rockets;
        break;
      }

      // ----------------------------------------------------
      // 9. TRAVELER — 3D PRIMOGEM STAR & DUAL-GALAXY CYCLONE (1500 GPU PARTICLES)
      // ----------------------------------------------------
      default: {
        const starGeo = new THREE.OctahedronGeometry(2.4, 0);
        const starMat = new THREE.MeshBasicMaterial({ color: 0xffd54f, wireframe: true });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        scene.add(starMesh);
        this.threeObjects.star = starMesh;

        // 1500 GPU Galaxy Points
        const pCount = 1500;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(pCount * 3);
        const colors = new Float32Array(pCount * 3);

        for (let i = 0; i < pCount; i++) {
          const i3 = i * 3;
          const r = Math.random() * 14 + 0.5;
          const theta = r * 1.5 + (i % 2 === 0 ? 0 : Math.PI);
          positions[i3] = Math.cos(theta) * r;
          positions[i3 + 1] = (Math.random() - 0.5) * 2.2;
          positions[i3 + 2] = Math.sin(theta) * r;

          if (i % 2 === 0) {
            colors[i3] = 0; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1; // Cyan
          } else {
            colors[i3] = 1; colors[i3 + 1] = 0.85; colors[i3 + 2] = 0.2; // Amber
          }
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const pMat = new THREE.PointsMaterial({
          size: 0.25,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          transparent: true
        });

        const galaxyPoints = new THREE.Points(pGeo, pMat);
        galaxyPoints.rotation.x = Math.PI / 3.8;
        scene.add(galaxyPoints);
        this.threeObjects.galaxy = galaxyPoints;
        break;
      }
    }
  },

  // ============================================================
  // UPDATE 3D SCENE & 6DOF CAMERA AT 60-144 FPS
  // ============================================================
  _updateHero3DScene(heroId, progress, elapsed, dt) {
    if (!this.threeCamera || !this.threeObjects) return;
    const camera = this.threeCamera;
    const obj = this.threeObjects;

    // Starfield slow drift
    if (obj.starfield) obj.starfield.rotation.z += dt * 0.05;

    switch (heroId) {
      // 1. Zhongli 3D Updates
      case 'hero_zhongli': {
        // Dramatic crane camera motion
        camera.position.set(0, -1.2 + progress * 2.4, 11 - progress * 2.2);
        camera.lookAt(0, 0, 0);

        if (obj.groundRing) obj.groundRing.rotation.z += dt * 0.45;
        if (obj.stele) obj.stele.rotation.y = Math.sin(elapsed * 0.001) * 0.06;

        // Meteor falls with satellite rotation
        if (obj.meteor && progress > 0.35) {
          const fallP = Math.min(1, (progress - 0.35) / 0.38);
          obj.meteor.position.set(14 - fallP * 14, 42 - fallP * 46, -14 + fallP * 14);
          obj.meteor.rotation.x += dt * 2.4;
          obj.meteor.rotation.y += dt * 3.2;

          if (obj.satellites) {
            obj.satellites.forEach((sat, sIdx) => {
              const a = elapsed * 0.005 + (sIdx / 4) * Math.PI * 2;
              sat.position.set(Math.cos(a) * 6, Math.sin(a) * 3, Math.sin(a) * 6);
            });
          }
        }

        // Impact Climax
        if (progress > 0.65) {
          const impactP = (progress - 0.65) / 0.35;
          if (obj.impactLight) obj.impactLight.intensity = (1 - impactP) * 20;
          if (obj.pillars) {
            obj.pillars.forEach((p, idx) => {
              p.position.y = -14 + Math.min(14, impactP * 16.5);
              p.rotation.z = Math.sin(idx) * 0.08;
            });
          }
        }
        break;
      }

      // 2. Raiden 3D Updates
      case 'hero_raiden': {
        camera.position.set(Math.sin(elapsed * 0.0015) * 2.5, 0, 9.5);
        camera.lookAt(0, 0, 0);

        if (obj.torus) obj.torus.rotation.z += dt * 2.2;

        if (progress > 0.35) {
          const splitP = (progress - 0.35) / 0.65;
          if (obj.grid1) obj.grid1.position.set(-splitP * 8.5, -1.2 + splitP * 4.5, -splitP * 3.5);
          if (obj.grid2) obj.grid2.position.set(splitP * 8.5, 1.2 - splitP * 4.5, splitP * 3.5);

          if (obj.shards) {
            obj.shards.forEach(sh => {
              sh.position.x += sh.userData.vx * dt;
              sh.position.y += sh.userData.vy * dt;
              sh.position.z += sh.userData.vz * dt;
              sh.rotation.x += sh.userData.vRot * dt;
            });
          }

          if (obj.blade) {
            const bScale = Math.sin(splitP * Math.PI) * 1.8;
            obj.blade.scale.set(bScale, bScale, bScale);
          }
        }
        break;
      }

      // 3. Furina 3D Updates
      case 'hero_furina': {
        camera.position.set(Math.sin(elapsed * 0.002) * 3.5, 0, 11.5);
        camera.lookAt(0, 0, 0);

        if (obj.spotlights) {
          obj.spotlights.forEach((cone, idx) => {
            cone.rotation.z = Math.sin(elapsed * 0.003 + idx * 0.8) * 0.4;
          });
        }
        if (obj.bubbles) {
          obj.bubbles.forEach(b => {
            b.position.y += dt * 3.4;
            if (b.position.y > 8) b.position.y = -3.8;
          });
        }
        if (obj.dolphins && progress > 0.35) {
          const dP = (progress - 0.35) / 0.65;
          const arc = dP * Math.PI * 2;
          obj.dolphins[0].position.set(-5 + Math.sin(arc) * 5, -3.8 + Math.sin(dP * Math.PI) * 6, Math.cos(arc) * 3);
          obj.dolphins[1].position.set(5 - Math.sin(arc) * 5, -3.8 + Math.sin(dP * Math.PI) * 6, -Math.cos(arc) * 3);
        }
        break;
      }

      // 4. Kazuha 3D Updates
      case 'hero_kazuha': {
        camera.position.set(0, -1.2 + Math.sin(progress * Math.PI) * 2.2, 8.5);
        camera.lookAt(0, 0, 0);

        if (obj.leaves) {
          obj.leaves.forEach(l => {
            l.rotation.x += l.userData.rotSpeed * dt;
            l.rotation.y += l.userData.rotSpeed * dt;
            l.position.y -= l.userData.speedY * dt;
            l.position.x += l.userData.speedX * dt;
            if (l.position.y < -8) l.position.y = 9;
          });
        }

        if (obj.slashArc && progress > 0.35) {
          const slashP = (progress - 0.35) / 0.65;
          const s = slashP * 2.0;
          obj.slashArc.scale.set(s, s, s);
        }
        break;
      }

      // 5. Changli 3D Updates
      case 'hero_changli': {
        camera.position.set(0, 4.5 - progress * 4.5, 11);
        camera.lookAt(0, 0, 0);

        if (obj.phoenix) {
          obj.phoenix.position.y = 18 - progress * 20;
          obj.phoenix.rotation.z = Math.sin(elapsed * 0.005) * 0.18;
        }
        if (obj.lWing) obj.lWing.rotation.z = Math.sin(elapsed * 0.016) * 0.35;
        if (obj.rWing) obj.rWing.rotation.z = -Math.sin(elapsed * 0.016) * 0.35;
        break;
      }

      // 6. Thiên Lý 3D Updates
      case 'hero_unknown_god': {
        camera.position.set(Math.sin(elapsed * 0.002) * 2.2, Math.cos(elapsed * 0.002) * 2.2, 8.5);
        camera.lookAt(0, 0, 0);

        if (obj.cubes) {
          const converge = progress > 0.35 ? (progress - 0.35) / 0.65 : 0;
          const dist = Math.max(0.6, (1 - converge * 1.25) * 7);
          obj.cubes.forEach((c, i) => {
            const angle = (i / 12) * Math.PI * 2 + elapsed * 0.003;
            c.position.set(Math.cos(angle) * dist, Math.sin(angle * 2) * (dist * 0.5), Math.sin(angle) * dist);
            c.rotation.x += dt * 3.2;
            c.rotation.y += dt * 3.2;
          });
        }
        if (obj.disk) obj.disk.rotation.z += dt * 2.8;
        break;
      }

      // 7. Jiyan 3D Updates
      case 'hero_jiyan': {
        camera.position.set(-3.5 + progress * 7, 0, 8.5);
        camera.lookAt(0, 0, 0);

        if (obj.dragon) {
          const leadX = -9 + progress * 18;
          obj.dragon.forEach((seg, idx) => {
            const t = idx / 36;
            seg.position.x = leadX - t * 16;
            seg.position.y = Math.sin(elapsed * 0.006 + t * 4.5) * 2.8;
            seg.rotation.z = Math.cos(elapsed * 0.006 + t * 4.5) * 0.35;
          });
        }
        if (obj.spears) {
          obj.spears.forEach(sp => {
            sp.position.x += dt * 18;
            if (sp.position.x > 14) sp.position.x = -14;
          });
        }
        break;
      }

      // 8. Amber 3D Updates
      case 'hero_amber': {
        camera.position.set(0, 3.2, 10.5);
        camera.lookAt(0, -1, 0);

        if (obj.radar) obj.radar.rotation.z += dt * 1.6;
        if (obj.rockets && progress > 0.35) {
          obj.rockets.forEach(r => {
            r.position.y -= dt * 25;
            if (r.position.y < -3.8) r.position.y = 18;
          });
        }
        break;
      }

      // 9. Traveler 3D Updates
      default: {
        camera.position.set(0, 2.2, 9.5);
        camera.lookAt(0, 0, 0);

        if (obj.star) {
          obj.star.rotation.x += dt * 1.6;
          obj.star.rotation.y += dt * 2.2;
        }
        if (obj.galaxy) {
          obj.galaxy.rotation.y += dt * 1.4;
        }
        break;
      }
    }
  },

  _cleanHero3DScene() {
    if (!this.threeScene) return;
    while (this.threeScene.children.length > 0) {
      const obj = this.threeScene.children[0];
      this.threeScene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
    this.threeObjects = {};
  },

  // ============================================================
  // 2D CANVAS SPEEDLINES & ANIME FLARE OVERLAY
  // ============================================================
  _draw2DOverlay(heroId, progress, elapsed, dt, particles) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const cx = W / 2;
    const cy = H / 2;

    // Anime Action Speedlines during martial preparation (Phase 1)
    if (progress < 0.38) {
      ctx.save();
      ctx.strokeStyle = heroId === 'hero_raiden' ? '#d500f9' : (heroId === 'hero_zhongli' ? '#ffd54f' : '#ffffff');
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1.6;
      const lines = 36;
      for (let i = 0; i < lines; i++) {
        const angle = (i / lines) * Math.PI * 2 + (Math.sin(elapsed * 0.02 + i) * 0.05);
        const innerR = 80 + (i % 5) * 15;
        const outerR = Math.max(W, H) * 0.75;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2D Floating Ambient Embers with Additive Bloom
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
      ctx.fillStyle = p.extra > 0.5 ? '#ffffff' : '#ffd700';
      ctx.fillRect(p.x, p.y, p.size, p.size);
      p.x += p.vx * dt * 38;
      p.y += p.vy * dt * 38;
    });
    ctx.restore();
  },

  _createParticlesForHero(heroId) {
    const W = this.width || 800;
    const H = this.height || 600;
    const particles = [];
    const count = 95;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * W * 0.95,
        y: H * 0.5 + (Math.random() - 0.5) * H * 0.95,
        vx: (Math.random() - 0.5) * 8.5,
        vy: (Math.random() - 0.5) * 8.5,
        size: Math.random() * 4.2 + 1.5,
        extra: Math.random()
      });
    }
    return particles;
  }
};

document.addEventListener('DOMContentLoaded', () => Cinematics.init());
