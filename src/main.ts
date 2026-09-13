import { renderBattle, FLOATER_MS, type BattleView, type Floater } from './render/canvas'
import { runPreview } from './dev/preview'
import { generateRecruitOffer } from './generation/recruit'
import { generateBench } from './generation/bench'
import { generateEnemyTeam, generateBossTeam } from './generation/enemy'
import { buildBattleUnits, createBattle, runRound, type BattleEvent, type BattleState } from './core/combat'
import { showRecruit, showAssembly, showResult, type AssemblyCallbacks } from './ui/screens'
import { store, createRun } from './ui/store'

runPreview()

const ROUND_MS = 380
const RESULT_DELAY_MS = 1200

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ctx = canvas.getContext('2d')!
const fpsEl = document.querySelector<HTMLSpanElement>('#fps')!
const uiRoot = document.querySelector<HTMLDivElement>('#ui-root')!

function setPhase(phase: 'menu' | 'combat'): void {
  document.body.dataset.phase = phase
}

function resetRun(): void {
  Object.assign(store, createRun())
}

function startRecruit(): void {
  const offer = generateRecruitOffer()
  showRecruit(uiRoot, offer, (creature) => {
    store.squad[0] = { creature, row: 'front' }
    startAssembly()
  })
}

function ensureBench(): void {
  if (store.bench.length === 0) store.bench = generateBench()
}

function assemblyCallbacks(): AssemblyCallbacks {
  return {
    onAssign(creature) {
      if (store.squad.some((m) => m && m.creature.id === creature.id)) return
      const index = store.squad.findIndex((m) => !m)
      if (index >= 0) store.squad[index] = { creature, row: 'front' }
      renderAssembly()
    },
    onRemove(index) {
      store.squad[index] = null
      renderAssembly()
    },
    onToggleRow(index) {
      const member = store.squad[index]
      if (member) member.row = member.row === 'front' ? 'back' : 'front'
      renderAssembly()
    },
    onStart() {
      startCombat()
    },
    onRestart() {
      resetRun()
      startRecruit()
    },
  }
}

function renderAssembly(): void {
  showAssembly(uiRoot, store.squad, store.bench, assemblyCallbacks(), store.battle, store.battle > 3)
}

function startAssembly(): void {
  ensureBench()
  setPhase('menu')
  renderAssembly()
}

/* ------------------------------ Batalha ------------------------------ */

let battle: BattleState | null = null
let floaters: Floater[] = []
let lastRoundAt = 0
let battleOverAt: number | null = null
let lastActiveId: string | null = null
let floaterSeq = 0
let activeBattle = 1

const PLAYER_ROWS = [1, 2, 4, 5]
const ENEMY_ROWS = [1, 2, 4, 5]

function startCombat(): void {
  if (!store.squad.some((m) => m)) return
  const playerUnits = buildBattleUnits(store.squad, 'player', 1, 0, PLAYER_ROWS)
  const boss = store.battle > 3
  activeBattle = boss ? 4 : store.battle
  const enemySquad = boss ? generateBossTeam() : generateEnemyTeam(store.battle)
  const enemyUnits = buildBattleUnits(enemySquad, 'enemy', 6, 7, ENEMY_ROWS)

  battle = createBattle(playerUnits, enemyUnits)
  floaters = []
  lastRoundAt = 0
  battleOverAt = null
  lastActiveId = null
  setPhase('combat')
}

function applyEvents(events: BattleEvent[], now: number): void {
  for (const event of events) {
    if (event.type === 'attack') {
      lastActiveId = event.attackerId
      const target = battle!.units.find((u) => u.id === event.targetId)
      if (target) {
        floaters.push({
          id: `f${floaterSeq++}`,
          col: target.col,
          row: target.row,
          text: event.dodged ? 'ESQUIVOU' : `-${event.damage}`,
          color: event.dodged ? '#7dfcff' : '#ff8d84',
          born: now,
        })
      }
    } else {
      lastActiveId = event.unitId
      if (event.type === 'heal') {
        const target = battle!.units.find((u) => u.id === event.targetId)
        if (target) {
          floaters.push({
            id: `f${floaterSeq++}`,
            col: target.col,
            row: target.row,
            text: `+${event.amount}`,
            color: '#7dff8a',
            born: now,
          })
        }
      } else if (event.type === 'death') {
        const target = battle!.units.find((u) => u.id === event.unitId)
        if (target) {
          floaters.push({
            id: `f${floaterSeq++}`,
            col: target.col,
            row: target.row,
            text: 'K.O.',
            color: '#ffb1a9',
            born: now,
          })
        }
      }
    }
  }
}

function updateBattle(now: number): void {
  if (!battle) return
  if (!battle.over && now - lastRoundAt >= ROUND_MS) {
    lastRoundAt = now
    applyEvents(runRound(battle), now)
  }
  if (battle.over && battleOverAt === null) battleOverAt = now + RESULT_DELAY_MS
  if (battleOverAt !== null && now >= battleOverAt) {
    const won = battle.winner === 'player'
    const boss = activeBattle === 4
    battle = null
    if (won && !boss) store.battle += 1
    setPhase('menu')
    showResult(uiRoot, { won, battle: activeBattle, boss }, {
      onNext: () => startAssembly(),
      onAssembly: () => startAssembly(),
      onRestart: () => {
        resetRun()
        startRecruit()
      },
    })
  }
}

function renderBattleView(now: number): void {
  if (!battle) return
  const view: BattleView = {
    units: battle.units
      .filter((u) => u.alive)
      .map((u) => ({
        id: u.id,
        team: u.team,
        kind: u.kind,
        hp: u.hp,
        maxHp: u.stats.hp,
        col: u.col,
        row: u.row,
        active: u.id === lastActiveId,
      })),
    floaters: floaters.filter((f) => now - f.born < FLOATER_MS),
    now,
  }
  renderBattle(ctx, view)
}

/* ------------------------------ Loop ------------------------------ */

let last = performance.now()
let frames = 0
let acc = 0

function loop(now: number): void {
  const dt = Math.min(now - last, 100)
  last = now
  frames++
  acc += dt
  if (acc >= 500) {
    fpsEl.textContent = `${Math.round((frames * 1000) / acc)} FPS`
    acc = 0
    frames = 0
  }
  updateBattle(now)
  renderBattleView(now)
  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)

setPhase('menu')
startRecruit()