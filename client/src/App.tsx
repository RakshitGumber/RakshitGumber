import { PixiOverlay, PixiStage } from '@/components/PixiStage'
import { Title } from '@/components/Title'

const App = () => {
  return (
    <main className="relative flex min-h-dvh items-center bg-[var(--color-bg)] overflow-hidden">
      <PixiStage />
      <div className="relative z-10 w-full">
        <Title />
      </div>
      <PixiOverlay />
    </main>
  )
}

export default App
