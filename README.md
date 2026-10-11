# Draftab

Extensão do Chrome que transforma a nova aba num bloco de notas local, com editor markdown em blocos reordenáveis por arrastar e backup em JSON (manual e automático).

## Requisitos
- Node.js LTS (https://nodejs.org)
- Google Chrome

## Rodar
```
npm install
npm run build
```
Em `chrome://extensions`, ative o Modo do desenvolvedor, clique em "Carregar sem compactação" e escolha a pasta `dist/`.

## Backup automático
Os backups vão para `Downloads/draftab-backups/`. Se a opção do Chrome "Perguntar onde salvar cada arquivo" estiver ativa, o Chrome abrirá o diálogo de salvar a cada backup.

Veja `SPEC.md` e `PLAN.md` para detalhes.
