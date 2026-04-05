import { BrowserWindow, globalShortcut } from 'electron'

/** Pausar/retomar o timer sem focar a janela (Ctrl+Alt+P no Windows, Cmd+Alt+P no macOS). */
export const ACELERADOR_ALTERNAR_POMODORO = 'CommandOrControl+Alt+P'

export function registrarAtalhosGlobaisPomodoro(): boolean {
  const ok = globalShortcut.register(ACELERADOR_ALTERNAR_POMODORO, () => {
    for (const janela of BrowserWindow.getAllWindows()) {
      if (!janela.isDestroyed()) {
        janela.webContents.send('pomodoro:atalho-global', { acao: 'alternar_rodando' })
      }
    }
  })
  if (!ok) {
    console.warn('[Modo Foco] Não foi possível registrar o atalho global', ACELERADOR_ALTERNAR_POMODORO)
  }
  return ok
}

export function encerrarAtalhosGlobaisPomodoro(): void {
  try {
    globalShortcut.unregister(ACELERADOR_ALTERNAR_POMODORO)
  } catch {
    /* ignorar */
  }
}
