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
  'onlyfans.com',
  'tinder.com',
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
  'onlyfans',
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
  'tinder',
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

const NOME_ARQUIVO = 'listas-bloqueio.json'
const MAX_ITENS_POR_LISTA = 400
const MAX_CARACTERES_POR_ENTRADA = 200

const SET_HOSTS_PADRAO = new Set(HOSTS_BLOQUEIO_PADRAO.map((h) => h.toLowerCase()))
const SET_INDICADORES_PADRAO = new Set(INDICADORES_JANELA_PADRAO.map((i) => i.toLowerCase()))

/** Só entradas adicionadas pelo usuário (persistido). Padrões do app ficam no código. */
type CacheExtras = {
  hostsExtras: string[]
  indicadoresTituloJanelaExtras: string[]
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

/** Resposta ao renderer: apenas extras (o que o usuário edita na tela). */
export type ListasBloqueioExtras = {
  versao: 2
  hosts: string[]
  indicadoresTituloJanela: string[]
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
  return normalizarEntradaLista(hosts.filter((h) => !SET_HOSTS_PADRAO.has(String(h).trim().toLowerCase())))
}

function extrasApartirDeListaCompletaIndicadores(ind: string[]): string[] {
  return normalizarEntradaLista(
    ind.filter((i) => !SET_INDICADORES_PADRAO.has(String(i).trim().toLowerCase()))
  )
}

function gravarNoDisco(dados: CacheExtras): void {
  const arquivo: ArquivoV2 = {
    versao: 2,
    hostsExtras: dados.hostsExtras,
    indicadoresTituloJanelaExtras: dados.indicadoresTituloJanelaExtras
  }
  writeFileSync(caminhoPersistencia(), JSON.stringify(arquivo, null, 2), 'utf8')
}

function lerDoDisco(): CacheExtras | null {
  const caminho = caminhoPersistencia()
  if (!existsSync(caminho)) return null
  try {
    const j = JSON.parse(readFileSync(caminho, 'utf8')) as Partial<ArquivoV1> & Partial<ArquivoV2>
    if (j.versao === 2 && Array.isArray(j.hostsExtras) && Array.isArray(j.indicadoresTituloJanelaExtras)) {
      return {
        hostsExtras: normalizarEntradaLista(j.hostsExtras),
        indicadoresTituloJanelaExtras: normalizarEntradaLista(j.indicadoresTituloJanelaExtras)
      }
    }
    if (j.versao === 1 && Array.isArray(j.hosts) && Array.isArray(j.indicadoresTituloJanela)) {
      const hostsNorm = normalizarEntradaLista(j.hosts)
      const indNorm = normalizarEntradaLista(j.indicadoresTituloJanela)
      const migrado: CacheExtras = {
        hostsExtras: extrasApartirDeListaCompletaHosts(hostsNorm),
        indicadoresTituloJanelaExtras: extrasApartirDeListaCompletaIndicadores(indNorm)
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
  const visto = new Set<string>()
  const saida: string[] = []
  for (const h of HOSTS_BLOQUEIO_PADRAO) {
    const k = h.toLowerCase()
    if (visto.has(k)) continue
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
  const visto = new Set<string>()
  const saida: string[] = []
  for (const i of INDICADORES_JANELA_PADRAO) {
    const k = i.toLowerCase()
    if (visto.has(k)) continue
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

/** Deve ser chamado após `app.whenReady` antes de serviços que leem as listas. */
export function garantirListasCarregadas(): void {
  if (cache) return
  const doDisco = lerDoDisco()
  cache = doDisco ?? { hostsExtras: [], indicadoresTituloJanelaExtras: [] }
  if (!doDisco) {
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
    hosts: [...cache!.hostsExtras],
    indicadoresTituloJanela: [...cache!.indicadoresTituloJanelaExtras]
  }
}

export function salvarListasBloqueio(payload: {
  hosts: unknown
  indicadoresTituloJanela: unknown
}): { ok: true; dados: ListasBloqueioExtras } {
  garantirListasCarregadas()
  const hostsExtras = normalizarEntradaLista(payload.hosts)
  const indicadoresTituloJanelaExtras = normalizarEntradaLista(payload.indicadoresTituloJanela)
  const dados: CacheExtras = { hostsExtras, indicadoresTituloJanelaExtras }
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

/** Remove só as entradas extras; os bloqueios padrão do app continuam ativos. */
export function restaurarListasBloqueioPadrao(): ListasBloqueioExtras {
  const dados: CacheExtras = { hostsExtras: [], indicadoresTituloJanelaExtras: [] }
  cache = dados
  gravarNoDisco(dados)
  return {
    versao: 2,
    hosts: [],
    indicadoresTituloJanela: []
  }
}
