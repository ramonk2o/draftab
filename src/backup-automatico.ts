import { criarBackup, nomeDoArquivo } from './backup'
import { lerConfiguracoes, lerMeta, listarNotas, registrarBackup, type Meta } from './storage'

// Backup automático, rodando no service worker (background.ts).
// Não usa nada de página: no service worker não há document nem URL.createObjectURL.

export const NOME_DO_ALARME = 'backup-automatico'
export const PASTA_DOS_BACKUPS = 'draftab-backups'

// Só faz backup se alguma nota mudou depois do último
export function precisaDeBackup(meta: Meta): boolean {
  return meta.lastChangeAt > meta.lastBackupAt
}

// Liga, muda ou desliga o alarme conforme o intervalo escolhido nas Configurações
export async function agendarBackup(): Promise<void> {
  const { autoBackupMinutes } = await lerConfiguracoes()
  if (autoBackupMinutes === 0) {
    await chrome.alarms.clear(NOME_DO_ALARME)
    return
  }
  // Se o alarme já existe com o mesmo intervalo, mantém (não reinicia a contagem)
  const atual = await chrome.alarms.get(NOME_DO_ALARME)
  if (atual?.periodInMinutes === autoBackupMinutes) return
  await chrome.alarms.create(NOME_DO_ALARME, {
    delayInMinutes: autoBackupMinutes,
    periodInMinutes: autoBackupMinutes,
  })
}

// Baixa o backup em Downloads/draftab-backups/ se houve mudança. Devolve se baixou.
export async function fazerBackupSeMudou(): Promise<boolean> {
  if (!precisaDeBackup(await lerMeta())) return false

  // Marca o começo: mudanças feitas a partir daqui entram no próximo backup
  const inicio = Date.now()
  const backup = criarBackup(await listarNotas(), await lerConfiguracoes(), inicio)
  const json = JSON.stringify(backup, null, 2)

  await chrome.downloads.download({
    url: 'data:application/json;charset=utf-8,' + encodeURIComponent(json),
    filename: `${PASTA_DOS_BACKUPS}/${nomeDoArquivo(new Date(inicio))}`,
    conflictAction: 'uniquify', // nunca sobrescreve um backup anterior
    saveAs: false,
  })
  await registrarBackup(inicio)
  return true
}
