import { spawn } from 'node:child_process'
import { shell } from 'electron'

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
