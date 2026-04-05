import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raizProjeto = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Pastas que o electron-builder pode recriar; `release` fica por compatibilidade com builds antigos. */
const pastasWinUnpacked = [
  path.join(raizProjeto, 'dist-electron', 'win-unpacked'),
  path.join(raizProjeto, 'release', 'win-unpacked')
]

const modoEstrito = process.env.STRICT_RELEASE_CLEAN === '1'

function pastaExiste(caminho) {
  try {
    fs.accessSync(caminho)
    return true
  } catch {
    return false
  }
}

function removerSomenteLeituraWindows(caminho) {
  if (process.platform !== 'win32') return
  try {
    execFileSync(
      'cmd.exe',
      ['/c', 'attrib', '-R', `${caminho}\\*`, '/S', '/D'],
      { stdio: 'ignore', windowsHide: true }
    )
  } catch {
    /* ignora */
  }
}

function tentarApagarComRd(caminho) {
  if (process.platform !== 'win32') return false
  try {
    execFileSync('cmd.exe', ['/c', 'rd', '/s', '/q', caminho], {
      stdio: 'ignore',
      windowsHide: true
    })
  } catch {
    /* rd falhou */
  }
  return !pastaExiste(caminho)
}

function tentarRenomearObsoleto(caminho) {
  const novoNome = `${caminho}.obsoleto-${Date.now()}`
  try {
    fs.renameSync(caminho, novoNome)
    console.warn(
      `[limpar] Renomeei para ${path.basename(novoNome)} — pode apagar depois se quiser.`
    )
    return true
  } catch {
    return false
  }
}

function limparUmaPasta(caminho) {
  if (!pastaExiste(caminho)) return true

  removerSomenteLeituraWindows(caminho)

  try {
    fs.rmSync(caminho, { recursive: true, force: true })
  } catch {
    /* segue */
  }

  if (!pastaExiste(caminho)) return true
  if (tentarApagarComRd(caminho)) return true
  if (tentarRenomearObsoleto(caminho)) return true
  return false
}

const falhas = []
for (const pasta of pastasWinUnpacked) {
  if (!limparUmaPasta(pasta)) {
    falhas.push(path.relative(raizProjeto, pasta))
  }
}

if (falhas.length === 0) {
  process.exit(0)
}

const texto = `Não foi possível remover nem renomear:
${falhas.map((p) => `  · ${p}`).join('\n')}

O build atual grava em dist-electron/ (não depende de release/win-unpacked).
Se algo acima for release\\win-unpacked antigo, pode ignorar ou apagar depois de reiniciar o PC.

Causas comuns no Windows: OneDrive na Área de Trabalho, antivírus, indexação da pasta.
`

if (modoEstrito) {
  console.error(texto)
  process.exit(1)
}

console.warn(texto)
process.exit(0)
