import {
  Smile,
  CloudRain,
  Flame,
  Zap,
  Leaf,
  Sparkles,
  Moon,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'

export interface MoodVisual {
  name: string
  Icon: LucideIcon
  emoji: string
  color: string
  bg: string
  border: string
  subMoods: string[]
}

export const MAIN_MOODS: MoodVisual[] = [
  {
    name: 'Happy',
    Icon: Smile,
    emoji: '😊',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    subMoods: ['Joyful', 'Excited', 'Content', 'Playful', 'Proud', 'Grateful', 'Hopeful', 'Peaceful'],
  },
  {
    name: 'Sad',
    Icon: CloudRain,
    emoji: '😢',
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-300 dark:border-blue-700',
    subMoods: ['Lonely', 'Disappointed', 'Heartbroken', 'Grieving', 'Regretful', 'Melancholic', 'Homesick', 'Lost'],
  },
  {
    name: 'Angry',
    Icon: Flame,
    emoji: '😠',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-700',
    subMoods: ['Frustrated', 'Annoyed', 'Resentful', 'Bitter', 'Furious', 'Irritated', 'Jealous', 'Vengeful'],
  },
  {
    name: 'Anxious',
    Icon: Zap,
    emoji: '😰',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-300 dark:border-orange-700',
    subMoods: ['Worried', 'Nervous', 'Insecure', 'Overwhelmed', 'Stressed', 'Panicked', 'Fearful', 'Tense'],
  },
  {
    name: 'Peaceful',
    Icon: Leaf,
    emoji: '😌',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    subMoods: ['Calm', 'Relaxed', 'Satisfied', 'Serene', 'Grounded', 'Accepting', 'Relieved', 'Secure'],
  },
  {
    name: 'Excited',
    Icon: Sparkles,
    emoji: '🤩',
    color: 'from-pink-500 to-fuchsia-500',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-300 dark:border-pink-700',
    subMoods: ['Enthusiastic', 'Energetic', 'Motivated', 'Inspired', 'Passionate', 'Eager', 'Thrilled', 'Amazed'],
  },
  {
    name: 'Tired',
    Icon: Moon,
    emoji: '😴',
    color: 'from-slate-500 to-gray-500',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-300 dark:border-slate-700',
    subMoods: ['Exhausted', 'Drained', 'Sleepy', 'Weary', 'Fatigued', 'Sluggish', 'Burnout', 'Depleted'],
  },
  {
    name: 'Confused',
    Icon: HelpCircle,
    emoji: '😕',
    color: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    subMoods: ['Uncertain', 'Puzzled', 'Doubtful', 'Indecisive', 'Bewildered', 'Conflicted', 'Questioning', 'Mixed'],
  },
]

interface MoodIconBadgeProps {
  mood: MoodVisual
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: { wrap: 'w-10 h-10', icon: 'w-5 h-5' },
  md: { wrap: 'w-14 h-14', icon: 'w-7 h-7' },
  lg: { wrap: 'w-16 h-16', icon: 'w-8 h-8' },
}

export function getMoodByEmoji(emoji: string): MoodVisual | undefined {
  return MAIN_MOODS.find((m) => m.emoji === emoji)
}

export function MoodIconBadge({ mood, size = 'md', className = '' }: MoodIconBadgeProps) {
  const sizes = sizeClasses[size]
  const Icon = mood.Icon

  return (
    <div
      className={`${sizes.wrap} rounded-2xl bg-gradient-to-br ${mood.color} flex items-center justify-center shadow-sm ${className}`}
      aria-hidden="true"
    >
      <Icon className={`${sizes.icon} text-white`} strokeWidth={2} />
    </div>
  )
}
