import type { JSONContent } from '@tiptap/core'
import { withoutFirstLine } from './notes'

// "Copy for WhatsApp": the note as plain text in WhatsApp's formatting
// (*bold*, _italic_, ~strikethrough~, `code`), without its first line (the title)

export function noteToWhatsApp(doc: JSONContent): string {
  const blocks = withoutFirstLine(doc).content ?? []
  // One blank line between blocks; empty blocks (empty paragraphs) are skipped,
  // so there's never more than one blank line in a row
  return blocks
    .map((block) => blockLines(block, 0).join('\n'))
    .filter((text) => text.trim() !== '')
    .join('\n\n')
}

// The lines of one block; depth is the list level (for the indentation)
function blockLines(node: JSONContent, depth: number): string[] {
  switch (node.type) {
    case 'heading':
      return [wrap(plainText(node), '*')]
    case 'bulletList':
      return listLines(node, depth, () => '- ')
    case 'orderedList': {
      const start = node.attrs?.start ?? 1
      return listLines(node, depth, (_item, i) => `${start + i}. `)
    }
    case 'taskList':
      return listLines(node, depth, (item) => (item.attrs?.checked ? '☑ ' : '☐ '))
    case 'blockquote':
      return (node.content ?? []).flatMap((child) => blockLines(child, 0)).map((line) => (line ? `> ${line}` : '>'))
    case 'codeBlock':
      return ['```', ...plainText(node).split('\n'), '```']
    case 'horizontalRule':
      return ['———']
    default:
      // Paragraph (a line break inside it splits it into lines)
      return inlineText(node.content ?? []).split('\n')
  }
}

const LIST_TYPES = ['bulletList', 'orderedList', 'taskList']

// Each item gets the marker on its first line; nested lists go one level deeper
function listLines(
  list: JSONContent,
  depth: number,
  marker: (item: JSONContent, index: number) => string,
): string[] {
  const indent = '  '.repeat(depth)
  return (list.content ?? []).flatMap((item, i) => {
    const itemMarker = marker(item, i)
    let first = true
    return (item.content ?? []).flatMap((child) => {
      if (LIST_TYPES.includes(child.type ?? '')) return blockLines(child, depth + 1)
      return blockLines(child, depth).map((line) => {
        // The item's other lines line up with the text after the marker
        const prefix = first ? itemMarker : ' '.repeat(itemMarker.length)
        first = false
        return indent + prefix + line
      })
    })
  })
}

// The text of a block without any formatting
function plainText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  return (node.content ?? []).map(plainText).join('')
}

// Marks from the outside in; underline has no equivalent in WhatsApp
const MARK_SYMBOLS: [string, string][] = [
  ['bold', '*'],
  ['italic', '_'],
  ['strike', '~'],
  ['code', '`'],
]

// The text of a paragraph with its marks. Pieces next to each other with the same mark
// share one pair of symbols ("*a _b_*", not "*a**_b_*", which WhatsApp doesn't format).
function inlineText(nodes: JSONContent[]): string {
  // Links first: "text (url)", or only the url when the text is the url itself
  return runs(nodes, (node) => linkOf(node))
    .map(({ key: href, nodes: run }) => {
      const text = formatted(run, 0)
      if (!href) return text
      const plain = run.map(plainText).join('')
      return plain === href ? href : `${text} (${href})`
    })
    .join('')
}

// Applies MARK_SYMBOLS[index] and the ones after it
function formatted(nodes: JSONContent[], index: number): string {
  if (index === MARK_SYMBOLS.length) return nodes.map(plainText).join('')
  const [markType, symbol] = MARK_SYMBOLS[index]
  return runs(nodes, (node) => hasMark(node, markType))
    .map(({ key: marked, nodes: run }) => {
      const text = formatted(run, index + 1)
      return marked ? wrap(text, symbol) : text
    })
    .join('')
}

// Splits the pieces into consecutive groups with the same key
function runs<K>(nodes: JSONContent[], keyOf: (node: JSONContent) => K): { key: K; nodes: JSONContent[] }[] {
  const groups: { key: K; nodes: JSONContent[] }[] = []
  for (const node of nodes) {
    const key = keyOf(node)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.nodes.push(node)
    else groups.push({ key, nodes: [node] })
  }
  return groups
}

function hasMark(node: JSONContent, type: string): boolean {
  return node.marks?.some((mark) => mark.type === type) ?? false
}

function linkOf(node: JSONContent): string | null {
  return node.marks?.find((mark) => mark.type === 'link')?.attrs?.href ?? null
}

// Puts the symbol around the text, leaving spaces at the edges outside:
// WhatsApp ignores "*bold *"
function wrap(text: string, symbol: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)
  if (!match || match[2] === '') return text
  const [, before, inner, after] = match
  return before + symbol + inner + symbol + after
}
