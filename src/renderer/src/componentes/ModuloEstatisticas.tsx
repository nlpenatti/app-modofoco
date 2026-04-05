import { motion } from 'framer-motion'
import type React from 'react'
import { useMemo } from 'react'
import { PainelInicio } from './PainelInicio'
import { GraficoBarrasFocoSemana } from './GraficoBarrasFocoSemana'
import { usePomodoro } from '../contextos/ContextoPomodoro'
import { agregarMinutosFocoUltimosDias } from '../utilHistoricoPomodoro'
import {
  contarTarefasRotinaConcluidas,
  diasSequenciaComFoco,
  formatarDataHoraSessao,
  formatarMinutosFocoResumido,
  minutosFocoHoje,
  saidasFocoHoje
} from '../utilMetricasFoco'

type AtividadeMesclada = 
  | { tipo: 'foco', id: string, instante: string, duracaoSegundos: number }
  | { tipo: 'distracao', id: string, instante: string, tituloJanela?: string, indicador?: string }

function rotuloMinutosFoco(segundos: number): string {
  const m = Math.max(1, Math.round(segundos / 60))
  return `${m} min`
}

export function ModuloEstatisticas(): React.JSX.Element {
  const { historicoFocosConcluidos, registrosAtividade, limparHistoricoFocos } = usePomodoro()

  const dadosGrafico = useMemo(
    () => agregarMinutosFocoUltimosDias(historicoFocosConcluidos, 7),
    [historicoFocosConcluidos]
  )

  const hojeMin = useMemo(() => minutosFocoHoje(historicoFocosConcluidos), [historicoFocosConcluidos])
  const sequencia = useMemo(
    () => diasSequenciaComFoco(historicoFocosConcluidos),
    [historicoFocosConcluidos]
  )
  const tarefasFeitas = contarTarefasRotinaConcluidas()
  const districoesHoje = useMemo(() => saidasFocoHoje(registrosAtividade), [registrosAtividade])

  const atividadeMesclada = useMemo(() => {
    const foco: AtividadeMesclada[] = historicoFocosConcluidos.map(h => ({
      tipo: 'foco',
      id: h.id,
      instante: h.instanteFim,
      duracaoSegundos: h.duracaoSegundos
    }))
    const dist: AtividadeMesclada[] = registrosAtividade.map(r => ({
      tipo: 'distracao',
      id: r.id,
      instante: r.instante,
      tituloJanela: r.tituloJanela,
      indicador: r.indicador
    }))
    return [...foco, ...dist].sort((a, b) => b.instante.localeCompare(a.instante)).slice(0, 30)
  }, [historicoFocosConcluidos, registrosAtividade])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <CartaoKpi
          titulo="Hoje"
          valor={formatarMinutosFocoResumido(hojeMin)}
          gradiente="from-primaria/40 to-secundaria/25"
          icone={
            <svg className="size-5 text-primaria" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <CartaoKpi
          titulo="Saídas do foco"
          valor={String(districoesHoje)}
          gradiente="from-rose-400/40 to-orange-300/20"
          icone={
            <svg className="size-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <CartaoKpi
          titulo="Sequência"
          valor={sequencia > 0 ? `${sequencia} ${sequencia === 1 ? 'dia' : 'dias'}` : '—'}
          gradiente="from-secundaria/35 to-primaria/20"
          icone={
            <svg className="size-5 text-secundaria" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
          }
        />
        <CartaoKpi
          titulo="Tarefas feitas"
          valor={String(tarefasFeitas)}
          gradiente="from-sky-300/40 to-primaria/15"
          icone={
            <svg className="size-5 text-pausa-longa" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="rounded-[var(--radius-card-lg)] border border-borda bg-superficie p-5 shadow-[var(--shadow-app-card)] sm:p-6">
        <h3 className="font-display text-base font-semibold text-texto">
          <span aria-hidden>⚡ </span>
          Atividade nos últimos 7 dias
        </h3>
        <p className="mt-1 text-xs text-texto-mudo">Horas de blocos de foco concluídos (só neste aparelho).</p>
        <div className="mt-4">
          <GraficoBarrasFocoSemana dados={dadosGrafico} eixoEmHoras />
        </div>
      </div>

      <section className="rounded-[var(--radius-card)] border border-borda bg-superficie p-5 shadow-[var(--shadow-app-soft)] sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-content-center rounded-full bg-primaria/20 text-primaria">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-texto">Atividade recente</h3>
            {(historicoFocosConcluidos.length > 0 || registrosAtividade.length > 0) && (
              <button
                type="button"
                onClick={limparHistoricoFocos}
                className="text-xs font-semibold text-primaria underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria/35"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
        {atividadeMesclada.length === 0 ? (
          <p className="mt-4 text-center text-sm text-texto-mudo">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {atividadeMesclada.map((item) => {
              const ehFoco = item.tipo === 'foco'
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-borda bg-superficie-elevada pl-4 pr-4 py-3.5 shadow-[var(--shadow-app-soft)]"
                >
                  <span
                    className={[
                      "absolute bottom-3 left-0 top-3 w-1.5 rounded-full",
                      ehFoco ? "bg-primaria" : "bg-rose-500"
                    ].join(' ')}
                    aria-hidden
                  />
                  <div className="pl-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-texto">
                        {ehFoco ? `Foco · ${rotuloMinutosFoco(item.duracaoSegundos)}` : 'Saída do foco'}
                      </p>
                      <span className="text-[10px] font-medium text-texto-mudo/60">
                        {formatarDataHoraSessao(item.instante)}
                      </span>
                    </div>
                    {ehFoco ? (
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-texto-mudo">
                        <span className="inline-flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-primaria" aria-hidden />
                          Foco concluído
                        </span>
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-col gap-1">
                        <p className="text-xs text-texto-mudo">
                          Distração detectada: <span className="font-medium text-texto">{item.indicador || 'Outro'}</span>
                        </p>
                        {item.tituloJanela && (
                          <p className="truncate text-[10px] text-texto-mudo/60 italic" title={item.tituloJanela}>
                            {item.tituloJanela}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-texto-mudo">Atalhos rápidos</h3>
        <PainelInicio />
      </section>
    </div>
  )
}

function CartaoKpi({
  titulo,
  valor,
  gradiente,
  icone
}: {
  titulo: string
  valor: string
  gradiente: string
  icone: React.ReactNode
}): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[var(--radius-card)] border border-borda bg-superficie p-4 shadow-[var(--shadow-app-soft)]"
    >
      <span
        className={`pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br ${gradiente} blur-xl`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-texto-mudo">{titulo}</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-texto">{valor}</p>
        </div>
        <span className="grid size-10 shrink-0 place-content-center rounded-2xl bg-superficie-elevada ring-1 ring-borda/80">
          {icone}
        </span>
      </div>
    </motion.div>
  )
}
