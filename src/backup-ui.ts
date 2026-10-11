import { criarBackup, lerBackup, nomeDoArquivo, notasDoBackup } from './backup'
import { lerConfiguracoes, listarNotas, substituirTudo } from './storage'

// Exportar e importar backup a partir de uma página (barra lateral ou Configurações)

// Baixa o arquivo de backup; devolve quantas notas foram exportadas
export async function exportarBackup(): Promise<number> {
  const notas = await listarNotas()
  const backup = criarBackup(notas, await lerConfiguracoes())
  const arquivo = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nomeDoArquivo(new Date())
  link.click()
  setTimeout(() => URL.revokeObjectURL(endereco), 1000)
  return notas.length
}

// Resultado de uma tentativa de importação, com a mensagem para o usuário
export type ResultadoImportacao = { ok: boolean; mensagem: string }

// Pede o arquivo, confere, confirma e substitui tudo.
// Devolve null se o usuário desistir no caminho.
export async function importarBackup(): Promise<ResultadoImportacao | null> {
  const arquivo = await escolherArquivo()
  if (!arquivo) return null

  let backup
  try {
    backup = lerBackup(await arquivo.text())
  } catch (erro) {
    return { ok: false, mensagem: erro instanceof Error ? erro.message : String(erro) }
  }

  const atuais = (await listarNotas()).length
  const quando = backup.exportedAt
    ? ` de ${new Date(backup.exportedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
    : ''
  const pergunta =
    `Importar ${plural(backup.notes.length, 'nota', 'notas')} do backup${quando}?\n\n` +
    `Isso substitui ${atuais === 1 ? 'a nota atual' : `todas as ${plural(atuais, 'nota', 'notas')} atuais`}.`
  if (!confirm(pergunta)) return null

  await substituirTudo(notasDoBackup(backup), backup.settings)
  return { ok: true, mensagem: `${plural(backup.notes.length, 'nota importada', 'notas importadas')}.` }
}

function escolherArquivo(): Promise<File | null> {
  return new Promise((resolve) => {
    const campo = document.createElement('input')
    campo.type = 'file'
    campo.accept = 'application/json,.json'
    campo.addEventListener('change', () => resolve(campo.files?.[0] ?? null))
    campo.addEventListener('cancel', () => resolve(null))
    campo.click()
  })
}

export function plural(n: number, singular: string, varios: string): string {
  return `${n} ${n === 1 ? singular : varios}`
}
