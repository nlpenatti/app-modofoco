import { useCallback, useEffect, useState } from 'react'
import { useToasts } from '../contextos/ContextoToasts'

type Props = {
  recolhivel?: boolean
}

type LinhaPadrao = { chave: string; rotulo: string; bloqueado: boolean }

type AbaLista = 'padrao' | 'extras'

function AvisoExtensaoChrome(): React.JSX.Element | null {
  const { mostrarToast } = useToasts()
  const [info, setInfo] = useState<{
    pastaGravacaoExtensao: string
    caminhoEspelhoBridge: string
    nomeArquivoEspelho: string
  } | null>(null)
  const [apiAusente, setApiAusente] = useState(false)

  useEffect(() => {
    const api = window.api
    if (typeof api.obterInfoBridgeExtensao !== 'function') {
      setApiAusente(true)
      return
    }
    void api
      .obterInfoBridgeExtensao()
      .then((d) => setInfo(d))
      .catch(() => setInfo(null))
  }, [])

  if (apiAusente || !info) return null

  return (
    <div className="rounded-xl border border-borda/90 bg-superficie/70 px-3 py-2.5 text-xs leading-relaxed text-texto shadow-[var(--shadow-app-soft)]">
      <p className="font-semibold text-texto">Extensão no Chrome / Edge</p>
      <p className="mt-1 text-texto-mudo">
        O navegador precisa usar a <strong className="text-texto">mesma pasta</strong> em que o app grava o
        arquivo <code className="rounded bg-fundo px-1 font-mono text-[11px]">bridge-config.json</code> (porta e
        token). Se o diagnóstico da extensão mostrar token vazio com o app em foco, muito provavelmente o Chrome
        está carregando uma cópia (ex.: pasta do Git) e o app instalado grava em outro lugar.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-texto-mudo">
        <li>
          Recomendado:{' '}
          <button
            type="button"
            onClick={() => void window.api.abrirPastaExtensao()}
            className="font-semibold text-primaria underline decoration-primaria/40 underline-offset-2 hover:decoration-primaria"
          >
            Abrir pasta da extensão
          </button>
          {' '}
          e use essa pasta em &quot;Carregar sem compactação&quot;.
        </li>
        <li>
          Alternativa: copie o arquivo{' '}
          <code className="rounded bg-fundo px-1 font-mono text-[11px]">{info.nomeArquivoEspelho}</code> dos dados
          do app para <code className="rounded bg-fundo px-1 font-mono text-[11px]">bridge-config.json</code> na
          pasta que o navegador está usando (substituir).
        </li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void window.api.abrirPastaExtensao()}
          className="inline-flex justify-center rounded-2xl border border-borda bg-superficie-elevada px-4 py-2 text-xs font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/35 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
        >
          Abrir pasta da extensão
        </button>
        <button
          type="button"
          onClick={() => {
            void window.api.abrirEspelhoBridgeNoExplorador?.().then((r) => {
              if (r && !r.ok && r.motivo) mostrarToast(r.motivo, 'erro')
            })
          }}
          className="inline-flex justify-center rounded-2xl border border-borda bg-superficie-elevada px-4 py-2 text-xs font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/35 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo"
        >
          Mostrar espelho nos dados do app
        </button>
      </div>
    </div>
  )
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

function GradeCheckboxPadrao({
  titulo,
  linhas,
  tipo,
  aoAlternar
}: {
  titulo: string
  linhas: LinhaPadrao[]
  tipo: 'hosts' | 'indicadores'
  aoAlternar: (tipo: 'hosts' | 'indicadores', chave: string) => void
}): React.JSX.Element {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-texto-mudo">{titulo}</h4>
      <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-borda/80 bg-fundo/40 px-2 py-2 sm:max-h-60">
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {linhas.map((linha) => (
            <li key={linha.chave}>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-xs text-texto transition hover:bg-superficie/80">
                <input
                  type="checkbox"
                  checked={linha.bloqueado}
                  onChange={() => {
                    aoAlternar(tipo, linha.chave)
                  }}
                  className="mt-0.5 size-3.5 shrink-0 rounded border-borda text-primaria focus:ring-primaria/30"
                />
                <span className="selecionavel font-mono leading-snug">{linha.rotulo}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function EditorListasBloqueio({ recolhivel = false }: Props): React.JSX.Element {
  const { mostrarToast } = useToasts()
  const [aba, setAba] = useState<AbaLista>('padrao')
  const [textoHosts, setTextoHosts] = useState('')
  const [textoIndicadores, setTextoIndicadores] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [linhasPadrao, setLinhasPadrao] = useState<{ hosts: LinhaPadrao[]; indicadores: LinhaPadrao[] } | null>(
    null
  )
  /** Preload antigo (build sem as novas APIs IPC). */
  const [padraoApiAusente, setPadraoApiAusente] = useState(false)
  const [salvandoPadrao, setSalvandoPadrao] = useState(false)

  const carregarPadrao = useCallback(async (): Promise<void> => {
    const api = window.api
    if (typeof api.obterBloqueiosPadrao !== 'function') {
      setPadraoApiAusente(true)
      setLinhasPadrao(null)
      return
    }
    setPadraoApiAusente(false)
    const r = await api.obterBloqueiosPadrao()
    if (r.ok) {
      setLinhasPadrao({ hosts: r.hosts, indicadores: r.indicadores })
    } else {
      setLinhasPadrao(null)
      mostrarToast(r.motivo, 'erro')
    }
  }, [mostrarToast])

  useEffect(() => {
    let cancelado = false
    void (async (): Promise<void> => {
      try {
        const api = window.api
        const rLista = await api.obterListasBloqueio()
        if (cancelado) return

        if (rLista.ok) {
          setTextoHosts(rLista.hosts.join('\n'))
          setTextoIndicadores(rLista.indicadoresTituloJanela.join('\n'))
        } else {
          mostrarToast(rLista.motivo, 'erro')
        }

        if (typeof api.obterBloqueiosPadrao === 'function') {
          setPadraoApiAusente(false)
          const rPadrao = await api.obterBloqueiosPadrao()
          if (cancelado) return
          if (rPadrao.ok) {
            setLinhasPadrao({ hosts: rPadrao.hosts, indicadores: rPadrao.indicadores })
          } else {
            setLinhasPadrao(null)
            mostrarToast(rPadrao.motivo, 'erro')
          }
        } else {
          setPadraoApiAusente(true)
          setLinhasPadrao(null)
        }
      } catch (erro) {
        if (!cancelado) {
          console.error('[EditorListasBloqueio]', erro)
          mostrarToast('Não foi possível carregar as listas. Feche e abra o app de novo.', 'erro')
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [mostrarToast])

  const alternarPadrao = useCallback((tipo: 'hosts' | 'indicadores', chave: string): void => {
    setLinhasPadrao((prev) => {
      if (!prev) return prev
      if (tipo === 'hosts') {
        return {
          ...prev,
          hosts: prev.hosts.map((l) => (l.chave === chave ? { ...l, bloqueado: !l.bloqueado } : l))
        }
      }
      return {
        ...prev,
        indicadores: prev.indicadores.map((l) => (l.chave === chave ? { ...l, bloqueado: !l.bloqueado } : l))
      }
    })
  }, [])

  const salvarPadrao = async (): Promise<void> => {
    if (!linhasPadrao) {
      await carregarPadrao()
      return
    }
    if (typeof window.api.salvarDesativacoesBloqueioPadrao !== 'function') {
      mostrarToast('Atualize o app para salvar bloqueios padrão.', 'erro')
      return
    }
    setSalvandoPadrao(true)
    try {
      const hostsDesativados = linhasPadrao.hosts.filter((l) => !l.bloqueado).map((l) => l.chave)
      const indicadoresDesativados = linhasPadrao.indicadores.filter((l) => !l.bloqueado).map((l) => l.chave)
      const r = await window.api.salvarDesativacoesBloqueioPadrao({ hostsDesativados, indicadoresDesativados })
      if (r.ok) {
        mostrarToast(
          'Bloqueios padrão atualizados. Extensão: na próxima checagem. Windows: no próximo foco de janela.',
          'sucesso'
        )
        await carregarPadrao()
      } else {
        mostrarToast(r.motivo, 'erro')
      }
    } finally {
      setSalvandoPadrao(false)
    }
  }

  const reativarTodosPadroes = async (): Promise<void> => {
    if (typeof window.api.salvarDesativacoesBloqueioPadrao !== 'function') {
      mostrarToast('Atualize o app para usar esta função.', 'erro')
      return
    }
    setSalvandoPadrao(true)
    try {
      const r = await window.api.salvarDesativacoesBloqueioPadrao({
        hostsDesativados: [],
        indicadoresDesativados: []
      })
      if (r.ok) {
        mostrarToast('Todos os itens padrão voltaram a ser bloqueados.', 'sucesso')
        await carregarPadrao()
      } else {
        mostrarToast(r.motivo, 'erro')
      }
    } finally {
      setSalvandoPadrao(false)
    }
  }

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

  const abasBarra = (
    <div className="mt-4 flex flex-wrap gap-2 border-b border-borda pb-px">
      <button
        type="button"
        onClick={() => setAba('padrao')}
        className={[
          '-mb-px rounded-t-lg border border-b-0 px-4 py-2 text-xs font-semibold transition',
          aba === 'padrao'
            ? 'border-borda bg-superficie text-texto ring-1 ring-borda'
            : 'border-transparent text-texto-mudo hover:text-texto'
        ].join(' ')}
      >
        Bloqueios padrão
      </button>
      <button
        type="button"
        onClick={() => setAba('extras')}
        className={[
          '-mb-px rounded-t-lg border border-b-0 px-4 py-2 text-xs font-semibold transition',
          aba === 'extras'
            ? 'border-borda bg-superficie text-texto ring-1 ring-borda'
            : 'border-transparent text-texto-mudo hover:text-texto'
        ].join(' ')}
      >
        Minhas entradas extras
      </button>
    </div>
  )

  const descricaoExtras = (
    <p className="mt-1 text-xs leading-relaxed text-texto-mudo">
      Use os campos abaixo só para <strong className="font-semibold text-texto">adicionar</strong> domínios ou
      trechos de título que não estão na aba <strong className="font-semibold text-texto">Bloqueios padrão</strong>.
      Extensão: domínios; Windows: título da janela. Uma entrada por linha; sem{' '}
      <code className="rounded bg-superficie-elevada px-1 py-0.5 text-[11px] text-texto">https://</code> nos
      domínios.
    </p>
  )

  const descricaoPadrao = (
    <p className="mt-1 text-xs leading-relaxed text-texto-mudo">
      Marque para <strong className="text-texto">bloquear</strong> durante o foco; desmarque para{' '}
      <strong className="text-texto">liberar</strong> aquele site (extensão) ou aquele trecho no título da janela
      (app no Windows). Clique em <em>Salvar alterações</em> para aplicar.
    </p>
  )

  const painelPadrao = carregando ? (
    <div className="mt-4 space-y-4 animate-pulse" aria-hidden>
      <div className="h-32 rounded-xl bg-superficie-elevada" />
      <div className="h-32 rounded-xl bg-superficie-elevada" />
    </div>
  ) : padraoApiAusente ? (
    <div className="mt-4 rounded-xl border border-borda/80 bg-fundo/50 px-4 py-4 text-sm leading-relaxed text-texto-mudo">
      <p className="font-medium text-texto">Bloqueios padrão indisponíveis nesta versão</p>
      <p className="mt-2">
        Gere e instale um build novo do Modo Foco (ou rode <code className="rounded bg-superficie px-1 py-0.5 text-[11px]">npm run dev</code>) para
        carregar a lista com checkboxes. A aba <strong className="text-texto">Minhas entradas extras</strong> continua funcionando.
      </p>
    </div>
  ) : !linhasPadrao ? (
    <div className="mt-4 rounded-xl border border-borda/80 bg-fundo/50 px-4 py-4 text-sm text-texto-mudo">
      <p>Não foi possível carregar os bloqueios padrão.</p>
      <button
        type="button"
        onClick={() => void carregarPadrao()}
        className="mt-3 rounded-xl border border-borda bg-superficie px-4 py-2 text-xs font-semibold text-texto transition hover:bg-superficie-elevada"
      >
        Tentar de novo
      </button>
    </div>
  ) : (
    <div className="mt-4 space-y-5">
      {descricaoPadrao}
      <GradeCheckboxPadrao
        titulo="Sites (domínios) — extensão"
        linhas={linhasPadrao.hosts}
        tipo="hosts"
        aoAlternar={alternarPadrao}
      />
      <GradeCheckboxPadrao
        titulo="Apps e janelas (trecho do título) — Windows"
        linhas={linhasPadrao.indicadores}
        tipo="indicadores"
        aoAlternar={alternarPadrao}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void salvarPadrao()}
          disabled={salvandoPadrao}
          className="inline-flex justify-center rounded-2xl bg-primaria px-5 py-2 text-xs font-semibold text-white shadow-[var(--shadow-app-soft)] transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/45 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:opacity-50"
        >
          {salvandoPadrao ? 'Salvando…' : 'Salvar alterações'}
        </button>
        <button
          type="button"
          onClick={() => void reativarTodosPadroes()}
          disabled={salvandoPadrao}
          className="inline-flex justify-center rounded-2xl border border-borda bg-superficie-elevada px-5 py-2 text-xs font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque/35 focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:opacity-50"
        >
          Reativar todos os padrões
        </button>
      </div>
    </div>
  )

  const formularioExtras = carregando ? (
    <EsqueletoListas />
  ) : (
    <div className="mt-4 space-y-4">
      {descricaoExtras}
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

  const corpo = (
    <>
      <div className="mb-4">
        <AvisoExtensaoChrome />
      </div>
      {abasBarra}
      {aba === 'padrao' ? painelPadrao : formularioExtras}
    </>
  )

  if (recolhivel) {
    return (
      <details className="group rounded-[var(--radius-card)] border border-borda bg-superficie-elevada/80 shadow-[var(--shadow-app-soft)] open:bg-superficie">
        <summary className="flex list-none cursor-pointer items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold text-texto">Listas de bloqueio</span>
          <span className="flex items-center gap-2">
            <span className="hidden text-xs text-texto-mudo sm:inline">
              Padrão do app, extras e extensão
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
        <div className="border-t border-borda px-5 pb-5 pt-1">{corpo}</div>
      </details>
    )
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-borda bg-superficie-elevada/80 p-5 shadow-[var(--shadow-app-soft)] sm:p-6">
      <h3 className="text-sm font-semibold text-texto">Listas de bloqueio</h3>
      <p className="mt-1 text-xs text-texto-mudo">
        Controle o que o Modo Foco bloqueia no navegador (extensão) e no Windows (título da janela ativa).
      </p>
      {corpo}
    </div>
  )
}
