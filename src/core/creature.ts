import type { Creature, CreatureKind, Rarity } from './types'
import { KIND_LABEL } from './balance'

const NAMES: Record<CreatureKind, string[]> = {
  besta: ['Rugido', 'Presas', 'Juba', 'Garras', 'Peleja', 'RompeOsso'],
  espectro: ['Sombra', 'Eco', 'Bruma', 'Rumor', 'Lamento', 'Frio'],
  arauto: ['Lume', 'Sopro', 'Hino', 'Voz', 'Aurora', 'Clarim'],
}

let seq = 0

export function createCreature(kind: CreatureKind, rarity: Rarity, level = 1, name?: string): Creature {
  seq += 1
  const pool = NAMES[kind]
  return {
    id: `c${seq}`,
    name: name ?? pool[(seq - 1) % pool.length],
    kind,
    rarity,
    level,
  }
}

export function kindLabel(kind: CreatureKind): string {
  return KIND_LABEL[kind]
}