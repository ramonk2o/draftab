import { defineConfig } from 'vite'

export default defineConfig({
  // Caminhos relativos: a extensão é servida de chrome-extension://<id>/
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Uma entrada por página da extensão (Configurações entra na Etapa 4)
      input: {
        newtab: 'newtab.html',
      },
    },
  },
})
