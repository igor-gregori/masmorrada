import type { CreatureKind, Rarity, Stats } from './types'

export const SQUAD_SIZE = 4

export const RARITY_MULT: Record<Rarity, number> = {
  comum: 1,
  rara: 1.25,
  lendaria: 1.5,
}

export const RARITY_LABEL: Record<Rarity, string> = {
  comum: 'Comum',
  rara: 'Rara',
  lendaria: 'Lendária',
}

export const RARITY_ORDER: Record<Rarity, number> = {
  comum: 1,
  rara: 2,
  lendaria: 3,
}

export const LEVEL_STEP = 0.2

export const KIND_BASE: Record<CreatureKind, Stats> = {
  besta: { hp: 90, atk: 12, def: 10, spd: 6 },
  espectro: { hp: 60, atk: 8, def: 4, spd: 12 },
  arauto: { hp: 70, atk: 6, def: 6, spd: 8 },
}

export const KIND_LABEL: Record<CreatureKind, string> = {
  besta: 'Besta',
  espectro: 'Espectro',
  arauto: 'Arauto',
}

export const KIND_CATEGORY: Record<CreatureKind, string> = {
  besta: 'Tanque',
  espectro: 'Veloz',
  arauto: 'Suporte',
}

export const BASE_DODGE: Record<CreatureKind, number> = {
  besta: 0,
  espectro: 10,
  arauto: 0,
}

export const DODGE_PER_PAIR = 10
export const DODGE_CAP = 50

export function levelScale(level: number): number {
  return 1 + LEVEL_STEP * (level - 1)
}

export function rarityMultiplier(rarity: Rarity): number {
  return RARITY_MULT[rarity]
}

export function scaledStats(kind: CreatureKind, level: number, rarity: Rarity): Stats {
  const base = KIND_BASE[kind]
  const mult = levelScale(level) * rarityMultiplier(rarity)
  return {
    hp: Math.round(base.hp * mult),
    atk: Math.round(base.atk * mult),
    def: Math.round(base.def * mult),
    spd: Math.round(base.spd * mult),
  }
}

export function computeDamage(atk: number, def: number): number {
  return Math.max(1, Math.round((atk * atk) / (atk + def)))
}