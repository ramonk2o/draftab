import { defineConfig, type Plugin } from 'vite'

// clip-page.js is injected into web pages as a plain script, which can't import anything:
// fail the build if it ever shares code with the other entries
const clipPageStandalone: Plugin = {
  name: 'clip-page-standalone',
  generateBundle(_options, bundle) {
    const chunk = bundle['clip-page.js']
    if (chunk?.type === 'chunk' && (chunk.imports.length > 0 || chunk.dynamicImports.length > 0)) {
      this.error(`clip-page.js must not import other files, but imports: ${[...chunk.imports, ...chunk.dynamicImports].join(', ')}`)
    }
  },
}

export default defineConfig({
  // Relative paths: the extension is served from chrome-extension://<id>/
  base: './',
  plugins: [clipPageStandalone],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The code is read from disk by the extension, so bundle size doesn't
    // matter. DragHandle brings the collaboration library (yjs) along.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // One entry per extension page
      input: {
        newtab: 'newtab.html',
        background: 'src/background.ts',
        'clip-page': 'src/clip-page.ts',
      },
      output: {
        // The service worker and the injected capture need fixed names (the manifest and background.ts point to them)
        entryFileNames: (entry) =>
          entry.name === 'background' || entry.name === 'clip-page' ? `${entry.name}.js` : 'assets/[name]-[hash].js',
      },
    },
  },
})
