import { useState } from 'react'

export function PainelInicio(): React.JSX.Element {
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const executarAcao = async (
    nome: string,
    promessa: Promise<{ ok: boolean; motivo?: string }>
  ): Promise<void> => {
    setMensagemStatus(null)
    setCarregando(true)
    try {
      const r = await promessa
      if (!r.ok) {
        setMensagemStatus(r.motivo ?? `Erro ao executar ${nome}.`)
      }
    } catch {
      setMensagemStatus(`Erro ao solicitar ${nome}.`)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="relative">
          <label htmlFor="Search" className="sr-only"> Pesquisar </label>

          <input
            type="text"
            id="Search"
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void executarAcao('pesquisa', window.api.pesquisarNaWeb(termoPesquisa))}
            placeholder="Dúvida rápida? Pesquisa aqui…"
            className="selecionavel w-full rounded-2xl border border-stone-200/90 bg-stone-50/50 py-3 pe-12 ps-4 text-sm text-stone-800 shadow-inner shadow-stone-900/5 outline-none transition-[box-shadow,border-color] placeholder:text-stone-400 focus:border-teal-400/70 focus:bg-white focus:ring-2 focus:ring-teal-500/25"
          />

          <span className="absolute inset-y-0 end-0 grid w-12 place-content-center">
            <button
              type="button"
              disabled={carregando}
              onClick={() => void executarAcao('pesquisa', window.api.pesquisarNaWeb(termoPesquisa))}
              className="rounded-xl p-2 text-stone-500 transition-colors hover:bg-white hover:text-teal-700 disabled:opacity-50"
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
            </button>
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-teal-50/40 p-6 shadow-[var(--shadow-app-soft)] transition hover:border-teal-200/60">
          <h3 className="text-lg font-semibold text-stone-900">Ferramentas</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
            Atalhos para não perder o fio da meada.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              disabled={carregando}
              onClick={() => void executarAcao('calculadora', window.api.abrirCalculadora())}
              className="inline-flex items-center rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-900/15 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Calculadora
            </button>

            <button
              disabled={carregando}
              onClick={() => void executarAcao('pasta de estudos', window.api.abrirPastaEstudos())}
              className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:border-teal-200 hover:bg-teal-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Pasta de estudos
            </button>
          </div>
        </div>

        <div className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-amber-50/35 p-6 shadow-[var(--shadow-app-soft)] transition hover:border-amber-200/70">
          <h3 className="text-lg font-semibold text-stone-900">Ambiente</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
            Deixa a mesa limpa antes do bloco de estudo.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              disabled={carregando}
              onClick={() => void executarAcao('limpar mesa', window.api.minimizarTodasJanelas())}
              className="inline-flex items-center rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-amber-950 shadow-sm shadow-amber-900/10 transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Limpar área (Win+D)
            </button>

            <button
              disabled={carregando}
              onClick={() => void executarAcao('alternar mudo', window.api.alternarMudo())}
              className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-200 hover:bg-amber-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Alternar mudo
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Status */}
      {mensagemStatus && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-4 shadow-sm"
        >
          <p className="text-sm text-rose-800">{mensagemStatus}</p>
        </div>
      )}

      <div className="rounded-2xl bg-stone-100/80 p-6 ring-1 ring-stone-200/60">
        <h3 className="text-sm font-semibold text-stone-800">Dicas</h3>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
          <li className="flex gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
            <span>
              Com o Pomodoro em <strong className="text-stone-900">foco</strong>, se o app notar um desvio
              comum, ele te chama de volta com um lembrete discreto.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
            <span>
              Antes do bloco, use <strong className="text-stone-900">Limpar área</strong> para só ficar com o que
              importa na tela.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
