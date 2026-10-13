import { element } from './dom'
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from './icons'
import { formatDate, monthGrid, monthTitle, sameDay, weekdayInitials, type DateFormat } from './calendar'
import { locale, t } from './i18n'

// The month calendar at the bottom of the sidebar (see "Calendar" in SPEC.md).
// Clicking a day hands the formatted date to newtab.ts, which inserts it in the note.

const calendar = element<HTMLElement>('#calendar')

let year = new Date().getFullYear()
let month = new Date().getMonth() // 0 = January
let dateFormat: DateFormat = 'numeric'
let insert: (text: string) => void = () => {}

// onPick: inserts the date's text in the note
export function setupCalendar(show: boolean, format: DateFormat, onPick: (text: string) => void) {
  insert = onPick
  dateFormat = format
  showCalendar(show)
}

export function showCalendar(show: boolean) {
  calendar.hidden = !show
  if (show) draw()
}

export function setDateFormat(format: DateFormat) {
  dateFormat = format
  draw() // the days' tooltips show the date as it will be inserted
}

function goToMonth(newYear: number, newMonth: number) {
  // new Date(...) turns month -1 or 12 into December or January of the next year
  const first = new Date(newYear, newMonth, 1)
  year = first.getFullYear()
  month = first.getMonth()
  draw()
}

function draw() {
  const today = new Date()

  const previous = button('calendar-nav', ICON_CHEVRON_LEFT, t('previousMonth'), () => goToMonth(year, month - 1))
  const next = button('calendar-nav', ICON_CHEVRON_RIGHT, t('nextMonth'), () => goToMonth(year, month + 1))
  const title = button('calendar-month', '', t('backToToday'), () => goToMonth(today.getFullYear(), today.getMonth()))
  title.textContent = monthTitle(year, month, locale())
  const header = document.createElement('div')
  header.className = 'calendar-header'
  header.append(previous, title, next)

  const grid = document.createElement('div')
  grid.className = 'calendar-grid'
  for (const initial of weekdayInitials(locale())) {
    const weekday = document.createElement('span')
    weekday.className = 'calendar-weekday'
    weekday.textContent = initial
    grid.append(weekday)
  }
  for (const day of monthGrid(year, month).flat()) {
    const text = formatDate(day, dateFormat, locale())
    const dayButton = button('calendar-day', '', t('insertDate', { date: text }), () => insert(text))
    dayButton.textContent = String(day.getDate())
    if (day.getMonth() !== month) dayButton.classList.add('other-month')
    if (sameDay(day, today)) {
      dayButton.classList.add('today')
      dayButton.setAttribute('aria-current', 'date')
    }
    grid.append(dayButton)
  }

  calendar.replaceChildren(header, grid)
}

function button(className: string, icon: string, label: string, action: () => void): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = className
  el.innerHTML = icon // fixed SVG from icons.ts (or empty)
  el.title = label
  el.setAttribute('aria-label', label)
  // mousedown + preventDefault: the editor keeps the focus (and its cursor)
  el.addEventListener('mousedown', (event) => event.preventDefault())
  el.addEventListener('click', action)
  return el
}

// "Today" may have changed while the tab was in the background (e.g. overnight)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !calendar.hidden) draw()
})
