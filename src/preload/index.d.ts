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
      aoAtividadeMonitor: (
        callback: (evento: {
          tipo: 'distraction_detected'
          tituloJanela: string
          instante: string
        }) => void
      ) => () => void
    }
  }
}

export {}
