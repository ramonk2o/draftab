import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createFakeChrome } from './fake-chrome'
import { newBlankNote, type Note } from './notes'
import {
  deleteAllNotes,
  deleteNote,
  listNotes,
  onNewNoteTextSizeChanged,
  onNewNoteFontChanged,
  onNoteSortChanged,
  onNotesChanged,
  onDateFormatChanged,
  onShowCalendarChanged,
  onThemeChanged,
  readMeta,
  readNote,
  readSettings,
  saveNote,
  saveSettings,
  validInterval,
} from './storage'

function noteWith(text: string, updatedAt: number): Note {
  return {
    ...newBlankNote(),
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
    title: text,
    updatedAt,
  }
}

beforeEach(() => {
  vi.stubGlobal('chrome', createFakeChrome())
})

describe('notes', () => {
  test('saves and reads a note identical to the original', async () => {
    const note = noteWith('hi', 1)
    await saveNote(note)
    expect(await readNote(note.id)).toEqual(note)
  })

  test('a missing note returns null', async () => {
    expect(await readNote('does-not-exist')).toBeNull()
  })

  test('lists from most recent to oldest, ignoring other keys', async () => {
    await saveNote(noteWith('old', 1))
    await saveNote(noteWith('new', 3))
    await saveNote(noteWith('middle', 2))
    await saveSettings({ sidebarCollapsed: true })
    const titles = (await listNotes()).map((n) => n.title)
    expect(titles).toEqual(['new', 'middle', 'old'])
  })

  test('saving again replaces the note', async () => {
    const note = noteWith('before', 1)
    await saveNote(note)
    await saveNote({ ...note, title: 'after', updatedAt: 2 })
    const notes = await listNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('after')
  })

  test('deleting removes the note', async () => {
    const note = noteWith('bye', 1)
    await saveNote(note)
    await deleteNote(note.id)
    expect(await readNote(note.id)).toBeNull()
    expect(await listNotes()).toEqual([])
  })

  test('saving and deleting record the time of the last change', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const note = noteWith('x', 1)
    await saveNote(note)
    expect((await readMeta()).lastChangeAt).toBe(1000)
    vi.spyOn(Date, 'now').mockReturnValue(2000)
    await deleteNote(note.id)
    expect((await readMeta()).lastChangeAt).toBe(2000)
    vi.restoreAllMocks()
  })

  test('notifies note changes, with null when deleted', async () => {
    const received: { id: string; note: Note | null }[] = []
    onNotesChanged((changes) => received.push(...changes))
    const note = noteWith('x', 1)
    await saveNote(note)
    await saveSettings({ sidebarCollapsed: true }) // not a note: no notification
    await deleteNote(note.id)
    expect(received).toEqual([
      { id: note.id, note },
      { id: note.id, note: null },
    ])
  })
})

describe('settings', () => {
  test('with nothing saved, uses the defaults', async () => {
    expect(await readSettings()).toEqual({ autoBackupMinutes: 0, sidebarCollapsed: false, theme: 'auto', noteSort: 'updated', noteFont: 'sans', newNoteFont: 'sans', newNoteTextSize: 100, language: 'auto', showCalendar: true, dateFormat: 'numeric' })
  })

  test('saving one part keeps the rest', async () => {
    await saveSettings({ autoBackupMinutes: 60 })
    await saveSettings({ sidebarCollapsed: true })
    expect(await readSettings()).toEqual({ autoBackupMinutes: 60, sidebarCollapsed: true, theme: 'auto', noteSort: 'updated', noteFont: 'sans', newNoteFont: 'sans', newNoteTextSize: 100, language: 'auto', showCalendar: true, dateFormat: 'numeric' })
  })
})

describe('automatic backup interval', () => {
  test('values in the list stay as they are', () => {
    for (const v of [0, 1, 60, 1440, 10080, 43200]) expect(validInterval(v)).toBe(v)
  })

  test('old values become the closest interval, without turning off', () => {
    expect(validInterval(360)).toBe(1440) // 6 h → daily
    expect(validInterval(720)).toBe(1440) // 12 h → daily
    expect(validInterval(5)).toBe(1)
    expect(validInterval(-3)).toBe(0)
  })

  test('an old stored setting is read already converted', async () => {
    await chrome.storage.local.set({ settings: { autoBackupMinutes: 720, sidebarCollapsed: false } })
    expect((await readSettings()).autoBackupMinutes).toBe(1440)
  })
})

describe('deleteAllNotes', () => {
  test('deletes every note and keeps the settings', async () => {
    await saveNote(noteWith('a', 1))
    await saveNote(noteWith('b', 2))
    await saveSettings({ autoBackupMinutes: 60, sidebarCollapsed: true })
    await deleteAllNotes()
    expect(await listNotes()).toEqual([])
    expect(await readSettings()).toEqual({ autoBackupMinutes: 60, sidebarCollapsed: true, theme: 'auto', noteSort: 'updated', noteFont: 'sans', newNoteFont: 'sans', newNoteTextSize: 100, language: 'auto', showCalendar: true, dateFormat: 'numeric' })
  })
})

describe('theme', () => {
  test('saved and read; an unknown value goes back to automatic', async () => {
    await saveSettings({ theme: 'dark' })
    expect((await readSettings()).theme).toBe('dark')
    await chrome.storage.local.set({ settings: { theme: 'purple' } })
    expect((await readSettings()).theme).toBe('auto')
  })

  test('notifies tabs when the theme changes, and only then', async () => {
    const received: string[] = []
    onThemeChanged((theme) => received.push(theme))
    await saveSettings({ theme: 'dark' })
    await saveSettings({ sidebarCollapsed: true })
    await saveSettings({ theme: 'light' })
    expect(received).toEqual(['dark', 'light'])
  })
})

describe('note sort order', () => {
  test('defaults to last modified; saved and read; an unknown value goes back to the default', async () => {
    expect((await readSettings()).noteSort).toBe('updated')
    await saveSettings({ noteSort: 'title' })
    expect((await readSettings()).noteSort).toBe('title')
    await chrome.storage.local.set({ settings: { noteSort: 'random' } })
    expect((await readSettings()).noteSort).toBe('updated')
  })

  test('notifies tabs when the order changes, and only then', async () => {
    const received: string[] = []
    onNoteSortChanged((order) => received.push(order))
    await saveSettings({ noteSort: 'created' })
    await saveSettings({ theme: 'dark' })
    await saveSettings({ noteSort: 'title' })
    expect(received).toEqual(['created', 'title'])
  })
})

describe('note font', () => {
  test('defaults to sans-serif; saved and read; an unknown value goes back to the default', async () => {
    expect((await readSettings()).noteFont).toBe('sans')
    await saveSettings({ noteFont: 'mono' })
    expect((await readSettings()).noteFont).toBe('mono')
    await chrome.storage.local.set({ settings: { noteFont: 'comic' } })
    expect((await readSettings()).noteFont).toBe('sans')
  })

  test('the font of new notes starts as the old single font, until it is changed', async () => {
    await chrome.storage.local.set({ settings: { noteFont: 'serif' } })
    expect((await readSettings()).newNoteFont).toBe('serif')
    await saveSettings({ newNoteFont: 'mono' })
    expect(await readSettings()).toMatchObject({ noteFont: 'serif', newNoteFont: 'mono' })
    await chrome.storage.local.set({ settings: { noteFont: 'serif', newNoteFont: 'comic' } })
    expect((await readSettings()).newNoteFont).toBe('serif')
  })

  test('notifies tabs when the font of new notes changes, and only then', async () => {
    const received: string[] = []
    onNewNoteFontChanged((font) => received.push(font))
    await saveSettings({ newNoteFont: 'serif' })
    await saveSettings({ noteSort: 'title' })
    await saveSettings({ newNoteFont: 'mono' })
    expect(received).toEqual(['serif', 'mono'])
  })
})

describe('text size of new notes', () => {
  test('defaults to 100%; saved and read; a value outside the steps goes back to 100%', async () => {
    expect((await readSettings()).newNoteTextSize).toBe(100)
    await saveSettings({ newNoteTextSize: 135 })
    expect((await readSettings()).newNoteTextSize).toBe(135)
    await chrome.storage.local.set({ settings: { newNoteTextSize: 300 } })
    expect((await readSettings()).newNoteTextSize).toBe(100)
  })

  test('notifies tabs when it changes, and only then', async () => {
    const received: number[] = []
    onNewNoteTextSizeChanged((size) => received.push(size))
    await saveSettings({ newNoteTextSize: 110 })
    await saveSettings({ noteSort: 'title' })
    await saveSettings({ newNoteTextSize: 90 })
    expect(received).toEqual([110, 90])
  })
})

describe('calendar', () => {
  test('shown by default, with the numeric format; invalid values go back to the defaults', async () => {
    expect(await readSettings()).toMatchObject({ showCalendar: true, dateFormat: 'numeric' })
    await saveSettings({ showCalendar: false, dateFormat: 'long' })
    expect(await readSettings()).toMatchObject({ showCalendar: false, dateFormat: 'long' })
    await chrome.storage.local.set({ settings: { showCalendar: 'no', dateFormat: 'dd/mm' } })
    expect(await readSettings()).toMatchObject({ showCalendar: true, dateFormat: 'numeric' })
  })

  test('notifies tabs when each one changes, and only then', async () => {
    const shown: boolean[] = []
    const formats: string[] = []
    await saveSettings({}) // settings already stored (the first save stores every field)
    onShowCalendarChanged((show) => shown.push(show))
    onDateFormatChanged((format) => formats.push(format))
    await saveSettings({ showCalendar: false })
    await saveSettings({ dateFormat: 'iso' })
    await saveSettings({ noteSort: 'title' })
    await saveSettings({ showCalendar: true })
    expect(shown).toEqual([false, true])
    expect(formats).toEqual(['iso'])
  })
})
