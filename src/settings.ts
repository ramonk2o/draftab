import { exportBackup, importBackup } from './backup-ui'
import { element } from './dom'
import { ICON_CLOSE } from './icons'
import {
  deleteAllNotes,
  onLastBackupChanged,
  readMeta,
  readSettings,
  saveSettings,
  validInterval,
} from './storage'
import type { NoteFont, NoteSort } from './notes'
import type { Theme } from './theme'
import { locale, t, tn, type LanguageSetting } from './i18n'
import { formatDate, type DateFormat } from './calendar'
import type { DecimalSeparatorSetting } from './calculate'

// Settings lightbox: backup (manual and automatic), appearance and deleting all notes

const dialog = element<HTMLDialogElement>('#settings')
const closeButton = element<HTMLButtonElement>('#close-settings')
const exportButton = element<HTMLButtonElement>('#settings-export')
const importButton = element<HTMLButtonElement>('#settings-import')
const backupMessage = element<HTMLParagraphElement>('#backup-message')
const intervalSelect = element<HTMLSelectElement>('#interval')
const languageSelect = element<HTMLSelectElement>('#language')
const themeSelect = element<HTMLSelectElement>('#theme')
const sortSelect = element<HTMLSelectElement>('#note-sort')
const fontSelect = element<HTMLSelectElement>('#new-note-font')
const textSizeSelect = element<HTMLSelectElement>('#new-note-text-size')
const colorSwatchesBox = element<HTMLInputElement>('#color-swatches')
const newNoteHeadingBox = element<HTMLInputElement>('#new-note-heading')
const showCalendarBox = element<HTMLInputElement>('#show-calendar')
const dateFormatSelect = element<HTMLSelectElement>('#date-format')
const calculationsBox = element<HTMLInputElement>('#calculations')
const decimalSeparatorSelect = element<HTMLSelectElement>('#decimal-separator')
const lastBackup = element<HTMLParagraphElement>('#last-backup')
const confirmField = element<HTMLInputElement>('#confirm-delete')
const deleteButton = element<HTMLButtonElement>('#delete-all')

closeButton.innerHTML = ICON_CLOSE

export async function openSettings() {
  // Always opens with the current values and nothing left over from last time
  const { autoBackupMinutes, language, theme, noteSort, newNoteFont, newNoteTextSize, showCalendar, dateFormat, colorSwatches, calculations, decimalSeparator, newNoteHeading } =
    await readSettings()
  intervalSelect.value = String(autoBackupMinutes)
  languageSelect.value = language
  themeSelect.value = theme
  sortSelect.value = noteSort
  fontSelect.value = newNoteFont
  textSizeSelect.value = String(newNoteTextSize)
  colorSwatchesBox.checked = colorSwatches
  newNoteHeadingBox.checked = newNoteHeading
  showCalendarBox.checked = showCalendar
  // Each format shown with today's date
  for (const option of dateFormatSelect.options) {
    option.textContent = formatDate(new Date(), option.value as DateFormat, locale())
  }
  dateFormatSelect.value = dateFormat
  calculationsBox.checked = calculations
  decimalSeparatorSelect.value = decimalSeparator
  showLastBackup((await readMeta()).lastBackupAt)
  showMessage('')
  confirmField.value = ''
  deleteButton.disabled = true
  dialog.showModal()
}

// ---------- Close ----------

export function closeSettings() {
  dialog.close()
}

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
  showMessage(tn('backupDownloaded', count))
})

importButton.addEventListener('click', async () => {
  const result = await importBackup()
  if (!result) return // gave up
  // On success, the page reloads by itself (onImport, in newtab.ts)
  showMessage(result.ok ? result.message : t('importFailed', { error: result.message }), !result.ok)
})

// ---------- Automatic backup ----------

function showLastBackup(moment: number) {
  lastBackup.textContent = moment
    ? t('lastBackup', { date: new Date(moment).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' }) })
    : t('noBackupYet')
}

intervalSelect.addEventListener('change', () => {
  // The service worker notices the change and adjusts the alarm
  saveSettings({ autoBackupMinutes: validInterval(Number(intervalSelect.value)) })
})

onLastBackupChanged(showLastBackup)

// ---------- Appearance ----------

languageSelect.addEventListener('change', () => {
  // Every tab (this one included) saves pending typing and reloads in the new language (onLanguageChanged)
  saveSettings({ language: languageSelect.value as LanguageSetting })
})

themeSelect.addEventListener('change', () => {
  // Every tab (this one included) applies the theme when it notices the change (onThemeChanged)
  saveSettings({ theme: themeSelect.value as Theme })
})

fontSelect.addEventListener('change', () => {
  // Only notes created from now on start with this font (onNewNoteFontChanged)
  saveSettings({ newNoteFont: fontSelect.value as NoteFont })
})

textSizeSelect.addEventListener('change', () => {
  // Only notes created from now on start with this size (onNewNoteTextSizeChanged)
  saveSettings({ newNoteTextSize: Number(textSizeSelect.value) })
})

sortSelect.addEventListener('change', () => {
  // Every tab (this one included) re-sorts its sidebar when it notices the change (onNoteSortChanged)
  saveSettings({ noteSort: sortSelect.value as NoteSort })
})

newNoteHeadingBox.addEventListener('change', () => {
  // Every tab uses it for its next blank note (onNewNoteHeadingChanged)
  saveSettings({ newNoteHeading: newNoteHeadingBox.checked })
})

colorSwatchesBox.addEventListener('change', () => {
  // Every tab (this one included) shows or hides them when it notices the change (onColorSwatchesChanged)
  saveSettings({ colorSwatches: colorSwatchesBox.checked })
})

// ---------- Calendar ----------

// Every tab (this one included) applies them when it notices the change
// (onShowCalendarChanged, onDateFormatChanged)
showCalendarBox.addEventListener('change', () => {
  saveSettings({ showCalendar: showCalendarBox.checked })
})

dateFormatSelect.addEventListener('change', () => {
  saveSettings({ dateFormat: dateFormatSelect.value as DateFormat })
})

// ---------- Calculations ----------

// Every tab (this one included) applies them when it notices the change
// (onCalculationsChanged, onDecimalSeparatorChanged)
calculationsBox.addEventListener('change', () => {
  saveSettings({ calculations: calculationsBox.checked })
})

decimalSeparatorSelect.addEventListener('change', () => {
  saveSettings({ decimalSeparator: decimalSeparatorSelect.value as DecimalSeparatorSetting })
})

// ---------- Delete all notes ----------

// The phrase is in the interface language ("delete everything" / "apagar tudo")
function phraseTyped(): boolean {
  return confirmField.value.trim().toLowerCase() === t('deletePhrase')
}

confirmField.addEventListener('input', () => {
  deleteButton.disabled = !phraseTyped()
})

deleteButton.addEventListener('click', async () => {
  if (!phraseTyped()) return
  deleteButton.disabled = true
  await deleteAllNotes()
  // Open tabs (this one included) reload by themselves, as with an import
})
