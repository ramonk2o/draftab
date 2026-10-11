// Ícones minimalistas: traço fino de 1.5, 16×16, na cor do texto (currentColor)

function icone(conteudo: string): string {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`
}

export const ICONE_LAPIS = icone('<path d="M10.5 3 13 5.5 6 12.5 3 13l.5-3z" />')

export const ICONE_LIXEIRA = icone(
  '<path d="M3 4.5h10" /><path d="M6.5 4.5V3h3v1.5" /><path d="M4.5 4.5 5 13h6l.5-8.5" />',
)
