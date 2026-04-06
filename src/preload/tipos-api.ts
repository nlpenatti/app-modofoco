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

/** Dados para a UI alinhar pasta da extensão no Chrome com o que o app grava. */
export type InfoBridgeExtensao = {
  pastaGravacaoExtensao: string
  caminhoEspelhoBridge: string
  nomeArquivoEspelho: string
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

export type LinhaBloqueioPadraoUi = {
  chave: string
  rotulo: string
  bloqueado: boolean
}

export type ResultadoObterBloqueiosPadrao =
  | { ok: true; hosts: LinhaBloqueioPadraoUi[]; indicadores: LinhaBloqueioPadraoUi[] }
  | { ok: false; motivo: string }

export type ResultadoSalvarDesativacoesPadrao = { ok: true } | { ok: false; motivo: string }

export type AtalhoGlobalPomodoroPayload = {
  acao: 'alternar_rodando'
}

/** Enviado ao processo principal para espelhar na API da extensão. */
export type PayloadSincroniaPomodoroBridge = {
  restante: number
  fase: 'foco' | 'pausa'
  tipoPausa: 'curta' | 'longa'
  rodando: boolean
}

export type ResultadoNotificacaoSistema = {
  ok: boolean
}

/** Versões públicas do runtime (sem expor `ipcRenderer` nem `process.env`). */
export type VersoesRuntime = {
  electron: string
  chrome: string
  node: string
}
