import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { WebSocketServer, WebSocket } from 'ws'
import { garantirListasCarregadas, obterHostsBloqueio } from './servicoListasBloqueio'

/** Porta fixa: a extensão Chrome/Edge usa a mesma em manifest e background. */
export const PORTA_BRIDGE_EXTENSAO = 48721

const CAMINHO_WS_FOCO = '/api/foco/ws'

/**
 * Prefixos de endereço (URL) que também bloqueiam (https/http + caminho opcional).
 * Ex.: "https://www.google.com/search?q=facebook" para casos específicos.
 */
const PREFIXOS_URL_EXTRAS: string[] = []

/** Gera prefixos https/http para cada host (e www. quando for domínio raiz). */
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

type PayloadFoco = {
  focoAtivo: boolean
  hosts: string[]
  prefixosUrl: string[]
  versaoBridge: number
}

let servidor: http.Server | null = null
let servidorWs: WebSocketServer | null = null
const clientesWs = new Set<WebSocket>()
let focoMonitorAtivo = false

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
    versaoBridge: 2
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
  return PORTA_BRIDGE_EXTENSAO
}

export function iniciarServidorBridgeExtensao(): void {
  if (servidor) return

  servidor = http.createServer((req, res) => {
    const url = req.url ?? ''
    if (url === '/api/foco' || url.startsWith('/api/foco?')) {
      const corpo = serializarPayloadFoco()
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      })
      res.end(corpo)
      return
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      })
      res.end()
      return
    }

    res.writeHead(404).end()
  })

  /**
   * Anexar o WSS ao mesmo `http.Server` com `path` evita 404 no handshake:
   * em alguns ambientes o evento `upgrade` manual + `handleUpgrade` não intercepta
   * antes do handler HTTP devolver 404.
   */
  servidorWs = new WebSocketServer({ server: servidor, path: CAMINHO_WS_FOCO })

  servidorWs.on('connection', (socket) => {
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

  servidor.on('error', (erro: NodeJS.ErrnoException) => {
    if (erro.code === 'EADDRINUSE') {
      console.warn(
        `[Modo Foco] Porta ${PORTA_BRIDGE_EXTENSAO} em uso — bridge da extensão desativado. Feche o outro processo ou mude PORTA_BRIDGE_EXTENSAO.`
      )
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
      servidor?.close()
      servidor = null
      return
    }
    console.error('[Modo Foco] Erro no servidor da extensão:', erro.message)
  })

  servidor.listen(PORTA_BRIDGE_EXTENSAO, '127.0.0.1', () => {
    const addr = servidor?.address() as AddressInfo | undefined
    if (addr) {
      console.log(`[Modo Foco] Bridge extensão: http://127.0.0.1:${addr.port}/api/foco`)
      console.log(`[Modo Foco] Push extensão (WebSocket): ws://127.0.0.1:${addr.port}${CAMINHO_WS_FOCO}`)
    }
  })
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
}
