import type { CombatStats, CreatureKind, Squad, SquadMember } from './types'
import { BASE_DODGE, DODGE_CAP, DODGE_PER_PAIR, scaledStats } from './balance'

export interface Synergy {
  kind: CreatureKind
  kindLabel: string
  description: string
  threshold: number
  bonus: Partial<CombatStats & { dodge: never }>
  dodgePerPair?: number
  healPerTurn?: number
}

const HP = 'hp'
const ATK = 'atk'
const DEF = 'def'
const SPD = 'spd'

export const SYNERGIES: Record<CreatureKind, Synergy> = {
  besta: {
    kind: 'besta',
    kindLabel: 'Besta',
    description: '+20% ATQ e +20% DEF',
    threshold: 2,
    bonus: { [ATK]: 0.2, [DEF]: 0.2 },
  },
  espectro: {
    kind: 'espectro',
    kindLabel: 'Espectro',
    description: '+20% VEL e +10% esquiva',
    threshold: 2,
    bonus: { [SPD]: 0.2 },
    dodgePerPair: DODGE_PER_PAIR,
  },
  arauto: {
    kind: 'arauto',
    kindLabel: 'Arauto',
    description: '+15% Vida e cura 5/turno',
    threshold: 2,
    bonus: { [HP]: 0.15 },
    healPerTurn: 5,
  },
}

export function countKinds(squad: Squad): Record<CreatureKind, number> {
  const counts: Record<CreatureKind, number> = { besta: 0, espectro: 0, arauto: 0 }
  for (const member of squad) {
    if (member) counts[member.creature.kind]++
  }
  return counts
}

export function activeSynergies(squad: Squad): Synergy[] {
  const counts = countKinds(squad)
  return (Object.values(SYNERGIES) as Synergy[]).filter((s) => (counts[s.kind] ?? 0) >= s.threshold)
}

export function activeSynergyFor(member: SquadMember, squad: Squad): Synergy | null {
  const synergy = SYNERGIES[member.creature.kind]
  return (countKinds(squad)[member.creature.kind] ?? 0) >= synergy.threshold ? synergy : null
}

export function computeMemberStats(member: SquadMember, squad: Squad): CombatStats {
  const { kind, level, rarity } = member.creature
  const stats = scaledStats(kind, level, rarity)
  let dodge = BASE_DODGE[kind]

  const synergy = activeSynergyFor(member, squad)
  if (synergy) {
    for (const key of [HP, ATK, DEF, SPD] as const) {
      const bonus = synergy.bonus[key]
      if (bonus) stats[key] = Math.round(stats[key] * (1 + bonus))
    }
    if (synergy.dodgePerPair) dodge += synergy.dodgePerPair
  }

  return { ...stats, dodge: Math.min(DODGE_CAP, dodge) }
}