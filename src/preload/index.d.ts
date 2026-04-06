declare global {
  interface Window {
    api: {
      definirMonitorFoco: (ativo: boolean) => Promise<{ ok: boolean; motivo?: string }>
      abrirDesinstalacao: () => Promise<{ ok: boolean; motivo?: string }>
      abrirCalculadora: () => Promise<{ ok: boolean; motivo?: string }>
      pesquisarNaWeb: (termo: string) => Promise<{ ok: boolean; motivo?: string }>
      verificarAtualizacoes: () => Promise<{ ok: boolean; mensagem: string }>
      minimizarTodasJanelas: () => Promise<{ ok: boolean; motivo?: string }>
      minimizarJanelasExceto: (permitidos: string[]) => Promise<{ ok: boolean; motivo?: string }>
      definirNaoPerturbe: (ativo: boolean) => Promise<{ ok: boolean; motivo?: string }>
      alternarMudo: () => Promise<{ ok: boolean; motivo?: string }>
      abrirPastaEstudos: () => Promise<{ ok: boolean; motivo?: string }>
      abrirPastaExtensao: () => Promise<{ ok: boolean; motivo?: string }>
      obterInfoBridgeExtensao: () => Promise<{
        pastaGravacaoExtensao: string
        caminhoEspelhoBridge: string
        nomeArquivoEspelho: string
      }>
      abrirEspelhoBridgeNoExplorador: () => Promise<{ ok: boolean; motivo?: string }>
      obterVersaoApp: () => Promise<string>
      obterVersoesRuntime: () => {
        electron: string
        chrome: string
        node: string
      }
      instalarAtualizacao: () => Promise<void>
      obterListasBloqueio: () => Promise<
        | { ok: true; hosts: string[]; indicadoresTituloJanela: string[] }
        | { ok: false; motivo: string }
      >
      salvarListasBloqueio: (payload: {
        hosts: string[]
        indicadoresTituloJanela: string[]
      }) => Promise<
        | { ok: true; hosts: string[]; indicadoresTituloJanela: string[] }
        | { ok: false; motivo: string }
      >
      restaurarListasBloqueioPadrao: () => Promise<
        | { ok: true; hosts: string[]; indicadoresTituloJanela: string[] }
        | { ok: false; motivo: string }
      >
      obterBloqueiosPadrao: () => Promise<
        | {
            ok: true
            hosts: { chave: string; rotulo: string; bloqueado: boolean }[]
            indicadores: { chave: string; rotulo: string; bloqueado: boolean }[]
          }
        | { ok: false; motivo: string }
      >
      salvarDesativacoesBloqueioPadrao: (payload: {
        hostsDesativados: string[]
        indicadoresDesativados: string[]
      }) => Promise<{ ok: true } | { ok: false; motivo: string }>
      aoAtualizacaoBaixada: (callback: (versao: string) => void) => () => void
      aoAtividadeMonitor: (
        callback: (evento: {
          tipo: 'distraction_detected'
          tituloJanela: string
          instante: string
          indicador?: string
        }) => void
      ) => () => void
      mostrarNotificacaoSistema: (titulo: string, corpo: string) => Promise<{ ok: boolean }>
      aoAtalhoGlobalPomodoro: (
        callback: (payload: { acao: 'alternar_rodando' }) => void
      ) => () => void
      aoAvisoFechamentoBloqueado: (callback: () => void) => () => void
      sincronizarPomodoroComBridge: (payload: {
        restante: number
        fase: 'foco' | 'pausa'
        tipoPausa: 'curta' | 'longa'
        rodando: boolean
      }) => void
    }
  }
}

export {}
