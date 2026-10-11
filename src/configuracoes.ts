import { exportarBackup, importarBackup, plural } from './backup-ui'
import { ICONE_FECHAR } from './icones'
import {
  aoMudarUltimoBackup,
  excluirTodasAsNotas,
  lerConfiguracoes,
  lerMeta,
  salvarConfiguracoes,
  intervaloValido,
} from './storage'

// Lightbox de Configurações: backup manual, backup automático e apagar todas as notas

const FRASE_PARA_APAGAR = 'apagar tudo'

function elemento<T extends HTMLElement>(seletor: string): T {
  const el = document.querySelector<T>(seletor)
  if (!el) throw new Error(`Elemento ${seletor} não encontrado`)
  return el
}

const dialogo = elemento<HTMLDialogElement>('#configuracoes')
const botaoFechar = elemento<HTMLButtonElement>('#fechar-configuracoes')
const botaoExportar = elemento<HTMLButtonElement>('#config-exportar')
const botaoImportar = elemento<HTMLButtonElement>('#config-importar')
const mensagemBackup = elemento<HTMLParagraphElement>('#mensagem-backup')
const seletorIntervalo = elemento<HTMLSelectElement>('#intervalo')
const ultimoBackup = elemento<HTMLParagraphElement>('#ultimo-backup')
const campoConfirmar = elemento<HTMLInputElement>('#confirmar-apagar')
const botaoApagar = elemento<HTMLButtonElement>('#apagar-tudo')

botaoFechar.innerHTML = ICONE_FECHAR

export async function abrirConfiguracoes() {
  // Sempre abre com os valores atuais e sem restos da última vez
  const { autoBackupMinutes } = await lerConfiguracoes()
  seletorIntervalo.value = String(autoBackupMinutes)
  mostrarUltimoBackup((await lerMeta()).lastBackupAt)
  mostrarMensagem('')
  campoConfirmar.value = ''
  botaoApagar.disabled = true
  dialogo.showModal()
}

// ---------- Fechar ----------

botaoFechar.addEventListener('click', () => dialogo.close())

// Clique fora da caixa (no fundo escurecido) fecha; Esc o navegador já trata
dialogo.addEventListener('click', (evento) => {
  if (evento.target === dialogo) dialogo.close()
})

// ---------- Backup manual ----------

function mostrarMensagem(texto: string, erro = false) {
  mensagemBackup.textContent = texto
  mensagemBackup.classList.toggle('erro', erro)
}

botaoExportar.addEventListener('click', async () => {
  const quantas = await exportarBackup()
  mostrarMensagem(`Backup com ${plural(quantas, 'nota', 'notas')} baixado.`)
})

botaoImportar.addEventListener('click', async () => {
  const resultado = await importarBackup()
  if (!resultado) return // desistiu
  // Se deu certo, a página recarrega sozinha (aoImportar, em newtab.ts)
  mostrarMensagem(resultado.ok ? resultado.mensagem : `Não foi possível importar: ${resultado.mensagem}`, !resultado.ok)
})

// ---------- Backup automático ----------

function mostrarUltimoBackup(momento: number) {
  ultimoBackup.textContent = momento
    ? `Último backup automático: ${new Date(momento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`
    : 'Nenhum backup automático feito ainda.'
}

seletorIntervalo.addEventListener('change', () => {
  // O service worker percebe a mudança e ajusta o alarme
  salvarConfiguracoes({ autoBackupMinutes: intervaloValido(Number(seletorIntervalo.value)) })
})

aoMudarUltimoBackup(mostrarUltimoBackup)

// ---------- Apagar todas as notas ----------

campoConfirmar.addEventListener('input', () => {
  botaoApagar.disabled = campoConfirmar.value.trim().toLowerCase() !== FRASE_PARA_APAGAR
})

botaoApagar.addEventListener('click', async () => {
  if (campoConfirmar.value.trim().toLowerCase() !== FRASE_PARA_APAGAR) return
  botaoApagar.disabled = true
  await excluirTodasAsNotas()
  // As abas abertas (inclusive esta) recarregam sozinhas, como na importação
})
