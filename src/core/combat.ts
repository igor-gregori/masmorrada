import { computeDamage } from './balance'
import { activeSynergyFor, computeMemberStats } from './synergies'
import type { CombatStats, CreatureKind, Squad, SquadMember, Team } from './types'

export const HEAL_THRESHOLD = 0.7

export interface BattleUnit {
  id: string
  name: string
  kind: CreatureKind
  team: Team
  backline: boolean
  col: number
  row: number
  stats: CombatStats
  hp: number
  healPerTurn: number
  alive: boolean
}

export type BattleEvent =
  | { type: 'move'; unitId: string }
  | { type: 'attack'; attackerId: string; targetId: string; damage: number; dodged: boolean }
  | { type: 'death'; unitId: string }
  | { type: 'heal'; unitId: string; targetId: string; amount: number }

export interface BattleState {
  units: BattleUnit[]
  queue: string[]
  turn: number
  winner: Team | null
  over: boolean
}

export function buildBattleUnits(
  squad: Squad,
  team: Team,
  frontCol: number,
  backCol: number,
  rows: number[],
): BattleUnit[] {
  const out: BattleUnit[] = []
  squad.forEach((member, index) => {
    if (!member) return
    out.push(makeBattleUnit(member, team, squad, member.row === 'front' ? frontCol : backCol, rows[index] ?? 0))
  })
  return out
}

export function makeBattleUnit(member: SquadMember, team: Team, squad: Squad, col: number, row: number): BattleUnit {
  const stats = computeMemberStats(member, squad)
  const synergy = activeSynergyFor(member, squad)
  return {
    id: `${team}:${member.creature.id}`,
    name: member.creature.name,
    kind: member.creature.kind,
    team,
    backline: member.row === 'back',
    col,
    row,
    stats,
    hp: stats.hp,
    healPerTurn: synergy?.healPerTurn ?? 0,
    alive: true,
  }
}

export function createBattle(playerUnits: BattleUnit[], enemyUnits: BattleUnit[]): BattleState {
  const units = [...playerUnits, ...enemyUnits]
  const queue = [...units]
    .sort((a, b) => b.stats.spd - a.stats.spd || Math.random() - 0.5)
    .map((u) => u.id)
  return { units, queue, turn: 0, winner: null, over: false }
}

export function stepBattle(state: BattleState): BattleEvent[] {
  if (state.over) return []
  const events: BattleEvent[] = []

  for (let guard = 0; guard < state.queue.length; guard++) {
    const id = state.queue[state.turn % state.queue.length]
    state.turn++
    const unit = state.units.find((u) => u.id === id)!
    if (!unit.alive) continue
    events.push(...actUnit(unit, state.units))
    break
  }

  evaluateOutcome(state)
  return events
}

export function runRound(state: BattleState): BattleEvent[] {
  const events: BattleEvent[] = []
  const roundStart = state.turn
  while (!state.over && state.turn - roundStart < state.queue.length) {
    events.push(...stepBattle(state))
  }
  return events
}

function actUnit(unit: BattleUnit, units: BattleUnit[]): BattleEvent[] {
  const enemies = units.filter((u) => u.alive && u.team !== unit.team)
  if (enemies.length === 0) return []

  if (unit.healPerTurn > 0 && shouldHeal(units, unit)) {
    return healAction(units, unit)
  }

  if (isBacklineLocked(unit, units)) return []

  const target = pickTarget(unit, enemies)
  if (!target) return []

  if (Math.abs(target.col - unit.col) > 1) {
    unit.col += unit.team === 'player' ? 1 : -1
    return [{ type: 'move', unitId: unit.id }]
  }

  return resolveAttack(unit, target)
}

function isBacklineLocked(unit: BattleUnit, units: BattleUnit[]): boolean {
  if (!unit.backline) return false
  return units.some((u) => u.alive && u.team === unit.team && !u.backline)
}

function pickTarget(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  const closestCol = unit.team === 'player'
    ? Math.min(...enemies.map((e) => e.col))
    : Math.max(...enemies.map((e) => e.col))
  const front = enemies.filter((e) => e.col === closestCol).sort((a, b) => a.hp - b.hp)
  return front[0] ?? null
}

function resolveAttack(attacker: BattleUnit, target: BattleUnit): BattleEvent[] {
  if (Math.random() * 100 < target.stats.dodge) {
    return [{ type: 'attack', attackerId: attacker.id, targetId: target.id, damage: 0, dodged: true }]
  }

  const damage = computeDamage(attacker.stats.atk, target.stats.def)
  target.hp -= damage
  const events: BattleEvent[] = [
    { type: 'attack', attackerId: attacker.id, targetId: target.id, damage, dodged: false },
  ]
  if (target.hp <= 0) {
    target.hp = 0
    target.alive = false
    events.push({ type: 'death', unitId: target.id })
  }
  return events
}

function shouldHeal(units: BattleUnit[], unit: BattleUnit): boolean {
  return units.some((u) => u.alive && u.team === unit.team && u.hp < u.stats.hp * HEAL_THRESHOLD)
}

function healAction(units: BattleUnit[], unit: BattleUnit): BattleEvent[] {
  const allies = units
    .filter((u) => u.alive && u.team === unit.team && u.hp < u.stats.hp)
    .sort((a, b) => a.hp - b.hp)
  const target = allies[0]
  if (!target) return []

  const amount = Math.min(unit.healPerTurn, target.stats.hp - target.hp)
  target.hp += amount
  return [{ type: 'heal', unitId: unit.id, targetId: target.id, amount }]
}

function evaluateOutcome(state: BattleState): void {
  if (state.over) return
  const hasPlayer = state.units.some((u) => u.alive && u.team === 'player')
  const hasEnemy = state.units.some((u) => u.alive && u.team === 'enemy')
  if (!hasPlayer) {
    state.over = true
    state.winner = 'enemy'
  } else if (!hasEnemy) {
    state.over = true
    state.winner = 'player'
  }
}