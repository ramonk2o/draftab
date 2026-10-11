import { beforeEach, describe, expect, test, vi } from 'vitest'
import { agendarBackup, fazerBackupSeMudou, precisaDeBackup } from './backup-automatico'
import { lerBackup } from './backup'
import { criarChromeFalso } from './chrome-falso'
import { novaNotaEmBranco, type Nota } from './notas'
import { lerMeta, salvarConfiguracoes, salvarNota } from './storage'

let chromeFalso: ReturnType<typeof criarChromeFalso>
let agora = 1000

function nota(texto: string): Nota {
  return {
    ...novaNotaEmBranco(),
    title: texto,
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] },
  }
}

// Avança o relógio, para cada gravação ter um horário diferente
function passarTempo(ms = 1000) {
  agora += ms
}

beforeEach(() => {
  chromeFalso = criarChromeFalso()
  vi.stubGlobal('chrome', chromeFalso)
  agora = new Date(2026, 9, 11, 15, 5).getTime()
  vi.spyOn(Date, 'now').mockImplementation(() => agora)
})

describe('precisaDeBackup', () => {
  test('só quando houve mudança depois do último backup', () => {
    expect(precisaDeBackup({ lastChangeAt: 0, lastBackupAt: 0, lastImportAt: 0 })).toBe(false)
    expect(precisaDeBackup({ lastChangeAt: 5, lastBackupAt: 0, lastImportAt: 0 })).toBe(true)
    expect(precisaDeBackup({ lastChangeAt: 5, lastBackupAt: 5, lastImportAt: 0 })).toBe(false)
  })
})

describe('fazerBackupSeMudou', () => {
  test('sem nenhuma nota, não baixa nada', async () => {
    expect(await fazerBackupSeMudou()).toBe(false)
    expect(chromeFalso.downloads.baixados).toHaveLength(0)
  })

  test('com mudança, baixa um backup válido na pasta draftab-backups, sem perguntar', async () => {
    await salvarNota(nota('oi'))
    passarTempo()
    expect(await fazerBackupSeMudou()).toBe(true)

    const [baixado] = chromeFalso.downloads.baixados
    expect(baixado.filename).toBe('draftab-backups/draftab_2026-10-11-15h05.json')
    expect(baixado).toMatchObject({ saveAs: false, conflictAction: 'uniquify' })
    const prefixo = 'data:application/json;charset=utf-8,'
    expect(baixado.url.startsWith(prefixo)).toBe(true)
    const backup = lerBackup(decodeURIComponent(baixado.url.slice(prefixo.length)))
    expect(backup.notes.map((n) => n.title)).toEqual(['oi'])
    expect((await lerMeta()).lastBackupAt).toBe(agora)
  })

  test('sem mudança desde o último backup, não baixa de novo', async () => {
    await salvarNota(nota('oi'))
    passarTempo()
    await fazerBackupSeMudou()
    passarTempo()
    expect(await fazerBackupSeMudou()).toBe(false)
    expect(chromeFalso.downloads.baixados).toHaveLength(1)
  })

  test('editar depois do backup faz o próximo baixar', async () => {
    await salvarNota(nota('oi'))
    passarTempo()
    await fazerBackupSeMudou()
    passarTempo()
    await salvarNota(nota('outra'))
    passarTempo()
    expect(await fazerBackupSeMudou()).toBe(true)
    expect(chromeFalso.downloads.baixados).toHaveLength(2)
  })

  test('mudança feita enquanto o backup era gerado entra no próximo', async () => {
    await salvarNota(nota('oi'))
    passarTempo()
    // A nota é salva "no meio" do download: depois do início do backup
    chromeFalso.downloads.download = async function (opcoes) {
      this.baixados.push(opcoes)
      passarTempo()
      await salvarNota(nota('durante'))
      return 1
    }
    await fazerBackupSeMudou()
    const meta = await lerMeta()
    expect(meta.lastChangeAt).toBeGreaterThan(meta.lastBackupAt)
  })
})

describe('agendarBackup', () => {
  test('desligado: não há alarme', async () => {
    await agendarBackup()
    expect(chromeFalso.alarms.criados.size).toBe(0)
  })

  test('ligar cria o alarme com o intervalo escolhido; desligar remove', async () => {
    await salvarConfiguracoes({ autoBackupMinutes: 360 })
    await agendarBackup()
    expect(chromeFalso.alarms.criados.get('backup-automatico')).toEqual({ delayInMinutes: 360, periodInMinutes: 360 })
    await salvarConfiguracoes({ autoBackupMinutes: 0 })
    await agendarBackup()
    expect(chromeFalso.alarms.criados.size).toBe(0)
  })

  test('mesmo intervalo mantém o alarme (não reinicia a contagem)', async () => {
    await salvarConfiguracoes({ autoBackupMinutes: 60 })
    await agendarBackup()
    const criar = vi.spyOn(chromeFalso.alarms, 'create')
    await agendarBackup()
    expect(criar).not.toHaveBeenCalled()
  })
})
