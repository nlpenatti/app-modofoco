import { motion } from 'framer-motion'
import React from 'react'
import logo from '../assets/logo.png'

export type AbaPainel = 'pomodoro' | 'rotina' | 'estatisticas' | 'configuracoes'

type Props = {
  abaAtiva: AbaPainel
  aoMudarAba: (aba: AbaPainel) => void
  versaoNova?: string | null
}

const abas: { id: AbaPainel; rotulo: string; icone: React.ReactNode }[] = [
  {
    id: 'pomodoro',
    rotulo: 'Foco',
    icone: (
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  },
  {
    id: 'rotina',
    rotulo: 'Tarefas',
    icone: (
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    )
  },
  {
    id: 'estatisticas',
    rotulo: 'Estatísticas',
    icone: (
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    )
  },
  {
    id: 'configuracoes',
    rotulo: 'Ajustes',
    icone: (
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    )
  }
]

export function Sidebar({ abaAtiva, aoMudarAba, versaoNova }: Props): React.JSX.Element {
  const instalarAgora = (): void => {
    window.api.instalarAtualizacao()
  }

  return (
    <aside className="select-app-chrome hidden h-full w-[6.25rem] shrink-0 flex-col border-e border-borda bg-superficie/90 backdrop-blur-md md:flex">
      <div className="flex h-full flex-col items-center px-1.5 pb-4 pt-6">
        <div
          className="grid size-20 place-content-center"
          title="Modo Foco"
        >
          <img src={logo} alt="Logo Modo Foco" className="size-full object-contain" />
        </div>

        <p className="mt-5 px-0.5 text-center text-[8px] font-semibold uppercase leading-tight tracking-[0.1em] text-texto-mudo">
          Menu
        </p>
        <nav className="relative mt-2 flex w-full flex-col gap-0.5" aria-label="Navegação principal">
          {abas.map(({ id, rotulo, icone }) => {
            const ativa = abaAtiva === id
            return (
              <div key={id} className="relative">
                {ativa ? (
                  <motion.span
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-2xl bg-primaria/12 ring-1 ring-primaria/25"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    aria-hidden
                  />
                ) : null}
                <button
                  type="button"
                  title={rotulo}
                  onClick={() => aoMudarAba(id)}
                  className={[
                    'relative z-10 flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2.5 transition-colors hover-elevate',
                    ativa ? 'text-primaria' : 'text-texto-mudo hover:text-texto'
                  ].join(' ')}
                >
                  {icone}
                  <span className="max-w-[5rem] text-center text-[11px] font-semibold leading-tight">
                    {rotulo}
                  </span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Botão de Atualização Bonitinho */}
        <div className="mt-auto flex w-full flex-col items-center gap-4">
          {versaoNova && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              type="button"
              onClick={instalarAgora}
              className="group relative flex size-14 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-primaria/10 text-primaria transition-all hover:bg-primaria hover:text-white"
              title={`Nova versão ${versaoNova} pronta para instalar!`}
            >
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </motion.div>
              <span className="text-[8px] font-bold uppercase tracking-tighter">Update</span>
              
              {/* Dot de notificação */}
              <span className="absolute right-3 top-3 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primaria opacity-75 group-hover:bg-white"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primaria group-hover:bg-white"></span>
              </span>
            </motion.button>
          )}

          <div className="h-px w-8 bg-borda/40" />
        </div>
      </div>
    </aside>
  )
}

export function NavegacaoInferiorMobile({ abaAtiva, aoMudarAba, versaoNova }: Props): React.JSX.Element {
  const instalarAgora = (): void => {
    window.api.instalarAtualizacao()
  }

  return (
    <nav
      className="select-app-chrome fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-borda bg-superficie/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
    >
      {abas.map(({ id, rotulo, icone }) => {
        const ativa = abaAtiva === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => aoMudarAba(id)}
            className={[
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 motion-safe:hover:scale-[1.03]',
              ativa ? 'text-primaria' : 'text-texto-mudo'
            ].join(' ')}
          >
            <span
              className={[
                'flex size-10 items-center justify-center rounded-2xl transition-colors',
                ativa ? 'bg-primaria/14 text-primaria' : ''
              ].join(' ')}
            >
              <span className={ativa ? 'scale-105' : ''}>{icone}</span>
            </span>
            <span className="line-clamp-2 max-w-[4.25rem] text-center text-[9px] font-semibold leading-tight">
              {rotulo}
            </span>
          </button>
        )
      })}

      {versaoNova && (
        <button
          type="button"
          onClick={instalarAgora}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 transition active:scale-95 text-primaria"
        >
          <span className="relative flex size-10 items-center justify-center rounded-2xl bg-primaria/20">
             <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             <span className="absolute -right-1 -top-1 flex h-3 w-3">
               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primaria opacity-75"></span>
               <span className="relative inline-flex h-3 w-3 rounded-full bg-primaria border-2 border-superficie"></span>
             </span>
          </span>
          <span className="text-[9px] font-bold uppercase">Update</span>
        </button>
      )}
    </nav>
  )
}
