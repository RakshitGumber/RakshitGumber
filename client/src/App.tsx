import { Logo } from './components/Overlay/Logo'
import {Canvas} from './components/Canvas'

export default function App() {
  return (
    <div className="relative min-h-dvh bg-black">
      <Canvas />
      <Logo className="size-40 absolute top-22 left-22 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10" />
    </div>
  )
}
