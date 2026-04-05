import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode
} from 'react'

type FasePomodoro = 'foco' | 'pausa'

export type EstadoPomodoro = {
  fase: FasePomodoro
  restante: number
  rodando: boolean
  duracaoFoco: number
  duracaoPausa: number
}

type AcaoPomodoro =
  | { tipo: 'tick' }
  | { tipo: 'alternar_rodando' }
  | { tipo: 'zerar_fase' }
  | { tipo: 'preset'; focoMin: number; pausaMin: number }

export type LinhaRegistroAtividade = {
  id: string
  instante: string
}

const focoPadrao = 25 * 60
const pausaPadrao = 5 * 60

const estadoInicial: EstadoPomodoro = {
  fase: 'foco',
  restante: focoPadrao,
  rodando: false,
  duracaoFoco: focoPadrao,
  duracaoPausa: pausaPadrao
}

function reducerPomodoro(estado: EstadoPomodoro, acao: AcaoPomodoro): EstadoPomodoro {
  switch (acao.tipo) {
    case 'tick': {
      if (!estado.rodando) return estado
      if (estado.restante > 1) return { ...estado, restante: estado.restante - 1 }
      const proxima: FasePomodoro = estado.fase === 'foco' ? 'pausa' : 'foco'
      const novoTempo = proxima === 'foco' ? estado.duracaoFoco : estado.duracaoPausa
      return { ...estado, fase: proxima, restante: novoTempo }
    }
    case 'alternar_rodando':
      return { ...estado, rodando: !estado.rodando }
    case 'zerar_fase':
      return {
        ...estado,
        rodando: false,
        restante: estado.fase === 'foco' ? estado.duracaoFoco : estado.duracaoPausa
      }
    case 'preset': {
      const f = acao.focoMin * 60
      const p = acao.pausaMin * 60
      return {
        ...estado,
        duracaoFoco: f,
        duracaoPausa: p,
        rodando: false,
        fase: 'foco',
        restante: f
      }
    }
    default:
      return estado
  }
}

export function formatarTempoPomodoro(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const MAX_REGISTROS = 24

type ValorContextoPomodoro = {
  estado: EstadoPomodoro
  despachar: React.Dispatch<AcaoPomodoro>
  avisoMonitor: string | null
  registrosAtividade: LinhaRegistroAtividade[]
}

const ContextoPomodoro = createContext<ValorContextoPomodoro | null>(null)

export function ProvedorPomodoro({ children }: { children: ReactNode }): React.JSX.Element {
  const [estado, despachar] = useReducer(reducerPomodoro, estadoInicial)
  const [avisoMonitor, setAvisoMonitor] = useState<string | null>(null)
  const [registrosAtividade, setRegistrosAtividade] = useState<LinhaRegistroAtividade[]>([])

  const monitorDeveRodar = estado.rodando && estado.fase === 'foco'

  const aplicarMonitorFoco = useCallback(async (ativo: boolean): Promise<void> => {
    const resultado = await window.api.definirMonitorFoco(ativo)
    if (!ativo) {
      setAvisoMonitor(null)
      return
    }
    if (!resultado.ok && resultado.motivo) {
      setAvisoMonitor(resultado.motivo)
    } else {
      setAvisoMonitor(null)
    }
  }, [])

  useEffect(() => {
    void aplicarMonitorFoco(monitorDeveRodar)
    return () => {
      void window.api.definirMonitorFoco(false)
    }
  }, [monitorDeveRodar, aplicarMonitorFoco])

  useEffect(() => {
    const encerrar = window.api.aoAtividadeMonitor((evento) => {
      if (evento.tipo !== 'distraction_detected') return
      setRegistrosAtividade((anterior) => {
        const linha: LinhaRegistroAtividade = {
          id: `${evento.instante}-${crypto.randomUUID()}`,
          instante: evento.instante
        }
        return [linha, ...anterior].slice(0, MAX_REGISTROS)
      })
    })
    return encerrar
  }, [])

  useEffect(() => {
    if (!estado.rodando) return
    const id = setInterval(() => despachar({ tipo: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [estado.rodando])

  const valor: ValorContextoPomodoro = {
    estado,
    despachar,
    avisoMonitor,
    registrosAtividade
  }

  return <ContextoPomodoro.Provider value={valor}>{children}</ContextoPomodoro.Provider>
}

export function usePomodoro(): ValorContextoPomodoro {
  const ctx = useContext(ContextoPomodoro)
  if (!ctx) {
    throw new Error('usePomodoro deve ser usado dentro de ProvedorPomodoro')
  }
  return ctx
}

/** Indicador flutuante: sessão em andamento (rodando ou pausado no meio do ciclo). */
export function pomodoroSessaoVisivel(estado: EstadoPomodoro): boolean {
  return !(
    estado.fase === 'foco' &&
    estado.restante === estado.duracaoFoco &&
    !estado.rodando
  )
}
