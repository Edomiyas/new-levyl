import type { LifeAreaKey, SeasonKey } from '../types'

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
  { label: string; color: string; weeks: number }
> = {
  spring: { label: 'Spring', color: '#AADF4F', weeks: 12 },
  summer: { label: 'Summer', color: '#5DCAA5', weeks: 12 },
  fall: { label: 'Fall', color: '#F5C542', weeks: 12 },
  winter: { label: 'Winter', color: '#A89EF5', weeks: 12 },
}

export const SEASON_ORDER: SeasonKey[] = ['spring', 'summer', 'fall', 'winter']
