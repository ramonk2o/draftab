// Minimalist icons: thin 1.5 stroke, 16×16, in the text color (currentColor)

function icon(content: string): string {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`
}

export const ICON_PENCIL = icon('<path d="M10.5 3 13 5.5 6 12.5 3 13l.5-3z" />')

export const ICON_TRASH = icon(
  '<path d="M3 4.5h10" /><path d="M6.5 4.5V3h3v1.5" /><path d="M4.5 4.5 5 13h6l.5-8.5" />',
)

export const ICON_MARKDOWN = icon(
  '<path d="M4 1.75h5l3 3v9.5H4z" /><path d="M9 1.75v3h3" /><path d="M8 7v4.5" /><path d="m6.25 9.75 1.75 1.75 1.75-1.75" />',
)

export const ICON_IMPORT = icon('<path d="M8 10.5v-8" /><path d="m4.75 5.75 3.25-3.25 3.25 3.25" /><path d="M3 13.5h10" />')

export const ICON_GEAR = icon(
  '<path d="M12.86 6.81 14.52 6.95 14.52 9.05 12.86 9.19 12.27 10.59 13.35 11.86 11.86 13.35 10.59 12.27 9.19 12.86 9.05 14.52 6.95 14.52 6.81 12.86 5.41 12.27 4.14 13.35 2.65 11.86 3.73 10.59 3.14 9.19 1.48 9.05 1.48 6.95 3.14 6.81 3.73 5.41 2.65 4.14 4.14 2.65 5.41 3.73 6.81 3.14 6.95 1.48 9.05 1.48 9.19 3.14 10.59 3.73 11.86 2.65 13.35 4.14 12.27 5.41Z" /><circle cx="8" cy="8" r="2" />',
)

export const ICON_CLOSE = icon('<path d="M4 4l8 8" /><path d="M12 4l-8 8" />')

export const ICON_MOON = icon('<path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z" />')

export const ICON_SUN = icon(
  '<circle cx="8" cy="8" r="2.75" /><path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />',
)
