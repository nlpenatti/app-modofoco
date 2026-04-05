import { useState } from 'react'
import { BarraAbas, type AbaPainel } from './componentes/BarraAbas'
import { ModuloPomodoro } from './componentes/ModuloPomodoro'
import { ModuloRotina } from './componentes/ModuloRotina'
import { PainelInicio } from './componentes/PainelInicio'

function App(): React.JSX.Element {
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>('inicio')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-indigo-200/80 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-950">Modo Foco</h1>
            <p className="text-sm text-slate-600">
              Rotina, Pomodoro, alertas de distração e atalhos rápidos.
            </p>
          </div>
          <BarraAbas abaAtiva={abaAtiva} aoMudarAba={setAbaAtiva} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/60 bg-white/75 p-6 shadow-lg backdrop-blur-sm">
          {abaAtiva === 'inicio' && <PainelInicio />}
          {abaAtiva === 'rotina' && <ModuloRotina />}
          {abaAtiva === 'pomodoro' && <ModuloPomodoro />}
        </div>
      </main>
    </div>
  )
}

export default App
