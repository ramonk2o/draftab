import { beforeEach, describe, expect, test, vi } from 'vitest'
import { backupIfChanged, needsBackup, scheduleBackup } from './auto-backup'
import { parseBackup } from './backup'
import { createFakeChrome } from './fake-chrome'
import { newBlankNote, type Note } from './notes'
import { readMeta, saveNote, saveSettings } from './storage'

let fakeChrome: ReturnType<typeof createFakeChrome>
let now = 1000

function note(text: string): Note {
  return {
    ...newBlankNote(),
    title: text,
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
  }
}

// Moves the clock forward, so each save has a different time
function passTime(ms = 1000) {
  now += ms
}

beforeEach(() => {
  fakeChrome = createFakeChrome()
  vi.stubGlobal('chrome', fakeChrome)
  now = new Date(2026, 9, 11, 15, 5).getTime()
  vi.spyOn(Date, 'now').mockImplementation(() => now)
})

describe('needsBackup', () => {
  test('only when something changed after the last backup', () => {
    expect(needsBackup({ lastChangeAt: 0, lastBackupAt: 0, lastImportAt: 0 })).toBe(false)
    expect(needsBackup({ lastChangeAt: 5, lastBackupAt: 0, lastImportAt: 0 })).toBe(true)
    expect(needsBackup({ lastChangeAt: 5, lastBackupAt: 5, lastImportAt: 0 })).toBe(false)
  })
})

describe('backupIfChanged', () => {
  test('with no notes at all, downloads nothing', async () => {
    expect(await backupIfChanged()).toBe(false)
    expect(fakeChrome.downloads.downloaded).toHaveLength(0)
  })

  test('with a change, downloads a valid backup into the draftab-backups folder, without asking', async () => {
    await saveNote(note('hi'))
    passTime()
    expect(await backupIfChanged()).toBe(true)

    const [download] = fakeChrome.downloads.downloaded
    expect(download.filename).toBe('draftab-backups/draftab_2026-10-11-15h05.json')
    expect(download).toMatchObject({ saveAs: false, conflictAction: 'uniquify' })
    const prefix = 'data:application/json;charset=utf-8,'
    expect(download.url.startsWith(prefix)).toBe(true)
    const backup = parseBackup(decodeURIComponent(download.url.slice(prefix.length)))
    expect(backup.notes.map((n) => n.title)).toEqual(['hi'])
    expect((await readMeta()).lastBackupAt).toBe(now)
  })

  test('with no change since the last backup, does not download again', async () => {
    await saveNote(note('hi'))
    passTime()
    await backupIfChanged()
    passTime()
    expect(await backupIfChanged()).toBe(false)
    expect(fakeChrome.downloads.downloaded).toHaveLength(1)
  })

  test('editing after the backup makes the next one download', async () => {
    await saveNote(note('hi'))
    passTime()
    await backupIfChanged()
    passTime()
    await saveNote(note('another'))
    passTime()
    expect(await backupIfChanged()).toBe(true)
    expect(fakeChrome.downloads.downloaded).toHaveLength(2)
  })

  test('a change made while the backup was being generated goes into the next one', async () => {
    await saveNote(note('hi'))
    passTime()
    // The note is saved "in the middle" of the download: after the backup started
    fakeChrome.downloads.download = async function (options) {
      this.downloaded.push(options)
      passTime()
      await saveNote(note('during'))
      return 1
    }
    await backupIfChanged()
    const meta = await readMeta()
    expect(meta.lastChangeAt).toBeGreaterThan(meta.lastBackupAt)
  })
})

describe('scheduleBackup', () => {
  test('off: there is no alarm', async () => {
    await scheduleBackup()
    expect(fakeChrome.alarms.created.size).toBe(0)
  })

  test('turning on creates the alarm with the chosen interval; turning off removes it', async () => {
    await saveSettings({ autoBackupMinutes: 10080 })
    await scheduleBackup()
    expect(fakeChrome.alarms.created.get('auto-backup')).toEqual({ delayInMinutes: 10080, periodInMinutes: 10080 })
    await saveSettings({ autoBackupMinutes: 0 })
    await scheduleBackup()
    expect(fakeChrome.alarms.created.size).toBe(0)
  })

  test('the same interval keeps the alarm (does not restart the countdown)', async () => {
    await saveSettings({ autoBackupMinutes: 60 })
    await scheduleBackup()
    const create = vi.spyOn(fakeChrome.alarms, 'create')
    await scheduleBackup()
    expect(create).not.toHaveBeenCalled()
  })
})
