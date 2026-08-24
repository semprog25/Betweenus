import * as kv from "./kv_store.tsx"
import { getSupabaseAdmin } from "./security.tsx"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type DailyStreakActivityType = "post" | "reply" | "upvote" | "reply_upvote"

export interface DailyStreakActivity {
  userId: string
  activityDate: string
  activityType: DailyStreakActivityType
  createdAt: string
  timeZone: string
}

export interface DailyStreakState {
  currentStreak: number
  activityDates: string[]
  weeklyActivity: boolean[]
  todayRegistered: boolean
  activityDate: string
  timeZone: string
}

export function isValidIanaTimezone(timeZone: string | null | undefined): boolean {
  if (!timeZone || typeof timeZone !== "string" || timeZone.length > 64) return false
  try {
    Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

/** Local calendar date (YYYY-MM-DD) for a stored IANA timezone at server time. */
export function getLocalActivityDateKey(
  timeZone: string,
  referenceDate: Date = new Date(),
): string {
  const safeZone = isValidIanaTimezone(timeZone) ? timeZone : "UTC"
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: safeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate)
}

function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number)
  return { year, month, day }
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Calendar-day arithmetic on YYYY-MM-DD keys (timezone-agnostic once localized). */
export function addCalendarDays(dateKey: string, delta: number): string {
  const { year, month, day } = parseDateKey(dateKey)
  const next = new Date(Date.UTC(year, month - 1, day + delta))
  return formatDateKey(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}

export function getWeekdayIndex(dateKey: string): number {
  const { year, month, day } = parseDateKey(dateKey)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return (weekday + 6) % 7
}

export function isAuthenticatedSupabaseUserId(userId: string | null | undefined): boolean {
  if (!userId) return false
  return UUID_PATTERN.test(userId)
}

function activityKey(userId: string, activityDate: string): string {
  return `daily-streak-activity:${userId}:${activityDate}`
}

function activityPrefix(userId: string): string {
  return `daily-streak-activity:${userId}:`
}

export async function resolveUserIanaTimezone(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) return "UTC"
  const stored = data.user.user_metadata?.iana_timezone
  if (typeof stored === "string" && isValidIanaTimezone(stored)) return stored
  return "UTC"
}

export async function getActivityDatesForUser(userId: string): Promise<string[]> {
  const records = await kv.getByPrefix(activityPrefix(userId))
  if (!records?.length) return []
  const dates = records
    .map((record: DailyStreakActivity) => record.activityDate)
    .filter((date: string) => typeof date === "string" && DATE_KEY_PATTERN.test(date))
  return [...new Set(dates)].sort()
}

export function calculateCurrentStreak(
  activityDates: string[],
  todayLocal: string,
): number {
  if (!activityDates.length) return 0
  const dates = new Set(activityDates)
  let checkDate = dates.has(todayLocal) ? todayLocal : addCalendarDays(todayLocal, -1)
  let streak = 0
  while (dates.has(checkDate)) {
    streak += 1
    checkDate = addCalendarDays(checkDate, -1)
  }
  return streak
}

export function buildWeeklyActivity(
  activityDates: string[],
  todayLocal: string,
): boolean[] {
  const dates = new Set(activityDates)
  const dayIndex = getWeekdayIndex(todayLocal)
  const weekStart = addCalendarDays(todayLocal, -dayIndex)
  return Array.from({ length: 7 }, (_, index) => dates.has(addCalendarDays(weekStart, index)))
}

export async function buildDailyStreakState(
  userId: string,
  timeZone?: string,
): Promise<DailyStreakState> {
  const resolvedTimeZone = timeZone || await resolveUserIanaTimezone(userId)
  const activityDates = await getActivityDatesForUser(userId)
  const activityDate = getLocalActivityDateKey(resolvedTimeZone)
  return {
    currentStreak: calculateCurrentStreak(activityDates, activityDate),
    activityDates,
    weeklyActivity: buildWeeklyActivity(activityDates, activityDate),
    todayRegistered: activityDates.includes(activityDate),
    activityDate,
    timeZone: resolvedTimeZone,
  }
}

/**
 * Idempotent daily streak registration using INSERT-on-conflict semantics.
 * One record per authenticated user + local calendar day.
 */
export async function registerDailyStreakActivity(
  userId: string,
  activityType: DailyStreakActivityType,
): Promise<DailyStreakState> {
  if (!isAuthenticatedSupabaseUserId(userId)) {
    return buildDailyStreakState(userId)
  }

  const timeZone = await resolveUserIanaTimezone(userId)
  const activityDate = getLocalActivityDateKey(timeZone)
  const key = activityKey(userId, activityDate)
  const record: DailyStreakActivity = {
    userId,
    activityDate,
    activityType,
    createdAt: new Date().toISOString(),
    timeZone,
  }

  await kv.insertIfAbsent(key, record)

  return buildDailyStreakState(userId, timeZone)
}
