import { Display } from './components/Display'
import { ControlPage } from './pages/ControlPage'

export default function App() {
  const isControl = window.location.pathname.startsWith('/control')
  return isControl ? <ControlPage /> : <Display />
}
