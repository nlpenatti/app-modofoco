import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  duracaoSegmentoAtual,
  formatarTempoPomodoro,
  segmentoPomodoroUI,
  usePomodoro,
  type SegmentoPomodoroUI
} from '../contextos/ContextoPomodoro'
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
    console.error('Erro ao carregar tarefas no Pomodoro:', err)
    return []
  }
}

export function ModuloPomodoro(): React.JSX.Element {
  const { estado, despachar, avisoMonitor, historicoFocosConcluidos } =
    usePomodoro()
  const [mostrandoConfig, setMostrandoConfig] = useState(false)
  const [tarefas, setTarefas] = useState<ItemRotina[]>([])
  const [tarefaSelecionada, setTarefaSelecionada] = useState<string | null>(() => {
    return localStorage.getItem('modo-foco-tarefa-selecionada')
  })
  const [dropdownTarefasAberto, setDropdownTarefasAberto] = useState(false)

  // Carregar tarefas no mount e quando o componente ganha foco (simulado por efeito de mount)
  useEffect(() => {
    const carregar = (): void => {
      const t = carregarTarefas()
      setTarefas(t)
    }
    
    carregar()

    // Escutar mudanças no localStorage (mesmo nesta janela)
    const handler = (e: Event): void => {
      if (e.type === 'storage' || e.type === 'tarefas-atualizadas') {
        carregar()
      }
    }

    window.addEventListener('storage', handler)
    window.addEventListener('tarefas-atualizadas', handler)
    
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('tarefas-atualizadas', handler)
    }
  }, [])

  // Persistir tarefa selecionada
  useEffect(() => {
    if (tarefaSelecionada) {
      localStorage.setItem('modo-foco-tarefa-selecionada', tarefaSelecionada)
    } else {
      localStorage.removeItem('modo-foco-tarefa-selecionada')
    }
  }, [tarefaSelecionada])

  const tarefasPendentes = useMemo(() => tarefas.filter(t => !t.concluido), [tarefas])

  const segmento = segmentoPomodoroUI(estado)
  const duracaoFaseAtual = duracaoSegmentoAtual(estado)

  const tracoAnel = useMemo(() => {
    const p = duracaoFaseAtual > 0 ? estado.restante / duracaoFaseAtual : 1
    return COMPRIMENTO_ANEL * Math.min(1, Math.max(0, p))
  }, [duracaoFaseAtual, estado.restante])

  const corModo = CORES_TRACO[segmento]
  const briloClasse = brilhoClasseSegmento(segmento)

  const pilulas: { id: SegmentoPomodoroUI; rotulo: string }[] = [
    { id: 'foco', rotulo: 'Foco' },
    { id: 'pausa_curta', rotulo: 'Pausa Curta' },
    { id: 'pausa_longa', rotulo: 'Pausa Longa' }
  ]

  const sessoesHoje = historicoFocosConcluidos.length

  // Incrementar sessões concluídas da tarefa selecionada quando um foco termina
  useEffect(() => {
    if (sessoesHoje > 0 && tarefaSelecionada) {
      const lista = carregarTarefas()
      const index = lista.findIndex((t) => t.id === tarefaSelecionada)
      if (index !== -1 && !lista[index].concluido) {
        lista[index].sessoesConcluidas += 1
        // Se atingiu o estimado, não fazemos nada automático, o usuário marca como concluído
        localStorage.setItem('modo-foco-rotina-v1', JSON.stringify(lista))
        setTarefas(lista)
        // Notificar outros componentes (embora ModuloRotina já salve no storage)
        window.dispatchEvent(new Event('storage'))
      }
    }
  }, [sessoesHoje])

  const numeroSessaoAtual = sessoesHoje + 1
  const ordinalSessao =
    ['Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta', 'Sexta', 'Sétima', 'Oitava'][
      sessoesHoje % 8
    ] || `${numeroSessaoAtual}ª`

  return (
    <div className="flex flex-col items-center">
      {avisoMonitor && (
        <div className="mb-6 w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-xs text-rose-900 shadow-sm">
          {avisoMonitor}
        </div>
      )}

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

      {/* Timer Circular */}
      <div className="relative mb-8 sm:mb-12 flex items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="relative z-10 w-[280px] h-[280px] sm:w-[380px] sm:h-[380px]"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r={RAIO_ANEL}
            fill="none"
            stroke="transparent"
            strokeWidth="5"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={RAIO_ANEL}
            fill="none"
            stroke={corModo}
            strokeWidth="5"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            strokeDasharray={`${COMPRIMENTO_ANEL} ${COMPRIMENTO_ANEL}`}
            initial={{ strokeDashoffset: COMPRIMENTO_ANEL }}
            animate={{ strokeDashoffset: tracoAnel }}
            transition={{ duration: 1, ease: "linear" }}
            className="opacity-20"
          />
        </svg>

        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <span
            className={[
              'font-display text-[72px] sm:text-[100px] font-bold tabular-nums tracking-tighter text-texto select-none',
              briloClasse
            ].join(' ')}
          >
            {formatarTempoPomodoro(estado.restante)}
          </span>
        </div>
      </div>

      {/* Seletor de Tarefa */}
      <div className="relative mb-8 sm:mb-12">
        <button
          type="button"
          onClick={() => setDropdownTarefasAberto(!dropdownTarefasAberto)}
          className="flex items-center gap-2 rounded-2xl border border-borda bg-superficie px-5 py-2.5 text-sm font-medium text-texto-mudo transition-all hover:border-borda/80 hover:text-texto shadow-sm"
        >
          <span>{tarefas.find(t => t.id === tarefaSelecionada)?.texto || 'Selecionar tarefa'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={['size-4 transition-transform', dropdownTarefasAberto && 'rotate-180'].join(' ')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {dropdownTarefasAberto && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-1/2 mb-3 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-borda bg-superficie shadow-xl z-50"
            >
              <div className="max-h-60 overflow-y-auto p-2 scrollbar-fina">
                {tarefasPendentes.length === 0 ? (
                  <p className="p-4 text-center text-xs text-texto-mudo">Nenhuma tarefa pendente</p>
                ) : (
                  tarefasPendentes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTarefaSelecionada(t.id)
                        setDropdownTarefasAberto(false)
                      }}
                      className={[
                        'w-full rounded-xl px-4 py-3 text-left text-sm transition-colors',
                        tarefaSelecionada === t.id ? 'bg-primaria/10 text-primaria font-semibold' : 'hover:bg-fundo text-texto'
                      ].join(' ')}
                    >
                      {t.texto}
                    </button>
                  ))
                )}
                <div className="border-t border-borda mt-2 pt-2">
                   <p className="px-4 py-2 text-[10px] uppercase font-bold text-texto-mudo/60">Ações</p>
                   <button 
                    onClick={() => {
                      setTarefaSelecionada(null)
                      setDropdownTarefasAberto(false)
                    }}
                    className="w-full rounded-xl px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50"
                   >
                     Limpar seleção
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controles Principais */}
      <div className="flex items-center gap-6">
        <motion.button
          type="button"
          onClick={() => despachar({ tipo: 'zerar_fase' })}
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
          onClick={() => despachar({ tipo: 'alternar_rodando' })}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="grid size-24 place-content-center rounded-[40px] text-white shadow-lg transition-transform"
          style={{ backgroundColor: corModo }}
        >
          {estado.rodando ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="size-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="size-10 translate-x-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </motion.button>

        <div className="size-14" /> {/* Spacer para equilibrar o reset */}
      </div>

      {/* Seção Opcional: Listas de Bloqueio */}
      <div className="mt-20 w-full max-w-xl opacity-40 hover:opacity-100 transition-opacity">
        <EditorListasBloqueio recolhivel />
      </div>
    </div>
  )
}
