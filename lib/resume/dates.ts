import { PRESENT } from "@/lib/resume/types"

// Canonical resume date format is "Mon YYYY" (e.g. "Oct 2022"), producing
// ranges like "Oct 2022 – Present" once start/end are joined by the renderer.

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** Map of recognized month spellings/abbreviations → 1-based month number. */
const MONTH_LOOKUP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function fromMonthYear(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`
}

/**
 * Normalize a free-form date string into the canonical "Mon YYYY" format (or a
 * bare "YYYY" when only a year is present). Preserves the `PRESENT` literal and
 * returns the original input unchanged when it cannot be confidently parsed —
 * we never destroy data the user typed.
 */
export function normalizeDateString(raw: string): string {
  const input = raw.trim()
  if (!input) return ""
  if (input.toLowerCase() === PRESENT.toLowerCase()) return PRESENT

  // "October 2022" / "Oct 2022" / "Oct. 2022"
  const monthName = input.match(/^([A-Za-z]+)\.?\s+(\d{4})$/)
  if (monthName) {
    const m = MONTH_LOOKUP[monthName[1].toLowerCase()]
    if (m) return fromMonthYear(m, Number(monthName[2]))
  }

  // "10/2022" or "10-2022"
  const numMonthYear = input.match(/^(\d{1,2})[/\-.](\d{4})$/)
  if (numMonthYear) {
    const m = Number(numMonthYear[1])
    if (m >= 1 && m <= 12) return fromMonthYear(m, Number(numMonthYear[2]))
  }

  // ISO-ish "2022-10" or "2022/10"
  const isoMonth = input.match(/^(\d{4})[/\-.](\d{1,2})$/)
  if (isoMonth) {
    const m = Number(isoMonth[2])
    if (m >= 1 && m <= 12) return fromMonthYear(m, Number(isoMonth[1]))
  }

  // "MM/DD/YYYY" or "YYYY-MM-DD" — keep month + year only.
  const mdy = input.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (mdy) {
    const m = Number(mdy[1])
    if (m >= 1 && m <= 12) return fromMonthYear(m, Number(mdy[3]))
  }
  const ymd = input.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (ymd) {
    const m = Number(ymd[2])
    if (m >= 1 && m <= 12) return fromMonthYear(m, Number(ymd[1]))
  }

  // Bare year — graduation dates are commonly just "2021".
  const yearOnly = input.match(/^(\d{4})$/)
  if (yearOnly) return yearOnly[1]

  // Unrecognized — leave the user's input intact.
  return input
}
