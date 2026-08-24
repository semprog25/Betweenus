import {
  MessageCircle,
  Handshake,
  Star,
  Heart,
  Medal,
  Sprout,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react'

const BADGE_ID_ICONS: Record<string, LucideIcon> = {
  'getting-started': Sprout,
  storyteller: MessageCircle,
  'supportive-friend': Handshake,
  'community-favorite': Star,
  'active-participant': Heart,
  veteran: Medal,
}

const BADGE_EMOJI_ICONS: Record<string, LucideIcon> = {
  '💬': MessageCircle,
  '🤝': Handshake,
  '⭐': Star,
  '💜': Heart,
  '🎉': PartyPopper,
  '🎖️': Medal,
}

export function resolveBadgeIcon(badgeId?: string, serverIcon?: string): LucideIcon {
  if (badgeId && BADGE_ID_ICONS[badgeId]) return BADGE_ID_ICONS[badgeId]
  if (serverIcon && BADGE_EMOJI_ICONS[serverIcon]) return BADGE_EMOJI_ICONS[serverIcon]
  return Medal
}

interface BadgeIconProps {
  badgeId?: string
  serverIcon?: string
  className?: string
}

export function BadgeIcon({ badgeId, serverIcon, className = 'w-8 h-8' }: BadgeIconProps) {
  const Icon = resolveBadgeIcon(badgeId, serverIcon)
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />
}
