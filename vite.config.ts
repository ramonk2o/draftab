import { defineConfig } from 'vite'

export default defineConfig({
  // Caminhos relativos: a extensão é servida de chrome-extension://<id>/
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // O código é lido do disco pela extensão, então o tamanho do pacote não
    // pesa. A DragHandle traz junto a biblioteca de colaboração (yjs).
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Uma entrada por página da extensão
      input: {
        newtab: 'newtab.html',
        background: 'src/background.ts',
      },
      output: {
        // O service worker precisa de nome fixo (o manifest aponta para ele)
        entryFileNames: (entrada) =>
          entrada.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
