import { createCreature } from '../core/creature'
import type { Creature, CreatureKind, Rarity } from '../core/types'

const KINDS: CreatureKind[] = ['besta', 'espectro', 'arauto']

const RARITY_POOL: Rarity[] = ['comum', 'comum', 'rara', 'rara', 'lendaria']

export function generateBench(count = 9): Creature[] {
  const bench: Creature[] = []
  for (let i = 0; i < count; i++) {
    const kind = KINDS[i % KINDS.length]
    const rarity = RARITY_POOL[Math.floor(Math.random() * RARITY_POOL.length)]
    bench.push(createCreature(kind, rarity, 1 + (i % 2)))
  }
  return bench
}