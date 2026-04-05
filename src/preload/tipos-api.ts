export type EventoMonitorAtividade = {
  tipo: 'distraction_detected'
  tituloJanela: string
  instante: string
}

export type ResultadoMonitorFoco = {
  ok: boolean
  motivo?: string
}

export type ResultadoDesinstalacao = {
  ok: boolean
  motivo?: string
}

export type ResultadoAtalho = {
  ok: boolean
  motivo?: string
}

export type ResultadoVerificacaoAtualizacao = {
  ok: boolean
  mensagem: string
}
