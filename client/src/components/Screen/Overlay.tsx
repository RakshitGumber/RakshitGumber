import { Logo } from '../Logo'
import RetroGadgetsCanvas from '../RetroGadgets/RetroGadgetsCanvas'

const Overlay = () => {
  return (
    <div className="relative inset-0 bg-black min-h-dvh">
      <RetroGadgetsCanvas />
      <Logo className="size-40 absolute top-22 left-22 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10" />
    </div>
  )
}

export default Overlay
