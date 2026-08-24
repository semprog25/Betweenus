/**
 * Category icon mapping - Lucide icons replace emojis app-wide
 */
import {
  MessageCircle,
  Flame,
  Bomb,
  AlertTriangle,
  HeartCrack,
  Zap,
  MessageSquare,
  Skull,
  Theater,
  Eye,
  DollarSign,
  ShieldAlert,
  Brain,
  Heart,
  Briefcase,
  Home,
  GraduationCap,
  Dumbbell,
  Sparkles,
  Cloud,
  CloudRain,
  Handshake,
  Shuffle,
  LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: MessageCircle,
  General: MessageCircle,
  Controversial: Flame,
  Clickbait: Bomb,
  Exposed: AlertTriangle,
  Heartbreak: HeartCrack,
  Shocking: Zap,
  Confessions: MessageSquare,
  'Dark Secrets': Skull,
  Drama: Theater,
  'Tea & Gossip': Eye,
  'Money Problems': DollarSign,
  'NSFW Stories': ShieldAlert,
  'Unpopular Opinions': AlertTriangle,
  Addictions: HeartCrack,
  'Mental Health': Brain,
  Relationships: Heart,
  Career: Briefcase,
  Family: Home,
  Education: GraduationCap,
  'Self-Care': Dumbbell,
  'Personal Growth': Sparkles,
  Anxiety: Cloud,
  Depression: CloudRain,
  Friendships: Handshake,
  Motivation: Sparkles,
  Random: Shuffle,
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] || MessageCircle;
}
