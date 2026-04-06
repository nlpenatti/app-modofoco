import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { EditorListasBloqueio } from './EditorListasBloqueio'
import { useTema } from '../contextos/ContextoTema'
import { useToasts } from '../contextos/ContextoToasts'

export function ModuloConfiguracoes(): React.JSX.Element {
  const { tema, setTema } = useTema()
  const { mostrarToast } = useToasts()
  const [versaoApp, setVersaoApp] = useState<string>('')
  const [buscandoAtualizacao, setBuscandoAtualizacao] = useState(false)
  const [focoProfundoMinimizar, setFocoProfundoMinimizar] = useState(() => {
    return localStorage.getItem('config-foco-profundo-minimizar') === '1'
  })
  const [focoProfundoDND, setFocoProfundoDND] = useState(() => {
    return localStorage.getItem('config-foco-profundo-dnd') === '1'
  })
  const [allowlistJanelas, setAllowlistJanelas] = useState(() => {
    return localStorage.getItem('config-foco-profundo-allowlist') || ''
  })

  useEffect(() => {
    localStorage.setItem('config-foco-profundo-minimizar', focoProfundoMinimizar ? '1' : '0')
  }, [focoProfundoMinimizar])

  useEffect(() => {
    localStorage.setItem('config-foco-profundo-dnd', focoProfundoDND ? '1' : '0')
  }, [focoProfundoDND])

  useEffect(() => {
    localStorage.setItem('config-foco-profundo-allowlist', allowlistJanelas)
  }, [allowlistJanelas])

  useEffect(() => {
    void window.api.obterVersaoApp().then((v) => setVersaoApp(v))
  }, [])

  const buscarAtualizacoes = async (): Promise<void> => {
    if (buscandoAtualizacao) return
    setBuscandoAtualizacao(true)

    try {
      const resultado = await window.api.verificarAtualizacoes()
      if (resultado.ok) {
        mostrarToast(resultado.mensagem, 'sucesso')
      } else {
        mostrarToast(resultado.mensagem, 'erro')
      }
    } catch (err) {
      mostrarToast('Erro ao buscar atualizações.', 'erro')
    } finally {
      setBuscandoAtualizacao(false)
    }
  }

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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
        <div className="min-w-0">
          <EditorListasBloqueio />
        </div>

        <section className="min-w-0 rounded-2xl border border-borda bg-superficie/30 p-6">
          <h3 className="mb-4 font-display text-base font-bold text-texto flex items-center gap-2">
            <span className="grid size-8 place-content-center rounded-lg bg-primaria/10 text-primaria">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            Modo Foco Profundo (Deep Work)
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-texto">Auto-minimizar janelas</p>
                <p className="text-xs text-texto-mudo">Minimiza distrações automaticamente ao iniciar o foco.</p>
              </div>
              <ToggleDesign
                ativo={focoProfundoMinimizar}
                aoAlternar={() => setFocoProfundoMinimizar(!focoProfundoMinimizar)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-texto">Ativar "Não Perturbe"</p>
                <p className="text-xs text-texto-mudo">Tenta silenciar notificações do sistema durante o foco.</p>
              </div>
              <ToggleDesign
                ativo={focoProfundoDND}
                aoAlternar={() => setFocoProfundoDND(!focoProfundoDND)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-borda/40">
              <label className="text-xs font-bold uppercase tracking-wider text-texto-mudo">
                Lista de Permissão (Janelas a ignorar)
              </label>
              <input
                type="text"
                value={allowlistJanelas}
                onChange={(e) => setAllowlistJanelas(e.target.value)}
                placeholder="Ex: VS Code, ChatGPT, Docs (separados por vírgula)"
                className="w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primaria/50 focus:ring-4 focus:ring-primaria/5"
              />
              <p className="text-[10px] text-texto-mudo/60 italic">
                * O app "Modo Foco" é permitido por padrão.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-superficie/50 p-6 ring-1 ring-borda">
        <h3 className="mb-2 font-display text-base font-bold text-texto">Sobre o Modo Foco</h3>
        <p className="text-sm leading-relaxed text-texto-mudo">
          Esta ferramenta foi desenvolvida para ajudar você a manter a concentração e organizar suas
          tarefas diárias usando a técnica Pomodoro.
        </p>
        <div className="mt-4 flex flex-col gap-3 border-t border-borda pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-medium text-texto-mudo uppercase tracking-wider">Versão do Aplicativo</p>
            <p className="text-sm font-bold text-texto">{versaoApp ? `v${versaoApp}` : '…'}</p>
          </div>

          <button
            onClick={buscarAtualizacoes}
            disabled={buscandoAtualizacao}
            className={[
              'flex items-center gap-2 rounded-xl border border-borda bg-superficie px-4 py-2 text-xs font-bold text-texto transition-all hover:border-primaria/40 hover:bg-fundo active:scale-95 disabled:opacity-50',
              buscandoAtualizacao ? 'cursor-not-allowed' : 'cursor-pointer'
            ].join(' ')}
          >
            {buscandoAtualizacao ? (
              <>
                <svg className="size-3.5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Buscando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Buscar Atualizações
              </>
            )}
          </button>
        </div>
        <div className="mt-3 border-t border-borda/50 pt-3 text-[10px] leading-relaxed text-texto-mudo/55">
          <p>
            <span className="font-medium uppercase tracking-wider">Feito por</span>{' '}
            <span className="text-texto-mudo/75">Nicolas Penatti</span>
          </p>
          <p className="mt-0.5">
            <span className="font-medium uppercase tracking-wider">Com carinho para</span>{' '}
            <span className="text-texto-mudo/75">Ana Laura</span>
            <span aria-hidden="true"> ❤️</span>
          </p>
        </div>
      </section>
    </motion.div>
  )
}

function ToggleDesign({ ativo, aoAlternar }: { ativo: boolean; aoAlternar: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={aoAlternar}
      className={[
        'relative h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-primaria/10',
        ativo ? 'bg-primaria' : 'bg-borda/60'
      ].join(' ')}
    >
      <motion.span
        animate={{ x: ativo ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative z-10 block size-5 rounded-full bg-white shadow-md"
      />
      {ativo && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-full bg-primaria blur-[2px]" 
        />
      )}
    </button>
  )
}
