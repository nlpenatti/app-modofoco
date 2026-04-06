/**
 * Consulta o app Modo Foco (Electron) em localhost e injeta "Site bloqueado" nas abas elegíveis.
 * Usa webNavigation para SPAs (ex.: Instagram) onde a URL muda sem recarregar a página inteira.
 * WebSocket em /api/foco/ws?token=…: o app empurra estado ao ligar/desligar foco.
 *
 * Porta e token vêm de bridge-config.json (o app reescreve o arquivo ao iniciar).
 */

const CAMINHO_HTTP_FOCO = '/api/foco'
const CAMINHO_WS_FOCO = '/api/foco/ws'

/** @type {{ port: number, token: string }} */
let configBridge = { port: 48721, token: '' }

/** @type {{ focoAtivo: boolean, hosts: string[], prefixosUrl: string[] }} */
let estadoCache = { focoAtivo: false, hosts: [], prefixosUrl: [] }

/** Evita várias requisições paralelas ao mesmo tempo. */
let buscaApiEmCurso = null

/** Backoff para reconectar o push quando o app estiver fechado. */
let proximaTentativaWsMs = 1000

/** Instância WebSocket atual (para fechar ao recarregar config). */
let socketWsAtual = null
/** Evita agendar reconexão quando fechamos o WS de propósito (troca de token/porta). */
let ignorarProximoCloseWs = false

async function carregarConfigBridgeDoArquivo() {
  // Query evita cache do Chrome sobre o ficheiro no pacote da extensão (o app atualiza no disco).
  const url = chrome.runtime.getURL('bridge-config.json') + '?_=' + Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(String(r.status))
  const j = await r.json()
  const port =
    typeof j.port === 'number' && Number.isFinite(j.port) && j.port > 0 && j.port < 65536
      ? Math.floor(j.port)
      : 48721
  const token = typeof j.token === 'string' ? j.token.trim() : ''
  return { port, token }
}

async function garantirConfigBridge() {
  try {
    configBridge = await carregarConfigBridgeDoArquivo()
  } catch {
    configBridge = { port: 48721, token: '' }
  }
}

function urlApiFoco() {
  return `http://127.0.0.1:${configBridge.port}${CAMINHO_HTTP_FOCO}`
}

function urlWsFoco() {
  const t = encodeURIComponent(configBridge.token)
  return `ws://127.0.0.1:${configBridge.port}${CAMINHO_WS_FOCO}?token=${t}`
}

/** @param {RequestInit} [extra] */
function opcoesFetchApi(extra = {}) {
  const headers = { ...(extra.headers || {}) }
  if (configBridge.token) {
    headers['Authorization'] = `Bearer ${configBridge.token}`
  }
  return { cache: 'no-store', ...extra, headers }
}

/**
 * @param {unknown} j
 */
function aplicarPayloadApi(j) {
  if (!j || typeof j !== 'object') return
  const o = /** @type {{ focoAtivo?: unknown, hosts?: unknown, prefixosUrl?: unknown }} */ (j)

  const focoAnterior = estadoCache.focoAtivo
  estadoCache = {
    focoAtivo: Boolean(o.focoAtivo),
    hosts: Array.isArray(o.hosts) ? o.hosts : [],
    prefixosUrl: Array.isArray(o.prefixosUrl) ? o.prefixosUrl : []
  }

  if (focoAnterior && !estadoCache.focoAtivo) {
    void restaurarTodasAbasBloqueadas()
  }
}

function urlRestauracaoSegura(href) {
  try {
    const u = new URL(href)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}

async function restaurarTodasAbasBloqueadas() {
  const tabs = await chrome.tabs.query({})
  const blockedPrefix = chrome.runtime.getURL('blocked.html')
  for (const t of tabs) {
    if (t.id != null && t.url && t.url.startsWith(blockedPrefix)) {
      try {
        const u = new URL(t.url)
        const originalUrl = u.searchParams.get('url')
        const seguro = originalUrl ? urlRestauracaoSegura(originalUrl) : null
        if (seguro) {
          await chrome.tabs.update(t.id, { url: seguro })
        } else {
          await chrome.tabs.reload(t.id)
        }
      } catch {
        /* ignora */
      }
    }
  }
}

function agendarReconectarPushFoco() {
  const atraso = proximaTentativaWsMs
  proximaTentativaWsMs = Math.min(proximaTentativaWsMs * 2, 30_000)
  setTimeout(conectarPushWebSocketFoco, atraso)
}

function fecharWsSeHouver() {
  if (!socketWsAtual) return
  ignorarProximoCloseWs = true
  const anterior = socketWsAtual
  socketWsAtual = null
  try {
    anterior.close()
  } catch {
    /* ignora */
  }
}

async function conectarPushWebSocketFoco() {
  await garantirConfigBridge()
  if (!configBridge.token) {
    agendarReconectarPushFoco()
    return
  }

  try {
    fecharWsSeHouver()
    const ws = new WebSocket(urlWsFoco())
    socketWsAtual = ws
    ws.onopen = () => {
      ignorarProximoCloseWs = false
      console.log('[Modo Foco] WebSocket conectado com sucesso!')
      proximaTentativaWsMs = 1000
    }
    ws.onmessage = (ev) => {
      try {
        const j = JSON.parse(ev.data)
        console.log('[Modo Foco] Novo estado recebido via WebSocket:', j.focoAtivo ? 'ATIVO' : 'INATIVO')
        aplicarPayloadApi(j)
        void revarrerTodasAbasComRegras()
      } catch (err) {
        console.error('[Modo Foco] Erro ao processar mensagem WS:', err)
      }
    }
    ws.onclose = () => {
      if (socketWsAtual !== ws) return
      socketWsAtual = null
      if (ignorarProximoCloseWs) {
        ignorarProximoCloseWs = false
        return
      }
      console.warn('[Modo Foco] WebSocket fechado. Tentando reconectar...')
      agendarReconectarPushFoco()
    }
    ws.onerror = () => {
      try {
        ws.close()
      } catch {
        /* ignora */
      }
    }
  } catch (err) {
    console.error('[Modo Foco] Falha fatal ao criar WebSocket:', err)
    agendarReconectarPushFoco()
  }
}

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
      await garantirConfigBridge()
      if (!configBridge.token) {
        estadoCache = { focoAtivo: false, hosts: [], prefixosUrl: [] }
        return
      }
      try {
        const r = await fetch(urlApiFoco(), opcoesFetchApi())
        if (r.status === 401) {
          await garantirConfigBridge()
          fecharWsSeHouver()
          void conectarPushWebSocketFoco()
          const r2 = await fetch(urlApiFoco(), opcoesFetchApi())
          if (!r2.ok) throw new Error(String(r2.status))
          const j2 = await r2.json()
          aplicarPayloadApi(j2)
          return
        }
        if (!r.ok) throw new Error(String(r.status))
        const j = await r.json()
        aplicarPayloadApi(j)
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

  if (tab.url.includes(chrome.runtime.id) && tab.url.includes('blocked.html')) return

  if (!enderecoDeveSerBloqueado(tab.url, prefixos, hosts)) return

  try {
    const blockedUrl = chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(tab.url)
    await chrome.tabs.update(tabId, { url: blockedUrl })
  } catch (err) {
    console.error('Erro ao redirecionar aba:', err)
  }
}

async function revarrerTodasAbasComRegras() {
  const tabs = await chrome.tabs.query({})
  for (const t of tabs) {
    if (t.id != null) await bloquearAbaSeAplicavel(t.id)
  }
}

async function talvezBloquearAba(tabId) {
  await atualizarEstadoDoApp()
  await bloquearAbaSeAplicavel(tabId)
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
  await revarrerTodasAbasComRegras()
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'diagnosticoModoFoco') return false
  const wsAberto =
    socketWsAtual != null && /** @type {WebSocket} */ (socketWsAtual).readyState === WebSocket.OPEN
  sendResponse({
    wsConectado: wsAberto,
    focoAtivo: Boolean(estadoCache.focoAtivo),
    qtdHosts: Array.isArray(estadoCache.hosts) ? estadoCache.hosts.length : 0,
    qtdPrefixos: Array.isArray(estadoCache.prefixosUrl) ? estadoCache.prefixosUrl.length : 0
  })
  return false
})

void (async () => {
  await garantirConfigBridge()
  void atualizarEstadoDoApp()
  void conectarPushWebSocketFoco()
})()
