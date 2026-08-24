import { useCallback, useEffect, useState } from 'react'
import { Flame, Loader2 } from 'lucide-react'
import { getDailyStreak, type DailyStreakState } from '../utils/api'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getWeekdayIndexFromDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return (weekday + 6) % 7
}

function getStreakMessage(streak: number): string {
  if (streak <= 0) return 'Start your streak'
  if (streak === 1) return "You're on a 1-day streak"
  return `You're on a ${streak}-day streak`
}

interface DailyStreakPanelProps {
  refreshKey?: number
}

export function DailyStreakPanel({ refreshKey = 0 }: DailyStreakPanelProps) {
  const [streakState, setStreakState] = useState<DailyStreakState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadStreak = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await getDailyStreak()
      setStreakState(result.streak)
    } catch {
      setHasError(true)
      setStreakState(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStreak()
  }, [loadStreak, refreshKey])

  const todayIndex = streakState?.activityDate
    ? getWeekdayIndexFromDateKey(streakState.activityDate)
    : null

  return (
    <div className="bu-web-rail-card">
      <div className="bu-web-rail-card-header">
        <Flame className="h-4 w-4 text-orange-400" aria-hidden="true" />
        <span>Your Streak</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" aria-label="Loading streak" />
        </div>
      ) : hasError ? (
        <p className="bu-web-rail-muted">Streak unavailable</p>
      ) : (
        <>
          <div className="bu-web-streak-count">
            <span className="bu-web-streak-flame" aria-hidden="true">🔥</span>
            <span className="bu-web-streak-number">{streakState?.currentStreak ?? 0}</span>
            <span className="bu-web-streak-days">days</span>
          </div>
          <p className="bu-web-streak-message">
            {getStreakMessage(streakState?.currentStreak ?? 0)}
          </p>
          <p className="bu-web-rail-muted bu-web-streak-tagline">
            Keep sharing. You&apos;re not alone.
          </p>

          <div className="bu-web-streak-week" aria-label="Weekly activity">
            {WEEKDAY_LABELS.map((label, index) => {
              const isActive = streakState?.weeklyActivity?.[index] ?? false
              const isToday = todayIndex !== null && index === todayIndex
              return (
                <div key={`${label}-${index}`} className="bu-web-streak-day">
                  <div
                    className={`bu-web-streak-dot ${isActive ? 'is-active' : ''} ${isToday ? 'is-today' : ''}`}
                    aria-hidden="true"
                  />
                  <span className={`bu-web-streak-label ${isToday ? 'is-today' : ''}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function useDailyStreakRefresh() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refreshStreak = useCallback(() => {
    setRefreshKey((value) => value + 1)
  }, [])
  return { refreshKey, refreshStreak }
}
