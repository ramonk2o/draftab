import { exportBackup, importBackup, plural } from './backup-ui'
import { ICON_CLOSE } from './icons'
import {
  deleteAllNotes,
  onLastBackupChanged,
  readMeta,
  readSettings,
  saveSettings,
  validInterval,
} from './storage'
import type { NoteSort } from './notes'
import type { NoteFont, Theme } from './theme'

// Settings lightbox: manual backup, automatic backup, appearance and deleting all notes

const DELETE_PHRASE = 'delete everything'

function element<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector)
  if (!el) throw new Error(`Element ${selector} not found`)
  return el
}

const dialog = element<HTMLDialogElement>('#settings')
const closeButton = element<HTMLButtonElement>('#close-settings')
const exportButton = element<HTMLButtonElement>('#settings-export')
const importButton = element<HTMLButtonElement>('#settings-import')
const backupMessage = element<HTMLParagraphElement>('#backup-message')
const intervalSelect = element<HTMLSelectElement>('#interval')
const themeSelect = element<HTMLSelectElement>('#theme')
const sortSelect = element<HTMLSelectElement>('#note-sort')
const fontSelect = element<HTMLSelectElement>('#note-font')
const lastBackup = element<HTMLParagraphElement>('#last-backup')
const confirmField = element<HTMLInputElement>('#confirm-delete')
const deleteButton = element<HTMLButtonElement>('#delete-all')

closeButton.innerHTML = ICON_CLOSE

export async function openSettings() {
  // Always opens with the current values and nothing left over from last time
  const { autoBackupMinutes, theme, noteSort, noteFont } = await readSettings()
  intervalSelect.value = String(autoBackupMinutes)
  themeSelect.value = theme
  sortSelect.value = noteSort
  fontSelect.value = noteFont
  showLastBackup((await readMeta()).lastBackupAt)
  showMessage('')
  confirmField.value = ''
  deleteButton.disabled = true
  dialog.showModal()
}

// ---------- Close ----------

closeButton.addEventListener('click', () => dialog.close())

// A click outside the box (on the dimmed background) closes it; the browser already handles Esc
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close()
})

// ---------- Manual backup ----------

function showMessage(text: string, error = false) {
  backupMessage.textContent = text
  backupMessage.classList.toggle('error', error)
}

exportButton.addEventListener('click', async () => {
  const count = await exportBackup()
  showMessage(`Backup with ${plural(count, 'note', 'notes')} downloaded.`)
})

importButton.addEventListener('click', async () => {
  const result = await importBackup()
  if (!result) return // gave up
  // On success, the page reloads by itself (onImport, in newtab.ts)
  showMessage(result.ok ? result.message : `Couldn't import: ${result.message}`, !result.ok)
})

// ---------- Automatic backup ----------

function showLastBackup(moment: number) {
  lastBackup.textContent = moment
    ? `Last automatic backup: ${new Date(moment).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}.`
    : 'No automatic backup yet.'
}

intervalSelect.addEventListener('change', () => {
  // The service worker notices the change and adjusts the alarm
  saveSettings({ autoBackupMinutes: validInterval(Number(intervalSelect.value)) })
})

onLastBackupChanged(showLastBackup)

// ---------- Appearance ----------

themeSelect.addEventListener('change', () => {
  // Every tab (this one included) applies the theme when it notices the change (onThemeChanged)
  saveSettings({ theme: themeSelect.value as Theme })
})

fontSelect.addEventListener('change', () => {
  // Every tab (this one included) switches the font when it notices the change (onNoteFontChanged)
  saveSettings({ noteFont: fontSelect.value as NoteFont })
})

sortSelect.addEventListener('change', () => {
  // Every tab (this one included) re-sorts its sidebar when it notices the change (onNoteSortChanged)
  saveSettings({ noteSort: sortSelect.value as NoteSort })
})

// ---------- Delete all notes ----------

confirmField.addEventListener('input', () => {
  deleteButton.disabled = confirmField.value.trim().toLowerCase() !== DELETE_PHRASE
})

deleteButton.addEventListener('click', async () => {
  if (confirmField.value.trim().toLowerCase() !== DELETE_PHRASE) return
  deleteButton.disabled = true
  await deleteAllNotes()
  // Open tabs (this one included) reload by themselves, as with an import
})
