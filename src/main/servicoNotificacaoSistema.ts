import { Notification } from 'electron'

/** Notificação nativa (Windows/macOS/Linux com suporte). */
export function mostrarNotificacaoModoFoco(titulo: string, corpo: string): boolean {
  if (!Notification.isSupported()) return false
  try {
    new Notification({
      title: titulo || 'Modo Foco',
      body: corpo
    }).show()
    return true
  } catch {
    return false
  }
}
