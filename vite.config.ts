import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** After the build, write dist/sw.js: the service worker with the list of every built file, so the app works offline. */
function offlineServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'nurseverse-sw',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else if (name !== 'sw.js') files.push(relative(outDir, full).split('\\').join('/'));
        }
      };
      walk(outDir);
      files.sort();
      const hash = createHash('sha1');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const urls = ['./', ...files.map((f) => './' + f)];
      const template = readFileSync('src/sw.template.js', 'utf8');
      writeFileSync(join(outDir, 'sw.js'), template.split('__VERSION__').join(hash.digest('hex').slice(0, 12)).split('__PRECACHE__').join(JSON.stringify(urls)));
    },
  };
}

export default defineConfig({
  base: './', // relative paths: works on GitHub Pages / any sub-folder
  plugins: [react(), offlineServiceWorker()],
  server: { host: true, port: 5173 },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
  },
});
