import { exportarBackup, importarBackup, plural } from './backup-ui'
import {
  aoMudarUltimoBackup,
  lerConfiguracoes,
  lerMeta,
  salvarConfiguracoes,
  type Configuracoes,
} from './storage'

const botaoExportar = document.querySelector<HTMLButtonElement>('#exportar')!
const botaoImportar = document.querySelector<HTMLButtonElement>('#importar')!
const mensagem = document.querySelector<HTMLParagraphElement>('#mensagem')!

function mostrar(texto: string, erro = false) {
  mensagem.textContent = texto
  mensagem.classList.toggle('erro', erro)
}

botaoExportar.addEventListener('click', async () => {
  const quantas = await exportarBackup()
  mostrar(`Backup com ${plural(quantas, 'nota', 'notas')} baixado.`)
})

botaoImportar.addEventListener('click', async () => {
  const resultado = await importarBackup()
  if (!resultado) return // desistiu
  mostrar(resultado.ok ? resultado.mensagem : `Não foi possível importar: ${resultado.mensagem}`, !resultado.ok)
})

// ---------- Backup automático ----------

const seletorIntervalo = document.querySelector<HTMLSelectElement>('#intervalo')!
const ultimoBackup = document.querySelector<HTMLParagraphElement>('#ultimo-backup')!

// Intervalo de 1 minuto só no build de desenvolvimento, para testar
if (import.meta.env.MODE === 'development') {
  const teste = new Option('1 minuto (teste)', '1')
  seletorIntervalo.add(teste, 1)
}

function mostrarUltimoBackup(momento: number) {
  ultimoBackup.textContent = momento
    ? `Último backup automático: ${new Date(momento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`
    : 'Nenhum backup automático feito ainda.'
}

seletorIntervalo.addEventListener('change', () => {
  const minutos = Number(seletorIntervalo.value) as Configuracoes['autoBackupMinutes']
  salvarConfiguracoes({ autoBackupMinutes: minutos }) // o service worker reage e ajusta o alarme
})

aoMudarUltimoBackup(mostrarUltimoBackup)

async function iniciar() {
  const { autoBackupMinutes } = await lerConfiguracoes()
  seletorIntervalo.value = String(autoBackupMinutes)
  mostrarUltimoBackup((await lerMeta()).lastBackupAt)
}

iniciar()
