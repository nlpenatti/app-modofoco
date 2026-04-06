import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

/** Domínios enviados à extensão (bloqueio no navegador). */
export const HOSTS_BLOQUEIO_PADRAO: string[] = [
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
  'netflix.com',
  'tiktok.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'twitch.tv',
  'twitter.com',
  'x.com',
  'reddit.com',
  'discord.com',
  'discordapp.com',
  'whatsapp.com',
  'web.whatsapp.com',
  'linkedin.com',
  'pinterest.com',
  'tumblr.com',
  'telegram.org',
  'web.telegram.org',
  'snapchat.com',
  'threads.net',
  'kick.com',
  'steampowered.com',
  'steamcommunity.com',
  'epicgames.com',
  'battle.net',
  'playstation.com',
  'xbox.com',
  'roblox.com',
  'disneyplus.com',
  'primevideo.com',
  'crunchyroll.com',
  'max.com',
  'hbonow.com',
  'hbomax.com',
  'riotgames.com',
  'minecraft.net'
]

/**
 * Trechos buscados no título da janela em foco (Windows) — apps de desktop, PWA, etc.
 * Comparação sem diferenciar maiúsculas; entradas mais longas primeiro.
 */
export const INDICADORES_JANELA_PADRAO: string[] = [
  'battle.net',
  'blizzard',
  'crunchyroll',
  'disney+',
  'epic games',
  'facebook',
  'instagram',
  'kick.com',
  'linkedin',
  'messenger',
  'minecraft',
  'netflix',
  'pinterest',
  'playstation',
  'prime video',
  'reddit',
  'riot games',
  'roblox',
  'signal',
  'snapchat',
  'steam',
  'steamcommunity',
  'telegram',
  'threads',
  'tiktok',
  'tumblr',
  'twitch',
  'twitter',
  'wa.me',
  'web.whatsapp',
  'whatsapp',
  'x.com',
  'xbox',
  'youtu.be',
  'youtube',
  'discord',
  'max.com',
  'hbo max'
]

/**
 * Bloqueio fixo: aplicado na extensão e no monitor, não aparece na UI e não pode ser desativado.
 */
const HOSTS_BLOQUEIO_OCULTOS: string[] = ['onlyfans.com', 'tinder.com']
const INDICADORES_JANELA_OCULTOS: string[] = ['onlyfans', 'tinder']

const NOME_ARQUIVO = 'listas-bloqueio.json'
const MAX_ITENS_POR_LISTA = 400
const MAX_CARACTERES_POR_ENTRADA = 200

const SET_HOSTS_PADRAO = new Set(HOSTS_BLOQUEIO_PADRAO.map((h) => h.toLowerCase()))
const SET_INDICADORES_PADRAO = new Set(INDICADORES_JANELA_PADRAO.map((i) => i.toLowerCase()))
const SET_HOSTS_OCULTOS = new Set(HOSTS_BLOQUEIO_OCULTOS.map((h) => h.toLowerCase()))
const SET_INDICADORES_OCULTOS = new Set(INDICADORES_JANELA_OCULTOS.map((i) => i.toLowerCase()))

/** Persistido: extras + quais entradas padrão o usuário desativou. */
type CacheExtras = {
  hostsExtras: string[]
  indicadoresTituloJanelaExtras: string[]
  hostsPadraoDesativados: string[]
  indicadoresPadraoDesativados: string[]
}

type ArquivoV1 = {
  versao: 1
  hosts: string[]
  indicadoresTituloJanela: string[]
}

type ArquivoV2 = {
  versao: 2
  hostsExtras: string[]
  indicadoresTituloJanelaExtras: string[]
}

type ArquivoV3 = {
  versao: 3
  hostsExtras: string[]
  indicadoresTituloJanelaExtras: string[]
  /** Chaves normalizadas (minúsculas) de HOSTS_BLOQUEIO_PADRAO que o usuário desligou. */
  hostsPadraoDesativados: string[]
  indicadoresPadraoDesativados: string[]
}

/** Resposta ao renderer: apenas extras (o que o usuário edita na tela). */
export type ListasBloqueioExtras = {
  versao: 2
  hosts: string[]
  indicadoresTituloJanela: string[]
}

export type LinhaBloqueioPadraoUi = {
  chave: string
  rotulo: string
  /** Se false, o item padrão não entra no bloqueio (extensão + monitor). */
  bloqueado: boolean
}

let cache: CacheExtras | null = null

function caminhoPersistencia(): string {
  return join(app.getPath('userData'), NOME_ARQUIVO)
}

function normalizarEntradaLista(bruto: unknown): string[] {
  if (!Array.isArray(bruto)) return []
  const visto = new Set<string>()
  const saida: string[] = []
  for (const item of bruto) {
    const s = String(item).trim().toLowerCase().slice(0, MAX_CARACTERES_POR_ENTRADA)
    if (!s || visto.has(s)) continue
    visto.add(s)
    saida.push(s)
    if (saida.length >= MAX_ITENS_POR_LISTA) break
  }
  return saida
}

function extrasApartirDeListaCompletaHosts(hosts: string[]): string[] {
  return normalizarEntradaLista(
    hosts.filter((h) => {
      const k = String(h).trim().toLowerCase()
      return !SET_HOSTS_PADRAO.has(k) && !SET_HOSTS_OCULTOS.has(k)
    })
  )
}

function extrasApartirDeListaCompletaIndicadores(ind: string[]): string[] {
  return normalizarEntradaLista(
    ind.filter((i) => {
      const k = String(i).trim().toLowerCase()
      return !SET_INDICADORES_PADRAO.has(k) && !SET_INDICADORES_OCULTOS.has(k)
    })
  )
}

function gravarNoDisco(dados: CacheExtras): void {
  const arquivo: ArquivoV3 = {
    versao: 3,
    hostsExtras: dados.hostsExtras,
    indicadoresTituloJanelaExtras: dados.indicadoresTituloJanelaExtras,
    hostsPadraoDesativados: dados.hostsPadraoDesativados,
    indicadoresPadraoDesativados: dados.indicadoresPadraoDesativados
  }
  writeFileSync(caminhoPersistencia(), JSON.stringify(arquivo, null, 2), 'utf8')
}

function normalizarDesativadosPadrao(bruto: unknown, permitidos: Set<string>): string[] {
  if (!Array.isArray(bruto)) return []
  const visto = new Set<string>()
  const saida: string[] = []
  for (const item of bruto) {
    const s = String(item).trim().toLowerCase().slice(0, MAX_CARACTERES_POR_ENTRADA)
    if (!s || !permitidos.has(s) || visto.has(s)) continue
    visto.add(s)
    saida.push(s)
    if (saida.length >= MAX_ITENS_POR_LISTA) break
  }
  return saida
}

function lerDoDisco(): CacheExtras | null {
  const caminho = caminhoPersistencia()
  if (!existsSync(caminho)) return null
  try {
    const j = JSON.parse(readFileSync(caminho, 'utf8')) as Partial<ArquivoV1> &
      Partial<ArquivoV2> &
      Partial<ArquivoV3>
    if (
      j.versao === 3 &&
      Array.isArray(j.hostsExtras) &&
      Array.isArray(j.indicadoresTituloJanelaExtras) &&
      Array.isArray(j.hostsPadraoDesativados) &&
      Array.isArray(j.indicadoresPadraoDesativados)
    ) {
      return {
        hostsExtras: normalizarEntradaLista(j.hostsExtras),
        indicadoresTituloJanelaExtras: normalizarEntradaLista(j.indicadoresTituloJanelaExtras),
        hostsPadraoDesativados: normalizarDesativadosPadrao(j.hostsPadraoDesativados, SET_HOSTS_PADRAO),
        indicadoresPadraoDesativados: normalizarDesativadosPadrao(
          j.indicadoresPadraoDesativados,
          SET_INDICADORES_PADRAO
        )
      }
    }
    if (j.versao === 2 && Array.isArray(j.hostsExtras) && Array.isArray(j.indicadoresTituloJanelaExtras)) {
      const migrado: CacheExtras = {
        hostsExtras: normalizarEntradaLista(j.hostsExtras),
        indicadoresTituloJanelaExtras: normalizarEntradaLista(j.indicadoresTituloJanelaExtras),
        hostsPadraoDesativados: [],
        indicadoresPadraoDesativados: []
      }
      gravarNoDisco(migrado)
      return migrado
    }
    if (j.versao === 1 && Array.isArray(j.hosts) && Array.isArray(j.indicadoresTituloJanela)) {
      const hostsNorm = normalizarEntradaLista(j.hosts)
      const indNorm = normalizarEntradaLista(j.indicadoresTituloJanela)
      const migrado: CacheExtras = {
        hostsExtras: extrasApartirDeListaCompletaHosts(hostsNorm),
        indicadoresTituloJanelaExtras: extrasApartirDeListaCompletaIndicadores(indNorm),
        hostsPadraoDesativados: [],
        indicadoresPadraoDesativados: []
      }
      gravarNoDisco(migrado)
      return migrado
    }
    return null
  } catch {
    return null
  }
}

function mesclarHostsEfetivos(extras: CacheExtras): string[] {
  const desativados = new Set(extras.hostsPadraoDesativados.map((x) => x.toLowerCase()))
  const visto = new Set<string>()
  const saida: string[] = []
  for (const h of HOSTS_BLOQUEIO_OCULTOS) {
    const k = h.toLowerCase()
    if (visto.has(k)) continue
    visto.add(k)
    saida.push(h)
  }
  for (const h of HOSTS_BLOQUEIO_PADRAO) {
    const k = h.toLowerCase()
    if (desativados.has(k) || visto.has(k)) continue
    visto.add(k)
    saida.push(h)
  }
  for (const h of extras.hostsExtras) {
    const k = h.toLowerCase()
    if (visto.has(k)) continue
    visto.add(k)
    saida.push(h)
  }
  return saida
}

function mesclarIndicadoresEfetivos(extras: CacheExtras): string[] {
  const desativados = new Set(extras.indicadoresPadraoDesativados.map((x) => x.toLowerCase()))
  const visto = new Set<string>()
  const saida: string[] = []
  for (const i of INDICADORES_JANELA_OCULTOS) {
    const k = i.toLowerCase()
    if (visto.has(k)) continue
    visto.add(k)
    saida.push(i)
  }
  for (const i of INDICADORES_JANELA_PADRAO) {
    const k = i.toLowerCase()
    if (desativados.has(k) || visto.has(k)) continue
    visto.add(k)
    saida.push(i)
  }
  for (const i of extras.indicadoresTituloJanelaExtras) {
    const k = i.toLowerCase()
    if (visto.has(k)) continue
    visto.add(k)
    saida.push(i)
  }
  return saida.sort((a, b) => b.length - a.length)
}

function semEntradasOcultasEmExtras(dados: CacheExtras): CacheExtras {
  const hostsExtras = dados.hostsExtras.filter((h) => !SET_HOSTS_OCULTOS.has(h.toLowerCase()))
  const indicadoresTituloJanelaExtras = dados.indicadoresTituloJanelaExtras.filter(
    (i) => !SET_INDICADORES_OCULTOS.has(i.toLowerCase())
  )
  if (
    hostsExtras.length === dados.hostsExtras.length &&
    indicadoresTituloJanelaExtras.length === dados.indicadoresTituloJanelaExtras.length
  ) {
    return dados
  }
  return { ...dados, hostsExtras, indicadoresTituloJanelaExtras }
}

/** Deve ser chamado após `app.whenReady` antes de serviços que leem as listas. */
export function garantirListasCarregadas(): void {
  if (cache) return
  const doDisco = lerDoDisco()
  cache =
    doDisco ??
    ({
      hostsExtras: [],
      indicadoresTituloJanelaExtras: [],
      hostsPadraoDesativados: [],
      indicadoresPadraoDesativados: []
    } satisfies CacheExtras)
  const limpo = semEntradasOcultasEmExtras(cache)
  if (limpo !== cache) {
    cache = limpo
    gravarNoDisco(cache)
  } else if (!doDisco) {
    gravarNoDisco(cache)
  }
}

export function obterHostsBloqueio(): string[] {
  garantirListasCarregadas()
  return mesclarHostsEfetivos(cache!)
}

export function obterIndicadoresJanelaOrdenados(): string[] {
  garantirListasCarregadas()
  return mesclarIndicadoresEfetivos(cache!)
}

export function obterListasBloqueioParaRenderer(): ListasBloqueioExtras {
  garantirListasCarregadas()
  return {
    versao: 2,
    hosts: cache!.hostsExtras.filter((h) => !SET_HOSTS_OCULTOS.has(h.toLowerCase())),
    indicadoresTituloJanela: cache!.indicadoresTituloJanelaExtras.filter(
      (i) => !SET_INDICADORES_OCULTOS.has(i.toLowerCase())
    )
  }
}

export function salvarListasBloqueio(payload: {
  hosts: unknown
  indicadoresTituloJanela: unknown
}): { ok: true; dados: ListasBloqueioExtras } {
  garantirListasCarregadas()
  const hostsExtras = normalizarEntradaLista(payload.hosts).filter(
    (h) => !SET_HOSTS_OCULTOS.has(h.toLowerCase())
  )
  const indicadoresTituloJanelaExtras = normalizarEntradaLista(payload.indicadoresTituloJanela).filter(
    (i) => !SET_INDICADORES_OCULTOS.has(i.toLowerCase())
  )
  const dados: CacheExtras = {
    hostsExtras,
    indicadoresTituloJanelaExtras,
    hostsPadraoDesativados: cache!.hostsPadraoDesativados,
    indicadoresPadraoDesativados: cache!.indicadoresPadraoDesativados
  }
  cache = dados
  gravarNoDisco(dados)
  return {
    ok: true,
    dados: {
      versao: 2,
      hosts: [...hostsExtras],
      indicadoresTituloJanela: [...indicadoresTituloJanelaExtras]
    }
  }
}

export function salvarDesativacoesBloqueioPadrao(payload: {
  hostsDesativados: unknown
  indicadoresDesativados: unknown
}): { ok: true } | { ok: false; motivo: string } {
  garantirListasCarregadas()
  const hostsPadraoDesativados = normalizarDesativadosPadrao(payload.hostsDesativados, SET_HOSTS_PADRAO)
  const indicadoresPadraoDesativados = normalizarDesativadosPadrao(
    payload.indicadoresDesativados,
    SET_INDICADORES_PADRAO
  )
  const entradaInvalidaHost = (Array.isArray(payload.hostsDesativados) ? payload.hostsDesativados : []).some(
    (x) => {
      const s = String(x).trim().toLowerCase()
      return s && !SET_HOSTS_PADRAO.has(s)
    }
  )
  const entradaInvalidaInd = (
    Array.isArray(payload.indicadoresDesativados) ? payload.indicadoresDesativados : []
  ).some((x) => {
    const s = String(x).trim().toLowerCase()
    return s && !SET_INDICADORES_PADRAO.has(s)
  })
  if (entradaInvalidaHost || entradaInvalidaInd) {
    return { ok: false, motivo: 'Lista contém itens que não fazem parte do bloqueio padrão.' }
  }
  const dados: CacheExtras = {
    hostsExtras: cache!.hostsExtras,
    indicadoresTituloJanelaExtras: cache!.indicadoresTituloJanelaExtras,
    hostsPadraoDesativados,
    indicadoresPadraoDesativados
  }
  cache = dados
  gravarNoDisco(dados)
  return { ok: true }
}

export function obterBloqueiosPadraoParaUi(): { hosts: LinhaBloqueioPadraoUi[]; indicadores: LinhaBloqueioPadraoUi[] } {
  garantirListasCarregadas()
  const setH = new Set(cache!.hostsPadraoDesativados.map((x) => x.toLowerCase()))
  const setI = new Set(cache!.indicadoresPadraoDesativados.map((x) => x.toLowerCase()))

  const hosts: LinhaBloqueioPadraoUi[] = [...HOSTS_BLOQUEIO_PADRAO]
    .sort((a, b) => a.localeCompare(b, 'pt'))
    .map((rotulo) => {
      const chave = rotulo.toLowerCase()
      return { chave, rotulo, bloqueado: !setH.has(chave) }
    })

  const indicadores: LinhaBloqueioPadraoUi[] = [...INDICADORES_JANELA_PADRAO]
    .sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }))
    .map((rotulo) => {
      const chave = rotulo.toLowerCase()
      return { chave, rotulo, bloqueado: !setI.has(chave) }
    })

  return { hosts, indicadores }
}

/** Remove só as entradas extras; personalização dos padrões (desativados) é mantida. */
export function restaurarListasBloqueioPadrao(): ListasBloqueioExtras {
  garantirListasCarregadas()
  const dados: CacheExtras = {
    hostsExtras: [],
    indicadoresTituloJanelaExtras: [],
    hostsPadraoDesativados: cache!.hostsPadraoDesativados,
    indicadoresPadraoDesativados: cache!.indicadoresPadraoDesativados
  }
  cache = dados
  gravarNoDisco(dados)
  return {
    versao: 2,
    hosts: [],
    indicadoresTituloJanela: []
  }
}
