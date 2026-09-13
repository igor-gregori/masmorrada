import { SQUAD_SIZE } from '../core/balance'
import type { Creature, Squad } from '../core/types'

export interface RunState {
  squad: Squad
  bench: Creature[]
}

export function createRun(): RunState {
  return {
    squad: Array.from({ length: SQUAD_SIZE }, () => null),
    bench: [],
  }
}

export const store: RunState = createRun()