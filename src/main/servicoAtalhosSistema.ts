import { spawn, exec } from 'node:child_process'
import { shell, app } from 'electron'
import { join } from 'node:path'

const MAX_CARACTERES_TITULO_JANELA = 120
const MAX_TITULOS_PERMITIDOS_EXTRAS = 35

/** Remove caracteres de controle; limita tamanho (títulos de janela no Windows). */
function normalizarTitulosParaComando(permitidos: unknown): string[] {
  const fixos = ['Modo Foco', 'Visual Studio Code']
  const extras: string[] = []
  if (Array.isArray(permitidos)) {
    for (const item of permitidos) {
      if (extras.length >= MAX_TITULOS_PERMITIDOS_EXTRAS) break
      if (typeof item !== 'string') continue
      const s = item
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, MAX_CARACTERES_TITULO_JANELA)
      if (!s) continue
      extras.push(s)
    }
  }
  return [...new Set([...fixos, ...extras])]
}

/** Em literais entre aspas simples do PowerShell, `'` vira `''`. */
function escaparAspasSimplesPowerShell(s: string): string {
  return s.replace(/'/g, "''")
}

function codificarScriptPowerShell(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64')
}

export async function abrirCalculadoraSistema(): Promise<{ ok: boolean; motivo?: string }> {
  if (process.platform === 'win32') {
    const filho = spawn('calc.exe', [], {
      shell: true,
      detached: true,
      stdio: 'ignore'
    })
    filho.on('error', () => {
      /* tentativa falhou silenciosamente */
    })
    filho.unref()
    return { ok: true }
  }

  if (process.platform === 'darwin') {
    const filho = spawn('open', ['-a', 'Calculator'], {
      detached: true,
      stdio: 'ignore'
    })
    filho.on('error', () => {})
    filho.unref()
    return { ok: true }
  }

  const candidatos = ['gnome-calculator', 'kcalc', 'qalculate-gtk', 'galculator']
  for (const bin of candidatos) {
    const iniciou = await new Promise<boolean>((resolve) => {
      const filho = spawn(bin, [], { detached: true, stdio: 'ignore' })
      filho.once('error', () => resolve(false))
      filho.once('spawn', () => {
        filho.unref()
        resolve(true)
      })
    })
    if (iniciou) return { ok: true }
  }

  return {
    ok: false,
    motivo: 'Calculadora não encontrada. Instale gnome-calculator (ou similar) no Linux.'
  }
}

export async function abrirPesquisaWeb(termo: string): Promise<{ ok: boolean; motivo?: string }> {
  const q = String(termo).trim()
  const url = q
    ? `https://duckduckgo.com/?q=${encodeURIComponent(q).slice(0, 2000)}`
    : 'https://duckduckgo.com/'
  try {
    await shell.openExternal(url)
    return { ok: true }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    return { ok: false, motivo: mensagem }
  }
}

export async function minimizarTodasJanelas(): Promise<{ ok: boolean }> {
  if (process.platform === 'win32') {
    const shellApp = `(new-object -com shell.application).MinimizeAll()`
    exec(`powershell -command "${shellApp}"`)
    return { ok: true }
  }
  return { ok: false }
}

export async function minimizarJanelasExceto(permitidos: unknown): Promise<{ ok: boolean }> {
  if (process.platform !== 'win32') return { ok: false }

  const lista = normalizarTitulosParaComando(permitidos)
  const filtro = lista
    .map((p) => {
      const literal = escaparAspasSimplesPowerShell(p)
      return `$title -notmatch '${literal}'`
    })
    .join(' -and ')

  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@
Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object {
  $title = $_.MainWindowTitle
  if ([Win32]::IsWindowVisible($_.MainWindowHandle) -and $title -and (${filtro})) {
    [Win32]::ShowWindow($_.MainWindowHandle, 6)
  }
}
`.trim()

  const encoded = codificarScriptPowerShell(script)
  spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', encoded],
    { windowsHide: true, stdio: 'ignore' }
  )
  return { ok: true }
}

export async function definirNaoPerturbe(ativo: boolean): Promise<{ ok: boolean }> {
  if (process.platform === 'win32') {
    const valor = ativo ? 0 : 1
    const comando = `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value ${valor} -Force`
    exec(`powershell -command "${comando}"`)
    return { ok: true }
  }

  if (process.platform === 'darwin') {
    const valor = ativo ? 'true' : 'false'
    // No macOS moderno, é mais complexo, mas isto é um começo para o DoNotDisturb legado/simples
    exec(`defaults write com.apple.ncprefs DoNotDisturb -boolean ${valor}`)
    return { ok: true }
  }

  return { ok: false }
}

export async function alternarMudoSistema(): Promise<{ ok: boolean }> {
  if (process.platform === 'win32') {
    exec(`powershell -command "(new-object -com wscript.shell).SendKeys([char]173)"`)
    return { ok: true }
  }
  return { ok: false }
}

export async function abrirPastaEstudos(): Promise<{ ok: boolean; motivo?: string }> {
  const caminhoBase = app.getPath('documents')
  const pastaEstudos = join(caminhoBase, 'Estudos')
  
  // Cria a pasta se não existir para evitar erro ao abrir
  const { mkdirSync, existsSync } = await import('node:fs')
  if (!existsSync(pastaEstudos)) {
    try {
      mkdirSync(pastaEstudos, { recursive: true })
    } catch (e) {
      return { ok: false, motivo: `Não foi possível criar a pasta: ${String(e)}` }
    }
  }

  const erro = await shell.openPath(pastaEstudos)
  if (erro) {
    return { ok: false, motivo: erro }
  }
  return { ok: true }
}
