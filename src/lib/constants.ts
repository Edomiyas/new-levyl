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

export function getCategoryColor(category: string): string {
  let hash = 0

  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }

  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length]
}
