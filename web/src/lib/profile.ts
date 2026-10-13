import type { ProfileDimension } from '../data/types'

/** Nota de força do perfil (0–100): média ponderada dos critérios, arredondada. */
export function profileScore(dimensions: ProfileDimension[], moment: 'now' | 'after'): number {
  const total = dimensions.reduce((sum, d) => sum + d.weight, 0)
  if (total === 0) return 0
  const weighted = dimensions.reduce((sum, d) => sum + d.weight * d[moment], 0)
  return Math.round(weighted / total)
}

export const MAX_PROFILE_PHOTOS = 6
