import { ALARM_NAME, backupIfChanged, scheduleBackup } from './auto-backup'
import { onBackupIntervalChanged } from './storage'

// The extension's service worker: handles the automatic backup, even with the tab closed.

// Make sure the alarm exists when the extension is installed/updated and when Chrome starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clear('backup-automatico') // alarm name used by versions before the English rename
  scheduleBackup()
})
chrome.runtime.onStartup.addListener(() => scheduleBackup())

// The interval changed in Settings
onBackupIntervalChanged(() => scheduleBackup())

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    backupIfChanged().catch((error) => console.error('Automatic backup failed', error))
  }
})
