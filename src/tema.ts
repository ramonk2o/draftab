// Tema claro/escuro: marca data-tema="claro|escuro" no <html>; o CSS faz o resto.

export type Tema = 'auto' | 'light' | 'dark'

const sistemaEscuro = matchMedia('(prefers-color-scheme: dark)')
let escolhido: Tema = 'auto'

export function aplicarTema(tema: Tema) {
  escolhido = tema
  // Cópia para o tema-inicial.js usar na próxima abertura, antes de a página aparecer
  try {
    localStorage.setItem('tema', tema)
  } catch {
    // sem localStorage: só pode piscar o tema errado ao abrir
  }
  atualizar()
}

function atualizar() {
  const escuro = escolhido === 'dark' || (escolhido === 'auto' && sistemaEscuro.matches)
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro'
}

// No automático, acompanha a troca de modo do sistema com a página aberta
sistemaEscuro.addEventListener('change', atualizar)
