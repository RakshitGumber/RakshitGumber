export type Project = {
  id: string
  channel: number
  title: string
  tags: string
  summary: string
  href: string | null
  accent: string
  ink: string
  grid: [number, number]
}

/** Channel 0 is the home card; projects start at 1. */
export const PROJECTS: Project[] = [
  {
    id: 'single-filter',
    channel: 1,
    title: 'Single Filter',
    tags: 'Product · Open Source',
    summary: "Photo editing shouldn't require extra skills. A focused snap tool for quick filters.",
    href: 'https://github.com/RakshitGumber/snap-tool',
    accent: '#FF8A5C',
    ink: '#1A1008',
    grid: [1, 0],
  },
  {
    id: 'curaly',
    channel: 2,
    title: 'Curaly',
    tags: 'Product · News',
    summary: 'Filter the noise and get informed. A quieter way to follow what matters.',
    href: 'https://curaly.app',
    accent: '#00D68F',
    ink: '#062218',
    grid: [-1, 0],
  },
  {
    id: 'rustle',
    channel: 3,
    title: 'Rustle',
    tags: 'CLI · Open Source',
    summary: 'All the news in your terminal. Fast, local, no tab chaos.',
    href: 'https://github.com/RakshitGumber/rustle',
    accent: '#B4E34A',
    ink: '#1A2410',
    grid: [0, 1],
  },
  {
    id: 'autterly',
    channel: 4,
    title: 'Autterly',
    tags: 'AI · Product',
    summary: 'AI that can take over the busywork so you stay on the real work.',
    href: 'https://autterly.com',
    accent: '#C89BFF',
    ink: '#1A1028',
    grid: [1, -1],
  },
]

export const HOME_INDEX = 0

export function boardItems() {
  return [
    {
      kind: 'home' as const,
      index: HOME_INDEX,
      channel: 0,
      title: SITE_HOME_TITLE,
      tags: SITE_HOME_TAGS,
      accent: '#FFE566',
      ink: '#1A1400',
      grid: [0, 0] as [number, number],
    },
    ...PROJECTS.map((p, i) => ({
      kind: 'project' as const,
      index: i + 1,
      channel: p.channel,
      title: p.title,
      tags: p.tags,
      accent: p.accent,
      ink: p.ink,
      grid: p.grid,
      project: p,
    })),
  ]
}

const SITE_HOME_TITLE = 'Rakshit Gumber'
const SITE_HOME_TAGS = 'Home · Portfolio'

export function projectByIndex(index: number) {
  if (index <= 0) return null
  return PROJECTS[index - 1] ?? null
}

export function indexByChannel(channel: number) {
  if (channel === 0) return HOME_INDEX
  const i = PROJECTS.findIndex((p) => p.channel === channel)
  return i >= 0 ? i + 1 : -1
}
