import { Readability } from '@mozilla/readability'
import type { PageClip } from './clip'

// Injected into the page when the toolbar icon is clicked (see background.ts).
// It runs in the extension's isolated world: the page can't see or call it.
// Readability changes the document it reads, so it gets a copy.
function capturePage(): PageClip | null {
  const article = new Readability(document.cloneNode(true) as Document).parse()
  if (!article?.content || !article.textContent?.trim()) return null
  return { title: document.title, url: location.href, html: article.content }
}

;(globalThis as { draftabCapturePage?: () => PageClip | null }).draftabCapturePage = capturePage
