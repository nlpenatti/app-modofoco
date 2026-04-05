import { execFile } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { Notification, BrowserWindow, app, shell } from 'electron'

/** Padrões no título da janela em foco (navegadores costumam pôr o site no título). */
const INDICADORES_DISTRACAO = [
  'youtube',
  'youtu.be',
  'netflix',
  'tiktok',
  'instagram',
  'facebook',
  'twitch',
  'twitter',
  'reddit',
  'discord'
]

const COOLDOWN_ALERTA_MS = 45_000
const INTERVALO_POLL_MS = 2_500

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

function tituloIndicaDistraction(titulo: string): boolean {
  const t = titulo.toLowerCase()
  return INDICADORES_DISTRACAO.some((p) => t.includes(p))
}

function emitirAtividadeParaRenderers(payload: {
  tipo: 'distraction_detected'
  tituloJanela: string
  instante: string
}): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) {
      janela.webContents.send('monitor-foco:atividade', payload)
    }
  }
}

async function verificarUmaVez(): Promise<void> {
  const titulo = await obterTituloJanelaAtiva()
  if (!titulo || !tituloIndicaDistraction(titulo)) return

  const agora = Date.now()
  if (agora - ultimoAlertaEm < COOLDOWN_ALERTA_MS) return
  ultimoAlertaEm = agora

  const payload = {
    tipo: 'distraction_detected' as const,
    tituloJanela: titulo,
    instante: new Date().toISOString()
  }
  emitirAtividadeParaRenderers(payload)

  if (Notification.isSupported()) {
    new Notification({
      title: 'Modo Foco',
      body: 'Detectamos uma possível distração em primeiro plano. Volte ao foco quando puder.'
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
