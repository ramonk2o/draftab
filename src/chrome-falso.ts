// Só para testes: chrome.storage simulado em memória

type Ouvinte = (mudancas: Record<string, { oldValue?: unknown; newValue?: unknown }>, area: string) => void

// chrome.storage.local simulado em memória, copiando os valores como o Chrome faz
export function criarChromeFalso() {
  const dados: Record<string, unknown> = {}
  const ouvintes: Ouvinte[] = []
  const avisar = (mudancas: Record<string, { oldValue?: unknown; newValue?: unknown }>) =>
    ouvintes.forEach((ouvinte) => ouvinte(mudancas, 'local'))

  return {
    storage: {
      local: {
        async get(chaves: string | null) {
          if (chaves === null) return structuredClone(dados)
          return chaves in dados ? { [chaves]: structuredClone(dados[chaves]) } : {}
        },
        async set(itens: Record<string, unknown>) {
          const mudancas: Record<string, { oldValue?: unknown; newValue?: unknown }> = {}
          for (const [chave, valor] of Object.entries(itens)) {
            mudancas[chave] = { oldValue: dados[chave], newValue: structuredClone(valor) }
            dados[chave] = structuredClone(valor)
          }
          avisar(mudancas)
        },
        async remove(chaves: string | string[]) {
          const mudancas: Record<string, { oldValue?: unknown }> = {}
          for (const chave of Array.isArray(chaves) ? chaves : [chaves]) {
            if (!(chave in dados)) continue
            mudancas[chave] = { oldValue: dados[chave] }
            delete dados[chave]
          }
          if (Object.keys(mudancas).length > 0) avisar(mudancas)
        },
      },
      onChanged: {
        addListener: (ouvinte: Ouvinte) => ouvintes.push(ouvinte),
      },
    },
    alarms: {
      criados: new Map<string, { periodInMinutes?: number; delayInMinutes?: number }>(),
      async create(nome: string, info: { periodInMinutes?: number; delayInMinutes?: number }) {
        this.criados.set(nome, info)
      },
      async get(nome: string) {
        const info = this.criados.get(nome)
        return info ? { name: nome, ...info } : undefined
      },
      async clear(nome: string) {
        return this.criados.delete(nome)
      },
    },
    downloads: {
      baixados: [] as { url: string; filename: string; conflictAction?: string; saveAs?: boolean }[],
      async download(opcoes: { url: string; filename: string; conflictAction?: string; saveAs?: boolean }) {
        this.baixados.push(opcoes)
        return this.baixados.length
      },
    },
  }
}
