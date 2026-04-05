import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTema } from '../contextos/ContextoTema'

export function ModuloConfiguracoes(): React.JSX.Element {
  const { tema, setTema } = useTema()
  const [versaoApp, setVersaoApp] = useState<string>('')

  useEffect(() => {
    void window.api.obterVersaoApp().then((v) => setVersaoApp(v))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 py-4"
    >
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => setTema('claro')}
            className={[
              'flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all',
              tema === 'claro'
                ? 'border-primaria bg-primaria/5 ring-1 ring-primaria'
                : 'border-borda bg-superficie hover:border-primaria/30'
            ].join(' ')}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-texto">Tema Claro</p>
              <p className="text-xs text-texto-mudo">Cores suaves e relaxantes para o dia.</p>
            </div>
          </button>

          <button
            onClick={() => setTema('escuro')}
            className={[
              'flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all',
              tema === 'escuro'
                ? 'border-primaria bg-primaria/5 ring-1 ring-primaria'
                : 'border-borda bg-superficie hover:border-primaria/30'
            ].join(' ')}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-texto">Tema Escuro</p>
              <p className="text-xs text-texto-mudo">Conforto visual para ambientes escuros.</p>
            </div>
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-superficie/50 p-6 ring-1 ring-borda">
        <h3 className="mb-2 font-display text-base font-bold text-texto">Sobre o Modo Foco</h3>
        <p className="text-sm leading-relaxed text-texto-mudo">
          Esta ferramenta foi desenvolvida para ajudar você a manter a concentração e organizar suas
          tarefas diárias usando a técnica Pomodoro.
        </p>
        <div className="mt-4 border-t border-borda pt-4">
          <p className="text-[11px] font-medium text-texto-mudo uppercase tracking-wider">Versão do Aplicativo</p>
          <p className="text-sm font-bold text-texto">{versaoApp ? `v${versaoApp}` : '…'}</p>
        </div>
      </section>
    </motion.div>
  )
}
