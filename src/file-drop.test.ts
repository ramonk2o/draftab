import { afterEach, describe, expect, test } from 'vitest'
import { draggingFiles, notesFromDroppedFiles } from './file-drop'
import { noteFromFile } from './markdown'
import { useLanguage } from './i18n'

const file = (name: string, text: string) => new File([text], name)

afterEach(() => useLanguage('en'))

describe('notesFromDroppedFiles', () => {
  test('a .md is read as markdown and a .txt as plain text, like the Import button', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('a.md', '# Title\n\n- item'), file('b.txt', '# not a heading')])
    expect(notes.map((note) => note.doc)).toEqual([
      noteFromFile('a.md', '# Title\n\n- item')!.doc,
      noteFromFile('b.txt', '# not a heading')!.doc,
    ])
    expect(notes[1].doc.content?.[0].type).toBe('paragraph')
    expect(message).toBeNull()
  })

  test('extensions in any case are accepted', async () => {
    const { notes, message } = await notesFromDroppedFiles([
      file('a.MD', 'one'),
      file('b.Markdown', 'two'),
      file('c.TXT', 'three'),
    ])
    expect(notes.map((note) => note.title)).toEqual(['one', 'two', 'three'])
    expect(message).toBeNull()
  })

  test('several valid files: one note each, in the order they were dropped, no message', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('z.md', 'first'), file('a.txt', 'second')])
    expect(notes.map((note) => note.title)).toEqual(['first', 'second'])
    expect(new Set(notes.map((note) => note.id)).size).toBe(2)
    expect(message).toBeNull()
  })

  test('uses the text size and font given for new notes', async () => {
    const { notes } = await notesFromDroppedFiles([file('a.md', 'x')], 120, 'serif')
    expect(notes[0].textSize).toBe(120)
    expect(notes[0].font).toBe('serif')
  })

  test('valid and invalid files mixed: the valid ones are imported and the message counts both', async () => {
    const { notes, message } = await notesFromDroppedFiles([
      file('a.md', 'one'),
      file('doc.pdf', '%PDF'),
      file('b.txt', 'two'),
      file('empty.md', '  \n'),
    ])
    expect(notes.map((note) => note.title)).toEqual(['one', 'two'])
    expect(message).toBe('2 notes imported, 2 files skipped.')
  })

  test('singular counts, in English and Portuguese', async () => {
    const files = () => [file('a.md', 'one'), file('photo.png', 'x')]
    expect((await notesFromDroppedFiles(files())).message).toBe('1 note imported, 1 file skipped.')
    useLanguage('pt')
    expect((await notesFromDroppedFiles(files())).message).toBe('1 nota importada, 1 arquivo ignorado.')
    expect((await notesFromDroppedFiles([...files(), file('b.pdf', 'x'), file('c.txt', 'two')])).message).toBe(
      '2 notas importadas, 2 arquivos ignorados.',
    )
  })

  test('a single file of another type: no note, the accepted-types message', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('doc.pdf', '%PDF')])
    expect(notes).toEqual([])
    expect(message).toBe('Only .md and .txt files can be imported.')
  })

  test('several files, none of an accepted type: the accepted-types message', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('doc.pdf', '%PDF'), file('notes.docx', 'x')])
    expect(notes).toEqual([])
    expect(message).toBe('Only .md and .txt files can be imported.')
  })

  test('a file without an extension, or with .md only inside the name, is another type', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('README', 'x'), file('a.md.pdf', 'x')])
    expect(notes).toEqual([])
    expect(message).toBe('Only .md and .txt files can be imported.')
  })

  test("a single empty file: no note, the Import button's message", async () => {
    const { notes, message } = await notesFromDroppedFiles([file('empty.md', '')])
    expect(notes).toEqual([])
    expect(message).toBe('Couldn\'t import: "empty.md" is empty.')
  })

  test('several files, nothing imported but not only because of the type: "No notes imported"', async () => {
    const allEmpty = await notesFromDroppedFiles([file('a.md', ''), file('b.txt', ' ')])
    expect(allEmpty).toEqual({ notes: [], message: 'No notes imported, 2 files skipped.' })
    const mixed = await notesFromDroppedFiles([file('a.pdf', 'x'), file('b.md', '')])
    expect(mixed.message).toBe('No notes imported, 2 files skipped.')
    useLanguage('pt')
    expect((await notesFromDroppedFiles([file('a.pdf', 'x'), file('b.md', '')])).message).toBe(
      'Nenhuma nota importada, 2 arquivos ignorados.',
    )
  })

  test('nothing dropped: nothing happens', async () => {
    expect(await notesFromDroppedFiles([])).toEqual({ notes: [], message: null })
  })
})

describe('draggingFiles', () => {
  test('only a drag that carries files counts', () => {
    expect(draggingFiles(['Files'])).toBe(true)
    expect(draggingFiles(['application/x-moz-file', 'Files'])).toBe(true)
    expect(draggingFiles(['text/plain', 'text/html'])).toBe(false)
    expect(draggingFiles(['text/uri-list', 'text/plain'])).toBe(false)
    expect(draggingFiles([])).toBe(false)
  })
})
