import type React from 'react'
import { useCallback, useState } from 'react'

/** Chave em localStorage; incrementar se o conteúdo do onboarding mudar de forma relevante. */
export const CHAVE_ONBOARDING_CONCLUIDO = 'modo-foco-onboarding-v1'

const passos = [
  {
    id: 'extensao',
    titulo: 'Extensão no Chrome ou Edge',
    corpo: (
      <div className="space-y-3 text-sm leading-relaxed text-texto-mudo">
        <p>
          O app conversa com o navegador só na sua máquina. Para bloquear sites durante o foco,
          instale a pasta <strong className="text-texto">extensao-modo-foco</strong> que vem junto
          do projeto (mesmo nível do código do app).
        </p>
        <ol className="list-decimal space-y-2 ps-4 marker:text-texto-mudo">
          <li>
            Abra{' '}
            <code className="rounded bg-superficie-elevada px-1.5 py-0.5 text-[12px] text-texto">
              chrome://extensions
            </code>{' '}
            ou{' '}
            <code className="rounded bg-superficie-elevada px-1.5 py-0.5 text-[12px] text-texto">
              edge://extensions
            </code>
            .
          </li>
          <li>Ative o <strong>Modo do desenvolvedor</strong>.</li>
          <li>
            Clique abaixo para abrir a pasta da extensão e arraste-a para dentro do navegador (ou use <strong>Carregar sem compactação</strong>).
            <div className="mt-2">
              <button
                type="button"
                onClick={() => window.api?.abrirPastaExtensao?.()}
                className="rounded border border-primaria/50 bg-primaria/10 px-3 py-1.5 text-xs font-semibold text-primaria transition hover:bg-primaria/20 focus:outline-none"
              >
                Abrir pasta da Extensão
              </button>
            </div>
          </li>
        </ol>
        <p className="text-xs text-texto-mudo">
          Mantenha o Modo Foco aberto ao estudar — o serviço local sobe com o app.
        </p>
      </div>
    )
  },
  {
    id: 'monitor',
    titulo: 'O monitor de foco',
    corpo: (
      <div className="space-y-3 text-sm leading-relaxed text-texto-mudo">
        <p>
          Com o Pomodoro na fase <strong className="text-texto">foco</strong> ou o{' '}
          <strong className="text-texto">stopwatch</strong> <strong className="text-texto">rodando</strong>,
          o app liga o monitor de distrações.
        </p>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primaria" aria-hidden />
            <span>
              A extensão consulta o app e pode bloquear páginas que estão na lista (definida no app).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primaria" aria-hidden />
            <span>
              No Windows, o app também pode reagir ao título da janela em foco (apps/janelas extras).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primaria" aria-hidden />
            <span>
              Se notar um desvio comum, você recebe um lembrete discreto para voltar ao que combinou
              consigo.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primaria" aria-hidden />
            <span>
              Quando um bloco de foco ou de pausa <strong className="text-texto">termina no timer</strong>, o
              sistema pode mostrar uma notificação (se você permitir nas configurações do SO).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primaria" aria-hidden />
            <span>
              Atalho global <strong className="text-texto">Ctrl+Alt+P</strong> (Windows) ou{' '}
              <strong className="text-texto">Cmd+Alt+P</strong> (macOS) para pausar ou retomar o timer sem
              focar o app.
            </span>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'privacidade',
    titulo: 'Privacidade',
    corpo: (
      <div className="space-y-3 text-sm leading-relaxed text-texto-mudo">
        <p className="selecionavel rounded-xl border border-primaria/20 bg-primaria/10 px-4 py-3 text-texto">
          <strong className="text-texto">Resumo:</strong> listas de bloqueio e estado de foco
          ficam no seu computador; a extensão só fala com o app pelo endereço local{' '}
          <code className="text-[12px] text-texto">127.0.0.1</code> — nada disso é enviado para a
          nuvem pelo Modo Foco por esse canal.
        </p>
        <p className="text-xs text-texto-mudo">
          Você pode ajustar sites e títulos extras em <strong>Foco</strong> → listas de bloqueio.
        </p>
      </div>
    )
  }
] as const

type Props = {
  aoConcluir: () => void
}

export function OnboardingPrimeiraAbertura({ aoConcluir }: Props): React.JSX.Element {
  const [indice, setIndice] = useState(0)
  const total = passos.length
  const eUltimo = indice === total - 1

  const finalizar = useCallback((): void => {
    try {
      localStorage.setItem(CHAVE_ONBOARDING_CONCLUIDO, '1')
    } catch {
      /* ignorar quota / modo privado */
    }
    aoConcluir()
  }, [aoConcluir])

  const passoAtual = passos[indice]

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-texto/35 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-titulo"
    >
      <div className="relative w-full max-w-lg rounded-[var(--radius-card-lg)] border border-borda bg-superficie/98 p-6 shadow-[var(--shadow-app-card)] backdrop-blur-sm sm:p-8">
        <button
          type="button"
          onClick={finalizar}
          className="absolute end-4 top-4 rounded-lg px-2 py-1 text-xs font-medium text-texto-mudo transition hover:bg-superficie-elevada hover:text-texto focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/35"
        >
          Pular introdução
        </button>

        <p className="pe-24 text-[11px] font-medium uppercase tracking-[0.12em] text-primaria">
          Primeira vez aqui
        </p>
        <h2
          id="onboarding-titulo"
          className="font-display mt-1 text-xl font-semibold tracking-tight text-texto"
        >
          {passoAtual.titulo}
        </h2>

        <div className="mt-5">{passoAtual.corpo}</div>

        <div
          className="mt-6 flex items-center justify-between gap-3 border-t border-borda pt-5"
          aria-label="Progresso"
        >
          <div className="flex gap-1.5">
            {passos.map((p, i) => (
              <span
                key={p.id}
                className={[
                  'h-1.5 rounded-full transition-all',
                  i === indice ? 'w-6 bg-primaria' : 'w-1.5 bg-borda'
                ].join(' ')}
                aria-current={i === indice ? 'step' : undefined}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {indice > 0 && (
              <button
                type="button"
                onClick={() => setIndice((i) => i - 1)}
                className="rounded-full border border-borda bg-superficie-elevada px-4 py-2 text-sm font-semibold text-texto transition hover-elevate focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/30"
              >
                Voltar
              </button>
            )}
            {!eUltimo ? (
              <button
                type="button"
                onClick={() => setIndice((i) => i + 1)}
                className="rounded-full bg-primaria px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-app-soft)] transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/45 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={finalizar}
                className="rounded-full bg-primaria px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-app-soft)] transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/45 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
              >
                Começar a usar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
