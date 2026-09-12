import type { Creature, CreatureKind, Squad, SquadMember, Stats } from '../core/types'
import { KIND_CATEGORY, KIND_LABEL, RARITY_LABEL, scaledStats } from '../core/balance'
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

function slotEl(member: SquadMember | null, index: number): HTMLElement {
  const slot = el('div', 'slot' + (member ? '' : ' empty'))
  slot.append(el('span', 'slot-idx', `Slot ${index + 1}`))
  if (!member) return slot

  const stats = scaledStats(member.creature.kind, member.creature.level, member.creature.rarity)
  const body = el('div', 'slot-body')
  body.append(disc(member.creature.kind))
  const info = el('div', 'slot-info')
  info.append(
    el('div', 'slot-name', member.creature.name),
    el('div', 'slot-kind', `${KIND_LABEL[member.creature.kind]} · ${RARITY_LABEL[member.creature.rarity]} · ${member.row === 'front' ? 'Frente' : 'Trás'}`),
    statRow(stats),
  )
  body.append(info)
  slot.append(body)
  return slot
}

export function showSquad(root: HTMLElement, squad: Squad, onRestart: () => void): void {
  root.replaceChildren()
  const wrap = el('div', 'screen')
  wrap.append(
    el('h1', 'title', 'Esquadrão'),
    el('p', 'subtitle', 'Sua criatura recrutada — montagem completa (4 slots, sinergias e frente/trás) vem na próxima fase.'),
  )
  const slots = el('div', 'slots')
  squad.forEach((member, i) => slots.append(slotEl(member, i)))
  wrap.append(slots)
  const back = el('button', 'btn', '↺ Recomeçar (teste)')
  back.addEventListener('click', onRestart)
  wrap.append(back)
  root.append(wrap)
}