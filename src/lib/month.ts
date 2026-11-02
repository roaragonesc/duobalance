// A calendar month as "YYYY-MM", the same key the URL and the API use.
export type MonthKey = string

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

const monthNames = new Intl.DateTimeFormat('es-ES', { month: 'long' })
const shortDates = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
})

function toKey(year: number, monthIndex: number): MonthKey {
  const date = new Date(year, monthIndex, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function toParts(month: MonthKey): [number, number] {
  const [year, monthNumber] = month.split('-').map(Number)
  return [year, monthNumber - 1]
}

export function currentMonth(now = new Date()): MonthKey {
  return toKey(now.getFullYear(), now.getMonth())
}

// Invalid or future months fall back to the current one.
export function parseMonth(value: string | null, now = new Date()): MonthKey {
  const current = currentMonth(now)
  if (!value || !MONTH_PATTERN.test(value) || value > current) return current
  return value
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [year, monthIndex] = toParts(month)
  return toKey(year, monthIndex + delta)
}

export function getMonthName(month: MonthKey): string {
  const [year, monthIndex] = toParts(month)
  return monthNames.format(new Date(year, monthIndex, 1))
}

export function formatMonth(month: MonthKey): string {
  const name = getMonthName(month)
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.slice(0, 4)}`
}

// "YYYY-MM-DD" in local time: "Hoy", "Ayer" or "28 nov".
export function formatDay(date: string, now = new Date()): string {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - value.getTime()) / 86_400_000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return shortDates.format(value).replace('.', '')
}

// Today's local date as "YYYY-MM-DD", the value of <input type="date">.
export function todayIso(now = new Date()): string {
  const day = String(now.getDate()).padStart(2, '0')
  return `${currentMonth(now)}-${day}`
}

const shortDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })

// "2026-11-05" -> "05 nov"
export function formatShortDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return shortDate.format(new Date(year, month - 1, day)).replace('.', '')
}