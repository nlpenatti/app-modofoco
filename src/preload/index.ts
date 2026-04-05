import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  EventoMonitorAtividade,
  ResultadoAtalho,
  ResultadoDesinstalacao,
  ResultadoMonitorFoco,
  ResultadoVerificacaoAtualizacao
} from './tipos-api'
import type { IpcRendererEvent } from 'electron'

const api = {
  definirMonitorFoco: (ativo: boolean): Promise<ResultadoMonitorFoco> =>
    ipcRenderer.invoke('monitor-foco:definir', ativo),

  abrirDesinstalacao: (): Promise<ResultadoDesinstalacao> =>
    ipcRenderer.invoke('app:abrir-desinstalacao'),

  abrirCalculadora: (): Promise<ResultadoAtalho> => ipcRenderer.invoke('app:abrir-calculadora'),

  pesquisarNaWeb: (termo: string): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:pesquisar-web', termo),

  verificarAtualizacoes: (): Promise<ResultadoVerificacaoAtualizacao> =>
    ipcRenderer.invoke('app:verificar-atualizacoes'),

  aoAtividadeMonitor: (callback: (evento: EventoMonitorAtividade) => void): (() => void) => {
    const canal = 'monitor-foco:atividade'
    const listener = (_: IpcRendererEvent, payload: EventoMonitorAtividade): void => {
      callback(payload)
    }
    ipcRenderer.on(canal, listener)
    return () => {
      ipcRenderer.removeListener(canal, listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
