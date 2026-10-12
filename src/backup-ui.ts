import { backupFileName, createBackup, notesFromBackup, parseBackup } from './backup'
import { markdownFileName, noteToMarkdown } from './markdown'
import type { Note } from './notes'
import { listNotes, readSettings, replaceAll } from './storage'

// Export and import a backup from a page (sidebar or Settings)

// Downloads the backup file; returns how many notes were exported
export async function exportBackup(): Promise<number> {
  const notes = await listNotes()
  const backup = createBackup(notes, await readSettings())
  download(JSON.stringify(backup, null, 2), 'application/json', backupFileName(new Date()))
  return notes.length
}

// Downloads one note as a .md file
export function exportMarkdown(note: Note) {
  download(noteToMarkdown(note), 'text/markdown', markdownFileName(note))
}

function download(text: string, type: string, fileName: string) {
  const file = new Blob([text], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Result of an import attempt, with the message for the user
export type ImportResult = { ok: boolean; message: string }

// Asks for the file, checks it, confirms and replaces everything.
// Returns null if the user gives up along the way.
export async function importBackup(): Promise<ImportResult | null> {
  const file = await chooseFile('application/json,.json')
  if (!file) return null

  let backup
  try {
    backup = parseBackup(await file.text())
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }

  const current = (await listNotes()).length
  const when = backup.exportedAt
    ? ` from ${new Date(backup.exportedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`
    : ''
  const question =
    `Import ${plural(backup.notes.length, 'note', 'notes')} from the backup${when}?\n\n` +
    `This replaces ${current === 1 ? 'the current note' : `all ${plural(current, 'current note', 'current notes')}`}.`
  if (!confirm(question)) return null

  await replaceAll(notesFromBackup(backup), backup.settings)
  return { ok: true, message: `${plural(backup.notes.length, 'note imported', 'notes imported')}.` }
}

// Opens the file picker; `accept` lists the file types offered
export function chooseFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null))
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

export function plural(n: number, singular: string, several: string): string {
  return `${n} ${n === 1 ? singular : several}`
}
