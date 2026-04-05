import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

type ItemRotina = {
  id: string
  texto: string
  concluido: boolean
  prioridade: 'Baixa' | 'Média' | 'Alta'
  sessoesEstimadas: number
  sessoesConcluidas: number
}

const CHAVE_ARMAZENAMENTO = 'modo-foco-rotina-v1'

function carregarItens(): ItemRotina[] {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (!bruto) return []
    const dados = JSON.parse(bruto) as unknown
    if (!Array.isArray(dados)) return []
    return dados.filter(
      (x): x is ItemRotina =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as ItemRotina).id === 'string' &&
        typeof (x as ItemRotina).texto === 'string' &&
        typeof (x as ItemRotina).concluido === 'boolean'
    ).map(x => ({
      ...x,
      prioridade: (x as any).prioridade || 'Média',
      sessoesEstimadas: (x as any).sessoesEstimadas || 1,
      sessoesConcluidas: (x as any).sessoesConcluidas || 0
    }))
  } catch {
    return []
  }
}

function salvarItens(itens: ItemRotina[]): void {
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(itens))
}

export function ModuloRotina(): React.JSX.Element {
  const [itens, setItens] = useState<ItemRotina[]>(carregarItens)
  const [rascunho, setRascunho] = useState('')
  const [prioridade, setPrioridade] = useState<'Baixa' | 'Média' | 'Alta'>('Média')
  const [sessoesEstimadas, setSessoesEstimadas] = useState(1)

  useEffect(() => {
    salvarItens(itens)
    // Disparar evento nativo e customizado para garantir sincronia entre componentes
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('tarefas-atualizadas'))
  }, [itens])

  const adicionar = useCallback((): void => {
    const texto = rascunho.trim()
    if (!texto) return
    const id = crypto.randomUUID()
    setItens((lista) => [
      ...lista,
      {
        id,
        texto,
        concluido: false,
        prioridade,
        sessoesEstimadas,
        sessoesConcluidas: 0
      }
    ])
    setRascunho('')
    setPrioridade('Média')
    setSessoesEstimadas(1)
  }, [rascunho, prioridade, sessoesEstimadas])

  const alternar = useCallback((id: string): void => {
    setItens((lista) =>
      lista.map((item) => (item.id === id ? { ...item, concluido: !item.concluido } : item))
    )
  }, [])

  const remover = useCallback((id: string): void => {
    setItens((lista) => lista.filter((item) => item.id !== id))
  }, [])

  const limparConcluidos = useCallback((): void => {
    setItens((lista) => lista.filter((item) => !item.concluido))
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-4">
      {/* Barra de Adição de Tarefa */}
      <div className="flex items-center gap-3 rounded-[32px] border border-borda bg-superficie p-3 shadow-xl shadow-black/5 sm:p-4">
        <div className="flex flex-1 items-center gap-3 px-2">
          <input
            type="text"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            placeholder="O que você precisa fazer?"
            className="w-full bg-transparent text-sm font-medium text-texto outline-none placeholder:text-texto-mudo/60 sm:text-base"
          />
        </div>

        <div className="h-8 w-px bg-borda/60" />

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as any)}
              className="cursor-pointer appearance-none rounded-2xl bg-fundo px-4 py-2 pr-9 text-xs font-semibold text-texto-mudo outline-none hover:bg-borda/20 focus:ring-2 focus:ring-primaria/20 sm:text-sm"
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-texto-mudo/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <input
            type="number"
            min="1"
            max="20"
            value={sessoesEstimadas}
            onChange={(e) => setSessoesEstimadas(Number(e.target.value))}
            className="w-12 rounded-2xl bg-fundo py-2 text-center text-xs font-bold text-texto outline-none focus:ring-2 focus:ring-primaria/20 sm:w-14 sm:text-sm"
          />
        </div>

        <motion.button
          type="button"
          onClick={adicionar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="grid size-10 shrink-0 place-content-center rounded-2xl bg-primaria text-white shadow-lg shadow-primaria/20 sm:size-12"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </motion.button>
      </div>

      {/* Seção de Tarefas Ativas */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-1">
          <div className="grid size-6 place-content-center rounded-full bg-primaria/10 text-primaria">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight text-texto">Tarefas Ativas</h2>
        </div>

        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-borda/60 bg-superficie/30 py-16 text-center">
            <p className="text-sm font-medium text-texto-mudo">Sua lista está vazia.</p>
            <p className="mt-1 text-xs text-texto-mudo/60">Adicione uma tarefa acima para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map((item, indice) => {
              const corPrioridade =
                item.prioridade === 'Alta'
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : item.prioridade === 'Média'
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-sky-50 text-sky-600 border-sky-100'

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: indice * 0.05 }}
                  className={[
                    'group relative flex items-center gap-4 rounded-[32px] border border-borda bg-superficie p-5 shadow-sm transition-all hover:border-primaria/30 hover:shadow-md',
                    item.concluido ? 'opacity-60' : ''
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => alternar(item.id)}
                    className={[
                      'size-8 shrink-0 rounded-full border-2 transition-all duration-300',
                      item.concluido
                        ? 'border-primaria bg-primaria text-white'
                        : 'border-borda bg-fundo hover:border-primaria/40'
                    ].join(' ')}
                  >
                    {item.concluido && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mx-auto size-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <span
                      className={[
                        'text-base font-semibold leading-tight transition-all',
                        item.concluido ? 'text-texto-mudo line-through' : 'text-texto'
                      ].join(' ')}
                    >
                      {item.texto}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={[
                          'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          corPrioridade
                        ].join(' ')}
                      >
                        {item.prioridade}
                      </span>

                      <div className="flex items-center gap-1.5 text-texto-mudo">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                        <span className="text-xs font-medium">
                          {item.sessoesConcluidas} / {item.sessoesEstimadas} sessões
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remover(item.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    title="Remover tarefa"
                  >
                    <div className="grid size-8 place-content-center rounded-full text-texto-mudo hover:bg-rose-50 hover:text-rose-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}

        {itens.some((i) => i.concluido) && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={limparConcluidos}
              className="text-sm font-bold text-primaria transition-colors hover:text-primaria/80 hover:underline underline-offset-4"
            >
              Limpar tarefas concluídas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
