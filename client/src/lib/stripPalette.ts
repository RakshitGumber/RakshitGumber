/** Tetradic-ish panel colors tuned to each station field. */
export type StripPalette = {
  colors: [string, string, string, string]
  ink: string
  paper: string
}

export const PROJECT_PALETTE: StripPalette = {
  // Field #ff4d6d → 350° / 80° / 170° / 260°
  colors: ['#ff7b93', '#b6ef45', '#1ec9b0', '#8f74f2'],
  ink: '#1a1020',
  paper: '#ffffff',
}

export const BLOG_PALETTE: StripPalette = {
  // Field #00d4ff → 190° / 280° / 10° / 100°
  colors: ['#5adfff', '#c56bff', '#ff6b8a', '#b6f25a'],
  ink: '#042028',
  paper: '#ffffff',
}

/**
 * Sharp comic panel silhouettes for cursor morph.
 * Panels themselves stay rectangular so they share gutters.
 */
export const PANEL_CLIPS = [
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
] as const
