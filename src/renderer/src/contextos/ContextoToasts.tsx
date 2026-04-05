import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'

export type TipoToast = 'sucesso' | 'erro'

type ToastItem = {
  id: string
  mensagem: string
  tipo: TipoToast
}

type ValorContexto = {
  mostrarToast: (mensagem: string, tipo: TipoToast) => void
}

const ContextoToasts = createContext<ValorContexto | null>(null)

const DURACAO_MS = 4800

function ToastLinha({
  id,
  mensagem,
  tipo,
  aoExpirar
}: {
  id: string
  mensagem: string
  tipo: TipoToast
  aoExpirar: (id: string) => void
}): React.JSX.Element {
  useEffect(() => {
    const t = window.setTimeout(() => aoExpirar(id), DURACAO_MS)
    return () => window.clearTimeout(t)
  }, [id, aoExpirar])

  return (
    <div
      className={[
        'pointer-events-auto selecionavel rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md',
        tipo === 'sucesso'
          ? 'border-borda bg-superficie/98 text-texto shadow-[var(--shadow-app-soft)]'
          : 'border-rose-200/90 bg-superficie/98 text-rose-900'
      ].join(' ')}
    >
      {mensagem}
    </div>
  )
}

export function ProvedorToasts({ children }: { children: ReactNode }): React.JSX.Element {
  const [filas, setFilas] = useState<ToastItem[]>([])

  const mostrarToast = useCallback((mensagem: string, tipo: TipoToast): void => {
    const id = crypto.randomUUID()
    setFilas((atual) => [...atual, { id, mensagem, tipo }])
  }, [])

  const aoExpirarToast = useCallback((id: string): void => {
    setFilas((a) => a.filter((x) => x.id !== id))
  }, [])

  const valor = useMemo(() => ({ mostrarToast }), [mostrarToast])

  return (
    <ContextoToasts.Provider value={valor}>
      {children}
      {filas.length > 0 && (
        <div
          className="pointer-events-none fixed top-4 right-6 z-[90] flex w-[min(100vw-3rem,22rem)] flex-col gap-2"
          role="status"
          aria-live="polite"
        >
          {filas.map((t) => (
            <ToastLinha
              key={t.id}
              id={t.id}
              mensagem={t.mensagem}
              tipo={t.tipo}
              aoExpirar={aoExpirarToast}
            />
          ))}
        </div>
      )}
    </ContextoToasts.Provider>
  )
}

/* Hook usado em árvore sob ProvedorToasts. */
// eslint-disable-next-line react-refresh/only-export-components -- API intencional do contexto
export function useToasts(): ValorContexto {
  const ctx = useContext(ContextoToasts)
  if (!ctx) {
    throw new Error('useToasts deve ser usado dentro de ProvedorToasts')
  }
  return ctx
}
