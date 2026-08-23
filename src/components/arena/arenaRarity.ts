import type { ArenaRarity } from '@/redux/store/api/arena/api.arena'

export const ARENA_RARITY_LABEL: Record<ArenaRarity, string> = {
  common: 'Comum',
  rare: 'Rara',
  super_rare: 'Super rara',
  epic: 'Épica',
  insane: 'Insana',
}

export const ARENA_RARITY_COLOR: Record<ArenaRarity, string> = {
  common: '#b0c3d9',
  rare: '#4b69ff',
  super_rare: '#8847ff',
  epic: '#d32ce6',
  insane: '#eb4b4b',
}

export const ARENA_RARITY_DEFAULT_VALUE_BRL: Record<ArenaRarity, number> = {
  common: 1,
  rare: 5,
  super_rare: 10,
  epic: 50,
  insane: 500,
}

export const ARENA_RARITY_DEFAULT_VALUE_USD: Record<ArenaRarity, number> = {
  common: 0.2,
  rare: 1,
  super_rare: 2,
  epic: 10,
  insane: 100,
}

export const ARENA_RARITY_DEFAULT_VALUE_EUR: Record<ArenaRarity, number> = {
  common: 0.2,
  rare: 1,
  super_rare: 2,
  epic: 10,
  insane: 100,
}

export const ARENA_RARITY_OPTIONS = (
  Object.keys(ARENA_RARITY_LABEL) as ArenaRarity[]
).map((value) => ({
  value,
  label: ARENA_RARITY_LABEL[value],
}))
