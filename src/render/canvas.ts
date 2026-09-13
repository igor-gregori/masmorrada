import type { CreatureKind, Team } from '../core/types'
import { KIND_COLOR } from '../ui/theme'

export const GRID = 8
export const CELL = 100
export const CANVAS_SIZE = GRID * CELL
export const FLOATER_MS = 750

export interface BattleUnitView {
  id: string
  team: Team
  kind: CreatureKind
  hp: number
  maxHp: number
  col: number
  row: number
  active: boolean
}

export interface Floater {
  id: string
  col: number
  row: number
  text: string
  color: string
  born: number
}

export interface BattleView {
  units: BattleUnitView[]
  floaters: Floater[]
  now: number
}

const TEAM_EDGE: Record<Team, string> = {
  player: '#0fb5ff',
  enemy: '#ff4f47',
}

const TEAM_ZONE: Record<Team, string> = {
  player: 'rgba(94, 130, 255, 0.08)',
  enemy: 'rgba(255, 94, 94, 0.08)',
}

export function renderBattle(ctx: CanvasRenderingContext2D, view: BattleView): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  drawFloor(ctx)
  drawTeamZones(ctx)
  drawGrid(ctx)
  for (const unit of view.units) drawUnit(ctx, unit, view.now)
  for (const floater of view.floaters) drawFloater(ctx, floater, view.now)
}

function drawFloor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0f0e17'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
}

function drawTeamZones(ctx: CanvasRenderingContext2D): void {
  for (const team of ['player', 'enemy'] as Team[]) {
    const start = team === 'player' ? 0 : GRID - 2
    ctx.fillStyle = TEAM_ZONE[team]
    ctx.fillRect(start * CELL, 0, CELL * 2, CANVAS_SIZE)
  }
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const dark = (row + col) % 2 === 0
      ctx.fillStyle = dark ? '#16151f' : '#1a1926'
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL)
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 1
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL, 0)
    ctx.lineTo(i * CELL, CANVAS_SIZE)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * CELL)
    ctx.lineTo(CANVAS_SIZE, i * CELL)
    ctx.stroke()
  }
}

function drawUnit(ctx: CanvasRenderingContext2D, unit: BattleUnitView, now: number): void {
  const bob = Math.sin(now / 460 + (unit.row + unit.col) * 0.8) * 2
  const x = unit.col * CELL
  const y = unit.row * CELL + bob
  const inset = unit.active ? 10 : 14
  const w = CELL - inset * 2
  const h = CELL - inset * 2

  ctx.fillStyle = KIND_COLOR[unit.kind]
  roundRect(ctx, x + inset, y + inset, w, h, 12)
  ctx.fill()

  ctx.strokeStyle = TEAM_EDGE[unit.team]
  ctx.lineWidth = unit.active ? 4 : 2
  roundRect(ctx, x + inset, y + inset, w, h, 12)
  ctx.stroke()

  const firstLetter = unit.kind[0].toUpperCase()
  ctx.fillStyle = '#0f0e17'
  ctx.font = 'bold 40px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(firstLetter, x + CELL / 2, y + CELL / 2 + 6)

  drawHpBar(ctx, x, y, unit.hp, unit.maxHp, TEAM_EDGE[unit.team])
}

function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, color: string): void {
  const w = CELL - 28
  const h = 8
  const ratio = Math.max(0, Math.min(1, hp / maxHp))

  ctx.fillStyle = '#221f2e'
  roundRect(ctx, x + 14, y + 8, w, h, 4)
  ctx.fill()

  ctx.fillStyle = color
  roundRect(ctx, x + 14, y + 8, w * ratio, h, 4)
  ctx.fill()
}

function drawFloater(ctx: CanvasRenderingContext2D, floater: Floater, now: number): void {
  const age = now - floater.born
  if (age < 0 || age > FLOATER_MS) return
  const progress = age / FLOATER_MS

  ctx.globalAlpha = 1 - progress
  ctx.fillStyle = floater.color
  ctx.font = 'bold 22px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(floater.text, floater.col * CELL + CELL / 2, floater.row * CELL + CELL / 2 - progress * 26)
  ctx.globalAlpha = 1
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}