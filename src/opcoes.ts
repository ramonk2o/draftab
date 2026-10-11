import { exportarBackup, importarBackup, plural } from './backup-ui'

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
