import { SITE } from '../../data/site'

type Props = {
  open: boolean
  shortcutsOn: boolean
  onClose: () => void
  onToggleShortcuts: () => void
}

const ROWS: { key: string; hint: string }[] = [
  { key: 'CLICK', hint: 'Open a screen to watch it' },
  { key: 'DRAG', hint: 'Look around the board' },
  { key: 'WHEEL', hint: 'Zoom in and out' },
  { key: 'ARROWS', hint: 'Pan the board, or step to the next project' },
  { key: 'SPACE', hint: 'Open, or go back' },
  { key: 'ENTER', hint: 'Open' },
  { key: 'ESC BACKSPACE', hint: 'Back' },
  { key: 'HOME', hint: 'Back to the home screen' },
  { key: 'PGUP PGDN', hint: 'Previous or next project, by channel number' },
  { key: 'TAB', hint: 'Walk projects and links' },
  { key: 'R', hint: 'Random project' },
  { key: '0-9', hint: 'Type a teletext channel' },
  { key: '?', hint: 'This page' },
]

export function TeletextHelp({ open, shortcutsOn, onClose, onToggleShortcuts }: Props) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Help, page 000"
      className="absolute inset-0 z-40 flex flex-col bg-black/95 text-[var(--color-teletext-yellow)]"
      style={{ fontFamily: 'var(--font-condensed)' }}
    >
      <div className="flex items-center gap-3 border-b-4 border-[var(--color-teletext-yellow)] bg-[var(--color-teletext-yellow)] px-4 py-2 text-black">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close help"
          className="grid size-8 place-items-center rounded-full bg-neutral-400 text-lg font-bold text-black"
        >
          ×
        </button>
        <div className="flex flex-1 items-center justify-between gap-4 text-sm font-bold tracking-widest uppercase sm:text-base">
          <span>DO — HELP</span>
          <span className="opacity-80">Page 000</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section>
            <p className="text-base leading-relaxed text-white sm:text-lg">{SITE.helpBio}</p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold tracking-wide uppercase sm:text-base">
              {SITE.socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {ROWS.map((row) => (
              <div key={row.key} className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:text-[0.95rem]">
                <span className="font-bold tracking-wide text-white uppercase">{row.key}</span>
                <span className="text-[var(--color-teletext-yellow)]">{row.hint}</span>
              </div>
            ))}
            <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:text-[0.95rem]">
              <span className="font-bold tracking-wide text-white uppercase">SHORTCUTS</span>
              <button type="button" onClick={onToggleShortcuts} className="text-left underline-offset-4 hover:underline">
                Single-key shortcuts: {shortcutsOn ? 'on' : 'off'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
