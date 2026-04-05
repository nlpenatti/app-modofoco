import type { EntradaHistoricoFoco } from './utilHistoricoPomodoro'
import type { LinhaRegistroAtividade } from './contextos/ContextoPomodoro'

const CHAVE_ROTINA = 'modo-foco-rotina-v1'

function chaveDiaLocal(data: Date): string {
  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function minutosFocoHoje(entradas: EntradaHistoricoFoco[]): number {
  const hoje = chaveDiaLocal(new Date())
  let total = 0
  for (const e of entradas) {
    if (chaveDiaLocal(new Date(e.instanteFim)) === hoje) {
      total += Math.max(0, Math.round(e.duracaoSegundos / 60))
    }
  }
  return total
}

export function minutosFocoTotal(entradas: EntradaHistoricoFoco[]): number {
  return entradas.reduce((acc, e) => acc + Math.max(0, Math.round(e.duracaoSegundos / 60)), 0)
}

/** Saídas do foco hoje. */
export function saidasFocoHoje(registros: LinhaRegistroAtividade[]): number {
  const hoje = chaveDiaLocal(new Date())
  return registros.filter((r) => r.instante.startsWith(hoje)).length
}

/** Dias consecutivos (incluindo hoje) em que houve pelo menos um foco registrado. */
export function diasSequenciaComFoco(entradas: EntradaHistoricoFoco[]): number {
  const diasComFoco = new Set(
    entradas.map((e) => chaveDiaLocal(new Date(e.instanteFim)))
  )
  let streak = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (diasComFoco.has(chaveDiaLocal(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function contarTarefasRotinaConcluidas(): number {
  try {
    const bruto = localStorage.getItem(CHAVE_ROTINA)
    if (!bruto) return 0
    const dados = JSON.parse(bruto) as unknown
    if (!Array.isArray(dados)) return 0
    return dados.filter(
      (x) => typeof x === 'object' && x !== null && (x as { concluido?: boolean }).concluido === true
    ).length
  } catch {
    return 0
  }
}

export function formatarMinutosFocoResumido(minutos: number): string {
  if (minutos <= 0) return '0min'
  if (minutos < 60) return `${minutos}min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

export function formatarDataHoraSessao(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}
