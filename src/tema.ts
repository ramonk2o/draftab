// Tema claro/escuro: marca data-tema="claro|escuro" no <html>; o CSS faz o resto.

export type Tema = 'auto' | 'light' | 'dark'

const sistemaEscuro = matchMedia('(prefers-color-scheme: dark)')
let escolhido: Tema = 'auto'
const ouvintes: ((escuro: boolean) => void)[] = []

// O tema que está na tela agora (o automático já resolvido)
export function estaEscuro(): boolean {
  return document.documentElement.dataset.tema === 'escuro'
}

// Avisa quando o tema na tela muda (por escolha ou pelo sistema, no automático)
export function aoTrocarTemaNaTela(callback: (escuro: boolean) => void) {
  ouvintes.push(callback)
}

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
  ouvintes.forEach((ouvinte) => ouvinte(escuro))
}

// No automático, acompanha a troca de modo do sistema com a página aberta
sistemaEscuro.addEventListener('change', atualizar)
