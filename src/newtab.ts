import type { JSONContent } from '@tiptap/core'
import { EditorState } from '@tiptap/pm/state'
import { criarEditor } from './editor'
import { exportarBackup, importarBackup } from './backup-ui'
import { abrirConfiguracoes } from './configuracoes'
import { ICONE_ENGRENAGEM, ICONE_EXPORTAR, ICONE_IMPORTAR, ICONE_LAPIS, ICONE_LIXEIRA } from './icones'
import {
  comTituloAtualizado,
  filtrarNotas,
  notaVazia,
  novaNotaEmBranco,
  renomeada,
  tituloParaMostrar,
  type Nota,
} from './notas'
import {
  aoImportar,
  aoMudarNotas,
  excluirNota,
  lerConfiguracoes,
  lerNota,
  listarNotas,
  salvarConfiguracoes,
  salvarNota,
} from './storage'

const ESPERA_PARA_SALVAR = 500 // ms sem digitar antes de salvar

function elemento<T extends HTMLElement>(seletor: string): T {
  const el = document.querySelector<T>(seletor)
  if (!el) throw new Error(`Elemento ${seletor} não encontrado`)
  return el
}

const botaoAlternar = elemento<HTMLButtonElement>('#alternar-lateral')
const botaoNovaNota = elemento<HTMLButtonElement>('#nova-nota')
const campoBusca = elemento<HTMLInputElement>('#busca')
const listaNotas = elemento<HTMLUListElement>('#lista-notas')
const editor = criarEditor(elemento('#editor'))

// ---------- Estado da aba ----------

let notaAtual: Nota = novaNotaEmBranco() // nota aberta no editor
let notaAtualSalva = false // a nota aberta já existe no armazenamento?
let notas: Nota[] = [] // cópia da lista, para a barra lateral
let temporizador: ReturnType<typeof setTimeout> | undefined
let ultimaGravacaoDestaAba = 0 // updatedAt da última nota salva por esta aba
let renomeando = false // enquanto renomeia, a lista não é redesenhada

// ---------- Salvar ----------

editor.on('update', () => {
  clearTimeout(temporizador)
  // A primeira tecla cria a nota na hora; depois, espera uma pausa na digitação
  if (!notaAtualSalva) salvarAgora()
  else temporizador = setTimeout(salvarAgora, ESPERA_PARA_SALVAR)
})

function temAlteracaoPendente(): boolean {
  return temporizador !== undefined
}

async function salvarAgora() {
  clearTimeout(temporizador)
  temporizador = undefined
  // Lê o editor antes de qualquer espera, para não pegar o conteúdo de outra nota
  const nota = comTituloAtualizado({ ...notaAtual, doc: editor.getJSON(), updatedAt: Date.now() })
  notaAtual = nota

  if (notaVazia(nota)) {
    // Nota vazia não fica guardada; se já estava, sai da lista
    if (notaAtualSalva) {
      notaAtualSalva = false
      await excluirNota(nota.id)
    }
    return
  }
  notaAtualSalva = true
  ultimaGravacaoDestaAba = nota.updatedAt
  await salvarNota(nota)
}

// Não perde a última digitação ao fechar ou trocar de aba
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && temAlteracaoPendente()) salvarAgora()
})
window.addEventListener('pagehide', () => {
  if (temAlteracaoPendente()) salvarAgora()
})

// ---------- Abrir notas ----------

function abrir(nota: Nota, jaSalva: boolean) {
  if (temAlteracaoPendente()) salvarAgora()
  notaAtual = nota
  notaAtualSalva = jaSalva
  trocarDocumento(nota.doc)
  // Recarregar a aba reabre esta nota
  sessionStorage.setItem('notaAberta', nota.id)
  desenharLista()
  // view.focus() foca na hora (o focus do Tiptap espera o próximo quadro e
  // perderia as primeiras teclas digitadas logo após clicar em "Nova nota")
  editor.view.focus()
  editor.commands.focus(jaSalva ? 'end' : 'start')
}

// Troca o conteúdo do editor zerando o desfazer (Cmd+Z não volta para a nota anterior)
function trocarDocumento(doc: JSONContent) {
  const { schema, plugins } = editor.state
  let conteudo
  try {
    conteudo = schema.nodeFromJSON(doc)
  } catch (erro) {
    console.error('Nota com conteúdo inválido; abrindo em branco', erro)
    conteudo = schema.nodeFromJSON(novaNotaEmBranco().doc)
  }
  editor.view.updateState(EditorState.create({ schema, doc: conteudo, plugins }))
}

// Conteúdo que chegou de outra aba: troca sem entrar no desfazer e mantém o cursor
function receberConteudo(doc: JSONContent) {
  const { from } = editor.state.selection
  editor
    .chain()
    .setMeta('addToHistory', false)
    .setContent(doc, { emitUpdate: false })
    .setTextSelection(from)
    .run()
}

botaoNovaNota.addEventListener('click', () => abrir(novaNotaEmBranco(), false))

// ---------- Sincronização com outras abas ----------

aoMudarNotas(async (mudancas) => {
  notas = await listarNotas()
  desenharLista()

  const daAtual = mudancas.find((m) => m.id === notaAtual.id)
  if (!daAtual) return

  if (daAtual.nota === null) {
    // Excluída em outra aba (as exclusões desta aba já marcam como não salva)
    if (notaAtualSalva) abrir(novaNotaEmBranco(), false)
    return
  }
  // O aviso das gravações desta própria aba chega depois; pode estar
  // desatualizado em relação ao que já foi digitado, então é ignorado
  const recebida = daAtual.nota
  if (recebida.updatedAt <= ultimaGravacaoDestaAba) return
  // Se há digitação pendente aqui, ela vai gravar por cima (a última gravação vence)
  if (temAlteracaoPendente()) return

  if (JSON.stringify(recebida.doc) !== JSON.stringify(editor.getJSON())) {
    receberConteudo(recebida.doc)
  }
  notaAtual = recebida
  notaAtualSalva = true
})

// ---------- Barra lateral ----------

campoBusca.addEventListener('input', desenharLista)

function desenharLista() {
  if (renomeando) return
  const visiveis = filtrarNotas(notas, campoBusca.value)
  if (visiveis.length === 0) {
    const vazio = document.createElement('li')
    vazio.className = 'lista-vazia'
    vazio.textContent = notas.length === 0 ? 'Nenhuma nota ainda' : 'Nada encontrado'
    listaNotas.replaceChildren(vazio)
    return
  }
  listaNotas.replaceChildren(...visiveis.map(criarItem))
}

function criarItem(nota: Nota): HTMLLIElement {
  const item = document.createElement('li')
  item.className = 'item-nota'
  if (nota.id === notaAtual.id) item.classList.add('atual')

  const titulo = document.createElement('span')
  titulo.className = 'titulo-nota'
  titulo.textContent = tituloParaMostrar(nota)
  titulo.title = 'Clique duas vezes para renomear'

  const data = document.createElement('span')
  data.className = 'data-nota'
  data.textContent = formatarData(nota.updatedAt)

  const renomear = botaoDeAcao(ICONE_LAPIS, 'Renomear', () => comecarRenomear(item, nota))
  const excluir = botaoDeAcao(ICONE_LIXEIRA, 'Excluir', () => confirmarExclusao(nota))

  item.append(titulo, data, renomear, excluir)
  item.addEventListener('click', () => {
    if (nota.id !== notaAtual.id) abrir(nota, true)
  })
  titulo.addEventListener('dblclick', () => comecarRenomear(item, nota))
  return item
}

function botaoDeAcao(icone: string, rotulo: string, acao: () => void): HTMLButtonElement {
  const botao = document.createElement('button')
  botao.type = 'button'
  botao.className = 'acao-nota'
  botao.innerHTML = icone // SVG fixo de icones.ts
  botao.title = rotulo
  botao.setAttribute('aria-label', rotulo)
  botao.addEventListener('click', (evento) => {
    evento.stopPropagation() // não abre a nota
    acao()
  })
  return botao
}

// Troca o título por um campo de texto; Enter confirma, Esc cancela
function comecarRenomear(item: HTMLLIElement, nota: Nota) {
  renomeando = true
  const campo = document.createElement('input')
  campo.className = 'campo-renomear'
  campo.value = nota.titleManual ? nota.title : ''
  campo.placeholder = nota.title || 'Título automático'
  campo.setAttribute('aria-label', 'Novo título')
  item.replaceChildren(campo)
  item.classList.add('renomeando')
  campo.focus()
  campo.select()

  let terminou = false
  const terminar = async (confirmar: boolean) => {
    if (terminou) return
    terminou = true
    renomeando = false
    if (confirmar) await aplicarNovoTitulo(nota, campo.value)
    desenharLista()
  }
  campo.addEventListener('click', (evento) => evento.stopPropagation())
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') terminar(true)
    if (evento.key === 'Escape') terminar(false)
  })
  campo.addEventListener('blur', () => terminar(true))
}

async function aplicarNovoTitulo(nota: Nota, titulo: string) {
  if (nota.id === notaAtual.id) {
    // Inclui o que foi digitado e ainda não foi salvo
    if (temAlteracaoPendente()) await salvarAgora()
    notaAtual = { ...renomeada(notaAtual, titulo), updatedAt: Date.now() }
    ultimaGravacaoDestaAba = notaAtual.updatedAt
    await salvarNota(notaAtual)
    return
  }
  const guardada = await lerNota(nota.id)
  if (guardada) await salvarNota({ ...renomeada(guardada, titulo), updatedAt: Date.now() })
}

async function confirmarExclusao(nota: Nota) {
  if (!confirm(`Excluir a nota "${tituloParaMostrar(nota)}"? Isso não pode ser desfeito.`)) return
  if (nota.id === notaAtual.id) {
    clearTimeout(temporizador)
    temporizador = undefined
    notaAtualSalva = false
    abrir(novaNotaEmBranco(), false)
  }
  await excluirNota(nota.id)
}

function formatarData(momento: number): string {
  const data = new Date(momento)
  const hoje = new Date()
  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ---------- Backup e configurações (topo da barra) ----------

const botaoExportar = elemento<HTMLButtonElement>('#exportar')
const botaoImportar = elemento<HTMLButtonElement>('#importar')
const botaoConfiguracoes = elemento<HTMLButtonElement>('#abrir-configuracoes')
botaoExportar.innerHTML = ICONE_EXPORTAR
botaoImportar.innerHTML = ICONE_IMPORTAR
botaoConfiguracoes.innerHTML = ICONE_ENGRENAGEM

botaoExportar.addEventListener('click', async () => {
  if (temAlteracaoPendente()) await salvarAgora() // inclui o que acabou de ser digitado
  await exportarBackup()
})

botaoImportar.addEventListener('click', async () => {
  const resultado = await importarBackup()
  if (resultado && !resultado.ok) alert(`Não foi possível importar: ${resultado.mensagem}`)
  // Se deu certo, aoImportar recarrega a aba
})

botaoConfiguracoes.addEventListener('click', () => abrirConfiguracoes())

// Depois de uma importação ou de apagar todas as notas (nesta aba ou em outra),
// recarrega com os dados novos,
// descartando a digitação pendente para não gravar por cima do backup
aoImportar(() => {
  clearTimeout(temporizador)
  temporizador = undefined
  location.reload()
})

// ---------- Recolher a barra lateral ----------

function aplicarLateralRecolhida(recolhida: boolean) {
  document.body.classList.toggle('lateral-recolhida', recolhida)
  const rotulo = recolhida ? 'Mostrar barra lateral' : 'Recolher barra lateral'
  botaoAlternar.title = rotulo
  botaoAlternar.setAttribute('aria-label', rotulo)
  botaoAlternar.setAttribute('aria-expanded', String(!recolhida))
}

botaoAlternar.addEventListener('click', () => {
  const recolhida = !document.body.classList.contains('lateral-recolhida')
  aplicarLateralRecolhida(recolhida)
  salvarConfiguracoes({ sidebarCollapsed: recolhida })
})

// ---------- Início ----------

async function iniciar() {
  const configuracoes = await lerConfiguracoes()
  aplicarLateralRecolhida(configuracoes.sidebarCollapsed)
  notas = await listarNotas()

  const idAberta = sessionStorage.getItem('notaAberta')
  const notaAberta = idAberta ? await lerNota(idAberta) : null
  if (notaAberta) abrir(notaAberta, true)
  else abrir(novaNotaEmBranco(), false)

  // Só agora liga as animações, para a barra não "deslizar" ao abrir a aba
  requestAnimationFrame(() => document.body.classList.remove('carregando'))
}

iniciar()
