import { useEffect, useRef, type MutableRefObject } from 'react'
import type { BoardApi } from '../Canvas'
import { HOME_INDEX, PROJECTS, indexByChannel } from '../../data/projects'

type Opts = {
  apiRef: MutableRefObject<BoardApi | null>
  shortcutsOn: boolean
  helpOpen: boolean
  channelOpen: boolean
  focusedIndex: number
  onOpenHelp: () => void
  onCloseHelp: () => void
  onActivate: (index: number) => void
  onCloseChannel: () => void
  onToggleShortcuts: () => void
  onFocusIndex: (index: number) => void
}

const CHANNEL_MS = 900

export function useBoardShortcuts(opts: Opts) {
  const optsRef = useRef(opts)
  const bufferRef = useRef('')
  const timerRef = useRef(0)

  useEffect(() => {
    optsRef.current = opts
  })

  useEffect(() => {
    const flushChannel = () => {
      const raw = bufferRef.current
      bufferRef.current = ''
      if (!raw) return
      const n = Number.parseInt(raw, 10)
      if (Number.isNaN(n)) return
      const index = indexByChannel(n)
      if (index < 0) return
      const o = optsRef.current
      o.onCloseHelp()
      o.onCloseChannel()
      o.apiRef.current?.snapToIndex(index)
      o.onFocusIndex(index)
    }

    const onKey = (e: KeyboardEvent) => {
      const o = optsRef.current
      const api = o.apiRef.current
      if (!api) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const key = e.key

      if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault()
        if (o.helpOpen) o.onCloseHelp()
        else o.onOpenHelp()
        return
      }

      if (key === 'Escape' || key === 'Backspace') {
        if (o.helpOpen) {
          e.preventDefault()
          o.onCloseHelp()
          return
        }
        if (o.channelOpen) {
          e.preventDefault()
          o.onCloseChannel()
          return
        }
        if (key === 'Backspace' && bufferRef.current) {
          e.preventDefault()
          bufferRef.current = bufferRef.current.slice(0, -1)
          return
        }
        return
      }

      if (o.helpOpen) return

      if (key === 'Home') {
        e.preventDefault()
        o.onCloseChannel()
        api.snapToIndex(HOME_INDEX)
        o.onFocusIndex(HOME_INDEX)
        return
      }

      if (key === 'Enter' || key === ' ') {
        e.preventDefault()
        if (o.channelOpen) {
          if (key === ' ') o.onCloseChannel()
          return
        }
        const i = api.getFocusedIndex()
        if (i >= 0) o.onActivate(i)
        return
      }

      if (key === 'PageUp' || key === 'PageDown') {
        e.preventDefault()
        const cur = Math.max(0, api.getFocusedIndex())
        const max = PROJECTS.length
        const next = key === 'PageDown' ? (cur >= max ? 1 : cur + 1) : cur <= 1 ? max : cur - 1
        o.onCloseChannel()
        api.snapToIndex(next)
        o.onFocusIndex(next)
        return
      }

      if (!o.shortcutsOn && /^[0-9rR]$/.test(key)) return

      if (o.shortcutsOn && key >= '0' && key <= '9') {
        e.preventDefault()
        bufferRef.current = (bufferRef.current + key).slice(-3)
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(flushChannel, CHANNEL_MS)
        return
      }

      if (o.shortcutsOn && (key === 'r' || key === 'R')) {
        e.preventDefault()
        const i = 1 + Math.floor(Math.random() * PROJECTS.length)
        o.onCloseChannel()
        api.snapToIndex(i)
        o.onFocusIndex(i)
        return
      }

      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault()
        if (o.channelOpen) {
          const cur = Math.max(1, o.focusedIndex)
          const max = PROJECTS.length
          let next = cur
          if (key === 'ArrowRight' || key === 'ArrowDown') next = cur >= max ? 1 : cur + 1
          else next = cur <= 1 ? max : cur - 1
          o.onActivate(next)
          api.snapToIndex(next)
          o.onFocusIndex(next)
          return
        }
        const step = Math.min(window.innerWidth, window.innerHeight) * 0.18
        const dx = key === 'ArrowLeft' ? step : key === 'ArrowRight' ? -step : 0
        const dy = key === 'ArrowUp' ? step : key === 'ArrowDown' ? -step : 0
        api.panBy(dx, dy)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timerRef.current)
    }
  }, [])
}
