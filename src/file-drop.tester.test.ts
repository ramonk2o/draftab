import { afterEach, describe, expect, test } from 'vitest'
import { notesFromDroppedFiles } from './file-drop'
import { noteFromFile } from './markdown'
import { useLanguage } from './i18n'

const file = (name: string, text: string, type = '') => new File([text], name, { type })

afterEach(() => useLanguage('en'))

describe('notesFromDroppedFiles (tester)', () => {
  test('type comes from the extension, not the reported MIME type', async () => {
    const { notes, message } = await notesFromDroppedFiles([
      file('a.md', 'one', 'application/octet-stream'),
      file('b.pdf', 'two', 'text/markdown'),
      file('c.txt', 'three', 'image/png'),
    ])
    expect(notes.map((n) => n.title)).toEqual(['one', 'three'])
    expect(message).toBe('2 notes imported, 1 file skipped.')
  })

  test('.MARKDOWN in upper case is read as markdown', async () => {
    const { notes } = await notesFromDroppedFiles([file('a.MARKDOWN', '# Title\n\n- item')])
    expect(notes[0].doc).toEqual(noteFromFile('a.md', '# Title\n\n- item')!.doc)
    expect(notes[0].doc.content?.[0].type).toBe('heading')
  })

  test('.txt with Windows line breaks: same as the Import button', async () => {
    const { notes } = await notesFromDroppedFiles([file('a.txt', 'one\r\ntwo\rthree')])
    expect(notes[0].doc).toEqual(noteFromFile('a.txt', 'one\r\ntwo\rthree')!.doc)
  })

  test('a single whitespace-only file gets the Import button message', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('blank.txt', ' \n\t\n')])
    expect(notes).toEqual([])
    expect(message).toBe('Couldn\'t import: "blank.txt" is empty.')
  })

  test('one valid and one empty: empty counts as skipped', async () => {
    const { notes, message } = await notesFromDroppedFiles([file('a.md', 'one'), file('e.md', '')])
    expect(notes.map((n) => n.title)).toEqual(['one'])
    expect(message).toBe('1 note imported, 1 file skipped.')
  })

  test('accepted-types message in Portuguese', async () => {
    useLanguage('pt')
    const { message } = await notesFromDroppedFiles([file('a.pdf', 'x')])
    expect(message).toBe('Só arquivos .md e .txt podem ser importados.')
  })

  test('many files keep drop order and get distinct ids', async () => {
    const files = Array.from({ length: 60 }, (_, i) => file(`n${i}.md`, `note ${i}`))
    const { notes, message } = await notesFromDroppedFiles(files)
    expect(notes.map((n) => n.title)).toEqual(files.map((_, i) => `note ${i}`))
    expect(new Set(notes.map((n) => n.id)).size).toBe(60)
    expect(message).toBeNull()
  })
})
