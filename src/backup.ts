import { contentSchema } from './extensions'
import { noteToMarkdown } from './markdown'
import { isNoteFont, isPinned, validTextSize, type Note } from './notes'
import type { Settings } from './storage'

// Backup file format (see SPEC.md). Doesn't depend on an open page:
// it's also used by the automatic backup.

export type BackupNote = Note & { markdown: string }

export type Backup = {
  app: 'draftab'
  version: 1
  exportedAt: number
  settings: Settings
  notes: BackupNote[]
}

const VERSION = 1

export function createBackup(notes: Note[], settings: Settings, now = Date.now()): Backup {
  return {
    app: 'draftab',
    version: VERSION,
    exportedAt: now,
    settings,
    notes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      titleManual: note.titleManual,
      textSize: validTextSize(note.textSize),
      font: note.font, // missing in notes from before fonts were per note (settings.noteFont)
      pinned: isPinned(note),
      markdown: noteToMarkdown(note), // for humans to read only
      doc: note.doc,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })),
  }
}

// draftab_YYYY-MM-DD-HHhMM.json (e.g. draftab_2026-10-11-15h05.json), in local time
export function backupFileName(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
  return `draftab_${day}-${two(date.getHours())}h${two(date.getMinutes())}.json`
}

// Reads the text of a backup file and checks everything before accepting it.
// Errors have messages ready to show to the user.
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('The file is not valid JSON.')
  }
  if (!isObject(data) || data.app !== 'draftab') {
    throw new Error('This file is not a Draftab backup.')
  }
  if (typeof data.version !== 'number' || data.version > VERSION) {
    throw new Error('This backup was made by a newer version of Draftab.')
  }
  if (data.version !== VERSION) {
    throw new Error('Unknown backup version.')
  }
  if (!Array.isArray(data.notes)) {
    throw new Error('The backup has no list of notes.')
  }

  const ids = new Set<string>()
  const notes = data.notes.map((note: unknown, i: number) => {
    const which = `Note ${i + 1} in the backup`
    if (!isObject(note) || typeof note.id !== 'string' || note.id === '') {
      throw new Error(`${which} has no id.`)
    }
    if (ids.has(note.id)) throw new Error(`${which} is duplicated.`)
    ids.add(note.id)
    if (typeof note.title !== 'string') throw new Error(`${which} has no title.`)
    if (typeof note.createdAt !== 'number' || typeof note.updatedAt !== 'number') {
      throw new Error(`${which} has no valid dates.`)
    }
    // The content must be a document the editor can open
    try {
      if (!isObject(note.doc) || note.doc.type !== 'doc') throw new Error()
      contentSchema().nodeFromJSON(note.doc).check()
    } catch {
      throw new Error(`${which} ("${note.title}") has invalid content.`)
    }
    return {
      id: note.id,
      title: note.title,
      titleManual: note.titleManual === true,
      textSize: validTextSize(note.textSize), // backups from before it existed: 100
      font: isNoteFont(note.font) ? note.font : undefined, // missing: the backup's settings.noteFont
      pinned: note.pinned === true, // backups from before it existed: not pinned
      markdown: typeof note.markdown === 'string' ? note.markdown : '',
      doc: note.doc,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    } as BackupNote
  })

  return {
    app: 'draftab',
    version: VERSION,
    exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : 0,
    settings: (isObject(data.settings) ? data.settings : {}) as Settings,
    notes,
  }
}

// The notes as they are stored: restored from doc (markdown is ignored)
export function notesFromBackup(backup: Backup): Note[] {
  return backup.notes.map(({ markdown: _markdown, ...note }) => note)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
