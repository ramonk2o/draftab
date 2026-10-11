// Applies the theme before the page's first paint, so the wrong theme doesn't flash.
// Reads the copy of the choice kept in localStorage (instant read); the real source
// is the setting in chrome.storage, applied afterwards by src/theme.ts.
// A classic script (not a module) because it must run before the page shows up.
;(function () {
  var theme = 'auto'
  try {
    theme = localStorage.getItem('theme') || 'auto'
  } catch (error) {}
  var dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
