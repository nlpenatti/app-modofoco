import { useEffect, useState } from 'react'
import { AlertaDistraicao } from './componentes/AlertaDistraicao'
import { IndicadorPomodoroCompacto } from './componentes/IndicadorPomodoroCompacto'
import { Sidebar, type AbaPainel } from './componentes/Sidebar'
import { ModuloPomodoro } from './componentes/ModuloPomodoro'
import { ModuloRotina } from './componentes/ModuloRotina'
import { PainelInicio } from './componentes/PainelInicio'
import { ProvedorPomodoro } from './contextos/ContextoPomodoro'

function App(): React.JSX.Element {
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>('inicio')
  const [alertaDistraicaoAberto, setAlertaDistraicaoAberto] = useState(false)

  useEffect(() => {
    return window.api.aoAtividadeMonitor((evento) => {
      if (evento.tipo !== 'distraction_detected') return
      setAlertaDistraicaoAberto(true)
    })
  }, [])

  return (
    <ProvedorPomodoro>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar abaAtiva={abaAtiva} aoMudarAba={setAbaAtiva} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-stone-200/70 bg-white/55 px-8 py-7 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
                {abaAtiva === 'inicio' && 'Seu cantinho de estudo'}
                {abaAtiva === 'rotina' && 'Rotina de hoje'}
                {abaAtiva === 'pomodoro' && 'Pomodoro'}
              </h1>
              <p className="text-sm leading-relaxed text-stone-600">
                {abaAtiva === 'inicio' && 'Tudo que você precisa para começar sem fricção.'}
                {abaAtiva === 'rotina' && 'Pequenos passos que somam no fim do dia.'}
                {abaAtiva === 'pomodoro' && 'Um bloco de cada vez — respira e foca.'}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
            <div className="mx-auto max-w-5xl rounded-[var(--radius-app)] border border-stone-200/80 bg-white/85 p-7 shadow-[var(--shadow-app-card)] backdrop-blur-sm sm:p-9">
              {abaAtiva === 'inicio' && <PainelInicio />}
              {abaAtiva === 'rotina' && <ModuloRotina />}
              {abaAtiva === 'pomodoro' && <ModuloPomodoro />}
            </div>
          </div>
        </main>

        {alertaDistraicaoAberto && (
          <AlertaDistraicao aoFechar={() => setAlertaDistraicaoAberto(false)} />
        )}

        <IndicadorPomodoroCompacto aoAbrirPomodoro={() => setAbaAtiva('pomodoro')} />
      </div>
    </ProvedorPomodoro>
  )
}

export default App
