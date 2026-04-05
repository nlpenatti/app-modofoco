import { useEffect, useState } from 'react'
import { useToasts } from '../contextos/ContextoToasts'

type Props = {
  recolhivel?: boolean
}

function EsqueletoListas(): React.JSX.Element {
  return (
    <div className="mt-4 animate-pulse space-y-4" aria-hidden>
      <div>
        <div className="h-3 w-28 rounded bg-borda" />
        <div className="mt-2 h-[7.5rem] rounded-xl bg-superficie-elevada" />
      </div>
      <div>
        <div className="h-3 w-44 rounded bg-borda" />
        <div className="mt-2 h-[7.5rem] rounded-xl bg-superficie-elevada" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-28 rounded-full bg-borda" />
        <div className="h-9 w-40 rounded-full bg-superficie-elevada" />
      </div>
    </div>
  )
}

export function EditorListasBloqueio({ recolhivel = false }: Props): React.JSX.Element {
  const { mostrarToast } = useToasts()
  const [textoHosts, setTextoHosts] = useState('')
  const [textoIndicadores, setTextoIndicadores] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    void window.api.obterListasBloqueio().then((r) => {
      if (cancelado) return
      setCarregando(false)
      if (r.ok) {
        setTextoHosts(r.hosts.join('\n'))
        setTextoIndicadores(r.indicadoresTituloJanela.join('\n'))
      } else {
        mostrarToast(r.motivo, 'erro')
      }
    })
    return () => {
      cancelado = true
    }
  }, [mostrarToast])

  const salvar = async (): Promise<void> => {
    const hosts = textoHosts
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const indicadoresTituloJanela = textoIndicadores
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const r = await window.api.salvarListasBloqueio({ hosts, indicadoresTituloJanela })
    if (r.ok) {
      setTextoHosts(r.hosts.join('\n'))
      setTextoIndicadores(r.indicadoresTituloJanela.join('\n'))
      mostrarToast(
        'Listas salvas. Navegador: na próxima checagem da extensão. Windows: no próximo título em foco.',
        'sucesso'
      )
    } else {
      mostrarToast(r.motivo, 'erro')
    }
  }

  const restaurarPadrao = async (): Promise<void> => {
    const r = await window.api.restaurarListasBloqueioPadrao()
    if (r.ok) {
      setTextoHosts(r.hosts.join('\n'))
      setTextoIndicadores(r.indicadoresTituloJanela.join('\n'))
      mostrarToast('Entradas extras removidas; o bloqueio padrão do app continua.', 'sucesso')
    } else {
      mostrarToast(r.motivo, 'erro')
    }
  }

  const corpoDescricao = (
    <p className="mt-1 text-xs leading-relaxed text-texto-mudo">
      O app já bloqueia uma lista padrão (redes, streaming, jogos, etc.) — ela não aparece aqui. Use
      os campos abaixo só para <strong className="font-semibold text-texto">adicionar</strong>{' '}
      domínios ou trechos de título extras. Extensão Chrome/Edge: domínios; Windows: título da
      janela. Uma entrada por linha; sem{' '}
      <code className="rounded bg-superficie-elevada px-1 py-0.5 text-[11px] text-texto">https://</code>{' '}
      nos
      domínios.
    </p>
  )

  const formulario = carregando ? (
    <EsqueletoListas />
  ) : (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="lista-hosts" className="text-xs font-medium text-texto">
          Sites extras (domínios)
        </label>
        <textarea
          id="lista-hosts"
          value={textoHosts}
          onChange={(e) => setTextoHosts(e.target.value)}
          rows={8}
          spellCheck={false}
          className="selecionavel mt-1.5 w-full resize-y rounded-xl border border-borda bg-superficie px-3 py-2.5 font-mono text-[12px] leading-relaxed text-texto shadow-[var(--shadow-app-soft)] focus:border-primaria/45 focus:outline-none focus:ring-2 focus:ring-primaria/20"
        />
      </div>
      <div>
        <label htmlFor="lista-indicadores" className="text-xs font-medium text-texto">
          Apps e janelas extras (trecho do título)
        </label>
        <textarea
          id="lista-indicadores"
          value={textoIndicadores}
          onChange={(e) => setTextoIndicadores(e.target.value)}
          rows={8}
          spellCheck={false}
          className="selecionavel mt-1.5 w-full resize-y rounded-xl border border-borda bg-superficie px-3 py-2.5 font-mono text-[12px] leading-relaxed text-texto shadow-[var(--shadow-app-soft)] focus:border-primaria/45 focus:outline-none focus:ring-2 focus:ring-primaria/20"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void salvar()}
          className="inline-flex justify-center rounded-2xl bg-primaria px-5 py-2 text-xs font-semibold text-white shadow-[var(--shadow-app-soft)] transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/45 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
        >
          Salvar listas
        </button>
        <button
          type="button"
          onClick={() => void restaurarPadrao()}
          className="inline-flex justify-center rounded-2xl border border-borda bg-superficie-elevada px-5 py-2 text-xs font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque/35 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
        >
          Limpar minhas entradas
        </button>
      </div>
    </div>
  )

  if (recolhivel) {
    return (
      <details className="group rounded-[var(--radius-card)] border border-borda bg-superficie-elevada/80 shadow-[var(--shadow-app-soft)] open:bg-superficie">
        <summary className="flex list-none cursor-pointer items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold text-texto">Listas de bloqueio</span>
          <span className="flex items-center gap-2">
            <span className="hidden text-xs text-texto-mudo sm:inline">
              Opcional — expandir para editar
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 shrink-0 text-texto-mudo transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <div className="border-t border-borda px-5 pb-5 pt-1">
          {corpoDescricao}
          {formulario}
        </div>
      </details>
    )
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-borda bg-superficie-elevada/80 p-5 shadow-[var(--shadow-app-soft)] sm:p-6">
      <h3 className="text-sm font-semibold text-texto">Listas de bloqueio</h3>
      {corpoDescricao}
      {formulario}
    </div>
  )
}
