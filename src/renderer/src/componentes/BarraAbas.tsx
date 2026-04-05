export type AbaPainel = 'inicio' | 'rotina' | 'pomodoro'

type Props = {
  abaAtiva: AbaPainel
  aoMudarAba: (aba: AbaPainel) => void
}

const abas: { id: AbaPainel; rotulo: string }[] = [
  { id: 'inicio', rotulo: 'Início' },
  { id: 'rotina', rotulo: 'Rotina' },
  { id: 'pomodoro', rotulo: 'Pomodoro' }
]

export function BarraAbas({ abaAtiva, aoMudarAba }: Props): React.JSX.Element {
  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border border-indigo-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-sm"
      aria-label="Seções do app"
    >
      {abas.map(({ id, rotulo }) => {
        const ativa = abaAtiva === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => aoMudarAba(id)}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold transition',
              ativa
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white/80 text-indigo-950 hover:bg-indigo-50'
            ].join(' ')}
          >
            {rotulo}
          </button>
        )
      })}
    </nav>
  )
}
