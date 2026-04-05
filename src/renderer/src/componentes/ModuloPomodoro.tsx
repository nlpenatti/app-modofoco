import { useCallback, useEffect, useReducer, useState } from 'react'

type FasePomodoro = 'foco' | 'pausa'

type EstadoPomodoro = {
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

type LinhaRegistroAtividade = {
  id: string
  tituloJanela: string
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

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatarInstante(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const MAX_REGISTROS = 24

export function ModuloPomodoro(): React.JSX.Element {
  const [estado, despachar] = useReducer(reducerPomodoro, estadoInicial)
  const [monitorDistracoesAtivo, setMonitorDistracoesAtivo] = useState(true)
  const [avisoMonitor, setAvisoMonitor] = useState<string | null>(null)
  const [registrosAtividade, setRegistrosAtividade] = useState<LinhaRegistroAtividade[]>([])

  const monitorDeveRodar =
    monitorDistracoesAtivo && estado.rodando && estado.fase === 'foco'

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
          id: `${evento.instante}-${evento.tituloJanela.slice(0, 24)}`,
          tituloJanela: evento.tituloJanela,
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

  return (
    <div className="space-y-5">
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-amber-400"
          checked={monitorDistracoesAtivo}
          onChange={(e) => setMonitorDistracoesAtivo(e.target.checked)}
        />
        <span>
          <span className="font-semibold">Monitorar distrações durante o foco (Windows)</span>
          <span className="mt-1 block text-xs font-normal text-amber-900/90">
            Enquanto o tempo de <strong>foco</strong> estiver rodando, avisamos se a janela em
            primeiro plano parecer YouTube, redes sociais ou streaming (pelo título). Não bloqueia
            sites no navegador.
          </span>
        </span>
      </label>

      {avisoMonitor && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          {avisoMonitor}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => despachar({ tipo: 'preset', focoMin: 25, pausaMin: 5 })}
          className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
        >
          Clássico 25/5
        </button>
        <button
          type="button"
          onClick={() => despachar({ tipo: 'preset', focoMin: 50, pausaMin: 10 })}
          className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
        >
          Bloco longo 50/10
        </button>
        <button
          type="button"
          onClick={() => despachar({ tipo: 'preset', focoMin: 15, pausaMin: 3 })}
          className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50"
        >
          Leve 15/3
        </button>
      </div>

      <div
        className={[
          'rounded-3xl border-2 p-8 text-center shadow-inner',
          estado.fase === 'foco'
            ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-white'
            : 'border-sky-300 bg-gradient-to-br from-sky-50 to-white'
        ].join(' ')}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          {estado.fase === 'foco' ? 'Foco' : 'Pausa'}
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tabular-nums text-slate-900">
          {formatarTempo(estado.restante)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => despachar({ tipo: 'alternar_rodando' })}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
        >
          {estado.rodando ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          type="button"
          onClick={() => despachar({ tipo: 'zerar_fase' })}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Zerar fase
        </button>
      </div>

      {registrosAtividade.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Atividade detectada (foco)</h3>
          <p className="mt-1 text-xs text-slate-600">
            Janelas em primeiro plano que pareciam distração (amostra recente).
          </p>
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-700">
            {registrosAtividade.map((r) => (
              <li key={r.id} className="rounded-lg border border-white bg-white/90 px-2 py-1.5">
                <span className="text-slate-500">{formatarInstante(r.instante)}</span>
                <span className="mt-0.5 block truncate font-medium text-slate-900" title={r.tituloJanela}>
                  {r.tituloJanela}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Na pausa, use água e alongamento; o monitor de distrações só roda na fase de foco.
      </p>
    </div>
  )
}
