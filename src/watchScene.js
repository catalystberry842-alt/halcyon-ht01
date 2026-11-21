import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import {
  createGenevaStripeTextures,
  createPerlagePlateTextures,
  createSunburstBarrelTextures,
  createBrushedMetalTextures,
  createChapterRingTexture,
  createAlligatorStrapTextures,
  createCasebackEngravingTexture,
  createContactShadowTexture
} from './textures.js';
import { buildHalcyonWatch } from './watchGeometry.js';
import { CONFIG_OPTIONS, CAMERA_PRESETS, LIGHTING_MOODS, HOTSPOTS } from './config.js';

const FLOOR_Y = -3.02;

/**
 * Custom post-processing shader for light vignette, subtle optical depth-of-field edge blur,
 * and micro-dithering to eliminate dark gradient banding.
 */
const LuxuryOpticsShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uFocusCenter: { value: new THREE.Vector2(0.44, 0.50) },
    uDofAmount: { value: 1.0 },
    uVignetteStrength: { value: 0.36 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform vec2 uFocusCenter;
    uniform float uDofAmount;
    uniform float uVignetteStrength;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      float distFromWatch = length((vUv - uFocusCenter) * aspect);

      // Subtle peripheral depth-of-field bokeh beyond the crisp watch face focus zone
      float coc = smoothstep(0.24, 0.88, distFromWatch) * 1.45 * uDofAmount;
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));

      vec4 col = texture2D(tDiffuse, vUv);
      if (coc > 0.04) {
        vec4 blur = col * 0.24;
        blur += texture2D(tDiffuse, vUv + vec2( coc,  0.0) * texel) * 0.11;
        blur += texture2D(tDiffuse, vUv + vec2(-coc,  0.0) * texel) * 0.11;
        blur += texture2D(tDiffuse, vUv + vec2( 0.0,  coc) * texel) * 0.11;
        blur += texture2D(tDiffuse, vUv + vec2( 0.0, -coc) * texel) * 0.11;
        blur += texture2D(tDiffuse, vUv + vec2( coc,  coc) * texel * 0.72) * 0.08;
        blur += texture2D(tDiffuse, vUv + vec2(-coc,  coc) * texel * 0.72) * 0.08;
        blur += texture2D(tDiffuse, vUv + vec2( coc, -coc) * texel * 0.72) * 0.08;
        blur += texture2D(tDiffuse, vUv + vec2(-coc, -coc) * texel * 0.72) * 0.08;
        col = mix(col, blur, smoothstep(0.04, 0.9, coc));
      }

      // Gentle luxury vignette blending into #050506 edges
      float vigDist = length((vUv - vec2(0.46, 0.50)) * vec2(1.18, 1.05));
      float vig = 1.0 - smoothstep(0.32, 1.08, vigDist) * uVignetteStrength;
      col.rgb *= vig;

      // Subtle 1/255 anti-banding dither
      col.rgb += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;

      gl_FragColor = col;
    }
  `
};

/**
 * Create a radial studio gradient background texture (#1a1b1f center -> #050506 edges).
 */
function createStudioBackdropTexture() {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(w * 0.45, h * 0.48, 20, w * 0.45, h * 0.48, w * 0.62);
  g.addColorStop(0.0, '#1a1b1f');
  g.addColorStop(0.46, '#0e0f12');
  g.addColorStop(0.82, '#070709');
  g.addColorStop(1.0, '#050506');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Create a smooth grayscale radial alpha mask (black outer edge, white center) for the reflective floor.
 */
function createRadialFadeTexture() {
  const size = 512;
  const half = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  const g = ctx.createRadialGradient(half, half, 8, half, half, half * 0.72);
  g.addColorStop(0.0, '#ffffff');
  g.addColorStop(0.32, '#9a9a9a');
  g.addColorStop(0.62, '#2a2a2a');
  g.addColorStop(1.0, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Build a moody luxury-studio RoomEnvironment HDR map via PMREMGenerator.
 * Preserves RoomEnvironment architecture while calibrating dark negative-fill walls
 * and crisp specular studio softboxes so platinum & 60 diamonds show high-contrast reflections.
 */
function createLuxuryStudioEnvironment(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new RoomEnvironment();

  // Calibrate RoomEnvironment base brightness into dark haute-horlogerie studio contrast
  envScene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      if (obj.material.isMeshBasicMaterial) {
        obj.material.color.multiplyScalar(0.24);
      } else if (obj.material.isMeshStandardMaterial) {
        obj.material.color.setHex(0x0b0c10);
        obj.material.roughness = 0.85;
      }
    }
    if (obj.isLight) {
      obj.intensity *= 0.25;
    }
  });

  const addSoftbox = (pos, rot, scale, color, intensity) => {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scale);
    envScene.add(m);
  };

  // Overhead elongated warm-white main softbox (gleaming reflections on top lugs & case bevels)
  addSoftbox([0.4, 9.2, 4.0], [Math.PI * 0.42, 0, 0], [9.5, 2.0, 1], 0xfff4e4, 1.85);
  // Left front vertical studio strip (sculpts left curved lug & diamond facets)
  addSoftbox([-9.2, 2.0, 4.8], [0, Math.PI * 0.34, 0], [2.4, 9.0, 1], 0xeef3ff, 1.85);
  // Right rear cool rim softbox (chisels right chamfered lug, fluted crown & strap edge)
  addSoftbox([9.2, 2.8, -4.6], [0, -Math.PI * 0.62, 0], [2.8, 9.5, 1], 0xaecbff, 2.25);
  // Crisp narrow pinpoint kickers for brilliant-cut diamond fire (no broad lug bloom)
  addSoftbox([6.2, 6.8, 5.8], [Math.PI * 0.26, -Math.PI * 0.25, 0], [0.85, 0.85, 1], 0xffffff, 3.0);
  addSoftbox([-5.4, -2.5, 6.6], [-Math.PI * 0.18, Math.PI * 0.22, 0], [1.0, 1.0, 1], 0xdce8ff, 1.5);
  // Dark negative-fill backdrop behind camera for deep obsidian platinum contrast
  addSoftbox([0, 0, 10.5], [0, Math.PI, 0], [18, 16, 1], 0x030305, 1.0);

  const envRT = pmremGenerator.fromScene(envScene, 0.032);
  envScene.dispose();
  pmremGenerator.dispose();
  return envRT;
}

/**
 * Custom planar blurred studio reflection floor mesh (renders real-time reflection of watch).
 */
function createPlanarReflectionMesh() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      tReflection: { value: null },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uOpacity: { value: 0.22 },
      uTexelSize: { value: new THREE.Vector2(1 / 256, 1 / 256) }
    },
    vertexShader: /* glsl */ `
      uniform mat4 uTextureMatrix;
      varying vec4 vProjUv;
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vProjUv = uTextureMatrix * worldPos;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tReflection;
      uniform float uOpacity;
      uniform vec2 uTexelSize;
      varying vec4 vProjUv;
      varying vec3 vWorldPos;

      void main() {
        vec2 uv = vProjUv.xy / max(vProjUv.w, 0.0001);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

        // Silky-smooth 9-tap frosted-obsidian reflection blur
        vec2 r = uTexelSize * 3.8;
        vec4 c = texture2D(tReflection, uv) * 0.24;
        c += texture2D(tReflection, uv + vec2( r.x,  0.0)) * 0.12;
        c += texture2D(tReflection, uv + vec2(-r.x,  0.0)) * 0.12;
        c += texture2D(tReflection, uv + vec2( 0.0,  r.y)) * 0.12;
        c += texture2D(tReflection, uv + vec2( 0.0, -r.y)) * 0.12;
        c += texture2D(tReflection, uv + vec2( r.x,  r.y)) * 0.07;
        c += texture2D(tReflection, uv + vec2(-r.x,  r.y)) * 0.07;
        c += texture2D(tReflection, uv + vec2( r.x, -r.y)) * 0.07;
        c += texture2D(tReflection, uv + vec2(-r.x, -r.y)) * 0.07;

        // Smooth radial falloff away from under the watch
        float d = length(vWorldPos.xz - vec2(0.0, -0.7));
        float radialFade = 1.0 - smoothstep(0.8, 4.0, d);

        float alpha = c.a * uOpacity * radialFade;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(c.rgb * 0.65, alpha);
      }
    `
  });

  const mesh = new THREE.Mesh(new THREE.CircleGeometry(6.5, 96), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, FLOOR_Y + 0.008, -0.6);
  mesh.renderOrder = 1;
  return mesh;
}

export class HalcyonWatchScene {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.lastFrameTime = performance.now();
    this.elapsed = 0;
    this.simTime = 0;
    this.frameCount = 0;
    this.speedMultiplier = 1.0;

    // Live horological time starts at 09:15:06 (iconic open frame) and ticks live!
    this.watchSeconds = 9 * 3600 + 15 * 60 + 6;
    this.useLocalTime = false;
    this.powerReserveHours = 52.0;
    this.maxReserveHours = 72.0;

    // Winding animation state
    this.windSpinVelocity = 0;
    this.barrelAngle = 0;

    // Auto-rotate state (slow idle rotate that pauses on drag)
    this.autoRotateEnabled = true;
    this.isUserDragging = false;
    this.lastInteractionTime = -999;
    this.idleResumeDelay = 3.8;

    // Smooth 600ms cubic ease-out transitions
    this.activeTweens = [];
    this.cameraTween = null;

    // Hotspots & raycasting
    this.hotspotsVisible = false;
    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.pointerDownPos = new THREE.Vector2();
    this.isHoveringCrown = false;

    this._initRenderer();
    this._initSceneAndLighting();
    this._initWatch();
    this._initReflectiveFloor();
    this._initPostProcessing();
    this._initControls();
    this._initPointerEvents();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._animate();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = LIGHTING_MOODS.noir.exposure;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    if ('physicallyCorrectLights' in this.renderer) {
      this.renderer.physicallyCorrectLights = true;
    }
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  _initSceneAndLighting() {
    this.scene = new THREE.Scene();
    this.backdropTex = createStudioBackdropTexture();
    this.scene.background = this.backdropTex;

    // HDR Environment Map (RoomEnvironment via PMREMGenerator)
    this.envRT = createLuxuryStudioEnvironment(this.renderer);
    this.scene.environment = this.envRT.texture;

    this.camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100);
    const hero = CAMERA_PRESETS.hero;
    this.camera.position.set(...hero.position);

    // 1. Warm Key Light (front-upper-left, casting tight high-res soft shadow)
    this.keyLight = new THREE.DirectionalLight(LIGHTING_MOODS.noir.keyColor, LIGHTING_MOODS.noir.keyIntensity);
    this.keyLight.position.set(-4.8, 7.6, 7.4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 24;
    this.keyLight.shadow.camera.left = -5.5;
    this.keyLight.shadow.camera.right = 5.5;
    this.keyLight.shadow.camera.top = 5.5;
    this.keyLight.shadow.camera.bottom = -5.5;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.025;
    this.keyLight.shadow.radius = 4.0;
    this.scene.add(this.keyLight);

    // 2. Cool Rim Light from behind (chisels platinum lug edges, diamond bezel & strap silhouette)
    this.rimLight = new THREE.DirectionalLight(LIGHTING_MOODS.noir.rimColor, LIGHTING_MOODS.noir.rimIntensity);
    this.rimLight.position.set(5.4, 4.8, -7.2);
    this.scene.add(this.rimLight);

    // 3. Subtle front-lower bounce fill to keep dark anthracite movement legible without washing blacks
    this.fillLight = new THREE.DirectionalLight(LIGHTING_MOODS.noir.fillColor, LIGHTING_MOODS.noir.fillIntensity);
    this.fillLight.position.set(2.8, -1.6, 6.4);
    this.scene.add(this.fillLight);

    // 4. Off-axis pinpoint sparkle kicker for faceted diamond fire (no direct dial glare)
    this.sparkleLight = new THREE.PointLight(LIGHTING_MOODS.noir.sparkleColor, LIGHTING_MOODS.noir.sparkleIntensity, 18, 2.0);
    this.sparkleLight.position.set(5.8, 5.2, 4.2);
    this.scene.add(this.sparkleLight);
  }

  _initWatch() {
    this.textures = {
      geneva: createGenevaStripeTextures(),
      perlage: createPerlagePlateTextures(),
      sunburst: createSunburstBarrelTextures(),
      brushed: createBrushedMetalTextures(),
      chapterRing: createChapterRingTexture(),
      alligator: createAlligatorStrapTextures(),
      caseback: createCasebackEngravingTexture(),
      contactShadow: createContactShadowTexture()
    };

    // Container for watch + slight elegant backward showcase tilt matching reference photo
    this.watchPivot = new THREE.Group();
    this.watchPivot.rotation.x = -0.065;
    this.scene.add(this.watchPivot);

    this.watch = buildHalcyonWatch(this.textures);
    this.watchPivot.add(this.watch.watchRoot);
  }

  _initReflectiveFloor() {
    this.floorGroup = new THREE.Group();
    this.scene.add(this.floorGroup);

    // Subtle glossy obsidian tabletop fading invisibly into #050506 (zero horizon seam)
    const fadeMask = createRadialFadeTexture();
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x06070a,
      metalness: 0.25,
      roughness: 0.34,
      clearcoat: 0.45,
      clearcoatRoughness: 0.28,
      envMapIntensity: 0.34,
      transparent: true,
      alphaMap: fadeMask,
      depthWrite: false
    });
    const floorMesh = new THREE.Mesh(new THREE.CircleGeometry(10.5, 96), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, FLOOR_Y, -0.6);
    floorMesh.receiveShadow = true;
    this.floorGroup.add(floorMesh);

    // Real-time planar blurred reflection layer (256x256 for soft luxury sheen & high FPS)
    this.reflectionRT = new THREE.WebGLRenderTarget(256, 256, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    this.reflectionCamera = new THREE.PerspectiveCamera();
    this.reflectionMesh = createPlanarReflectionMesh();
    this.reflectionMesh.material.uniforms.tReflection.value = this.reflectionRT.texture;
    this.floorGroup.add(this.reflectionMesh);

    // Soft ContactShadow plane nestled directly beneath the lower watch strap
    const contactMat = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      opacity: 0.94,
      depthWrite: false
    });
    const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.8), contactMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(0.0, FLOOR_Y + 0.014, -1.05);
    contactPlane.renderOrder = 2;
    this.floorGroup.add(contactPlane);

    // Soft cast shadow catcher from warm key light
    const shadowCatcher = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 64),
      new THREE.ShadowMaterial({ opacity: 0.58 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(0, FLOOR_Y + 0.018, -0.6);
    shadowCatcher.receiveShadow = true;
    shadowCatcher.renderOrder = 3;
    this.floorGroup.add(shadowCatcher);
  }

  _initPostProcessing() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;

    const msaaTarget = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      samples: 4
    });

    this.composer = new EffectComposer(this.renderer, msaaTarget);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // UnrealBloom: ultra-refined pinpoint diamond sparkle only, zero hazy flare on lugs/dial
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.11,  // whisper-refined luxury sparkle
      0.22,  // crisp pinpoint glint radius
      1.95   // high HDR threshold — strictly diamond facets & sharpest glints
    );
    this.composer.addPass(this.bloomPass);

    // Proper ACESFilmic tone mapping + sRGB conversion
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // Light vignette + subtle optical depth-of-field + anti-banding dither
    this.opticsPass = new ShaderPass(LuxuryOpticsShader);
    this.composer.addPass(this.opticsPass);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 16.5;
    this.controls.minPolarAngle = 0.22;
    this.controls.maxPolarAngle = Math.PI * 0.54;
    this.controls.target.set(...CAMERA_PRESETS.hero.target);
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.isUserDragging = true;
      this.cameraTween = null;
      this.lastInteractionTime = this.elapsed;
    });

    this.controls.addEventListener('end', () => {
      this.isUserDragging = false;
      this.lastInteractionTime = this.elapsed;
    });
  }

  _initPointerEvents() {
    const updatePointer = (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    this.canvas.addEventListener('pointermove', (ev) => {
      updatePointer(ev);
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      const hits = this.raycaster.intersectObject(this.watch.interactive.crownHitTarget, false);
      const hovering = hits.length > 0;
      if (hovering !== this.isHoveringCrown) {
        this.isHoveringCrown = hovering;
        this.canvas.classList.toggle('is-crown-hover', hovering);
      }
    });

    this.canvas.addEventListener('pointerdown', (ev) => {
      this.pointerDownPos.set(ev.clientX, ev.clientY);
    });

    this.canvas.addEventListener('pointerup', (ev) => {
      const moved = Math.hypot(ev.clientX - this.pointerDownPos.x, ev.clientY - this.pointerDownPos.y);
      if (moved > 6) return;

      updatePointer(ev);
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      const hits = this.raycaster.intersectObject(this.watch.interactive.crownHitTarget, false);
      if (hits.length > 0) {
        this.windCrown();
      }
    });
  }

  // =========================================================================
  // 600ms EASE-OUT MATERIAL TRANSITION ENGINE
  // =========================================================================
  _tweenMaterial(mat, targetProps, duration = 600) {
    this.activeTweens = this.activeTweens.filter((tw) => tw.mat !== mat);

    const startProps = {};
    const endProps = {};

    for (const [key, val] of Object.entries(targetProps)) {
      if (val === undefined || !(key in mat)) continue;
      if (mat[key] instanceof THREE.Color) {
        startProps[key] = mat[key].clone();
        endProps[key] = val instanceof THREE.Color ? val.clone() : new THREE.Color(val);
      } else if (typeof mat[key] === 'number') {
        startProps[key] = mat[key];
        endProps[key] = val;
      }
    }

    this.activeTweens.push({
      mat,
      startProps,
      endProps,
      startTime: performance.now(),
      duration
    });
  }

  _updateTweens(now) {
    if (this.activeTweens.length === 0) return;
    const remaining = [];

    for (const tw of this.activeTweens) {
      const rawT = Math.min(1, (now - tw.startTime) / tw.duration);
      const t = 1 - Math.pow(1 - rawT, 3);

      for (const key of Object.keys(tw.endProps)) {
        if (tw.startProps[key] instanceof THREE.Color) {
          tw.mat[key].copy(tw.startProps[key]).lerp(tw.endProps[key], t);
        } else {
          tw.mat[key] = THREE.MathUtils.lerp(tw.startProps[key], tw.endProps[key], t);
        }
      }
      if (rawT < 1) remaining.push(tw);
    }
    this.activeTweens = remaining;
  }

  // =========================================================================
  // PUBLIC CONFIGURATION API (ALL 600ms EASE-OUT)
  // =========================================================================
  applyCase(id) {
    const preset = CONFIG_OPTIONS.case.find((o) => o.id === id);
    if (!preset) return;
    this._tweenMaterial(this.watch.materials.casePolished, preset.material, 600);
    this._tweenMaterial(this.watch.materials.caseBrushed, preset.brushed, 600);
    this._tweenMaterial(this.watch.materials.casebackEngraved, { color: preset.brushed.color }, 600);
  }

  applyBezel(id) {
    const preset = CONFIG_OPTIONS.bezel.find((o) => o.id === id);
    if (!preset) return;
    const isBaguette = preset.cut === 'baguette';
    this.watch.bezelMeshes.brilliant.visible = !isBaguette;
    this.watch.bezelMeshes.baguette.visible = isBaguette;

    this._tweenMaterial(this.watch.materials.bezelStone, preset.stone, 600);
    this._tweenMaterial(this.watch.materials.indices, { color: preset.indexColor }, 600);
  }

  applyMovement(id) {
    const preset = CONFIG_OPTIONS.movement.find((o) => o.id === id);
    if (!preset) return;
    this._tweenMaterial(this.watch.materials.mainplate, {
      color: preset.plateColor,
      roughness: preset.plateRoughness
    }, 600);
    this._tweenMaterial(this.watch.materials.bridges, {
      color: preset.bridgeColor,
      roughness: preset.bridgeRoughness,
      metalness: preset.bridgeMetalness
    }, 600);
    this._tweenMaterial(this.watch.materials.bridgeBevel, {
      color: preset.bevelColor
    }, 600);
  }

  applyHands(id) {
    const preset = CONFIG_OPTIONS.hands.find((o) => o.id === id);
    if (!preset) return;
    this._tweenMaterial(this.watch.materials.hands, preset.material, 600);
  }

  applyStrap(id) {
    const preset = CONFIG_OPTIONS.strap.find((o) => o.id === id);
    if (!preset) return;
    this._tweenMaterial(this.watch.materials.strap, {
      color: preset.color,
      roughness: preset.roughness,
      sheenColor: preset.sheenColor
    }, 600);
    this._tweenMaterial(this.watch.materials.stitching, {
      color: preset.stitchColor
    }, 600);
  }

  applyLightingMood(id) {
    const mood = LIGHTING_MOODS[id];
    if (!mood) return;
    this._tweenMaterial(this.keyLight, { color: mood.keyColor, intensity: mood.keyIntensity }, 600);
    this._tweenMaterial(this.rimLight, { color: mood.rimColor, intensity: mood.rimIntensity }, 600);
    this._tweenMaterial(this.fillLight, { color: mood.fillColor, intensity: mood.fillIntensity }, 600);
    this._tweenMaterial(this.sparkleLight, { color: mood.sparkleColor, intensity: mood.sparkleIntensity }, 600);
    this.renderer.toneMappingExposure = mood.exposure;
  }

  setCameraPreset(presetName, duration = 900) {
    const p = CAMERA_PRESETS[presetName];
    if (!p) return;
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: new THREE.Vector3(...p.position),
      startTarget: this.controls.target.clone(),
      endTarget: new THREE.Vector3(...p.target),
      startTime: performance.now(),
      duration
    };
    this.lastInteractionTime = this.elapsed;
  }

  windCrown(hoursBoost = 4.0) {
    this.windSpinVelocity = Math.min(this.windSpinVelocity + 16.0, 28.0);
    const prev = this.powerReserveHours;
    this.powerReserveHours = Math.min(this.maxReserveHours, +(this.powerReserveHours + hoursBoost).toFixed(1));
    const gained = +(this.powerReserveHours - prev).toFixed(1);
    if (this.callbacks.onWind) {
      this.callbacks.onWind(this.powerReserveHours, gained, this.powerReserveHours >= this.maxReserveHours);
    }
  }

  syncLocalTime() {
    this.useLocalTime = true;
    const now = new Date();
    this.watchSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  }

  setSpeedMultiplier(val) {
    this.speedMultiplier = val;
  }

  setAutoRotate(enabled) {
    this.autoRotateEnabled = enabled;
  }

  setBloom(enabled) {
    this.bloomPass.enabled = enabled;
  }

  setDepthOfField(enabled) {
    this.opticsPass.uniforms.uDofAmount.value = enabled ? 1.0 : 0.0;
  }

  setCrystalVisible(visible) {
    this.watch.crystalMesh.visible = visible;
  }

  setHotspotsVisible(visible) {
    this.hotspotsVisible = visible;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
    this.opticsPass.uniforms.uResolution.value.set(w, h);
  }

  // =========================================================================
  // REAL-TIME PLANAR STUDIO REFLECTION PASS
  // =========================================================================
  _renderPlanarReflection() {
    const cam = this.camera;
    const rCam = this.reflectionCamera;
    rCam.fov = cam.fov;
    rCam.aspect = cam.aspect;
    rCam.near = cam.near;
    rCam.far = cam.far;
    rCam.updateProjectionMatrix();

    rCam.position.set(cam.position.x, 2 * FLOOR_Y - cam.position.y, cam.position.z);
    const reflectedTarget = new THREE.Vector3(
      this.controls.target.x,
      2 * FLOOR_Y - this.controls.target.y,
      this.controls.target.z
    );
    rCam.up.set(0, -1, 0);
    rCam.lookAt(reflectedTarget);
    rCam.updateMatrixWorld();

    // Build texture projection matrix from reflectionCamera
    const texMat = new THREE.Matrix4().set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
    texMat.multiply(rCam.projectionMatrix);
    texMat.multiply(rCam.matrixWorldInverse);
    this.reflectionMesh.material.uniforms.uTextureMatrix.value.copy(texMat);

    // Render watch only into reflectionRT with transparent clear color
    const prevBg = this.scene.background;
    this.scene.background = null;
    this.floorGroup.visible = false;

    const prevTarget = this.renderer.getRenderTarget();
    const prevClearAlpha = this.renderer.getClearAlpha();
    this.renderer.setRenderTarget(this.reflectionRT);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(this.scene, rCam);

    this.renderer.setRenderTarget(prevTarget);
    this.renderer.setClearAlpha(prevClearAlpha);
    this.scene.background = prevBg;
    this.floorGroup.visible = true;
  }

  // =========================================================================
  // 3D HOTSPOT SCREEN PROJECTION
  // =========================================================================
  _projectHotspots() {
    if (!this.hotspotsVisible || !this.callbacks.onHotspotsProject) return;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    const projected = HOTSPOTS.map((hs) => {
      const worldPt = new THREE.Vector3(...hs.localPos);
      this.watch.watchRoot.localToWorld(worldPt);
      const ndc = worldPt.clone().project(this.camera);
      const sx = (ndc.x * 0.5 + 0.5) * w;
      const sy = (-ndc.y * 0.5 + 0.5) * h;

      // Mark occluded if behind watch dial plane relative to camera
      const watchFront = new THREE.Vector3(0, 0, 1).applyQuaternion(this.watchPivot.quaternion);
      const occluded = hs.id !== 'crown' && watchFront.dot(camDir) > 0.35;
      return { id: hs.id, x: sx, y: sy, occluded };
    });

    this.callbacks.onHotspotsProject(projected);
  }

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================
  _animate() {
    requestAnimationFrame(() => this._animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.elapsed += dt;
    const simDt = dt * this.speedMultiplier;
    this.simTime += simDt;

    // 1. Update smooth 600ms cubic ease-out material transitions
    this._updateTweens(now);

    // 2. Smooth camera preset transitions
    if (this.cameraTween) {
      const rawT = Math.min(1, (now - this.cameraTween.startTime) / this.cameraTween.duration);
      const t = 1 - Math.pow(1 - rawT, 3);
      this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, t);
      this.controls.target.lerpVectors(this.cameraTween.startTarget, this.cameraTween.endTarget, t);
      if (rawT >= 1) this.cameraTween = null;
    }

    // 3. Slow idle auto-rotate (serene showcase drift that pauses immediately on drag)
    if (
      this.autoRotateEnabled &&
      !this.isUserDragging &&
      !this.cameraTween &&
      this.elapsed - this.lastInteractionTime > this.idleResumeDelay
    ) {
      const offset = this.camera.position.clone().sub(this.controls.target);
      const angle = dt * 0.065;
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      this.camera.position.copy(this.controls.target).add(offset);
    }

    this.controls.update();

    // 4. Live Watch Movement Mechanics
    if (this.useLocalTime) {
      const d = new Date();
      this.watchSeconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
    } else {
      this.watchSeconds = (this.watchSeconds + simDt) % 86400;
    }

    // Power reserve gradually discharges as mainspring runs
    if (simDt > 0 && this.powerReserveHours > 0) {
      this.powerReserveHours = Math.max(0, this.powerReserveHours - simDt / 3600);
    }

    const hrs = (this.watchSeconds / 3600) % 12;
    const mins = (this.watchSeconds / 60) % 60;
    const secs = this.watchSeconds % 60;

    // Hands: clockwise = negative Z rotation around +Z dial normal
    this.watch.animated.hourHandGroup.rotation.z = -(hrs / 12) * Math.PI * 2;
    this.watch.animated.minuteHandGroup.rotation.z = -(mins / 60) * Math.PI * 2;

    // Flying Tourbillon Cage: 1 full clockwise revolution per 60 seconds
    this.watch.animated.tourbillonCage.rotation.z = -(secs / 60) * Math.PI * 2;

    // Free-sprung Balance Wheel: brisk 4 Hz harmonic oscillation (28,800 vph)
    const balanceOsc = Math.sin(this.simTime * Math.PI * 2 * 4.0);
    this.watch.animated.balanceWheel.rotation.z = balanceOsc * 1.45;
    const springBreath = 1.0 + balanceOsc * 0.045;
    this.watch.animated.hairspring.scale.set(springBreath, springBreath, 1.0);

    // Meshed rose-gold gear train rotation
    this.watch.animated.gears.escape.rotation.z = -this.simTime * 0.9;
    this.watch.animated.gears.third.rotation.z = this.simTime * 0.24;
    this.watch.animated.gears.center.rotation.z = -this.simTime * 0.08;
    this.watch.animated.gears.fourth.rotation.z = this.simTime * 0.16;

    // Crown & 12 o'clock Sunburst Barrel winding animation
    if (this.windSpinVelocity > 0.01) {
      const spinStep = this.windSpinVelocity * dt;
      this.watch.animated.crownGroup.rotation.x += spinStep;
      this.barrelAngle -= spinStep * 0.22;
      this.watch.animated.barrelGroup.rotation.z = this.barrelAngle;
      this.windSpinVelocity *= Math.exp(-dt * 4.6);
    } else {
      this.windSpinVelocity = 0;
    }

    // Update DoF focus center dynamically to track watch center on screen
    const watchCenterNdc = new THREE.Vector3(0, 0, 0);
    this.watchPivot.localToWorld(watchCenterNdc);
    watchCenterNdc.project(this.camera);
    this.opticsPass.uniforms.uFocusCenter.value.set(
      watchCenterNdc.x * 0.5 + 0.5,
      watchCenterNdc.y * 0.5 + 0.5
    );

    // 5. Render planar reflection + main HDR post-processed frame
    if (this.frameCount++ % 2 === 0) {
      this._renderPlanarReflection();
    }
    this.composer.render();

    // 6. Update UI telemetry & 3D projected hotspots
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.watchSeconds, this.powerReserveHours);
    }
    this._projectHotspots();
  }
}
