import type { Note, NoteSort } from './notes'
import type { NoteFont, Theme } from './theme'

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
  noteFont: NoteFont
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
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.meta) return
    // No meta stored yet counts as 0 (the first save is not an import)
    const before = (changes.meta.oldValue as Partial<Meta> | undefined)?.lastImportAt ?? 0
    const after = (changes.meta.newValue as Partial<Meta> | undefined)?.lastImportAt ?? 0
    if (after !== before) callback()
  })
}

// ---------- Settings and meta ----------

export async function readSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.local.get('settings')
  const result = { ...DEFAULT_SETTINGS, ...(settings as Partial<Settings> | undefined) }
  result.autoBackupMinutes = validInterval(result.autoBackupMinutes)
  if (!['auto', 'light', 'dark'].includes(result.theme)) result.theme = 'auto'
  if (!['updated', 'title', 'created'].includes(result.noteSort)) result.noteSort = 'updated'
  if (!['sans', 'serif', 'mono'].includes(result.noteFont)) result.noteFont = 'sans'
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
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.meta) return
    const before = (changes.meta.oldValue as Partial<Meta> | undefined)?.lastBackupAt ?? 0
    const after = (changes.meta.newValue as Partial<Meta> | undefined)?.lastBackupAt ?? 0
    if (after !== before) callback(after)
  })
}

// Notifies when the theme changes (in this tab or another)
export function onThemeChanged(callback: (theme: Theme) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return
    const before = (changes.settings.oldValue as Partial<Settings> | undefined)?.theme
    const after = (changes.settings.newValue as Partial<Settings> | undefined)?.theme
    if (after && after !== before) callback(after)
  })
}

// Notifies when the note sort order changes (in this tab or another)
export function onNoteSortChanged(callback: (order: NoteSort) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return
    const before = (changes.settings.oldValue as Partial<Settings> | undefined)?.noteSort
    const after = (changes.settings.newValue as Partial<Settings> | undefined)?.noteSort
    if (after && after !== before) callback(after)
  })
}

// Notifies when the note font changes (in this tab or another)
export function onNoteFontChanged(callback: (font: NoteFont) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return
    const before = (changes.settings.oldValue as Partial<Settings> | undefined)?.noteFont
    const after = (changes.settings.newValue as Partial<Settings> | undefined)?.noteFont
    if (after && after !== before) callback(after)
  })
}

// Notifies when the automatic backup interval changes
export function onBackupIntervalChanged(callback: () => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return
    const before = (changes.settings.oldValue as Partial<Settings> | undefined)?.autoBackupMinutes
    const after = (changes.settings.newValue as Partial<Settings> | undefined)?.autoBackupMinutes
    if (after !== before) callback()
  })
}

export async function readMeta(): Promise<Meta> {
  const { meta } = await chrome.storage.local.get('meta')
  return { ...DEFAULT_META, ...(meta as Partial<Meta> | undefined) }
}
