import {
  formatarTempoPomodoro,
  pomodoroSessaoVisivel,
  segmentoPomodoroUI,
  usePomodoro,
  type SegmentoPomodoroUI
} from '../contextos/ContextoPomodoro'

type Props = {
  aoAbrirPomodoro: () => void
}

const ROTULO_SEGMENTO: Record<SegmentoPomodoroUI, string> = {
  foco: 'Foco',
  pausa_curta: 'Pausa curta',
  pausa_longa: 'Pausa longa'
}

function IconeFase({ segmento }: { segmento: SegmentoPomodoroUI }): React.JSX.Element {
  if (segmento === 'foco') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-6 shrink-0 text-primaria"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }
  if (segmento === 'pausa_curta') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-6 shrink-0 text-secundaria"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-6 shrink-0 text-pausa-longa"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

export function IndicadorPomodoroCompacto({ aoAbrirPomodoro }: Props): React.JSX.Element | null {
  const { estado, despachar } = usePomodoro()

  if (!pomodoroSessaoVisivel(estado)) return null

  const segmento = segmentoPomodoroUI(estado)
  const pausado = !estado.rodando

  return (
    <div
      className={[
        'select-app-chrome fixed right-5 z-50 flex items-stretch overflow-hidden rounded-[var(--radius-card)] border border-borda bg-superficie/95 shadow-[var(--shadow-app-card)] backdrop-blur-md md:bottom-5',
        'bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'
      ].join(' ')}
    >
      <button
        type="button"
        onClick={aoAbrirPomodoro}
        title="Abrir Foco"
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primaria/35"
      >
        <IconeFase segmento={segmento} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-lg font-bold tabular-nums tracking-tight text-texto">
            {formatarTempoPomodoro(estado.restante)}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-texto-mudo">
            {ROTULO_SEGMENTO[segmento]}
            {pausado ? ' · pausado' : ''}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          despachar({ tipo: 'alternar_rodando' })
        }}
        title={estado.rodando ? 'Pausar timer' : 'Retomar timer'}
        aria-label={estado.rodando ? 'Pausar timer' : 'Retomar timer'}
        className="flex shrink-0 items-center border-s border-borda bg-superficie-elevada/80 px-3 transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primaria/35"
      >
        {estado.rodando ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 text-texto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 5h4v14h-4V5zm8 0h4v14h-4V5" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 text-texto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
