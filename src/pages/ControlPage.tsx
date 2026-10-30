import { ControlPanel } from '../components/ControlPanel'
import { useTracker } from '../hooks/useTracker'

export function ControlPage() {
  const tracker = useTracker('control')

  return (
    <main className="control-page">
      <header className="control-page-head">
        <h1>Operator Console</h1>
      </header>
      <ControlPanel
        variant="page"
        snapshot={tracker.snapshot}
        onAdd={tracker.addPledge}
        onUndo={tracker.undo}
        onReset={tracker.reset}
        onSettings={tracker.updateSettings}
      />
    </main>
  )
}
