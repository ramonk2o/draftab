// Aplica o tema antes do primeiro desenho da página, para não piscar o tema errado.
// Lê a cópia da escolha guardada no localStorage (leitura instantânea); quem manda
// de verdade é a configuração no chrome.storage, aplicada depois por src/tema.ts.
// Script comum (não módulo) porque precisa rodar antes de a página aparecer.
;(function () {
  var tema = 'auto'
  try {
    tema = localStorage.getItem('tema') || 'auto'
  } catch (erro) {}
  var escuro = tema === 'dark' || (tema === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro'
})()
