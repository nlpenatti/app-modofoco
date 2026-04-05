import type React from 'react'

type Props = {
  aoFechar: () => void
}

export function AlertaDistraicao({ aoFechar }: Props): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-texto/40 p-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alerta-dist-titulo"
    >
      <div className="w-full max-w-md rounded-[var(--radius-card-lg)] border border-rose-200/80 bg-superficie/98 p-7 shadow-[var(--shadow-app-card)] backdrop-blur-sm">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="alerta-dist-titulo" className="font-display text-lg font-semibold text-texto">
              Voltemos ao foco!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-texto-mudo">
              Parece que o rumo saiu um pouco do estudo. Sem julgamento — respira e retoma o que você
              tinha combinado com você mesmo.
            </p>
          </div>
        </div>
        <div className="mt-7 flex justify-end gap-2 border-t border-borda pt-5">
          <button
            type="button"
            onClick={aoFechar}
            className="inline-flex rounded-2xl bg-primaria px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-app-soft)] transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/45 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
          >
            Voltar ao foco
          </button>
        </div>
      </div>
    </div>
  )
}
