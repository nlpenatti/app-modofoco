import {
  formatarTempoPomodoro,
  pomodoroSessaoVisivel,
  usePomodoro
} from '../contextos/ContextoPomodoro'

type Props = {
  aoAbrirPomodoro: () => void
}

export function IndicadorPomodoroCompacto({ aoAbrirPomodoro }: Props): React.JSX.Element | null {
  const { estado } = usePomodoro()

  if (!pomodoroSessaoVisivel(estado)) return null

  const foco = estado.fase === 'foco'
  const pausado = !estado.rodando

  return (
    <button
      type="button"
      onClick={aoAbrirPomodoro}
      title="Abrir Pomodoro"
      className={[
        'fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md transition hover:brightness-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2',
        foco
          ? 'border-teal-200/90 bg-teal-50/95 text-teal-950'
          : 'border-sky-200/90 bg-sky-50/95 text-sky-950'
      ].join(' ')}
    >
      <span className="text-xl leading-none" aria-hidden>
        {foco ? '🍅' : '☕'}
      </span>
      <span className="flex flex-col items-start gap-0.5 text-left">
        <span className="font-mono text-lg font-semibold tabular-nums tracking-tight">
          {formatarTempoPomodoro(estado.restante)}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
          {foco ? 'Foco' : 'Pausa'}
          {pausado ? ' · pausado' : ''}
        </span>
      </span>
    </button>
  )
}
