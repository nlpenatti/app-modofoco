import { formatarTempoPomodoro, usePomodoro } from '../contextos/ContextoPomodoro'
import { EditorListasBloqueio } from './EditorListasBloqueio'

function formatarInstante(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function ModuloPomodoro(): React.JSX.Element {
  const { estado, despachar, avisoMonitor, registrosAtividade } = usePomodoro()

  return (
    <div className="space-y-5">
      <EditorListasBloqueio />

      {avisoMonitor && (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-xs text-rose-800">
          {avisoMonitor}
        </p>
      )}

      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-stone-200/90 bg-stone-100/60 p-1">
        <button
          type="button"
          onClick={() => despachar({ tipo: 'preset', focoMin: 25, pausaMin: 5 })}
          className="rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-white hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
        >
          Clássico 25/5
        </button>
        <button
          type="button"
          onClick={() => despachar({ tipo: 'preset', focoMin: 50, pausaMin: 10 })}
          className="rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-white hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
        >
          Bloco longo 50/10
        </button>
        <button
          type="button"
          onClick={() => despachar({ tipo: 'preset', focoMin: 15, pausaMin: 3 })}
          className="rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-white hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
        >
          Leve 15/3
        </button>
      </div>

      <div
        className={[
          'rounded-[1.35rem] border-2 p-9 text-center shadow-[var(--shadow-app-soft)]',
          estado.fase === 'foco'
            ? 'border-teal-200/90 bg-gradient-to-b from-teal-50/90 to-emerald-50/40'
            : 'border-sky-200/90 bg-gradient-to-b from-sky-50/90 to-cyan-50/35'
        ].join(' ')}
      >
        <p className="text-sm font-medium tracking-wide text-stone-500">
          {estado.fase === 'foco' ? 'Hora de focar' : 'Respira — pausa'}
        </p>
        <p className="mt-3 font-mono text-5xl font-semibold tabular-nums tracking-tight text-stone-900 sm:text-6xl">
          {formatarTempoPomodoro(estado.restante)}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => despachar({ tipo: 'alternar_rodando' })}
          className="inline-flex justify-center rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {estado.rodando ? 'Pausar' : 'Começar'}
        </button>
        <button
          type="button"
          onClick={() => despachar({ tipo: 'zerar_fase' })}
          className="inline-flex justify-center rounded-full border border-stone-200 bg-white/90 px-6 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-teal-200 hover:bg-teal-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-2"
        >
          Zerar fase
        </button>
      </div>

      {registrosAtividade.length > 0 && (
        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-5 shadow-[var(--shadow-app-soft)] sm:p-6">
          <h3 className="text-sm font-semibold text-stone-900">Lembretes durante o foco</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            Só o horário — para você notar o ritmo, sem detalhe do que estava na tela.
          </p>
          <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto text-xs">
            {registrosAtividade.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-stone-200/70 bg-white/90 px-3.5 py-2.5 shadow-sm text-stone-600"
              >
                {formatarInstante(r.instante)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs leading-relaxed text-stone-500">
        O timer continua ao mudar de aba; use o botão flutuante ou volte aqui para pausar ou zerar.
      </p>
    </div>
  )
}
