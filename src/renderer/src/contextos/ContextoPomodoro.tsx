import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from 'react'
import {
  acrescentarFocoConcluidoNoHistorico,
  carregarHistoricoFocosConcluidos,
  limparArmazenamentoHistoricoFocos,
  type EntradaHistoricoFoco
} from '../utilHistoricoPomodoro'

export type FasePomodoro = 'foco' | 'pausa'

export type TipoPausaPomodoro = 'curta' | 'longa'

export type ModoEstudo = 'pomodoro' | 'cronometro'

export type EstadoCronometro = {
  decorrido: number
  rodando: boolean
}

export type SegmentoPomodoroUI = 'foco' | 'pausa_curta' | 'pausa_longa'

export type EstadoPomodoro = {
  fase: FasePomodoro
  tipoPausa: TipoPausaPomodoro
  restante: number
  rodando: boolean
  duracaoFoco: number
  duracaoPausa: number
  duracaoPausaLonga: number
}

type AcaoPomodoro =
  | { tipo: 'tick' }
  | { tipo: 'alternar_rodando' }
  | { tipo: 'zerar_fase' }
  | { tipo: 'preset'; focoMin: number; pausaMin: number; pausaLongaMin?: number }
  | { tipo: 'selecionar_segmento'; segmento: SegmentoPomodoroUI }
  | { tipo: 'ajustar_duracoes'; focoMin: number; pausaMin: number; pausaLongaMin: number }

export type LinhaRegistroAtividade = {
  id: string
  instante: string
  tituloJanela?: string
  indicador?: string
}

export type { EntradaHistoricoFoco }

const focoPadrao = 25 * 60
const pausaPadrao = 5 * 60
const pausaLongaPadrao = 15 * 60

const estadoInicial: EstadoPomodoro = {
  fase: 'foco',
  tipoPausa: 'curta',
  restante: focoPadrao,
  rodando: false,
  duracaoFoco: focoPadrao,
  duracaoPausa: pausaPadrao,
  duracaoPausaLonga: pausaLongaPadrao
}

const CHAVE_ARMAZENAMENTO_POMODORO = 'modo-foco-pomodoro-v1'
const CHAVE_ARMAZENAMENTO_REGISTROS = 'modo-foco-registros-atividade-v1'
const CHAVE_ARMAZENAMENTO_CRONOMETRO = 'modo-foco-cronometro-v1'
const CHAVE_ARMAZENAMENTO_MODO_ESTUDO = 'modo-foco-modo-estudo-v1'
const SEGUNDOS_MAXIMO_RECUPERACAO = 48 * 3600

const MAX_REGISTROS = 50

type BlobPersistenciaPomodoro = {
  v: 2
  estado: EstadoPomodoro
  salvoEm: number
}

function carregarRegistrosAtividade(): LinhaRegistroAtividade[] {
  try {
    const json = localStorage.getItem(CHAVE_ARMAZENAMENTO_REGISTROS)
    if (!json) return []
    const dados = JSON.parse(json)
    if (!Array.isArray(dados)) return []
    return dados
  } catch {
    return []
  }
}

function salvarRegistrosAtividade(registros: LinhaRegistroAtividade[]): void {
  localStorage.setItem(CHAVE_ARMAZENAMENTO_REGISTROS, JSON.stringify(registros))
}

/** Duração total do segmento atual (foco ou tipo de pausa). */
export function duracaoSegmentoAtual(estado: EstadoPomodoro): number {
  if (estado.fase === 'foco') return estado.duracaoFoco
  return estado.tipoPausa === 'longa' ? estado.duracaoPausaLonga : estado.duracaoPausa
}

export function segmentoPomodoroUI(estado: EstadoPomodoro): SegmentoPomodoroUI {
  if (estado.fase === 'foco') return 'foco'
  return estado.tipoPausa === 'longa' ? 'pausa_longa' : 'pausa_curta'
}

function simularTicksPomodoro(estado: EstadoPomodoro, ticks: number): EstadoPomodoro {
  let e = estado
  const n = Math.max(0, Math.floor(ticks))
  for (let i = 0; i < n; i++) {
    if (e.restante > 1) {
      e = { ...e, restante: e.restante - 1 }
    } else if (e.fase === 'foco') {
      e = {
        ...e,
        fase: 'pausa',
        tipoPausa: 'curta',
        restante: e.duracaoPausa
      }
    } else {
      e = {
        ...e,
        fase: 'foco',
        tipoPausa: 'curta',
        restante: e.duracaoFoco
      }
    }
  }
  return e
}

function parsearEstadoPomodoro(bruto: unknown): EstadoPomodoro | null {
  if (typeof bruto !== 'object' || bruto === null) return null
  const o = bruto as Record<string, unknown>
  if (o.fase !== 'foco' && o.fase !== 'pausa') return null
  const n = (x: unknown): number | null =>
    typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : null
  const restante = n(o.restante)
  const duracaoFoco = n(o.duracaoFoco)
  const duracaoPausa = n(o.duracaoPausa)
  const duracaoPausaLonga = n(o.duracaoPausaLonga) ?? pausaLongaPadrao
  const tipoPausa: TipoPausaPomodoro = o.tipoPausa === 'longa' ? 'longa' : 'curta'
  if (restante === null || duracaoFoco === null || duracaoPausa === null) return null
  if (restante === 0 || duracaoFoco === 0 || duracaoPausa === 0 || duracaoPausaLonga === 0)
    return null
  const teto =
    o.fase === 'foco' ? duracaoFoco : tipoPausa === 'longa' ? duracaoPausaLonga : duracaoPausa
  return {
    fase: o.fase,
    tipoPausa,
    restante: Math.min(restante, teto),
    rodando: o.rodando === true,
    duracaoFoco,
    duracaoPausa,
    duracaoPausaLonga
  }
}

function hidratarEstadoPomodoro(): EstadoPomodoro {
  try {
    const json = localStorage.getItem(CHAVE_ARMAZENAMENTO_POMODORO)
    if (!json) return estadoInicial
    const dados = JSON.parse(json) as unknown
    if (typeof dados !== 'object' || dados === null) return estadoInicial
    const blob = dados as { v?: number; estado?: unknown; salvoEm?: number }
    const salvoEm =
      typeof blob.salvoEm === 'number' && Number.isFinite(blob.salvoEm) ? blob.salvoEm : Date.now()

    switch (blob.v) {
      case 2:
      case 1: {
        if (blob.estado === undefined) return estadoInicial
        const base = parsearEstadoPomodoro(blob.estado)
        if (!base) return estadoInicial
        if (!base.rodando) return base
        const decorridos = Math.min(
          Math.max(0, Math.floor((Date.now() - salvoEm) / 1000)),
          SEGUNDOS_MAXIMO_RECUPERACAO
        )
        return simularTicksPomodoro(base, decorridos)
      }
      default:
        return estadoInicial
    }
  } catch {
    return estadoInicial
  }
}

function salvarEstadoPomodoro(estado: EstadoPomodoro): void {
  const blob: BlobPersistenciaPomodoro = { v: 2, estado, salvoEm: Date.now() }
  localStorage.setItem(CHAVE_ARMAZENAMENTO_POMODORO, JSON.stringify(blob))
}

type BlobPersistenciaCronometro = {
  v: 1
  decorrido: number
  rodando: boolean
  salvoEm: number
}

function hidratarEstadoCronometro(): EstadoCronometro {
  try {
    const json = localStorage.getItem(CHAVE_ARMAZENAMENTO_CRONOMETRO)
    if (!json) return { decorrido: 0, rodando: false }
    const blob = JSON.parse(json) as BlobPersistenciaCronometro
    if (blob.v !== 1) return { decorrido: 0, rodando: false }
    const decorrido =
      typeof blob.decorrido === 'number' ? Math.max(0, Math.floor(blob.decorrido)) : 0
    if (!blob.rodando) return { decorrido, rodando: false }
    const delta = Math.max(0, Math.floor((Date.now() - blob.salvoEm) / 1000))
    return { decorrido: decorrido + delta, rodando: true }
  } catch {
    return { decorrido: 0, rodando: false }
  }
}

function salvarEstadoCronometro(crono: EstadoCronometro): void {
  const blob: BlobPersistenciaCronometro = {
    v: 1,
    decorrido: crono.decorrido,
    rodando: crono.rodando,
    salvoEm: Date.now()
  }
  localStorage.setItem(CHAVE_ARMAZENAMENTO_CRONOMETRO, JSON.stringify(blob))
}

function carregarModoEstudo(): ModoEstudo {
  try {
    const v = localStorage.getItem(CHAVE_ARMAZENAMENTO_MODO_ESTUDO)
    return v === 'cronometro' ? 'cronometro' : 'pomodoro'
  } catch {
    return 'pomodoro'
  }
}

function reducerPomodoro(estado: EstadoPomodoro, acao: AcaoPomodoro): EstadoPomodoro {
  switch (acao.tipo) {
    case 'tick': {
      if (!estado.rodando) return estado
      if (estado.restante > 1) return { ...estado, restante: estado.restante - 1 }
      if (estado.fase === 'foco') {
        return {
          ...estado,
          fase: 'pausa',
          tipoPausa: 'curta',
          restante: estado.duracaoPausa
        }
      }
      return {
        ...estado,
        fase: 'foco',
        tipoPausa: 'curta',
        restante: estado.duracaoFoco
      }
    }
    case 'alternar_rodando':
      return { ...estado, rodando: !estado.rodando }
    case 'zerar_fase':
      return {
        ...estado,
        rodando: false,
        restante: duracaoSegmentoAtual(estado)
      }
    case 'selecionar_segmento': {
      const { segmento } = acao
      if (segmento === 'foco') {
        return {
          ...estado,
          rodando: false,
          fase: 'foco',
          tipoPausa: 'curta',
          restante: estado.duracaoFoco
        }
      }
      if (segmento === 'pausa_curta') {
        return {
          ...estado,
          rodando: false,
          fase: 'pausa',
          tipoPausa: 'curta',
          restante: estado.duracaoPausa
        }
      }
      return {
        ...estado,
        rodando: false,
        fase: 'pausa',
        tipoPausa: 'longa',
        restante: estado.duracaoPausaLonga
      }
    }
    case 'preset': {
      const f = acao.focoMin * 60
      const p = acao.pausaMin * 60
      const pl = (acao.pausaLongaMin ?? 15) * 60
      return {
        ...estado,
        duracaoFoco: f,
        duracaoPausa: p,
        duracaoPausaLonga: pl,
        rodando: false,
        fase: 'foco',
        tipoPausa: 'curta',
        restante: f
      }
    }
    case 'ajustar_duracoes': {
      const f = acao.focoMin * 60
      const p = acao.pausaMin * 60
      const pl = acao.pausaLongaMin * 60
      let r = estado.restante
      if (!estado.rodando) {
        if (estado.fase === 'foco') r = f
        else if (estado.tipoPausa === 'curta') r = p
        else r = pl
      }
      return {
        ...estado,
        duracaoFoco: f,
        duracaoPausa: p,
        duracaoPausaLonga: pl,
        restante: r
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

export function formatarTempoCronometro(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type ValorContextoPomodoro = {
  estado: EstadoPomodoro
  despachar: React.Dispatch<AcaoPomodoro>
  avisoMonitor: string | null
  registrosAtividade: LinhaRegistroAtividade[]
  historicoFocosConcluidos: EntradaHistoricoFoco[]
  limparHistoricoFocos: () => void
  modoEstudo: ModoEstudo
  definirModoEstudo: (modo: ModoEstudo) => void
  cronometro: EstadoCronometro
  alternarCronometro: () => void
  zerarCronometro: () => void
}

const ContextoPomodoro = createContext<ValorContextoPomodoro | null>(null)

export function ProvedorPomodoro({ children }: { children: ReactNode }): React.JSX.Element {
  const [estado, despachar] = useReducer(reducerPomodoro, undefined, hidratarEstadoPomodoro)
  const [avisoMonitor, setAvisoMonitor] = useState<string | null>(null)
  const [registrosAtividade, setRegistrosAtividade] = useState<LinhaRegistroAtividade[]>(() =>
    carregarRegistrosAtividade()
  )
  const [historicoFocosConcluidos, setHistoricoFocosConcluidos] = useState<
    EntradaHistoricoFoco[]
  >(() => carregarHistoricoFocosConcluidos())
  const refEstadoAnterior = useRef<EstadoPomodoro | null>(null)
  const [modoEstudo, setModoEstudoInterno] = useState<ModoEstudo>(carregarModoEstudo)
  const [cronometro, setCronometro] = useState<EstadoCronometro>(hidratarEstadoCronometro)
  const refModoEstudo = useRef(modoEstudo)
  refModoEstudo.current = modoEstudo

  const monitorDeveRodar =
    (modoEstudo === 'pomodoro' && estado.rodando && estado.fase === 'foco') ||
    (modoEstudo === 'cronometro' && cronometro.rodando)

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

  // Efeito para o Modo Foco Profundo (Deep Work)
  useEffect(() => {
    if (monitorDeveRodar) {
      const deveMinimizar = localStorage.getItem('config-foco-profundo-minimizar') === '1'
      const deveAtivarDND = localStorage.getItem('config-foco-profundo-dnd') === '1'
      const allowlist = (localStorage.getItem('config-foco-profundo-allowlist') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      if (deveMinimizar) {
        void window.api.minimizarJanelasExceto(allowlist)
      }

      if (deveAtivarDND) {
        void window.api.definirNaoPerturbe(true)
      }
    } else {
      // Quando sair do foco (pausa ou stop), desativa o DND se estiver configurado
      const deveAtivarDND = localStorage.getItem('config-foco-profundo-dnd') === '1'
      if (deveAtivarDND) {
        void window.api.definirNaoPerturbe(false)
      }
    }
  }, [monitorDeveRodar])

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
          instante: evento.instante,
          tituloJanela: evento.tituloJanela,
          indicador: evento.indicador
        }
        const novo = [linha, ...anterior].slice(0, MAX_REGISTROS)
        salvarRegistrosAtividade(novo)
        return novo
      })
    })
    return encerrar
  }, [])

  useEffect(() => {
    return window.api.aoAtalhoGlobalPomodoro((payload) => {
      if (payload.acao === 'alternar_rodando') {
        if (refModoEstudo.current === 'cronometro') {
          setCronometro((prev) => ({ ...prev, rodando: !prev.rodando }))
        } else {
          despachar({ tipo: 'alternar_rodando' })
        }
      }
    })
  }, [])

  useEffect(() => {
    const anterior = refEstadoAnterior.current
    if (
      anterior !== null &&
      anterior.rodando &&
      anterior.fase !== estado.fase &&
      anterior.restante === 1
    ) {
      if (anterior.fase === 'foco' && estado.fase === 'pausa') {
        void window.api.mostrarNotificacaoSistema('Foco concluído', 'Hora da pausa.')
        setHistoricoFocosConcluidos(acrescentarFocoConcluidoNoHistorico(anterior.duracaoFoco))
      } else if (anterior.fase === 'pausa' && estado.fase === 'foco') {
        void window.api.mostrarNotificacaoSistema('Pausa encerrada', 'De volta ao foco.')
      }
    }
    refEstadoAnterior.current = estado
  }, [estado])

  useEffect(() => {
    if (!estado.rodando) return
    const id = setInterval(() => despachar({ tipo: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [estado.rodando])

  useEffect(() => {
    salvarEstadoPomodoro(estado)
  }, [estado])

  useEffect(() => {
    if (modoEstudo === 'cronometro') {
      window.api.sincronizarPomodoroComBridge({
        restante: cronometro.rodando ? 9999 : 0,
        fase: 'foco',
        tipoPausa: 'curta',
        rodando: cronometro.rodando
      })
    } else {
      window.api.sincronizarPomodoroComBridge({
        restante: estado.restante,
        fase: estado.fase,
        tipoPausa: estado.tipoPausa,
        rodando: estado.rodando
      })
    }
  }, [modoEstudo, estado, cronometro])

  const limparHistoricoFocos = useCallback((): void => {
    limparArmazenamentoHistoricoFocos()
    localStorage.removeItem(CHAVE_ARMAZENAMENTO_REGISTROS)
    setHistoricoFocosConcluidos([])
    setRegistrosAtividade([])
  }, [])

  // --- Stopwatch: tick, persistência, modo ---

  useEffect(() => {
    if (!cronometro.rodando) return
    const id = setInterval(() => {
      setCronometro((prev) => ({ ...prev, decorrido: prev.decorrido + 1 }))
    }, 1000)
    return () => clearInterval(id)
  }, [cronometro.rodando])

  useEffect(() => {
    salvarEstadoCronometro(cronometro)
  }, [cronometro])

  useEffect(() => {
    localStorage.setItem(CHAVE_ARMAZENAMENTO_MODO_ESTUDO, modoEstudo)
  }, [modoEstudo])

  const definirModoEstudo = useCallback(
    (modo: ModoEstudo): void => {
      if (modo === modoEstudo) return
      if (estado.rodando) despachar({ tipo: 'alternar_rodando' })
      if (cronometro.rodando) setCronometro((prev) => ({ ...prev, rodando: false }))
      setModoEstudoInterno(modo)
    },
    [modoEstudo, estado.rodando, cronometro.rodando]
  )

  const alternarCronometro = useCallback((): void => {
    setCronometro((prev) => ({ ...prev, rodando: !prev.rodando }))
  }, [])

  const zerarCronometro = useCallback((): void => {
    if (cronometro.decorrido >= 60) {
      setHistoricoFocosConcluidos(acrescentarFocoConcluidoNoHistorico(cronometro.decorrido))
    }
    setCronometro({ decorrido: 0, rodando: false })
  }, [cronometro.decorrido])

  const valor: ValorContextoPomodoro = {
    estado,
    despachar,
    avisoMonitor,
    registrosAtividade,
    historicoFocosConcluidos,
    limparHistoricoFocos,
    modoEstudo,
    definirModoEstudo,
    cronometro,
    alternarCronometro,
    zerarCronometro
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
  return !(estado.fase === 'foco' && estado.restante === estado.duracaoFoco && !estado.rodando)
}

export function cronometroSessaoVisivel(crono: EstadoCronometro): boolean {
  return crono.decorrido > 0 || crono.rodando
}
