// Applies the theme and the open note's font before the page's first paint, so the wrong ones don't flash.
// Reads the copies kept in localStorage / sessionStorage (instant read); the real source
// is chrome.storage, applied afterwards by src/theme.ts.
// A classic script (not a module) because it must run before the page shows up.
;(function () {
  var theme = 'auto'
  try {
    theme = localStorage.getItem('theme') || 'auto'
  } catch (error) {}
  var dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'

  // Note font, same idea: the note this tab had open (on reload), or the font of new notes
  var font = 'sans'
  try {
    font = sessionStorage.getItem('openNoteFont') || localStorage.getItem('newNoteFont') || 'sans'
  } catch (error) {}
  document.documentElement.dataset.noteFont = font
})()
