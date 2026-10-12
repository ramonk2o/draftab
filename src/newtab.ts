import type { JSONContent } from '@tiptap/core'
import { EditorState } from '@tiptap/pm/state'
import { createEditor } from './editor'
import { element } from './dom'
import { showCopied } from './copy-block'
import { chooseFile, exportMarkdown } from './backup-ui'
import { noteFromFile, noteToMarkdown } from './markdown'
import { openSettings } from './settings'
import { applyNoteFont, applyTheme } from './theme'
import {
  ICON_COPY,
  ICON_GEAR,
  ICON_IMPORT,
  ICON_MARKDOWN,
  ICON_PENCIL,
  ICON_TRASH,
} from './icons'
import {
  displayTitle,
  filterNotes,
  isEmptyNote,
  listDate,
  newBlankNote,
  renamed,
  sortNotes,
  withUpdatedTitle,
  type Note,
  type NoteSort,
} from './notes'
import {
  deleteNote,
  listNotes,
  onImport,
  onNoteFontChanged,
  onNoteSortChanged,
  onNotesChanged,
  onThemeChanged,
  readNote,
  readSettings,
  saveNote,
  saveSettings,
} from './storage'

const SAVE_DELAY = 500 // ms without typing before saving

const sidebarButton = element<HTMLButtonElement>('#toggle-sidebar')
const newNoteButton = element<HTMLButtonElement>('#new-note')
const searchField = element<HTMLInputElement>('#search')
const noteList = element<HTMLUListElement>('#note-list')
const editor = createEditor(element('#editor'))

// ---------- Tab state ----------

let currentNote: Note = newBlankNote() // note open in the editor
let currentNoteSaved = false // does the open note already exist in storage?
let notes: Note[] = [] // copy of the list, for the sidebar
let timer: ReturnType<typeof setTimeout> | undefined
let lastSaveFromThisTab = 0 // updatedAt of the last note saved by this tab
let renaming = false // while renaming, the list isn't redrawn
let noteSort: NoteSort = 'updated' // sidebar order, from Settings

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
  updateNoteActions()
  // Reloading the tab reopens this note
  sessionStorage.setItem('openNoteId', note.id)
  drawList()
  // view.focus() focuses right away (Tiptap's focus waits for the next frame and
  // would lose the first keystrokes typed right after clicking "New note")
  editor.view.focus()
  editor.commands.focus(alreadySaved ? 'end' : 'start')
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

newNoteButton.addEventListener('click', () => open(newBlankNote(), false))

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
    if (currentNoteSaved) open(newBlankNote(), false)
    return
  }
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
})

// ---------- Sidebar ----------

searchField.addEventListener('input', drawList)

function drawList() {
  if (renaming) return
  const visible = sortNotes(filterNotes(notes, searchField.value), noteSort)
  if (visible.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty-list'
    empty.textContent = notes.length === 0 ? 'No notes yet' : 'Nothing found'
    noteList.replaceChildren(empty)
    return
  }
  noteList.replaceChildren(...visible.map(createItem))
}

function createItem(note: Note): HTMLLIElement {
  const item = document.createElement('li')
  item.className = 'note-item'
  if (note.id === currentNote.id) item.classList.add('current')

  const title = document.createElement('span')
  title.className = 'note-title'
  title.textContent = displayTitle(note)
  title.title = 'Double-click to rename'

  const date = document.createElement('span')
  date.className = 'note-date'
  date.textContent = formatDate(listDate(note, noteSort))

  const rename = actionButton(ICON_PENCIL, 'Rename', () => startRename(item, note))
  const remove = actionButton(ICON_TRASH, 'Delete', () => confirmDelete(note))

  item.append(title, date, rename, remove)
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
  field.placeholder = note.title || 'Automatic title'
  field.setAttribute('aria-label', 'New title')
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
    lastSaveFromThisTab = currentNote.updatedAt
    await saveNote(currentNote)
    return
  }
  const stored = await readNote(note.id)
  if (stored) await saveNote({ ...renamed(stored, title), updatedAt: Date.now() })
}

async function confirmDelete(note: Note) {
  if (!confirm(`Delete the note "${displayTitle(note)}"? This can't be undone.`)) return
  if (note.id === currentNote.id) {
    discardPending()
    currentNoteSaved = false
    open(newBlankNote(), false)
  }
  await deleteNote(note.id)
}

// Time for today's notes, short date for older ones (in the browser's language)
function formatDate(moment: number): string {
  const date = new Date(moment)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' })
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
  const note = noteFromFile(file.name, await file.text())
  if (!note) {
    alert(`Couldn't import: "${file.name}" is empty.`)
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
noteExportButton.innerHTML = ICON_MARKDOWN
noteCopyButton.innerHTML = ICON_COPY

// Nothing to export or copy while the note is empty
function updateNoteActions() {
  const empty = editor.state.doc.textContent.trim() === ''
  noteExportButton.disabled = empty
  noteCopyButton.disabled = empty
}

// Only when the content changes (not on every cursor movement)
editor.on('transaction', ({ transaction }) => {
  if (transaction.docChanged) updateNoteActions()
})

noteExportButton.addEventListener('click', async () => {
  await saveIfPending() // include what was just typed
  exportMarkdown(currentNote)
})

// The whole note: formatted for apps that accept it, markdown for plain-text ones
noteCopyButton.addEventListener('click', async () => {
  const note = { ...currentNote, doc: editor.getJSON() }
  const item = new ClipboardItem({
    'text/html': new Blob([editor.getHTML()], { type: 'text/html' }),
    'text/plain': new Blob([noteToMarkdown(note)], { type: 'text/plain' }),
  })
  try {
    await navigator.clipboard.write([item])
    showCopied(noteCopyButton, true)
  } catch (error) {
    alert(`Couldn't copy the note: ${error instanceof Error ? error.message : String(error)}`)
  }
})

// ---------- Collapsing the sidebar ----------

function applySidebarCollapsed(collapsed: boolean) {
  document.body.classList.toggle('sidebar-collapsed', collapsed)
  const label = collapsed ? 'Show sidebar' : 'Collapse sidebar'
  sidebarButton.title = label
  sidebarButton.setAttribute('aria-label', label)
  sidebarButton.setAttribute('aria-expanded', String(!collapsed))
}

sidebarButton.addEventListener('click', () => {
  const collapsed = !document.body.classList.contains('sidebar-collapsed')
  applySidebarCollapsed(collapsed)
  saveSettings({ sidebarCollapsed: collapsed })
})

// ---------- Theme ----------

// A theme or note font chosen in any tab applies to all of them
onThemeChanged(applyTheme)
onNoteFontChanged(applyNoteFont)

// ---------- Start ----------

async function start() {
  const settings = await readSettings()
  applyTheme(settings.theme)
  applyNoteFont(settings.noteFont)
  applySidebarCollapsed(settings.sidebarCollapsed)
  noteSort = settings.noteSort
  notes = await listNotes()

  const openId = sessionStorage.getItem('openNoteId')
  const openNote = openId ? await readNote(openId) : null
  if (openNote) open(openNote, true)
  else open(newBlankNote(), false)

  // Only now turn animations on, so the sidebar doesn't "slide" when the tab opens
  requestAnimationFrame(() => document.body.classList.remove('loading'))
}

start()
