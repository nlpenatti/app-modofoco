import { useEffect, useState } from 'react'

export function EditorListasBloqueio(): React.JSX.Element {
  const [textoHosts, setTextoHosts] = useState('')
  const [textoIndicadores, setTextoIndicadores] = useState('')
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
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
        setFeedback({ texto: r.motivo, ok: false })
      }
    })
    return () => {
      cancelado = true
    }
  }, [])

  const salvar = async (): Promise<void> => {
    setFeedback(null)
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
      setFeedback({
        texto:
          'Salvo. O navegador usa na próxima checagem da extensão; o Windows usa no próximo título de janela em foco.',
        ok: true
      })
    } else {
      setFeedback({ texto: r.motivo, ok: false })
    }
  }

  const restaurarPadrao = async (): Promise<void> => {
    setFeedback(null)
    const r = await window.api.restaurarListasBloqueioPadrao()
    if (r.ok) {
      setTextoHosts(r.hosts.join('\n'))
      setTextoIndicadores(r.indicadoresTituloJanela.join('\n'))
      setFeedback({ texto: 'Listas padrão do app restauradas.', ok: true })
    } else {
      setFeedback({ texto: r.motivo, ok: false })
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-5 shadow-[var(--shadow-app-soft)] sm:p-6">
      <h3 className="text-sm font-semibold text-stone-900">Listas de bloqueio</h3>
      <p className="mt-1 text-xs leading-relaxed text-stone-600">
        Domínios alimentam a extensão no Chrome/Edge. Trechos no título da janela alimentam o aviso
        de distração no Windows (WhatsApp, Discord, Spotify, jogos, etc.). Uma entrada por linha;
        não use <code className="rounded bg-stone-200/80 px-1 py-0.5 text-[11px]">https://</code>{' '}
        nos domínios.
      </p>

      {carregando ? (
        <p className="mt-4 text-xs text-stone-500">Carregando listas…</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="lista-hosts" className="text-xs font-medium text-stone-700">
              Sites (domínios)
            </label>
            <textarea
              id="lista-hosts"
              value={textoHosts}
              onChange={(e) => setTextoHosts(e.target.value)}
              rows={8}
              spellCheck={false}
              className="mt-1.5 w-full resize-y rounded-xl border border-stone-200/90 bg-white/95 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-stone-800 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
            />
          </div>
          <div>
            <label htmlFor="lista-indicadores" className="text-xs font-medium text-stone-700">
              Apps e janelas (trecho do título)
            </label>
            <textarea
              id="lista-indicadores"
              value={textoIndicadores}
              onChange={(e) => setTextoIndicadores(e.target.value)}
              rows={8}
              spellCheck={false}
              className="mt-1.5 w-full resize-y rounded-xl border border-stone-200/90 bg-white/95 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-stone-800 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void salvar()}
              className="inline-flex justify-center rounded-full bg-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Salvar listas
            </button>
            <button
              type="button"
              onClick={() => void restaurarPadrao()}
              className="inline-flex justify-center rounded-full border border-stone-200 bg-white/90 px-5 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-200 hover:bg-amber-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-2"
            >
              Restaurar padrão do app
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p
          className={[
            'mt-4 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed',
            feedback.ok
              ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-900'
              : 'border-rose-200/80 bg-rose-50/90 text-rose-800'
          ].join(' ')}
        >
          {feedback.texto}
        </p>
      )}
    </div>
  )
}
