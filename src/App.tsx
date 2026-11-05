import { Display } from './components/Display'
import { ControlPage } from './pages/ControlPage'
import { ResumePage } from './pages/ResumePage'

export default function App() {
  const path = window.location.pathname
  if (path.startsWith('/resume')) return <ResumePage />
  if (path.startsWith('/control')) return <ControlPage />
  return <Display />
}
