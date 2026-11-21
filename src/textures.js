import * as THREE from 'three';

function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function heightCanvasToNormalTexture(heightCanvas, strength = 2.6, repeatX = 1, repeatY = 1) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d');
  const src = srcCtx.getImageData(0, 0, w, h).data;

  const { canvas: outCanvas, ctx: outCtx } = createCanvas(w, h);
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;

  const sample = (x, y) => {
    const cx = ((x % w) + w) % w;
    const cy = ((y % h) + h) % h;
    return src[(cy * w + cx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t  = sample(x,     y - 1);
      const tr = sample(x + 1, y - 1);
      const l  = sample(x - 1, y);
      const r  = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b  = sample(x,     y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);

      const idx = (y * w + x) * 4;
      dst[idx]     = Math.round(((-dx * invLen) * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round(((-dy * invLen) * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((( dz * invLen) * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }

  outCtx.putImageData(outImg, 0, 0);
  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function finalizeTexture(canvas, { srgb = false, repeatX = 1, repeatY = 1, clamp = false } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Côtes de Genève (Geneva Stripes) procedural PBR texture set for bridges.
 */
export function createGenevaStripeTextures() {
  const size = 512;
  const stripes = 14;
  const stripeW = size / stripes;

  const { canvas: colorC, ctx: cCtx } = createCanvas(size, size);
  const { canvas: heightC, ctx: hCtx } = createCanvas(size, size);
  const { canvas: roughC, ctx: rCtx } = createCanvas(size, size);

  for (let i = 0; i < stripes; i++) {
    const x0 = i * stripeW;

    // Albedo tonal gradient across each wave rib
    const cg = cCtx.createLinearGradient(x0, 0, x0 + stripeW, 0);
    cg.addColorStop(0.0, '#727680');
    cg.addColorStop(0.08, '#c6cbd4');
    cg.addColorStop(0.42, '#eef1f6');
    cg.addColorStop(0.82, '#9fa5b0');
    cg.addColorStop(0.96, '#5c6068');
    cg.addColorStop(1.0, '#494c54');
    cCtx.fillStyle = cg;
    cCtx.fillRect(x0, 0, stripeW + 0.5, size);

    // Height profile for normal map
    const hg = hCtx.createLinearGradient(x0, 0, x0 + stripeW, 0);
    hg.addColorStop(0.0, '#303030');
    hg.addColorStop(0.12, '#c8c8c8');
    hg.addColorStop(0.45, '#f2f2f2');
    hg.addColorStop(0.85, '#969696');
    hg.addColorStop(1.0, '#282828');
    hCtx.fillStyle = hg;
    hCtx.fillRect(x0, 0, stripeW + 0.5, size);

    // Roughness variation across the abrasive rib
    const rg = rCtx.createLinearGradient(x0, 0, x0 + stripeW, 0);
    rg.addColorStop(0.0, '#888888');
    rg.addColorStop(0.35, '#424242');
    rg.addColorStop(0.75, '#5a5a5a');
    rg.addColorStop(1.0, '#969696');
    rCtx.fillStyle = rg;
    rCtx.fillRect(x0, 0, stripeW + 0.5, size);

    // Fine curved abrasive brush arcs inside each Geneva stripe
    cCtx.save();
    cCtx.beginPath();
    cCtx.rect(x0, 0, stripeW, size);
    cCtx.clip();

    hCtx.save();
    hCtx.beginPath();
    hCtx.rect(x0, 0, stripeW, size);
    hCtx.clip();

    for (let y = -stripeW; y < size + stripeW; y += 3.2) {
      cCtx.strokeStyle = y % 6.4 < 3.2 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
      cCtx.lineWidth = 0.85;
      cCtx.beginPath();
      cCtx.arc(x0 + stripeW * 1.15, y, stripeW * 1.35, Math.PI * 0.72, Math.PI * 1.28);
      cCtx.stroke();

      hCtx.strokeStyle = 'rgba(255,255,255,0.12)';
      hCtx.lineWidth = 0.8;
      hCtx.beginPath();
      hCtx.arc(x0 + stripeW * 1.15, y, stripeW * 1.35, Math.PI * 0.72, Math.PI * 1.28);
      hCtx.stroke();
    }
    cCtx.restore();
    hCtx.restore();
  }

  const map = finalizeTexture(colorC, { srgb: true, repeatX: 3.1, repeatY: 3.1 });
  const normalMap = heightCanvasToNormalTexture(heightC, 3.2, 3.1, 3.1);
  const roughnessMap = finalizeTexture(roughC, { srgb: false, repeatX: 3.1, repeatY: 3.1 });
  for (const t of [map, normalMap, roughnessMap]) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 4.2;
  }

  return { map, normalMap, roughnessMap };
}

/**
 * Perlage (overlapping circular graining) + anthracite micro-sandblast texture for the mainplate.
 */
export function createPerlagePlateTextures() {
  const size = 768;
  const { canvas: colorC, ctx: cCtx } = createCanvas(size, size);
  const { canvas: heightC, ctx: hCtx } = createCanvas(size, size);
  const { canvas: roughC, ctx: rCtx } = createCanvas(size, size);

  cCtx.fillStyle = '#9b9fa8';
  cCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#7c7c7c';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#a0a0a0';
  rCtx.fillRect(0, 0, size, size);

  // Overlapping circular perlage swirls (arranged in concentric horological rings)
  const spacing = 26;
  const radius = 19;
  for (let row = -1; row <= size / spacing + 1; row++) {
    const offset = (row % 2) * (spacing * 0.5);
    for (let col = -1; col <= size / spacing + 1; col++) {
      const cx = col * spacing + offset;
      const cy = row * spacing;

      const cg = cCtx.createRadialGradient(cx, cy, 1, cx, cy, radius);
      cg.addColorStop(0.0, 'rgba(215,220,232,0.28)');
      cg.addColorStop(0.55, 'rgba(130,136,148,0.18)');
      cg.addColorStop(0.86, 'rgba(220,226,238,0.25)');
      cg.addColorStop(1.0, 'rgba(65,70,80,0.26)');
      cCtx.fillStyle = cg;
      cCtx.beginPath();
      cCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      cCtx.fill();

      // Fine concentric graining rings inside each perlage dot
      for (let r = 4; r <= radius; r += 3.5) {
        hCtx.strokeStyle = r % 7 < 3.5 ? 'rgba(235,235,235,0.22)' : 'rgba(55,55,55,0.24)';
        hCtx.lineWidth = 1.0;
        hCtx.beginPath();
        hCtx.arc(cx, cy, r, 0, Math.PI * 2);
        hCtx.stroke();

        rCtx.strokeStyle = r % 7 < 3.5 ? 'rgba(95,95,95,0.25)' : 'rgba(180,180,180,0.22)';
        rCtx.lineWidth = 1.0;
        rCtx.beginPath();
        rCtx.arc(cx, cy, r, 0, Math.PI * 2);
        rCtx.stroke();
      }
    }
  }

  // Fine sandblasted frosted-anthracite micro-sparkle (matches reference dial plate!)
  const cImg = cCtx.getImageData(0, 0, size, size);
  const hImg = hCtx.getImageData(0, 0, size, size);
  const rImg = rCtx.getImageData(0, 0, size, size);

  let seed = 133742;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < cImg.data.length; i += 4) {
    const n = rand();
    const sparkle = n > 0.965 ? 64 : (n - 0.5) * 44;
    cImg.data[i]     = Math.max(0, Math.min(255, cImg.data[i] + sparkle));
    cImg.data[i + 1] = Math.max(0, Math.min(255, cImg.data[i + 1] + sparkle));
    cImg.data[i + 2] = Math.max(0, Math.min(255, cImg.data[i + 2] + sparkle + 2));

    const hn = (rand() - 0.5) * 65;
    const hv = Math.max(0, Math.min(255, hImg.data[i] + hn));
    hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = hv;

    const rv = n > 0.965 ? 45 : Math.max(0, Math.min(255, rImg.data[i] + (rand() - 0.5) * 40));
    rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = rv;
  }

  cCtx.putImageData(cImg, 0, 0);
  hCtx.putImageData(hImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  return {
    map: finalizeTexture(colorC, { srgb: true, repeatX: 1.4, repeatY: 1.4 }),
    normalMap: heightCanvasToNormalTexture(heightC, 2.2, 1.4, 1.4),
    roughnessMap: finalizeTexture(roughC, { srgb: false, repeatX: 1.4, repeatY: 1.4 })
  };
}

/**
 * Radial sunburst brushed texture for the 12 o'clock mainspring barrel ratchet wheel.
 */
export function createSunburstBarrelTextures() {
  const size = 512;
  const half = size / 2;
  const { canvas: colorC, ctx: cCtx } = createCanvas(size, size);
  const { canvas: heightC, ctx: hCtx } = createCanvas(size, size);
  const { canvas: roughC, ctx: rCtx } = createCanvas(size, size);

  cCtx.fillStyle = '#d4d8e0';
  cCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#555555';
  rCtx.fillRect(0, 0, size, size);

  // Anisotropic bright/dark starburst bow-tie reflections + fine radial brushed lines
  const rays = 360;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const bowTie = Math.pow(Math.abs(Math.cos(a * 2 - 0.6)), 1.6);
    const fine = 0.5 + 0.5 * Math.sin(i * 17.3);
    const lum = Math.round(168 + bowTie * 72 + (fine - 0.5) * 28);
    const hLum = Math.round(105 + fine * 95);
    const rLum = Math.round(125 - bowTie * 62 + (fine - 0.5) * 24);

    cCtx.strokeStyle = `rgb(${lum},${lum + 1},${Math.min(255, lum + 4)})`;
    cCtx.lineWidth = 2.4;
    cCtx.beginPath();
    cCtx.moveTo(half, half);
    cCtx.lineTo(half + Math.cos(a) * half * 1.1, half + Math.sin(a) * half * 1.1);
    cCtx.stroke();

    hCtx.strokeStyle = `rgb(${hLum},${hLum},${hLum})`;
    hCtx.lineWidth = 1.6;
    hCtx.beginPath();
    hCtx.moveTo(half, half);
    hCtx.lineTo(half + Math.cos(a) * half * 1.1, half + Math.sin(a) * half * 1.1);
    hCtx.stroke();

    rCtx.strokeStyle = `rgb(${rLum},${rLum},${rLum})`;
    rCtx.lineWidth = 2.2;
    rCtx.beginPath();
    rCtx.moveTo(half, half);
    rCtx.lineTo(half + Math.cos(a) * half * 1.1, half + Math.sin(a) * half * 1.1);
    rCtx.stroke();
  }

  // Concentric snailed bevel circles near the hub
  for (const r of [half * 0.25, half * 0.42, half * 0.88]) {
    cCtx.strokeStyle = 'rgba(40,44,52,0.42)';
    cCtx.lineWidth = 2;
    cCtx.beginPath();
    cCtx.arc(half, half, r, 0, Math.PI * 2);
    cCtx.stroke();

    hCtx.strokeStyle = 'rgba(20,20,20,0.65)';
    hCtx.lineWidth = 2.5;
    hCtx.beginPath();
    hCtx.arc(half, half, r, 0, Math.PI * 2);
    hCtx.stroke();
  }

  return {
    map: finalizeTexture(colorC, { srgb: true, clamp: true }),
    normalMap: heightCanvasToNormalTexture(heightC, 2.4, 1, 1),
    roughnessMap: finalizeTexture(roughC, { srgb: false, clamp: true })
  };
}

/**
 * Fine linear brushed metal roughness + normal texture for case flanks & brushed accents.
 */
export function createBrushedMetalTextures() {
  const size = 256;
  const { canvas: heightC, ctx: hCtx } = createCanvas(size, size);
  const { canvas: roughC, ctx: rCtx } = createCanvas(size, size);

  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#707070';
  rCtx.fillRect(0, 0, size, size);

  let seed = 88421;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let y = 0; y < size; y++) {
    const v = Math.round(92 + rand() * 72);
    hCtx.fillStyle = `rgb(${v},${v},${v})`;
    hCtx.fillRect(0, y, size, 1);

    const rv = Math.round(74 + rand() * 58);
    rCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    rCtx.fillRect(0, y, size, 1);
  }

  return {
    normalMap: heightCanvasToNormalTexture(heightC, 0.8, 4, 2),
    roughnessMap: finalizeTexture(roughC, { srgb: false, repeatX: 4, repeatY: 2 })
  };
}

/**
 * High-contrast chapter ring minute track (60 crisp divisions + 5-min ticks).
 */
export function createChapterRingTexture() {
  const w = 2048;
  const h = 256;
  const { canvas, ctx } = createCanvas(w, h);

  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 0, w, h);

  // Subtle metallic circular gradient across the sloped rehaut
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0.0, '#101216');
  bg.addColorStop(0.45, '#1d2026');
  bg.addColorStop(0.85, '#252932');
  bg.addColorStop(1.0, '#14161b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Thin crisp hairline railway tracks
  ctx.fillStyle = 'rgba(230, 234, 244, 0.25)';
  ctx.fillRect(0, h * 0.26, w, 2);
  ctx.fillRect(0, h * 0.74, w, 2);

  // 60 minute ticks
  for (let i = 0; i < 60; i++) {
    const x = (i / 60) * w;
    const isHour = i % 5 === 0;
    const tickW = isHour ? 5 : 2.2;
    const yTop = isHour ? h * 0.20 : h * 0.30;
    const yBot = isHour ? h * 0.80 : h * 0.70;
    ctx.fillStyle = isHour ? 'rgba(246, 248, 252, 0.88)' : 'rgba(218, 224, 236, 0.56)';
    ctx.fillRect(x - tickW * 0.5, yTop, tickW, yBot - yTop);
  }

  return finalizeTexture(canvas, { srgb: true, repeatX: 1, repeatY: 1 });
}

/**
 * Authentic Mississippiensis Alligator Leather PBR Texture Set (Albedo, Normal, Roughness).
 * U = across strap width (0..1), V = along strap length (repeating).
 */
export function createAlligatorStrapTextures() {
  const w = 1024;
  const h = 1024;
  const { canvas: heightC, ctx: hCtx } = createCanvas(w, h);
  const { canvas: colorC, ctx: cCtx } = createCanvas(w, h);
  const { canvas: roughC, ctx: rCtx } = createCanvas(w, h);

  // Base deep crevices
  hCtx.fillStyle = '#0c0c0c';
  hCtx.fillRect(0, 0, w, h);
  cCtx.fillStyle = '#5a5c62';
  cCtx.fillRect(0, 0, w, h);
  rCtx.fillStyle = '#e8e8e8';
  rCtx.fillRect(0, 0, w, h);

  let seed = 90210;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Helper to draw a softly pillowed organic alligator scale tile
  const drawScale = (cx, cy, rx, ry, cornerR, tilt = 0) => {
    const drawRoundedRect = (ctx, x, y, rw, rh, r) => {
      const cr = Math.min(r, rw * 0.45, rh * 0.45);
      ctx.beginPath();
      ctx.moveTo(x + cr, y);
      ctx.lineTo(x + rw - cr, y);
      ctx.quadraticCurveTo(x + rw, y, x + rw, y + cr);
      ctx.lineTo(x + rw, y + rh - cr);
      ctx.quadraticCurveTo(x + rw, y + rh, x + rw - cr, y + rh);
      ctx.lineTo(x + cr, y + rh);
      ctx.quadraticCurveTo(x, y + rh, x, y + rh - cr);
      ctx.lineTo(x, y + cr);
      ctx.quadraticCurveTo(x, y, x + cr, y);
      ctx.closePath();
    };

    const drawTileOn = (ctx, outerColor, innerColor, layers) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      for (let l = 0; l < layers; l++) {
        const t = l / (layers - 1);
        const s = 1 - t * 0.48;
        const rw = rx * 2 * s;
        const rh = ry * 2 * s;
        ctx.fillStyle = t < 0.15 ? outerColor : innerColor(t);
        drawRoundedRect(ctx, -rw / 2, -rh / 2, rw, rh, cornerR * s);
        ctx.fill();
      }
      ctx.restore();
    };

    // Heightfield: crisp crevice edge rising smoothly to pillowed crown
    drawTileOn(
      hCtx,
      'rgb(42,42,42)',
      (t) => {
        const v = Math.round(70 + Math.pow(t, 0.55) * 175);
        return `rgb(${v},${v},${v})`;
      },
      12
    );

    // Albedo AO: darker creases, brighter raised scale centers
    drawTileOn(
      cCtx,
      'rgb(108,110,115)',
      (t) => {
        const v = Math.round(145 + Math.pow(t, 0.65) * 102);
        return `rgb(${v},${v},${v})`;
      },
      8
    );

    // Roughness: crevices very matte (235), raised scale crowns lustrous satin (95)
    drawTileOn(
      rCtx,
      'rgb(210,210,210)',
      (t) => {
        const v = Math.round(188 - Math.pow(t, 0.6) * 96);
        return `rgb(${v},${v},${v})`;
      },
      8
    );
  };

  // Large square/rectangular belly scales down the middle (2 main belly columns + narrow flanks)
  const rows = 9;
  const rowH = h / rows;

  for (let r = -1; r <= rows; r++) {
    const rowJitter = (rand() - 0.5) * 10;
    const baseY = r * rowH + rowH * 0.5 + rowJitter;
    const splitX = w * (0.5 + (rand() - 0.5) * 0.04);

    // Left belly scale
    const lx0 = w * 0.17;
    const lRx = (splitX - lx0) * 0.455;
    const lRy = rowH * 0.43;
    drawScale(lx0 + (splitX - lx0) * 0.5, baseY, lRx, lRy, 26, (rand() - 0.5) * 0.04);

    // Right belly scale
    const rx1 = w * 0.83;
    const rRx = (rx1 - splitX) * 0.455;
    const rRy = rowH * 0.43;
    drawScale(splitX + (rx1 - splitX) * 0.5, baseY + (rand() - 0.5) * 8, rRx, rRy, 26, (rand() - 0.5) * 0.04);

    // Smaller flank scales on left & right borders (2 sub-rows per belly row)
    for (let sub = 0; sub < 2; sub++) {
      const fy = r * rowH + (sub + 0.5) * (rowH * 0.5) + (rand() - 0.5) * 5;
      drawScale(w * 0.085, fy, w * 0.068, rowH * 0.21, 16, (rand() - 0.5) * 0.08);
      drawScale(w * 0.915, fy + 4, w * 0.068, rowH * 0.21, 16, (rand() - 0.5) * 0.08);
    }
  }

  // Fine horizontal leather micro-creases & subtle organic pores
  hCtx.strokeStyle = 'rgba(0,0,0,0.08)';
  hCtx.lineWidth = 1.2;
  for (let i = 0; i < 420; i++) {
    const sx = rand() * w;
    const sy = rand() * h;
    const len = 12 + rand() * 34;
    hCtx.beginPath();
    hCtx.moveTo(sx, sy);
    hCtx.lineTo(sx + len, sy + (rand() - 0.5) * 6);
    hCtx.stroke();
  }

  // Subtle recessed stitch channel crease near U = 0.095 and U = 0.905
  for (const sx of [w * 0.092, w * 0.908]) {
    hCtx.strokeStyle = 'rgba(0,0,0,0.55)';
    hCtx.lineWidth = 6;
    hCtx.beginPath();
    hCtx.moveTo(sx, 0);
    hCtx.lineTo(sx, h);
    hCtx.stroke();

    cCtx.strokeStyle = 'rgba(40,42,48,0.45)';
    cCtx.lineWidth = 5;
    cCtx.beginPath();
    cCtx.moveTo(sx, 0);
    cCtx.lineTo(sx, h);
    cCtx.stroke();
  }

  // Subtle fine pore grain noise
  const hImg = hCtx.getImageData(0, 0, w, h);
  for (let i = 0; i < hImg.data.length; i += 4) {
    const grain = (rand() - 0.5) * 14;
    const v = Math.max(0, Math.min(255, hImg.data[i] + grain));
    hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = v;
  }
  hCtx.putImageData(hImg, 0, 0);

  return {
    map: finalizeTexture(colorC, { srgb: true, repeatX: 1, repeatY: 1.55 }),
    normalMap: heightCanvasToNormalTexture(heightC, 4.4, 1, 1.55),
    roughnessMap: finalizeTexture(roughC, { srgb: false, repeatX: 1, repeatY: 1.55 })
  };
}

/**
 * Exhibition caseback circular engraving texture.
 */
export function createCasebackEngravingTexture() {
  const size = 1024;
  const half = size / 2;
  const { canvas, ctx } = createCanvas(size, size);

  ctx.fillStyle = '#c8cdd6';
  ctx.fillRect(0, 0, size, size);

  // Subtle circular brushed satin lines
  for (let r = half * 0.72; r < half * 0.98; r += 1.5) {
    ctx.strokeStyle = r % 3 < 1.5 ? 'rgba(255,255,255,0.08)' : 'rgba(40,44,52,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(half, half, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Circular engraved text
  const text = 'HALCYON  ·  HT-01 FLYING TOURBILLON  ·  SWISS MADE  ·  PLATINUM 950  ·  N° 01/18  ·  ';
  ctx.fillStyle = '#2d313a';
  ctx.font = '500 22px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rText = half * 0.855;
  for (let i = 0; i < text.length; i++) {
    const a = (i / text.length) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(half + Math.cos(a) * rText, half + Math.sin(a) * rText);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  return finalizeTexture(canvas, { srgb: true, clamp: true });
}

/**
 * Soft multi-layered ContactShadow alpha texture for beneath the watch strap & lugs.
 */
export function createContactShadowTexture() {
  const size = 512;
  const half = size / 2;
  const { canvas, ctx } = createCanvas(size, size);

  ctx.clearRect(0, 0, size, size);

  // Wide ambient penumbra
  const g1 = ctx.createRadialGradient(half, half, 12, half, half, half * 0.94);
  g1.addColorStop(0.0, 'rgba(0, 0, 0, 0.85)');
  g1.addColorStop(0.32, 'rgba(0, 0, 0, 0.62)');
  g1.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
  g1.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, size, size);

  // Tight crisp contact core directly under strap loop
  ctx.save();
  ctx.translate(half, half * 0.96);
  ctx.scale(0.82, 1.05);
  const g2 = ctx.createRadialGradient(0, 0, 4, 0, 0, half * 0.48);
  g2.addColorStop(0.0, 'rgba(0, 0, 0, 0.95)');
  g2.addColorStop(0.45, 'rgba(0, 0, 0, 0.65)');
  g2.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(0, 0, half * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return finalizeTexture(canvas, { srgb: true, clamp: true });
}
