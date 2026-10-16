// Generates the store screenshots (docs/store/<language>/screenshot-*.png) and the README
// images (docs/screenshots/) from the real extension in dist/, with example notes.
// Run `npm run build` first, then: node scripts/screenshots.mjs
//
// Uses the Chrome installed on the computer (or the one in CHROME, version 137 or later).
// Talks to Chrome through the DevTools protocol, without dependencies. The photo in the
// travel note is loaded from picsum.photos (Unsplash photos, free to use), so it needs internet.

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const WIDTH = 1280
const HEIGHT = 800

// ---------- Example notes ----------

const text = (value, ...marks) => ({ type: 'text', text: value, ...(marks.length ? { marks } : {}) })
const bold = { type: 'bold' }
const hl = (color) => ({ type: 'highlight', attrs: { color } })
const p = (...content) => ({ type: 'paragraph', ...(content.length ? { content } : {}) })
const h = (level, ...content) => ({ type: 'heading', attrs: { level }, content })
const quote = (...content) => ({ type: 'blockquote', content: [p(...content)] })
const bullets = (...items) => ({ type: 'bulletList', content: items.map((item) => ({ type: 'listItem', content: [p(...item)] })) })
const tasks = (...items) => ({
  type: 'taskList',
  content: items.map(([checked, ...content]) => ({ type: 'taskItem', attrs: { checked }, content: [p(...content)] })),
})
const image = (src, alt) => ({ type: 'image', attrs: { src, alt } })
const PHOTO = 'https://picsum.photos/id/1043/1200/560'

// Everything shown in each language: note titles, contents and the phrase selected to show the highlight bar
const CONTENT = {
  en: {
    language: 'en',
    weekly: [
      h(1, text('Weekly plan')),
      p(text('Quick notes right in the new tab, with '), text('markdown', bold), text(' as you type. '), text('#work')),
      h(2, text('Priorities')),
      tasks(
        [false, text('Review the proposal', hl('yellow')), text(' #client')],
        [true, text('Send the estimate')],
        [false, text('Schedule the meeting')],
      ),
      quote(text('Drag any block by its handle to reorder.')),
      bullets([text('Loose ideas '), text('#ideas')], [text('New brand blue #3a7bd5, accent #10b981')]),
      h(2, text('Trip budget')),
      p(text('Hotel: 3*120+45=405')),
      p(text('Dinner for 4: 187.50/4=46.875')),
      p(text('Kickoff: '), text('10/20/2026', hl('green'))),
    ],
    meeting: [
      h(1, text('Meeting notes')),
      p(text('Kickoff with the client, '), text('Tuesday at 10am', bold), text('. #work')),
      h(2, text('Decisions')),
      bullets(
        [text('Launch moves to '), text('November 3', hl('green'))],
        [text('Budget approved, '), text('pending the final contract', hl('orange'))],
        [text('New logo in the brand blue')],
      ),
      h(2, text('Risks')),
      p(text('The supplier may not deliver on time', hl('red')), text(': ask for a weekly update.')),
      h(2, text('Next steps')),
      tasks([false, text('Send the summary to the team')], [false, text('Book the review for next week')]),
    ],
    select: 'Book the review for next week',
    trip: [
      h(1, text('Weekend in Yosemite')),
      image(PHOTO, 'Yosemite valley'),
      p(text('Leave '), text('Friday at 7am', hl('yellow')), text(' to beat the traffic. #travel')),
      h(2, text('Pack')),
      tasks([true, text('Hiking boots')], [false, text('Rain jacket')], [false, text('Camera and charger')]),
      quote(text('Tunnel View at sunset, then dinner in the valley.')),
    ],
    others: [
      ['Shopping list', [h(1, text('Shopping list')), p(text('Coffee, oats, lemons #home'))], true],
      ['Books to read', [h(1, text('Books to read')), p(text('#reading'))]],
      ['Bread recipe', [h(1, text('Bread recipe')), p(text('500g flour, 350ml water #home'))]],
    ],
  },
  'pt-BR': {
    language: 'pt',
    weekly: [
      h(1, text('Plano da semana')),
      p(text('Notas rápidas direto na nova aba, com '), text('markdown', bold), text(' enquanto você digita. '), text('#trabalho')),
      h(2, text('Prioridades')),
      tasks(
        [false, text('Revisar a proposta', hl('yellow')), text(' #cliente')],
        [true, text('Enviar o orçamento')],
        [false, text('Marcar a reunião')],
      ),
      quote(text('Arraste qualquer bloco pela alça para reordenar.')),
      bullets([text('Ideias soltas '), text('#ideias')], [text('Novo azul da marca #3a7bd5, destaque #10b981')]),
      h(2, text('Orçamento da viagem')),
      p(text('Hotel: 3*120+45=405')),
      p(text('Jantar para 4: 187,50/4=46,875')),
      p(text('Início: '), text('20/10/2026', hl('green'))),
    ],
    meeting: [
      h(1, text('Notas da reunião')),
      p(text('Kickoff com o cliente, '), text('terça às 10h', bold), text('. #trabalho')),
      h(2, text('Decisões')),
      bullets(
        [text('O lançamento passa para '), text('3 de novembro', hl('green'))],
        [text('Orçamento aprovado, '), text('falta o contrato final', hl('orange'))],
        [text('Novo logo no azul da marca')],
      ),
      h(2, text('Riscos')),
      p(text('O fornecedor pode atrasar a entrega', hl('red')), text(': pedir atualização semanal.')),
      h(2, text('Próximos passos')),
      tasks([false, text('Enviar o resumo para a equipe')], [false, text('Marcar a revisão da semana que vem')]),
    ],
    select: 'Marcar a revisão da semana que vem',
    trip: [
      h(1, text('Fim de semana em Yosemite')),
      image(PHOTO, 'Vale de Yosemite'),
      p(text('Sair '), text('sexta às 7h', hl('yellow')), text(' para fugir do trânsito. #viagem')),
      h(2, text('Levar')),
      tasks([true, text('Botas de trilha')], [false, text('Capa de chuva')], [false, text('Câmera e carregador')]),
      quote(text('Tunnel View no pôr do sol, depois jantar no vale.')),
    ],
    others: [
      ['Lista de compras', [h(1, text('Lista de compras')), p(text('Café, aveia, limões #casa'))], true],
      ['Livros para ler', [h(1, text('Livros para ler')), p(text('#leitura'))]],
      ['Receita de pão', [h(1, text('Receita de pão')), p(text('500g de farinha, 350ml de água #casa'))]],
    ],
  },
}

// The storage contents for one language and theme: notes edited this morning, most recent first
function storageFor(content, theme, font) {
  const today = new Date()
  const at = (hours, minutes) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes).getTime()
  const note = (id, doc, time, extra = {}) => ({
    id,
    doc: { type: 'doc', content: doc },
    title: doc[0].content[0].text,
    titleManual: false,
    textSize: 100,
    font,
    createdAt: time,
    updatedAt: time,
    ...extra,
  })
  const notes = [
    note('weekly', content.weekly, at(9, 30), { pinned: true }),
    note('meeting', content.meeting, at(9, 11)),
    note('trip', content.trip, at(8, 48)),
    ...content.others.map(([, doc, pinned], i) => note(`other-${i}`, doc, at(8, 25 - i * 20), pinned ? { pinned } : {})),
  ]
  const data = Object.fromEntries(notes.map((n) => [`note:${n.id}`, n]))
  data.settings = { theme, language: content.language, newNoteFont: font, noteFont: font, showCalendar: true }
  data.meta = { lastChangeAt: at(9, 30), lastBackupAt: 0, lastImportAt: 0 }
  return data
}

// ---------- Chrome and the DevTools protocol ----------

// Chrome installed on the computer, or the one in CHROME
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ]
  const found = paths.find((path) => existsSync(path))
  if (!found) throw new Error('Chrome not found: set CHROME to its executable')
  return found
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

// Starts Chrome and talks to it through a pipe (file descriptors 3 and 4), the only way
// Chrome accepts loading an unpacked extension from the DevTools protocol
async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'draftab-shots-'))
  const chrome = spawn(
    findChrome(),
    [
      '--headless=new',
      `--user-data-dir=${profile}`,
      '--remote-debugging-pipe',
      '--enable-unsafe-extension-debugging',
      '--no-first-run',
      // Keep drawing frames and running timers even though no window is visible
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--hide-scrollbars',
      `--window-size=${WIDTH},${HEIGHT}`,
    ],
    { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] },
  )
  const [, , , toChrome, fromChrome] = chrome.stdio

  let nextId = 0
  const waiting = new Map()
  // Messages are JSON separated by a null character
  let buffer = ''
  fromChrome.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
    let end
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end))
      buffer = buffer.slice(end + 1)
      const reply = waiting.get(message.id)
      if (!reply) continue
      waiting.delete(message.id)
      if (message.error) reply.fail(new Error(message.error.message))
      else reply.done(message.result)
    }
  })
  const send = (method, params = {}, sessionId) =>
    new Promise((done, fail) => {
      const id = ++nextId
      const timer = setTimeout(() => fail(new Error(`Chrome did not answer ${method}`)), 15000)
      waiting.set(id, {
        done: (result) => (clearTimeout(timer), done(result)),
        fail: (error) => (clearTimeout(timer), fail(error)),
      })
      toChrome.write(JSON.stringify({ id, method, params, sessionId }) + '\0')
    })

  const close = () => {
    chrome.kill()
    // Chrome may still hold files in the profile for a moment
    setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500)
  }
  return { send, close }
}

// Loads dist/ as an unpacked extension and returns its id
async function loadExtension(send) {
  const { id } = await send('Extensions.loadUnpacked', { path: join(ROOT, 'dist') })
  return id
}

// A tab with Draftab, plus helpers to drive it
async function openDraftab(send, id) {
  const { targetId } = await send('Target.createTarget', { url: `chrome-extension://${id}/newtab.html` })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const page = (method, params) => send(method, params, sessionId)
  await page('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false })
  // A headless tab isn't focused, and the editor only selects text (and shows the highlight bar) when it is
  await page('Page.bringToFront')
  await page('Emulation.setFocusEmulationEnabled', { enabled: true })
  await sleep(1000)

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
    return result.value
  }
  const mouse = (type, x, y, extra = {}) => page('Input.dispatchMouseEvent', { type, x, y, button: 'left', ...extra })

  return {
    evaluate,
    // Replaces everything in storage and reopens the page on a note
    async load(data, noteId) {
      await evaluate(`(async () => {
        await chrome.storage.local.clear()
        await chrome.storage.local.set(${JSON.stringify(data)})
        sessionStorage.setItem('openNoteId', ${JSON.stringify(noteId)})
      })()`)
      await page('Page.reload')
      await sleep(2500) // the page, the note and the photo
      // The mouse away from the note, so no handle shows
      await mouse('mouseMoved', 150, 450, { button: 'none' })
      // Opening a note puts the cursor in it on the next frame (Tiptap's focus), which would
      // undo a selection made before it: wait for two frames (at most a second)
      await evaluate(`new Promise((done) => {
        requestAnimationFrame(() => requestAnimationFrame(done))
        setTimeout(done, 1000)
      })`)
      await sleep(200)
    },
    // Screen position of a phrase in the note (it must be inside one piece of text)
    async phrase(value) {
      return evaluate(`(() => {
        const walker = document.createTreeWalker(document.querySelector('#editor .ProseMirror'), NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
          const node = walker.currentNode
          const at = node.data.indexOf(${JSON.stringify(value)})
          if (at < 0) continue
          const range = document.createRange()
          range.setStart(node, at)
          range.setEnd(node, at + ${value.length})
          const box = range.getBoundingClientRect()
          return { left: box.left, right: box.right, y: box.top + box.height / 2 }
        }
        throw new Error('phrase not found: ' + ${JSON.stringify(value)})
      })()`)
    },
    hover: (x, y) => mouse('mouseMoved', x, y, { button: 'none' }),
    // Selects a phrase in the note (inside one piece of text), as if done with the mouse
    async select(value) {
      const selected = await evaluate(`(() => {
        // Tiptap keeps the editor on its element
        const { editor } = document.querySelector('#editor .ProseMirror')
        let from = -1
        editor.state.doc.descendants((node, pos) => {
          const at = from < 0 && node.isText ? node.text.indexOf(${JSON.stringify(value)}) : -1
          if (at >= 0) from = pos + at
        })
        if (from < 0) throw new Error('phrase not found: ' + ${JSON.stringify(value)})
        editor.chain().focus().setTextSelection({ from, to: from + ${value.length} }).run()
        return editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
      })()`)
      if (selected !== value) throw new Error(`selected ${JSON.stringify(selected)} instead of ${JSON.stringify(value)}`)
      await sleep(400)
    },
    type: (value) => page('Input.insertText', { text: value }),
    async shot(file) {
      const { data } = await page('Page.captureScreenshot', { format: 'png' })
      writeFileSync(file, Buffer.from(data, 'base64'))
      console.log('wrote', file.replace(ROOT + '/', ''))
    },
  }
}

// ---------- The screenshots ----------

async function main() {
  const { send, close } = await launch()
  try {
    const tab = await openDraftab(send, await loadExtension(send))

    for (const [folder, content] of Object.entries(CONTENT)) {
      const out = (n) => join(ROOT, 'docs/store', folder, `screenshot-${n}.png`)

      // 1. The note, with the handle showing next to the quote
      await tab.load(storageFor(content, 'light', 'sans'), 'weekly')
      const quoteLine = await tab.phrase(content.weekly[4].content[0].content[0].text)
      await tab.hover(quoteLine.left + 20, quoteLine.y)
      await sleep(300)
      await tab.shot(out(1))

      // 2. Highlighting: text selected, with the bar of colors above it
      await tab.load(storageFor(content, 'light', 'sans'), 'meeting')
      await tab.select(content.select)
      await tab.shot(out(2))

      // 3. Tag suggestions in the search
      await tab.load(storageFor(content, 'light', 'sans'), 'weekly')
      await tab.evaluate(`document.querySelector('#search').focus()`)
      await tab.type('#')
      await sleep(400)
      await tab.shot(out(3))

      // 4. Dark theme, serif font, a note with a photo
      await tab.load(storageFor(content, 'dark', 'serif'), 'trip')
      await tab.shot(out(4))

      // 5. Settings, at Appearance
      await tab.load(storageFor(content, 'light', 'sans'), 'weekly')
      await tab.evaluate(`document.querySelector('#open-settings').click()`)
      await sleep(400)
      await tab.evaluate(`document.querySelector('#language').closest('section, fieldset, div').scrollIntoView({ block: 'start' })`)
      await sleep(300)
      await tab.shot(out(5))
    }

    // The README shows the English light and dark screenshots
    copyFileSync(join(ROOT, 'docs/store/en/screenshot-1.png'), join(ROOT, 'docs/screenshots/light.png'))
    copyFileSync(join(ROOT, 'docs/store/en/screenshot-4.png'), join(ROOT, 'docs/screenshots/dark.png'))
    console.log('copied the README images to docs/screenshots/')
  } finally {
    close()
  }
}

// Never hang: Chrome not answering stops everything
const watchdog = setTimeout(() => {
  console.error('Timed out')
  process.exit(1)
}, 5 * 60 * 1000)
await main()
clearTimeout(watchdog)
