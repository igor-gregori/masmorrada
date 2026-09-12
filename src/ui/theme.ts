import type { CreatureKind, Rarity } from '../core/types'

export const RARITY_COLOR: Record<Rarity, string> = {
  comum: '#8b88a0',
  rara: '#4f8cff',
  lendaria: '#ffb647',
}

export const KIND_COLOR: Record<CreatureKind, string> = {
  besta: '#d4473b',
  espectro: '#9a6bff',
  arauto: '#4fcf8a',
}