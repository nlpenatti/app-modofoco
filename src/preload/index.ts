import { contextBridge, ipcRenderer } from 'electron'
import type {
  AtalhoGlobalPomodoroPayload,
  EventoMonitorAtividade,
  ListasBloqueioPayload,
  PayloadSincroniaPomodoroBridge,
  InfoBridgeExtensao,
  ResultadoAtalho,
  ResultadoDesinstalacao,
  ResultadoListasBloqueio,
  ResultadoMonitorFoco,
  ResultadoNotificacaoSistema,
  ResultadoObterBloqueiosPadrao,
  ResultadoSalvarDesativacoesPadrao,
  ResultadoVerificacaoAtualizacao,
  VersoesRuntime
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

  minimizarJanelasExceto: (permitidos: string[]): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:minimizar-exceto', permitidos),

  definirNaoPerturbe: (ativo: boolean): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:definir-nao-perturbe', ativo),

  alternarMudo: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:alternar-mudo'),

  abrirPastaEstudos: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:abrir-pasta-estudos'),

  abrirPastaExtensao: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:abrir-pasta-extensao'),

  obterInfoBridgeExtensao: (): Promise<InfoBridgeExtensao> =>
    ipcRenderer.invoke('app:obter-info-bridge-extensao'),

  abrirEspelhoBridgeNoExplorador: (): Promise<ResultadoAtalho> =>
    ipcRenderer.invoke('app:abrir-espelho-bridge-no-explorador'),

  obterVersaoApp: (): Promise<string> => ipcRenderer.invoke('app:obter-versao'),

  obterVersoesRuntime: (): VersoesRuntime => ({
    electron: process.versions.electron ?? '',
    chrome: process.versions.chrome ?? '',
    node: process.versions.node ?? ''
  }),

  instalarAtualizacao: (): Promise<void> => ipcRenderer.invoke('app:instalar-atualizacao'),

  mostrarNotificacaoSistema: (titulo: string, corpo: string): Promise<ResultadoNotificacaoSistema> =>
    ipcRenderer.invoke('notificacao:sistema', { titulo, corpo }),

  obterListasBloqueio: (): Promise<ResultadoListasBloqueio> =>
    ipcRenderer.invoke('listas-bloqueio:obter'),

  salvarListasBloqueio: (payload: ListasBloqueioPayload): Promise<ResultadoListasBloqueio> =>
    ipcRenderer.invoke('listas-bloqueio:salvar', payload),

  restaurarListasBloqueioPadrao: (): Promise<ResultadoListasBloqueio> =>
    ipcRenderer.invoke('listas-bloqueio:restaurar-padrao'),

  obterBloqueiosPadrao: (): Promise<ResultadoObterBloqueiosPadrao> =>
    ipcRenderer.invoke('listas-bloqueio:obter-padrao'),

  salvarDesativacoesBloqueioPadrao: (payload: {
    hostsDesativados: string[]
    indicadoresDesativados: string[]
  }): Promise<ResultadoSalvarDesativacoesPadrao> =>
    ipcRenderer.invoke('listas-bloqueio:salvar-desativacoes-padrao', payload),

  aoAtualizacaoBaixada: (callback: (versao: string) => void): (() => void) => {
    const canal = 'app:atualizacao-baixada'
    const listener = (_: IpcRendererEvent, versao: string): void => {
      callback(versao)
    }
    ipcRenderer.on(canal, listener)
    return () => {
      ipcRenderer.removeListener(canal, listener)
    }
  },

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
  },

  aoAvisoFechamentoBloqueado: (callback: () => void): (() => void) => {
    const canal = 'app:aviso-fechamento-bloqueado'
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on(canal, listener)
    return () => {
      ipcRenderer.removeListener(canal, listener)
    }
  },

  sincronizarPomodoroComBridge: (payload: PayloadSincroniaPomodoroBridge): void => {
    ipcRenderer.send('bridge:pomodoro-estado', payload)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
