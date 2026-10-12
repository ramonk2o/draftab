// Appearance: light/dark theme (data-theme="light|dark" on <html>) and the note font
// (data-note-font="sans|serif|mono"); the CSS does the rest.

import type { NoteFont } from './notes'

export type Theme = 'auto' | 'light' | 'dark'

const systemDark = matchMedia('(prefers-color-scheme: dark)')
let chosen: Theme = 'auto'

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
}

// When automatic, follows the system mode switching while the page is open
systemDark.addEventListener('change', update)

// The open note's font
export function applyNoteFont(font: NoteFont) {
  document.documentElement.dataset.noteFont = font
  // Copy for theme-init.js: a reload of this tab reopens this note
  try {
    sessionStorage.setItem('openNoteFont', font)
  } catch {
    // no sessionStorage: another font may just flash on reload
  }
}

// Copy of "Font of new notes" for theme-init.js: a new tab opens a new note
export function rememberNewNoteFont(font: NoteFont) {
  try {
    localStorage.setItem('newNoteFont', font)
  } catch {
    // no localStorage: the default font may just flash on open
  }
}
