import { SQUAD_SIZE } from '../core/balance'
import type { Squad } from '../core/types'

export interface RunState {
  squad: Squad
}

export function createRun(): RunState {
  return { squad: Array.from({ length: SQUAD_SIZE }, () => null) }
}

export const store: RunState = createRun()