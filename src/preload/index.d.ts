import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      definirMonitorFoco: (ativo: boolean) => Promise<{ ok: boolean; motivo?: string }>
      abrirDesinstalacao: () => Promise<{ ok: boolean; motivo?: string }>
      abrirCalculadora: () => Promise<{ ok: boolean; motivo?: string }>
      pesquisarNaWeb: (termo: string) => Promise<{ ok: boolean; motivo?: string }>
      verificarAtualizacoes: () => Promise<{ ok: boolean; mensagem: string }>
      minimizarTodasJanelas: () => Promise<{ ok: boolean; motivo?: string }>
      alternarMudo: () => Promise<{ ok: boolean; motivo?: string }>
      abrirPastaEstudos: () => Promise<{ ok: boolean; motivo?: string }>
      obterVersaoApp: () => Promise<string>
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
      aoAtividadeMonitor: (
        callback: (evento: {
          tipo: 'distraction_detected'
          tituloJanela: string
          instante: string
          indicador?: string
        }) => void
      ) => () => void
    }
  }
}

export {}
