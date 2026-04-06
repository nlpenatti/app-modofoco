import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

export type ResultadoVerificacaoAtualizacao = {
  ok: boolean
  mensagem: string
}

let jaConfigurado = false
let janelaPrincipal: BrowserWindow | null = null

function estaModoPortable(): boolean {
  return Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
}

export function configurarAtualizacaoAutomatica(janela: BrowserWindow): void {
  janelaPrincipal = janela
  if (jaConfigurado) return
  jaConfigurado = true

  if (!app.isPackaged || is.dev) {
    return
  }

  if (estaModoPortable()) {
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('update-available', (info) => {
    console.log('[atualizacao] Versão disponível:', info.version)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[atualizacao] Baixada:', info.version)
    // Em vez de mostrar dialog imediatamente, avisa o renderer
    if (janelaPrincipal) {
      janelaPrincipal.webContents.send('app:atualizacao-baixada', info.version)
    }
  })

  autoUpdater.on('error', (erro) => {
    console.error('[atualizacao]', erro)
  })

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((e) => console.error('[atualizacao] verificação inicial', e))
  }, 10_000)
}

export function instalarAtualizacaoAgora(): void {
  app.removeAllListeners('window-all-closed')
  autoUpdater.quitAndInstall(false, true)
}

export async function verificarAtualizacoesManual(): Promise<ResultadoVerificacaoAtualizacao> {
  if (!app.isPackaged || is.dev) {
    return {
      ok: false,
      mensagem: 'Atualizações automáticas só existem no app instalado (.exe do setup), não no modo desenvolvimento.'
    }
  }

  if (estaModoPortable()) {
    return {
      ok: false,
      mensagem:
        'Você está no .exe portátil: ele não se auto-atualiza. Peça o instalador (setup) ou baixe a nova Release no GitHub.'
    }
  }

  try {
    const resultado = await autoUpdater.checkForUpdates()
    if (!resultado) {
      return {
        ok: false,
        mensagem: 'Não foi possível falar com o servidor de atualizações (GitHub Releases).'
      }
    }
    if (resultado.isUpdateAvailable) {
      return {
        ok: true,
        mensagem: `Nova versão ${resultado.updateInfo.version} encontrada. O download começa em seguida; avisaremos para reiniciar.`
      }
    }
    return {
      ok: true,
      mensagem: `Você está na versão mais recente (${app.getVersion()}).`
    }
  } catch (erro) {
    const texto = erro instanceof Error ? erro.message : String(erro)
    return {
      ok: false,
      mensagem: `Erro: ${texto}. Confira se o repositório no GitHub tem uma Release pública com os arquivos do build.`
    }
  }
}
