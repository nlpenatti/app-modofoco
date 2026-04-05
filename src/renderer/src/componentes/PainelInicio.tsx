import { useState } from 'react'

export function PainelInicio(): React.JSX.Element {
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [mensagemAtalho, setMensagemAtalho] = useState<string | null>(null)
  const [mensagemDesinstalar, setMensagemDesinstalar] = useState<string | null>(null)
  const [carregandoDesinstalar, setCarregandoDesinstalar] = useState(false)
  const [resultadoAtualizacao, setResultadoAtualizacao] = useState<{
    ok: boolean
    mensagem: string
  } | null>(null)
  const [carregandoAtualizacao, setCarregandoAtualizacao] = useState(false)

  const aoAbrirCalculadora = async (): Promise<void> => {
    setMensagemAtalho(null)
    const r = await window.api.abrirCalculadora()
    setMensagemAtalho(
      r.ok ? null : r.motivo ?? 'Não foi possível abrir a calculadora.'
    )
  }

  const aoPesquisar = async (): Promise<void> => {
    setMensagemAtalho(null)
    const r = await window.api.pesquisarNaWeb(termoPesquisa)
    if (!r.ok) {
      setMensagemAtalho(r.motivo ?? 'Não foi possível abrir o navegador.')
    }
  }

  const aoVerificarAtualizacao = async (): Promise<void> => {
    setResultadoAtualizacao(null)
    setCarregandoAtualizacao(true)
    try {
      const r = await window.api.verificarAtualizacoes()
      setResultadoAtualizacao(r)
    } catch {
      setResultadoAtualizacao({ ok: false, mensagem: 'Erro ao verificar atualizações.' })
    } finally {
      setCarregandoAtualizacao(false)
    }
  }

  const aoClicarDesinstalar = async (): Promise<void> => {
    setMensagemDesinstalar(null)
    setCarregandoDesinstalar(true)
    try {
      const resultado = await window.api.abrirDesinstalacao()
      setMensagemDesinstalar(
        resultado.motivo ??
          (resultado.ok ? 'Processo iniciado.' : 'Não foi possível abrir o desinstalador.')
      )
    } catch {
      setMensagemDesinstalar('Erro ao solicitar desinstalação.')
    } finally {
      setCarregandoDesinstalar(false)
    }
  }

  return (
    <div className="selecionavel space-y-6">
      <header>
        <h2 className="text-xl font-bold text-indigo-950">Atalhos e foco</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use a aba <strong>Rotina</strong> para a lista do dia e <strong>Pomodoro</strong> para
          temporizador com alerta de distrações (Windows). Com o <strong>setup instalado</strong>, o
          app pode buscar versões novas no seu repositório GitHub.
        </p>
      </header>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-indigo-950">Acesso rápido</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <button
            type="button"
            onClick={() => void aoAbrirCalculadora()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Abrir calculadora
          </button>
          <button
            type="button"
            disabled={carregandoAtualizacao}
            onClick={() => void aoVerificarAtualizacao()}
            className="rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-60"
          >
            {carregandoAtualizacao ? 'Verificando…' : 'Verificar atualização'}
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-md">
            <label htmlFor="pesquisa-rapida" className="text-xs font-medium text-slate-600">
              Pesquisa na web (DuckDuckGo)
            </label>
            <div className="flex gap-2">
              <input
                id="pesquisa-rapida"
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void aoPesquisar()}
                placeholder="Digite e pressione Pesquisar"
                className="selecionavel min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              />
              <button
                type="button"
                onClick={() => void aoPesquisar()}
                className="shrink-0 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-50"
              >
                Pesquisar
              </button>
            </div>
          </div>
        </div>
        {mensagemAtalho && (
          <p className="mt-2 text-xs text-rose-700">{mensagemAtalho}</p>
        )}
        {resultadoAtualizacao && (
          <p
            className={
              resultadoAtualizacao.ok ? 'mt-2 text-xs text-slate-700' : 'mt-2 text-xs text-amber-900'
            }
          >
            {resultadoAtualizacao.mensagem}
          </p>
        )}
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        <li className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Estrutura</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Quebre o dia em blocos pequenos na <strong>Rotina</strong>. Menos itens vagos, mais
            verbos concretos (ex.: “ler 10 páginas”, não “estudar”).
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Bloqueio de distrações</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            No Pomodoro, o app pode <strong>avisar</strong> quando o título da janela ativa parece
            YouTube ou redes sociais. Não fecha o navegador; para bloqueio forte seria preciso outra
            solução no sistema.
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Pausas</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Use as pausas do Pomodoro para se afastar da tela. A calculadora e a pesquisa ficam aqui
            para quando você precisar de algo rápido sem perder o fio.
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Desinstalar</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Instalação NSIS: tentamos abrir o desinstalador. Versão portátil: abrimos Configurações
            do Windows para remover manualmente.
          </p>
          <button
            type="button"
            disabled={carregandoDesinstalar}
            onClick={() => void aoClicarDesinstalar()}
            className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {carregandoDesinstalar ? 'Abrindo…' : 'Abrir desinstalação / Configurações'}
          </button>
          {mensagemDesinstalar && (
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{mensagemDesinstalar}</p>
          )}
        </li>
      </ul>
    </div>
  )
}
