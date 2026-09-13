import { renderGame, type Placeholder } from './render/canvas'
import { runPreview } from './dev/preview'
import { generateRecruitOffer } from './generation/recruit'
import { generateBench } from './generation/bench'
import { showRecruit, showAssembly, showBattleSoon, type AssemblyCallbacks } from './ui/screens'
import { store, createRun } from './ui/store'

runPreview()

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
      showBattleSoon(uiRoot, startAssembly)
    },
    onRestart() {
      resetRun()
      startRecruit()
    },
  }
}

function renderAssembly(): void {
  showAssembly(uiRoot, store.squad, store.bench, assemblyCallbacks())
}

function startAssembly(): void {
  ensureBench()
  setPhase('menu')
  renderAssembly()
}

function buildPlaceholders(): Placeholder[] {
  const unit = (team: Placeholder['team'], col: number, row: number, label: string, hp: number): Placeholder => ({
    team,
    col,
    row,
    label,
    hp,
    maxHp: 100,
  })

  return [
    unit('player', 1, 2, 'B', 90),
    unit('player', 1, 3, 'E', 72),
    unit('player', 0, 2, 'A', 85),
    unit('player', 0, 3, 'C', 64),
    unit('enemy', 6, 2, 'B', 88),
    unit('enemy', 6, 3, 'E', 70),
    unit('enemy', 7, 2, 'A', 82),
    unit('enemy', 7, 3, 'C', 60),
  ]
}

const units = buildPlaceholders()

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
  renderGame(ctx, now / 1000, units)
  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)

setPhase('menu')
startRecruit()