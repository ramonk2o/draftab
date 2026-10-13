// Calendar in the sidebar: the month grid and the formats of inserted dates (see "Calendar" in SPEC.md).
// No DOM here, so it can be tested; the sidebar part is in calendar-ui.ts.

export const DATE_FORMATS = ['numeric', 'iso', 'short', 'long'] as const
export type DateFormat = (typeof DATE_FORMATS)[number]

export function isDateFormat(value: unknown): value is DateFormat {
  return DATE_FORMATS.includes(value as DateFormat)
}

const WEEKS = 6 // always 6 rows, so the calendar's height doesn't change from month to month

// The days shown for a month (month: 0 = January), week by week, starting on Sunday.
// The first and last weeks are filled with days of the previous and next months.
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay()) // the Sunday on or before the 1st
  const weeks: Date[][] = []
  for (let w = 0; w < WEEKS; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      // new Date(...) with day overflow handles month and year changes
      week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d))
    }
    weeks.push(week)
  }
  return weeks
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// The date as inserted in the note. locale: the interface's (undefined = the browser's)
export function formatDate(date: Date, format: DateFormat, locale: string | undefined): string {
  if (format === 'iso') {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }
  if (format === 'short') {
    // "13 out 2026" / "13 Oct 2026": Intl only gives the month's name ("out." → "out")
    const month = date.toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')
    return `${date.getDate()} ${month} ${date.getFullYear()}`
  }
  if (format === 'long') {
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// "Outubro de 2026" / "October 2026", for the calendar's header
export function monthTitle(year: number, month: number, locale: string | undefined): string {
  const title = new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// The initials of the days of the week, from Sunday ("D S T Q Q S S" / "S M T W T F S")
export function weekdayInitials(locale: string | undefined): string[] {
  // 2026-10-04 is a Sunday
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 9, 4 + i).toLocaleDateString(locale, { weekday: 'narrow' }).toUpperCase(),
  )
}
