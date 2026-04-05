import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AtalhoGlobalPomodoroPayload,
  EventoMonitorAtividade,
  ListasBloqueioPayload,
  ResultadoAtalho,
  ResultadoDesinstalacao,
  ResultadoListasBloqueio,
  ResultadoMonitorFoco,
  ResultadoNotificacaoSistema,
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

  minimizarTodasJanelas: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:minimizar-todas'),

  alternarMudo: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:alternar-mudo'),

  abrirPastaEstudos: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:abrir-pasta-estudos'),

  abrirPastaExtensao: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:abrir-pasta-extensao'),

  obterVersaoApp: (): Promise<string> => ipcRenderer.invoke('app:obter-versao'),

  mostrarNotificacaoSistema: (titulo: string, corpo: string): Promise<ResultadoNotificacaoSistema> =>
    ipcRenderer.invoke('notificacao:sistema', { titulo, corpo }),

  obterListasBloqueio: (): Promise<ResultadoListasBloqueio> =>
    ipcRenderer.invoke('listas-bloqueio:obter'),

  salvarListasBloqueio: (payload: ListasBloqueioPayload): Promise<ResultadoListasBloqueio> =>
    ipcRenderer.invoke('listas-bloqueio:salvar', payload),

  restaurarListasBloqueioPadrao: (): Promise<ResultadoListasBloqueio> =>
    ipcRenderer.invoke('listas-bloqueio:restaurar-padrao'),

  aoAtividadeMonitor: (callback: (evento: EventoMonitorAtividade) => void): (() => void) => {
    const canal = 'monitor-foco:atividade'
    const listener = (_: IpcRendererEvent, payload: EventoMonitorAtividade): void => {
      callback(payload)
    }
    ipcRenderer.on(canal, listener)
    return () => {
      ipcRenderer.removeListener(canal, listener)
    }
  },

  aoAtalhoGlobalPomodoro: (callback: (payload: AtalhoGlobalPomodoroPayload) => void): (() => void) => {
    const canal = 'pomodoro:atalho-global'
    const listener = (_: IpcRendererEvent, payload: AtalhoGlobalPomodoroPayload): void => {
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
