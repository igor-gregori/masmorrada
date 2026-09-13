import { createCreature } from '../core/creature'
import type { CreatureKind, Rarity, Squad } from '../core/types'

const KINDS: CreatureKind[] = ['besta', 'espectro', 'arauto']

const BATTLE_SCALES: Record<number, number> = { 1: 1.0, 2: 1.04, 3: 1.1 }

function buildTeam(scales: number[], rarities: Rarity[], kinds: CreatureKind[] = KINDS): Squad {
  const team: Squad = Array.from({ length: 4 }, () => null)
  for (let i = 0; i < 4; i++) {
    const creature = createCreature(kinds[i % kinds.length], rarities[i], 1)
    const scale = scales[i]
    if (scale !== 1) creature.statScale = scale
    team[i] = { creature, row: i < 2 ? 'front' : 'back' }
  }
  return team
}

export function generateEnemyTeam(battle: number): Squad {
  const scale = BATTLE_SCALES[battle] ?? 1.24
  return buildTeam([scale, scale, scale, scale], ['comum', 'comum', 'comum', 'comum'])
}

export function generateBossTeam(): Squad {
  return buildTeam([1.3, 1.22, 1.22, 1.22], ['comum', 'comum', 'comum', 'comum'])
}