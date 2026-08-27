import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  unbundle: true,
  treeshake: {
    moduleSideEffects: false,
  },
});
