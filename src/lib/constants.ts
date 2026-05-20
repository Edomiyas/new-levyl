import type { LifeAreaKey, SeasonKey } from '../types'

export const CATEGORY_PALETTE = [
  '#5DCAA5',
  '#A89EF5',
  '#F5C542',
  '#AADF4F',
  '#5BA8F5',
  '#F0739A',
  '#FF8C42',
  '#64C8E8',
]

export const LIFE_AREAS: Record<
  LifeAreaKey,
  { label: string; color: string; bg: string; emoji: string }
> = {
  physical: {
    label: 'Physical',
    color: '#5DCAA5',
    bg: 'rgba(93,202,165,0.10)',
    emoji: '💪',
  },
  mind: {
    label: 'Mind',
    color: '#A89EF5',
    bg: 'rgba(168,158,245,0.10)',
    emoji: '🧠',
  },
  spiritual: {
    label: 'Spiritual',
    color: '#F5C542',
    bg: 'rgba(245,197,66,0.10)',
    emoji: '✨',
  },
  wealth: {
    label: 'Wealth',
    color: '#AADF4F',
    bg: 'rgba(170,223,79,0.10)',
    emoji: '💰',
  },
  community: {
    label: 'Community',
    color: '#5BA8F5',
    bg: 'rgba(91,168,245,0.10)',
    emoji: '🤝',
  },
  family: {
    label: 'Family',
    color: '#F0739A',
    bg: 'rgba(240,115,154,0.10)',
    emoji: '❤️',
  },
}

export const SEASONS: Record<
  SeasonKey,
  { label: string; color: string; weeks: number; emoji: string; heroEmoji: string; dateRange: string; tagline: string }
> = {
  spring: { label: 'Spring', color: '#AADF4F', weeks: 12, emoji: '🌸', heroEmoji: '🌸', dateRange: 'January – March', tagline: 'New beginnings. Plant the seeds for your best year.' },
  summer: { label: 'Summer', color: '#5DCAA5', weeks: 12, emoji: '☀️', heroEmoji: '🌞', dateRange: 'April – June', tagline: 'Full growth. Push hardest. This is your season.' },
  fall: { label: 'Fall', color: '#F5C542', weeks: 12, emoji: '🍂', heroEmoji: '🍂', dateRange: 'July – September', tagline: 'Harvest what you planted. Stay consistent.' },
  winter: { label: 'Winter', color: '#A89EF5', weeks: 12, emoji: '❄️', heroEmoji: '❄️', dateRange: 'October – December', tagline: 'Reflect, restore, and plan for what\'s next.' },
}

export const SEASON_ORDER: SeasonKey[] = ['spring', 'summer', 'fall', 'winter']

export const SEASON_DATE_RANGES: Record<SeasonKey, { start: string; end: string }> = {
  spring: { start: '2025-01-01', end: '2025-03-31' },
  summer: { start: '2025-04-01', end: '2025-06-30' },
  fall: { start: '2025-07-01', end: '2025-09-30' },
  winter: { start: '2025-10-01', end: '2025-12-31' },
}

export function getNextSeasonKey(current: SeasonKey): SeasonKey {
  const currentIndex = SEASON_ORDER.indexOf(current)
  return SEASON_ORDER[(currentIndex + 1) % SEASON_ORDER.length]
}

export function getCurrentSeasonKey(): SeasonKey {
  const now = new Date()

  for (const [key, range] of Object.entries(SEASON_DATE_RANGES)) {
    const start = new Date(range.start)
    const end = new Date(range.end)

    if (now >= start && now <= end) {
      return key as SeasonKey
    }
  }

  return 'summer'
}

export function getCurrentWeekInSeason(seasonKey: SeasonKey): number {
  const range = SEASON_DATE_RANGES[seasonKey]
  const start = new Date(range.start)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1

  return Math.min(Math.max(diffWeeks, 1), 12)
}

export function getSeasonStatus(seasonKey: SeasonKey): 'done' | 'current' | 'upcoming' {
  const current = getCurrentSeasonKey()
  const currentIdx = SEASON_ORDER.indexOf(current)
  const thisIdx = SEASON_ORDER.indexOf(seasonKey)

  if (thisIdx < currentIdx) {
    return 'done'
  }

  if (thisIdx === currentIdx) {
    return 'current'
  }

  return 'upcoming'
}

export function getCategoryColor(category: string): string {
  let hash = 0

  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }

  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length]
}
