export const CONFIG_OPTIONS = {
  case: [
    {
      id: 'platinum',
      code: 'PT',
      label: 'Platinum 950',
      swatchType: 'metal',
      swatchBg: 'linear-gradient(135deg, #f8f9fc 0%, #c8cdd6 36%, #eef1f7 56%, #8e94a0 84%, #d6dbe4 100%)',
      material: {
        color: 0xe6e9ef,
        metalness: 1.0,
        roughness: 0.16,
        clearcoat: 0.28,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.55
      },
      brushed: {
        color: 0xd8dce4,
        metalness: 1.0,
        roughness: 0.25,
        clearcoat: 0.12,
        clearcoatRoughness: 0.18,
        envMapIntensity: 1.35
      }
    },
    {
      id: 'rosegold',
      code: 'RG',
      label: '18k Champagne Gold',
      swatchType: 'metal',
      swatchBg: 'linear-gradient(135deg, #f4e6d2 0%, #b9a487 38%, #dfd0ba 58%, #6d5d49 88%, #c9b597 100%)',
      material: {
        color: 0xd9c2a3,
        metalness: 1.0,
        roughness: 0.17,
        clearcoat: 0.26,
        clearcoatRoughness: 0.09,
        envMapIntensity: 1.5
      },
      brushed: {
        color: 0xc9b08e,
        metalness: 1.0,
        roughness: 0.26,
        clearcoat: 0.12,
        clearcoatRoughness: 0.18,
        envMapIntensity: 1.3
      }
    },
    {
      id: 'titanium',
      code: 'TI',
      label: 'Grade 5 Titanium',
      swatchType: 'metal',
      swatchBg: 'repeating-linear-gradient(115deg, #74777e 0px, #4f5259 2px, #8c9098 4px, #3b3e44 7px)',
      material: {
        color: 0x8d9199,
        metalness: 1.0,
        roughness: 0.24,
        clearcoat: 0.14,
        clearcoatRoughness: 0.16,
        envMapIntensity: 1.35
      },
      brushed: {
        color: 0x777b84,
        metalness: 1.0,
        roughness: 0.34,
        clearcoat: 0.05,
        clearcoatRoughness: 0.26,
        envMapIntensity: 1.15
      }
    },
    {
      id: 'dlc',
      code: 'BK',
      label: 'Black DLC Ceramic',
      swatchType: 'metal',
      swatchBg: 'radial-gradient(circle at 34% 30%, #44474f 0%, #1c1d22 52%, #0a0a0c 100%)',
      material: {
        color: 0x26282e,
        metalness: 0.92,
        roughness: 0.23,
        clearcoat: 0.35,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.25
      },
      brushed: {
        color: 0x1c1e23,
        metalness: 0.88,
        roughness: 0.36,
        clearcoat: 0.18,
        clearcoatRoughness: 0.24,
        envMapIntensity: 1.05
      }
    }
  ],

  bezel: [
    {
      id: 'white-diamond',
      code: 'D',
      label: 'White diamond',
      swatchType: 'faceted',
      swatchBg: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e4e8f0 42%, #9da4b2 78%, #f4f7fc 100%)',
      cut: 'brilliant',
      stone: {
        color: 0xffffff,
        attenuationColor: 0xf4f8ff,
        attenuationDistance: 1.8,
        metalness: 0.0,
        roughness: 0.015,
        transmission: 1.0,
        ior: 2.4,
        thickness: 0.5,
        dispersion: 0.55,
        envMapIntensity: 3.1,
        emissive: 0x141820,
        emissiveIntensity: 0.15
      },
      indexColor: 0xeff2f7
    },
    {
      id: 'blue-sapphire',
      code: 'S',
      label: 'Blue sapphire',
      swatchType: 'faceted',
      swatchBg: 'radial-gradient(circle at 35% 28%, #6d9bff 0%, #2450cc 46%, #0c1f6b 84%, #3c6ef2 100%)',
      cut: 'brilliant',
      stone: {
        color: 0x2e64ff,
        attenuationColor: 0x0b2aa8,
        attenuationDistance: 0.55,
        metalness: 0.02,
        roughness: 0.02,
        transmission: 0.94,
        ior: 1.77,
        thickness: 0.55,
        dispersion: 0.18,
        envMapIntensity: 2.8,
        emissive: 0x041240,
        emissiveIntensity: 0.25
      },
      indexColor: 0x9bb8f5
    },
    {
      id: 'black-diamond',
      code: 'BD',
      label: 'Black diamond',
      swatchType: 'faceted',
      swatchBg: 'radial-gradient(circle at 35% 30%, #6d717c 0%, #2b2d34 45%, #0d0e12 85%, #4d515c 100%)',
      cut: 'brilliant',
      stone: {
        color: 0x22252d,
        attenuationColor: 0x0d0e12,
        attenuationDistance: 0.25,
        metalness: 0.72,
        roughness: 0.04,
        transmission: 0.35,
        ior: 2.4,
        thickness: 0.5,
        dispersion: 0.2,
        envMapIntensity: 2.9,
        emissive: 0x06070a,
        emissiveIntensity: 0.1
      },
      indexColor: 0x7b808c
    },
    {
      id: 'baguette-diamond',
      code: 'BG',
      label: 'Baguette diamond',
      swatchType: 'baguette',
      swatchBg: 'linear-gradient(145deg, #f8fafd 0%, #b5bcc8 35%, #eef2f8 58%, #838a96 86%, #e7ecf4 100%)',
      cut: 'baguette',
      stone: {
        color: 0xffffff,
        attenuationColor: 0xeef4ff,
        attenuationDistance: 2.0,
        metalness: 0.0,
        roughness: 0.015,
        transmission: 1.0,
        ior: 2.4,
        thickness: 0.55,
        dispersion: 0.45,
        envMapIntensity: 3.0,
        emissive: 0x161a22,
        emissiveIntensity: 0.16
      },
      indexColor: 0xf4f6fa
    }
  ],

  movement: [
    {
      id: 'anthracite',
      code: 'AN',
      label: 'Anthracite',
      swatchType: 'metal',
      swatchBg: 'radial-gradient(circle at 35% 30%, #4d5058 0%, #24262b 52%, #131418 100%)',
      plateColor: 0x16181d,
      plateRoughness: 0.62,
      bridgeColor: 0x24272e,
      bridgeRoughness: 0.28,
      bridgeMetalness: 0.90,
      bevelColor: 0xaab2c0
    },
    {
      id: 'rhodium',
      code: 'RH',
      label: 'Rhodium silver',
      swatchType: 'metal',
      swatchBg: 'linear-gradient(135deg, #f1f3f8 0%, #a9afb9 45%, #dde1e8 72%, #6c717b 100%)',
      plateColor: 0x767c88,
      plateRoughness: 0.38,
      bridgeColor: 0xb8bec9,
      bridgeRoughness: 0.22,
      bridgeMetalness: 0.96,
      bevelColor: 0xe6eaf2
    },
    {
      id: 'obsidian',
      code: 'OB',
      label: 'Black ruthenium',
      swatchType: 'metal',
      swatchBg: 'radial-gradient(circle at 32% 28%, #34373e 0%, #15161a 55%, #070709 100%)',
      plateColor: 0x0b0c0f,
      plateRoughness: 0.68,
      bridgeColor: 0x131519,
      bridgeRoughness: 0.34,
      bridgeMetalness: 0.86,
      bevelColor: 0x7e8592
    }
  ],

  hands: [
    {
      id: 'rhodium',
      code: 'RH',
      label: 'Polished rhodium',
      swatchType: 'metal',
      swatchBg: 'linear-gradient(135deg, #f4f6fa 0%, #b5bbc6 42%, #e8ecf3 64%, #7a808c 100%)',
      material: {
        color: 0xdce1ea,
        metalness: 1.0,
        roughness: 0.16,
        clearcoat: 0.25,
        envMapIntensity: 1.45
      }
    },
    {
      id: 'rosegold',
      code: 'RG',
      label: '18k Rose gold',
      swatchType: 'metal',
      swatchBg: 'linear-gradient(135deg, #f7e4d4 0%, #c89674 44%, #f0d4be 66%, #7d563c 100%)',
      material: {
        color: 0xd69e78,
        metalness: 1.0,
        roughness: 0.16,
        clearcoat: 0.24,
        envMapIntensity: 1.45
      }
    }
  ],

  strap: [
    {
      id: 'black',
      code: 'AL-BK',
      label: 'Black alligator',
      swatchType: 'leather',
      swatchBg: 'radial-gradient(circle at 35% 28%, #2e3036 0%, #141518 55%, #060608 100%)',
      color: 0x0d0e11,
      roughness: 0.58,
      sheenColor: 0x2a2d36,
      stitchColor: 0xd8dce4
    },
    {
      id: 'navy',
      code: 'AL-NV',
      label: 'Midnight alligator',
      swatchType: 'leather',
      swatchBg: 'radial-gradient(circle at 35% 28%, #283b64 0%, #14203b 55%, #090e1c 100%)',
      color: 0x0f1a33,
      roughness: 0.56,
      sheenColor: 0x2c4478,
      stitchColor: 0xcbd4e8
    },
    {
      id: 'burgundy',
      code: 'AL-BG',
      label: 'Burgundy alligator',
      swatchType: 'leather',
      swatchBg: 'radial-gradient(circle at 35% 28%, #6e2230 0%, #3d1019 56%, #1c070b 100%)',
      color: 0x380d16,
      roughness: 0.54,
      sheenColor: 0x782838,
      stitchColor: 0xe6d4cf
    },
    {
      id: 'arctic',
      code: 'AL-WH',
      label: 'Arctic alligator',
      swatchType: 'leather',
      swatchBg: 'radial-gradient(circle at 35% 28%, #ffffff 0%, #e4e6ec 58%, #b7bcc6 100%)',
      color: 0xd9dce2,
      roughness: 0.52,
      sheenColor: 0xffffff,
      stitchColor: 0xb6bcc8
    }
  ]
};

export const HOTSPOTS = [
  {
    id: 'tourbillon',
    index: '01',
    title: 'Flying Tourbillon',
    desc: 'Cantilevered 60-second rose-gold cage beating at 4 Hz (28,800 vph) with free-sprung balance wheel and synthetic ruby pivot.',
    localPos: [0, -0.78, 0.28],
    cameraPreset: 'tourbillon'
  },
  {
    id: 'barrel',
    index: '02',
    title: 'Mainspring Barrel',
    desc: 'Openworked 12 o’clock sunburst ratchet wheel with blued-steel arbor cap delivering a 72-hour chronometric power reserve.',
    localPos: [0, 0.78, 0.28],
    cameraPreset: 'dial'
  },
  {
    id: 'bezel',
    index: '03',
    title: '60-Stone Pavé Bezel',
    desc: 'Sixty hand-set faceted stones (IOR 2.40) nestled inside a mirror-chamfered platinum channel with micro-bead prongs.',
    localPos: [-1.42, 1.32, 0.36],
    cameraPreset: 'hero'
  },
  {
    id: 'crown',
    index: '04',
    title: 'Sapphire Cabochon Crown',
    desc: '24-flute platinum winding crown crowned with a domed royal blue sapphire cabochon. Click directly to wind the barrel.',
    localPos: [2.46, 0, 0.04],
    cameraPreset: 'crown'
  },
  {
    id: 'bridges',
    index: '05',
    title: 'Calibre HT-01 Bridges',
    desc: 'Hand-beveled anthracite bridges finished with Côtes de Genève striping over a circular-grained perlage mainplate.',
    localPos: [-0.95, 0.0, 0.25],
    cameraPreset: 'dial'
  }
];

export const CAMERA_PRESETS = {
  hero: {
    position: [3.95, 0.72, 10.65],
    target: [0.92, -0.16, -0.45]
  },
  dial: {
    position: [0.58, 0.06, 6.25],
    target: [0.42, 0.0, 0.05]
  },
  tourbillon: {
    position: [0.62, -1.28, 4.45],
    target: [0.24, -0.76, 0.12]
  },
  crown: {
    position: [6.85, 0.75, 5.55],
    target: [0.65, -0.10, -0.65]
  },
  caseback: {
    position: [-2.85, 0.55, -10.55],
    target: [-0.55, -0.12, -0.35]
  },
  overhead: {
    position: [1.55, 6.4, 7.6],
    target: [0.55, -0.25, -0.55]
  }
};

export const LIGHTING_MOODS = {
  noir: {
    label: 'Atelier Noir',
    keyColor: 0xffe9cf,
    keyIntensity: 2.15,
    rimColor: 0x9ec4ff,
    rimIntensity: 2.85,
    fillColor: 0xcad6ec,
    fillIntensity: 0.36,
    sparkleColor: 0xffffff,
    sparkleIntensity: 11.0,
    exposure: 0.98
  },
  geneva: {
    label: 'Geneva Daylight',
    keyColor: 0xf4f8ff,
    keyIntensity: 2.55,
    rimColor: 0xc4dbff,
    rimIntensity: 2.65,
    fillColor: 0xdce6fa,
    fillIntensity: 0.58,
    sparkleColor: 0xf5f9ff,
    sparkleIntensity: 13.5,
    exposure: 1.06
  },
  champagne: {
    label: 'Warm Champagne',
    keyColor: 0xffd7a8,
    keyIntensity: 2.45,
    rimColor: 0xffe0b8,
    rimIntensity: 2.5,
    fillColor: 0xe6cfb6,
    fillIntensity: 0.42,
    sparkleColor: 0xfff2dc,
    sparkleIntensity: 12.0,
    exposure: 1.02
  }
};

export function buildReferenceCode(state) {
  const c = CONFIG_OPTIONS.case.find((o) => o.id === state.case)?.code ?? 'PT';
  const b = CONFIG_OPTIONS.bezel.find((o) => o.id === state.bezel)?.code ?? 'D';
  const m = CONFIG_OPTIONS.movement.find((o) => o.id === state.movement)?.code ?? 'AN';
  const h = CONFIG_OPTIONS.hands.find((o) => o.id === state.hands)?.code ?? 'RH';
  const s = CONFIG_OPTIONS.strap.find((o) => o.id === state.strap)?.code ?? 'AL-BK';
  return `HT-01 · ${c} · ${b} · ${m}/${h} · ${s}`;
}
