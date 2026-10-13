import { getHTMLFromFragment, type JSONContent } from '@tiptap/core'
import { EditorState } from '@tiptap/pm/state'
import { createEditor } from './editor'
import { element } from './dom'
import { showCopied, showLabel } from './copy-block'
import { characters, markdownCharacters, plainTextCharacters, selectedCharacters } from './char-count'
import { chooseFile, exportMarkdown } from './backup-ui'
import { noteFromFile, noteToMarkdown } from './markdown'
import { noteToWhatsApp } from './whatsapp'
import { openSettings } from './settings'
import { setDateFormat, setupCalendar, showCalendar } from './calendar-ui'
import { setCalculationsEnabled, setDecimalSeparator } from './calculate'
import { applyNoteFont, applyTheme, rememberNewNoteFont } from './theme'
import {
  ICON_CHAT,
  ICON_COPY,
  ICON_FONT,
  ICON_GEAR,
  ICON_IMPORT,
  ICON_MARKDOWN,
  ICON_PENCIL,
  ICON_PIN,
  ICON_SIDEBAR,
  ICON_SIDEBAR_CLOSED,
  ICON_TEXT_BIGGER,
  ICON_TEXT_SMALLER,
  ICON_TRASH,
} from './icons'
import {
  displayTitle,
  filterNotes,
  isEmptyNote,
  isPinned,
  listDate,
  newBlankNote,
  nextNoteFont,
  nextTextSize,
  noteFontOf,
  TEXT_SIZES,
  validTextSize,
  renamed,
  sortNotes,
  tabTitle,
  withoutFirstLine,
  withUpdatedTitle,
  type Note,
  type NoteFont,
  type NoteSort,
} from './notes'
import { tagSuggestions, wordAt } from './tags'
import { locale, rememberLanguage, t, tn, translatePage } from './i18n'
import {
  deleteNote,
  listNotes,
  onDateFormatChanged,
  onImport,
  onLanguageChanged,
  onNewNoteFontChanged,
  onNoteSortChanged,
  onNewNoteTextSizeChanged,
  onNotesChanged,
  onShowCalendarChanged,
  onColorSwatchesChanged,
  onCalculationsChanged,
  onDecimalSeparatorChanged,
  onThemeChanged,
  readNote,
  readSettings,
  saveNote,
  saveSettings,
} from './storage'

// The page's fixed texts, in the interface language
translatePage()

const SAVE_DELAY = 500 // ms without typing before saving
const STATS_DELAY = 300 // ms without typing before recounting the note's characters

const sidebarButton = element<HTMLButtonElement>('#toggle-sidebar')
const newNoteButton = element<HTMLButtonElement>('#new-note')
const searchField = element<HTMLInputElement>('#search')
const noteList = element<HTMLUListElement>('#note-list')
const editor = createEditor(element('#editor'), searchForTag)

// ---------- Tab state ----------

let currentNote: Note = newBlankNote() // note open in the editor
let currentNoteSaved = false // does the open note already exist in storage?
let notes: Note[] = [] // copy of the list, for the sidebar
let timer: ReturnType<typeof setTimeout> | undefined
let lastSaveFromThisTab = 0 // updatedAt of the last note saved by this tab
let renaming = false // while renaming, the list isn't redrawn
let noteSort: NoteSort = 'updated' // sidebar order, from Settings
let newNoteTextSize = 100 // text size new notes start with, from Settings
let newNoteFont: NoteFont = 'sans' // font new notes start with, from Settings
let oldNoteFont: NoteFont = 'sans' // font of notes without their own (settings.noteFont)

// A blank note with the text size and font chosen in Settings
function newNote(): Note {
  return newBlankNote(newNoteTextSize, newNoteFont)
}

// ---------- Saving ----------

editor.on('update', () => {
  clearTimeout(timer)
  // The first keystroke creates the note right away; after that, wait for a pause in typing
  if (!currentNoteSaved) saveNow()
  else timer = setTimeout(saveNow, SAVE_DELAY)
})

function hasPendingChanges(): boolean {
  return timer !== undefined
}

// Saves what was typed and not saved yet, if anything
async function saveIfPending() {
  if (hasPendingChanges()) await saveNow()
}

// Throws away what was typed and not saved yet
function discardPending() {
  clearTimeout(timer)
  timer = undefined
}

async function saveNow() {
  discardPending() // the timer's job is done here
  // Read the editor before any await, so we don't pick up another note's content
  const note = withUpdatedTitle({ ...currentNote, doc: editor.getJSON(), updatedAt: Date.now() })
  currentNote = note
  updateTabTitle()

  if (isEmptyNote(note)) {
    // An empty note isn't stored; if it was, it leaves the list
    if (currentNoteSaved) {
      currentNoteSaved = false
      await deleteNote(note.id)
    }
    return
  }
  currentNoteSaved = true
  lastSaveFromThisTab = note.updatedAt
  await saveNote(note)
}

// Don't lose the last keystrokes when closing or switching tabs
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveIfPending()
})
window.addEventListener('pagehide', saveIfPending)

// ---------- Opening notes ----------

function open(note: Note, alreadySaved: boolean) {
  saveIfPending()
  currentNote = note
  currentNoteSaved = alreadySaved
  replaceDocument(note.doc)
  applyTextSize()
  applyFont()
  updateNoteActions()
  updatePinButton()
  updateTotals()
  updateTabTitle()
  // Reloading the tab reopens this note
  sessionStorage.setItem('openNoteId', note.id)
  drawList()
  // view.focus() focuses right away (Tiptap's focus waits for the next frame and
  // would lose the first keystrokes typed right after clicking "New note")
  editor.view.focus()
  editor.commands.focus(alreadySaved ? 'end' : 'start')
}

// The browser tab shows the open note's title
function updateTabTitle() {
  document.title = tabTitle(currentNote)
}

// Replaces the editor content and resets undo (Cmd+Z doesn't go back to the previous note)
function replaceDocument(doc: JSONContent) {
  const { schema, plugins } = editor.state
  let content
  try {
    content = schema.nodeFromJSON(doc)
  } catch (error) {
    console.error('Note with invalid content; opening blank', error)
    content = schema.nodeFromJSON(newBlankNote().doc)
  }
  editor.view.updateState(EditorState.create({ schema, doc: content, plugins }))
}

// Content that arrived from another tab: swap it in without touching undo, keeping the cursor
function receiveContent(doc: JSONContent) {
  const { from } = editor.state.selection
  editor.chain().setMeta('addToHistory', false).setContent(doc, { emitUpdate: false }).setTextSelection(from).run()
}

newNoteButton.addEventListener('click', () => open(newNote(), false))

// ---------- Sync with other tabs ----------

// Updates the sidebar's copy of one note (null = deleted), without reading every note again
function updateNoteInList(id: string, note: Note | null) {
  notes = notes.filter((n) => n.id !== id)
  if (note) notes.push(note)
}

onNotesChanged((changes) => {
  for (const { id, note } of changes) updateNoteInList(id, note)
  drawList()

  const forCurrent = changes.find((c) => c.id === currentNote.id)
  if (!forCurrent) return

  if (forCurrent.note === null) {
    // Deleted in another tab (deletions from this tab already mark it as not saved)
    if (currentNoteSaved) open(newNote(), false)
    return
  }
  // Pinning doesn't change updatedAt, so it's taken even when the rest is ignored below
  // (otherwise this tab's next save would undo a pin made in another tab)
  currentNote = { ...currentNote, pinned: isPinned(forCurrent.note) }
  updatePinButton()

  // The notification of this tab's own saves arrives later; it may be outdated
  // compared to what has been typed since, so it's ignored
  const received = forCurrent.note
  if (received.updatedAt <= lastSaveFromThisTab) return
  // If there's pending typing here, it will write over it (last write wins)
  if (hasPendingChanges()) return

  if (JSON.stringify(received.doc) !== JSON.stringify(editor.getJSON())) {
    receiveContent(received.doc)
  }
  currentNote = received
  currentNoteSaved = true
  updateTabTitle() // it may have been renamed in the other tab
  applyTextSize() // the size or font may have changed in the other tab
  applyFont()
})

// ---------- Sidebar ----------

searchField.addEventListener('input', () => {
  drawList()
  updateSuggestions()
})

function drawList() {
  if (renaming) return
  const visible = sortNotes(filterNotes(notes, searchField.value), noteSort)
  if (visible.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty-list'
    empty.textContent = notes.length === 0 ? t('noNotesYet') : t('nothingFound')
    noteList.replaceChildren(empty)
    return
  }
  const items = visible.map(createItem)
  // A divider between the pinned notes and the others, when there are both
  const firstUnpinned = visible.findIndex((note) => !isPinned(note))
  if (firstUnpinned > 0) {
    const divider = document.createElement('li')
    divider.className = 'list-divider'
    divider.setAttribute('role', 'separator')
    items.splice(firstUnpinned, 0, divider)
  }
  noteList.replaceChildren(...items)
}

function createItem(note: Note): HTMLLIElement {
  const item = document.createElement('li')
  item.className = 'note-item'
  if (note.id === currentNote.id) item.classList.add('current')

  const title = document.createElement('span')
  title.className = 'note-title'
  title.textContent = displayTitle(note)
  title.title = t('doubleClickToRename')

  // A pinned note shows a pin instead of its date
  const date = document.createElement('span')
  date.className = 'note-date'
  if (isPinned(note)) {
    date.classList.add('pinned')
    date.innerHTML = ICON_PIN // fixed SVG from icons.ts
    date.title = t('pinned')
  } else {
    date.textContent = formatDate(listDate(note, noteSort))
  }

  const pin = actionButton(ICON_PIN, isPinned(note) ? t('unpin') : t('pin'), () => togglePin(note))
  const rename = actionButton(ICON_PENCIL, t('rename'), () => startRename(item, note))
  const remove = actionButton(ICON_TRASH, t('delete'), () => confirmDelete(note))

  item.append(title, date, pin, rename, remove)
  item.addEventListener('click', () => {
    if (note.id !== currentNote.id) open(note, true)
  })
  title.addEventListener('dblclick', () => startRename(item, note))
  return item
}

function actionButton(icon: string, label: string, action: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'note-action'
  button.innerHTML = icon // fixed SVG from icons.ts
  button.title = label
  button.setAttribute('aria-label', label)
  button.addEventListener('click', (event) => {
    event.stopPropagation() // don't open the note
    action()
  })
  return button
}

// Swaps the title for a text field; Enter confirms, Esc cancels
function startRename(item: HTMLLIElement, note: Note) {
  renaming = true
  const field = document.createElement('input')
  field.className = 'rename-field'
  field.value = note.titleManual ? note.title : ''
  field.placeholder = note.title || t('automaticTitle')
  field.setAttribute('aria-label', t('newTitle'))
  item.replaceChildren(field)
  item.classList.add('renaming')
  field.focus()
  field.select()

  let finished = false
  const finish = async (confirmed: boolean) => {
    if (finished) return
    finished = true
    renaming = false
    if (confirmed) await applyNewTitle(note, field.value)
    drawList()
  }
  field.addEventListener('click', (event) => event.stopPropagation())
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finish(true)
    if (event.key === 'Escape') finish(false)
  })
  field.addEventListener('blur', () => finish(true))
}

async function applyNewTitle(note: Note, title: string) {
  if (note.id === currentNote.id) {
    await saveIfPending() // include what was typed and not saved yet
    currentNote = { ...renamed(currentNote, title), updatedAt: Date.now() }
    updateTabTitle()
    lastSaveFromThisTab = currentNote.updatedAt
    await saveNote(currentNote)
    return
  }
  const stored = await readNote(note.id)
  if (stored) await saveNote({ ...renamed(stored, title), updatedAt: Date.now() })
}

// Pinning isn't an edit: updatedAt stays the same
async function togglePin(note: Note) {
  const pinned = !isPinned(note)
  if (note.id === currentNote.id) {
    await saveIfPending() // include what was typed and not saved yet
    currentNote = { ...currentNote, pinned }
    updatePinButton()
    await saveNote(currentNote)
    return
  }
  const stored = await readNote(note.id)
  if (stored) await saveNote({ ...stored, pinned })
}

async function confirmDelete(note: Note) {
  if (!confirm(t('confirmDeleteNote', { title: displayTitle(note) }))) return
  if (note.id === currentNote.id) {
    discardPending()
    currentNoteSaved = false
    open(newNote(), false)
  }
  await deleteNote(note.id)
}

// Time for today's notes, short date for older ones (in the browser's language)
function formatDate(moment: number): string {
  const date = new Date(moment)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// The sort order chosen in any tab applies to all of them
onNoteSortChanged((order) => {
  noteSort = order
  drawList()
})

// ---------- Import a file (next to New note) and settings (top of the sidebar) ----------

const importButton = element<HTMLButtonElement>('#import')
const settingsButton = element<HTMLButtonElement>('#open-settings')
importButton.innerHTML = ICON_IMPORT
settingsButton.innerHTML = ICON_GEAR

// A .md or .txt file becomes a new note, opened in this tab
importButton.addEventListener('click', async () => {
  const file = await chooseFile('.md,.markdown,.txt,text/markdown,text/plain')
  if (!file) return
  const note = noteFromFile(file.name, await file.text(), newNoteTextSize, newNoteFont)
  if (!note) {
    alert(t('fileEmpty', { name: file.name }))
    return
  }
  await saveNote(note)
  updateNoteInList(note.id, note) // in the list right away, whether or not onNotesChanged came first
  open(note, true)
})

settingsButton.addEventListener('click', () => openSettings())

// After an import or deleting all notes (in this tab or another), reload with the
// new data, discarding pending typing so it isn't written over the backup
onImport(() => {
  discardPending()
  location.reload()
})

// ---------- Export and copy the open note (top right) ----------

const noteExportButton = element<HTMLButtonElement>('#note-export')
const noteCopyButton = element<HTMLButtonElement>('#note-copy')
const noteWhatsAppButton = element<HTMLButtonElement>('#note-copy-whatsapp')
noteExportButton.innerHTML = ICON_MARKDOWN
noteCopyButton.innerHTML = ICON_COPY
noteWhatsAppButton.innerHTML = ICON_CHAT

// Nothing to export or copy while the note is empty
function updateNoteActions() {
  const empty = editor.state.doc.textContent.trim() === ''
  noteExportButton.disabled = empty
  noteCopyButton.disabled = empty
  noteWhatsAppButton.disabled = empty
  notePinButton.disabled = empty
}

// Only when the content changes (not on every cursor movement)
editor.on('transaction', ({ transaction }) => {
  if (transaction.docChanged) updateNoteActions()
})

// ---------- Pin the open note (top right) ----------

const notePinButton = element<HTMLButtonElement>('#note-pin')
notePinButton.innerHTML = ICON_PIN

// Marked while the open note is pinned
function updatePinButton() {
  const label = isPinned(currentNote) ? t('unpinNote') : t('pinNote')
  notePinButton.title = label
  notePinButton.setAttribute('aria-label', label)
  notePinButton.setAttribute('aria-pressed', String(isPinned(currentNote)))
}

notePinButton.addEventListener('click', () => {
  if (currentNoteSaved) togglePin(currentNote) // a note not saved yet isn't in the list
})

noteExportButton.addEventListener('click', async () => {
  await saveIfPending() // include what was just typed
  exportMarkdown(currentNote)
})

// The note without the first line (the title): formatted for apps that accept it,
// markdown for plain-text ones
noteCopyButton.addEventListener('click', async () => {
  const doc = withoutFirstLine(editor.getJSON())
  // The editor's own schema (generateHTML would build a new one and warn about duplicate extensions)
  const html = getHTMLFromFragment(editor.schema.nodeFromJSON(doc).content, editor.schema)
  const item = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([noteToMarkdown({ ...currentNote, doc })], { type: 'text/plain' }),
  })
  try {
    await navigator.clipboard.write([item])
    showCopied(noteCopyButton, true)
  } catch (error) {
    alert(t('copyFailed', { error: error instanceof Error ? error.message : String(error) }))
  }
})

// WhatsApp formatting, without the first line (the title)
noteWhatsAppButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(noteToWhatsApp(editor.getJSON()))
    showCopied(noteWhatsAppButton, true)
  } catch (error) {
    alert(t('copyFailed', { error: error instanceof Error ? error.message : String(error) }))
  }
})

// ---------- Text size of the open note (top right, and Cmd/Ctrl+Shift+, and .) ----------

const editorElement = element<HTMLDivElement>('#editor')
const textSmallerButton = element<HTMLButtonElement>('#text-smaller')
const textBiggerButton = element<HTMLButtonElement>('#text-bigger')
const textSizeLabel = element<HTMLSpanElement>('#text-size')
textSmallerButton.innerHTML = ICON_TEXT_SMALLER
textBiggerButton.innerHTML = ICON_TEXT_BIGGER

const SHORTCUT = navigator.platform.startsWith('Mac') ? 'Cmd' : 'Ctrl'

// Shows the open note's size; the buttons stop at the ends of the range
function applyTextSize() {
  const size = validTextSize(currentNote.textSize)
  editorElement.style.setProperty('--note-scale', String(size / 100))
  textSizeLabel.textContent = `${size}%`
  textSmallerButton.disabled = size === TEXT_SIZES[0]
  textBiggerButton.disabled = size === TEXT_SIZES[TEXT_SIZES.length - 1]
  setLabel(textSmallerButton, t('smallerText', { size, shortcut: `${SHORTCUT}+Shift+,` }))
  setLabel(textBiggerButton, t('biggerText', { size, shortcut: `${SHORTCUT}+Shift+.` }))
}

function setLabel(button: HTMLButtonElement, label: string) {
  button.title = label
  button.setAttribute('aria-label', label)
}

// The size is part of the note: saved right away (a note not saved yet keeps it
// and saves it with the first keystroke)
function changeTextSize(direction: 1 | -1) {
  const size = validTextSize(currentNote.textSize)
  const next = nextTextSize(size, direction)
  if (next === size) return
  currentNote = { ...currentNote, textSize: next }
  applyTextSize()
  // The drag handle would stay where the block was; it comes back on the next mouse move
  editor.view.dispatch(editor.state.tr.setMeta('hideDragHandle', true))
  if (currentNoteSaved) saveNow()
}

textSmallerButton.addEventListener('click', () => changeTextSize(-1))
textBiggerButton.addEventListener('click', () => changeTextSize(1))

// event.code, because with Shift the key is "<" or ">" (on a US keyboard)
document.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) return
  if (event.code !== 'Comma' && event.code !== 'Period') return
  event.preventDefault()
  changeTextSize(event.code === 'Period' ? 1 : -1)
})

// The setting only affects notes created from now on
onNewNoteTextSizeChanged((size) => {
  newNoteTextSize = size
})

// ---------- Font of the open note (top right, "Aa") ----------

const fontButton = element<HTMLButtonElement>('#note-font')
fontButton.innerHTML = ICON_FONT

function applyFont() {
  const font = noteFontOf(currentNote, oldNoteFont)
  applyNoteFont(font)
  setLabel(fontButton, t('fontButton', { font: t(`font.${font}`), next: t(`font.${nextNoteFont(font)}`) }))
}

// Like the text size, the font is part of the note and is saved right away
fontButton.addEventListener('click', () => {
  const font = nextNoteFont(noteFontOf(currentNote, oldNoteFont))
  currentNote = { ...currentNote, font }
  applyFont()
  // The drag handle would stay where the block was; it comes back on the next mouse move
  editor.view.dispatch(editor.state.tr.setMeta('hideDragHandle', true))
  showLabel(fontButton, t(`font.${font}`), true)
  if (currentNoteSaved) saveNow()
})

// The setting only affects notes created from now on
onNewNoteFontChanged((font) => {
  newNoteFont = font
  rememberNewNoteFont(font)
})

// ---------- Character counts (bottom right) ----------

const noteStats = element<HTMLDivElement>('#note-stats')
let totals = '' // e.g. "1,234 characters · 1,180 without markdown"
let statsTimer: ReturnType<typeof setTimeout> | undefined

// Recounts the whole note (converting to markdown takes a moment on long notes)
function updateTotals() {
  clearTimeout(statsTimer)
  const doc = editor.state.doc
  if (doc.textContent.trim() === '') {
    totals = ''
  } else {
    const withMarkdown = markdownCharacters({ ...currentNote, doc: editor.getJSON() })
    totals = `${characters(withMarkdown)} · ${t('withoutMarkdown', { n: plainTextCharacters(doc).toLocaleString(locale()) })}`
  }
  drawStats()
}

// The totals plus the selected count, while there's a selection
function drawStats() {
  const { from, to, empty } = editor.state.selection
  const selected = empty ? 0 : selectedCharacters(editor.state.doc, from, to)
  noteStats.textContent = selected > 0 ? `${totals} · ${tn('selected', selected)}` : totals
  noteStats.hidden = totals === ''
}

editor.on('transaction', ({ transaction }) => {
  if (transaction.docChanged) {
    clearTimeout(statsTimer)
    statsTimer = setTimeout(updateTotals, STATS_DELAY)
  }
  if (transaction.selectionSet || transaction.docChanged) drawStats()
})

// ---------- Tag suggestions in the search ----------

const suggestionList = element<HTMLUListElement>('#tag-suggestions')
let suggestions: { tag: string; count: number }[] = []
let highlighted = 0 // the suggestion Enter or Tab picks

// Suggests tags while the word at the cursor starts with #
function updateSuggestions() {
  const { word } = wordAt(searchField.value, searchField.selectionStart ?? searchField.value.length)
  suggestions = word.startsWith('#') ? tagSuggestions(notes, word) : []
  highlighted = 0
  drawSuggestions()
}

function closeSuggestions() {
  suggestions = []
  drawSuggestions()
}

function drawSuggestions() {
  suggestionList.hidden = suggestions.length === 0
  searchField.setAttribute('aria-expanded', String(!suggestionList.hidden))
  const items = suggestions.map(({ tag, count }, i) => {
    const item = document.createElement('li')
    item.setAttribute('role', 'option')
    item.setAttribute('aria-selected', String(i === highlighted))
    const name = document.createElement('span')
    name.className = 'suggestion-tag'
    name.textContent = tag
    const notesWithTag = document.createElement('span')
    notesWithTag.className = 'suggestion-count'
    notesWithTag.textContent = String(count)
    item.append(name, notesWithTag)
    // mousedown + preventDefault: the search keeps the focus
    item.addEventListener('mousedown', (event) => {
      event.preventDefault()
      chooseSuggestion(i)
    })
    return item
  })
  suggestionList.replaceChildren(...items)
}

// Replaces the word at the cursor with the tag, keeping the rest of the search
function chooseSuggestion(i: number) {
  const { tag } = suggestions[i]
  const text = searchField.value
  const { start, end } = wordAt(text, searchField.selectionStart ?? text.length)
  searchField.value = text.slice(0, start) + tag + text.slice(end)
  const cursor = start + tag.length
  searchField.setSelectionRange(cursor, cursor)
  closeSuggestions()
  drawList()
}

searchField.addEventListener('keydown', (event) => {
  if (suggestions.length === 0) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const step = event.key === 'ArrowDown' ? 1 : -1
    highlighted = (highlighted + step + suggestions.length) % suggestions.length
    drawSuggestions()
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    chooseSuggestion(highlighted)
  } else if (event.key === 'Escape') {
    closeSuggestions() // only closes the list; the next Esc clears the search, as usual
  } else {
    return
  }
  event.preventDefault()
})
searchField.addEventListener('click', updateSuggestions) // the cursor may have moved to another word
searchField.addEventListener('blur', closeSuggestions)

// Cmd/Ctrl+click on a tag in the note: search for it, showing the sidebar if needed
function searchForTag(tag: string) {
  if (document.body.classList.contains('sidebar-collapsed')) {
    applySidebarCollapsed(false)
    saveSettings({ sidebarCollapsed: false })
  }
  searchField.value = tag
  drawList()
}

// ---------- Collapsing the sidebar ----------

// Hidden by typing (not by the button): comes back when the mouse moves, and isn't saved
let hiddenWhileTyping = false
let mouseWhenHidden: { x: number; y: number } | null = null

// whileTyping: hidden automatically; the button keeps its normal icon
function applySidebarCollapsed(collapsed: boolean, whileTyping = false) {
  hiddenWhileTyping = collapsed && whileTyping
  document.body.classList.toggle('sidebar-collapsed', collapsed)
  sidebarButton.innerHTML = collapsed && !whileTyping ? ICON_SIDEBAR_CLOSED : ICON_SIDEBAR
  const label = collapsed ? t('showSidebar') : t('collapseSidebar')
  sidebarButton.title = label
  sidebarButton.setAttribute('aria-label', label)
  sidebarButton.setAttribute('aria-expanded', String(!collapsed))
}

sidebarButton.addEventListener('click', () => {
  const collapsed = !document.body.classList.contains('sidebar-collapsed')
  applySidebarCollapsed(collapsed)
  saveSettings({ sidebarCollapsed: collapsed })
})

// Typing in the note hides the sidebar, if it's showing
element('#editor').addEventListener('beforeinput', () => {
  if (document.body.classList.contains('sidebar-collapsed')) return
  applySidebarCollapsed(true, true)
  mouseWhenHidden = null
})

// ...and moving the mouse brings it back. Screen coordinates: the page moving under a
// still mouse (when the sidebar closes) can also fire mousemove, without the mouse moving
document.addEventListener('mousemove', (event) => {
  if (!hiddenWhileTyping) return
  if (!mouseWhenHidden) {
    mouseWhenHidden = { x: event.screenX, y: event.screenY }
    return
  }
  const moved = Math.hypot(event.screenX - mouseWhenHidden.x, event.screenY - mouseWhenHidden.y)
  if (moved > 3) applySidebarCollapsed(false)
})

// ---------- Calendar (bottom of the sidebar) ----------

// Clicking a day: the date goes in at the cursor, as if typed (the update saves it)
function insertDate(text: string) {
  editor.chain().focus().insertContent({ type: 'text', text }).run()
}

// Chosen in any tab, applied in all of them
onShowCalendarChanged(showCalendar)
onDateFormatChanged(setDateFormat)

// ---------- Color swatches ----------

// Hidden with a class on the page; the editor keeps creating them
function showColorSwatches(show: boolean) {
  document.body.classList.toggle('no-color-swatches', !show)
}

// Chosen in any tab, applied in all of them
onColorSwatchesChanged(showColorSwatches)

// ---------- Calculations ----------

// Chosen in any tab, applied in all of them
onCalculationsChanged(setCalculationsEnabled)
onDecimalSeparatorChanged(setDecimalSeparator)

// ---------- Language ----------

// A language chosen in any tab: every tab saves pending typing and reloads in it
onLanguageChanged(async (language) => {
  rememberLanguage(language)
  await saveIfPending()
  location.reload()
})

// ---------- Theme ----------

// A theme chosen in any tab applies to all of them
onThemeChanged(applyTheme)

// ---------- Start ----------

async function start() {
  const settings = await readSettings()
  // The copy of the language this page opened with is outdated (e.g. after importing a backup)
  if (rememberLanguage(settings.language)) {
    location.reload()
    return
  }
  applyTheme(settings.theme)
  applySidebarCollapsed(settings.sidebarCollapsed)
  noteSort = settings.noteSort
  newNoteTextSize = settings.newNoteTextSize
  newNoteFont = settings.newNoteFont
  oldNoteFont = settings.noteFont
  rememberNewNoteFont(newNoteFont)
  showColorSwatches(settings.colorSwatches)
  setCalculationsEnabled(settings.calculations)
  setDecimalSeparator(settings.decimalSeparator)
  setupCalendar(settings.showCalendar, settings.dateFormat, insertDate)
  notes = await listNotes()

  const openId = sessionStorage.getItem('openNoteId')
  const openNote = openId ? await readNote(openId) : null
  if (openNote) open(openNote, true)
  else open(newNote(), false)

  // Only now turn animations on, so the sidebar doesn't "slide" when the tab opens
  requestAnimationFrame(() => document.body.classList.remove('loading'))
}

start()
