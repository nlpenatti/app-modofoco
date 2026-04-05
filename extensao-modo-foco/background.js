/**
 * Consulta o app Modo Foco (Electron) em localhost e injeta "Site bloqueado" nas abas elegíveis.
 * Usa webNavigation para SPAs (ex.: Instagram) onde a URL muda sem recarregar a página inteira.
 */

const API_FOCO = 'http://127.0.0.1:48721/api/foco'

/** @type {{ focoAtivo: boolean, hosts: string[], prefixosUrl: string[] }} */
let estadoCache = { focoAtivo: false, hosts: [], prefixosUrl: [] }

/** Evita várias requisições paralelas ao mesmo tempo. */
let buscaApiEmCurso = null

function hostDeveSerBloqueado(hostname, hosts) {
  const h = hostname.toLowerCase()
  return hosts.some((host) => {
    const x = host.toLowerCase()
    return h === x || h.endsWith('.' + x)
  })
}

/**
 * Bloqueio pelo endereço completo da URL (origem + caminho + query); prefixos vêm da API (ordenados do mais longo ao mais curto).
 * Se não houver prefixos (app antigo), usa só hostname.
 */
function enderecoDeveSerBloqueado(href, prefixosUrl, hosts) {
  let u
  try {
    u = new URL(href)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  u.hash = ''
  const n = u.href.toLowerCase()

  for (const raw of prefixosUrl) {
    const pre = String(raw).toLowerCase().trim()
    if (!pre) continue
    if (n === pre) return true
    const comBarra = pre.endsWith('/') ? pre : pre + '/'
    if (n.startsWith(comBarra)) return true
    if (!pre.endsWith('/') && n.startsWith(pre + '?')) return true
  }

  return hosts.length > 0 && hostDeveSerBloqueado(u.hostname, hosts)
}

async function atualizarEstadoDoApp() {
  if (!buscaApiEmCurso) {
    buscaApiEmCurso = (async () => {
      try {
        const r = await fetch(API_FOCO, { cache: 'no-store' })
        if (!r.ok) throw new Error(String(r.status))
        const j = await r.json()
        estadoCache = {
          focoAtivo: Boolean(j.focoAtivo),
          hosts: Array.isArray(j.hosts) ? j.hosts : [],
          prefixosUrl: Array.isArray(j.prefixosUrl) ? j.prefixosUrl : []
        }
      } catch {
        estadoCache = { focoAtivo: false, hosts: [], prefixosUrl: [] }
      }
    })()
    void buscaApiEmCurso.finally(() => {
      buscaApiEmCurso = null
    })
  }
  await buscaApiEmCurso
}

async function bloquearAbaSeAplicavel(tabId) {
  const prefixos = estadoCache.prefixosUrl ?? []
  const hosts = estadoCache.hosts ?? []
  const temRegras = prefixos.length > 0 || hosts.length > 0
  if (!estadoCache.focoAtivo || !temRegras) return

  let tab
  try {
    tab = await chrome.tabs.get(tabId)
  } catch {
    return
  }
  if (!tab.url) return

  if (!enderecoDeveSerBloqueado(tab.url, prefixos, hosts)) return

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: injetarPaginaBloqueada
    })
  } catch {
    /* chrome://, Web Store, PDF viewer, etc. */
  }
}

async function talvezBloquearAba(tabId) {
  await atualizarEstadoDoApp()
  await bloquearAbaSeAplicavel(tabId)
}

function injetarPaginaBloqueada() {
  if (document.documentElement?.dataset?.modoFocoBloqueado === '1') return
  document.documentElement.dataset.modoFocoBloqueado = '1'
  document.open()
  document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site bloqueado — Modo Foco</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;">
  <div style="text-align:center;padding:2rem;max-width:26rem">
    <h1 style="margin:0 0 0.75rem;font-size:1.35rem;font-weight:600">Site bloqueado</h1>
    <p style="margin:0;font-size:0.95rem;line-height:1.5;opacity:0.92">O <strong>Modo Foco</strong> está em sessão de foco. Esta aba fica pausada até você pausar o temporizador ou sair da fase de foco no app.</p>
    <p style="margin-top:1.25rem;font-size:0.8rem;opacity:0.65">Depois do foco, use atualizar (F5) para voltar ao site.</p>
  </div></body></html>`)
  document.close()
}

const filtroHttp = { url: [{ schemes: ['http', 'https'] }] }

function aoNavegarAbaPrincipal(tabId) {
  void talvezBloquearAba(tabId)
}

chrome.webNavigation.onHistoryStateUpdated.addListener(
  (detalhes) => {
    if (detalhes.frameId !== 0) return
    aoNavegarAbaPrincipal(detalhes.tabId)
  },
  filtroHttp
)

chrome.webNavigation.onReferenceFragmentUpdated.addListener(
  (detalhes) => {
    if (detalhes.frameId !== 0) return
    aoNavegarAbaPrincipal(detalhes.tabId)
  },
  filtroHttp
)

chrome.webNavigation.onCommitted.addListener(
  (detalhes) => {
    if (detalhes.frameId !== 0) return
    aoNavegarAbaPrincipal(detalhes.tabId)
  },
  filtroHttp
)

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || typeof changeInfo.url === 'string') {
    void talvezBloquearAba(tabId)
  }
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void talvezBloquearAba(tabId)
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('modoFocoPoll', { periodInMinutes: 1 })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'modoFocoPoll') return
  await atualizarEstadoDoApp()
  if (!estadoCache.focoAtivo) return
  const tabs = await chrome.tabs.query({})
  for (const t of tabs) {
    if (t.id != null) await bloquearAbaSeAplicavel(t.id)
  }
})

void atualizarEstadoDoApp()
