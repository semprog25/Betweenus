import { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { getUserStats } from '../utils/api'

interface UserImpactStats {
  secretsShared: number
  repliesGiven: number
  upvotesReceived: number
}

export function ImpactPanel() {
  const [stats, setStats] = useState<UserImpactStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const result = await getUserStats()
        setStats(result.stats)
      } catch {
        setStats(null)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="bu-web-rail-card">
      <div className="bu-web-rail-card-header">
        <BarChart3 className="h-4 w-4 text-fuchsia-400" aria-hidden="true" />
        <span>Your Impact</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" aria-label="Loading impact" />
        </div>
      ) : (
        <dl className="bu-web-impact-grid">
          <div className="bu-web-impact-item">
            <dt>Stories</dt>
            <dd>{stats?.secretsShared ?? 0}</dd>
          </div>
          <div className="bu-web-impact-item">
            <dt>Comments</dt>
            <dd>{stats?.repliesGiven ?? 0}</dd>
          </div>
          <div className="bu-web-impact-item">
            <dt>Upvotes</dt>
            <dd>{stats?.upvotesReceived ?? 0}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
