import { backupFileName, createBackup } from './backup'
import { listNotes, readMeta, readSettings, recordBackup, type Meta } from './storage'

// Automatic backup, running in the service worker (background.ts).
// Uses nothing from a page: the service worker has no document or URL.createObjectURL.

export const ALARM_NAME = 'auto-backup'
export const BACKUP_FOLDER = 'draftab-backups'

// Only back up if some note changed since the last backup
export function needsBackup(meta: Meta): boolean {
  return meta.lastChangeAt > meta.lastBackupAt
}

// Turns the alarm on, changes it or turns it off according to the interval chosen in Settings
export async function scheduleBackup(): Promise<void> {
  const { autoBackupMinutes } = await readSettings()
  if (autoBackupMinutes === 0) {
    await chrome.alarms.clear(ALARM_NAME)
    return
  }
  // If the alarm already exists with the same interval, keep it (don't restart the countdown)
  const current = await chrome.alarms.get(ALARM_NAME)
  if (current?.periodInMinutes === autoBackupMinutes) return
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: autoBackupMinutes,
    periodInMinutes: autoBackupMinutes,
  })
}

// Downloads the backup to Downloads/draftab-backups/ if something changed. Returns whether it did.
export async function backupIfChanged(): Promise<boolean> {
  if (!needsBackup(await readMeta())) return false

  // Mark the start: changes made from here on go into the next backup
  const start = Date.now()
  const backup = createBackup(await listNotes(), await readSettings(), start)
  const json = JSON.stringify(backup, null, 2)

  await chrome.downloads.download({
    url: 'data:application/json;charset=utf-8,' + encodeURIComponent(json),
    filename: `${BACKUP_FOLDER}/${backupFileName(new Date(start))}`,
    conflictAction: 'uniquify', // never overwrites an earlier backup
    saveAs: false,
  })
  await recordBackup(start)
  return true
}
