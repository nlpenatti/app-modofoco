import React, { useEffect, useState } from 'react'

export type AbaPainel = 'inicio' | 'rotina' | 'pomodoro'

type Props = {
  abaAtiva: AbaPainel
  aoMudarAba: (aba: AbaPainel) => void
}

const abas: { id: AbaPainel; rotulo: string; icone: React.ReactNode }[] = [
  {
    id: 'inicio',
    rotulo: 'Início',
    icone: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 opacity-80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    )
  },
  {
    id: 'rotina',
    rotulo: 'Rotina',
    icone: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 opacity-80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    )
  },
  {
    id: 'pomodoro',
    rotulo: 'Pomodoro',
    icone: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5 opacity-80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }
]

export function Sidebar({ abaAtiva, aoMudarAba }: Props): React.JSX.Element {
  const [versaoApp, setVersaoApp] = useState<string>('')

  useEffect(() => {
    void window.api.obterVersaoApp().then((v) => setVersaoApp(v))
  }, [])

  return (
    <div className="flex h-full w-64 flex-col justify-between border-e border-stone-200/80 bg-white/75 backdrop-blur-md">
      <div className="px-4 py-7">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 px-4 py-3 shadow-md shadow-teal-900/15">
          <span className="grid size-9 shrink-0 place-content-center rounded-xl bg-white/20 text-lg" aria-hidden>
            📚
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-white">Modo Foco</span>
            <span className="text-xs text-teal-100/90">Estude com leveza</span>
          </div>
        </div>

        <p className="mt-5 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
          Navegar
        </p>
        <ul className="mt-2 space-y-1">
          {abas.map(({ id, rotulo, icone }) => {
            const ativa = abaAtiva === id
            return (
              <li key={id}>
                <button
                  onClick={() => aoMudarAba(id)}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                    ativa
                      ? 'bg-stone-900 text-white shadow-sm shadow-stone-900/10'
                      : 'text-stone-600 hover:bg-stone-100/90 hover:text-stone-900'
                  ].join(' ')}
                >
                  {icone}
                  <span>{rotulo}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="sticky inset-x-0 bottom-0 border-t border-stone-200/70 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-stone-50/90 p-3.5 ring-1 ring-stone-200/60">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-200 text-sm font-bold text-amber-900">
            MF
          </div>

          <div className="min-w-0">
            <p className="text-xs">
              <strong className="block font-medium text-stone-800">Este app</strong>
              <span className="text-stone-500">{versaoApp ? `versão ${versaoApp}` : 'carregando…'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
