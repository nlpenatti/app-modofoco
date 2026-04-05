import { useCallback, useEffect, useState } from 'react'

type ItemRotina = {
  id: string
  texto: string
  concluido: boolean
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
    )
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

  useEffect(() => {
    salvarItens(itens)
  }, [itens])

  const adicionar = useCallback((): void => {
    const texto = rascunho.trim()
    if (!texto) return
    setItens((lista) => [...lista, { id: crypto.randomUUID(), texto, concluido: false }])
    setRascunho('')
  }, [rascunho])

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
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-pretty text-stone-900">Sua lista do dia</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-pretty text-stone-600">
          Fica salva neste computador. Marca o que já rolou e segue o jogo.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label htmlFor="rotina-novo-item" className="min-w-0 flex-1">
          <span className="text-sm font-medium text-stone-700">O que você quer lembrar?</span>
          <input
            id="rotina-novo-item"
            type="text"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            placeholder="Ex.: bloco de leitura, revisar anotações…"
            className="selecionavel mt-2 w-full rounded-2xl border border-stone-200/90 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-800 shadow-inner shadow-stone-900/5 outline-none transition placeholder:text-stone-400 focus:border-teal-400/70 focus:bg-white focus:ring-2 focus:ring-teal-500/25"
          />
        </label>
        <button
          type="button"
          onClick={adicionar}
          className="inline-flex shrink-0 justify-center rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:py-2.5"
        >
          Adicionar
        </button>
      </div>

      {itens.length === 0 ? (
        <p className="rounded-2xl bg-stone-100/70 px-4 py-6 text-center text-sm text-stone-600 ring-1 ring-stone-200/60">
          Nada aqui ainda — joga o primeiro passo da sua rotina acima.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/90 px-4 py-3.5 shadow-[var(--shadow-app-soft)] transition hover:border-teal-200/50"
            >
              <label
                htmlFor={`rotina-item-${item.id}`}
                className="inline-flex flex-1 cursor-pointer items-start gap-3"
              >
                <input
                  id={`rotina-item-${item.id}`}
                  type="checkbox"
                  checked={item.concluido}
                  onChange={() => alternar(item.id)}
                  className="mt-0.5 size-5 shrink-0 rounded-md border-stone-300 text-teal-600 focus:ring-teal-500/40"
                  aria-label={`Concluído: ${item.texto}`}
                />
                <span
                  className={[
                    'selecionavel text-sm leading-relaxed text-pretty',
                    item.concluido ? 'text-stone-400 line-through' : 'font-medium text-stone-800'
                  ].join(' ')}
                >
                  {item.texto}
                </span>
              </label>
              <button
                type="button"
                onClick={() => remover(item.id)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {itens.some((i) => i.concluido) && (
        <button
          type="button"
          onClick={limparConcluidos}
          className="text-sm font-semibold text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
        >
          Limpar concluídos
        </button>
      )}
    </div>
  )
}
