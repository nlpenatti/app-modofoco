import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Registry from 'winreg'
import icon from '../../resources/icon.png?asset'
import {
  abrirCalculadoraSistema,
  abrirPesquisaWeb,
  minimizarTodasJanelas,
  minimizarJanelasExceto,
  definirNaoPerturbe,
  alternarMudoSistema,
  abrirPastaEstudos
} from './servicoAtalhosSistema'
import {
  configurarAtualizacaoAutomatica,
  verificarAtualizacoesManual,
  instalarAtualizacaoAgora
} from './servicoAtualizacao'
import {
  abrirFluxoDesinstalacao,
  definirMonitorFocoAtivo,
  estaFocoAtivoParaBloqueioFechamento
} from './servicoMonitorFoco'
import {
  definirEstadoBridgeExtensao,
  definirSnapshotPomodoroParaBridge,
  encerrarServidorBridgeExtensao,
  iniciarServidorBridgeExtensao,
  obterInfoBridgeExtensaoParaUi,
  type SnapshotPomodoroBridge
} from './servicoBridgeExtensao'
import {
  garantirListasCarregadas,
  obterBloqueiosPadraoParaUi,
  obterListasBloqueioParaRenderer,
  restaurarListasBloqueioPadrao,
  salvarDesativacoesBloqueioPadrao,
  salvarListasBloqueio
} from './servicoListasBloqueio'
import {
  encerrarAtalhosGlobaisPomodoro,
  registrarAtalhosGlobaisPomodoro
} from './servicoAtalhosGlobaisPomodoro'
import { mostrarNotificacaoModoFoco } from './servicoNotificacaoSistema'

function createWindow(): void {
  // Janela sempre maximizada: sem botão maximizar e sem redimensionar manual.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    icon,
    maximizable: false,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.maximize()
  })

  mainWindow.on('close', (e) => {
    if (estaFocoAtivoParaBloqueioFechamento()) {
      e.preventDefault()
      mainWindow.webContents.send('app:aviso-fechamento-bloqueado')
    }
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

  // Configurar atualizações automáticas passando a janela para eventos
  configurarAtualizacaoAutomatica(mainWindow)
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
        // O usuário pediu explicitamente para NÃO perder dados em novas versões.
        // Vamos apenas limpar a flag do registro para não entrar aqui de novo,
        // mas NÃO vamos apagar os arquivos ou o localStorage.
        regKey.remove('NovaInstalacao', () => {})
        console.log('[Reset] Flag NovaInstalacao detectada, mas preservando dados conforme solicitado.')
        resolve(false) // Retornamos false para NÃO limpar o storage no app.whenReady
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
    // Código removido para preservar dados
    console.log('[Reset] Preservando localStorage e dados de usuário.')
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('bridge:pomodoro-estado', (_e, payload: unknown) => {
    if (payload === null) {
      definirSnapshotPomodoroParaBridge(null)
      return
    }
    if (!payload || typeof payload !== 'object') return
    const p = payload as Record<string, unknown>
    const n = (x: unknown): number | null =>
      typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : null
    const bruto = n(p.restante)
    if (bruto === null) return
    const MAX_RESTANTE_SEG = 86400 * 2
    const restante = Math.min(bruto, MAX_RESTANTE_SEG)
    const fase = p.fase === 'pausa' ? 'pausa' : 'foco'
    const tipoPausa = p.tipoPausa === 'longa' ? 'longa' : 'curta'
    const rodando = p.rodando === true
    const snap: SnapshotPomodoroBridge = {
      restanteSegundos: restante,
      fase,
      tipoPausa,
      rodando
    }
    definirSnapshotPomodoroParaBridge(snap)
  })

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
  ipcMain.handle('app:instalar-atualizacao', () => instalarAtualizacaoAgora())

  ipcMain.handle('app:minimizar-todas', () => minimizarTodasJanelas())
  ipcMain.handle('app:minimizar-exceto', (_, permitidos: unknown) => minimizarJanelasExceto(permitidos))
  ipcMain.handle('app:definir-nao-perturbe', (_, ativo: unknown) =>
    definirNaoPerturbe(Boolean(ativo))
  )
  ipcMain.handle('app:alternar-mudo', () => alternarMudoSistema())
  ipcMain.handle('app:abrir-pasta-estudos', () => abrirPastaEstudos())

  ipcMain.handle('app:obter-info-bridge-extensao', () => obterInfoBridgeExtensaoParaUi())

  ipcMain.handle('app:abrir-espelho-bridge-no-explorador', async () => {
    try {
      const { caminhoEspelhoBridge } = obterInfoBridgeExtensaoParaUi()
      if (existsSync(caminhoEspelhoBridge)) {
        shell.showItemInFolder(caminhoEspelhoBridge)
      } else {
        await shell.openPath(dirname(caminhoEspelhoBridge))
      }
      return { ok: true as const }
    } catch (e: unknown) {
      const motivo = e instanceof Error ? e.message : String(e)
      return { ok: false as const, motivo }
    }
  })

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
    const MAX_TITULO = 128
    const MAX_CORPO = 2048
    const tituloBruto = typeof payload?.titulo === 'string' ? payload.titulo : 'Modo Foco'
    const corpoBruto = typeof payload?.corpo === 'string' ? payload.corpo : ''
    const titulo =
      tituloBruto.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, MAX_TITULO).trim() || 'Modo Foco'
    const corpo = corpoBruto.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, MAX_CORPO)
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

  ipcMain.handle('listas-bloqueio:obter-padrao', () => {
    try {
      const { hosts, indicadores } = obterBloqueiosPadraoParaUi()
      return { ok: true as const, hosts, indicadores }
    } catch {
      return { ok: false as const, motivo: 'Não foi possível carregar os bloqueios padrão.' }
    }
  })

  ipcMain.handle(
    'listas-bloqueio:salvar-desativacoes-padrao',
    (_event, payload: { hostsDesativados?: unknown; indicadoresDesativados?: unknown }) => {
      return salvarDesativacoesBloqueioPadrao({
        hostsDesativados: payload?.hostsDesativados,
        indicadoresDesativados: payload?.indicadoresDesativados
      })
    }
  )

  garantirListasCarregadas()
  void iniciarServidorBridgeExtensao().catch((err) =>
    console.error('[Modo Foco] Falha ao iniciar bridge da extensão:', err)
  )

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
