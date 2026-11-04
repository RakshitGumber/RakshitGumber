import { SITE } from '../../data/site'

type Props = {
  onHelp: () => void
}

export function Stickers({ onHelp }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <button
        type="button"
        onClick={onHelp}
        aria-label="Help: keys and gestures"
        className="pointer-events-auto absolute top-[max(2.5rem,calc(env(safe-area-inset-top)+8%))] left-[max(2.5rem,calc(env(safe-area-inset-left)+7%))] grid size-14 place-items-center rounded-[40%_55%_45%_50%] bg-[var(--color-teletext-yellow)] text-[1.75rem] font-bold text-black shadow-[0_6px_0_#000] transition-transform hover:scale-105 active:translate-y-0.5 active:shadow-none sm:size-16"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        ?
      </button>

      <a
        href={SITE.openToWorkHref}
        target="_blank"
        rel="noreferrer"
        aria-label="OPEN TO WORK. Say hello on LinkedIn"
        className="pointer-events-auto absolute right-[max(2rem,calc(env(safe-area-inset-right)+7%))] bottom-[max(2.5rem,calc(env(safe-area-inset-bottom)+9%))] block w-36 rotate-[-8deg] transition-transform hover:scale-105 hover:rotate-[-4deg] sm:w-44"
      >
        <span className="relative block aspect-square">
          <span className="absolute inset-0 rotate-45 rounded-md border-[5px] border-[var(--color-sticker-yellow)] bg-[var(--color-sticker-green)] shadow-[4px_4px_0_#000]" />
          <span className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center text-black">
            <span
              className="text-[0.72rem] leading-tight tracking-wide uppercase sm:text-[0.85rem]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Open to work
            </span>
            <span className="mt-1 text-[0.7rem] italic opacity-90 sm:text-sm">Let&apos;s Talk</span>
          </span>
        </span>
      </a>
    </div>
  )
}
