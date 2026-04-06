import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { WebSocketServer, WebSocket } from 'ws'
import { app } from 'electron'
import { garantirListasCarregadas, obterHostsBloqueio } from './servicoListasBloqueio'

/** Primeira porta tentada; se ocupada, tenta as seguintes até o limite. */
export const PORTA_BRIDGE_INICIAL = 48721
const MAX_TENTATIVAS_PORTA = 30
const CAMINHO_HTTP_FOCO = '/api/foco'
const CAMINHO_WS_FOCO = '/api/foco/ws'
const ARQUIVO_SEGREDO_BRIDGE = 'bridge-segredo.json'
const NOME_ARQUIVO_CONFIG_EXTENSAO = 'bridge-config.json'
/** Cópia em userData: mesmo conteúdo que `bridge-config.json`, para quem carregou a extensão de outra pasta. */
const NOME_ARQUIVO_BRIDGE_ESPELHO_USERDATA = 'bridge-foco-para-extensao.json'

const PREFIXOS_URL_EXTRAS: string[] = []

let servidor: http.Server | null = null
let servidorWs: WebSocketServer | null = null
const clientesWs = new Set<WebSocket>()
let focoMonitorAtivo = false
let snapshotPomodoro: SnapshotPomodoroBridge | null = null
/** Porta efetiva após `listen` bem-sucedido; `0` se o servidor não estiver ativo. */
let portaEscutaAtual = 0

function caminhoSegredoBridge(): string {
  return join(app.getPath('userData'), ARQUIVO_SEGREDO_BRIDGE)
}

/** Novo segredo em cada abertura do app (dev e produção); a extensão lê em bridge-config.json. */
function gerarSegredoBridgeNovaSessao(): string {
  const token = randomBytes(32).toString('base64url')
  try {
    writeFileSync(caminhoSegredoBridge(), JSON.stringify({ token }, null, 2), 'utf8')
  } catch (e) {
    console.warn('[Modo Foco] Não foi possível gravar bridge-segredo.json:', e)
  }
  return token
}

function caminhoPastaExtensaoGravavel(): string {
  return app.isPackaged ? join(process.resourcesPath, 'extensao') : join(app.getAppPath(), 'extensao-modo-foco')
}

function caminhoArquivoEspelhoBridgeUserData(): string {
  return join(app.getPath('userData'), NOME_ARQUIVO_BRIDGE_ESPELHO_USERDATA)
}

/** Caminhos para a UI explicar pasta da extensão vs cópia em dados do usuário. */
export function obterInfoBridgeExtensaoParaUi(): {
  pastaGravacaoExtensao: string
  caminhoEspelhoBridge: string
  nomeArquivoEspelho: string
} {
  return {
    pastaGravacaoExtensao: caminhoPastaExtensaoGravavel(),
    caminhoEspelhoBridge: caminhoArquivoEspelhoBridgeUserData(),
    nomeArquivoEspelho: NOME_ARQUIVO_BRIDGE_ESPELHO_USERDATA
  }
}

function gravarArquivoConfigExtensao(porta: number, token: string): void {
  const pasta = caminhoPastaExtensaoGravavel()
  const arquivo = join(pasta, NOME_ARQUIVO_CONFIG_EXTENSAO)
  const payload = { port: porta, token, versao: 1 }
  const json = JSON.stringify(payload, null, 2)
  try {
    writeFileSync(caminhoArquivoEspelhoBridgeUserData(), json, 'utf8')
  } catch (e) {
    console.warn('[Modo Foco] Não foi possível gravar espelho do bridge em userData:', e)
  }
  try {
    writeFileSync(arquivo, json, 'utf8')
  } catch (e) {
    console.warn('[Modo Foco] Não foi possível gravar bridge-config.json na pasta da extensão:', e)
  }
}

function tokensIguais(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8')
    const bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

function extrairBearer(req: http.IncomingMessage): string | null {
  const raw = req.headers.authorization
  if (!raw || typeof raw !== 'string') return null
  const m = /^Bearer\s+(\S+)$/i.exec(raw.trim())
  return m ? m[1] : null
}

function tokenWsValido(req: http.IncomingMessage, segredoEsperado: string): boolean {
  try {
    const u = new URL(req.url ?? '', 'http://127.0.0.1')
    const t = u.searchParams.get('token')
    if (!t) return false
    return tokensIguais(t, segredoEsperado)
  } catch {
    return false
  }
}

function requisicaoAutorizada(req: http.IncomingMessage, segredo: string): boolean {
  const bearer = extrairBearer(req)
  if (bearer && tokensIguais(bearer, segredo)) return true
  return false
}

function construirPrefixosUrlDosHosts(hosts: string[]): string[] {
  const set = new Set<string>()

  function variantesHostname(host: string): string[] {
    const h = host.toLowerCase().trim()
    if (!h) return []
    const labels = h.split('.')
    if (labels.length === 2 && labels[0] !== 'www') {
      return [h, `www.${h}`]
    }
    if (labels.length >= 2 && labels[0] === 'www') {
      const sem = h.slice(4)
      return sem ? [h, sem] : [h]
    }
    return [h]
  }

  for (const entrada of hosts) {
    for (const hn of variantesHostname(entrada)) {
      for (const esquema of ['https', 'http']) {
        set.add(`${esquema}://${hn}`)
        set.add(`${esquema}://${hn}/`)
      }
    }
  }
  return [...set].sort((a, b) => b.length - a.length)
}

export type SnapshotPomodoroBridge = {
  restanteSegundos: number
  fase: 'foco' | 'pausa'
  tipoPausa: 'curta' | 'longa'
  rodando: boolean
}

type PayloadFoco = {
  focoAtivo: boolean
  hosts: string[]
  prefixosUrl: string[]
  versaoBridge: number
  pomodoro: SnapshotPomodoroBridge | null
}

export function definirSnapshotPomodoroParaBridge(snapshot: SnapshotPomodoroBridge | null): void {
  snapshotPomodoro = snapshot
  difundirEstadoParaExtensoes()
}

function obterPayloadFoco(): PayloadFoco {
  garantirListasCarregadas()
  const hosts = obterHostsBloqueio()
  const prefixosUrl = [
    ...construirPrefixosUrlDosHosts(hosts),
    ...PREFIXOS_URL_EXTRAS.map((p) => p.trim()).filter(Boolean)
  ]
  return {
    focoAtivo: focoMonitorAtivo,
    hosts,
    prefixosUrl,
    versaoBridge: 4,
    pomodoro: snapshotPomodoro
  }
}

function serializarPayloadFoco(): string {
  return JSON.stringify(obterPayloadFoco())
}

function difundirEstadoParaExtensoes(): void {
  if (clientesWs.size === 0) return
  const corpo = serializarPayloadFoco()
  for (const cliente of clientesWs) {
    if (cliente.readyState === WebSocket.OPEN) {
      try {
        cliente.send(corpo)
      } catch {
        /* socket pode estar fechando */
      }
    }
  }
}

export function definirEstadoBridgeExtensao(ativo: boolean): void {
  focoMonitorAtivo = ativo
  difundirEstadoParaExtensoes()
}

export function obterPortaBridgeExtensao(): number {
  return portaEscutaAtual
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }
}

function criarProcessadorHttp(segredo: string): http.RequestListener {
  return (req, res) => {
    const urlCompleta = req.url ?? ''

    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...corsHeaders(), 'Cache-Control': 'no-store' })
      res.end()
      return
    }

    let pathname = urlCompleta
    try {
      pathname = new URL(urlCompleta, 'http://127.0.0.1').pathname
    } catch {
      /* mantém string */
    }

    if (pathname !== CAMINHO_HTTP_FOCO) {
      res.writeHead(404).end()
      return
    }

    if (!requisicaoAutorizada(req, segredo)) {
      res.writeHead(401, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders(),
        'Cache-Control': 'no-store'
      })
      res.end('Unauthorized')
      return
    }

    const corpo = serializarPayloadFoco()
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
      'Cache-Control': 'no-store'
    })
    res.end(corpo)
  }
}

function escutarEmPorta(srv: http.Server, porta: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (erro: NodeJS.ErrnoException): void => {
      srv.removeListener('error', onError)
      reject(erro)
    }
    srv.once('error', onError)
    srv.listen(porta, '127.0.0.1', () => {
      srv.removeListener('error', onError)
      resolve()
    })
  })
}

export async function iniciarServidorBridgeExtensao(): Promise<void> {
  if (servidor) return

  const segredo = gerarSegredoBridgeNovaSessao()

  for (let i = 0; i < MAX_TENTATIVAS_PORTA; i++) {
    const porta = PORTA_BRIDGE_INICIAL + i
    const srv = http.createServer(criarProcessadorHttp(segredo))
    const wss = new WebSocketServer({
      server: srv,
      path: CAMINHO_WS_FOCO,
      verifyClient: (info) => tokenWsValido(info.req, segredo)
    })

    wss.on('connection', (socket) => {
      clientesWs.add(socket)
      try {
        socket.send(serializarPayloadFoco())
      } catch {
        /* ignora */
      }
      socket.on('close', () => {
        clientesWs.delete(socket)
      })
      socket.on('error', () => {
        clientesWs.delete(socket)
      })
    })

    try {
      await escutarEmPorta(srv, porta)
      servidor = srv
      servidorWs = wss
      portaEscutaAtual = porta
      gravarArquivoConfigExtensao(porta, segredo)
      const addr = srv.address() as AddressInfo | undefined
      if (addr) {
        console.log('---------------------------------------------------------')
        console.log(`[Modo Foco] BRIDGE ATIVO na porta ${addr.port}`)
        console.log(`[Modo Foco] HTTP: http://127.0.0.1:${addr.port}${CAMINHO_HTTP_FOCO} (Authorization: Bearer)`)
        console.log(`[Modo Foco] WebSocket: ws://127.0.0.1:${addr.port}${CAMINHO_WS_FOCO}?token=…`)
        console.log('---------------------------------------------------------')
      }
      return
    } catch (erro: unknown) {
      wss.close()
      srv.close()
      const e = erro as NodeJS.ErrnoException
      if (e.code === 'EADDRINUSE') {
        continue
      }
      console.error('[Modo Foco] Erro no servidor da extensão:', e.message)
      portaEscutaAtual = 0
      return
    }
  }

  console.warn(
    `[Modo Foco Bridge] Nenhuma porta livre entre ${PORTA_BRIDGE_INICIAL} e ${PORTA_BRIDGE_INICIAL + MAX_TENTATIVAS_PORTA - 1} — bridge desativado.`
  )
  portaEscutaAtual = 0
}

export function encerrarServidorBridgeExtensao(): void {
  for (const cliente of clientesWs) {
    try {
      cliente.close()
    } catch {
      /* ignora */
    }
  }
  clientesWs.clear()
  servidorWs?.close()
  servidorWs = null
  if (!servidor) return
  servidor.close()
  servidor = null
  portaEscutaAtual = 0
}
