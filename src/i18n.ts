// Interface language: English or Portuguese (see "Language" in SPEC.md).
// Our own dictionary instead of chrome.i18n, which only follows Chrome's language.
// No side effects on import: the service worker and the tests use it too (always in English).

export type Language = 'en' | 'pt'
export type LanguageSetting = 'auto' | Language
const LANGUAGE_SETTINGS: LanguageSetting[] = ['auto', 'en', 'pt']

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return LANGUAGE_SETTINGS.includes(value as LanguageSetting)
}

// "{name}" in a text is replaced by the value of the same name; keys ending in
// .one / .other are the singular and plural of the same text (see tn)
const EN = {
  pageTitle: 'New tab',

  // Sidebar
  showSidebar: 'Show sidebar',
  collapseSidebar: 'Collapse sidebar',
  settings: 'Settings',
  search: 'Search',
  searchNotes: 'Search notes',
  tagSuggestions: 'Tag suggestions',
  importFile: 'Import a .md or .txt file as a note',
  newNote: 'New note',
  noNotesYet: 'No notes yet',
  nothingFound: 'Nothing found',
  doubleClickToRename: 'Double-click to rename',
  pinned: 'Pinned',
  pin: 'Pin',
  unpin: 'Unpin',
  rename: 'Rename',
  delete: 'Delete',
  automaticTitle: 'Automatic title',
  newTitle: 'New title',
  confirmDeleteNote: 'Delete the note "{title}"? This can\'t be undone.',
  fileEmpty: 'Couldn\'t import: "{name}" is empty.',

  // Note page
  pinNote: 'Pin note',
  unpinNote: 'Unpin note',
  exportMarkdown: 'Export as Markdown',
  copyNote: 'Copy note',
  copyWhatsApp: 'Copy for WhatsApp',
  copyWhatsAppHint: 'Copy for WhatsApp (without the first line)',
  copyFailed: "Couldn't copy the note: {error}",
  smallerText: 'Smaller text ({size}%) — {shortcut}',
  biggerText: 'Bigger text ({size}%) — {shortcut}',
  fontButton: 'Font: {font} (click for {next})',
  'font.sans': 'Sans-serif',
  'font.serif': 'Serif',
  'font.mono': 'Monospace',
  'characters.one': '{n} character',
  'characters.other': '{n} characters',
  withoutMarkdown: '{n} without markdown',
  'selected.one': '{n} selected',
  'selected.other': '{n} selected',

  // Editor
  copied: 'Copied',
  dragToMove: 'Drag to move, click for colors',
  dragList: 'Drag to move the whole list, click for colors',
  blockColor: 'Background color',
  'color.none': 'No color',
  'color.gray': 'Gray',
  'color.red': 'Red',
  'color.orange': 'Orange',
  'color.yellow': 'Yellow',
  'color.green': 'Green',
  'color.blue': 'Blue',
  untitled: 'Untitled',

  // Saving web pages (toolbar icon and right-click menu)
  savePage: 'Save page to Draftab',
  saveSelection: 'Save to Draftab',
  excerptTitle: 'Excerpt: {title}',
  clipUnavailable: "This page can't be saved: Chrome doesn't let extensions read it.",
  clipEmpty: "Couldn't find the main text of this page. Select a passage and use right-click → Save to Draftab.",
  clipFailed: "Couldn't turn this page into a note. Try selecting a passage and using right-click → Save to Draftab.",

  // Calendar (sidebar)
  calendar: 'Calendar',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  backToToday: 'Back to the current month',
  insertDate: 'Insert {date}',

  // Settings
  close: 'Close',
  backup: 'Backup',
  backupHint: 'A JSON file with all notes (also in markdown) and settings. Importing replaces everything.',
  exportBackup: 'Export backup',
  importBackup: 'Import backup',
  automaticBackup: 'Automatic backup',
  'interval.0': 'Off',
  'interval.1': 'Every minute',
  'interval.60': 'Hourly',
  'interval.1440': 'Daily',
  'interval.10080': 'Weekly',
  'interval.43200': 'Monthly',
  automaticBackupHint:
    'Saved to <code>Downloads/draftab-backups/</code> only when something changed, even with the tab closed. If Chrome asks where to save each file, it will ask every time.',
  'backupDownloaded.one': 'Backup with {n} note downloaded.',
  'backupDownloaded.other': 'Backup with {n} notes downloaded.',
  importFailed: "Couldn't import: {error}",
  lastBackup: 'Last automatic backup: {date}.',
  noBackupYet: 'No automatic backup yet.',
  appearance: 'Appearance',
  theme: 'Theme',
  'theme.auto': 'Automatic (follows the system)',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  newNoteTextSize: 'Text size of new notes',
  newNoteFont: 'Font of new notes',
  sortBy: 'Sort notes by',
  'sort.updated': 'Last modified',
  'sort.title': 'Title (A–Z)',
  'sort.created': 'Date created',
  language: 'Language',
  'language.auto': 'Automatic (follows Chrome)',
  colorSwatches: 'Show color swatches next to color codes (#3a7bd5)',
  showCalendar: 'Show the calendar in the sidebar',
  dateFormat: 'Date format',
  calendarHint: 'Clicking a day inserts the date at the cursor in the note.',
  calculations: 'Calculations',
  calculationsOn: 'Write the result when typing = after a calculation without spaces (2*5=)',
  decimalSeparator: 'Decimal separator',
  'decimalSeparator.auto': 'Automatic (follows the language)',
  deleteAll: 'Delete all notes',
  deleteAllHint: 'Removes every note from this browser for good. Settings are kept.',
  deleteConfirmLabel: 'To confirm, type <strong>{phrase}</strong>:',
  deletePhrase: 'delete everything',

  // Importing a backup
  'importQuestion.one': 'Import {n} note from the backup{when}?',
  'importQuestion.other': 'Import {n} notes from the backup{when}?',
  importWhen: ' from {date}',
  replacesCurrent: 'This replaces the current note.',
  replacesAll: 'This replaces all {n} current notes.',
  'imported.one': '{n} note imported.',
  'imported.other': '{n} notes imported.',
  backupNotJson: 'The file is not valid JSON.',
  backupNotDraftab: 'This file is not a Draftab backup.',
  backupNewer: 'This backup was made by a newer version of Draftab.',
  backupUnknownVersion: 'Unknown backup version.',
  backupNoNotes: 'The backup has no list of notes.',
  noteNoId: 'Note {i} in the backup has no id.',
  noteDuplicated: 'Note {i} in the backup is duplicated.',
  noteNoTitle: 'Note {i} in the backup has no title.',
  noteNoDates: 'Note {i} in the backup has no valid dates.',
  noteInvalid: 'Note {i} in the backup ("{title}") has invalid content.',
}

type Key = keyof typeof EN

const PT: Record<Key, string> = {
  pageTitle: 'Nova guia',

  showSidebar: 'Mostrar barra lateral',
  collapseSidebar: 'Recolher barra lateral',
  settings: 'Configurações',
  search: 'Buscar',
  searchNotes: 'Buscar notas',
  tagSuggestions: 'Sugestões de tags',
  importFile: 'Importar um arquivo .md ou .txt como nota',
  newNote: 'Nova nota',
  noNotesYet: 'Nenhuma nota ainda',
  nothingFound: 'Nada encontrado',
  doubleClickToRename: 'Clique duas vezes para renomear',
  pinned: 'Fixada',
  pin: 'Fixar',
  unpin: 'Desafixar',
  rename: 'Renomear',
  delete: 'Apagar',
  automaticTitle: 'Título automático',
  newTitle: 'Novo título',
  confirmDeleteNote: 'Apagar a nota "{title}"? Isso não pode ser desfeito.',
  fileEmpty: 'Não foi possível importar: "{name}" está vazio.',

  pinNote: 'Fixar nota',
  unpinNote: 'Desafixar nota',
  exportMarkdown: 'Exportar como Markdown',
  copyNote: 'Copiar nota',
  copyWhatsApp: 'Copiar para o WhatsApp',
  copyWhatsAppHint: 'Copiar para o WhatsApp (sem a primeira linha)',
  copyFailed: 'Não foi possível copiar a nota: {error}',
  smallerText: 'Texto menor ({size}%) — {shortcut}',
  biggerText: 'Texto maior ({size}%) — {shortcut}',
  fontButton: 'Fonte: {font} (clique para {next})',
  'font.sans': 'Sem serifa',
  'font.serif': 'Serifada',
  'font.mono': 'Monoespaçada',
  'characters.one': '{n} caractere',
  'characters.other': '{n} caracteres',
  withoutMarkdown: '{n} sem markdown',
  'selected.one': '{n} selecionado',
  'selected.other': '{n} selecionados',

  copied: 'Copiado',
  dragToMove: 'Arraste para mover, clique para cores',
  dragList: 'Arraste para mover a lista inteira, clique para cores',
  blockColor: 'Cor de fundo',
  'color.none': 'Sem cor',
  'color.gray': 'Cinza',
  'color.red': 'Vermelho',
  'color.orange': 'Laranja',
  'color.yellow': 'Amarelo',
  'color.green': 'Verde',
  'color.blue': 'Azul',
  untitled: 'Sem título',

  // Salvar páginas (ícone da barra e menu do botão direito)
  savePage: 'Salvar página no Draftab',
  saveSelection: 'Salvar no Draftab',
  excerptTitle: 'Trecho: {title}',
  clipUnavailable: 'Não é possível salvar esta página: o Chrome não deixa extensões lerem ela.',
  clipEmpty: 'Não encontrei o texto principal desta página. Selecione um trecho e use botão direito → Salvar no Draftab.',
  clipFailed: 'Não consegui transformar esta página em nota. Tente selecionar um trecho e usar botão direito → Salvar no Draftab.',

  // Calendário (barra lateral)
  calendar: 'Calendário',
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  backToToday: 'Voltar ao mês atual',
  insertDate: 'Inserir {date}',

  close: 'Fechar',
  backup: 'Backup',
  backupHint: 'Um arquivo JSON com todas as notas (também em markdown) e as configurações. Importar substitui tudo.',
  exportBackup: 'Exportar backup',
  importBackup: 'Importar backup',
  automaticBackup: 'Backup automático',
  'interval.0': 'Desligado',
  'interval.1': 'A cada minuto',
  'interval.60': 'A cada hora',
  'interval.1440': 'Diário',
  'interval.10080': 'Semanal',
  'interval.43200': 'Mensal',
  automaticBackupHint:
    'Salvo em <code>Downloads/draftab-backups/</code> só quando algo mudou, mesmo com a aba fechada. Se o Chrome pergunta onde salvar cada arquivo, ele vai perguntar toda vez.',
  'backupDownloaded.one': 'Backup com {n} nota baixado.',
  'backupDownloaded.other': 'Backup com {n} notas baixado.',
  importFailed: 'Não foi possível importar: {error}',
  lastBackup: 'Último backup automático: {date}.',
  noBackupYet: 'Nenhum backup automático ainda.',
  appearance: 'Aparência',
  theme: 'Tema',
  'theme.auto': 'Automático (segue o sistema)',
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',
  newNoteTextSize: 'Tamanho do texto das novas notas',
  newNoteFont: 'Fonte das novas notas',
  sortBy: 'Ordenar notas por',
  'sort.updated': 'Última modificação',
  'sort.title': 'Título (A–Z)',
  'sort.created': 'Data de criação',
  language: 'Idioma',
  'language.auto': 'Automático (segue o Chrome)',
  colorSwatches: 'Mostrar amostras ao lado de códigos de cor (#3a7bd5)',
  showCalendar: 'Mostrar o calendário na barra lateral',
  dateFormat: 'Formato da data',
  calendarHint: 'Clicar num dia insere a data no cursor da nota.',
  calculations: 'Cálculos',
  calculationsOn: 'Escrever o resultado ao digitar = depois de um cálculo sem espaços (2*5=)',
  decimalSeparator: 'Separador decimal',
  'decimalSeparator.auto': 'Automático (segue o idioma)',
  deleteAll: 'Apagar todas as notas',
  deleteAllHint: 'Remove todas as notas deste navegador, para sempre. As configurações são mantidas.',
  deleteConfirmLabel: 'Para confirmar, digite <strong>{phrase}</strong>:',
  deletePhrase: 'apagar tudo',

  'importQuestion.one': 'Importar {n} nota do backup{when}?',
  'importQuestion.other': 'Importar {n} notas do backup{when}?',
  importWhen: ' de {date}',
  replacesCurrent: 'Isso substitui a nota atual.',
  replacesAll: 'Isso substitui todas as {n} notas atuais.',
  'imported.one': '{n} nota importada.',
  'imported.other': '{n} notas importadas.',
  backupNotJson: 'O arquivo não é um JSON válido.',
  backupNotDraftab: 'Este arquivo não é um backup do Draftab.',
  backupNewer: 'Este backup foi feito por uma versão mais nova do Draftab.',
  backupUnknownVersion: 'Versão de backup desconhecida.',
  backupNoNotes: 'O backup não tem uma lista de notas.',
  noteNoId: 'A nota {i} do backup não tem id.',
  noteDuplicated: 'A nota {i} do backup está duplicada.',
  noteNoTitle: 'A nota {i} do backup não tem título.',
  noteNoDates: 'A nota {i} do backup não tem datas válidas.',
  noteInvalid: 'A nota {i} do backup ("{title}") tem conteúdo inválido.',
}

export const MESSAGES: Record<Language, Record<Key, string>> = { en: EN, pt: PT }

// ---------- Which language ----------

// "auto" follows the browser's language: Portuguese for any Portuguese, English otherwise
export function resolveLanguage(setting: LanguageSetting, browserLanguage: string): Language {
  if (setting !== 'auto') return setting
  return browserLanguage.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

let current: { setting: LanguageSetting; language: Language } | null = null

// Read on first use. On a page, from the copy in localStorage (instant, so the texts are
// right from the start; chrome.storage is checked afterwards by newtab.ts). The service
// worker and the tests have no page: English.
function state() {
  if (!current) {
    const setting = typeof document === 'undefined' ? 'en' : rememberedSetting()
    current = { setting, language: resolveLanguage(setting, navigator.language) }
  }
  return current
}

function rememberedSetting(): LanguageSetting {
  try {
    const setting = localStorage.getItem('language')
    return isLanguageSetting(setting) ? setting : 'auto'
  } catch {
    return 'auto'
  }
}

// Keeps the copy of the setting for the next open. Returns true when it differs from the
// one in use (the page must reload to show the new language)
export function rememberLanguage(setting: LanguageSetting): boolean {
  try {
    localStorage.setItem('language', setting)
  } catch {
    // no localStorage: the page opens in the browser's language
  }
  return setting !== state().setting
}

// Tests and the service worker (which has no page to remember the language in)
export function useLanguage(setting: LanguageSetting, browserLanguage = 'en') {
  current = { setting, language: resolveLanguage(setting, browserLanguage) }
}

export function currentLanguage(): Language {
  return state().language
}

// Locale for dates and numbers: the browser's when automatic, else the chosen language
export function locale(): string | undefined {
  const { setting, language } = state()
  if (setting === 'auto') return undefined
  return language === 'pt' ? 'pt-BR' : 'en'
}

// ---------- Texts ----------

export function t(key: Key, values: Record<string, string | number> = {}): string {
  let text = MESSAGES[currentLanguage()][key]
  for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(value))
  return text
}

// Keys that have a singular and a plural ("characters" for characters.one / characters.other)
type PluralKey = { [K in Key]: K extends `${infer Base}.one` ? Base : never }[Key]

// Singular for 1, plural otherwise; {n} is the number in the language's format
export function tn(key: PluralKey, n: number, values: Record<string, string | number> = {}): string {
  const form = n === 1 ? 'one' : 'other'
  return t(`${key}.${form}` as Key, { ...values, n: n.toLocaleString(locale()) })
}

// Translates the page's fixed texts, marked in the HTML:
// data-i18n (text), data-i18n-html (text with markup, from the dictionary only),
// data-i18n-title (tooltip), data-i18n-label (aria-label), data-i18n-placeholder
export function translatePage() {
  document.documentElement.lang = currentLanguage() === 'pt' ? 'pt-BR' : 'en'
  document.title = t('pageTitle')
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n as Key)
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-html]')) {
    el.innerHTML = t(el.dataset.i18nHtml as Key, { phrase: t('deletePhrase') })
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle as Key)
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel as Key))
  }
  for (const el of document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]')) {
    el.placeholder = t(el.dataset.i18nPlaceholder as Key)
  }
}
