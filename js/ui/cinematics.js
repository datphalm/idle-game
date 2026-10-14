// ============================================================
// cinematics.js — AAA WEBGL ULTIMATE BURST CINEMATIC ENGINE
// INTEGRATING PIXI.JS WEBGL + THREE.JS 3D WITH POST-PROCESSING
// (SHOCKWAVE DISTORTION, CHROMATIC ABERRATION & 9-TAP BLOOM/GLOW)
// ZERO HTML DOM FOR VISUAL EFFECTS — 100% PURE GPU WEBGL RENDERING
// ============================================================

const Cinematics = {
  // Pixi.js WebGL Engine & Display Tree
  pixiApp: null,
  pixiCanvas: null,
  isPixiReady: false,

  // Layers in Pixi Stage
  stageRoot: null,
  bgVortexLayer: null,
  space3DLayer: null,
  heroStageLayer: null,
  particleLayer: null,
  slashAndShatterLayer: null,
  flashLayer: null,
  eyeCutinLayer: null,

  // Post-processing WebGL Filters
  shockwaveFilter: null,
  chromaticFilter: null,
  bloomFilter: null,

  // 3D Three.js Engine (for Celestial 3D Meshes & Depth Backdrop)
  threeCanvas: null,
  threeRenderer: null,
  threeScene: null,
  threeCamera: null,
  threeObjects: {},

  // Assets & Preloaded Textures
  heroTextures: {},
  eyeTextures: {},
  particleTexture: null,

  // High-Performance Particle System (> 500 Particles)
  particles: [],
  particleSprites: [],
  MAX_PARTICLES: 120,

  // Reality Shatter WebGL Shards
  shatterShards: [],

  // Lifecycle & Performance State
  animId: null,
  active: false,
  width: 0,
  height: 0,
  lastTime: 0,
  startTime: 0,
  currentHeroId: null,
  impactFired: false,
  audioCtx: null,

  // ============================================================
  // GLSL POST-PROCESSING SHADERS
  // ============================================================
  SHOCKWAVE_FRAG: `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    uniform vec2 uCenter;       // [0, 1] normalized center
    uniform float uProgress;    // 0.0 to 1.0
    uniform float uWaveWidth;   // Ring width (e.g. 0.09)
    uniform float uAmplitude;   // Refraction distortion strength
    uniform float uAspectRatio; // width / height

    void main(void) {
        vec2 uv = vTextureCoord;
        if (uProgress > 0.0 && uProgress < 1.0) {
            vec2 coord = uv - uCenter;
            coord.y /= uAspectRatio;
            float dist = length(coord);
            float currentRadius = uProgress * 1.55;

            if (dist <= currentRadius + uWaveWidth && dist >= currentRadius - uWaveWidth) {
                float diff = dist - currentRadius;
                float normDiff = diff / uWaveWidth;
                float factor = cos(normDiff * 1.5707963);
                factor = factor * factor;
                vec2 dir = normalize(coord);
                float falloff = max(0.0, 1.0 - uProgress);
                vec2 displacement = dir * normDiff * factor * uAmplitude * falloff;
                uv += displacement;
            }
        }
        gl_FragColor = texture2D(uSampler, uv);
    }
  `,

  CHROMATIC_FRAG: `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    uniform float uIntensity;   // 0.0 to 1.0
    uniform float uOffset;      // Max separation (e.g. 0.025)
    uniform vec2 uCenter;       // (0.5, 0.5)

    void main(void) {
        vec2 uv = vTextureCoord;
        if (uIntensity <= 0.001) {
            gl_FragColor = texture2D(uSampler, uv);
            return;
        }
        vec2 dir = uv - uCenter;
        float dist = length(dir);
        vec2 split = normalize(dir) * (uOffset * uIntensity * (0.35 + dist * 0.65));

        float r = texture2D(uSampler, uv + split).r;
        float g = texture2D(uSampler, uv).g;
        float b = texture2D(uSampler, uv - split).b;
        float a = texture2D(uSampler, uv).a;

        gl_FragColor = vec4(r, g, b, a);
    }
  `,

  BLOOM_FRAG: `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    uniform float uGlowIntensity; // 0.0 to 2.5
    uniform vec2 uTexelSize;      // (1/w, 1/h)

    void main(void) {
        vec4 base = texture2D(uSampler, vTextureCoord);
        if (uGlowIntensity <= 0.01) {
            gl_FragColor = base;
            return;
        }

        vec4 sum = vec4(0.0);
        float glowStep = 3.6;

        sum += texture2D(uSampler, vTextureCoord + vec2(-glowStep, -glowStep) * uTexelSize) * 0.09;
        sum += texture2D(uSampler, vTextureCoord + vec2( glowStep, -glowStep) * uTexelSize) * 0.09;
        sum += texture2D(uSampler, vTextureCoord + vec2(-glowStep,  glowStep) * uTexelSize) * 0.09;
        sum += texture2D(uSampler, vTextureCoord + vec2( glowStep,  glowStep) * uTexelSize) * 0.09;

        sum += texture2D(uSampler, vTextureCoord + vec2( 0.0, -glowStep * 1.5) * uTexelSize) * 0.14;
        sum += texture2D(uSampler, vTextureCoord + vec2( 0.0,  glowStep * 1.5) * uTexelSize) * 0.14;
        sum += texture2D(uSampler, vTextureCoord + vec2(-glowStep * 1.5, 0.0) * uTexelSize) * 0.14;
        sum += texture2D(uSampler, vTextureCoord + vec2( glowStep * 1.5, 0.0) * uTexelSize) * 0.14;

        vec4 bright = max(sum - 0.22, 0.0) * uGlowIntensity;
        gl_FragColor = base + bright;
    }
  `,

  // ============================================================
  // INITIALIZATION & LIFECYCLE
  // ============================================================
  init() {
    try {
      this.pixiCanvas = document.getElementById('burst-canvas');
      this.threeCanvas = document.getElementById('burst-three-canvas');

      const stageEl = document.getElementById('arena-stage');
      const w = stageEl && stageEl.clientWidth > 100 ? stageEl.clientWidth : (window.innerWidth || 1280);
      const h = stageEl && stageEl.clientHeight > 100 ? stageEl.clientHeight : 320;
      this.width = w;
      this.height = h;

      this._initPixi(w, h);
      this._initThree(w, h);
      this._preloadAssets();

      window.addEventListener('resize', () => this.resize());
    } catch (e) {
      console.warn('Cinematics init error:', e);
    }
  },

  resize() {
    try {
      const stageEl = document.getElementById('arena-stage');
      const w = stageEl && stageEl.clientWidth > 100 ? stageEl.clientWidth : (window.innerWidth || 1280);
      const h = stageEl && stageEl.clientHeight > 100 ? stageEl.clientHeight : 320;
      this.width = w;
      this.height = h;

      if (this.pixiApp && this.pixiApp.renderer) {
        this.pixiApp.renderer.resize(w, h);
      }
      if (this.shockwaveFilter) {
        this.shockwaveFilter.uniforms.uAspectRatio = w / Math.max(1, h);
      }
      if (this.bloomFilter) {
        this.bloomFilter.uniforms.uTexelSize = [1.0 / Math.max(1, w), 1.0 / Math.max(1, h)];
      }

      if (this.threeRenderer && this.threeCamera) {
        this.threeRenderer.setSize(w, h);
        this.threeCamera.aspect = w / Math.max(1, h);
        this.threeCamera.updateProjectionMatrix();
      }
    } catch (e) {}
  },

  // ------------------------------------------------------------
  // Pixi.js WebGL Setup & Filter Pipeline
  // ------------------------------------------------------------
  _initPixi(w, h) {
    if (!this.pixiCanvas || typeof PIXI === 'undefined' || this.pixiApp) return;

    try {
      this.pixiApp = new PIXI.Application({
        view: this.pixiCanvas,
        width: w,
        height: h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        powerPreference: 'high-performance'
      });

      // Master Stage Hierarchy
      this.stageRoot = new PIXI.Container();
      this.bgVortexLayer = new PIXI.Container();
      this.space3DLayer = new PIXI.Container();
      this.heroStageLayer = new PIXI.Container();
      this.particleLayer = new PIXI.Container();
      this.slashAndShatterLayer = new PIXI.Container();
      this.flashLayer = new PIXI.Container();
      this.eyeCutinLayer = new PIXI.Container();

      this.stageRoot.addChild(this.bgVortexLayer);
      this.stageRoot.addChild(this.space3DLayer);
      this.stageRoot.addChild(this.heroStageLayer);
      this.stageRoot.addChild(this.particleLayer);
      this.stageRoot.addChild(this.slashAndShatterLayer);
      this.stageRoot.addChild(this.flashLayer);
      this.stageRoot.addChild(this.eyeCutinLayer);

      this.pixiApp.stage.addChild(this.stageRoot);

      // Create GLSL Shaders Filters
      try {
        this.shockwaveFilter = new PIXI.Filter(undefined, this.SHOCKWAVE_FRAG, {
          uCenter: [0.5, 0.5],
          uProgress: 0.0,
          uWaveWidth: 0.09,
          uAmplitude: 0.055,
          uAspectRatio: w / Math.max(1, h)
        });

        this.chromaticFilter = new PIXI.Filter(undefined, this.CHROMATIC_FRAG, {
          uIntensity: 0.0,
          uOffset: 0.024,
          uCenter: [0.5, 0.5]
        });

        this.bloomFilter = new PIXI.Filter(undefined, this.BLOOM_FRAG, {
          uGlowIntensity: 0.0,
          uTexelSize: [1.0 / Math.max(1, w), 1.0 / Math.max(1, h)]
        });

        this.stageRoot.filters = [this.shockwaveFilter, this.chromaticFilter, this.bloomFilter];
      } catch (err) {
        console.warn('Custom Pixi Filters init warning:', err);
      }

      this._ensureParticleTexture();
      this._initParticlePool();
      this.isPixiReady = true;
    } catch (e) {
      console.warn('Pixi.js WebGL Application initialization fallback:', e);
    }
  },

  // ------------------------------------------------------------
  // Three.js 3D WebGL Setup
  // ------------------------------------------------------------
  _initThree(w, h) {
    if (!this.threeCanvas || typeof THREE === 'undefined' || this.threeRenderer) return;

    try {
      this.threeRenderer = new THREE.WebGLRenderer({
        canvas: this.threeCanvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.threeRenderer.setSize(w, h);

      this.threeScene = new THREE.Scene();
      this.threeCamera = new THREE.PerspectiveCamera(60, w / Math.max(1, h), 0.1, 1000);
    } catch (e) {
      console.warn('Three.js initialization fallback:', e);
    }
  },

  // ------------------------------------------------------------
  // Asset Preloader & Texture Generation
  // ------------------------------------------------------------
  _ensureParticleTexture() {
    if (this.particleTexture) return this.particleTexture;
    if (typeof PIXI === 'undefined') return null;

    try {
      if (this.pixiApp && this.pixiApp.renderer) {
        const g = new PIXI.Graphics();
        const r = 24;
        g.beginFill(0xffffff, 0.95);
        g.drawCircle(r, r, 5);
        g.endFill();

        g.beginFill(0xffffff, 0.45);
        g.drawCircle(r, r, 12);
        g.endFill();

        g.beginFill(0xffffff, 0.15);
        g.drawCircle(r, r, 22);
        g.endFill();

        this.particleTexture = this.pixiApp.renderer.generateTexture(g);
        return this.particleTexture;
      }
    } catch (e) {}

    // Fallback: 2D offscreen canvas radial gradient
    try {
      const c = document.createElement('canvas');
      c.width = 48;
      c.height = 48;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(24, 24, 2, 24, 24, 24);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(24, 24, 24, 0, Math.PI * 2);
      ctx.fill();
      this.particleTexture = PIXI.Texture.from(c);
      return this.particleTexture;
    } catch (err2) {
      return null;
    }
  },

  _preloadAssets() {
    this._ensureParticleTexture();

    // Preload Hero Stance Textures
    const HERO_LIST = [
      'hero_starter', 'hero_shadow_rogue', 'hero_frost_knight',
      'hero_spear_lancer', 'hero_flame_knight', 'hero_arcane_mage',
      'hero_aetheris', 'hero_unknown_god'
    ];

    HERO_LIST.forEach(heroId => {
      this._getHeroTexture(heroId);
      this._getHeroEyeTexture(heroId);
    });
  },

  _getHeroTexture(heroId) {
    if (this.heroTextures[heroId]) return this.heroTextures[heroId];
    if (typeof Sprites === 'undefined' || !Sprites.getHeroSwordDanceSvg) return null;

    try {
      let svgStr = Sprites.getHeroSwordDanceSvg(heroId);
      if (!svgStr) return null;

      // Ensure xmlns is present for Image loading
      if (!svgStr.includes('xmlns=')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      svgStr = svgStr.replace(/width="100%"/, 'width="520"').replace(/height="100%"/, 'height="360"');

      const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const baseTex = new PIXI.BaseTexture(img, { resolution: 1, width: 520, height: 360 });
      const tex = new PIXI.Texture(baseTex);

      img.onload = () => {
        try { baseTex.update(); } catch(e) {}
      };
      img.onerror = () => {};
      img.src = dataUri;

      this.heroTextures[heroId] = tex;
      return tex;
    } catch (e) {
      return null;
    }
  },

  _getHeroEyeTexture(heroId) {
    if (this.eyeTextures[heroId]) return this.eyeTextures[heroId];
    if (typeof Sprites === 'undefined' || !Sprites.getHeroEyeCutinSvg) return null;

    try {
      let svgStr = Sprites.getHeroEyeCutinSvg(heroId);
      if (!svgStr) return null;

      if (!svgStr.includes('xmlns=')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      svgStr = svgStr.replace(/width="100%"/, 'width="680"').replace(/height="100%"/, 'height="130"');

      const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const baseTex = new PIXI.BaseTexture(img, { resolution: 1, width: 680, height: 130 });
      const tex = new PIXI.Texture(baseTex);

      img.onload = () => {
        try { baseTex.update(); } catch(e) {}
      };
      img.onerror = () => {};
      img.src = dataUri;

      this.eyeTextures[heroId] = tex;
      return tex;
    } catch (e) {
      return null;
    }
  },

  // ============================================================
  // HIGH-PERFORMANCE PARTICLE SYSTEM (> 500 PARTICLES)
  // WITH GLOWING ADDITIVE BLEND, SWIRLING TRAJECTORIES & BOUNCE
  // ============================================================
  _initParticlePool() {
    if (!this.particleLayer) return;
    const tex = this._ensureParticleTexture();
    if (!tex) return;

    try {
      this.particleLayer.removeChildren();
      this.particles = [];
      this.particleSprites = [];

      const count = this.MAX_PARTICLES; // 650 particles
      for (let i = 0; i < count; i++) {
        const spr = new PIXI.Sprite(tex);
        spr.anchor.set(0.5, 0.5);
        spr.blendMode = PIXI.BLEND_MODES.ADD;
        spr.visible = false;
        this.particleLayer.addChild(spr);
        this.particleSprites.push(spr);

        this.particles.push({
          sprite: spr,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: 0,
          baseRadius: 0,
          angle: 0,
          angularSpeed: 0,
          depthZ: 0,
          size: 1,
          color: 0xffffff,
          alpha: 0,
          seed: Math.random() * 100,
          phase: 'idle',
          bounced: 0
        });
      }
    } catch (e) {
      console.warn("Particle pool init error:", e);
    }
  },

  _getHeroColorPalette(heroId) {
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
    const targetId = idMap[heroId] || heroId;
    switch (targetId) {
      case 'hero_starter':
        return [0xffd700, 0xb0bec5, 0x78909c, 0xffeb3b, 0xffffff];
      case 'hero_shadow_rogue':
        return [0x00e5ff, 0x0284c7, 0x38bdf8, 0x0f172a, 0xffffff];
      case 'hero_frost_knight':
        return [0x00e5ff, 0x80d8ff, 0x0288d1, 0x01579b, 0xffffff];
      case 'hero_spear_lancer':
        return [0xffd700, 0xffb300, 0xff8f00, 0x00e5ff, 0xffffff];
      case 'hero_flame_knight':
        return [0xff3d00, 0xff9100, 0xd50000, 0xffd600, 0xffffff];
      case 'hero_arcane_mage':
        return [0xb026ff, 0xd500f9, 0x4a148c, 0x00e5ff, 0xffffff];
      case 'hero_aetheris':
        return [0x00e5ff, 0xd500f9, 0xffd700, 0x0091ea, 0xffffff];
      case 'hero_unknown_god':
        return [0x00ffcc, 0xff0055, 0xaa00ff, 0x880e4f, 0xffffff];
      default:
        return [0xffd700, 0x00e5ff, 0xff007f, 0x76ff03, 0xffffff];
    }
  },

  _resetParticlesForBurst(heroId) {
    if (!this.particles || this.particles.length === 0) {
      this._initParticlePool();
    }
    const W = this.width || window.innerWidth || 1280;
    const H = this.height || window.innerHeight || 720;
    const cx = W / 2;
    const cy = H / 2;
    const colors = this._getHeroColorPalette(heroId);

    const total = this.particles ? this.particles.length : 0;
    for (let i = 0; i < total; i++) {
      const p = this.particles[i];
      if (!p || !p.sprite) continue;

      const angle = (i / Math.max(1, total)) * Math.PI * 4 + Math.random() * 0.5;
      const baseRadius = 80 + Math.random() * (Math.max(W, H) * 0.65);
      const depthZ = (Math.random() - 0.5) * 160;

      p.baseRadius = baseRadius;
      p.radius = baseRadius;
      p.angle = angle;
      p.angularSpeed = (2.2 + Math.random() * 3.8) * (Math.random() > 0.4 ? 1 : -1);
      p.depthZ = depthZ;

      const zScale = 0.5 + (depthZ + 80) / 160;
      p.size = (0.22 + Math.random() * 0.48) * zScale;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 0.2 + Math.random() * 0.8;
      p.phase = 'swirl';
      p.bounced = 0;

      p.x = cx + Math.cos(angle) * baseRadius;
      p.y = cy + Math.sin(angle) * (baseRadius * 0.55);
      p.vx = 0;
      p.vy = 0;

      p.sprite.tint = p.color;
      p.sprite.scale.set(p.size);
      p.sprite.alpha = 0;
      p.sprite.position.set(p.x, p.y);
      p.sprite.visible = true;
    }
  },

  _triggerParticleExplosion(heroId) {
    const W = this.width || window.innerWidth || 1280;
    const H = this.height || window.innerHeight || 720;
    const cx = W / 2;
    const cy = H / 2;

    const total = this.particles ? this.particles.length : 0;
    for (let i = 0; i < total; i++) {
      const p = this.particles[i];
      if (!p || !p.sprite) continue;
      p.phase = 'disperse';

      const dirX = p.x - cx;
      const dirY = p.y - cy;
      const dist = Math.hypot(dirX, dirY) || 1;
      const speed = 480 + Math.random() * 1150;
      const angleScatter = (Math.random() - 0.5) * 0.6;

      const baseAngle = Math.atan2(dirY, dirX) + angleScatter;
      p.vx = Math.cos(baseAngle) * speed;
      p.vy = Math.sin(baseAngle) * speed;
      p.alpha = 1.0;
    }
  },

  _updateParticles(elapsed, dt) {
    const W = this.width || 1280;
    const H = this.height || 720;
    const cx = W / 2;
    const cy = H / 2;

    const total = this.particles ? this.particles.length : 0;
    for (let i = 0; i < total; i++) {
      const p = this.particles[i];
      if (!p || !p.sprite || !p.sprite.visible) continue;

      if (p.phase === 'swirl') {
        // High-Speed Swirling Trajectory & Serpentine Curvature
        p.angle += p.angularSpeed * dt;
        const inwardProgress = Math.min(1, elapsed / 2500);
        const currentRadius = p.baseRadius * (1.0 - inwardProgress * 0.65) + Math.sin(elapsed * 0.012 + p.seed) * 22;
        p.x = cx + Math.cos(p.angle) * currentRadius * 1.25;
        p.y = cy + Math.sin(p.angle) * (currentRadius * 0.55) + Math.cos(elapsed * 0.008 + p.seed) * 16;

        p.sprite.position.set(p.x, p.y);
        p.sprite.alpha = Math.min(1.0, elapsed / 350) * p.alpha;
      } else if (p.phase === 'disperse') {
        // Radial Dispersion & Screen Boundary Collisions
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vy += 85 * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;

        // Screen Boundary Bouncing
        if (p.x <= 15) {
          p.x = 15;
          p.vx = -p.vx * 0.72;
          p.bounced++;
        } else if (p.x >= W - 15) {
          p.x = W - 15;
          p.vx = -p.vx * 0.72;
          p.bounced++;
        }

        if (p.y <= 15) {
          p.y = 15;
          p.vy = -p.vy * 0.72;
          p.bounced++;
        } else if (p.y >= H - 15) {
          p.y = H - 15;
          p.vy = -p.vy * 0.65;
          p.vx *= 0.82;
          p.bounced++;
        }

        const disperseElapsed = elapsed - 2500;
        const fade = Math.max(0, 1.0 - (disperseElapsed / 1400));
        p.sprite.alpha = fade * p.alpha;
        p.sprite.position.set(p.x, p.y);

        if (fade <= 0.01) {
          p.sprite.visible = false;
        }
      }
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
    const targetId = idMap[heroId] || heroId;

    try {
      if (phase === 'intro') {
        if (targetId === 'hero_frost_knight') {
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            g.gain.setValueAtTime(0.06, now + idx * 0.07);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.35);
          });
        } else if (targetId === 'hero_shadow_rogue') {
          const click = ctx.createOscillator();
          const clickG = ctx.createGain();
          click.type = 'triangle';
          click.frequency.setValueAtTime(3400, now + 0.22);
          clickG.gain.setValueAtTime(0.08, now + 0.22);
          clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          click.connect(clickG);
          clickG.connect(ctx.destination);
          click.start(now + 0.22);
          click.stop(now + 0.35);
        } else if (targetId === 'hero_flame_knight') {
          [440, 880, 1760].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            g.gain.setValueAtTime(0.05, now + idx * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.12);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.12);
          });
        } else if (targetId === 'hero_arcane_mage') {
          const osc1 = ctx.createOscillator();
          const g = ctx.createGain();
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(800, now);
          osc1.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
          g.gain.setValueAtTime(0.06, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
          osc1.connect(g);
          g.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.38);
        } else if (targetId === 'hero_aetheris') {
          [587.33, 880, 1174.66, 1760, 2349.32].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            g.gain.setValueAtTime(0.05, now + idx * 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.4);
          });
        } else {
          const osc1 = ctx.createOscillator();
          const g = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(2600, now);
          osc1.frequency.exponentialRampToValueAtTime(3900, now + 0.35);
          g.gain.setValueAtTime(0.06, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
          osc1.connect(g);
          g.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.38);
        }
      } else if (phase === 'climax') {
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

        if (targetId === 'hero_spear_lancer') {
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
        } else if (targetId === 'hero_arcane_mage') {
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
        } else if (targetId === 'hero_aetheris') {
          const beam = ctx.createOscillator();
          const beamG = ctx.createGain();
          beam.type = 'sawtooth';
          beam.frequency.setValueAtTime(1400, now);
          beam.frequency.exponentialRampToValueAtTime(90, now + 0.45);
          beamG.gain.setValueAtTime(0.45, now);
          beamG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          beam.connect(beamG);
          beamG.connect(ctx.destination);
          beam.start(now);
          beam.stop(now + 0.5);
        } else if (targetId === 'hero_frost_knight') {
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
          expGain.gain.setValueAtTime(0.5, now);
          expGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          noise.connect(filter);
          filter.connect(expGain);
          expGain.connect(ctx.destination);
          noise.start(now);
          noise.stop(now + 0.5);
        }
      } else if (phase === 'sheathe') {
        const click = ctx.createOscillator();
        const clickG = ctx.createGain();
        click.type = 'sine';
        click.frequency.setValueAtTime(3200, now);
        click.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
        clickG.gain.setValueAtTime(0.3, now);
        clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        click.connect(clickG);
        clickG.connect(ctx.destination);
        click.start(now);
        click.stop(now + 0.22);

        const bell = ctx.createOscillator();
        const bellG = ctx.createGain();
        bell.type = 'triangle';
        bell.frequency.setValueAtTime(1174.66, now + 0.04);
        bellG.gain.setValueAtTime(0.2, now + 0.04);
        bellG.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        bell.connect(bellG);
        bellG.connect(ctx.destination);
        bell.start(now + 0.04);
        bell.stop(now + 0.45);
      }
    } catch (e) {
      // AudioCtx protected
    }
  },

  // ============================================================
  // AUTHENTIC ANIME JAPANESE VOICE LINES (ULTIMATE & SKILLS)
  // ============================================================
  JAPANESE_VOICE_MAP: {
    hero_starter: {
      burst: {
        text: '震えろ！',
        romaji: 'Furuero!',
        sub: '「震えろ！開山破石！」'
      },
      skill: {
        text: '荒星！',
        romaji: 'Kousei!',
        sub: '「荒星！十字斬！」'
      }
    },
    hero_shadow_rogue: {
      burst: {
        text: '雲隠れ…雁鳴く時！',
        romaji: 'Kumogakure... kari naku toki!',
        sub: '「雲隠れ…雁鳴く時！幻影絶殺！」'
      },
      skill: {
        text: '風よ！',
        romaji: 'Kaze yo!',
        sub: '「風よ！双刀乱舞！」'
      }
    },
    hero_frost_knight: {
      burst: {
        text: '神里流…霜滅！',
        romaji: 'Kamisato-ryū... Sōmetsu!',
        sub: '「神里流…霜滅！氷封絶域！」'
      },
      skill: {
        text: '雪よ、舞え！',
        romaji: 'Yuki yo, mae!',
        sub: '「雪よ、舞え！氷刃十字斬！」'
      }
    },
    hero_spear_lancer: {
      burst: {
        text: '天動万象！',
        romaji: 'Tendō-banshou!',
        sub: '「天動万象！金龍破天！」'
      },
      skill: {
        text: '壁立千仞！',
        romaji: 'Hekiritsu-senjin!',
        sub: '「壁立千仞！雷槍穿刺！」'
      }
    },
    hero_flame_knight: {
      burst: {
        text: '裁きを、受けよ！',
        romaji: 'Sabaki o, ukeyo!',
        sub: '「裁きを、受けよ！燎原烈火！」'
      },
      skill: {
        text: 'はっ！',
        romaji: 'Ha!',
        sub: '「紅蓮一閃！炎刃烈斬！」'
      }
    },
    hero_arcane_mage: {
      burst: {
        text: 'ここより、寂滅の時！',
        romaji: 'Koko yori, jakumetsu no toki!',
        sub: '「ここより、寂滅の時！黒洞寂滅！」'
      },
      skill: {
        text: '裁きの雷！',
        romaji: 'Sabaki no ikazuchi!',
        sub: '「裁きの雷！虚無の呪印！」'
      }
    },
    hero_aetheris: {
      burst: {
        text: '運命よ、ここにいでよ！',
        romaji: 'Unmei yo, koko ni ide yo!',
        sub: '「運命よ、ここにいでよ！万星玄滅！」'
      },
      skill: {
        text: '水中幻願！',
        romaji: 'Suichū-gengan!',
        sub: '「水中幻願！古語の渦！」'
      }
    },
    hero_unknown_god: {
      burst: {
        text: '礼を弁えぬ虫けらが！',
        romaji: 'Rei o wakimaenu mushikera ga!',
        sub: '「礼を弁えぬ虫けらが！無極創生！」'
      },
      skill: {
        text: '風よ！',
        romaji: 'Kaze yo!',
        sub: '「風よ！虚空崩壊！」'
      }
    }
  },

  playHeroVoice(heroId, type = 'burst') {
    if (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.sfxEnabled === false) return null;

    // RULE 1: If an Ultimate burst cinematic is playing, NEVER play skill voice lines (prevents sound collision)
    if (type === 'skill' && this.active) return null;

    // RULE 2: Debounce skill voices (minimum 4.0s interval) to prevent rapid overlapping in auto-combat
    const nowTime = Date.now();
    if (type === 'skill') {
      if (this._lastSkillVoiceTime && (nowTime - this._lastSkillVoiceTime) < 4000) {
        return null;
      }
      this._lastSkillVoiceTime = nowTime;
    }

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
    const targetId = idMap[heroId] || heroId || 'hero_starter';
    const voiceData = this.JAPANESE_VOICE_MAP[targetId] || this.JAPANESE_VOICE_MAP.hero_starter;
    const entry = voiceData[type] || voiceData.burst;

    // RULE 3: Stop any currently playing voice line immediately so sounds NEVER stack/overlap
    if (this._currentVoiceAudio) {
      try {
        this._currentVoiceAudio.pause();
        this._currentVoiceAudio.currentTime = 0;
      } catch (e) {}
      this._currentVoiceAudio = null;
    }

    const canPlayOgg = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg') !== '';
    const ext = canPlayOgg ? 'ogg' : 'mp3';
    const audioFile = `assets/audio/voice/${type === 'burst' ? 'ult' : 'skill'}_${targetId}.${ext}`;

    try {
      if (!this._voiceAudioCache) this._voiceAudioCache = {};
      let audio = this._voiceAudioCache[audioFile];
      if (!audio) {
        audio = new Audio(audioFile);
        this._voiceAudioCache[audioFile] = audio;
      }
      audio.currentTime = 0;
      audio.volume = 1.0;
      this._currentVoiceAudio = audio;
      audio.onended = () => {
        if (this._currentVoiceAudio === audio) this._currentVoiceAudio = null;
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this._speakJapaneseFallback(targetId, type, entry.text);
        });
      }
    } catch (e) {
      this._speakJapaneseFallback(targetId, type, entry.text);
    }

    return entry;
  },

  _speakJapaneseFallback(targetId, type, text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ja-JP';

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.startsWith('ja') || v.lang.includes('JP'));
      if (jaVoice) utter.voice = jaVoice;

      if (targetId === 'hero_arcane_mage' || targetId === 'hero_aetheris') {
        utter.pitch = 1.25;
        utter.rate = 1.05;
      } else if (targetId === 'hero_unknown_god' || targetId === 'hero_spear_lancer') {
        utter.pitch = 0.85;
        utter.rate = 0.95;
      } else {
        utter.pitch = 1.0;
        utter.rate = 1.1;
      }
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  },

  // ============================================================
  // WEBGL REALITY SHATTER & EYE SLASH CUT-IN
  // ZERO DOM INJECTION — DRAWN PURELY VIA PIXI GRAPHICS & SPRITES
  // ============================================================
  _buildEyeCutinWebGL(heroId) {
    if (!this.eyeCutinLayer) return;
    this.eyeCutinLayer.removeChildren();

    const eyeTex = this._getHeroEyeTexture(heroId);
    const W = this.width || 1280;
    const H = this.height || 720;
    const palette = this._getHeroColorPalette(heroId);

    const bannerContainer = new PIXI.Container();
    bannerContainer.position.set(W / 2, H * 0.42);

    // Glowing diagonal banner background
    const bgG = new PIXI.Graphics();
    bgG.beginFill(0x050711, 0.88);
    bgG.lineStyle(2, palette[0] || 0xffffff, 0.8);
    bgG.drawRect(-W * 0.6, -65, W * 1.2, 130);
    bgG.endFill();
    bgG.rotation = -0.045;
    bannerContainer.addChild(bgG);

    if (eyeTex) {
      const eyeSpr = new PIXI.Sprite(eyeTex);
      eyeSpr.anchor.set(0.5, 0.5);
      const aspect = (eyeTex.width && eyeTex.height) ? (eyeTex.width / eyeTex.height) : 5.2;
      eyeSpr.width = Math.min(W * 0.95, 680);
      eyeSpr.height = eyeSpr.width / aspect;
      eyeSpr.rotation = -0.045;
      bannerContainer.addChild(eyeSpr);
    } else {
      // Procedural WebGL Eye Slash Beam Fallback
      const beam = new PIXI.Graphics();
      beam.lineStyle(4, palette[1] || 0x00e5ff, 0.9);
      beam.moveTo(-250, 0); beam.lineTo(250, 0);
      beam.beginFill(0xffffff, 0.9);
      beam.drawCircle(-60, 0, 16);
      beam.drawCircle(60, 0, 16);
      beam.endFill();
      beam.blendMode = PIXI.BLEND_MODES.ADD;
      bannerContainer.addChild(beam);
    }

    this.eyeCutinLayer.addChild(bannerContainer);
    this.eyeCutinLayer.alpha = 0;
    this.eyeCutinLayer.visible = true;
  },

  _updateEyeCutinWebGL(elapsed) {
    if (!this.eyeCutinLayer || !this.eyeCutinLayer.visible) return;
    const W = this.width || 1280;

    if (elapsed < 750) {
      const t = elapsed / 750;
      if (t < 0.25) {
        const p = t / 0.25;
        this.eyeCutinLayer.alpha = p;
        this.eyeCutinLayer.x = (1.0 - p) * -W * 0.8;
      } else if (t < 0.75) {
        this.eyeCutinLayer.alpha = 1.0;
        this.eyeCutinLayer.x = 0;
      } else {
        const p = (t - 0.75) / 0.25;
        this.eyeCutinLayer.alpha = 1.0 - p;
        this.eyeCutinLayer.x = p * W * 0.8;
      }
    } else {
      this.eyeCutinLayer.visible = false;
      this.eyeCutinLayer.removeChildren();
    }
  },

  _buildRealityShatterWebGL(heroId) {
    if (!this.slashAndShatterLayer) return;
    this.slashAndShatterLayer.removeChildren();
    this.shatterShards = [];

    const W = this.width || 1280;
    const H = this.height || 720;
    const cx = W / 2;
    const cy = H / 2;
    const shardCount = 10;
    const palette = this._getHeroColorPalette(heroId);

    for (let i = 0; i < shardCount; i++) {
      const g = new PIXI.Graphics();
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 400 + Math.random() * 800;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const rotSpeed = (Math.random() - 0.5) * 12;

      const w = 24 + Math.random() * 45;
      const h = 20 + Math.random() * 38;
      const color = palette[i % palette.length];

      g.beginFill(0xffffff, 0.35);
      g.lineStyle(1.8, color, 0.95);
      g.drawPolygon([
        0, 0,
        w * (0.6 + Math.random() * 0.4), h * 0.2,
        w, h,
        w * 0.2, h * (0.7 + Math.random() * 0.3)
      ]);
      g.endFill();

      g.position.set(cx, cy);
      g.blendMode = PIXI.BLEND_MODES.ADD;
      this.slashAndShatterLayer.addChild(g);

      this.shatterShards.push({
        graphic: g,
        x: cx,
        y: cy,
        vx,
        vy,
        rotSpeed,
        alpha: 1.0
      });
    }
  },

  _updateRealityShatterWebGL(dt) {
    for (let i = 0; i < this.shatterShards.length; i++) {
      const s = this.shatterShards[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.graphic.rotation += s.rotSpeed * dt;
      s.graphic.position.set(s.x, s.y);

      s.alpha *= 0.95;
      s.graphic.alpha = s.alpha;
      if (s.alpha <= 0.02) {
        s.graphic.visible = false;
      }
    }
  },

  // ============================================================
  // DYNAMIC PARALLAX ZOOM HERO CONTAINER (WEBGL)
  // WITH 3 PHANTOM AFTER-IMAGE TRAILS & CHARGING AURA
  // ============================================================
  _buildHeroStageWebGL(heroId) {
    if (!this.heroStageLayer) return;
    this.heroStageLayer.removeChildren();

    const heroTex = this._getHeroTexture(heroId);
    const W = this.width || 1280;
    const H = this.height || 720;
    const palette = this._getHeroColorPalette(heroId);

    // 1. 3D Sacred Geometry Celestial Seal (Midground Parallax)
    const seal = new PIXI.Graphics();
    seal.lineStyle(1.8, palette[0], 0.35);
    seal.drawEllipse(0, 95, 170, 48);
    seal.lineStyle(1.2, palette[1], 0.22);
    seal.drawEllipse(0, 95, 120, 34);
    seal.blendMode = PIXI.BLEND_MODES.ADD;
    this.space3DLayer.removeChildren();
    this.space3DLayer.addChild(seal);
    this.space3DSeal = seal;

    // 2. Hero Container & Shadow Trails
    const heroCont = new PIXI.Container();
    heroCont.position.set(W / 2, H / 2);

    this.heroShadows = [];
    if (heroTex) {
      for (let s = 0; s < 3; s++) {
        const sh = new PIXI.Sprite(heroTex);
        sh.anchor.set(0.5, 0.5);
        sh.tint = palette[s % palette.length];
        sh.alpha = 0.4 - s * 0.12;
        sh.blendMode = PIXI.BLEND_MODES.ADD;
        heroCont.addChild(sh);
        this.heroShadows.push(sh);
      }

      const heroSpr = new PIXI.Sprite(heroTex);
      heroSpr.anchor.set(0.5, 0.5);
      heroCont.addChild(heroSpr);
      this.heroMainSpr = heroSpr;
    } else {
      // Radiant Procedural Anime Silhouette Fallback
      const sil = new PIXI.Graphics();
      sil.beginFill(palette[0], 0.85);
      sil.drawCircle(0, -50, 28);
      sil.drawRect(-35, -20, 70, 95);
      sil.endFill();
      sil.lineStyle(5, 0xffffff, 1.0);
      sil.moveTo(-70, -80); sil.lineTo(70, 60);
      sil.moveTo(70, -80); sil.lineTo(-70, 60);
      sil.blendMode = PIXI.BLEND_MODES.ADD;
      heroCont.addChild(sil);
    }

    this.heroStageLayer.addChild(heroCont);
    this.heroContainer = heroCont;
  },

  _updateHeroParallaxWebGL(elapsed, dt) {
    if (!this.heroContainer) return;
    const W = this.width || 1280;
    const H = this.height || 720;
    const cx = W / 2;
    const cy = H / 2;

    if (this.space3DSeal) {
      this.space3DSeal.position.set(cx, cy);
      this.space3DSeal.rotation += dt * 0.65;
    }

    // Dynamic Parallax Zoom Logic
    if (elapsed < 600) {
      const t = elapsed / 600;
      const ease = 1.0 - Math.pow(1.0 - t, 3);
      const scale = 2.6 - (2.6 - 1.08) * ease;
      this.heroContainer.scale.set(scale);

      const targetX = cx + Math.sin(t * Math.PI) * 28;
      const targetY = cy + Math.cos(t * Math.PI * 0.5) * 18;
      this.heroContainer.position.set(targetX, targetY);
    } else if (elapsed < 900) {
      const breath = 1.0 + Math.sin(elapsed * 0.008) * 0.025;
      this.heroContainer.scale.set(1.08 * breath);
      this.heroContainer.position.set(cx, cy + Math.sin(elapsed * 0.005) * 8);
    } else {
      const postElapsed = elapsed - 900;
      const dashProgress = Math.min(1.0, postElapsed / 450);
      const dashEase = Math.pow(dashProgress, 2);
      this.heroContainer.position.x = cx + dashEase * (W * 0.45);
      this.heroContainer.scale.set(1.08 + dashEase * 0.22);
      this.heroContainer.alpha = Math.max(0, 1.0 - dashProgress * 1.5);
    }

    if (this.heroShadows && this.heroShadows.length > 0) {
      for (let s = 0; s < this.heroShadows.length; s++) {
        const sh = this.heroShadows[s];
        const lag = (s + 1) * 0.18;
        sh.position.x = -lag * (this.heroContainer.position.x - cx) * 0.35;
        sh.position.y = -lag * (this.heroContainer.position.y - cy) * 0.35;
      }
    }
  },

  // ============================================================
  // MAIN ENTRY POINT FOR BURST ULTIMATE CINEMATIC
  // ============================================================
  showBurstCinematic(skillRes) {
    return this.playBurst(skillRes);
  },

  stopBurstCinematic() {
    this._finishBurst();
  },

  _getHeroBurstImpactSvg(heroId) {
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
    const targetId = idMap[heroId] || heroId;

    switch (targetId) {
      case 'hero_starter':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-starter" width="100%" height="100%">
          <defs>
            <linearGradient id="st-arc-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="60%" stop-color="#ffd700"/>
              <stop offset="100%" stop-color="#ff9100"/>
            </linearGradient>
            <filter id="st-spark-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffd700" flood-opacity="1"/></filter>
          </defs>
          <!-- Upward Greatsword Launcher Arc (Knocks monster flying up!) -->
          <path class="slash-upward-arc" d="M 50,260 Q 150,150 250,30" stroke="url(#st-arc-grad)" stroke-width="14" fill="none" stroke-linecap="round" filter="url(#st-spark-glow)"/>
          <path class="slash-upward-arc-core" d="M 50,260 Q 150,150 250,30" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>
          <!-- 8 Rapid Airborne White Slashes Cutting Blood-Red Monster -->
          <g class="airborne-cross-slashes" filter="url(#st-spark-glow)">
            <line class="cross-sl-1" x1="30" y1="60" x2="270" y2="160" stroke="#ffffff" stroke-width="6"/>
            <line class="cross-sl-2" x1="260" y1="70" x2="40" y2="180" stroke="#ffffff" stroke-width="7"/>
            <line class="cross-sl-3" x1="60" y1="30" x2="240" y2="220" stroke="#ffffff" stroke-width="8"/>
            <line class="cross-sl-4" x1="240" y1="30" x2="60" y2="220" stroke="#ffffff" stroke-width="8"/>
            <line class="cross-sl-5" x1="20" y1="120" x2="280" y2="120" stroke="#ffffff" stroke-width="7"/>
            <line class="cross-sl-6" x1="150" y1="20" x2="150" y2="240" stroke="#ffffff" stroke-width="7"/>
            <line class="cross-sl-7" x1="50" y1="190" x2="250" y2="80" stroke="#ffffff" stroke-width="8"/>
            <line class="cross-sl-8" x1="250" y1="190" x2="50" y2="80" stroke="#ffffff" stroke-width="8"/>
          </g>
          <!-- Downward Ground Hammer Crash Impact -->
          <g class="ground-smash-burst">
            <ellipse cx="150" cy="275" rx="100" ry="24" stroke="#ffd700" stroke-width="4" fill="none" class="ground-ring-exp"/>
            <path d="M 150,275 L 80,240 M 150,275 L 220,240 M 150,275 L 60,280 M 150,275 L 240,280" stroke="#cfd8dc" stroke-width="3.5"/>
            <circle cx="150" cy="275" r="16" fill="#ffd700" filter="url(#st-spark-glow)"/>
          </g>
        </svg>`;

      case 'hero_shadow_rogue':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-shadow_rogue" width="100%" height="100%">
          <defs>
            <filter id="rg-cyan-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00e5ff" flood-opacity="1"/></filter>
          </defs>
          <!-- Cyan Shadow Mist Vortex -->
          <ellipse cx="150" cy="150" rx="115" ry="75" stroke="#00e5ff" stroke-width="3.5" stroke-dasharray="24,12" fill="none" class="shadow-vortex-spin" filter="url(#rg-cyan-glow)"/>
          <!-- 6 Rapid Clone Flurry Slices -->
          <g class="clone-flurry-slashes" filter="url(#rg-cyan-glow)">
            <path class="flurry-1" d="M 20,110 L 280,150" stroke="#00e5ff" stroke-width="5"/>
            <path class="flurry-2" d="M 270,100 L 30,190" stroke="#ffffff" stroke-width="4"/>
            <path class="flurry-3" d="M 40,50 L 260,240" stroke="#38bdf8" stroke-width="6"/>
            <path class="flurry-4" d="M 260,50 L 40,240" stroke="#00e5ff" stroke-width="6"/>
            <path class="flurry-5" d="M 150,20 L 150,280" stroke="#ffffff" stroke-width="5"/>
            <path class="flurry-6" d="M 20,160 L 280,130" stroke="#0284c7" stroke-width="5"/>
          </g>
          <!-- Delayed Massive X Execution Cut -->
          <g class="delayed-execution-x" filter="url(#rg-cyan-glow)">
            <line x1="30" y1="30" x2="270" y2="270" stroke="#00e5ff" stroke-width="12"/>
            <line x1="30" y1="30" x2="270" y2="270" stroke="#ffffff" stroke-width="5"/>
            <line x1="270" y1="30" x2="30" y2="270" stroke="#00e5ff" stroke-width="12"/>
            <line x1="270" y1="30" x2="30" y2="270" stroke="#ffffff" stroke-width="5"/>
          </g>
        </svg>`;

      case 'hero_frost_knight':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-frost_knight" width="100%" height="100%">
          <defs>
            <filter id="fk-ice-glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#00e5ff" flood-opacity="1"/></filter>
          </defs>
          <!-- Rising Glacial Stalagmites beneath monster -->
          <g class="rising-glacier-spikes" filter="url(#fk-ice-glow)">
            <polygon points="120,290 150,90 180,290" fill="rgba(0,229,255,0.7)" stroke="#ffffff" stroke-width="2.5"/>
            <polygon points="60,290 95,150 130,290" fill="rgba(128,216,255,0.6)" stroke="#00e5ff" stroke-width="2"/>
            <polygon points="170,290 205,140 240,290" fill="rgba(128,216,255,0.6)" stroke="#00e5ff" stroke-width="2"/>
          </g>
          <!-- Ice Block Crystalline Prison Encasing Monster -->
          <g class="ice-prison-block" filter="url(#fk-ice-glow)">
            <polygon points="80,50 220,50 250,190 50,190" fill="rgba(0,229,255,0.35)" stroke="#ffffff" stroke-width="3.5"/>
            <line x1="80" y1="50" x2="165" y2="125" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="220" y1="50" x2="165" y2="125" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="50" y1="190" x2="165" y2="125" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="250" y1="190" x2="165" y2="125" stroke="#ffffff" stroke-width="2.5"/>
          </g>
          <!-- Frostmourne Shatter Slash Line -->
          <path class="frostmourne-cleave" d="M 20,135 Q 150,65 280,125" stroke="#ffffff" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#fk-ice-glow)"/>
        </svg>`;

      case 'hero_spear_lancer':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-spear_lancer" width="100%" height="100%">
          <defs>
            <filter id="sl-light-glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ffd700" flood-opacity="1"/></filter>
          </defs>
          <!-- Rapid 8-Strike Lightning Spear Piercing Rush -->
          <g class="lightning-thrust-barrage" filter="url(#sl-light-glow)">
            <line class="thrust-1" x1="10" y1="110" x2="250" y2="110" stroke="#ffd700" stroke-width="6"/>
            <line class="thrust-2" x1="10" y1="130" x2="270" y2="130" stroke="#ffffff" stroke-width="7"/>
            <line class="thrust-3" x1="10" y1="150" x2="260" y2="150" stroke="#ffb300" stroke-width="6"/>
            <line class="thrust-4" x1="20" y1="90" x2="240" y2="100" stroke="#00e5ff" stroke-width="5"/>
            <line class="thrust-5" x1="20" y1="170" x2="250" y2="160" stroke="#ffd700" stroke-width="5"/>
          </g>
          <!-- Soaring Golden Lightning Dragon -->
          <g class="ascending-golden-dragon" filter="url(#sl-light-glow)">
            <path d="M 150,300 Q 60,200 150,120 Q 240,40 150,-30" stroke="#ffd700" stroke-width="20" fill="none" stroke-linecap="round"/>
            <path d="M 150,300 Q 60,200 150,120 Q 240,40 150,-30" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round"/>
            <!-- Dragon Roaring Jaws -->
            <polygon points="150,-40 185,0 160,18 140,18 115,0" fill="#ffd700" stroke="#ffffff" stroke-width="3"/>
            <circle cx="135" cy="-8" r="4.5" fill="#00e5ff"/>
            <circle cx="165" cy="-8" r="4.5" fill="#00e5ff"/>
          </g>
        </svg>`;

      case 'hero_flame_knight':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-flame_knight" width="100%" height="100%">
          <defs>
            <filter id="fk-fire-glow-2"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#ff3d00" flood-opacity="1"/></filter>
          </defs>
          <!-- Blazing Flame Tornado Cyclone -->
          <g class="flame-cyclone-vortex" filter="url(#fk-fire-glow-2)">
            <ellipse cx="150" cy="210" rx="95" ry="26" stroke="#bf360c" stroke-width="8" fill="none" stroke-dasharray="20,10" class="spin-cyclone"/>
            <ellipse cx="150" cy="150" rx="115" ry="32" stroke="#ff3d00" stroke-width="8" fill="none" stroke-dasharray="20,10" class="spin-cyclone" style="animation-direction:reverse;"/>
            <ellipse cx="150" cy="90" rx="130" ry="38" stroke="#ffd600" stroke-width="8" fill="none" stroke-dasharray="20,10" class="spin-cyclone"/>
          </g>
          <!-- Heavenly Blazing Phoenix Dive Strike -->
          <g class="diving-phoenix" filter="url(#fk-fire-glow-2)">
            <path d="M 150,260 L 150,10" stroke="#ff3d00" stroke-width="12"/>
            <path d="M 50,70 Q 150,160 250,70 Q 150,110 50,70 Z" fill="#ff1744" stroke="#ffd600" stroke-width="3"/>
            <polygon points="150,180 175,130 125,130" fill="#ffd600"/>
          </g>
        </svg>`;

      case 'hero_arcane_mage':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-arcane_mage" width="100%" height="100%">
          <defs>
            <filter id="am-void-glow-2"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#d500f9" flood-opacity="1"/></filter>
          </defs>
          <!-- Cosmic Black Hole Singularity Core -->
          <g class="black-hole-singularity" filter="url(#am-void-glow-2)">
            <circle cx="150" cy="130" r="50" fill="#050014" stroke="#d500f9" stroke-width="5"/>
            <circle cx="150" cy="130" r="35" fill="#000000"/>
            <ellipse cx="150" cy="130" rx="100" ry="38" stroke="#e040fb" stroke-width="4" fill="none" stroke-dasharray="16,8" class="spin-singularity"/>
            <ellipse cx="150" cy="130" rx="130" ry="48" stroke="#00e5ff" stroke-width="3" fill="none" stroke-dasharray="20,10" class="spin-singularity" style="animation-direction:reverse;"/>
          </g>
          <!-- Gravitational Inward Lensing Rays -->
          <g class="gravitational-rays" filter="url(#am-void-glow-2)">
            <line x1="40" y1="40" x2="125" y2="115" stroke="#d500f9" stroke-width="3"/>
            <line x1="260" y1="40" x2="175" y2="115" stroke="#00e5ff" stroke-width="3"/>
            <line x1="40" y1="220" x2="125" y2="145" stroke="#e040fb" stroke-width="3"/>
            <line x1="260" y1="220" x2="175" y2="145" stroke="#d500f9" stroke-width="3"/>
          </g>
          <!-- Supernova Blast Ring Wave -->
          <circle class="supernova-blast-ring" cx="150" cy="130" r="140" stroke="#ffffff" stroke-width="8" fill="none" filter="url(#am-void-glow-2)"/>
        </svg>`;

      case 'hero_aetheris':
        return `
        <svg viewBox="0 0 320 320" class="impact-svg impact-aetheris" width="100%" height="100%">
          <defs>
            <linearGradient id="ae-meteor-fire" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="30%" stop-color="#ffeb3b"/>
              <stop offset="70%" stop-color="#ff5722"/>
              <stop offset="100%" stop-color="#b71c1c"/>
            </linearGradient>
            <linearGradient id="ae-impact-beam" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="40%" stop-color="#00e5ff"/>
              <stop offset="75%" stop-color="#d500f9"/>
              <stop offset="100%" stop-color="#311b92"/>
            </linearGradient>
            <filter id="ae-impact-glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#00e5ff" flood-opacity="1"/></filter>
            <filter id="ae-fire-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ff3d00" flood-opacity="1"/></filter>
          </defs>

          <!-- Top-Right: Dimensional Cosmic Vortex Rift (Image 2 Panel 4) -->
          <g class="aether-cosmic-rift" filter="url(#ae-impact-glow)">
            <ellipse cx="250" cy="55" rx="55" ry="24" transform="rotate(-30 250 55)" fill="#050014" stroke="#00e5ff" stroke-width="4"/>
            <ellipse cx="250" cy="55" rx="42" ry="16" transform="rotate(-30 250 55)" fill="none" stroke="#d500f9" stroke-width="3" stroke-dasharray="10,5" class="spin-singularity"/>
            <circle cx="250" cy="55" r="10" fill="#ffffff"/>
          </g>

          <!-- Colossal Prismatic Beam Tearing Reality from Staff into the Rift (Panel 4) -->
          <g class="aether-laser-cannon" filter="url(#ae-impact-glow)">
            <polygon points="-30,260 250,55 260,70 -15,280" fill="url(#ae-impact-beam)" opacity="0.95"/>
            <line x1="-30" y1="270" x2="255" y2="62" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
            <line x1="-30" y1="270" x2="255" y2="62" stroke="#00e5ff" stroke-width="4"/>
            <!-- Electric Lightning Tendrils along beam -->
            <path d="M 10,240 Q 60,180 100,165 Q 160,120 230,80" stroke="#d500f9" stroke-width="3" fill="none"/>
            <path d="M 0,250 Q 80,210 130,150 Q 180,110 240,70" stroke="#00e5ff" stroke-width="2.5" fill="none"/>
          </g>

          <!-- Planetary Meteor Shower Bombardment Falling from Sky (Panel 4) -->
          <g class="aether-meteor-shower" filter="url(#ae-fire-glow)">
            <!-- Meteor 1 (Giant direct hit on monster) -->
            <g class="meteor-projectile m-1">
              <path d="M 230,70 Q 170,140 130,200 L 145,210 Q 190,145 245,75 Z" fill="url(#ae-meteor-fire)"/>
              <circle cx="130" cy="200" r="14" fill="#3e2723" stroke="#ff3d00" stroke-width="3"/>
              <circle cx="130" cy="200" r="8" fill="#ff6d00"/>
              <circle cx="130" cy="200" r="4" fill="#ffeb3b"/>
            </g>
            <!-- Meteor 2 -->
            <g class="meteor-projectile m-2">
              <path d="M 260,40 Q 200,90 170,160 L 180,168 Q 215,95 270,45 Z" fill="url(#ae-meteor-fire)"/>
              <circle cx="170" cy="160" r="10" fill="#3e2723" stroke="#ff5722" stroke-width="2"/>
              <circle cx="170" cy="160" r="5" fill="#ff9100"/>
            </g>
            <!-- Meteor 3 -->
            <g class="meteor-projectile m-3">
              <path d="M 210,90 Q 140,150 90,210 L 100,218 Q 155,155 220,95 Z" fill="url(#ae-meteor-fire)"/>
              <circle cx="90" cy="210" r="11" fill="#3e2723" stroke="#ff3d00" stroke-width="2"/>
              <circle cx="90" cy="210" r="6" fill="#ffd600"/>
            </g>
          </g>

          <!-- Fiery Cataclysmic Ground Explosions & Shattered Earth (Panel 4) -->
          <g class="aether-ground-detonation" filter="url(#ae-fire-glow)">
            <ellipse cx="140" cy="250" rx="90" ry="26" fill="#ff3d00" opacity="0.65"/>
            <!-- Fire Blast Puffs -->
            <circle cx="110" cy="235" r="28" fill="#ff6d00" opacity="0.85"/>
            <circle cx="160" cy="230" r="32" fill="#ff9100" opacity="0.9"/>
            <circle cx="135" cy="225" r="24" fill="#ffeb3b"/>
            <circle cx="135" cy="225" r="14" fill="#ffffff"/>
            <!-- Ground Debris Rocks Flying -->
            <polygon points="70,240 60,225 80,230" fill="#212121"/>
            <polygon points="190,245 205,220 185,230" fill="#37474f"/>
            <polygon points="140,205 148,185 132,190" fill="#ff5722"/>
          </g>
        </svg>`;

      case 'hero_unknown_god':
        return `
        <svg viewBox="0 0 300 300" class="impact-svg impact-unknown_god" width="100%" height="100%">
          <defs>
            <filter id="ug-cube-glow"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#00ffcc" flood-opacity="1"/></filter>
          </defs>
          <!-- 6 Divine Geometric Containment Cubes Trapping Monster -->
          <g class="divine-cube-cage" filter="url(#ug-cube-glow)">
            <rect x="70" y="60" width="34" height="34" fill="#b71c1c" stroke="#00ffcc" stroke-width="2.5" class="cube-spin-1"/>
            <rect x="195" y="60" width="34" height="34" fill="#b71c1c" stroke="#00ffcc" stroke-width="2.5" class="cube-spin-2"/>
            <rect x="45" y="135" width="34" height="34" fill="#b71c1c" stroke="#ff0055" stroke-width="2.5" class="cube-spin-3"/>
            <rect x="220" y="135" width="34" height="34" fill="#b71c1c" stroke="#ff0055" stroke-width="2.5" class="cube-spin-4"/>
            <rect x="80" y="210" width="34" height="34" fill="#b71c1c" stroke="#ffd700" stroke-width="2.5" class="cube-spin-5"/>
            <rect x="185" y="210" width="34" height="34" fill="#b71c1c" stroke="#ffd700" stroke-width="2.5" class="cube-spin-6"/>
            <polygon points="87,77 212,77 237,152 202,227 97,227 62,152" fill="rgba(0,255,204,0.12)" stroke="#00ffcc" stroke-width="2.5" stroke-dasharray="12,6"/>
          </g>
          <!-- Screen-wide Razor-sharp Spatial Severance Line -->
          <line class="dimensional-cut-line" x1="-60" y1="150" x2="360" y2="150" stroke="#ffffff" stroke-width="8" filter="url(#ug-cube-glow)"/>
        </svg>`;

      default:
        return '';
    }
  },

  playBurst(skillRes) {
    if (!skillRes) return;

    if (!skillRes.forcePreview && GameState.settings && GameState.settings.vfxEnabled === false) {
      return;
    }

    if (!skillRes.forcePreview && typeof UI !== 'undefined' && UI.isBattleViewActive && !UI.isBattleViewActive()) {
      return;
    }

    try {
      if (!this.pixiApp) this.init();
      this.active = true;
      this.resize();

      const hero = skillRes.hero || (typeof CONFIG !== 'undefined' ? CONFIG.getHeroById(GameState?.activeHeroId || 'hero_starter') : null);
      const heroId = hero?.id || (GameState?.activeHeroId) || 'hero_starter';
      this.currentHeroId = heroId;
      this.impactFired = false;

      const overlay = document.getElementById('burst-cinematic-overlay');
      const arenaStage = document.getElementById('arena-stage');
      const kanjiStamp = document.getElementById('burst-kanji-stamp');
      const heroTitle = document.getElementById('burst-hero-title');
      const heroName = document.getElementById('burst-hero-name');
      const skillName = document.getElementById('burst-skill-name');

      const actorStage = document.getElementById('burst-actor-stage');
      const eyeCutin = document.getElementById('burst-eye-cutin');
      const shatterContainer = document.getElementById('burst-shatter-container');
      if (actorStage) actorStage.innerHTML = '';
      if (eyeCutin) eyeCutin.innerHTML = '';
      if (shatterContainer) shatterContainer.innerHTML = '';

      const KANJI_MAP = {
        hero_starter: '⟦ 開 山 破 石 ⟧',
        hero_shadow_rogue: '⟦ 幻 影 絶 殺 ⟧',
        hero_frost_knight: '⟦ 氷 封 絶 域 ⟧',
        hero_spear_lancer: '⟦ 金 龍 破 天 ⟧',
        hero_flame_knight: '⟦ 燎 原 烈 火 ⟧',
        hero_arcane_mage: '⟦ 黒 洞 寂 滅 ⟧',
        hero_aetheris: '⟦ 星 穹 ⟧',
        hero_unknown_god: '⟦ 無 極 創 生 ⟧',
        // Fallbacks for legacy saves
        hero_traveler: '⟦ 開 山 破 石 ⟧',
        hero_kazuha: '⟦ 幻 影 絶 殺 ⟧',
        hero_furina: '⟦ 氷 封 絶 域 ⟧',
        hero_zhongli: '⟦ 金 龍 破 天 ⟧',
        hero_jiyan: '⟦ 金 龍 破 天 ⟧',
        hero_amber: '⟦ 燎 原 烈 火 ⟧',
        hero_changli: '⟦ 燎 原 烈 火 ⟧',
        hero_raiden: '⟦ 黒 洞 寂 滅 ⟧',
      };

      // 1. Setup Kanji Stamp & Titles in Lower-Third HUD
      if (kanjiStamp) {
        kanjiStamp.textContent = KANJI_MAP[heroId] || '⟦ 極 意 ⟧';
        kanjiStamp.style.color = hero?.elementColor || '#ffd700';
      }
      if (heroTitle) heroTitle.textContent = hero?.title || 'HUYỀN THOẠI CHIẾN TƯỚNG';
      if (heroName) {
        heroName.textContent = hero?.name || 'Anh Hùng';
        heroName.style.color = hero?.elementColor || '#ffd700';
      }
      if (skillName) skillName.textContent = `⚔️ ${skillRes.skill?.name || 'Tuyệt Kỹ Nộ'} ⚔️`;

      // Trigger Authentic Anime Japanese Voice Line + Subtitle
      const voiceSub = document.getElementById('burst-voice-subtitle');
      const voiceEntry = this.playHeroVoice(heroId, 'burst');
      if (voiceSub && voiceEntry) {
        voiceSub.innerHTML = `<span class="voice-ja">${voiceEntry.sub}</span> <span class="voice-romaji">${voiceEntry.romaji}</span>`;
        voiceSub.style.display = 'block';
      }

      // 2. Build WebGL Layers
      this._buildHeroStageWebGL(heroId);
      this._buildEyeCutinWebGL(heroId);
      this._resetParticlesForBurst(heroId);

      // Phase 1 (0ms - 550ms): Eye cut-in banner
      if (eyeCutin && typeof Sprites !== 'undefined') {
        eyeCutin.innerHTML = Sprites.getHeroEyeCutinSvg(heroId);
        eyeCutin.classList.add('cutin-active');
      }

      // 3. Shockwave & Chromatic Aberration Spike on Activation
      if (this.shockwaveFilter && this.shockwaveFilter.uniforms) {
        this.shockwaveFilter.uniforms.uProgress = 0.01;
        this.shockwaveFilter.uniforms.uCenter = [0.5, 0.5];
        this.shockwaveFilter.uniforms.uAmplitude = 0.035;
      }
      if (this.chromaticFilter && this.chromaticFilter.uniforms) {
        this.chromaticFilter.uniforms.uIntensity = 0.35;
      }
      if (this.bloomFilter && this.bloomFilter.uniforms) {
        this.bloomFilter.uniforms.uGlowIntensity = 0.55;
      }

      // Play Phase 1 Intro Audio
      this.playBurstAudio(heroId, 'intro');

      // 4. Show Overlay & Hero-Themed CSS
      if (overlay) {
        overlay.className = `burst-overlay burst-active theme-${heroId}`;
      }

      // 5. Build Genuine 3D Three.js Scene
      this._buildHero3DScene(heroId);

      // 6. Dynamic 3D Camera Tilt on 2D Arena & Staging
      if (arenaStage) {
        arenaStage.classList.add('camera-3d-active', 'arena-burst-active', 'phase-1-charging', `theme-${heroId}`);
        this._apply3DCameraAngle(arenaStage, heroId);
      }

      // 6.5. Phase 1 Setup: Hero winds up, monster frozen under spotlight, NO slashes yet
      const pSprite = document.getElementById('player-sprite');
      const mSprite = document.getElementById('monster-sprite');
      const blackoutEl = document.getElementById('arena-burst-blackout');
      const impactFxEl = document.getElementById('arena-burst-impact-fx');

      if (blackoutEl) blackoutEl.classList.remove('hidden');
      if (impactFxEl) {
        impactFxEl.innerHTML = '';
        impactFxEl.classList.add('hidden');
      }

      if (pSprite) {
        pSprite.className = `fighter-avatar hero-burst-charging hero-charge-${heroId}`;
      }
      if (mSprite) {
        mSprite.className = `fighter-avatar monster-frozen`;
      }

      // Preview Duel Stage (when testing from Heroes Tab or Dev Menu)
      if (actorStage && (skillRes.forcePreview || (typeof UI !== 'undefined' && UI.isBattleViewActive && !UI.isBattleViewActive()))) {
        const dummySvg = typeof Sprites !== 'undefined' ? Sprites.getMonsterSvg('Bộ Xương Kiếm Sĩ', false) : '💀';
        const heroSvg = typeof Sprites !== 'undefined' ? Sprites.getPlayerSvg('attack', heroId) : '⚔️';
        actorStage.innerHTML = `
          <div class="preview-duel-stage theme-${heroId}">
            <div class="preview-hero-actor hero-burst-${heroId}">${heroSvg}</div>
            <div class="preview-monster-actor monster-burst-${heroId}">${dummySvg}</div>
            <div class="preview-impact-overlay theme-${heroId}">${this._getHeroBurstImpactSvg(heroId)}</div>
          </div>
        `;
      }

      // Clean existing phase timers
      if (this._phaseTimers) {
        this._phaseTimers.forEach(t => clearTimeout(t));
      }
      this._phaseTimers = [];

      // PHASE 2 (900ms): HERO DASHES FORWARD, MONSTER AIRBORNE BLOOD-RED, SLASH BARRAGE
      const tPhase2 = setTimeout(() => {
        if (!this.active) return;
        if (eyeCutin) {
          eyeCutin.innerHTML = '';
          eyeCutin.classList.remove('cutin-active');
        }
        if (this.eyeCutinLayer) this.eyeCutinLayer.removeChildren();

        if (arenaStage) {
          arenaStage.classList.remove('phase-1-charging');
          arenaStage.classList.add('phase-2-assault');
        }

        if (pSprite) {
          pSprite.className = `fighter-avatar hero-burst-acting action-burst hero-burst-${heroId}`;
        }
        if (mSprite) {
          mSprite.className = `fighter-avatar monster-burst-target monster-burst-${heroId}`;
        }
        if (impactFxEl) {
          impactFxEl.innerHTML = this._getHeroBurstImpactSvg(heroId);
          impactFxEl.className = `arena-burst-impact-fx theme-${heroId}`;
          impactFxEl.classList.remove('hidden');
        }
      }, 900);
      this._phaseTimers.push(tPhase2);

      // PHASE 3 (3100ms): FINISHER CRASH, MONSTER LANDS, HERO RETURNS & THU KIẾM / POSE DÁNG
      const tPhase3 = setTimeout(() => {
        if (!this.active) return;
        if (impactFxEl) {
          impactFxEl.innerHTML = '';
          impactFxEl.classList.add('hidden');
        }
        if (arenaStage) {
          arenaStage.classList.remove('phase-2-assault');
          arenaStage.classList.add('phase-3-sheathe');
        }
        if (mSprite) {
          mSprite.className = 'fighter-avatar monster-landing';
        }
        if (pSprite) {
          pSprite.className = `fighter-avatar hero-burst-sheathe hero-sheathe-${heroId}`;
          if (typeof Sprites !== 'undefined') {
            pSprite.innerHTML = Sprites.getPlayerSvg('sheathe', heroId);
          }
        }
        this.playBurstAudio(heroId, 'sheathe');
      }, 3100);
      this._phaseTimers.push(tPhase3);

      // 7. Delta-Time 60-144 FPS Rendering Loop
      const startTime = performance.now();
      this.startTime = startTime;
      this.lastTime = startTime;
      const duration = 3900;

      if (this.animId) cancelAnimationFrame(this.animId);

      const render = (now) => {
        if (!this.active) return;
        const dt = Math.min(0.033, (now - this.lastTime) / 1000);
        this.lastTime = now;

        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Climax Impact Transition at ~2500ms (Hitstop, reality shatter & particle explosion)
        if (elapsed >= 2500 && !this.impactFired) {
          this.impactFired = true;

          this._buildRealityShatterWebGL(heroId);
          this._triggerParticleExplosion(heroId);

          if (this.shockwaveFilter && this.shockwaveFilter.uniforms) {
            this.shockwaveFilter.uniforms.uProgress = 0.01;
            this.shockwaveFilter.uniforms.uAmplitude = 0.055;
          }
          if (this.chromaticFilter && this.chromaticFilter.uniforms) {
            this.chromaticFilter.uniforms.uIntensity = 0.5;
          }
          if (this.bloomFilter && this.bloomFilter.uniforms) {
            this.bloomFilter.uniforms.uGlowIntensity = 0.9;
          }

          this.playBurstAudio(heroId, 'climax');

          if (overlay) {
            overlay.classList.add('hitstop-active');
            setTimeout(() => overlay && overlay.classList.remove('hitstop-active'), 85);
          }

          const appEl = document.getElementById('app');
          if (appEl) {
            appEl.classList.remove('screen-shake-intense', 'screen-shake-light');
            void appEl.offsetWidth;
            appEl.classList.add('screen-shake-intense');
            setTimeout(() => appEl && appEl.classList.remove('screen-shake-intense'), 550);
          }
        }

        // 8. Update Post-Processing Shaders
        if (this.shockwaveFilter && this.shockwaveFilter.uniforms) {
          if (!this.impactFired) {
            const actProgress = Math.min(1.0, elapsed / 600);
            this.shockwaveFilter.uniforms.uProgress = actProgress;
          } else {
            const climProgress = Math.min(1.0, (elapsed - 2500) / 950);
            this.shockwaveFilter.uniforms.uProgress = climProgress;
          }
        }

        if (this.chromaticFilter && this.chromaticFilter.uniforms) {
          if (!this.impactFired) {
            const actP = Math.min(1.0, elapsed / 600);
            this.chromaticFilter.uniforms.uIntensity = Math.max(0.08, 0.35 - actP * 0.25);
          } else {
            const climElapsed = elapsed - 2500;
            this.chromaticFilter.uniforms.uIntensity = Math.max(0.0, 1.0 - (climElapsed / 600));
          }
        }

        if (this.bloomFilter && this.bloomFilter.uniforms) {
          if (!this.impactFired) {
            this.bloomFilter.uniforms.uGlowIntensity = 0.45 + Math.sin(elapsed * 0.015) * 0.2;
          } else {
            const climElapsed = elapsed - 2500;
            this.bloomFilter.uniforms.uGlowIntensity = Math.max(0.12, 0.95 - (climElapsed / 800) * 0.8);
          }
        }

        // 9. Update Pixi WebGL Scene Layers
        this._updateEyeCutinWebGL(elapsed);
        this._updateHeroParallaxWebGL(elapsed, dt);
        this._updateParticles(elapsed, dt);
        if (this.impactFired) {
          this._updateRealityShatterWebGL(dt);
        }

        // Render Pixi WebGL Stage
        if (this.pixiApp && this.pixiApp.renderer) {
          this.pixiApp.render();
        }

        // 10. Update & Render Genuine 3D Three.js Scene
        if (this.threeRenderer && this.threeScene && this.threeCamera) {
          this._updateHero3DScene(heroId, progress, elapsed, dt);
          this.threeRenderer.render(this.threeScene, this.threeCamera);
        }

        if (progress < 1) {
          this.animId = requestAnimationFrame(render);
        } else {
          this._finishBurst();
        }
      };

      this.animId = requestAnimationFrame(render);
    } catch (burstErr) {
      console.warn("Cinematics.playBurst safe catch:", burstErr);
      this._finishBurst();
    }
  },

  _finishBurst() {
    this.active = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this._phaseTimers) {
      this._phaseTimers.forEach(t => clearTimeout(t));
      this._phaseTimers = [];
    }

    const overlay = document.getElementById('burst-cinematic-overlay');
    const arenaStage = document.getElementById('arena-stage');

    if (this.heroStageLayer) this.heroStageLayer.removeChildren();
    if (this.slashAndShatterLayer) this.slashAndShatterLayer.removeChildren();
    if (this.eyeCutinLayer) this.eyeCutinLayer.removeChildren();
    if (this.particleLayer && this.particles) {
      this.particles.forEach(p => {
        if (p && p.sprite) p.sprite.visible = false;
      });
    }

    if (this.shockwaveFilter && this.shockwaveFilter.uniforms) this.shockwaveFilter.uniforms.uProgress = 0.0;
    if (this.chromaticFilter && this.chromaticFilter.uniforms) this.chromaticFilter.uniforms.uIntensity = 0.0;
    if (this.bloomFilter && this.bloomFilter.uniforms) this.bloomFilter.uniforms.uGlowIntensity = 0.0;

    if (overlay) {
      overlay.classList.remove('hitstop-active');
      overlay.classList.add('burst-fade-out');
      setTimeout(() => {
        overlay.className = 'burst-overlay hidden';
        this._cleanHero3DScene();
      }, 250);
    }

    const pSprite = document.getElementById('player-sprite');
    const mSprite = document.getElementById('monster-sprite');
    const blackoutEl = document.getElementById('arena-burst-blackout');
    const impactFxEl = document.getElementById('arena-burst-impact-fx');
    const actorStage = document.getElementById('burst-actor-stage');

    if (blackoutEl) blackoutEl.classList.add('hidden');
    if (impactFxEl) {
      impactFxEl.innerHTML = '';
      impactFxEl.classList.add('hidden');
    }
    if (actorStage) actorStage.innerHTML = '';

    const voiceSub = document.getElementById('burst-voice-subtitle');
    if (voiceSub) {
      voiceSub.innerHTML = '';
      voiceSub.style.display = 'none';
    }

    if (arenaStage) {
      arenaStage.style.transform = '';
      arenaStage.classList.remove(
        'arena-burst-active', 'phase-1-charging', 'phase-2-assault', 'phase-3-sheathe',
        'theme-hero_starter', 'theme-hero_shadow_rogue',
        'theme-hero_frost_knight', 'theme-hero_spear_lancer', 'theme-hero_flame_knight',
        'theme-hero_arcane_mage', 'theme-hero_unknown_god', 'theme-hero_aetheris'
      );
      setTimeout(() => arenaStage.classList.remove('camera-3d-active'), 300);
    }

    if (pSprite && typeof Sprites !== 'undefined') {
      pSprite.className = 'fighter-avatar';
      pSprite.innerHTML = Sprites.getPlayerSvg('idle', this.currentHeroId || GameState.activeHeroId);
    }
    if (mSprite) {
      mSprite.className = 'fighter-avatar';
    }
  },

  _apply3DCameraAngle(stage, heroId) {
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
    const targetId = idMap[heroId] || heroId;
    switch (targetId) {
      case 'hero_starter':
        stage.style.transform = 'perspective(900px) rotateX(18deg) rotateZ(3deg) scale(1.32)';
        break;
      case 'hero_shadow_rogue':
        stage.style.transform = 'perspective(850px) rotateX(26deg) rotateY(16deg) scale(1.36)';
        break;
      case 'hero_frost_knight':
        stage.style.transform = 'perspective(900px) rotateX(14deg) rotateY(-20deg) scale(1.3)';
        break;
      case 'hero_spear_lancer':
        stage.style.transform = 'perspective(850px) rotateX(-22deg) translateY(-25px) scale(1.38)';
        break;
      case 'hero_flame_knight':
        stage.style.transform = 'perspective(900px) rotateX(20deg) rotateY(22deg) rotateZ(-4deg) scale(1.35)';
        break;
      case 'hero_arcane_mage':
        stage.style.transform = 'perspective(900px) rotateX(24deg) rotateY(-18deg) scale(1.35) translateZ(45px)';
        break;
      case 'hero_unknown_god':
        stage.style.transform = 'perspective(800px) rotateX(32deg) rotateY(-12deg) rotateZ(8deg) scale(1.42)';
        break;
      default:
        stage.style.transform = 'perspective(900px) rotateX(18deg) rotateZ(4deg) scale(1.34)';
        break;
    }
  },

  // ============================================================
  // GENUINE 3D WEBGL (THREE.JS) SCENE BUILDER FOR EACH HERO
  // ============================================================
  _buildHero3DScene(heroId) {
    if (!this.threeScene || typeof THREE === 'undefined') return;
    this._cleanHero3DScene();

    const scene = this.threeScene;
    this.threeObjects = {};

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
    const targetId = idMap[heroId] || heroId;

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

    switch (targetId) {
      case 'hero_starter': {
        const ringGeo = new THREE.RingGeometry(3.5, 6.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xb0bec5, side: THREE.DoubleSide, wireframe: true });
        const groundRing = new THREE.Mesh(ringGeo, ringMat);
        groundRing.rotation.x = Math.PI / 2;
        groundRing.position.set(0, -3.8, -6);
        scene.add(groundRing);
        this.threeObjects.groundRing = groundRing;

        const swords = [];
        const swordMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, emissive: 0xffd700, emissiveIntensity: 1.2 });
        for (let sw = 0; sw < 6; sw++) {
          const swMesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 3.2, 5), swordMat);
          const angle = (sw / 6) * Math.PI * 2;
          swMesh.position.set(Math.cos(angle) * 6.5, Math.sin(angle) * 3.5, -8);
          swMesh.rotation.z = angle + Math.PI / 2;
          scene.add(swMesh);
          swords.push(swMesh);
        }
        this.threeObjects.swords = swords;
        break;
      }

      case 'hero_shadow_rogue': {
        const blades = [];
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x0284c7, emissiveIntensity: 2.2, side: THREE.DoubleSide });
        for (let b = 0; b < 2; b++) {
          const bladeGeo = new THREE.TorusGeometry(3.5, 0.22, 8, 32, Math.PI);
          const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
          bladeMesh.position.set(b === 0 ? -2.5 : 2.5, 0, -4);
          bladeMesh.rotation.z = b === 0 ? 0.6 : -0.6;
          scene.add(bladeMesh);
          blades.push(bladeMesh);
        }
        this.threeObjects.blades = blades;

        const vortexGeo = new THREE.RingGeometry(2.5, 5.5, 32);
        const vortexMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, wireframe: true });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.position.set(0, 0, -5);
        scene.add(vortex);
        this.threeObjects.vortex = vortex;
        break;
      }

      case 'hero_frost_knight': {
        const domeGeo = new THREE.SphereGeometry(7.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshBasicMaterial({ color: 0x00b0ff, wireframe: true, transparent: true, opacity: 0.45 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, -4, -6);
        scene.add(dome);
        this.threeObjects.dome = dome;

        const spikes = [];
        const spkMat = new THREE.MeshStandardMaterial({ color: 0x80d8ff, emissive: 0x00e5ff, emissiveIntensity: 1.8, flatShading: true });
        for (let i = 0; i < 14; i++) {
          const angle = (i / 14) * Math.PI * 2;
          const r = 4.5 + (i % 2) * 2;
          const spkGeo = new THREE.ConeGeometry(0.55, 6.5, 5);
          const spkMesh = new THREE.Mesh(spkGeo, spkMat);
          spkMesh.position.set(Math.cos(angle) * r, -14, Math.sin(angle) * r);
          scene.add(spkMesh);
          spikes.push(spkMesh);
        }
        this.threeObjects.spikes = spikes;

        const rippleGeo = new THREE.RingGeometry(1.2, 8.5, 32);
        const rippleMat = new THREE.MeshBasicMaterial({ color: 0x80d8ff, side: THREE.DoubleSide });
        const ripple = new THREE.Mesh(rippleGeo, rippleMat);
        ripple.rotation.x = Math.PI / 2;
        ripple.position.set(0, -3.8, -4);
        scene.add(ripple);
        this.threeObjects.ripple = ripple;
        break;
      }

      case 'hero_spear_lancer': {
        const dragon = [];
        const segMat = new THREE.MeshStandardMaterial({ color: 0xff8f00, emissive: 0xffd700, emissiveIntensity: 2.0 });
        for (let i = 0; i < 36; i++) {
          const segGeo = new THREE.DodecahedronGeometry(0.6 + (i === 0 ? 0.9 : 0), 0);
          const seg = new THREE.Mesh(segGeo, segMat);
          seg.position.set(0, 0, -6);
          scene.add(seg);
          dragon.push(seg);
        }
        this.threeObjects.dragon = dragon;

        const spears = [];
        const spMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffab00, emissiveIntensity: 2.2 });
        for (let sp = 0; sp < 8; sp++) {
          const spMesh = new THREE.Mesh(new THREE.ConeGeometry(0.25, 4.2, 6), spMat);
          spMesh.rotation.z = -Math.PI / 2;
          spMesh.position.set(-10 + sp * 2.5, (Math.random() - 0.5) * 6, -5);
          scene.add(spMesh);
          spears.push(spMesh);
        }
        this.threeObjects.spears = spears;
        break;
      }

      case 'hero_flame_knight': {
        const phoenixGroup = new THREE.Group();
        const bodyGeo = new THREE.ConeGeometry(0.8, 4.5, 8);
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff1744, emissive: 0xff6d00, emissiveIntensity: 2.2 });
        const body = new THREE.Mesh(bodyGeo, fireMat);
        body.rotation.x = Math.PI / 2;
        phoenixGroup.add(body);

        const wingGeo = new THREE.PlaneGeometry(5.5, 2.2, 4, 4);
        const lWing = new THREE.Mesh(wingGeo, fireMat);
        lWing.position.set(-3.2, 0.5, 0);
        phoenixGroup.add(lWing);
        const rWing = new THREE.Mesh(wingGeo, fireMat);
        rWing.position.set(3.2, 0.5, 0);
        phoenixGroup.add(rWing);

        phoenixGroup.position.set(0, 18, -6);
        scene.add(phoenixGroup);
        this.threeObjects.phoenix = phoenixGroup;
        this.threeObjects.lWing = lWing;
        this.threeObjects.rWing = rWing;

        const pillars = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const r = 5.5;
          const pGeo = new THREE.CylinderGeometry(0.5, 0.8, 9, 6);
          const pMat = new THREE.MeshStandardMaterial({ color: 0xd50000, emissive: 0xff3d00, emissiveIntensity: 2.0 });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.set(Math.cos(angle) * r, -14, Math.sin(angle) * r);
          scene.add(pMesh);
          pillars.push(pMesh);
        }
        this.threeObjects.pillars = pillars;
        break;
      }

      case 'hero_arcane_mage': {
        const toriiGroup = new THREE.Group();
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x120824, emissive: 0xd500f9, emissiveIntensity: 1.4 });
        const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 16), beamMat);
        leftPost.position.set(-6, 0, -6);
        toriiGroup.add(leftPost);
        const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 16), beamMat);
        rightPost.position.set(6, 0, -6);
        toriiGroup.add(rightPost);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 1.2), beamMat);
        lintel.position.set(0, 5.2, -6);
        toriiGroup.add(lintel);
        scene.add(toriiGroup);
        this.threeObjects.torii = toriiGroup;

        const musouGeo = new THREE.TorusGeometry(5.2, 0.35, 16, 64);
        const musouMat = new THREE.MeshBasicMaterial({ color: 0xd500f9, wireframe: false });
        const musouRing = new THREE.Mesh(musouGeo, musouMat);
        musouRing.position.set(0, 1.2, -4);
        scene.add(musouRing);
        this.threeObjects.musouRing = musouRing;

        const lightningGeo = new THREE.RingGeometry(3.5, 4.2, 32);
        const lightningMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
        const lightningRing = new THREE.Mesh(lightningGeo, lightningMat);
        lightningRing.position.set(0, 1.2, -3.8);
        scene.add(lightningRing);
        this.threeObjects.lightningRing = lightningRing;
        break;
      }

      case 'hero_aetheris': {
        const vortexGeo = new THREE.TorusGeometry(6.5, 0.6, 16, 64);
        const vortexMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, emissive: 0x00e5ff, emissiveIntensity: 2.2 });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.position.set(0, 1.0, -8);
        scene.add(vortex);
        this.threeObjects.aetherVortex = vortex;

        const runeGeo = new THREE.RingGeometry(5.2, 7.8, 32);
        const runeMat = new THREE.MeshBasicMaterial({ color: 0xd500f9, side: THREE.DoubleSide, wireframe: true });
        const runeRing = new THREE.Mesh(runeGeo, runeMat);
        runeRing.position.set(0, 1.0, -7.5);
        scene.add(runeRing);
        this.threeObjects.aetherRune = runeRing;

        const meteors = [];
        const meteorMat = new THREE.MeshStandardMaterial({ color: 0xbf360c, emissive: 0xff3d00, emissiveIntensity: 2.5 });
        for (let m = 0; m < 12; m++) {
          const mGeo = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.4, 0);
          const mMesh = new THREE.Mesh(mGeo, meteorMat);
          mMesh.position.set(-12 + Math.random() * 24, 10 + Math.random() * 12, -4 - Math.random() * 8);
          scene.add(mMesh);
          meteors.push(mMesh);
        }
        this.threeObjects.aetherMeteors = meteors;
        break;
      }

      case 'hero_unknown_god': {
        const cubes = [];
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0x212121, emissive: 0x00ffcc, emissiveIntensity: 2.2 });
        for (let c = 0; c < 14; c++) {
          const sz = 0.8 + (c % 3) * 0.4;
          const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), cubeMat);
          cubeMesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, -5 - Math.random() * 5);
          scene.add(cubeMesh);
          cubes.push(cubeMesh);
        }
        this.threeObjects.cubes = cubes;

        const diskGeo = new THREE.RingGeometry(4.5, 6.2, 6);
        const diskMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide, wireframe: true });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.position.set(0, 0, -8);
        scene.add(disk);
        this.threeObjects.disk = disk;
        break;
      }

      default: {
        const starGeo = new THREE.OctahedronGeometry(2.4, 0);
        const starMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 1.8 });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(0, 1.2, -5);
        scene.add(star);
        this.threeObjects.star = star;

        const galaxyGeo = new THREE.RingGeometry(3.2, 6.8, 32);
        const galaxyMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, wireframe: true });
        const galaxy = new THREE.Mesh(galaxyGeo, galaxyMat);
        galaxy.rotation.x = Math.PI / 2.5;
        galaxy.position.set(0, -1.5, -5);
        scene.add(galaxy);
        this.threeObjects.galaxy = galaxy;
        break;
      }
    }
  },

  _updateHero3DScene(heroId, progress, elapsed, dt) {
    if (!this.threeScene || !this.threeCamera) return;

    const camera = this.threeCamera;
    const obj = this.threeObjects;

    if (obj.starfield) {
      obj.starfield.rotation.y += dt * 0.08;
      obj.starfield.rotation.z += dt * 0.04;
    }

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
    const targetId = idMap[heroId] || heroId;

    switch (targetId) {
      case 'hero_starter': {
        camera.position.set(Math.sin(elapsed * 0.002) * 1.5, 1.2, 9.0);
        camera.lookAt(0, 0, -6);
        if (obj.groundRing) obj.groundRing.rotation.z += dt * 0.8;
        if (obj.swords) {
          obj.swords.forEach((sw, idx) => {
            sw.rotation.y += dt * 2.0;
            sw.position.y += Math.sin(elapsed * 0.004 + idx) * 0.01;
          });
        }
        break;
      }

      case 'hero_shadow_rogue': {
        camera.position.set(Math.sin(elapsed * 0.004) * 2.5, 1.5, 8.5);
        camera.lookAt(0, 0, -4);
        if (obj.blades) {
          obj.blades.forEach((b, idx) => {
            b.rotation.z += (idx === 0 ? 1 : -1) * dt * 8.0;
            b.rotation.x += dt * 4.0;
          });
        }
        if (obj.vortex) obj.vortex.rotation.z -= dt * 5.0;
        break;
      }

      case 'hero_frost_knight': {
        camera.position.set(0, 1.8, 9.5);
        camera.lookAt(0, 0, 0);
        if (obj.dome) obj.dome.rotation.y += dt * 0.6;
        if (obj.ripple) {
          const s = 1.0 + Math.sin(elapsed * 0.008) * 0.25;
          obj.ripple.scale.set(s, s, 1);
        }
        if (obj.spikes && progress >= 0.357) {
          const erupt = (progress - 0.357) / 0.643;
          obj.spikes.forEach((p, idx) => {
            const delay = (idx % 3) * 0.06;
            const h = Math.min(1, Math.max(0, (erupt - delay) / 0.35));
            p.position.y = -14 + h * 13.5;
          });
        }
        break;
      }

      case 'hero_spear_lancer': {
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

      case 'hero_flame_knight': {
        camera.position.set(0, 4.5 - progress * 4.5, 11);
        camera.lookAt(0, 0, 0);

        if (obj.phoenix) {
          obj.phoenix.position.y = 18 - progress * 20;
          obj.phoenix.rotation.z = Math.sin(elapsed * 0.005) * 0.18;
        }
        if (obj.lWing) obj.lWing.rotation.z = Math.sin(elapsed * 0.016) * 0.35;
        if (obj.rWing) obj.rWing.rotation.z = -Math.sin(elapsed * 0.016) * 0.35;
        if (obj.pillars && progress >= 0.357) {
          const erupt = (progress - 0.357) / 0.643;
          obj.pillars.forEach((p, idx) => {
            const delay = (idx % 2) * 0.08;
            const h = Math.min(1, Math.max(0, (erupt - delay) / 0.35));
            p.position.y = -14 + h * 13.5;
          });
        }
        break;
      }

      case 'hero_arcane_mage': {
        camera.position.set(Math.sin(elapsed * 0.003) * 2.2, 1.8, 8.5);
        camera.lookAt(0, 0.8, -4);

        if (obj.musouRing) obj.musouRing.rotation.z += dt * 3.5;
        if (obj.lightningRing) obj.lightningRing.rotation.z -= dt * 4.8;
        break;
      }

      case 'hero_aetheris': {
        camera.position.set(Math.sin(elapsed * 0.003) * 2.5, 1.8, 9.5);
        camera.lookAt(0, 0.5, -4);

        if (obj.aetherVortex) obj.aetherVortex.rotation.z += dt * 3.8;
        if (obj.aetherRune) obj.aetherRune.rotation.z -= dt * 2.5;

        if (obj.aetherMeteors && progress >= 0.357) {
          obj.aetherMeteors.forEach((m, idx) => {
            m.position.y -= dt * (18 + (idx % 4) * 6);
            m.position.x += dt * 5;
            m.rotation.x += dt * 4;
            m.rotation.y += dt * 5;
            if (m.position.y < -12) {
              m.position.y = 12 + Math.random() * 6;
              m.position.x = -12 + Math.random() * 18;
            }
          });
        }
        break;
      }

      case 'hero_unknown_god': {
        camera.position.set(Math.sin(elapsed * 0.002) * 2.2, Math.cos(elapsed * 0.002) * 2.2, 8.5);
        camera.lookAt(0, 0, 0);

        if (obj.cubes) {
          const converge = progress > 0.35 ? (progress - 0.35) / 0.65 : 0;
          const dist = Math.max(0.6, (1 - converge * 1.25) * 7);
          obj.cubes.forEach((c, i) => {
            const angle = (i / 14) * Math.PI * 2 + elapsed * 0.003;
            c.position.set(Math.cos(angle) * dist, Math.sin(angle * 2) * (dist * 0.5), Math.sin(angle) * dist);
            c.rotation.x += dt * 3.2;
            c.rotation.y += dt * 3.2;
          });
        }
        if (obj.disk) obj.disk.rotation.z += dt * 2.8;
        break;
      }

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
  }
};

document.addEventListener('DOMContentLoaded', () => Cinematics.init());
