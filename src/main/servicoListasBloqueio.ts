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
  'spotify.com',
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
  'spotify',
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

type PersistidoV1 = {
  versao: 1
  hosts: string[]
  indicadoresTituloJanela: string[]
}

let cache: PersistidoV1 | null = null

function caminhoPersistencia(): string {
  return join(app.getPath('userData'), NOME_ARQUIVO)
}

function clonarPadroes(): PersistidoV1 {
  return {
    versao: 1,
    hosts: [...HOSTS_BLOQUEIO_PADRAO],
    indicadoresTituloJanela: [...INDICADORES_JANELA_PADRAO]
  }
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

function lerDoDisco(): PersistidoV1 | null {
  const caminho = caminhoPersistencia()
  if (!existsSync(caminho)) return null
  try {
    const j = JSON.parse(readFileSync(caminho, 'utf8')) as Partial<PersistidoV1>
    if (j.versao !== 1) return null
    return {
      versao: 1,
      hosts: normalizarEntradaLista(j.hosts),
      indicadoresTituloJanela: normalizarEntradaLista(j.indicadoresTituloJanela)
    }
  } catch {
    return null
  }
}

function gravarNoDisco(dados: PersistidoV1): void {
  writeFileSync(caminhoPersistencia(), JSON.stringify(dados, null, 2), 'utf8')
}

/** Deve ser chamado após `app.whenReady` antes de serviços que leem as listas. */
export function garantirListasCarregadas(): void {
  if (cache) return
  const doDisco = lerDoDisco()
  cache = doDisco ?? clonarPadroes()
  if (!doDisco) {
    gravarNoDisco(cache)
  }
}

export function obterHostsBloqueio(): string[] {
  garantirListasCarregadas()
  return [...cache!.hosts]
}

export function obterIndicadoresJanelaOrdenados(): string[] {
  garantirListasCarregadas()
  return [...cache!.indicadoresTituloJanela].sort((a, b) => b.length - a.length)
}

export function obterListasBloqueioParaRenderer(): PersistidoV1 {
  garantirListasCarregadas()
  return {
    versao: 1,
    hosts: [...cache!.hosts],
    indicadoresTituloJanela: [...cache!.indicadoresTituloJanela]
  }
}

export function salvarListasBloqueio(payload: {
  hosts: unknown
  indicadoresTituloJanela: unknown
}): { ok: true; dados: PersistidoV1 } | { ok: false; motivo: string } {
  garantirListasCarregadas()
  const hosts = normalizarEntradaLista(payload.hosts)
  const indicadoresTituloJanela = normalizarEntradaLista(payload.indicadoresTituloJanela)
  if (hosts.length === 0 && indicadoresTituloJanela.length === 0) {
    return {
      ok: false,
      motivo: 'Inclua ao menos um domínio ou um trecho de título de janela.'
    }
  }
  const dados: PersistidoV1 = { versao: 1, hosts, indicadoresTituloJanela }
  cache = dados
  gravarNoDisco(dados)
  return { ok: true, dados }
}

export function restaurarListasBloqueioPadrao(): PersistidoV1 {
  const dados = clonarPadroes()
  cache = dados
  gravarNoDisco(dados)
  return dados
}
