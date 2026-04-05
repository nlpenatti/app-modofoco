import { motion } from 'framer-motion'
import { useState } from 'react'
import { useToasts } from '../contextos/ContextoToasts'

export function PainelInicio(): React.JSX.Element {
  const { mostrarToast } = useToasts()
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [carregando, setCarregando] = useState(false)

  const executarAcao = async (
    nome: string,
    promessa: Promise<{ ok: boolean; motivo?: string }>
  ): Promise<void> => {
    setCarregando(true)
    try {
      const r = await promessa
      if (!r.ok) {
        mostrarToast(r.motivo ?? `Erro ao executar ${nome}.`, 'erro')
      }
    } catch {
      mostrarToast(`Erro ao solicitar ${nome}.`, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="relative">
          <label htmlFor="Search" className="sr-only">
            Pesquisar
          </label>

          <input
            type="text"
            id="Search"
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              void executarAcao('pesquisa', window.api.pesquisarNaWeb(termoPesquisa))
            }
            placeholder="Dúvida rápida? Pesquisa aqui…"
            className="selecionavel w-full rounded-[var(--radius-card)] border border-borda bg-superficie py-3 pe-12 ps-4 text-sm text-texto shadow-[var(--shadow-app-soft)] outline-none transition placeholder:text-texto-mudo focus:border-primaria/45 focus:ring-2 focus:ring-primaria/20"
          />

          <span className="absolute inset-y-0 end-0 grid w-12 place-content-center">
            <motion.button
              type="button"
              disabled={carregando}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                void executarAcao('pesquisa', window.api.pesquisarNaWeb(termoPesquisa))
              }
              className="rounded-xl p-2 text-texto-mudo transition-colors hover:bg-superficie-elevada hover:text-primaria disabled:opacity-50"
            >
              <span className="sr-only">Pesquisar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </motion.button>
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="group relative overflow-hidden rounded-[var(--radius-card-lg)] border border-borda bg-superficie p-6 shadow-[var(--shadow-app-card)]"
        >
          <span
            className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-br from-primaria/45 to-secundaria/30 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <h3 className="font-display text-lg font-semibold text-texto">Ferramentas</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-texto-mudo">
              Atalhos para não perder o fio da meada.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <motion.button
                disabled={carregando}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => void executarAcao('calculadora', window.api.abrirCalculadora())}
                className="inline-flex items-center rounded-2xl bg-primaria px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-app-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/45 disabled:opacity-50"
              >
                Calculadora
              </motion.button>

              <motion.button
                disabled={carregando}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  void executarAcao('pasta de estudos', window.api.abrirPastaEstudos())
                }
                className="inline-flex items-center rounded-2xl border border-borda bg-superficie-elevada px-4 py-2 text-xs font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/25 disabled:opacity-50"
              >
                Pasta de estudos
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="group relative overflow-hidden rounded-[var(--radius-card-lg)] border border-borda bg-superficie p-6 shadow-[var(--shadow-app-card)]"
        >
          <span
            className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-gradient-to-br from-destaque/55 to-primaria/25 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <h3 className="font-display text-lg font-semibold text-texto">Ambiente</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-texto-mudo">
              Deixa a mesa limpa antes do bloco de estudo.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <motion.button
                disabled={carregando}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => void executarAcao('limpar mesa', window.api.minimizarTodasJanelas())}
                className="inline-flex items-center rounded-2xl bg-destaque px-4 py-2 text-xs font-semibold text-texto shadow-[var(--shadow-app-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque/50 disabled:opacity-50"
              >
                Limpar área (Win+D)
              </motion.button>

              <motion.button
                disabled={carregando}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => void executarAcao('alternar mudo', window.api.alternarMudo())}
                className="inline-flex items-center rounded-2xl border border-borda bg-superficie-elevada px-4 py-2 text-xs font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque/35 disabled:opacity-50"
              >
                Alternar mudo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-borda bg-superficie-elevada p-6 shadow-[var(--shadow-app-soft)]">
        <h3 className="text-sm font-semibold text-texto">Dicas</h3>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-texto selecionavel">
          <li className="flex gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primaria" aria-hidden />
            <span>
              Com o timer em <strong className="text-texto">foco</strong>, se o app notar um
              desvio comum, ele te chama de volta com um lembrete discreto.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destaque" aria-hidden />
            <span>
              Antes do bloco, use <strong className="text-texto">Limpar área</strong> para só
              ficar com o que importa na tela.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
