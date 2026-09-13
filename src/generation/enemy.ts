import { createCreature } from '../core/creature'
import type { CreatureKind, Rarity, Squad } from '../core/types'

const KINDS: CreatureKind[] = ['besta', 'espectro', 'arauto']

const RARITY_POOL: Rarity[] = ['comum']

export function generateEnemyTeam(count = 4): Squad {
  const team: Squad = Array.from({ length: 4 }, () => null)
  for (let i = 0; i < count; i++) {
    const kind = KINDS[i % KINDS.length]
    const rarity = RARITY_POOL[Math.floor(Math.random() * RARITY_POOL.length)]
    team[i] = { creature: createCreature(kind, rarity, 1), row: i < 2 ? 'front' : 'back' }
  }
  return team
}