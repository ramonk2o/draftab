import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { backupFileName, createBackup, notesFromBackup, parseBackup } from './backup'
import { createFakeChrome } from './fake-chrome'
import { newBlankNote, type Note } from './notes'
import { listNotes, onImport, readSettings, replaceAll, saveNote, saveSettings } from './storage'

const text = (t: string, marks?: JSONContent['marks']): JSONContent => ({ type: 'text', text: t, marks })
const paragraph = (...c: JSONContent[]): JSONContent => ({ type: 'paragraph', content: c })

// Note with several block types, to check the round trip has no losses
function fullNote(): Note {
  return {
    ...newBlankNote(),
    title: 'Ideas',
    titleManual: true,
    createdAt: 100,
    updatedAt: 200,
    doc: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [text('Ideas')] },
        paragraph(text('one '), text('bold', [{ type: 'bold' }])),
        {
          type: 'taskList',
          content: [{ type: 'taskItem', attrs: { checked: true }, content: [paragraph(text('done'))] }],
        },
        { type: 'horizontalRule' },
      ],
    },
  }
}

function simpleNote(t: string, updatedAt: number): Note {
  return { ...newBlankNote(), title: t, updatedAt, doc: { type: 'doc', content: [paragraph(text(t))] } }
}

beforeEach(() => {
  vi.stubGlobal('chrome', createFakeChrome())
})

describe('createBackup', () => {
  test('follows the SPEC format and includes each note in markdown', () => {
    const backup = createBackup([fullNote()], { autoBackupMinutes: 60, sidebarCollapsed: false, theme: 'auto', noteSort: 'updated' }, 999)
    expect(backup).toMatchObject({ app: 'draftab', version: 1, exportedAt: 999 })
    expect(backup.settings).toEqual({ autoBackupMinutes: 60, sidebarCollapsed: false, theme: 'auto', noteSort: 'updated' })
    expect(backup.notes[0].markdown).toBe('# Ideas\n\none **bold**\n\n- [x] done\n\n---')
  })
})

describe('round trip', () => {
  test('exporting and importing returns exactly the same notes', () => {
    const notes = [fullNote(), simpleNote('another', 50)]
    const file = JSON.stringify(createBackup(notes, { autoBackupMinutes: 0, sidebarCollapsed: true, theme: 'auto', noteSort: 'updated' }))
    expect(notesFromBackup(parseBackup(file))).toEqual(notes)
  })

  test('through storage: export, change everything and import restores the state', async () => {
    await saveNote(fullNote())
    await saveNote(simpleNote('second', 300))
    await saveSettings({ autoBackupMinutes: 10080 })
    const before = await listNotes()
    const file = JSON.stringify(createBackup(before, await readSettings()))

    // After the backup: delete a note, create another, change a setting
    await replaceAll([simpleNote('new after the backup', 400)], { autoBackupMinutes: 0 })

    const backup = parseBackup(file)
    await replaceAll(notesFromBackup(backup), backup.settings)
    expect(await listNotes()).toEqual(before)
    expect((await readSettings()).autoBackupMinutes).toBe(10080)
  })
})

describe('settings in the backup', () => {
  test('every setting goes into the file and comes back on import', async () => {
    // Non-default values in every field
    const chosen = { autoBackupMinutes: 10080, sidebarCollapsed: true, theme: 'dark', noteSort: 'title' } as const
    await saveSettings(chosen)
    await saveNote(simpleNote('x', 1))
    const file = JSON.stringify(createBackup(await listNotes(), await readSettings()))
    expect(JSON.parse(file).settings).toEqual(chosen)

    // Reset everything to the defaults and import
    await replaceAll([], {})
    expect(await readSettings()).toEqual({ autoBackupMinutes: 0, sidebarCollapsed: false, theme: 'auto', noteSort: 'updated' })
    const backup = parseBackup(file)
    await replaceAll(notesFromBackup(backup), backup.settings)
    expect(await readSettings()).toEqual(chosen)
  })

  test('no setting is left out of the backup', async () => {
    // If a new field is added to Settings, this test is a reminder to check the backup
    const settings = await readSettings()
    const backup = createBackup([], settings)
    expect(Object.keys(backup.settings).sort()).toEqual(Object.keys(settings).sort())
    expect(Object.keys(settings).sort()).toEqual(['autoBackupMinutes', 'noteSort', 'sidebarCollapsed', 'theme'])
  })
})

describe('parseBackup rejects invalid files', () => {
  const valid = () => createBackup([simpleNote('a', 1)], { autoBackupMinutes: 0, sidebarCollapsed: false, theme: 'auto', noteSort: 'updated' })
  const withNote = (change: Record<string, unknown>) => {
    const b = valid()
    return JSON.stringify({ ...b, notes: [{ ...b.notes[0], ...change }] })
  }

  test.each([
    ['text that is not JSON', 'this is not json', 'not valid JSON'],
    ['JSON from another app', JSON.stringify({ app: 'other', version: 1, notes: [] }), 'not a Draftab backup'],
    ['newer version', JSON.stringify({ ...valid(), version: 2 }), 'newer version'],
    ['no list of notes', JSON.stringify({ ...valid(), notes: 'x' }), 'has no list of notes'],
    ['note without id', withNote({ id: '' }), 'has no id'],
    ['note without dates', withNote({ updatedAt: 'yesterday' }), 'has no valid dates'],
    ['doc that is not a document', withNote({ doc: { type: 'paragraph' } }), 'invalid content'],
    ['unknown block', withNote({ doc: { type: 'doc', content: [{ type: 'table' }] } }), 'invalid content'],
  ])('%s', (_name, file, message) => {
    expect(() => parseBackup(file)).toThrow(message)
  })

  test('duplicated notes', () => {
    const b = valid()
    expect(() => parseBackup(JSON.stringify({ ...b, notes: [b.notes[0], b.notes[0]] }))).toThrow('duplicated')
  })

  test('a backup with no notes is valid', () => {
    const empty = createBackup([], { autoBackupMinutes: 0, sidebarCollapsed: false, theme: 'auto', noteSort: 'updated' })
    expect(parseBackup(JSON.stringify(empty)).notes).toEqual([])
  })
})

describe('importing into storage', () => {
  test('replaceAll removes notes that are not in the backup', async () => {
    await saveNote(simpleNote('goes away', 1))
    await replaceAll([simpleNote('stays', 2)], {})
    expect((await listNotes()).map((n) => n.title)).toEqual(['stays'])
  })

  test('notifies tabs about the import, but not about regular saves', async () => {
    const notice = vi.fn()
    onImport(notice)
    await saveNote(simpleNote('regular', 1))
    expect(notice).not.toHaveBeenCalled()
    await replaceAll([], {})
    expect(notice).toHaveBeenCalledTimes(1)
  })
})

test('file name in the draftab_YYYY-MM-DD-HHhMM.json format', () => {
  expect(backupFileName(new Date(2026, 9, 11, 15, 5))).toBe('draftab_2026-10-11-15h05.json')
  expect(backupFileName(new Date(2026, 0, 2, 9, 7))).toBe('draftab_2026-01-02-09h07.json')
})
