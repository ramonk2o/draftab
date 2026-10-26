import { noteFromFile } from './markdown'
import { t, tn } from './i18n'
import type { Note, NoteFont } from './notes'

// Importing files dragged onto the page (see "Import a file as a note" in SPEC.md).
// The same files as the Import button, decided by the name's extension: the system
// often reports no type for .md files.
const IMPORTABLE = /\.(md|markdown|txt)$/i

// The notes for the dropped files, in the order they were dropped, and the message to
// show (null when nothing was skipped). textSize and font: the "new notes" settings.
export async function notesFromDroppedFiles(
  files: File[],
  textSize = 100,
  font: NoteFont = 'sans',
): Promise<{ notes: Note[]; message: string | null }> {
  const notes: Note[] = []
  let wrongType = 0
  let empty = 0
  for (const file of files) {
    if (!IMPORTABLE.test(file.name)) {
      wrongType++
      continue
    }
    const note = noteFromFile(file.name, await file.text(), textSize, font)
    if (note) notes.push(note)
    else empty++
  }
  return { notes, message: dropMessage(files, notes.length, wrongType, empty) }
}

function dropMessage(files: File[], imported: number, wrongType: number, empty: number): string | null {
  if (wrongType + empty === 0) return null
  if (wrongType === files.length) return t('dropOnlyMdTxt')
  if (files.length === 1) return t('fileEmpty', { name: files[0].name }) // a single empty file, like the Import button
  const importedText = imported === 0 ? t('dropNoneImported') : tn('dropImported', imported)
  return `${importedText}, ${tn('dropSkipped', wrongType + empty)}.`
}

// Whether a drag carries files (a drag of text or a link doesn't)
export function draggingFiles(types: readonly string[]): boolean {
  return types.includes('Files')
}
