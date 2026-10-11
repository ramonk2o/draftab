import type { Nota } from './notas'
import type { Tema } from './tema'

// Todo acesso ao chrome.storage passa por aqui.
// Chaves: "note:<id>" (uma por nota), "settings" e "meta".

const PREFIXO_NOTA = 'note:'

// Intervalos do backup automático, em minutos (0 = desligado; mensal = 30 dias)
export const INTERVALOS_DE_BACKUP = [0, 1, 60, 1440, 10080, 43200] as const
export type IntervaloDeBackup = (typeof INTERVALOS_DE_BACKUP)[number]

export type Configuracoes = {
  autoBackupMinutes: IntervaloDeBackup
  sidebarCollapsed: boolean
  theme: Tema
}

export type Meta = {
  lastChangeAt: number // última mudança em qualquer nota
  lastBackupAt: number // último backup automático
  lastImportAt: number // última importação (as abas abertas recarregam)
}

const CONFIGURACOES_PADRAO: Configuracoes = { autoBackupMinutes: 0, sidebarCollapsed: false, theme: 'auto' }
const META_PADRAO: Meta = { lastChangeAt: 0, lastBackupAt: 0, lastImportAt: 0 }

// ---------- Notas ----------

// Todas as notas, da editada mais recentemente para a mais antiga
export async function listarNotas(): Promise<Nota[]> {
  const tudo = await chrome.storage.local.get(null)
  return Object.entries(tudo)
    .filter(([chave]) => chave.startsWith(PREFIXO_NOTA))
    .map(([, nota]) => nota as Nota)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function lerNota(id: string): Promise<Nota | null> {
  const chave = PREFIXO_NOTA + id
  const resultado = await chrome.storage.local.get(chave)
  return (resultado[chave] as Nota | undefined) ?? null
}

export async function salvarNota(nota: Nota): Promise<void> {
  const meta = await lerMeta()
  await chrome.storage.local.set({
    [PREFIXO_NOTA + nota.id]: nota,
    meta: { ...meta, lastChangeAt: Date.now() },
  })
}

export async function excluirNota(id: string): Promise<void> {
  await chrome.storage.local.remove(PREFIXO_NOTA + id)
  const meta = await lerMeta()
  await chrome.storage.local.set({ meta: { ...meta, lastChangeAt: Date.now() } })
}

// Avisa quando notas mudam (nesta aba ou em outra). nota = null quando foi excluída.
export function aoMudarNotas(callback: (mudancas: { id: string; nota: Nota | null }[]) => void) {
  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== 'local') return
    const deNotas = Object.entries(mudancas)
      .filter(([chave]) => chave.startsWith(PREFIXO_NOTA))
      .map(([chave, mudanca]) => ({
        id: chave.slice(PREFIXO_NOTA.length),
        nota: (mudanca.newValue as Nota | undefined) ?? null,
      }))
    if (deNotas.length > 0) callback(deNotas)
  })
}

// Importação: apaga todas as notas e grava as do backup, com as configurações dele
export async function substituirTudo(notas: Nota[], configuracoes: Partial<Configuracoes>): Promise<void> {
  const tudo = await chrome.storage.local.get(null)
  const chavesDeNotas = Object.keys(tudo).filter((chave) => chave.startsWith(PREFIXO_NOTA))
  await chrome.storage.local.remove(chavesDeNotas)

  const meta = await lerMeta()
  const agora = Date.now()
  const novos: Record<string, unknown> = {
    settings: { ...CONFIGURACOES_PADRAO, ...configuracoes },
    meta: { ...meta, lastChangeAt: agora, lastImportAt: agora },
  }
  for (const nota of notas) novos[PREFIXO_NOTA + nota.id] = nota
  await chrome.storage.local.set(novos)
}

// Apaga todas as notas, mantendo as configurações. Avisa as abas como uma importação.
export async function excluirTodasAsNotas(): Promise<void> {
  await substituirTudo([], await lerConfiguracoes())
}

// Avisa quando uma importação (ou exclusão de todas as notas) acontece, nesta aba ou em outra
export function aoImportar(callback: () => void) {
  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== 'local' || !mudancas.meta) return
    // Sem meta gravado ainda conta como 0 (a primeira gravação não é importação)
    const antes = (mudancas.meta.oldValue as Partial<Meta> | undefined)?.lastImportAt ?? 0
    const depois = (mudancas.meta.newValue as Partial<Meta> | undefined)?.lastImportAt ?? 0
    if (depois !== antes) callback()
  })
}

// ---------- Configurações e meta ----------

export async function lerConfiguracoes(): Promise<Configuracoes> {
  const { settings } = await chrome.storage.local.get('settings')
  const configuracoes = { ...CONFIGURACOES_PADRAO, ...(settings as Partial<Configuracoes> | undefined) }
  configuracoes.autoBackupMinutes = intervaloValido(configuracoes.autoBackupMinutes)
  if (!['auto', 'light', 'dark'].includes(configuracoes.theme)) configuracoes.theme = 'auto'
  return configuracoes
}

// Valores que não estão na lista (ex.: 6 h ou 12 h, de versões antigas) viram
// o intervalo mais próximo; nunca desliga um backup que estava ligado
export function intervaloValido(minutos: number): IntervaloDeBackup {
  if ((INTERVALOS_DE_BACKUP as readonly number[]).includes(minutos)) return minutos as IntervaloDeBackup
  if (!(minutos > 0)) return 0
  let melhor: IntervaloDeBackup = 1
  for (const opcao of INTERVALOS_DE_BACKUP) {
    if (opcao === 0) continue
    // Mais próximo em proporção: 6 h fica mais perto de 1 dia (4×) que de 1 h (6×)
    if (Math.abs(Math.log(minutos / opcao)) < Math.abs(Math.log(minutos / melhor))) melhor = opcao
  }
  return melhor
}

export async function salvarConfiguracoes(mudancas: Partial<Configuracoes>): Promise<void> {
  const atuais = await lerConfiguracoes()
  await chrome.storage.local.set({ settings: { ...atuais, ...mudancas } })
}

// Backup automático feito: guarda quando ele começou a ser gerado
export async function registrarBackup(momento: number): Promise<void> {
  const meta = await lerMeta() // lê de novo na hora de gravar, para não perder lastChangeAt recente
  await chrome.storage.local.set({ meta: { ...meta, lastBackupAt: momento } })
}

// Avisa quando a data do último backup automático muda
export function aoMudarUltimoBackup(callback: (momento: number) => void) {
  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== 'local' || !mudancas.meta) return
    const antes = (mudancas.meta.oldValue as Partial<Meta> | undefined)?.lastBackupAt ?? 0
    const depois = (mudancas.meta.newValue as Partial<Meta> | undefined)?.lastBackupAt ?? 0
    if (depois !== antes) callback(depois)
  })
}

// Avisa quando o tema muda (nesta aba ou em outra)
export function aoMudarTema(callback: (tema: Tema) => void) {
  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== 'local' || !mudancas.settings) return
    const antes = (mudancas.settings.oldValue as Partial<Configuracoes> | undefined)?.theme
    const depois = (mudancas.settings.newValue as Partial<Configuracoes> | undefined)?.theme
    if (depois && depois !== antes) callback(depois)
  })
}

// Avisa quando o intervalo do backup automático muda
export function aoMudarIntervaloDeBackup(callback: () => void) {
  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== 'local' || !mudancas.settings) return
    const antes = (mudancas.settings.oldValue as Partial<Configuracoes> | undefined)?.autoBackupMinutes
    const depois = (mudancas.settings.newValue as Partial<Configuracoes> | undefined)?.autoBackupMinutes
    if (depois !== antes) callback()
  })
}

export async function lerMeta(): Promise<Meta> {
  const { meta } = await chrome.storage.local.get('meta')
  return { ...META_PADRAO, ...(meta as Partial<Meta> | undefined) }
}
