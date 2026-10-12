// Minimalist icons: thin 1.5 stroke, 16×16, in the text color (currentColor)

function icon(content: string): string {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`
}

export const ICON_PENCIL = icon('<path d="M10.5 3 13 5.5 6 12.5 3 13l.5-3z" />')

// A pushpin: pin a note to the top of the list
export const ICON_PIN = icon('<path d="M5.5 2.5h5" /><path d="M6.5 2.5v4l-2 2.5h7l-2-2.5v-4" /><path d="M8 9v4.5" />')

export const ICON_TRASH = icon(
  '<path d="M3 4.5h10" /><path d="M6.5 4.5V3h3v1.5" /><path d="M4.5 4.5 5 13h6l.5-8.5" />',
)

export const ICON_COPY = icon(
  '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />',
)

// A chat bubble: copy for WhatsApp
export const ICON_CHAT = icon('<path d="M2.5 8a5.5 5.5 0 1 1 2.6 4.67L2.5 13.5l.83-2.6A5.47 5.47 0 0 1 2.5 8z" />')

export const ICON_MARKDOWN = icon(
  '<path d="M4 1.75h5l3 3v9.5H4z" /><path d="M9 1.75v3h3" /><path d="M8 7v4.5" /><path d="m6.25 9.75 1.75 1.75 1.75-1.75" />',
)

// A letter A with a minus / plus sign: smaller and bigger text
export const ICON_TEXT_SMALLER = icon('<path d="m1.75 13 3.5-9.5L8.75 13" /><path d="M3 10h4.5" /><path d="M10.5 8.5h4" />')
export const ICON_TEXT_BIGGER = icon('<path d="m1.75 13 3.5-9.5L8.75 13" /><path d="M3 10h4.5" /><path d="M10.5 8.5h4" /><path d="M12.5 6.5v4" />')

// "Aa": the note's font
export const ICON_FONT = icon('<path d="m1.25 13 3.5-9.5L8.25 13" /><path d="M2.5 10H7" /><circle cx="11.75" cy="10.75" r="2.25" /><path d="M14 8.5V13" />')

export const ICON_IMPORT = icon('<path d="M8 10.5v-8" /><path d="m4.75 5.75 3.25-3.25 3.25 3.25" /><path d="M3 13.5h10" />')

export const ICON_GEAR = icon(
  '<path d="M12.86 6.81 14.52 6.95 14.52 9.05 12.86 9.19 12.27 10.59 13.35 11.86 11.86 13.35 10.59 12.27 9.19 12.86 9.05 14.52 6.95 14.52 6.81 12.86 5.41 12.27 4.14 13.35 2.65 11.86 3.73 10.59 3.14 9.19 1.48 9.05 1.48 6.95 3.14 6.81 3.73 5.41 2.65 4.14 4.14 2.65 5.41 3.73 6.81 3.14 6.95 1.48 9.05 1.48 9.19 3.14 10.59 3.73 11.86 2.65 13.35 4.14 12.27 5.41Z" /><circle cx="8" cy="8" r="2" />',
)

export const ICON_CLOSE = icon('<path d="M4 4l8 8" /><path d="M12 4l-8 8" />')
