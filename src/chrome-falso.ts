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
  }
}
