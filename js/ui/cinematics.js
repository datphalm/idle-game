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
  MAX_PARTICLES: 650,

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

      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
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
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
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
      'hero_traveler', 'hero_amber', 'hero_kazuha', 'hero_zhongli',
      'hero_jiyan', 'hero_furina', 'hero_changli', 'hero_raiden', 'hero_unknown_god'
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
    switch (heroId) {
      case 'hero_raiden':
        return [0xd500f9, 0x00e5ff, 0xfff59d, 0x7c4dff, 0xffffff];
      case 'hero_zhongli':
        return [0xffb300, 0xffd54f, 0xff6f00, 0xffe082, 0xffffff];
      case 'hero_changli':
        return [0xff1744, 0xff6d00, 0xffd600, 0xff8a80, 0xffffff];
      case 'hero_unknown_god':
        return [0xd50000, 0xaa00ff, 0xff0055, 0x4a148c, 0xffffff];
      case 'hero_furina':
        return [0x00b0ff, 0x2979ff, 0x80d8ff, 0x00e5ff, 0xffffff];
      case 'hero_kazuha':
        return [0x00e676, 0x1de9b6, 0x69f0ae, 0xb9f6ca, 0xffffff];
      case 'hero_jiyan':
        return [0x00bfa5, 0x00e676, 0x64ffda, 0x1de9b6, 0xffffff];
      case 'hero_amber':
        return [0xff3d00, 0xff9100, 0xffea00, 0xff6e40, 0xffffff];
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
        const inwardProgress = Math.min(1, elapsed / 750);
        const currentRadius = p.baseRadius * (1.0 - inwardProgress * 0.65) + Math.sin(elapsed * 0.012 + p.seed) * 22;
        p.x = cx + Math.cos(p.angle) * currentRadius * 1.25;
        p.y = cy + Math.sin(p.angle) * (currentRadius * 0.55) + Math.cos(elapsed * 0.008 + p.seed) * 16;

        p.sprite.position.set(p.x, p.y);
        p.sprite.alpha = Math.min(1.0, elapsed / 280) * p.alpha;
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

        const disperseElapsed = elapsed - 750;
        const fade = Math.max(0, 1.0 - (disperseElapsed / 1350));
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

    try {
      if (phase === 'intro') {
        if (heroId === 'hero_furina') {
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

    if (elapsed < 420) {
      const t = elapsed / 420;
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
    const shardCount = 28;
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
    seal.lineStyle(2.5, palette[0], 0.75);
    seal.drawEllipse(0, 110, 240, 75);
    seal.lineStyle(1.5, palette[1], 0.5);
    seal.drawEllipse(0, 110, 170, 52);
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
    if (elapsed < 450) {
      const t = elapsed / 450;
      const ease = 1.0 - Math.pow(1.0 - t, 3);
      const scale = 2.6 - (2.6 - 1.08) * ease;
      this.heroContainer.scale.set(scale);

      const targetX = cx + Math.sin(t * Math.PI) * 28;
      const targetY = cy + Math.cos(t * Math.PI * 0.5) * 18;
      this.heroContainer.position.set(targetX, targetY);
    } else if (elapsed < 750) {
      const breath = 1.0 + Math.sin(elapsed * 0.008) * 0.025;
      this.heroContainer.scale.set(1.08 * breath);
      this.heroContainer.position.set(cx, cy + Math.sin(elapsed * 0.005) * 8);
    } else {
      const postElapsed = elapsed - 750;
      const dashProgress = Math.min(1.0, postElapsed / 380);
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

      const hero = skillRes.hero || (typeof CONFIG !== 'undefined' ? CONFIG.getHeroById(GameState.activeHeroId || 'hero_traveler') : null);
      const heroId = hero?.id || 'hero_traveler';
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

      // 2. Build WebGL Layers
      this._buildHeroStageWebGL(heroId);
      this._buildEyeCutinWebGL(heroId);
      this._resetParticlesForBurst(heroId);

      // 3. Shockwave & Chromatic Aberration Spike on Activation
      if (this.shockwaveFilter && this.shockwaveFilter.uniforms) {
        this.shockwaveFilter.uniforms.uProgress = 0.01;
        this.shockwaveFilter.uniforms.uCenter = [0.5, 0.5];
        this.shockwaveFilter.uniforms.uAmplitude = 0.045;
      }
      if (this.chromaticFilter && this.chromaticFilter.uniforms) {
        this.chromaticFilter.uniforms.uIntensity = 1.0;
      }
      if (this.bloomFilter && this.bloomFilter.uniforms) {
        this.bloomFilter.uniforms.uGlowIntensity = 1.2;
      }

      // Play Phase 0 Audio
      this.playBurstAudio(heroId, 'intro');

      // 4. Show Overlay & Hero-Themed CSS
      if (overlay) {
        overlay.className = `burst-overlay burst-active theme-${heroId}`;
      }

      // 5. Build Genuine 3D Three.js Scene
      this._buildHero3DScene(heroId);

      // 6. Dynamic 3D Camera Tilt on 2D Arena
      if (arenaStage) {
        arenaStage.classList.add('camera-3d-active');
        this._apply3DCameraAngle(arenaStage, heroId);
      }

      // 7. Delta-Time 60-144 FPS Rendering Loop
      const startTime = performance.now();
      this.startTime = startTime;
      this.lastTime = startTime;
      const duration = 2100;

      if (this.animId) cancelAnimationFrame(this.animId);

      const render = (now) => {
        if (!this.active) return;
        const dt = Math.min(0.033, (now - this.lastTime) / 1000);
        this.lastTime = now;

        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Phase 1 -> Phase 2 Transition at 750ms (Climax Impact)
        if (progress >= 0.357 && !this.impactFired) {
          this.impactFired = true;

          this._buildRealityShatterWebGL(heroId);
          this._triggerParticleExplosion(heroId);

          if (this.shockwaveFilter && this.shockwaveFilter.uniforms) {
            this.shockwaveFilter.uniforms.uProgress = 0.01;
            this.shockwaveFilter.uniforms.uAmplitude = 0.075;
          }
          if (this.chromaticFilter && this.chromaticFilter.uniforms) {
            this.chromaticFilter.uniforms.uIntensity = 1.0;
          }
          if (this.bloomFilter && this.bloomFilter.uniforms) {
            this.bloomFilter.uniforms.uGlowIntensity = 2.4;
          }

          this.playBurstAudio(heroId, 'climax');

          if (overlay) {
            overlay.classList.add('hitstop-active');
            setTimeout(() => overlay && overlay.classList.remove('hitstop-active'), 65);
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
            const actProgress = Math.min(1.0, elapsed / 360);
            this.shockwaveFilter.uniforms.uProgress = actProgress;
          } else {
            const climProgress = Math.min(1.0, (elapsed - 750) / 950);
            this.shockwaveFilter.uniforms.uProgress = climProgress;
          }
        }

        if (this.chromaticFilter && this.chromaticFilter.uniforms) {
          if (!this.impactFired) {
            this.chromaticFilter.uniforms.uIntensity = Math.max(0.12, 1.0 - (elapsed / 320));
          } else {
            const climElapsed = elapsed - 750;
            this.chromaticFilter.uniforms.uIntensity = Math.max(0.0, 1.0 - (climElapsed / 480));
          }
        }

        if (this.bloomFilter && this.bloomFilter.uniforms) {
          if (!this.impactFired) {
            this.bloomFilter.uniforms.uGlowIntensity = 0.8 + Math.sin(elapsed * 0.015) * 0.4;
          } else {
            const climElapsed = elapsed - 750;
            this.bloomFilter.uniforms.uGlowIntensity = Math.max(0.2, 2.4 - (climElapsed / 600) * 2.0);
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
  // GENUINE 3D WEBGL (THREE.JS) SCENE BUILDER FOR EACH HERO
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
      case 'hero_zhongli': {
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

        const ringGeo = new THREE.RingGeometry(3.8, 7.2, 6);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(0, -4.5, 0);
        scene.add(ringMesh);
        this.threeObjects.groundRing = ringMesh;

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

        const satellites = [];
        for (let sat = 0; sat < 4; sat++) {
          const satGeo = new THREE.DodecahedronGeometry(0.8, 0);
          const satMat = new THREE.MeshStandardMaterial({ color: 0xffb300, emissive: 0xff6f00, emissiveIntensity: 2.0, flatShading: true });
          const satMesh = new THREE.Mesh(satGeo, satMat);
          meteorMesh.add(satMesh);
          satellites.push(satMesh);
        }
        this.threeObjects.satellites = satellites;

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

        const impactLight = new THREE.PointLight(0xffd54f, 0, 60);
        impactLight.position.set(0, -3.5, 0);
        scene.add(impactLight);
        this.threeObjects.impactLight = impactLight;
        break;
      }

      case 'hero_raiden': {
        const toriiGroup = new THREE.Group();
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x120824, emissive: 0xd500f9, emissiveIntensity: 1.2 });
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

      case 'hero_changli': {
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
        break;
      }

      case 'hero_unknown_god': {
        const cubes = [];
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0x212121, emissive: 0xd50000, emissiveIntensity: 1.8 });
        for (let c = 0; c < 12; c++) {
          const sz = 0.8 + (c % 3) * 0.4;
          const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), cubeMat);
          cubeMesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, -5 - Math.random() * 5);
          scene.add(cubeMesh);
          cubes.push(cubeMesh);
        }
        this.threeObjects.cubes = cubes;

        const diskGeo = new THREE.RingGeometry(4.5, 6.2, 6);
        const diskMat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, side: THREE.DoubleSide, wireframe: true });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.position.set(0, 0, -8);
        scene.add(disk);
        this.threeObjects.disk = disk;
        break;
      }

      case 'hero_furina': {
        const domeGeo = new THREE.SphereGeometry(7.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshBasicMaterial({ color: 0x00b0ff, wireframe: true, transparent: true, opacity: 0.45 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, -4, -6);
        scene.add(dome);
        this.threeObjects.dome = dome;

        const rippleGeo = new THREE.RingGeometry(1.2, 8.5, 32);
        const rippleMat = new THREE.MeshBasicMaterial({ color: 0x80d8ff, side: THREE.DoubleSide });
        const ripple = new THREE.Mesh(rippleGeo, rippleMat);
        ripple.rotation.x = Math.PI / 2;
        ripple.position.set(0, -3.8, -4);
        scene.add(ripple);
        this.threeObjects.ripple = ripple;
        break;
      }

      case 'hero_kazuha': {
        const leaves = [];
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x1de9b6, emissiveIntensity: 1.2, side: THREE.DoubleSide });
        for (let l = 0; l < 24; l++) {
          const leafMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), leafMat);
          leafMesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10, -3 - Math.random() * 5);
          scene.add(leafMesh);
          leaves.push(leafMesh);
        }
        this.threeObjects.leaves = leaves;

        const tornadoGeo = new THREE.CylinderGeometry(0.8, 4.2, 14, 16, 8, true);
        const tornadoMat = new THREE.MeshBasicMaterial({ color: 0x69f0ae, wireframe: true, transparent: true, opacity: 0.5 });
        const tornado = new THREE.Mesh(tornadoGeo, tornadoMat);
        tornado.position.set(0, 0, -6);
        scene.add(tornado);
        this.threeObjects.tornado = tornado;
        break;
      }

      case 'hero_jiyan': {
        const dragon = [];
        const segMat = new THREE.MeshStandardMaterial({ color: 0x004d40, emissive: 0x00e676, emissiveIntensity: 1.6 });
        for (let i = 0; i < 36; i++) {
          const segGeo = new THREE.DodecahedronGeometry(0.6 + (i === 0 ? 0.9 : 0), 0);
          const seg = new THREE.Mesh(segGeo, segMat);
          seg.position.set(0, 0, -6);
          scene.add(seg);
          dragon.push(seg);
        }
        this.threeObjects.dragon = dragon;

        const spears = [];
        const spMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x64ffda, emissiveIntensity: 2.0 });
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

      case 'hero_amber': {
        const radarGeo = new THREE.RingGeometry(3.5, 4.2, 32);
        const radarMat = new THREE.MeshBasicMaterial({ color: 0xff3d00, side: THREE.DoubleSide, wireframe: true });
        const radar = new THREE.Mesh(radarGeo, radarMat);
        radar.position.set(0, -1, -5);
        scene.add(radar);
        this.threeObjects.radar = radar;

        const rockets = [];
        const rMat = new THREE.MeshStandardMaterial({ color: 0xff9100, emissive: 0xff3d00, emissiveIntensity: 2.0 });
        for (let r = 0; r < 14; r++) {
          const rk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8), rMat);
          rk.position.set((Math.random() - 0.5) * 10, 14 + Math.random() * 8, -4 - Math.random() * 3);
          rk.rotation.x = Math.PI;
          scene.add(rk);
          rockets.push(rk);
        }
        this.threeObjects.rockets = rockets;
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

    switch (heroId) {
      case 'hero_zhongli': {
        camera.position.set(Math.sin(elapsed * 0.001) * 2.5, 3.5 - progress * 4.5, 9.5);
        camera.lookAt(0, -1.2, 0);

        if (obj.meteor) {
          if (progress < 0.357) {
            const p = progress / 0.357;
            const easeP = p * p;
            obj.meteor.position.set(14 - easeP * 14, 42 - easeP * 44.5, -14 + easeP * 14);
            obj.meteor.rotation.x += dt * 4.5;
            obj.meteor.rotation.y += dt * 3.5;
          } else {
            obj.meteor.position.set(0, -2.5, 0);
            obj.meteor.scale.setScalar(Math.max(0.1, 1.0 - (progress - 0.357) * 2.8));
          }
        }

        if (obj.pillars && progress >= 0.357) {
          const erupt = (progress - 0.357) / 0.643;
          obj.pillars.forEach((p, idx) => {
            const delay = (idx % 3) * 0.08;
            const h = Math.min(1, Math.max(0, (erupt - delay) / 0.35));
            p.position.y = -14 + h * 13.5;
          });
        }
        break;
      }

      case 'hero_raiden': {
        camera.position.set(Math.sin(elapsed * 0.003) * 2.2, 1.8, 8.5);
        camera.lookAt(0, 0.8, -4);

        if (obj.musouRing) obj.musouRing.rotation.z += dt * 3.5;
        if (obj.lightningRing) obj.lightningRing.rotation.z -= dt * 4.8;
        break;
      }

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

      case 'hero_furina': {
        camera.position.set(0, 1.8, 9.5);
        camera.lookAt(0, 0, 0);
        if (obj.dome) obj.dome.rotation.y += dt * 0.6;
        if (obj.ripple) {
          const s = 1.0 + Math.sin(elapsed * 0.008) * 0.25;
          obj.ripple.scale.set(s, s, 1);
        }
        break;
      }

      case 'hero_kazuha': {
        camera.position.set(0, 2.2, 9.5);
        camera.lookAt(0, 0, 0);
        if (obj.tornado) obj.tornado.rotation.y += dt * 4.2;
        if (obj.leaves) {
          obj.leaves.forEach((l, idx) => {
            l.rotation.z += dt * 2.5;
            l.position.y += Math.sin(elapsed * 0.005 + idx) * 0.05;
          });
        }
        break;
      }

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
