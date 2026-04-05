export type EventoMonitorAtividade = {
  tipo: 'distraction_detected'
  tituloJanela: string
  instante: string
  /** Trecho do título que casou com a lista (quando identificado). */
  indicador?: string
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

export type ListasBloqueioPayload = {
  hosts: string[]
  indicadoresTituloJanela: string[]
}

export type ResultadoListasBloqueio =
  | { ok: true; hosts: string[]; indicadoresTituloJanela: string[] }
  | { ok: false; motivo: string }

export type AtalhoGlobalPomodoroPayload = {
  acao: 'alternar_rodando'
}

export type ResultadoNotificacaoSistema = {
  ok: boolean
}
