import { Plane } from 'lucide-react'
import { Button } from './ui/button'

export default function Topbar() {
  return (
    <div className="flex h-14 items-center px-4 gap-3">
      <Plane className="h-5 w-5 text-primary" />
      <span className="font-semibold">MoraPack • Centro de Operaciones</span>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline">Pausar</Button>
        <Button size="sm">Reanudar</Button>
      </div>
    </div>
  )
}
