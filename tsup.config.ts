import { defineConfig } from 'tsup';
import path from 'path';

export default defineConfig({
  entry: {
    'index': 'temp/components/index.ts',
    'lib/index': 'temp/lib/index.ts',
    'hooks/index': 'temp/hooks/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: false,
  clean: true,
  splitting: false,
  outDir: 'node_modules/@react-renderer/components',
  platform: 'node',
  target: 'node14',
  // Don't externalize anything - bundle everything for transpilation
  // This ensures components are available during transpilation
  external: [],
  // Ensure proper module resolution
  esbuildOptions(options) {
    options.bundle = true;
    options.external = [];
    // Add path resolution for @/ aliases
    options.alias = {
      '@': path.resolve(process.cwd(), 'temp'),
      '@/components': path.resolve(process.cwd(), 'temp/components'),
      '@/lib': path.resolve(process.cwd(), 'temp/lib'),
      '@/hooks': path.resolve(process.cwd(), 'temp/hooks'),
    };
  },
  // Override the default behavior to flatten the output structure
  onSuccess: 'echo "Build completed successfully"',
});
