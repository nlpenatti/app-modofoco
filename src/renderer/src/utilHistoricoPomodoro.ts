const CHAVE = 'modo-foco-historico-focos-v1'
const MAX_ENTRADAS = 48

export type EntradaHistoricoFoco = {
  id: string
  instanteFim: string
  duracaoSegundos: number
}

type Blob = {
  v: 1
  entradas: EntradaHistoricoFoco[]
}

function parsear(bruto: unknown): EntradaHistoricoFoco[] {
  if (typeof bruto !== 'object' || bruto === null) return []
  const o = bruto as Blob
  if (o.v !== 1 || !Array.isArray(o.entradas)) return []
  return o.entradas.filter(
    (e): e is EntradaHistoricoFoco =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as EntradaHistoricoFoco).id === 'string' &&
      typeof (e as EntradaHistoricoFoco).instanteFim === 'string' &&
      typeof (e as EntradaHistoricoFoco).duracaoSegundos === 'number' &&
      Number.isFinite((e as EntradaHistoricoFoco).duracaoSegundos) &&
      (e as EntradaHistoricoFoco).duracaoSegundos > 0
  )
}

export function carregarHistoricoFocosConcluidos(): EntradaHistoricoFoco[] {
  try {
    const json = localStorage.getItem(CHAVE)
    if (!json) return []
    return parsear(JSON.parse(json) as unknown)
  } catch {
    return []
  }
}

function persistir(entradas: EntradaHistoricoFoco[]): void {
  const blob: Blob = { v: 1, entradas }
  localStorage.setItem(CHAVE, JSON.stringify(blob))
}

/** Chamado quando um bloco de foco termina naturalmente (timer). */
export function acrescentarFocoConcluidoNoHistorico(duracaoSegundos: number): EntradaHistoricoFoco[] {
  const nova: EntradaHistoricoFoco = {
    id: crypto.randomUUID(),
    instanteFim: new Date().toISOString(),
    duracaoSegundos: Math.floor(duracaoSegundos)
  }
  const proximo = [nova, ...carregarHistoricoFocosConcluidos()].slice(0, MAX_ENTRADAS)
  persistir(proximo)
  return proximo
}

export function limparArmazenamentoHistoricoFocos(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    /* ignorar */
  }
}

function chaveDiaLocal(data: Date): string {
  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export type PontoBarraFocoDia = {
  chaveDia: string
  rotulo: string
  minutos: number
  ehHoje: boolean
}

/** Agrega minutos de foco por dia local (últimos `dias` dias, incluindo hoje). */
export function agregarMinutosFocoUltimosDias(
  entradas: EntradaHistoricoFoco[],
  dias: number
): PontoBarraFocoDia[] {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const chaveHoje = chaveDiaLocal(hoje)
  const mapa = new Map<string, number>()

  for (let i = dias - 1; i >= 0; i--) {
    const referencia = new Date(hoje)
    referencia.setDate(referencia.getDate() - i)
    mapa.set(chaveDiaLocal(referencia), 0)
  }

  for (const e of entradas) {
    const chave = chaveDiaLocal(new Date(e.instanteFim))
    if (!mapa.has(chave)) continue
    mapa.set(chave, (mapa.get(chave) ?? 0) + Math.max(0, Math.round(e.duracaoSegundos / 60)))
  }

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chaveDia, minutos]) => {
      const referencia = new Date(`${chaveDia}T12:00:00`)
      const rotulo = referencia.toLocaleDateString('pt-BR', { weekday: 'short' })
      return {
        chaveDia,
        rotulo: rotulo.replace('.', ''),
        minutos,
        ehHoje: chaveDia === chaveHoje
      }
    })
}
