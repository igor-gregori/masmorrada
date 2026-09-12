export const GRID = 8
export const CELL = 100
export const CANVAS_SIZE = GRID * CELL

export interface Placeholder {
  team: 'player' | 'enemy'
  col: number
  row: number
  label: string
  hp: number
  maxHp: number
}

interface TeamStyle {
  fill: string
  edge: string
  hp: string
  zone: string
}

const TEAM: Record<Placeholder['team'], TeamStyle> = {
  player: { fill: '#3b6fd4', edge: '#9fc1ff', hp: '#7dff8a', zone: 'rgba(94, 130, 255, 0.08)' },
  enemy: { fill: '#d4473b', edge: '#ffb1a9', hp: '#ff6b5e', zone: 'rgba(255, 94, 94, 0.08)' },
}

export function renderGame(ctx: CanvasRenderingContext2D, t: number, units: Placeholder[]): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  drawFloor(ctx)
  drawTeamZones(ctx)
  drawGrid(ctx)
  for (const unit of units) drawUnit(ctx, unit, t)
}

function drawFloor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0f0e17'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
}

function drawTeamZones(ctx: CanvasRenderingContext2D): void {
  const zones: Array<[Placeholder['team'], TeamStyle]> = [
    ['player', TEAM.player],
    ['enemy', TEAM.enemy],
  ]
  for (const [side, style] of zones) {
    const start = side === 'player' ? 0 : GRID - 2
    ctx.fillStyle = style.zone
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

function drawUnit(ctx: CanvasRenderingContext2D, unit: Placeholder, t: number): void {
  const style = TEAM[unit.team]
  const bob = Math.sin(t * 2.2 + (unit.row + unit.col) * 0.8) * 3
  const x = unit.col * CELL
  const y = unit.row * CELL + bob
  const inset = 14
  const w = CELL - inset * 2
  const h = CELL - inset * 2

  ctx.fillStyle = style.fill
  roundRect(ctx, x + inset, y + inset, w, h, 12)
  ctx.fill()

  ctx.strokeStyle = style.edge
  ctx.lineWidth = 2
  roundRect(ctx, x + inset, y + inset, w, h, 12)
  ctx.stroke()

  ctx.fillStyle = '#0f0e17'
  ctx.font = 'bold 40px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(unit.label, x + CELL / 2, y + CELL / 2 + 6)

  drawHpBar(ctx, unit, x, y)
}

function drawHpBar(ctx: CanvasRenderingContext2D, unit: Placeholder, x: number, y: number): void {
  const style = TEAM[unit.team]
  const w = CELL - 28
  const h = 8
  const ratio = Math.max(0, Math.min(1, unit.hp / unit.maxHp))

  ctx.fillStyle = '#221f2e'
  roundRect(ctx, x + 14, y + 8, w, h, 4)
  ctx.fill()

  ctx.fillStyle = style.hp
  roundRect(ctx, x + 14, y + 8, w * ratio, h, 4)
  ctx.fill()
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