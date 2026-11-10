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

export const CONTACT_PALETTE: StripPalette = {
  // Field #93c5fd → 215° / 305° / 35° / 125°
  colors: ['#7eb8ff', '#c4a1ff', '#ff9b6a', '#7ee0a8'],
  ink: '#0c1a3a',
  paper: '#ffffff',
}
