/**
 * Painel de diagnóstico ao clicar no ícone da extensão.
 */

/** Token novo a cada abertura do app (base64url, 32 bytes). */
const TAMANHO_MINIMO_TOKEN = 32

const $ = (id) => document.getElementById(id)

function tokenPareceValido(t) {
  return typeof t === 'string' && t.trim().length >= TAMANHO_MINIMO_TOKEN
}

function definirClasse(el, classe) {
  el.classList.remove('ok', 'aviso', 'erro', 'neutro')
  if (classe) el.classList.add(classe)
}

function linha(rotulo, valor, classeValor) {
  const r = document.createElement('span')
  r.className = 'rotulo'
  r.textContent = rotulo
  const v = document.createElement('span')
  v.textContent = valor
  if (classeValor) definirClasse(v, classeValor)
  else definirClasse(v, 'neutro')
  const wrap = document.createElement('div')
  wrap.className = 'linha'
  wrap.append(r, v)
  return wrap
}

async function carregarBridgeConfig() {
  const url = chrome.runtime.getURL('bridge-config.json') + '?_=' + Date.now()
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const j = await r.json()
  const port =
    typeof j.port === 'number' && Number.isFinite(j.port) && j.port > 0 && j.port < 65536
      ? Math.floor(j.port)
      : null
  const token = typeof j.token === 'string' ? j.token.trim() : ''
  return { port, token, bruto: j }
}

async function consultarApiFoco(port, token) {
  const u = `http://127.0.0.1:${port}/api/foco`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(u, { cache: 'no-store', headers })
  let corpo = null
  try {
    const t = await r.text()
    if (t) corpo = JSON.parse(t)
  } catch {
    corpo = null
  }
  return { status: r.status, corpo }
}

function obterDiagnosticoBackground() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'diagnosticoModoFoco' }, (res) => {
      if (chrome.runtime.lastError) {
        resolve(null)
        return
      }
      resolve(res)
    })
  })
}

function limparSecaoCfg() {
  $('cfg-status').textContent = ''
  $('cfg-status').innerHTML = ''
  $('cfg-porta').hidden = true
  $('cfg-porta').innerHTML = ''
  $('cfg-token').hidden = true
  $('cfg-token').innerHTML = ''
}

function limparSecaoApi() {
  $('api-status').innerHTML = ''
  $('api-foco').hidden = true
  $('api-foco').innerHTML = ''
  $('api-listas').hidden = true
  $('api-listas').innerHTML = ''
}

function limparSecaoSw() {
  $('sw-ws').innerHTML = ''
  $('sw-foco').hidden = true
  $('sw-foco').innerHTML = ''
  $('sw-listas').hidden = true
  $('sw-listas').innerHTML = ''
}

async function executarDiagnostico() {
  limparSecaoCfg()
  limparSecaoApi()
  limparSecaoSw()

  $('cfg-status').appendChild(linha('Estado', 'Carregando…', 'neutro'))

  let port = null
  let token = ''

  try {
    const cfg = await carregarBridgeConfig()
    port = cfg.port
    token = cfg.token
    limparSecaoCfg()
    $('cfg-status').appendChild(linha('Leitura', 'OK', 'ok'))
    $('cfg-porta').hidden = false
    $('cfg-porta').appendChild(
      linha('Porta', port != null ? String(port) : '(inválida)', port != null ? 'ok' : 'erro')
    )
    $('cfg-token').hidden = false
    const tokenOk = tokenPareceValido(token)
    $('cfg-token').appendChild(
      linha(
        'Token',
        tokenOk
          ? 'Presente'
          : 'Vazio — abra o app Modo Foco (ele grava aqui) e toque em Atualizar',
        tokenOk ? 'ok' : 'aviso'
      )
    )
  } catch {
    limparSecaoCfg()
    $('cfg-status').appendChild(
      linha('Leitura', 'Falhou — use a pasta da extensão que o app atualiza', 'erro')
    )
    $('api-status').appendChild(linha('Teste HTTP', 'Sem porta válida', 'aviso'))
    $('sw-ws').appendChild(linha('WebSocket', '—', 'neutro'))
    return
  }

  if (port == null) {
    $('api-status').appendChild(linha('Teste HTTP', 'Porta inválida no bridge-config.json', 'erro'))
  } else if (!tokenPareceValido(token)) {
    $('api-status').appendChild(
      linha(
        'Teste HTTP',
        'Não executado — sem token no arquivo (modelo do repositório). Abra o app e use a pasta da extensão que ele indica.',
        'aviso'
      )
    )
  } else {
    try {
      const { status, corpo } = await consultarApiFoco(port, token)
      if (status === 200 && corpo && typeof corpo === 'object') {
        $('api-status').appendChild(linha('Resposta', 'OK (app alcançável)', 'ok'))
        const foco = Boolean(corpo.focoAtivo)
        const hosts = Array.isArray(corpo.hosts) ? corpo.hosts.length : 0
        const prefixos = Array.isArray(corpo.prefixosUrl) ? corpo.prefixosUrl.length : 0
        $('api-foco').hidden = false
        $('api-foco').appendChild(
          linha(
            'Sessão de foco',
            foco ? 'Ativa no app' : 'Inativa (inicie foco/cronômetro)',
            foco ? 'ok' : 'aviso'
          )
        )
        $('api-listas').hidden = false
        $('api-listas').appendChild(
          linha(
            'Regras',
            `${hosts} host(s), ${prefixos} prefixo(s)`,
            hosts > 0 || prefixos > 0 ? 'ok' : 'aviso'
          )
        )
      } else if (status === 401) {
        $('api-status').appendChild(
          linha(
            'Resposta',
            '401 — token diferente do app; recarregue a extensão após abrir o app',
            'erro'
          )
        )
      } else {
        $('api-status').appendChild(linha('Resposta', `HTTP ${status}`, 'erro'))
      }
    } catch {
      $('api-status').appendChild(
        linha('Resposta', 'Sem conexão — app fechado, porta errada ou firewall', 'erro')
      )
    }
  }

  const bg = await obterDiagnosticoBackground()
  if (!bg || typeof bg !== 'object') {
    $('sw-ws').appendChild(linha('WebSocket', 'Não foi possível ler o worker', 'aviso'))
    return
  }
  $('sw-ws').appendChild(
    linha(
      'Push (WebSocket)',
      bg.wsConectado ? 'Conectado' : 'Desconectado',
      bg.wsConectado ? 'ok' : 'aviso'
    )
  )
  $('sw-foco').hidden = false
  $('sw-foco').appendChild(
    linha(
      'Cache: foco',
      bg.focoAtivo ? 'Ativo' : 'Inativo',
      bg.focoAtivo ? 'ok' : 'neutro'
    )
  )
  $('sw-listas').hidden = false
  $('sw-listas').appendChild(
    linha(
      'Cache: listas',
      `${bg.qtdHosts ?? 0} host(s), ${bg.qtdPrefixos ?? 0} prefixo(s)`,
      (bg.qtdHosts ?? 0) > 0 || (bg.qtdPrefixos ?? 0) > 0 ? 'ok' : 'aviso'
    )
  )
}

$('btn-atualizar').addEventListener('click', () => {
  void executarDiagnostico()
})

void executarDiagnostico()
