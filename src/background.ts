import { ALARM_NAME, backupIfChanged, scheduleBackup } from './auto-backup'
import { deleteOldClips, onBackupIntervalChanged, onLanguageChanged, readSettings, saveClip } from './storage'
import { t, useLanguage } from './i18n'
import type { Clip, PageClip } from './clip'

// The extension's service worker: handles the automatic backup, even with the tab closed,
// and saving web pages (toolbar icon and right-click menu).

const MENU_ID = 'save-selection'

// When the extension is installed/updated: the backup alarm and the right-click menu item
chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.clear('backup-automatico') // alarm name used by versions before the English rename
  scheduleBackup()
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({ id: MENU_ID, title: 'Save to Draftab', contexts: ['selection'] })
  await updateTexts()
})

// When Chrome starts
chrome.runtime.onStartup.addListener(() => {
  scheduleBackup()
  updateTexts()
  deleteOldClips()
})

// ---------- Automatic backup ----------

// The interval changed in Settings
onBackupIntervalChanged(() => scheduleBackup())

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    backupIfChanged().catch((error) => console.error('Automatic backup failed', error))
  }
})

// ---------- Saving web pages (see "Saving web pages" in SPEC.md) ----------

// The menu item and the icon's tooltip follow the interface language
onLanguageChanged(() => updateTexts())

async function updateTexts() {
  useLanguage((await readSettings()).language, navigator.language)
  chrome.contextMenus.update(MENU_ID, { title: t('saveSelection') })
  chrome.action.setTitle({ title: t('savePage') })
}

// Toolbar icon: the page's main text
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return
  const clip = await capture(tab.id, undefined, async (target) => {
    await chrome.scripting.executeScript({ target, files: ['clip-page.js'] })
    const [{ result }] = await chrome.scripting.executeScript({
      target,
      func: () => (globalThis as { draftabCapturePage?: () => unknown }).draftabCapturePage?.() ?? null,
    })
    return result as PageClip | null
  })
  await openClip(clip)
})

// Right-click menu: only the selection (in the frame where it was made). The title and
// address are the tab's; when the selection's HTML can't be read (text fields, frames from
// other sites, the PDF viewer), the new tab uses the plain text Chrome gives with the click.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || tab?.id === undefined) return
  const captured = await capture(tab.id, info.frameId, async (target) => {
    const [{ result }] = await chrome.scripting.executeScript({ target, func: captureSelection })
    return result as PageClip | null
  })
  await openClip({
    title: tab.title ?? '',
    url: tab.url ?? info.pageUrl ?? '',
    html: 'error' in captured ? '' : captured.html,
    text: info.selectionText ?? '',
  })
})

// Runs the capture; a page extensions can't run on gives "unavailable", no text gives "empty"
async function capture(
  tabId: number,
  frameId: number | undefined,
  run: (target: chrome.scripting.InjectionTarget) => Promise<PageClip | null>,
): Promise<Clip> {
  const target = frameId === undefined ? { tabId } : { tabId, frameIds: [frameId] }
  try {
    return (await run(target)) ?? { error: 'empty' }
  } catch (error) {
    console.warn('Draftab: capture failed', error)
    return { error: 'unavailable' }
  }
}

// Hands the capture to a new Draftab tab, which turns it into a note
async function openClip(clip: Clip) {
  await deleteOldClips()
  const id = await saveClip(clip)
  await chrome.tabs.create({ url: `newtab.html?clip=${id}` })
}

// Injected into the page: the HTML of the selection. Must not use anything from outside
// this function (Chrome copies only its code into the page). Relative links are made
// absolute later, when the new tab converts the HTML.
function captureSelection(): PageClip | null {
  const selection = getSelection()
  if (!selection || selection.isCollapsed) return null
  const box = document.createElement('div')
  for (let i = 0; i < selection.rangeCount; i++) box.append(selection.getRangeAt(i).cloneContents())
  return { title: document.title, url: location.href, html: box.innerHTML }
}
