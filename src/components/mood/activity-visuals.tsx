import {
  Dumbbell,
  Users,
  UserRound,
  Heart,
  Umbrella,
  Tv,
  Gamepad2,
  BookOpen,
  BedDouble,
  Salad,
  Sparkles,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  ChefHat,
  Music,
  type LucideIcon,
} from 'lucide-react'

export interface ActivityVisual {
  name: string
  Icon: LucideIcon
}

export const ACTIVITIES: ActivityVisual[] = [
  { name: 'Exercise', Icon: Dumbbell },
  { name: 'Family', Icon: Users },
  { name: 'Friends', Icon: UserRound },
  { name: 'Date', Icon: Heart },
  { name: 'Relax', Icon: Umbrella },
  { name: 'Movies', Icon: Tv },
  { name: 'Gaming', Icon: Gamepad2 },
  { name: 'Reading', Icon: BookOpen },
  { name: 'Sleep Early', Icon: BedDouble },
  { name: 'Eat Healthy', Icon: Salad },
  { name: 'Cleaning', Icon: Sparkles },
  { name: 'Shopping', Icon: ShoppingBag },
  { name: 'Work', Icon: Briefcase },
  { name: 'Study', Icon: GraduationCap },
  { name: 'Cook', Icon: ChefHat },
  { name: 'Music', Icon: Music },
]

export function getActivityKey(name: string): string {
  return name.replace(/\s+/g, '').replace(/^(.)/, (c) => c.toLowerCase())
}
