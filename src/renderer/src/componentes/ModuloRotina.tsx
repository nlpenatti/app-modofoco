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
    setItens((lista) => [
      ...lista,
      { id: crypto.randomUUID(), texto, concluido: false }
    ])
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
    <div className="space-y-5">
      <header>
        <h2 className="text-lg font-bold text-slate-900">Rotina do dia</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lista simples para manter estrutura (salva neste computador). Marque o que já fez.
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder="Ex.: 1 bloco de leitura, revisar anotações…"
          className="selecionavel min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={adicionar}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Adicionar
        </button>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum item ainda. Adicione passos da sua rotina acima.</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm"
            >
              <input
                type="checkbox"
                checked={item.concluido}
                onChange={() => alternar(item.id)}
                className="mt-1 size-4 rounded border-indigo-300 text-indigo-600"
                aria-label={`Concluído: ${item.texto}`}
              />
              <span
                className={[
                  'selecionavel flex-1 text-sm leading-relaxed',
                  item.concluido ? 'text-slate-400 line-through' : 'text-slate-800'
                ].join(' ')}
              >
                {item.texto}
              </span>
              <button
                type="button"
                onClick={() => remover(item.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
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
          className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          Limpar concluídos
        </button>
      )}
    </div>
  )
}
