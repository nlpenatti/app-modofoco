import { execFile } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { Notification, BrowserWindow, app, shell } from 'electron'
import { obterIndicadoresJanelaOrdenados } from './servicoListasBloqueio'

const COOLDOWN_ALERTA_MS = 18_000
/** Intervalo curto: troca rápida de aba (ex.: chat no navegador) ainda entra na próxima verificação. */
const INTERVALO_POLL_MS = 550

let intervaloMonitor: ReturnType<typeof setInterval> | null = null
let ultimoAlertaEm = 0

function caminhoScriptTituloJanela(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'titulo-janela-ativa.ps1')
  }
  return join(process.cwd(), 'resources', 'titulo-janela-ativa.ps1')
}

function caminhoPowerShell(): string {
  const raiz = process.env.SystemRoot ?? 'C:\\Windows'
  return join(raiz, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
}

function obterTituloJanelaAtiva(): Promise<string> {
  const script = caminhoScriptTituloJanela()
  if (!existsSync(script)) {
    return Promise.resolve('')
  }
  const powershell = caminhoPowerShell()
  return new Promise((resolve) => {
    execFile(
      powershell,
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        script
      ],
      { windowsHide: true, timeout: 10_000, encoding: 'utf8' },
      (erro, stdout) => {
        if (erro) resolve('')
        else resolve(String(stdout).trim())
      }
    )
  })
}

function encontrarIndicadorDistraction(titulo: string): string | null {
  const t = titulo.toLowerCase()
  for (const p of obterIndicadoresJanelaOrdenados()) {
    if (t.includes(p)) return p
  }
  return null
}

function emitirAtividadeParaRenderers(payload: {
  tipo: 'distraction_detected'
  tituloJanela: string
  instante: string
  indicador?: string
}): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) {
      janela.webContents.send('monitor-foco:atividade', payload)
    }
  }
}

/** Traz as janelas do app ao primeiro plano (Windows/macOS). */
function trazerJanelasAppAoFoco(): void {
  const janelas = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
  if (janelas.length === 0) return

  for (const janela of janelas) {
    if (janela.isMinimized()) janela.restore()
    janela.show()
  }

  const principal = janelas[janelas.length - 1] ?? janelas[0]

  if (process.platform === 'darwin') {
    app.focus({ steal: true })
  }

  principal.setAlwaysOnTop(true)
  principal.focus()
  principal.moveTop()

  setTimeout(() => {
    if (!principal.isDestroyed()) {
      principal.setAlwaysOnTop(false)
      principal.focus()
    }
  }, 400)

  if (process.platform === 'win32') {
    principal.flashFrame(true)
    setTimeout(() => {
      if (!principal.isDestroyed()) principal.flashFrame(false)
    }, 2800)
  }
}

async function verificarUmaVez(): Promise<void> {
  const titulo = await obterTituloJanelaAtiva()
  const indicador = titulo ? encontrarIndicadorDistraction(titulo) : null
  if (!titulo || !indicador) return

  const agora = Date.now()
  if (agora - ultimoAlertaEm < COOLDOWN_ALERTA_MS) return
  ultimoAlertaEm = agora

  trazerJanelasAppAoFoco()

  const payload = {
    tipo: 'distraction_detected' as const,
    tituloJanela: titulo,
    instante: new Date().toISOString(),
    indicador
  }
  emitirAtividadeParaRenderers(payload)

  if (Notification.isSupported()) {
    new Notification({
      title: 'Modo Foco',
      body: 'Um momento — volte ao app e retome seu foco.'
    }).show()
  }
}

export function definirMonitorFocoAtivo(ativo: boolean): { ok: boolean; motivo?: string } {
  if (process.platform !== 'win32') {
    return { ok: false, motivo: 'Monitoramento de janela só está disponível no Windows.' }
  }

  if (intervaloMonitor) {
    clearInterval(intervaloMonitor)
    intervaloMonitor = null
  }

  if (!ativo) {
    return { ok: true }
  }

  const script = caminhoScriptTituloJanela()
  if (!existsSync(script)) {
    return {
      ok: false,
      motivo: `Script não encontrado: ${script}`
    }
  }

  void verificarUmaVez()
  intervaloMonitor = setInterval(() => {
    void verificarUmaVez()
  }, INTERVALO_POLL_MS)

  return { ok: true }
}

function caminhoDesinstaladorWindows(pastaApp: string): string | null {
  const candidatos = [
    join(pastaApp, 'Uninstall Modo Foco.exe'),
    join(pastaApp, 'Uninstall Biologia Modo Estudo.exe'),
    join(pastaApp, 'Uninstall.exe')
  ]
  for (const c of candidatos) {
    if (existsSync(c)) return c
  }
  try {
    const arquivos = readdirSync(pastaApp)
    const nome = arquivos.find((n) => /^uninstall/i.test(n) && n.toLowerCase().endsWith('.exe'))
    if (nome) return join(pastaApp, nome)
  } catch {
    /* ignora */
  }
  return null
}

export async function abrirFluxoDesinstalacao(): Promise<{ ok: boolean; motivo?: string }> {
  if (process.platform === 'win32') {
    const pastaApp = dirname(app.getPath('exe'))
    const caminhoUninstall = caminhoDesinstaladorWindows(pastaApp)
    if (caminhoUninstall) {
      const resultado = await shell.openPath(caminhoUninstall)
      if (resultado) {
        return { ok: false, motivo: resultado }
      }
      return { ok: true }
    }
    await shell.openExternal('ms-settings:appsfeatures')
    return {
      ok: true,
      motivo:
        'Abrimos Configurações → Aplicativos. Procure "Modo Foco" para desinstalar (versão portátil pode não ter desinstalador na pasta).'
    }
  }

  if (process.platform === 'darwin') {
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.app?Apps')
    return { ok: true, motivo: 'Abra Ajustes do Sistema e remova o app na lista de aplicativos.' }
  }

  return {
    ok: true,
    motivo: 'No Linux, remova o pacote pelo gerenciador da sua distribuição (apt, dnf, Flatpak etc.).'
  }
}
