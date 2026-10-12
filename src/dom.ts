// The page element for a selector; fails loudly if the HTML doesn't have it
export function element<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector)
  if (!el) throw new Error(`Element ${selector} not found`)
  return el
}
