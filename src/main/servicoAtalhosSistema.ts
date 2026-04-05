import { spawn, exec } from 'node:child_process'
import { shell, app } from 'electron'
import { join } from 'node:path'

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
