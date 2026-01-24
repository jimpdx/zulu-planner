import { PlanProvider } from './context/PlanContext'
import { PlanInputs } from './components/PlanInputs'
import { FacilitiesPanel } from './components/FacilitiesPanel'
import { ControllersPanel } from './components/ControllersPanel'
import { Timeline } from './components/Timeline'
import { SyncPanel } from './components/SyncPanel'

function App() {
  return (
    <PlanProvider>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text">VATSIM Zulu Event Planner</h1>
          <p className="text-sm text-accent/70">A planning tool for ATC coverage across timezones</p>
        </header>

        <SyncPanel />

        <PlanInputs />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FacilitiesPanel />
          <ControllersPanel />
        </div>

        <Timeline />
      </div>
    </PlanProvider>
  )
}

export default App
