export type CreatureKind = 'besta' | 'espectro' | 'arauto'
export type Rarity = 'comum' | 'rara' | 'lendaria'
export type Row = 'front' | 'back'
export type Team = 'player' | 'enemy'

export interface Stats {
  hp: number
  atk: number
  def: number
  spd: number
}

export interface CombatStats extends Stats {
  dodge: number
}

export interface Creature {
  id: string
  name: string
  kind: CreatureKind
  rarity: Rarity
  level: number
  statScale?: number
}

export interface SquadMember {
  creature: Creature
  row: Row
}

export type Squad = (SquadMember | null)[]