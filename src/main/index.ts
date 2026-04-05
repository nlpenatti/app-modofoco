import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { existsSync, rmSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Registry from 'winreg'
import icon from '../../resources/icon.png?asset'
import {
  abrirCalculadoraSistema,
  abrirPesquisaWeb,
  minimizarTodasJanelas,
  alternarMudoSistema,
  abrirPastaEstudos
} from './servicoAtalhosSistema'
import { configurarAtualizacaoAutomatica, verificarAtualizacoesManual } from './servicoAtualizacao'
import { abrirFluxoDesinstalacao, definirMonitorFocoAtivo } from './servicoMonitorFoco'
import {
  definirEstadoBridgeExtensao,
  encerrarServidorBridgeExtensao,
  iniciarServidorBridgeExtensao
} from './servicoBridgeExtensao'
import {
  garantirListasCarregadas,
  obterListasBloqueioParaRenderer,
  restaurarListasBloqueioPadrao,
  salvarListasBloqueio
} from './servicoListasBloqueio'
import {
  encerrarAtalhosGlobaisPomodoro,
  registrarAtalhosGlobaisPomodoro
} from './servicoAtalhosGlobaisPomodoro'
import { mostrarNotificacaoModoFoco } from './servicoNotificacaoSistema'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 880,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function verificarEResetarSeNovaInstalacao(): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve(false)

    const regKey = new Registry({
      hive: Registry.HKCU,
      key: '\\Software\\ModoFoco'
    })

    regKey.get('NovaInstalacao', (err, item) => {
      if (!err && item && item.value === '1') {
        // Limpar flag
        regKey.remove('NovaInstalacao', () => {})

        // Apagar dados de usuário do backend
        try {
          const udPath = app.getPath('userData')
          // Apagar json das listas se existir
          const listasFile = join(udPath, 'listas-bloqueio.json')
          if (existsSync(listasFile)) rmSync(listasFile)
          
          // Nota: O localStorage / IndexedDB vive em Partitions. 
          // O mais seguro para resetar o frontend do electron é via session
        } catch (e) {
          console.error('[Reset] Erro ao limpar arquivos:', e)
        }

        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  const isNovaInstalacao = await verificarEResetarSeNovaInstalacao()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.foco.modo')

  if (isNovaInstalacao) {
    // Limpar cache, localStorage e IndexedDB da sessão principal do usuário
    try {
      await session.defaultSession.clearStorageData()
      console.log('[Reset] Storage do renderer limpo com sucesso.')
    } catch (e) {
      console.error('[Reset] Erro ao limpar storage da session:', e)
    }
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('monitor-foco:definir', (_, ativo: boolean) => {
    const ativoReal = Boolean(ativo)
    definirEstadoBridgeExtensao(ativoReal)
    return definirMonitorFocoAtivo(ativoReal)
  })

  ipcMain.handle('app:abrir-desinstalacao', () => abrirFluxoDesinstalacao())

  ipcMain.handle('app:abrir-calculadora', () => abrirCalculadoraSistema())

  ipcMain.handle('app:pesquisar-web', (_, termo: unknown) =>
    abrirPesquisaWeb(typeof termo === 'string' ? termo : '')
  )

  ipcMain.handle('app:verificar-atualizacoes', () => verificarAtualizacoesManual())

  ipcMain.handle('app:minimizar-todas', () => minimizarTodasJanelas())
  ipcMain.handle('app:alternar-mudo', () => alternarMudoSistema())
  ipcMain.handle('app:abrir-pasta-estudos', () => abrirPastaEstudos())

  ipcMain.handle('app:abrir-pasta-extensao', async () => {
    try {
      const pastaDev = join(app.getAppPath(), 'extensao-modo-foco')
      const pastaProd = join(process.resourcesPath, 'extensao')
      const target = app.isPackaged ? pastaProd : pastaDev
      if (existsSync(target)) {
        await shell.openPath(target)
        return { ok: true }
      }
      return { ok: false, motivo: 'Pasta da extensão não encontrada' }
    } catch (e: any) {
      return { ok: false, motivo: e.message }
    }
  })

  ipcMain.handle('app:obter-versao', () => app.getVersion())

  ipcMain.handle('notificacao:sistema', (_event, payload: { titulo?: unknown; corpo?: unknown }) => {
    const titulo = typeof payload?.titulo === 'string' ? payload.titulo : 'Modo Foco'
    const corpo = typeof payload?.corpo === 'string' ? payload.corpo : ''
    return { ok: mostrarNotificacaoModoFoco(titulo, corpo) }
  })

  ipcMain.handle('listas-bloqueio:obter', () => {
    const dados = obterListasBloqueioParaRenderer()
    return {
      ok: true as const,
      hosts: dados.hosts,
      indicadoresTituloJanela: dados.indicadoresTituloJanela
    }
  })

  ipcMain.handle(
    'listas-bloqueio:salvar',
    (_event, payload: { hosts: unknown; indicadoresTituloJanela: unknown }) => {
      const r = salvarListasBloqueio(payload)
      return {
        ok: true as const,
        hosts: r.dados.hosts,
        indicadoresTituloJanela: r.dados.indicadoresTituloJanela
      }
    }
  )

  ipcMain.handle('listas-bloqueio:restaurar-padrao', () => {
    const dados = restaurarListasBloqueioPadrao()
    return {
      ok: true as const,
      hosts: dados.hosts,
      indicadoresTituloJanela: dados.indicadoresTituloJanela
    }
  })

  configurarAtualizacaoAutomatica()

  garantirListasCarregadas()
  iniciarServidorBridgeExtensao()

  registrarAtalhosGlobaisPomodoro()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    encerrarServidorBridgeExtensao()
    app.quit()
  }
})

app.on('before-quit', () => {
  encerrarAtalhosGlobaisPomodoro()
  encerrarServidorBridgeExtensao()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
