import * as THREE from 'three';

/**
 * Helper to append a triangle ensuring outward normal away from center.
 */
function pushOutwardTri(arr, a, b, c, center) {
  const ab = new THREE.Vector3().subVectors(b, a);
  const ac = new THREE.Vector3().subVectors(c, a);
  const n = new THREE.Vector3().crossVectors(ab, ac);
  const mid = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3).sub(center);
  if (n.dot(mid) < 0) {
    arr.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
  } else {
    arr.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
}

/**
 * Faceted round brilliant-cut diamond geometry (flat per-facet normals for crisp sparkle).
 * Oriented with table facing +Z and pavilion culet pointing -Z.
 */
function createBrilliantDiamondGeometry(radius = 0.088, crownH = 0.044, pavH = 0.072) {
  const segs = 8;
  const tableR = radius * 0.56;
  const starR = radius * 0.80;
  const starZ = crownH * 0.56;
  const girdleZ = 0.0;
  const center = new THREE.Vector3(0, 0, -pavH * 0.15);

  const tableCenter = new THREE.Vector3(0, 0, crownH);
  const culet = new THREE.Vector3(0, 0, -pavH);

  const tablePts = [];
  const starPts = [];
  const girdlePts = [];

  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const aMid = ((i + 0.5) / segs) * Math.PI * 2;
    tablePts.push(new THREE.Vector3(Math.cos(a) * tableR, Math.sin(a) * tableR, crownH));
    starPts.push(new THREE.Vector3(Math.cos(aMid) * starR, Math.sin(aMid) * starR, starZ));
    girdlePts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, girdleZ));
    girdlePts.push(new THREE.Vector3(Math.cos(aMid) * radius, Math.sin(aMid) * radius, girdleZ));
  }

  const pos = [];
  for (let i = 0; i < segs; i++) {
    const next = (i + 1) % segs;
    const g0 = girdlePts[i * 2];
    const gMid = girdlePts[i * 2 + 1];
    const g1 = girdlePts[next * 2];
    const t0 = tablePts[i];
    const t1 = tablePts[next];
    const s0 = starPts[i];
    const sPrev = starPts[(i + segs - 1) % segs];

    // Table octagon
    pushOutwardTri(pos, tableCenter, t0, t1, center);
    // Star facet
    pushOutwardTri(pos, t0, s0, t1, center);
    // Upper bezel kite & upper girdle halves
    pushOutwardTri(pos, t0, g0, s0, center);
    pushOutwardTri(pos, t0, sPrev, g0, center);
    pushOutwardTri(pos, s0, g0, gMid, center);
    pushOutwardTri(pos, s0, gMid, g1, center);
    pushOutwardTri(pos, s0, g1, t1, center);
    // Pavilion facets
    pushOutwardTri(pos, g0, culet, gMid, center);
    pushOutwardTri(pos, gMid, culet, g1, center);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Step-cut rectangular baguette diamond geometry with beveled emerald-step crown.
 */
function createBaguetteDiamondGeometry(w = 0.165, h = 0.185, crownH = 0.044, pavH = 0.068) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const s1w = hw * 0.80;
  const s1h = hh * 0.80;
  const tw = hw * 0.58;
  const th = hh * 0.58;
  const zStep = crownH * 0.55;
  const center = new THREE.Vector3(0, 0, -pavH * 0.12);

  const ring = (rx, ry, z) => [
    new THREE.Vector3(-rx, -ry, z),
    new THREE.Vector3( rx, -ry, z),
    new THREE.Vector3( rx,  ry, z),
    new THREE.Vector3(-rx,  ry, z)
  ];

  const g = ring(hw, hh, 0);
  const s1 = ring(s1w, s1h, zStep);
  const t = ring(tw, th, crownH);
  const keelA = new THREE.Vector3(0, -hh * 0.35, -pavH);
  const keelB = new THREE.Vector3(0,  hh * 0.35, -pavH);

  const pos = [];
  // Table
  pushOutwardTri(pos, t[0], t[1], t[2], center);
  pushOutwardTri(pos, t[0], t[2], t[3], center);

  // Two step-cut tiers
  for (let i = 0; i < 4; i++) {
    const n = (i + 1) % 4;
    pushOutwardTri(pos, s1[i], s1[n], t[n], center);
    pushOutwardTri(pos, s1[i], t[n], t[i], center);
    pushOutwardTri(pos, g[i], g[n], s1[n], center);
    pushOutwardTri(pos, g[i], s1[n], s1[i], center);
  }

  // Keel pavilion
  pushOutwardTri(pos, g[0], g[1], keelA, center);
  pushOutwardTri(pos, g[1], g[2], keelB, center);
  pushOutwardTri(pos, g[1], keelB, keelA, center);
  pushOutwardTri(pos, g[2], g[3], keelB, center);
  pushOutwardTri(pos, g[3], g[0], keelA, center);
  pushOutwardTri(pos, g[3], keelA, keelB, center);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Normalize planar XY UVs of an ExtrudeGeometry around (0,0) into [0..1] for radial textures.
 */
function normalizePlanarUVs(geo, radius) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const inv = 1 / (radius * 2);
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) * inv + 0.5, pos.getY(i) * inv + 0.5);
  }
  uv.needsUpdate = true;
}

/**
 * Precision toothed horological gear wheel with spoked cutouts.
 */
function createGearGeometry(outerR, teethCount, thickness, spokes = 5, hubR = null, rimW = null) {
  const toothDepth = Math.min(outerR * 0.11, (Math.PI * 2 * outerR) / (teethCount * 2.1));
  const rootR = outerR - toothDepth;
  const shape = new THREE.Shape();

  for (let i = 0; i < teethCount; i++) {
    const step = (Math.PI * 2) / teethCount;
    const a0 = i * step;
    const a1 = a0 + step * 0.20;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.62;
    const a4 = a0 + step * 0.76;

    const p0x = Math.cos(a0) * rootR,  p0y = Math.sin(a0) * rootR;
    const p1x = Math.cos(a1) * rootR,  p1y = Math.sin(a1) * rootR;
    const p2x = Math.cos(a2) * outerR, p2y = Math.sin(a2) * outerR;
    const p3x = Math.cos(a3) * outerR, p3y = Math.sin(a3) * outerR;
    const p4x = Math.cos(a4) * rootR,  p4y = Math.sin(a4) * rootR;

    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);
    shape.lineTo(p1x, p1y);
    shape.lineTo(p2x, p2y);
    shape.lineTo(p3x, p3y);
    shape.lineTo(p4x, p4y);
  }
  shape.closePath();

  // Spoked cutouts between hub and rim
  if (spokes > 0) {
    const innerHub = hubR ?? rootR * 0.28;
    const innerRim = rootR - (rimW ?? rootR * 0.16);
    const spokeAngHalf = 0.085;
    for (let s = 0; s < spokes; s++) {
      const aStart = (s / spokes) * Math.PI * 2 + spokeAngHalf;
      const aEnd = ((s + 1) / spokes) * Math.PI * 2 - spokeAngHalf;
      if (aEnd <= aStart + 0.08) continue;

      const hole = new THREE.Path();
      const segs = 12;
      hole.moveTo(Math.cos(aStart) * innerHub, Math.sin(aStart) * innerHub);
      for (let k = 0; k <= segs; k++) {
        const a = aStart + ((aEnd - aStart) * k) / segs;
        hole.lineTo(Math.cos(a) * innerRim, Math.sin(a) * innerRim);
      }
      for (let k = segs; k >= 0; k--) {
        const a = aStart + ((aEnd - aStart) * k) / segs;
        hole.lineTo(Math.cos(a) * innerHub, Math.sin(a) * innerHub);
      }
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.008, thickness * 0.22),
    bevelSize: Math.min(0.006, outerR * 0.014),
    bevelSegments: 2,
    curveSegments: 16
  });
  geo.translate(0, 0, -thickness * 0.5);
  normalizePlanarUVs(geo, outerR);
  return geo;
}

/**
 * Faceted openworked dauphine/lancette watch hand.
 */
function createSkeletonHandGeometry(length, maxW, tailLen, thickness = 0.022) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -tailLen);
  shape.quadraticCurveTo(maxW * 0.52, -tailLen * 0.35, maxW * 0.5, length * 0.12);
  shape.lineTo(0, length);
  shape.lineTo(-maxW * 0.5, length * 0.12);
  shape.quadraticCurveTo(-maxW * 0.52, -tailLen * 0.35, 0, -tailLen);
  shape.closePath();

  // Openworked triangular window
  const hole = new THREE.Path();
  hole.moveTo(0, length * 0.72);
  hole.lineTo(-maxW * 0.24, length * 0.17);
  hole.lineTo(maxW * 0.24, length * 0.17);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.55,
    bevelSize: maxW * 0.08,
    bevelSegments: 3,
    curveSegments: 16
  });
  geo.translate(0, 0, -thickness * 0.5);
  return geo;
}

/**
 * Build a swept, padded, rounded-end curved alligator leather strap mesh + exact edge stitch points.
 */
function buildCurvedStrapGeometry(controlPoints, {
  widthStart = 2.02,
  widthEnd = 1.72,
  thicknessCenter = 0.24,
  lengthSegs = 80,
  crossSegs = 28,
  outwardSign = 1,
  roundStart = false,
  roundEnd = true
} = {}) {
  const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);
  const right = new THREE.Vector3(1, 0, 0);

  const positions = [];
  const uvs = [];
  const indices = [];
  const stitchSamples = [];

  // Cross-section parameterization:
  // s in [0..1] goes smoothly around the perimeter of a padded rounded watch strap:
  // top crown (padded leather) -> rounded right edge -> flat soft calfskin underside -> rounded left edge
  const crossProfile = (theta) => {
    // theta from 0..2PI; cos = lateral X (-1..1), sin = vertical thickness (-1..1)
    const cx = Math.cos(theta);
    const sy = Math.sin(theta);
    // Super-ellipse for realistic softly rounded strap sides + padded top dome + flatter inner lining
    const signX = Math.sign(cx);
    const signY = Math.sign(sy);
    const lx = signX * Math.pow(Math.abs(cx), 0.72);
    let ly;
    if (sy >= 0) {
      // Gently pillowed crown on outer alligator face
      const crown = Math.pow(Math.abs(sy), 0.78);
      const centerPad = 0.22 * Math.exp(-lx * lx * 2.4);
      ly = crown * 0.65 + centerPad * Math.pow(Math.abs(sy), 0.4);
    } else {
      // Slightly flatter comfortable calfskin inner lining
      ly = -Math.pow(Math.abs(sy), 0.58) * 0.38;
    }
    return { lx, ly };
  };

  for (let i = 0; i <= lengthSegs; i++) {
    const t = i / lengthSegs;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();

    // Outward normal in YZ plane (zero twist since curve lies in X=0)
    const nrm = new THREE.Vector3().crossVectors(right, tan).normalize().multiplyScalar(outwardSign);

    // Smooth width taper + rounded strap tip/lug wrap
    let wFactor = 1.0;
    let hFactor = 1.0;
    if (roundEnd && t > 0.87) {
      const uTip = (t - 0.87) / 0.13;
      wFactor = Math.sqrt(Math.max(0.02, 1 - uTip * uTip));
      hFactor = Math.max(0.32, Math.sqrt(Math.max(0.08, 1 - uTip * uTip * 0.85)));
    }
    if (roundStart && t < 0.05) {
      const uStart = (0.05 - t) / 0.05;
      hFactor = Math.max(0.68, 1 - uStart * uStart * 0.28);
    }

    const halfW = THREE.MathUtils.lerp(widthStart, widthEnd, t) * 0.5 * wFactor;
    const thick = thicknessCenter * THREE.MathUtils.lerp(1.0, 0.78, t) * hFactor;

    for (let j = 0; j <= crossSegs; j++) {
      const s = j / crossSegs;
      const theta = s * Math.PI * 2;
      const { lx, ly } = crossProfile(theta);

      const vx = p.x + right.x * (lx * halfW) + nrm.x * (ly * thick);
      const vy = p.y + right.y * (lx * halfW) + nrm.y * (ly * thick);
      const vz = p.z + right.z * (lx * halfW) + nrm.z * (ly * thick);
      positions.push(vx, vy, vz);

      // Map U cleanly across outer top surface [0..1] so alligator scales center down the middle
      const uCoord = lx * 0.5 + 0.5;
      uvs.push(uCoord, t * 1.45);
    }

    // Collect 3D raised saddle-stitch samples along both strap borders
    if (i >= 2 && i <= lengthSegs - 10 && i % 2 === 0) {
      for (const side of [-1, 1]) {
        const sxLat = side * 0.815;
        const thetaEdge = side > 0 ? 0.62 : Math.PI - 0.62;
        const { ly } = crossProfile(thetaEdge);
        const stitchPos = new THREE.Vector3(
          p.x + sxLat * halfW,
          p.y + nrm.y * (ly * thick + 0.011),
          p.z + nrm.z * (ly * thick + 0.011)
        );
        stitchSamples.push({ pos: stitchPos, tangent: tan.clone(), normal: nrm.clone(), side });
      }
    }
  }

  const stride = crossSegs + 1;
  for (let i = 0; i < lengthSegs; i++) {
    for (let j = 0; j < crossSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      if (outwardSign > 0) {
        indices.push(a, b, c, a, c, d);
      } else {
        indices.push(a, c, b, a, d, c);
      }
    }
  }

  // Smoothly cap the start and rounded tip with outward normals
  const addCap = (ringIdx, reverse) => {
    const centerIdx = positions.length / 3;
    const t = ringIdx / lengthSegs;
    const p = curve.getPoint(t);
    positions.push(p.x, p.y, p.z);
    uvs.push(0.5, t * 1.45);
    for (let j = 0; j < crossSegs; j++) {
      const v0 = ringIdx * stride + j;
      const v1 = ringIdx * stride + j + 1;
      if (reverse) indices.push(centerIdx, v0, v1);
      else indices.push(centerIdx, v1, v0);
    }
  };
  addCap(0, outwardSign > 0);
  addCap(lengthSegs, outwardSign < 0);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return { geometry: geo, stitchSamples };
}

/**
 * Construct the entire HALCYON HT-01 Flying Tourbillon 3D watch assembly.
 * Returns { watchRoot, materials, animated, interactive, bezelMeshes }.
 */
export function buildHalcyonWatch(textures) {
  const watchRoot = new THREE.Group();
  watchRoot.name = 'HalcyonWatchRoot';

  // =========================================================================
  // PHYSICAL MATERIALS (MeshPhysicalMaterial EVERYWHERE per upgrade brief)
  // =========================================================================
  const materials = {
    casePolished: new THREE.MeshPhysicalMaterial({
      color: 0xdde1e8,
      metalness: 1.0,
      roughness: 0.16,
      clearcoat: 0.22,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25
    }),
    caseBrushed: new THREE.MeshPhysicalMaterial({
      color: 0xcfd4dc,
      metalness: 1.0,
      roughness: 0.24,
      roughnessMap: textures.brushed.roughnessMap,
      normalMap: textures.brushed.normalMap,
      normalScale: new THREE.Vector2(0.28, 0.28),
      clearcoat: 0.10,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.15
    }),
    casebackEngraved: new THREE.MeshPhysicalMaterial({
      color: 0xc8cdd6,
      map: textures.caseback,
      metalness: 0.96,
      roughness: 0.24,
      clearcoat: 0.12,
      envMapIntensity: 1.15
    }),
    bezelStone: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      attenuationColor: new THREE.Color(0xf4f8ff),
      attenuationDistance: 1.8,
      metalness: 0.0,
      roughness: 0.015,
      transmission: 1.0,
      ior: 2.4,
      thickness: 0.5,
      dispersion: 0.55,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.45,
      emissive: new THREE.Color(0x0b0e14),
      emissiveIntensity: 0.12
    }),
    indices: new THREE.MeshPhysicalMaterial({
      color: 0xdce1ea,
      metalness: 1.0,
      roughness: 0.16,
      clearcoat: 0.25,
      envMapIntensity: 1.4
    }),
    chapterRing: new THREE.MeshPhysicalMaterial({
      color: 0xd6dbe4,
      map: textures.chapterRing,
      metalness: 0.40,
      roughness: 0.45,
      clearcoat: 0.12,
      envMapIntensity: 0.65
    }),
    mainplate: new THREE.MeshPhysicalMaterial({
      color: 0x16181d,
      map: textures.perlage.map,
      normalMap: textures.perlage.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: textures.perlage.roughnessMap,
      metalness: 0.68,
      roughness: 0.62,
      clearcoat: 0.06,
      envMapIntensity: 0.78
    }),
    bridges: new THREE.MeshPhysicalMaterial({
      color: 0x24272e,
      map: textures.geneva.map,
      normalMap: textures.geneva.normalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: textures.geneva.roughnessMap,
      metalness: 0.90,
      roughness: 0.28,
      clearcoat: 0.16,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.25
    }),
    bridgeBevel: new THREE.MeshPhysicalMaterial({
      color: 0xaab2c0,
      metalness: 1.0,
      roughness: 0.16,
      clearcoat: 0.22,
      envMapIntensity: 1.3
    }),
    barrelSunburst: new THREE.MeshPhysicalMaterial({
      color: 0xeef2f8,
      map: textures.sunburst.map,
      normalMap: textures.sunburst.normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: textures.sunburst.roughnessMap,
      metalness: 0.96,
      roughness: 0.25,
      clearcoat: 0.12,
      envMapIntensity: 1.5
    }),
    roseGold: new THREE.MeshPhysicalMaterial({
      color: 0xd9a178,
      metalness: 1.0,
      roughness: 0.19,
      clearcoat: 0.18,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.45
    }),
    tourbillonCage: new THREE.MeshPhysicalMaterial({
      color: 0xe0b58e,
      metalness: 1.0,
      roughness: 0.16,
      clearcoat: 0.22,
      clearcoatRoughness: 0.10,
      envMapIntensity: 1.55
    }),
    rubyJewel: new THREE.MeshPhysicalMaterial({
      color: 0xd90836,
      attenuationColor: new THREE.Color(0x8c001c),
      attenuationDistance: 0.22,
      metalness: 0.04,
      roughness: 0.03,
      transmission: 0.68,
      ior: 1.77,
      thickness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color(0x7a001b),
      emissiveIntensity: 0.55,
      envMapIntensity: 1.9
    }),
    bluedSteel: new THREE.MeshPhysicalMaterial({
      color: 0x1644cc,
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.42,
      clearcoatRoughness: 0.06,
      emissive: new THREE.Color(0x03114a),
      emissiveIntensity: 0.25,
      envMapIntensity: 1.5
    }),
    sapphireCabochon: new THREE.MeshPhysicalMaterial({
      color: 0x1445f5,
      attenuationColor: new THREE.Color(0x04147a),
      attenuationDistance: 0.38,
      metalness: 0.02,
      roughness: 0.025,
      transmission: 0.80,
      ior: 1.77,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color(0x08228a),
      emissiveIntensity: 0.65,
      envMapIntensity: 2.2
    }),
    hands: new THREE.MeshPhysicalMaterial({
      color: 0xedf1f8,
      metalness: 1.0,
      roughness: 0.14,
      clearcoat: 0.25,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.55
    }),
    crystal: new THREE.MeshPhysicalMaterial({
      color: 0xdce8ff,
      metalness: 0.02,
      roughness: 0.025,
      transparent: true,
      opacity: 0.042,
      ior: 1.77,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.035,
      envMapIntensity: 0.48,
      depthWrite: false
    }),
    strap: new THREE.MeshPhysicalMaterial({
      color: 0x0b0c0e,
      map: textures.alligator.map,
      normalMap: textures.alligator.normalMap,
      normalScale: new THREE.Vector2(2.15, 2.15),
      roughnessMap: textures.alligator.roughnessMap,
      metalness: 0.02,
      roughness: 0.50,
      sheen: 0.24,
      sheenRoughness: 0.52,
      sheenColor: new THREE.Color(0x2d3038),
      clearcoat: 0.12,
      clearcoatRoughness: 0.44,
      envMapIntensity: 0.72
    }),
    stitching: new THREE.MeshPhysicalMaterial({
      color: 0xd8dce4,
      metalness: 0.0,
      roughness: 0.72,
      sheen: 0.35,
      sheenRoughness: 0.65,
      envMapIntensity: 0.45
    }),
    interiorDark: new THREE.MeshPhysicalMaterial({
      color: 0x08090c,
      metalness: 0.5,
      roughness: 0.78,
      envMapIntensity: 0.25
    })
  };

  // =========================================================================
  // 1. MULTI-CHAMFERED HIGH-SEGMENT CASE (LatheGeometry 144 segments)
  // =========================================================================
  const casePoints = [
    new THREE.Vector2(1.56, -0.43),
    new THREE.Vector2(1.88, -0.43),
    new THREE.Vector2(2.03, -0.34),
    new THREE.Vector2(2.08, -0.24),
    new THREE.Vector2(2.10,  0.00),
    new THREE.Vector2(2.08,  0.24),
    new THREE.Vector2(2.04,  0.34),
    new THREE.Vector2(2.01,  0.435),
    new THREE.Vector2(1.96,  0.445),
    new THREE.Vector2(1.95,  0.345),
    new THREE.Vector2(1.735, 0.345),
    new THREE.Vector2(1.725, 0.435),
    new THREE.Vector2(1.685, 0.442),
    new THREE.Vector2(1.675, 0.375),
    new THREE.Vector2(1.56,  0.17),
    new THREE.Vector2(1.54, -0.36),
    new THREE.Vector2(1.56, -0.43)
  ];
  const caseGeo = new THREE.LatheGeometry(casePoints, 144);
  caseGeo.rotateX(Math.PI / 2);
  const caseMesh = new THREE.Mesh(caseGeo, materials.casePolished);
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  watchRoot.add(caseMesh);

  // Subtle brushed mid-case flank wrap between upper & lower polished chamfers
  const flankPoints = [
    new THREE.Vector2(2.086, -0.22),
    new THREE.Vector2(2.104,  0.00),
    new THREE.Vector2(2.086,  0.22)
  ];
  const flankGeo = new THREE.LatheGeometry(flankPoints, 144);
  flankGeo.rotateX(Math.PI / 2);
  const flankMesh = new THREE.Mesh(flankGeo, materials.caseBrushed);
  flankMesh.castShadow = true;
  watchRoot.add(flankMesh);

  // Exhibition caseback engraved ring + 6 micro-screws
  const backRingGeo = new THREE.RingGeometry(1.55, 1.92, 128);
  backRingGeo.rotateY(Math.PI);
  const backRingMesh = new THREE.Mesh(backRingGeo, materials.casebackEngraved);
  backRingMesh.position.z = -0.435;
  watchRoot.add(backRingMesh);

  const backScrewGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.03, 24);
  backScrewGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const screw = new THREE.Mesh(backScrewGeo, materials.casePolished);
    screw.position.set(Math.cos(a) * 1.74, Math.sin(a) * 1.74, -0.432);
    watchRoot.add(screw);
  }

  // Rear exhibition sapphire glass
  const rearGlassGeo = new THREE.CircleGeometry(1.55, 128);
  rearGlassGeo.rotateY(Math.PI);
  const rearGlass = new THREE.Mesh(rearGlassGeo, materials.crystal);
  rearGlass.position.z = -0.41;
  watchRoot.add(rearGlass);

  // =========================================================================
  // 2. FOUR SCULPTED CHAMFERED CURVED LUGS + SPRING BARS
  // =========================================================================
  const lugShape = new THREE.Shape();
  // Profile in (y, z) plane: emanates smoothly from caseband and curves gracefully down
  lugShape.moveTo(1.48,  0.27);
  lugShape.bezierCurveTo(1.96, 0.25, 2.38, 0.02, 2.68, -0.34);
  lugShape.quadraticCurveTo(2.77, -0.46, 2.67, -0.58);
  lugShape.quadraticCurveTo(2.54, -0.66, 2.36, -0.56);
  lugShape.bezierCurveTo(2.10, -0.40, 1.82, -0.34, 1.48, -0.32);
  lugShape.closePath();

  const lugGeo = new THREE.ExtrudeGeometry(lugShape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.048,
    bevelSize: 0.042,
    bevelSegments: 6,
    curveSegments: 36
  });
  lugGeo.translate(0, 0, -0.14);
  // Rotate so shape X (which is lug length Y) maps to +Y, shape Y (depth Z) maps to +Z, extrusion Z maps to +X
  const lugMatrix = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 1, 0),  // shape X -> world +Y
    new THREE.Vector3(0, 0, 1),  // shape Y -> world +Z
    new THREE.Vector3(1, 0, 0)   // extrude Z -> world +X
  );
  lugGeo.applyMatrix4(lugMatrix);
  lugGeo.computeVertexNormals();

  const lugConfigs = [
    { x: -1.21, rotZ: 0 },
    { x:  1.21, rotZ: 0 },
    { x: -1.21, rotZ: Math.PI },
    { x:  1.21, rotZ: Math.PI }
  ];
  for (const cfg of lugConfigs) {
    const lug = new THREE.Mesh(lugGeo, materials.casePolished);
    lug.position.x = cfg.x;
    lug.rotation.z = cfg.rotZ;
    lug.castShadow = true;
    lug.receiveShadow = true;
    watchRoot.add(lug);
  }

  // Spring bars between upper & lower lugs
  const springBarGeo = new THREE.CylinderGeometry(0.068, 0.068, 2.16, 32);
  springBarGeo.rotateZ(Math.PI / 2);
  for (const sy of [2.36, -2.36]) {
    const bar = new THREE.Mesh(springBarGeo, materials.caseBrushed);
    bar.position.set(0, sy, -0.25);
    watchRoot.add(bar);
  }

  // =========================================================================
  // 3. BEZEL: INSTANCEDMESH OF 60 FACETED DIAMONDS + BAGUETTES + 120 PRONGS
  // =========================================================================
  const STONE_COUNT = 60;
  const BEZEL_RADIUS = 1.842;

  const brilliantGeo = createBrilliantDiamondGeometry(0.091, 0.048, 0.068);
  const baguetteGeo = createBaguetteDiamondGeometry(0.168, 0.175, 0.048, 0.064);

  const brilliantMesh = new THREE.InstancedMesh(brilliantGeo, materials.bezelStone, STONE_COUNT);
  const baguetteMesh = new THREE.InstancedMesh(baguetteGeo, materials.bezelStone, STONE_COUNT);
  baguetteMesh.visible = false;

  const prongGeo = new THREE.SphereGeometry(0.023, 12, 8);
  const prongsMesh = new THREE.InstancedMesh(prongGeo, materials.casePolished, STONE_COUNT * 2);

  // Subtle metallic foil cup ring right under the stones so transmission reflects brilliantly
  const foilGeo = new THREE.RingGeometry(1.74, 1.945, 128);
  const foilMesh = new THREE.Mesh(foilGeo, materials.casePolished);
  foilMesh.position.z = 0.352;
  watchRoot.add(foilMesh);

  const dummy = new THREE.Object3D();
  let pIdx = 0;
  for (let i = 0; i < STONE_COUNT; i++) {
    const a = (i / STONE_COUNT) * Math.PI * 2;
    const x = Math.cos(a) * BEZEL_RADIUS;
    const y = Math.sin(a) * BEZEL_RADIUS;

    // Slight natural per-stone axial variation for authentic pavé diamond scintillation
    const microTwist = ((i * 7) % 11) * 0.065;
    dummy.position.set(x, y, 0.415);
    dummy.rotation.set(0, 0, a + microTwist);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    brilliantMesh.setMatrixAt(i, dummy.matrix);

    // Baguette tangentially aligned to the bezel circle
    dummy.position.set(x, y, 0.415);
    dummy.rotation.set(0, 0, a + Math.PI / 2);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    baguetteMesh.setMatrixAt(i, dummy.matrix);

    // Inner & outer micro-pavé bead prongs between adjacent diamonds
    const aProng = ((i + 0.5) / STONE_COUNT) * Math.PI * 2;
    for (const rProng of [1.745, 1.938]) {
      dummy.position.set(Math.cos(aProng) * rProng, Math.sin(aProng) * rProng, 0.422);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 0.85);
      dummy.updateMatrix();
      prongsMesh.setMatrixAt(pIdx++, dummy.matrix);
    }
  }
  brilliantMesh.instanceMatrix.needsUpdate = true;
  baguetteMesh.instanceMatrix.needsUpdate = true;
  prongsMesh.instanceMatrix.needsUpdate = true;
  watchRoot.add(brilliantMesh, baguetteMesh, prongsMesh);

  // =========================================================================
  // 4. SLOPED CHAPTER RING (128 segs) & 12 APPLIED FACETED BATON INDICES
  // =========================================================================
  const chapterGeo = new THREE.CylinderGeometry(1.675, 1.548, 0.21, 128, 1, true);
  chapterGeo.rotateX(Math.PI / 2);
  // Flip normals inward toward viewer on open cone
  const cIdx = chapterGeo.index;
  for (let i = 0; i < cIdx.count; i += 3) {
    const tmp = cIdx.getX(i + 1);
    cIdx.setX(i + 1, cIdx.getX(i + 2));
    cIdx.setX(i + 2, tmp);
  }
  chapterGeo.computeVertexNormals();
  const chapterMesh = new THREE.Mesh(chapterGeo, materials.chapterRing);
  chapterMesh.position.z = 0.265;
  watchRoot.add(chapterMesh);

  // Crisp inner metallic skeleton dial flange ring
  const innerFlangeGeo = new THREE.TorusGeometry(1.545, 0.022, 24, 128);
  const innerFlange = new THREE.Mesh(innerFlangeGeo, materials.bridgeBevel);
  innerFlange.position.z = 0.195;
  watchRoot.add(innerFlange);

  // 12 Applied Faceted Baton Hour Indices
  const indexShape = new THREE.Shape();
  indexShape.moveTo(-0.028, 0.0);
  indexShape.lineTo( 0.028, 0.0);
  indexShape.lineTo( 0.018, 0.22);
  indexShape.lineTo(-0.018, 0.22);
  indexShape.closePath();
  const indexGeo = new THREE.ExtrudeGeometry(indexShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.008,
    bevelSegments: 2
  });
  indexGeo.translate(0, -0.11, -0.018);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const idxMesh = new THREE.Mesh(indexGeo, materials.indices);
    const rPos = 1.545;
    idxMesh.position.set(Math.sin(a) * rPos, Math.cos(a) * rPos, 0.245);
    idxMesh.rotation.z = -a + Math.PI;
    // Slight inward tilt matching sloped chapter ring
    idxMesh.rotation.x = Math.cos(a) * 0.14;
    idxMesh.rotation.y = -Math.sin(a) * 0.14;
    watchRoot.add(idxMesh);
  }

  // =========================================================================
  // 5. CALIBRE HT-01 SKELETON MOVEMENT
  // =========================================================================
  const movementGroup = new THREE.Group();
  watchRoot.add(movementGroup);

  // Dark inner movement chamber wall
  const chamberGeo = new THREE.CylinderGeometry(1.545, 1.545, 0.56, 128, 1, true);
  chamberGeo.rotateX(Math.PI / 2);
  const chamberMat = materials.interiorDark.clone();
  chamberMat.side = THREE.BackSide;
  const chamberWall = new THREE.Mesh(chamberGeo, chamberMat);
  chamberWall.position.z = -0.08;
  movementGroup.add(chamberWall);

  // Skeletonized Perlage & Frosted Anthracite Mainplate with 3 dramatic circular cutouts
  const plateShape = new THREE.Shape();
  plateShape.absarc(0, 0, 1.535, 0, Math.PI * 2, false);

  // Large 6 o'clock Flying Tourbillon aperture
  const tourbHole = new THREE.Path();
  tourbHole.absarc(0, -0.76, 0.55, 0, Math.PI * 2, true);
  plateShape.holes.push(tourbHole);

  // Left circular skeleton aperture (9-10 o'clock)
  const leftHole = new THREE.Path();
  leftHole.absarc(-0.74, 0.08, 0.34, 0, Math.PI * 2, true);
  plateShape.holes.push(leftHole);

  // Right circular skeleton aperture (3-4 o'clock)
  const rightHole = new THREE.Path();
  rightHole.absarc(0.78, 0.04, 0.35, 0, Math.PI * 2, true);
  plateShape.holes.push(rightHole);

  // Small lower-right secondary peephole
  const lowRightHole = new THREE.Path();
  lowRightHole.absarc(0.68, -0.52, 0.19, 0, Math.PI * 2, true);
  plateShape.holes.push(lowRightHole);

  const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.10,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.014,
    bevelSegments: 3,
    curveSegments: 96
  });
  plateGeo.translate(0, 0, -0.05);
  normalizePlanarUVs(plateGeo, 1.55);
  const mainplateMesh = new THREE.Mesh(plateGeo, materials.mainplate);
  mainplateMesh.position.z = -0.10;
  mainplateMesh.receiveShadow = true;
  movementGroup.add(mainplateMesh);

  // Polished bevel rim around the 6 o'clock tourbillon aperture
  const tourbRimGeo = new THREE.TorusGeometry(0.555, 0.018, 16, 96);
  const tourbRim = new THREE.Mesh(tourbRimGeo, materials.bridgeBevel);
  tourbRim.position.set(0, -0.76, -0.04);
  movementGroup.add(tourbRim);

  // --- 5B. ROSE-GOLD GEAR TRAIN (4 finely toothed spoked wheels) ---
  const gearCenter = new THREE.Mesh(
    createGearGeometry(0.45, 44, 0.036, 5, 0.12, 0.075),
    materials.roseGold
  );
  gearCenter.position.set(0.0, 0.0, 0.005);
  movementGroup.add(gearCenter);

  const gearThird = new THREE.Mesh(
    createGearGeometry(0.38, 36, 0.034, 5, 0.10, 0.065),
    materials.roseGold
  );
  gearThird.position.set(0.46, -0.34, 0.035);
  movementGroup.add(gearThird);

  const gearFourth = new THREE.Mesh(
    createGearGeometry(0.30, 30, 0.032, 4, 0.085, 0.055),
    materials.roseGold
  );
  gearFourth.position.set(-0.36, 0.22, -0.015);
  movementGroup.add(gearFourth);

  const gearEscape = new THREE.Mesh(
    createGearGeometry(0.27, 15, 0.026, 3, 0.07, 0.045),
    materials.roseGold
  );
  gearEscape.position.set(0.0, -0.76, -0.095);
  movementGroup.add(gearEscape);

  // --- 5C. 12 O'CLOCK SUNBURST MAINSPRING BARREL & RATCHET WHEEL ---
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 0.77, 0.105);
  movementGroup.add(barrelGroup);

  const barrelRatchetGeo = createGearGeometry(0.55, 64, 0.048, 0);
  const barrelRatchet = new THREE.Mesh(barrelRatchetGeo, materials.barrelSunburst);
  barrelGroup.add(barrelRatchet);

  // Inner concentric recessed barrel collar
  const barrelHubRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.022, 16, 64),
    materials.casePolished
  );
  barrelHubRing.position.z = 0.028;
  barrelGroup.add(barrelHubRing);

  // Blued-steel central barrel arbor cap (matches iconic blue jewel/screw at 12 o'clock!)
  const barrelCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.105, 0.045, 48),
    materials.bluedSteel
  );
  barrelCore.rotation.x = Math.PI / 2;
  barrelCore.position.z = 0.034;
  barrelGroup.add(barrelCore);

  // Secondary micro-click screw next to barrel center
  const clickScrew = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.048, 0.042, 32),
    materials.caseBrushed
  );
  clickScrew.rotation.x = Math.PI / 2;
  clickScrew.position.set(0.145, 0.0, 0.032);
  barrelGroup.add(clickScrew);

  // Tiny blued barrel pawl dot at ~1:30 on ratchet
  const barrelPawl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.04, 24),
    materials.bluedSteel
  );
  barrelPawl.rotation.x = Math.PI / 2;
  barrelPawl.position.set(0.24, 0.27, 0.032);
  barrelGroup.add(barrelPawl);

  // --- 5D. SCULPTED CÔTES DE GENÈVE SKELETON BRIDGES (WITH CHAMFERED BEVELS) ---
  const createBridge = (pts, thickness = 0.056, zPos = 0.135) => {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();

    const g = new THREE.ExtrudeGeometry(s, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.013,
      bevelSegments: 3
    });
    g.translate(0, 0, -thickness * 0.5);
    normalizePlanarUVs(g, 1.55);

    const mesh = new THREE.Mesh(g, materials.bridges);
    mesh.position.z = zPos;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Gleaming micro-chamfered silver anglage along bridge edge
    const edgePts = pts.map(([x, y]) => new THREE.Vector3(x, y, zPos + thickness * 0.5 + 0.008));
    edgePts.push(edgePts[0].clone());
    const edgeCurve = new THREE.CatmullRomCurve3(edgePts, true, 'catmullrom', 0.05);
    const bevelTrim = new THREE.Mesh(
      new THREE.TubeGeometry(edgeCurve, 48, 0.0055, 8, true),
      materials.bridgeBevel
    );
    const group = new THREE.Group();
    group.add(mesh, bevelTrim);
    return group;
  };

  // Signature 9-o'clock-to-center horizontal Geneva-striped bridge
  const bridgeLeft = createBridge([
    [-1.49,  0.11],
    [-0.14,  0.075],
    [ 0.08,  0.075],
    [ 0.08, -0.075],
    [-0.14, -0.075],
    [-1.49, -0.11]
  ], 0.052, 0.135);
  movementGroup.add(bridgeLeft);

  // Upper-left V-brace supporting the 12 o'clock barrel
  const bridgeUpperL = createBridge([
    [-1.24,  0.86],
    [-0.36,  0.64],
    [-0.32,  0.48],
    [-1.33,  0.68]
  ], 0.052, 0.145);
  movementGroup.add(bridgeUpperL);

  // Upper-right V-brace supporting the 12 o'clock barrel
  const bridgeUpperR = createBridge([
    [ 1.24,  0.86],
    [ 1.33,  0.68],
    [ 0.32,  0.48],
    [ 0.36,  0.64]
  ], 0.052, 0.145);
  movementGroup.add(bridgeUpperR);

  // Lower-right diagonal/horizontal train bridge
  const bridgeLowerR = createBridge([
    [ 0.18, -0.34],
    [ 1.42, -0.36],
    [ 1.38, -0.54],
    [ 0.18, -0.49]
  ], 0.050, 0.135);
  movementGroup.add(bridgeLowerR);

  // Rear exhibition Côtes de Genève bridges (visible when viewing exhibition caseback!)
  const rearBridgeTop = createBridge([
    [-1.38,  0.45],
    [ 1.38,  0.45],
    [ 1.24,  0.98],
    [-1.24,  0.98]
  ], 0.06, -0.24);
  const rearBridgeMid = createBridge([
    [-1.44,  0.16],
    [ 1.44,  0.16],
    [ 1.44, -0.14],
    [-1.44, -0.14]
  ], 0.06, -0.24);
  movementGroup.add(rearBridgeTop, rearBridgeMid);

  // Blued-steel bridge anchor screws
  const addBluedScrew = (x, y, z, r = 0.044) => {
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 0.036, 24),
      materials.bluedSteel
    );
    screw.rotation.x = Math.PI / 2;
    screw.position.set(x, y, z);
    // Tiny screw slot line
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(r * 1.7, r * 0.24, 0.01),
      materials.interiorDark
    );
    slot.position.set(x, y, z + 0.017);
    slot.rotation.z = 0.45;
    movementGroup.add(screw, slot);
  };
  addBluedScrew(-1.32,  0.00, 0.168, 0.044);
  addBluedScrew( 1.24, -0.45, 0.165, 0.042);
  addBluedScrew(-1.14,  0.74, 0.175, 0.040);
  addBluedScrew( 1.14,  0.74, 0.175, 0.040);

  // --- 5E. SYNTHETIC RED RUBY JEWELS IN ROSE-GOLD CHATONS ---
  const addRubyChaton = (x, y, z, radius = 0.056, parent = movementGroup) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);

    const chaton = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.12, radius * 0.26, 16, 36),
      materials.roseGold
    );
    const ruby = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      materials.rubyJewel
    );
    ruby.scale.set(1, 1, 0.48);
    ruby.position.z = 0.008;

    // Tiny polished pivot steel pin at center of ruby
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, 0.03, 16),
      materials.casePolished
    );
    pin.rotation.x = Math.PI / 2;
    pin.position.z = 0.016;

    g.add(chaton, ruby, pin);
    parent.add(g);
    return g;
  };

  // Visible front ruby jewels
  addRubyChaton( 0.46, -0.34, 0.155, 0.056);
  addRubyChaton( 0.34, -0.43, 0.165, 0.048);
  addRubyChaton(-0.36,  0.22, 0.018, 0.048);
  addRubyChaton( 0.00,  0.00, 0.168, 0.052);
  // Rear exhibition ruby jewels
  addRubyChaton( 0.00,  0.00, -0.285, 0.065);
  addRubyChaton(-0.62,  0.70, -0.285, 0.055);
  addRubyChaton( 0.62,  0.70, -0.285, 0.055);

  // --- 5F. 6 O'CLOCK FLYING TOURBILLON CAGE, BALANCE WHEEL & HAIRSPRING ---
  const tourbillonCage = new THREE.Group();
  tourbillonCage.position.set(0, -0.76, 0.04);
  movementGroup.add(tourbillonCage);

  // Sculpted outer rose-gold cage ring
  const cageOuterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.028, 24, 96),
    materials.tourbillonCage
  );
  cageOuterRing.position.z = 0.05;
  tourbillonCage.add(cageOuterRing);

  // Secondary inner stepped polished ring
  const cageInnerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.39, 0.016, 18, 84),
    materials.casePolished
  );
  cageInnerRing.position.z = 0.015;
  tourbillonCage.add(cageInnerRing);

  // 3 Curved Lyre-Shaped Openworked Rose-Gold Cage Arms
  const armCurvePts = [
    new THREE.Vector3(0.08, 0.0, 0.095),
    new THREE.Vector3(0.22, 0.09, 0.082),
    new THREE.Vector3(0.36, 0.05, 0.062),
    new THREE.Vector3(0.46, 0.0, 0.050)
  ];
  const armCurve = new THREE.CatmullRomCurve3(armCurvePts);
  const armGeo = new THREE.TubeGeometry(armCurve, 28, 0.021, 12, false);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const arm = new THREE.Mesh(armGeo, materials.tourbillonCage);
    arm.rotation.z = a;
    tourbillonCage.add(arm);

    // Pillars linking upper & lower cage levels
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.14, 16),
      materials.casePolished
    );
    pillar.rotation.x = Math.PI / 2;
    pillar.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, -0.01);
    tourbillonCage.add(pillar);
  }

  // Central ruby shock-absorber jewel crowning the flying tourbillon cage
  addRubyChaton(0, 0, 0.105, 0.062, tourbillonCage);

  // Fine blued-steel tourbillon seconds indicator pointer
  const secPointer = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.44, 0.012),
    materials.bluedSteel
  );
  secPointer.position.set(0, 0.22, 0.12);
  tourbillonCage.add(secPointer);

  // Oscillating 4 Hz Free-Sprung Balance Wheel inside the cage
  const balanceWheel = new THREE.Group();
  balanceWheel.position.z = -0.015;
  tourbillonCage.add(balanceWheel);

  const balRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.022, 20, 84),
    materials.roseGold
  );
  balanceWheel.add(balRim);

  // Two opposing crossbars on balance wheel
  const balBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.024, 0.016),
    materials.roseGold
  );
  balanceWheel.add(balBar);

  // 8 Micro-inertia timing weights around balance rim
  const weightGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.036, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const w = new THREE.Mesh(weightGeo, materials.casePolished);
    w.position.set(Math.cos(a) * 0.365, Math.sin(a) * 0.365, 0);
    w.rotation.z = a + Math.PI / 2;
    balanceWheel.add(w);
  }

  // Delicate Blued-Steel Spiral Hairspring (Archimedean spiral TubeGeometry)
  const spiralPts = [];
  const turns = 3.6;
  const totalSpiralPts = 120;
  for (let i = 0; i <= totalSpiralPts; i++) {
    const t = i / totalSpiralPts;
    const a = t * turns * Math.PI * 2;
    const r = 0.055 + t * 0.185;
    spiralPts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.032));
  }
  const hairspringGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(spiralPts),
    120,
    0.0055,
    8,
    false
  );
  const hairspring = new THREE.Mesh(hairspringGeo, materials.bluedSteel);
  tourbillonCage.add(hairspring);

  // =========================================================================
  // 6. FACETED OPENWORKED HANDS (HOUR & MINUTE) + CENTER PINION
  // =========================================================================
  const hourHandGroup = new THREE.Group();
  hourHandGroup.position.z = 0.245;
  const hourMesh = new THREE.Mesh(
    createSkeletonHandGeometry(1.06, 0.165, 0.24, 0.022),
    materials.hands
  );
  hourMesh.castShadow = true;
  hourHandGroup.add(hourMesh);
  watchRoot.add(hourHandGroup);

  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.position.z = 0.285;
  const minuteMesh = new THREE.Mesh(
    createSkeletonHandGeometry(1.48, 0.135, 0.30, 0.020),
    materials.hands
  );
  minuteMesh.castShadow = true;
  minuteHandGroup.add(minuteMesh);
  watchRoot.add(minuteHandGroup);

  // Center pinion dome cap
  const centerHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.13, 0.095, 48),
    materials.hands
  );
  centerHub.rotation.x = Math.PI / 2;
  centerHub.position.z = 0.275;
  const centerPin = new THREE.Mesh(
    new THREE.SphereGeometry(0.058, 32, 16),
    materials.casePolished
  );
  centerPin.scale.set(1, 1, 0.55);
  centerPin.position.z = 0.322;
  watchRoot.add(centerHub, centerPin);

  // =========================================================================
  // 7. 24-FLUTE WINDING CROWN WITH DOMED BLUE SAPPHIRE CABOCHON (3 O'CLOCK)
  // =========================================================================
  const crownGroup = new THREE.Group();
  crownGroup.position.set(2.08, 0, 0);
  watchRoot.add(crownGroup);

  // Crown guard collar / stem tube
  const stemTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.16, 0.22, 48),
    materials.casePolished
  );
  stemTube.rotation.z = Math.PI / 2;
  stemTube.position.x = 0.05;
  crownGroup.add(stemTube);

  // 24-flute sinusoidal crown cylinder
  const flutes = 24;
  const crownShape = new THREE.Shape();
  const flutePts = flutes * 6;
  for (let i = 0; i <= flutePts; i++) {
    const a = (i / flutePts) * Math.PI * 2;
    const r = 0.285 + Math.cos(a * flutes) * 0.026;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) crownShape.moveTo(px, py);
    else crownShape.lineTo(px, py);
  }
  crownShape.closePath();

  const crownBodyGeo = new THREE.ExtrudeGeometry(crownShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.036,
    bevelSize: 0.028,
    bevelSegments: 4,
    curveSegments: 16
  });
  crownBodyGeo.rotateY(Math.PI / 2);
  const crownBody = new THREE.Mesh(crownBodyGeo, materials.casePolished);
  crownBody.position.x = 0.11;
  crownBody.castShadow = true;
  crownGroup.add(crownBody);

  // Chamfered platinum bezel ring framing the sapphire cabochon
  const cabCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.036, 20, 64),
    materials.casePolished
  );
  cabCollar.rotation.y = Math.PI / 2;
  cabCollar.position.x = 0.39;
  crownGroup.add(cabCollar);

  // Metallic reflective seat behind the sapphire cabochon for deep internal blue glow
  const cabSeat = new THREE.Mesh(
    new THREE.CircleGeometry(0.165, 48),
    materials.bluedSteel
  );
  cabSeat.rotation.y = Math.PI / 2;
  cabSeat.position.x = 0.388;
  crownGroup.add(cabSeat);

  // Domed royal blue sapphire cabochon
  const cabochon = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.56),
    materials.sapphireCabochon
  );
  cabochon.rotation.z = -Math.PI / 2;
  cabochon.scale.set(1, 0.92, 1);
  cabochon.position.x = 0.382;
  crownGroup.add(cabochon);

  // Generous invisible raycast collider for effortless click-to-wind
  const crownHitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  crownHitTarget.position.x = 0.28;
  crownHitTarget.userData.isCrown = true;
  crownGroup.add(crownHitTarget);

  // =========================================================================
  // 8. DOMED SAPPHIRE CRYSTAL (128 segments, clearcoat)
  // =========================================================================
  const crystalPts = [];
  const domeSegs = 28;
  const domeR = 1.69;
  for (let i = 0; i <= domeSegs; i++) {
    const t = i / domeSegs;
    const r = t * domeR;
    const zDome = 0.422 + Math.cos(t * Math.PI * 0.5) * 0.115;
    crystalPts.push(new THREE.Vector2(r, zDome));
  }
  const crystalGeo = new THREE.LatheGeometry(crystalPts, 128);
  crystalGeo.rotateX(Math.PI / 2);
  const crystalMesh = new THREE.Mesh(crystalGeo, materials.crystal);
  crystalMesh.renderOrder = 10;
  watchRoot.add(crystalMesh);

  // =========================================================================
  // 9. CURVED ALLIGATOR LEATHER STRAP WITH ROUNDED ENDS & 3D EDGE STITCHES
  // =========================================================================
  const strapGroup = new THREE.Group();
  watchRoot.add(strapGroup);

  // Upper strap fitted flush between upper lugs, arching gracefully into rear cushion loop
  const upperStrap = buildCurvedStrapGeometry(
    [
      new THREE.Vector3(0,  2.14, -0.18),
      new THREE.Vector3(0,  2.84, -0.96),
      new THREE.Vector3(0,  2.42, -2.52),
      new THREE.Vector3(0,  1.10, -3.55),
      new THREE.Vector3(0, -0.58, -3.66)
    ],
    {
      widthStart: 2.02,
      widthEnd: 1.72,
      thicknessCenter: 0.25,
      outwardSign: 1,
      roundStart: true,
      roundEnd: true
    }
  );
  const upperStrapMesh = new THREE.Mesh(upperStrap.geometry, materials.strap);
  upperStrapMesh.castShadow = true;
  upperStrapMesh.receiveShadow = true;
  strapGroup.add(upperStrapMesh);

  // Lower strap fitted flush between lower lugs, curving back into rear clasp
  const lowerStrap = buildCurvedStrapGeometry(
    [
      new THREE.Vector3(0, -2.14, -0.18),
      new THREE.Vector3(0, -2.86, -0.98),
      new THREE.Vector3(0, -2.44, -2.54),
      new THREE.Vector3(0, -1.12, -3.46),
      new THREE.Vector3(0,  0.34, -3.46)
    ],
    {
      widthStart: 2.02,
      widthEnd: 1.74,
      thicknessCenter: 0.24,
      outwardSign: -1,
      roundStart: true,
      roundEnd: true
    }
  );
  const lowerStrapMesh = new THREE.Mesh(lowerStrap.geometry, materials.strap);
  lowerStrapMesh.castShadow = true;
  lowerStrapMesh.receiveShadow = true;
  strapGroup.add(lowerStrapMesh);

  // 3D Raised White/Contrast Saddle-Stitched Edge Line along both straps
  const allStitches = [...upperStrap.stitchSamples, ...lowerStrap.stitchSamples];
  const stitchGeo = new THREE.CapsuleGeometry(0.015, 0.062, 4, 8);
  const stitchMesh = new THREE.InstancedMesh(stitchGeo, materials.stitching, allStitches.length);
  const upAxis = new THREE.Vector3(0, 1, 0);
  const qStitch = new THREE.Quaternion();
  const sDummy = new THREE.Object3D();

  allStitches.forEach((st, idx) => {
    const dir = st.tangent.clone().addScaledVector(new THREE.Vector3(st.side, 0, 0), 0.14).normalize();
    qStitch.setFromUnitVectors(upAxis, dir);
    sDummy.position.copy(st.pos);
    sDummy.quaternion.copy(qStitch);
    sDummy.scale.set(1, 1, 0.72);
    sDummy.updateMatrix();
    stitchMesh.setMatrixAt(idx, sDummy.matrix);
  });
  stitchMesh.instanceMatrix.needsUpdate = true;
  strapGroup.add(stitchMesh);

  // Two stitched alligator leather strap keepers on the rear loop
  const keeperShape = new THREE.Shape();
  const kw = 0.96, kh = 0.26, kr = 0.09;
  keeperShape.moveTo(-kw + kr, -kh);
  keeperShape.lineTo( kw - kr, -kh);
  keeperShape.quadraticCurveTo(kw, -kh, kw, -kh + kr);
  keeperShape.lineTo( kw,  kh - kr);
  keeperShape.quadraticCurveTo(kw,  kh, kw - kr,  kh);
  keeperShape.lineTo(-kw + kr,  kh);
  keeperShape.quadraticCurveTo(-kw,  kh, -kw,  kh - kr);
  keeperShape.lineTo(-kw, -kh + kr);
  keeperShape.quadraticCurveTo(-kw, -kh, -kw + kr, -kh);
  const keeperHole = new THREE.Path();
  keeperHole.absellipse(0, 0, kw - 0.11, kh - 0.10, 0, Math.PI * 2, true, 0);
  keeperShape.holes.push(keeperHole);

  const keeperGeo = new THREE.ExtrudeGeometry(keeperShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 3
  });
  keeperGeo.rotateX(Math.PI / 2);
  for (const ky of [-0.55, -1.10]) {
    const keeper = new THREE.Mesh(keeperGeo, materials.strap);
    keeper.position.set(0, ky, -3.56);
    keeper.castShadow = true;
    strapGroup.add(keeper);
  }

  // Polished platinum tang buckle seated cleanly around rear strap overlap
  const buckleFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.88, 0.052, 16, 48),
    materials.casePolished
  );
  buckleFrame.rotation.x = Math.PI / 2;
  buckleFrame.scale.set(1.04, 0.36, 0.68);
  buckleFrame.position.set(0, 0.05, -3.55);
  buckleFrame.castShadow = true;
  strapGroup.add(buckleFrame);

  return {
    watchRoot,
    materials,
    bezelMeshes: {
      brilliant: brilliantMesh,
      baguette: baguetteMesh
    },
    crystalMesh,
    interactive: {
      crownHitTarget
    },
    animated: {
      tourbillonCage,
      balanceWheel,
      hairspring,
      barrelGroup,
      crownGroup,
      hourHandGroup,
      minuteHandGroup,
      gears: {
        center: gearCenter,
        third: gearThird,
        fourth: gearFourth,
        escape: gearEscape
      }
    }
  };
}
