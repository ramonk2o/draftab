import { defineConfig } from 'vite'

export default defineConfig({
  // Relative paths: the extension is served from chrome-extension://<id>/
  base: './',
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
      },
      output: {
        // The service worker needs a fixed name (the manifest points to it)
        entryFileNames: (entry) =>
          entry.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
