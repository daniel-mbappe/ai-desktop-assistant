import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    main: 'src/main.mts',
    'preload/overlay.preload': 'src/preload/overlay.preload.ts',
    'preload/hud.preload': 'src/preload/hud.preload.ts',
  },
  outDir: 'dist',
  format: 'esm',
  target: 'node18',
  splitting: false,
  clean: true,
  tsconfig: "../../tsconfig.json",
  sourcemap: true,
  dts: false,
  outExtension: () => ({ js: '.mjs' })
});
