# HALCYON HT-01 — Flying Tourbillon

Interactive 3D haute horlogerie configurator built with Three.js (`MeshPhysicalMaterial`, `RoomEnvironment` HDR reflections via `PMREMGenerator`, `ACESFilmicToneMapping`, 60-stone `InstancedMesh` faceted bezel, animated 4 Hz flying tourbillon, and `UnrealBloomPass` + optical vignette/DoF post-processing).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcatalystberry842-alt%2Fhalcyon-ht01)

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

Configured for zero-config static deployment on Vercel via `vercel.json` (`framework: "vite"`, `outputDirectory: "dist"`).
