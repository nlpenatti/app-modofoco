import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  duracaoSegmentoAtual,
  formatarTempoCronometro,
  formatarTempoPomodoro,
  segmentoPomodoroUI,
  usePomodoro,
  type SegmentoPomodoroUI
} from '../contextos/ContextoPomodoro'
import { useToasts } from '../contextos/ContextoToasts'
import { EditorListasBloqueio } from './EditorListasBloqueio'

const RAIO_ANEL = 58
const COMPRIMENTO_ANEL = 2 * Math.PI * RAIO_ANEL

const CORES_TRACO: Record<SegmentoPomodoroUI, string> = {
  foco: 'hsl(265 50% 68%)',
  pausa_curta: 'hsl(160 38% 65%)',
  pausa_longa: 'hsl(200 45% 68%)'
}

function brilhoClasseSegmento(s: SegmentoPomodoroUI): string {
  if (s === 'foco') return 'text-brilo-foco'
  if (s === 'pausa_curta') return 'text-brilo-pausa'
  return 'text-brilo-pausa-longa'
}

type ItemRotina = {
  id: string
  texto: string
  concluido: boolean
  prioridade: 'Baixa' | 'Média' | 'Alta'
  sessoesEstimadas: number
  sessoesConcluidas: number
}

function carregarTarefas(): ItemRotina[] {
  try {
    const bruto = localStorage.getItem('modo-foco-rotina-v1')
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    if (!Array.isArray(dados)) return []
    return dados
      .filter((x) => x && typeof x === 'object' && x.id && x.texto)
      .map((x) => ({
        id: x.id,
        texto: x.texto,
        concluido: !!x.concluido,
        prioridade: x.prioridade || 'Média',
        sessoesEstimadas: x.sessoesEstimadas || 1,
        sessoesConcluidas: x.sessoesConcluidas || 0
      }))
  } catch (err) {
    console.error('Erro ao carregar tarefas (insight):', err)
    return []
  }
}

export function ModuloPomodoro(): React.JSX.Element {
  const {
    estado, despachar, avisoMonitor, historicoFocosConcluidos,
    modoEstudo, definirModoEstudo, cronometro, alternarCronometro, zerarCronometro
  } = usePomodoro()
  const [mostrandoConfig, setMostrandoConfig] = useState(false)
  const [insightRascunho, setInsightRascunho] = useState('')
  const { mostrarToast } = useToasts()

  const segmento = segmentoPomodoroUI(estado)
  const duracaoFaseAtual = duracaoSegmentoAtual(estado)

  const tracoAnel = useMemo(() => {
    const p = duracaoFaseAtual > 0 ? estado.restante / duracaoFaseAtual : 1
    return COMPRIMENTO_ANEL * Math.min(1, Math.max(0, p))
  }, [duracaoFaseAtual, estado.restante])

  const tracoCronometroAnel = useMemo(() => {
    const p = 1 - (cronometro.decorrido % 60) / 60
    return COMPRIMENTO_ANEL * Math.min(1, Math.max(0, p))
  }, [cronometro.decorrido])

  const COR_CRONOMETRO = 'hsl(35 65% 58%)'
  const estaRodando = modoEstudo === 'pomodoro' ? estado.rodando : cronometro.rodando
  const corBotaoAtivo = modoEstudo === 'pomodoro' ? CORES_TRACO[segmento] : COR_CRONOMETRO

  const corModo = CORES_TRACO[segmento]
  const briloClasse = brilhoClasseSegmento(segmento)

  const pilulas: { id: SegmentoPomodoroUI; rotulo: string }[] = [
    { id: 'foco', rotulo: 'Foco' },
    { id: 'pausa_curta', rotulo: 'Pausa Curta' },
    { id: 'pausa_longa', rotulo: 'Pausa Longa' }
  ]

  const sessoesHoje = historicoFocosConcluidos.length

  const salvarInsight = (): void => {
    const texto = insightRascunho.trim()
    if (!texto) return

    const novaTarefa: ItemRotina = {
      id: crypto.randomUUID(),
      texto: `💡 Insight: ${texto}`,
      concluido: false,
      prioridade: 'Média',
      sessoesEstimadas: 1,
      sessoesConcluidas: 0
    }

    const lista = carregarTarefas()
    localStorage.setItem('modo-foco-rotina-v1', JSON.stringify([...lista, novaTarefa]))
    setInsightRascunho('')
    mostrarToast('Insight salvo para revisão posterior!', 'sucesso')

    // Notificar outros componentes
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('tarefas-atualizadas'))
  }

  const numeroSessaoAtual = sessoesHoje + 1
  const ordinalSessao =
    ['Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta', 'Sexta', 'Sétima', 'Oitava'][
      sessoesHoje % 8
    ] || `${numeroSessaoAtual}ª`

  return (
    <div className="relative flex w-full flex-col items-center">
      {avisoMonitor && (
        <div className="mb-6 w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-xs text-rose-900 shadow-sm">
          {avisoMonitor}
        </div>
      )}

      {/* Seletor de Modo de Estudo */}
      <div className="mb-5 flex justify-center">
        <div className="flex items-center rounded-2xl border border-borda bg-superficie p-1 shadow-sm">
          <button
            type="button"
            onClick={() => definirModoEstudo('pomodoro')}
            className={[
              'rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
              modoEstudo === 'pomodoro'
                ? 'bg-primaria/15 text-primaria'
                : 'text-texto-mudo hover:text-texto'
            ].join(' ')}
          >
            Pomodoro
          </button>
          <button
            type="button"
            onClick={() => definirModoEstudo('cronometro')}
            className={[
              'rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
              modoEstudo === 'cronometro'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-texto-mudo hover:text-texto'
            ].join(' ')}
          >
            Stopwatch
          </button>
        </div>
      </div>

      {modoEstudo === 'pomodoro' && (
      <>
      {/* Cabeçalho: Abas e Configurações */}
      <div className="mb-6 sm:mb-8 flex items-center gap-3">
        <nav className="flex items-center rounded-3xl border border-borda bg-superficie p-1 shadow-sm">
          {pilulas.map(({ id, rotulo }) => {
            const ativa = segmento === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => despachar({ tipo: 'selecionar_segmento', segmento: id })}
                className={[
                  'relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  ativa ? 'bg-primaria/15 text-primaria' : 'text-texto-mudo hover:text-texto'
                ].join(' ')}
              >
                {rotulo}
              </button>
            )
          })}
        </nav>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMostrandoConfig(!mostrandoConfig)}
            className={[
              'grid size-11 place-content-center rounded-full border border-borda bg-superficie text-texto-mudo transition-all hover:border-primaria/30 hover:text-primaria shadow-sm',
              mostrandoConfig && 'border-primaria/40 text-primaria ring-2 ring-primaria/10'
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={['size-5 transition-transform duration-500', mostrandoConfig && 'rotate-180'].join(
                ' '
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12H12"
              />
            </svg>
          </button>

          <AnimatePresence>
            {mostrandoConfig && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-borda bg-superficie p-6 shadow-xl"
              >
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-texto-mudo">
                  Durações (minutos)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Foco', val: estado.duracaoFoco, key: 'focoMin', color: 'text-primaria' },
                    { label: 'Curta', val: estado.duracaoPausa, key: 'pausaMin', color: 'text-secundaria' },
                    { label: 'Longa', val: estado.duracaoPausaLonga, key: 'pausaLongaMin', color: 'text-pausa-longa' }
                  ].map((f) => (
                    <div key={f.key} className="space-y-2">
                      <label className={`block text-[10px] font-bold uppercase ${f.color}`}>
                        {f.label}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={Math.floor(f.val / 60)}
                        onChange={(e) =>
                          despachar({
                            tipo: 'ajustar_duracoes',
                            focoMin: f.key === 'focoMin' ? Number(e.target.value) : Math.floor(estado.duracaoFoco / 60),
                            pausaMin: f.key === 'pausaMin' ? Number(e.target.value) : Math.floor(estado.duracaoPausa / 60),
                            pausaLongaMin: f.key === 'pausaLongaMin' ? Number(e.target.value) : Math.floor(estado.duracaoPausaLonga / 60)
                          })
                        }
                        className="w-full rounded-xl border border-borda bg-fundo py-2.5 text-center text-sm font-semibold focus:border-primaria/50 focus:outline-none focus:ring-4 focus:ring-primaria/5"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Sessão */}
      <div className="mb-6 sm:mb-8 text-center">
        <p className="text-sm font-medium text-texto-mudo">
          {ordinalSessao} sessão de foco hoje
        </p>
        <div className="mt-3 flex justify-center gap-1.5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={[
                'size-2 rounded-full transition-colors duration-500',
                i < sessoesHoje ? 'bg-primaria' : 'bg-borda'
              ].join(' ')}
            />
          ))}
        </div>
      </div>
      </>
      )}

      {modoEstudo === 'cronometro' && (
      <p className="mb-4 text-center text-[11px] text-texto-mudo/55">
        Bloqueio ativo enquanto o stopwatch roda
      </p>
      )}

      {/* Timer (foco visual principal) */}
      <div className="relative flex w-full flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            className="relative z-10 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={RAIO_ANEL}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-borda/30"
            />

            <motion.circle
              cx="60"
              cy="60"
              r={RAIO_ANEL}
              fill="none"
              stroke={modoEstudo === 'pomodoro' ? corModo : COR_CRONOMETRO}
              strokeWidth="6"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              strokeDasharray={`${COMPRIMENTO_ANEL} ${COMPRIMENTO_ANEL}`}
              initial={{ strokeDashoffset: COMPRIMENTO_ANEL }}
              animate={{
                strokeDashoffset: modoEstudo === 'pomodoro' ? tracoAnel : tracoCronometroAnel,
                opacity: estaRodando ? [0.15, 0.25, 0.15] : 0.15
              }}
              transition={{
                strokeDashoffset: { duration: 1, ease: 'linear' },
                opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }}
              style={{ filter: 'blur(4px)' }}
            />

            <motion.circle
              cx="60"
              cy="60"
              r={RAIO_ANEL}
              fill="none"
              stroke={modoEstudo === 'pomodoro' ? corModo : COR_CRONOMETRO}
              strokeWidth="4"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              strokeDasharray={`${COMPRIMENTO_ANEL} ${COMPRIMENTO_ANEL}`}
              initial={{ strokeDashoffset: COMPRIMENTO_ANEL }}
              animate={{ strokeDashoffset: modoEstudo === 'pomodoro' ? tracoAnel : tracoCronometroAnel }}
              transition={{ duration: 1, ease: 'linear' }}
              className="drop-shadow-sm"
            />
          </svg>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
            {modoEstudo === 'pomodoro' ? (
              <>
                <span
                  className={[
                    'font-display text-[80px] sm:text-[110px] font-bold tabular-nums tracking-tighter text-texto select-none leading-none',
                    briloClasse
                  ].join(' ')}
                >
                  {formatarTempoPomodoro(estado.restante)}
                </span>
                <span className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-texto-mudo/50">
                  {estado.fase === 'foco' ? 'Focando' : 'Pausado'}
                </span>
              </>
            ) : (
              <>
                <span className="font-display text-[80px] sm:text-[110px] font-bold tabular-nums tracking-tighter select-none leading-none text-amber-500/90">
                  {formatarTempoCronometro(cronometro.decorrido)}
                </span>
                <span className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-texto-mudo/50">
                  {cronometro.rodando ? 'Estudando' : cronometro.decorrido > 0 ? 'Pausado' : 'Pronto'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="mt-2 flex items-center gap-6">
        <motion.button
          type="button"
          onClick={() => modoEstudo === 'pomodoro' ? despachar({ tipo: 'zerar_fase' }) : zerarCronometro()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="grid size-14 place-content-center rounded-full border border-borda bg-superficie text-texto-mudo transition-all hover:text-texto shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => modoEstudo === 'pomodoro' ? despachar({ tipo: 'alternar_rodando' }) : alternarCronometro()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="grid size-24 place-content-center rounded-[40px] text-white shadow-lg transition-transform"
          style={{ backgroundColor: corBotaoAtivo }}
        >
          {estaRodando ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="size-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="size-10 translate-x-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </motion.button>

        <div className="size-14" />
      </div>

      {/* Seção Opcional: Listas de Bloqueio */}
      <div className="mt-20 w-full max-w-xl opacity-40 hover:opacity-100 transition-opacity">
        <EditorListasBloqueio recolhivel />
      </div>

      {/* Brain dump discreto — canto superior direito */}
      <div
        className={[
          'select-app-chrome pointer-events-none fixed z-30 w-[min(13rem,calc(100vw-1.5rem)))]',
          'right-3 top-[max(0.75rem,env(safe-area-inset-top))] sm:right-4',
          'md:right-6 md:top-6'
        ].join(' ')}
        aria-label="Brain dump"
      >
        <div className="pointer-events-auto rounded-xl border border-borda/80 bg-superficie/90 p-2 shadow-md backdrop-blur-sm">
          <p className="mb-1 px-0.5 text-[9px] font-bold uppercase tracking-wider text-texto-mudo/80">
            Brain dump
          </p>
          <div className="relative">
            <textarea
              value={insightRascunho}
              onChange={(e) => setInsightRascunho(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  salvarInsight()
                }
              }}
              placeholder="Ideia rápida…"
              rows={2}
              className="min-h-[3.25rem] w-full resize-none rounded-lg border border-borda/70 bg-fundo/60 px-2.5 py-1.5 text-[11px] leading-snug text-texto outline-none transition placeholder:text-texto-mudo/45 focus:border-primaria/35 focus:ring-1 focus:ring-primaria/15 scrollbar-fina"
            />
            <button
              type="button"
              onClick={salvarInsight}
              disabled={!insightRascunho.trim()}
              className="absolute bottom-1 right-1 grid size-6 place-content-center rounded-md border border-borda/60 bg-superficie text-texto-mudo text-[10px] transition hover:border-primaria/25 hover:text-primaria disabled:pointer-events-none disabled:opacity-0"
              title="Salvar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
