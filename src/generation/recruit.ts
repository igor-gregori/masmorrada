import { createCreature } from '../core/creature'
import type { Creature, CreatureKind, Rarity } from '../core/types'

const KINDS: CreatureKind[] = ['besta', 'espectro', 'arauto']

const RARITY_POOL: Array<{ value: Rarity; weight: number }> = [
  { value: 'comum', weight: 60 },
  { value: 'rara', weight: 30 },
  { value: 'lendaria', weight: 10 },
]

function pickWeighted<T>(pool: Array<{ value: T; weight: number }>): T {
  const total = pool.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of pool) {
    roll -= item.weight
    if (roll < 0) return item.value
  }
  return pool[pool.length - 1].value
}

export function generateRecruitOffer(count = 3): Creature[] {
  const offer: Creature[] = []
  for (let i = 0; i < count; i++) {
    const kind = KINDS[Math.floor(Math.random() * KINDS.length)]
    const rarity = pickWeighted(RARITY_POOL)
    offer.push(createCreature(kind, rarity, 1))
  }
  return offer
}