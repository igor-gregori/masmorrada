import type { Creature, CreatureKind, Row, Squad, SquadMember, Stats } from '../core/types'
import { KIND_CATEGORY, KIND_LABEL, RARITY_LABEL, scaledStats } from '../core/balance'
import { computeMemberStats, countKinds, SYNERGIES } from '../core/synergies'
import { KIND_COLOR, RARITY_COLOR } from './theme'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function disc(kind: CreatureKind): HTMLElement {
  const d = el('div', 'disc')
  d.style.background = KIND_COLOR[kind]
  d.textContent = KIND_LABEL[kind][0]
  return d
}

function badge(rarity: Creature['rarity']): HTMLElement {
  const b = el('span', 'badge', RARITY_LABEL[rarity])
  b.style.color = RARITY_COLOR[rarity]
  return b
}

function statRow(s: Stats): HTMLElement {
  const row = el('div', 'card-stats')
  const cells: Array<[string, number]> = [
    ['Vida', s.hp],
    ['ATQ', s.atk],
    ['DEF', s.def],
    ['VEL', s.spd],
  ]
  for (const [label, value] of cells) {
    const cell = el('div', 'stat')
    cell.append(el('span', 'stat-label', label), el('strong', 'stat-value', String(value)))
    row.append(cell)
  }
  return row
}

/* ------------------------------ Recrutar ------------------------------ */

function creatureCard(c: Creature, onClick: () => void): HTMLElement {
  const stats = scaledStats(c.kind, c.level, c.rarity)
  const card = el('button', 'card')
  card.style.borderColor = RARITY_COLOR[c.rarity]
  card.addEventListener('click', onClick)

  const top = el('div', 'card-top')
  top.append(disc(c.kind), el('span', 'card-name', c.name), badge(c.rarity))
  const kind = el('div', 'card-kind', `${KIND_LABEL[c.kind]} · ${KIND_CATEGORY[c.kind]} · Nv ${c.level}`)

  card.append(top, kind, statRow(stats))
  return card
}

export function showRecruit(root: HTMLElement, offer: Creature[], onPick: (creature: Creature) => void): void {
  root.replaceChildren()
  const wrap = el('div', 'screen')
  wrap.append(
    el('h1', 'title', 'Recrutamento inicial'),
    el('p', 'subtitle', 'O caçador precisa de uma besta para começar a descer. Escolha 1 de 3.'),
  )
  const cards = el('div', 'offer')
  for (const c of offer) cards.append(creatureCard(c, () => onPick(c)))
  wrap.append(cards)
  root.append(wrap)
}

/* ------------------------------ Montagem ------------------------------ */

export interface AssemblyCallbacks {
  onAssign: (creature: Creature) => void
  onRemove: (index: number) => void
  onToggleRow: (index: number) => void
  onStart: () => void
  onRestart: () => void
}

function synergyStrip(squad: Squad): HTMLElement {
  const counts = countKinds(squad)
  const strip = el('div', 'synergies')
  for (const kind of Object.keys(SYNERGIES) as CreatureKind[]) {
    const synergy = SYNERGIES[kind]
    const count = counts[kind]
    const missing = synergy.threshold - count
    const active = missing <= 0
    const pill = el('div', 'synergy' + (active ? ' active' : ''))
    pill.style.borderColor = active ? KIND_COLOR[kind] : '#2c2a40'
    const head = el('div', 'synergy-head')
    head.append(
      el('span', 'synergy-kind', `${KIND_LABEL[kind]} ×${count}`),
      el('span', 'synergy-status' + (active ? ' on' : ''), active ? 'ATIVA' : missing > 0 ? `falta ${missing}` : '—'),
    )
    pill.append(head, el('div', 'synergy-desc', synergy.description))
    strip.append(pill)
  }
  return strip
}

function squadSlotEl(index: number, member: SquadMember, squad: Squad, cb: AssemblyCallbacks): HTMLElement {
  const stats = computeMemberStats(member, squad)
  const slot = el('div', 'slot')
  const head = el('div', 'slot-head')
  head.append(
    el('span', 'slot-idx', `Slot ${index + 1}`),
    el('span', 'slot-row', member.row === 'front' ? 'Frente' : 'Trás'),
  )
  slot.append(head)

  const body = el('div', 'slot-body')
  body.append(disc(member.creature.kind))
  const info = el('div', 'slot-info')
  info.append(
    el('div', 'slot-name', member.creature.name),
    el('div', 'slot-kind', `${KIND_LABEL[member.creature.kind]} · ${RARITY_LABEL[member.creature.rarity]} · Nv ${member.creature.level}`),
    statRow(stats),
  )
  body.append(info)
  slot.append(body)

  const actions = el('div', 'slot-actions')
  const toggle = el('button', 'btn small', member.row === 'front' ? '→ Trás' : '→ Frente')
  toggle.addEventListener('click', () => cb.onToggleRow(index))
  const remove = el('button', 'btn small danger', '✕ remover')
  remove.addEventListener('click', () => cb.onRemove(index))
  actions.append(toggle, remove)
  slot.append(actions)
  return slot
}

function benchCard(c: Creature, assigned: boolean, onClick: () => void): HTMLElement {
  const stats = scaledStats(c.kind, c.level, c.rarity)
  const card = el('button', 'card bench' + (assigned ? ' assigned' : ''))
  card.style.borderColor = RARITY_COLOR[c.rarity]
  card.addEventListener('click', () => { if (!assigned) onClick() })

  const top = el('div', 'card-top')
  top.append(disc(c.kind), el('span', 'card-name', c.name), badge(c.rarity))
  const kind = el('div', 'card-kind', `${KIND_LABEL[c.kind]} · ${KIND_CATEGORY[c.kind]} · Nv ${c.level}`)
  card.append(top, kind, statRow(stats))
  if (assigned) card.append(el('div', 'assigned-tag', 'no esquadrão'))
  return card
}

export function showAssembly(root: HTMLElement, squad: Squad, bench: Creature[], cb: AssemblyCallbacks, battle = 1, boss = false): void {
  root.replaceChildren()
  const wrap = el('div', 'screen')
  const subtitle = boss
    ? 'O chefe da masmorra está à frente. Revise o esquadrão antes da descida final.'
    : `Batalha ${battle} de 3. Até 4 criaturas; troque linhas (frente/trás) e acompanhe as sinergias.`
  wrap.append(
    el('h1', 'title', boss ? 'Chefe da Masmorra' : 'Montar Esquadrão'),
    el('p', 'subtitle', subtitle),
  )
  wrap.append(synergyStrip(squad))

  const slots = el('div', 'slots')
  for (const row of ['front', 'back'] as Row[]) {
    const col = el('div', 'slots-col')
    col.append(el('div', 'slots-col-title', row === 'front' ? 'Linha da Frente' : 'Linha de Trás'))
    const hasMember = squad.some((m) => m && m.row === row)
    if (!hasMember) col.append(el('div', 'slot empty inline', '—'))
    squad.forEach((member, i) => {
      if (member && member.row === row) col.append(squadSlotEl(i, member, squad, cb))
    })
    slots.append(col)
  }
  wrap.append(slots)

  wrap.append(el('div', 'section-title', 'Banco'))
  const grid = el('div', 'bench')
  const assigned = new Set(squad.filter(Boolean).map((m) => m!.creature.id))
  for (const c of bench) grid.append(benchCard(c, assigned.has(c.id), () => cb.onAssign(c)))
  wrap.append(grid)

  const actions = el('div', 'actions')
  const start = el('button', 'btn primary', 'Iniciar batalha →')
  start.addEventListener('click', cb.onStart)
  const restart = el('button', 'btn', '↺ Recomeçar (novo recrutamento)')
  restart.addEventListener('click', cb.onRestart)
  actions.append(start, restart)
  wrap.append(actions)
  root.append(wrap)
}

/* ------------------------------ Resultado ------------------------------ */

export interface ResultInfo {
  won: boolean
  battle: number
  boss: boolean
}

export interface ResultCallbacks {
  onNext?: () => void
  onAssembly: () => void
  onRestart: () => void
}

export function showResult(root: HTMLElement, info: ResultInfo, cb: ResultCallbacks): void {
  root.replaceChildren()
  const wrap = el('div', 'screen')
  const won = info.won

  let title: string
  let subtitle: string
  if (info.boss) {
    title = won ? 'Masmorra zerada!' : 'Derrota no chefe'
    subtitle = won
      ? 'O chefe caiu e a masmorra foi limpa. (Game Over e score chegam nas próximas fases.)'
      : 'O chefe foi demais para o esquadrão. A run termina aqui por enquanto.'
  } else {
    title = won ? 'Vitória!' : 'Derrota'
    subtitle = won
      ? `Batalha ${info.battle} de 3 vencida. Prepare-se para a próxima.`
      : 'Seu esquadrão foi zerado. Reorganize e tente de novo.'
  }

  wrap.append(el('h1', 'title', title), el('p', 'subtitle', subtitle))

  const actions = el('div', 'actions')
  if (won) {
    const next = el('button', 'btn primary', info.boss ? '↺ Nova run' : 'Próxima batalha →')
    next.addEventListener('click', info.boss ? cb.onRestart : cb.onNext ?? cb.onAssembly)
    actions.append(next)
    const assembly = el('button', 'btn', '← Voltar à montagem')
    assembly.addEventListener('click', cb.onAssembly)
    actions.append(assembly)
  } else {
    const assembly = el('button', 'btn primary', '← Voltar à montagem')
    assembly.addEventListener('click', cb.onAssembly)
    const restart = el('button', 'btn', '↺ Novo recrutamento')
    restart.addEventListener('click', cb.onRestart)
    actions.append(assembly, restart)
  }
  wrap.append(actions)
  root.append(wrap)
}