/**
 * Timezone edge tests for daily streak local calendar dates.
 * Run: npx tsx scripts/daily-streak-timezone-tests.ts
 */

function isValidIanaTimezone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

function getLocalActivityDateKey(timeZone: string, referenceDate: Date): string {
  const safeZone = isValidIanaTimezone(timeZone) ? timeZone : 'UTC'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate)
}

interface CaseResult {
  name: string
  ok: boolean
  detail: string
}

const results: CaseResult[] = []

function assert(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${name} — ${detail}`)
}

function runTimezoneCase(
  label: string,
  timeZone: string,
  isoUtc: string,
  expectedDate: string,
) {
  const actual = getLocalActivityDateKey(timeZone, new Date(isoUtc))
  assert(`${label} ${isoUtc}`, actual === expectedDate, `expected=${expectedDate} actual=${actual}`)
}

function main() {
  assert('validates Europe/Berlin', isValidIanaTimezone('Europe/Berlin'), 'ok')
  assert('rejects bogus timezone', !isValidIanaTimezone('Not/A_Timezone'), 'ok')

  // Europe/Berlin — CET (+1) midnight boundary
  runTimezoneCase('Berlin', 'Europe/Berlin', '2026-03-09T22:59:00.000Z', '2026-03-09')
  runTimezoneCase('Berlin', 'Europe/Berlin', '2026-03-09T23:00:00.000Z', '2026-03-10')
  runTimezoneCase('Berlin late Monday', 'Europe/Berlin', '2026-03-09T22:59:00.000Z', '2026-03-09')
  runTimezoneCase('Berlin early Tuesday', 'Europe/Berlin', '2026-03-09T23:05:00.000Z', '2026-03-10')

  // America/New_York — EST/EDT
  runTimezoneCase('NY', 'America/New_York', '2026-01-15T04:59:00.000Z', '2026-01-14')
  runTimezoneCase('NY', 'America/New_York', '2026-01-15T05:00:00.000Z', '2026-01-15')

  // Asia/Kolkata — UTC+5:30
  runTimezoneCase('Kolkata', 'Asia/Kolkata', '2026-06-01T18:29:00.000Z', '2026-06-01')
  runTimezoneCase('Kolkata', 'Asia/Kolkata', '2026-06-01T18:30:00.000Z', '2026-06-02')

  // UTC
  runTimezoneCase('UTC', 'UTC', '2026-08-24T23:59:00.000Z', '2026-08-24')
  runTimezoneCase('UTC', 'UTC', '2026-08-25T00:00:00.000Z', '2026-08-25')

  const failed = results.filter((result) => !result.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
