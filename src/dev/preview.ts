import { createCreature } from '../core/creature'
import { computeDamage, KIND_CATEGORY, KIND_LABEL, RARITY_LABEL, RARITY_ORDER } from '../core/balance'
import { activeSynergies, computeMemberStats } from '../core/synergies'
import type { Squad } from '../core/types'

interface Row {
  Criatura: string
  Tipo: string
  Categoria: string
  Raridade: string
  Rar: number
  Nível: number
  Linha: string
  Vida: number
  ATQ: number
  DEF: number
  VEL: number
  Esquiva: string
}

export function runPreview(): void {
  const squad: Squad = [
    { creature: createCreature('besta', 'rara', 2), row: 'front' },
    { creature: createCreature('besta', 'comum', 1), row: 'front' },
    { creature: createCreature('espectro', 'comum', 3), row: 'back' },
    { creature: createCreature('arauto', 'comum', 2), row: 'back' },
  ]

  console.group('%c[Masmorrada] Preview de stats (F2)', 'font-weight:bold;color:#7dff8a')

  const rows: Row[] = []
  for (const member of squad) {
    if (!member) continue
    const { creature, row } = member
    const s = computeMemberStats(member, squad)
    rows.push({
      Criatura: creature.name,
      Tipo: KIND_LABEL[creature.kind],
      Categoria: KIND_CATEGORY[creature.kind],
      Raridade: RARITY_LABEL[creature.rarity],
      Rar: RARITY_ORDER[creature.rarity],
      'Nível': creature.level,
      Linha: row === 'front' ? 'Frente' : 'Trás',
      Vida: s.hp,
      ATQ: s.atk,
      DEF: s.def,
      VEL: s.spd,
      Esquiva: `${s.dodge}%`,
    })
  }
  console.table(rows)

  const synergies = activeSynergies(squad)
  console.info('Sinergias ativas:', synergies.length)
  for (const synergy of synergies) {
    console.info(`  • ${synergy.kindLabel}: ${synergy.description}`)
  }

  const sample = squad[0]!
  const stats = computeMemberStats(sample, squad)
  const enemyDef = 6
  console.info(`Dano exemplo: ${stats.atk} ATQ vs ${enemyDef} DEF => ${computeDamage(stats.atk, enemyDef)}`)
  console.groupEnd()
}