import { useCallback, useRef, useState } from 'react'
import { Canvas, type BoardApi } from './Canvas'
import { Stickers } from './Chrome/Stickers'
import { TeletextHelp } from './Chrome/TeletextHelp'
import { useBoardShortcuts } from './Chrome/shortcuts'
import { ProjectView } from './ProjectView'
import { HOME_INDEX, PROJECTS, projectByIndex } from '../data/projects'
import { SITE } from '../data/site'

export function Shell() {
  const apiRef = useRef<BoardApi | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(HOME_INDEX)
  const [helpOpen, setHelpOpen] = useState(false)
  const [shortcutsOn, setShortcutsOn] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const onActivate = useCallback((index: number) => {
    setOpenIndex(index)
  }, [])

  const onCloseChannel = useCallback(() => setOpenIndex(null), [])

  useBoardShortcuts({
    apiRef,
    shortcutsOn,
    helpOpen,
    channelOpen: openIndex !== null,
    focusedIndex,
    onOpenHelp: () => setHelpOpen(true),
    onCloseHelp: () => setHelpOpen(false),
    onActivate,
    onCloseChannel,
    onToggleShortcuts: () => setShortcutsOn((v) => !v),
    onFocusIndex: setFocusedIndex,
  })

  const openProject = openIndex !== null && openIndex > 0 ? projectByIndex(openIndex) : null
  const homeOpen = openIndex === HOME_INDEX

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Canvas onFocusChange={setFocusedIndex} onActivate={onActivate} apiRef={apiRef} />

      <nav className="sr-only" aria-label="Projects">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault()
            apiRef.current?.snapToIndex(HOME_INDEX)
            setFocusedIndex(HOME_INDEX)
          }}
        >
          {SITE.headline}
        </a>
        {PROJECTS.map((p, i) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            onClick={(e) => {
              e.preventDefault()
              const index = i + 1
              apiRef.current?.snapToIndex(index)
              setFocusedIndex(index)
              setOpenIndex(index)
            }}
          >
            {p.title}
          </a>
        ))}
      </nav>

      {!helpOpen && openIndex === null ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,8%)] z-10 flex justify-center gap-4 px-4 text-center text-[0.7rem] tracking-wide text-white/45 uppercase sm:text-xs">
          <button
            type="button"
            className="pointer-events-auto hover:text-white"
            onClick={() => setShortcutsOn((v) => !v)}
          >
            Single-key shortcuts: {shortcutsOn ? 'on' : 'off'}
          </button>
          <button type="button" className="pointer-events-auto hover:text-white" onClick={() => setHelpOpen(true)}>
            Help: keys and gestures
          </button>
        </div>
      ) : null}

      <Stickers onHelp={() => setHelpOpen(true)} />
      <ProjectView project={openProject} homeOpen={homeOpen} onClose={onCloseChannel} />
      <TeletextHelp
        open={helpOpen}
        shortcutsOn={shortcutsOn}
        onClose={() => setHelpOpen(false)}
        onToggleShortcuts={() => setShortcutsOn((v) => !v)}
      />
    </div>
  )
}
