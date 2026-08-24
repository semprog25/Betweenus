import { useEffect, useState } from 'react'
import { Hash, Loader2 } from 'lucide-react'
import { callServer } from '../utils/supabase/client'

interface TrendingTopic {
  name: string
  count: number
}

const FALLBACK_TOPICS = ['Relationships', 'Mental Health', 'Confessions', 'Career', 'Family']

export function TrendingTopicsPanel() {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const result = await callServer('/posts?limit=50&sort=trending', { method: 'GET' })
        const posts = result.posts || []
        const counts = new Map<string, number>()
        for (const post of posts) {
          const categories = post.categories || ['General']
          for (const category of categories) {
            counts.set(category, (counts.get(category) || 0) + 1)
          }
        }
        const ranked = [...counts.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
        setTopics(ranked.length > 0 ? ranked : FALLBACK_TOPICS.map((name) => ({ name, count: 0 })))
      } catch {
        setTopics(FALLBACK_TOPICS.map((name) => ({ name, count: 0 })))
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="bu-web-rail-card">
      <div className="bu-web-rail-card-header">
        <Hash className="h-4 w-4 text-violet-400" aria-hidden="true" />
        <span>Trending Topics</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" aria-label="Loading topics" />
        </div>
      ) : (
        <ul className="bu-web-topics-list">
          {topics.map((topic) => (
            <li key={topic.name} className="bu-web-topic-item">
              <span>{topic.name}</span>
              {topic.count > 0 && <span className="bu-web-topic-count">{topic.count}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
