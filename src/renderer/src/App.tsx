import React, { useEffect, useState } from 'react'
import { AlertaDistraicao } from './componentes/AlertaDistraicao'
import { IndicadorPomodoroCompacto } from './componentes/IndicadorPomodoroCompacto'
import { ModuloConfiguracoes } from './componentes/ModuloConfiguracoes'
import { ModuloEstatisticas } from './componentes/ModuloEstatisticas'
import { ModuloPomodoro } from './componentes/ModuloPomodoro'
import { ModuloRotina } from './componentes/ModuloRotina'
import {
  CHAVE_ONBOARDING_CONCLUIDO,
  OnboardingPrimeiraAbertura
} from './componentes/OnboardingPrimeiraAbertura'
import { NavegacaoInferiorMobile, Sidebar, type AbaPainel } from './componentes/Sidebar'
import { ProvedorPomodoro } from './contextos/ContextoPomodoro'
import { ProvedorTema } from './contextos/ContextoTema'
import { ProvedorToasts } from './contextos/ContextoToasts'

function App(): React.JSX.Element {
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>('pomodoro')
  const [alertaDistraicaoAberto, setAlertaDistraicaoAberto] = useState(false)
  const [mostrarOnboarding, setMostrarOnboarding] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_ONBOARDING_CONCLUIDO) !== '1'
    } catch {
      return true
    }
  })

  useEffect(() => {
    return window.api.aoAtividadeMonitor((evento) => {
      if (evento.tipo !== 'distraction_detected') return
      setAlertaDistraicaoAberto(true)
    })
  }, [])

  const fecharOnboarding = (): void => {
    setMostrarOnboarding(false)
  }

  return (
    <ProvedorTema>
      <ProvedorToasts>
        <ProvedorPomodoro>
          <div className="flex h-screen w-screen overflow-hidden bg-fundo text-texto">
            <Sidebar abaAtiva={abaAtiva} aoMudarAba={setAbaAtiva} />

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className={[
                'flex flex-1 flex-col overflow-y-auto px-5 py-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-10 sm:py-8 md:pb-6 scrollbar-fina'
              ].join(' ')}>
                <div className={[
                  'mx-auto w-full',
                  (abaAtiva === 'pomodoro' || abaAtiva === 'rotina') ? 'max-w-4xl' : 'max-w-3xl',
                  abaAtiva === 'pomodoro' ? 'my-auto' : ''
                ].join(' ')}>
                  {abaAtiva === 'pomodoro' && <ModuloPomodoro />}
                  {abaAtiva === 'rotina' && <ModuloRotina />}
                  {abaAtiva === 'estatisticas' && <ModuloEstatisticas />}
                  {abaAtiva === 'configuracoes' && <ModuloConfiguracoes />}
                </div>
              </div>
            </main>

            <NavegacaoInferiorMobile abaAtiva={abaAtiva} aoMudarAba={setAbaAtiva} />

            {alertaDistraicaoAberto && (
              <AlertaDistraicao aoFechar={() => setAlertaDistraicaoAberto(false)} />
            )}

            {mostrarOnboarding ? <OnboardingPrimeiraAbertura aoConcluir={fecharOnboarding} /> : null}

            <IndicadorPomodoroCompacto aoAbrirPomodoro={() => setAbaAtiva('pomodoro')} />
          </div>
        </ProvedorPomodoro>
      </ProvedorToasts>
    </ProvedorTema>
  )
}

export default App
