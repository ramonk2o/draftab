import { isNoteFont, validTextSize, type Note, type NoteFont, type NoteSort } from './notes'
import type { Theme } from './theme'
import { isLanguageSetting, type LanguageSetting } from './i18n'
import { isDateFormat, type DateFormat } from './calendar'
import { isDecimalSeparator, type DecimalSeparatorSetting } from './calculate'

// All chrome.storage access goes through here.
// Keys: "note:<id>" (one per note), "settings" and "meta".

const NOTE_PREFIX = 'note:'

// Automatic backup intervals, in minutes (0 = off; monthly = 30 days)
export const BACKUP_INTERVALS = [0, 1, 60, 1440, 10080, 43200] as const
export type BackupInterval = (typeof BACKUP_INTERVALS)[number]

export type Settings = {
  autoBackupMinutes: BackupInterval
  sidebarCollapsed: boolean
  theme: Theme
  noteSort: NoteSort
  noteFont: NoteFont // font of notes without their own (from before fonts were per note); no longer changed
  newNoteFont: NoteFont // font new notes start with
  newNoteTextSize: number // in percent, one of TEXT_SIZES
  language: LanguageSetting // interface language; auto = Chrome's
  showCalendar: boolean // the calendar shows at the bottom of the sidebar
  dateFormat: DateFormat // format of dates inserted from the calendar
  colorSwatches: boolean // color codes (#3a7bd5) show a swatch of the color
  calculations: boolean // typing "=" after a calculation ("2*5=") writes the result
  decimalSeparator: DecimalSeparatorSetting // of calculations ("2*5="); auto = the interface language's
}

export type Meta = {
  lastChangeAt: number // last change to any note
  lastBackupAt: number // last automatic backup
  lastImportAt: number // last import (open tabs reload)
}

const DEFAULT_SETTINGS: Settings = {
  autoBackupMinutes: 0,
  sidebarCollapsed: false,
  theme: 'auto',
  noteSort: 'updated',
  noteFont: 'sans',
  newNoteFont: 'sans',
  newNoteTextSize: 100,
  language: 'auto',
  showCalendar: true,
  dateFormat: 'numeric',
  colorSwatches: true,
  calculations: true,
  decimalSeparator: 'auto',
}
const DEFAULT_META: Meta = { lastChangeAt: 0, lastBackupAt: 0, lastImportAt: 0 }

// ---------- Notes ----------

// All notes, from the most recently edited to the oldest
export async function listNotes(): Promise<Note[]> {
  const everything = await chrome.storage.local.get(null)
  return Object.entries(everything)
    .filter(([key]) => key.startsWith(NOTE_PREFIX))
    .map(([, note]) => note as Note)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function readNote(id: string): Promise<Note | null> {
  const key = NOTE_PREFIX + id
  const result = await chrome.storage.local.get(key)
  return (result[key] as Note | undefined) ?? null
}

export async function saveNote(note: Note): Promise<void> {
  const meta = await readMeta()
  await chrome.storage.local.set({
    [NOTE_PREFIX + note.id]: note,
    meta: { ...meta, lastChangeAt: Date.now() },
  })
}

export async function deleteNote(id: string): Promise<void> {
  await chrome.storage.local.remove(NOTE_PREFIX + id)
  const meta = await readMeta()
  await chrome.storage.local.set({ meta: { ...meta, lastChangeAt: Date.now() } })
}

// Notifies when notes change (in this tab or another). note = null when it was deleted.
export function onNotesChanged(callback: (changes: { id: string; note: Note | null }[]) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    const noteChanges = Object.entries(changes)
      .filter(([key]) => key.startsWith(NOTE_PREFIX))
      .map(([key, change]) => ({
        id: key.slice(NOTE_PREFIX.length),
        note: (change.newValue as Note | undefined) ?? null,
      }))
    if (noteChanges.length > 0) callback(noteChanges)
  })
}

// Import: deletes every note and stores the backup's notes, with its settings
export async function replaceAll(notes: Note[], settings: Partial<Settings>): Promise<void> {
  const everything = await chrome.storage.local.get(null)
  const noteKeys = Object.keys(everything).filter((key) => key.startsWith(NOTE_PREFIX))
  await chrome.storage.local.remove(noteKeys)

  const meta = await readMeta()
  const now = Date.now()
  const items: Record<string, unknown> = {
    settings: { ...DEFAULT_SETTINGS, ...settings },
    meta: { ...meta, lastChangeAt: now, lastImportAt: now },
  }
  for (const note of notes) items[NOTE_PREFIX + note.id] = note
  await chrome.storage.local.set(items)
}

// Deletes every note, keeping the settings. Notifies tabs like an import.
export async function deleteAllNotes(): Promise<void> {
  await replaceAll([], await readSettings())
}

// Notifies when an import (or deletion of all notes) happens, in this tab or another
export function onImport(callback: () => void) {
  onFieldChanged('meta', 'lastImportAt', () => callback())
}

// Calls back when one field of "settings" or "meta" changes (in this tab or another),
// with its new value (`any`: each caller knows its field's type). A field not stored yet
// counts as missing (in meta: 0).
function onFieldChanged(storageKey: 'settings' | 'meta', field: string, callback: (value: any) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    const change = changes[storageKey]
    if (area !== 'local' || !change) return
    const empty = storageKey === 'meta' ? 0 : undefined
    const before = (change.oldValue as Record<string, unknown> | undefined)?.[field] ?? empty
    const after = (change.newValue as Record<string, unknown> | undefined)?.[field] ?? empty
    if (after !== before) callback(after)
  })
}

// ---------- Settings and meta ----------

export async function readSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.local.get('settings')
  const stored = settings as Partial<Settings> | undefined
  const result = { ...DEFAULT_SETTINGS, ...stored }
  result.autoBackupMinutes = validInterval(result.autoBackupMinutes)
  if (!['auto', 'light', 'dark'].includes(result.theme)) result.theme = 'auto'
  if (!['updated', 'title', 'created'].includes(result.noteSort)) result.noteSort = 'updated'
  if (!isNoteFont(result.noteFont)) result.noteFont = 'sans'
  // Before fonts were per note, the one font in Settings was also the font of new notes
  if (!isNoteFont(stored?.newNoteFont)) result.newNoteFont = result.noteFont
  result.newNoteTextSize = validTextSize(result.newNoteTextSize)
  if (!isLanguageSetting(result.language)) result.language = 'auto'
  if (typeof result.showCalendar !== 'boolean') result.showCalendar = true
  if (!isDateFormat(result.dateFormat)) result.dateFormat = 'numeric'
  if (typeof result.colorSwatches !== 'boolean') result.colorSwatches = true
  if (typeof result.calculations !== 'boolean') result.calculations = true
  if (!isDecimalSeparator(result.decimalSeparator)) result.decimalSeparator = 'auto'
  return result
}

// Values not in the list (e.g. 6 h or 12 h, from older versions) become the
// closest interval; never turns off a backup that was on
export function validInterval(minutes: number): BackupInterval {
  if ((BACKUP_INTERVALS as readonly number[]).includes(minutes)) return minutes as BackupInterval
  if (!(minutes > 0)) return 0
  let best: BackupInterval = 1
  for (const option of BACKUP_INTERVALS) {
    if (option === 0) continue
    // Closest by ratio: 6 h is closer to 1 day (4×) than to 1 h (6×)
    if (Math.abs(Math.log(minutes / option)) < Math.abs(Math.log(minutes / best))) best = option
  }
  return best
}

export async function saveSettings(changes: Partial<Settings>): Promise<void> {
  const current = await readSettings()
  await chrome.storage.local.set({ settings: { ...current, ...changes } })
}

// Automatic backup done: records when it started being generated
export async function recordBackup(moment: number): Promise<void> {
  const meta = await readMeta() // read again right before writing, so a recent lastChangeAt isn't lost
  await chrome.storage.local.set({ meta: { ...meta, lastBackupAt: moment } })
}

// Notifies when the date of the last automatic backup changes
export function onLastBackupChanged(callback: (moment: number) => void) {
  onFieldChanged('meta', 'lastBackupAt', callback)
}

// Notify when a setting changes (in this tab or another). Settings are always saved
// whole, so a missing value only happens when it was never set (and is ignored).
export function onThemeChanged(callback: (theme: Theme) => void) {
  onFieldChanged('settings', 'theme', (theme) => theme && callback(theme))
}

export function onNoteSortChanged(callback: (order: NoteSort) => void) {
  onFieldChanged('settings', 'noteSort', (order) => order && callback(order))
}

export function onNewNoteFontChanged(callback: (font: NoteFont) => void) {
  onFieldChanged('settings', 'newNoteFont', (font) => isNoteFont(font) && callback(font))
}

export function onNewNoteTextSizeChanged(callback: (size: number) => void) {
  onFieldChanged('settings', 'newNoteTextSize', (size) => size && callback(validTextSize(size)))
}

export function onLanguageChanged(callback: (language: LanguageSetting) => void) {
  onFieldChanged('settings', 'language', (language) => isLanguageSetting(language) && callback(language))
}

export function onShowCalendarChanged(callback: (show: boolean) => void) {
  onFieldChanged('settings', 'showCalendar', (show) => typeof show === 'boolean' && callback(show))
}

export function onDateFormatChanged(callback: (format: DateFormat) => void) {
  onFieldChanged('settings', 'dateFormat', (format) => isDateFormat(format) && callback(format))
}

export function onColorSwatchesChanged(callback: (show: boolean) => void) {
  onFieldChanged('settings', 'colorSwatches', (show) => typeof show === 'boolean' && callback(show))
}

export function onCalculationsChanged(callback: (on: boolean) => void) {
  onFieldChanged('settings', 'calculations', (on) => typeof on === 'boolean' && callback(on))
}

export function onDecimalSeparatorChanged(callback: (setting: DecimalSeparatorSetting) => void) {
  onFieldChanged('settings', 'decimalSeparator', (setting) => isDecimalSeparator(setting) && callback(setting))
}

export function onBackupIntervalChanged(callback: () => void) {
  onFieldChanged('settings', 'autoBackupMinutes', () => callback())
}

export async function readMeta(): Promise<Meta> {
  const { meta } = await chrome.storage.local.get('meta')
  return { ...DEFAULT_META, ...(meta as Partial<Meta> | undefined) }
}
