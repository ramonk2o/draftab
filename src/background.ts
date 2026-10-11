import { NOME_DO_ALARME, agendarBackup, fazerBackupSeMudou } from './backup-automatico'
import { aoMudarIntervaloDeBackup } from './storage'

// Service worker da extensão: cuida do backup automático, mesmo com a aba fechada.

// Garante o alarme ao instalar/atualizar a extensão e ao abrir o Chrome
chrome.runtime.onInstalled.addListener(() => agendarBackup())
chrome.runtime.onStartup.addListener(() => agendarBackup())

// Mudou o intervalo nas Configurações
aoMudarIntervaloDeBackup(() => agendarBackup())

chrome.alarms.onAlarm.addListener((alarme) => {
  if (alarme.name === NOME_DO_ALARME) {
    fazerBackupSeMudou().catch((erro) => console.error('Falha no backup automático', erro))
  }
})
