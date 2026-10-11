// Light/dark theme: sets data-theme="light|dark" on <html>; the CSS does the rest.

export type Theme = 'auto' | 'light' | 'dark'

const systemDark = matchMedia('(prefers-color-scheme: dark)')
let chosen: Theme = 'auto'
const listeners: ((dark: boolean) => void)[] = []

// The theme currently on screen (automatic already resolved)
export function isDark(): boolean {
  return document.documentElement.dataset.theme === 'dark'
}

// Notifies when the theme on screen changes (by choice, or by the system when automatic)
export function onScreenThemeChange(callback: (dark: boolean) => void) {
  listeners.push(callback)
}

export function applyTheme(theme: Theme) {
  chosen = theme
  // Copy for theme-init.js to use on the next open, before the page shows up
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // no localStorage: the wrong theme may just flash on open
  }
  update()
}

function update() {
  const dark = chosen === 'dark' || (chosen === 'auto' && systemDark.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  listeners.forEach((listener) => listener(dark))
}

// When automatic, follows the system mode switching while the page is open
systemDark.addEventListener('change', update)
