# Draftab

## Objetivo
Extensão do Chrome que substitui a nova aba por um bloco de notas local, com editor de blocos compatível com markdown e reordenação de blocos por arrastar. Uso pessoal; publicação na Chrome Web Store fica para depois.

## Hipótese a testar
Um editor de blocos reordenáveis, com backup confiável, substitui o New Tab Draft no dia a dia.
Sucesso: ~2 semanas de uso real sem perder nenhuma nota e sem voltar ao New Tab Draft.

## Escopo do MVP
- Nova aba abre uma nota em branco com o cursor no editor.
- Atalhos markdown viram blocos formatados enquanto se digita: `#`/`##`/`###`, `-`, `1.`, `- [ ]`, `>`, ` ``` `, `---`, `**negrito**`, `*itálico*`, `` `código` ``, links.
- Cada bloco mostra uma alça à esquerda ao passar o mouse; arrastar a alça move o bloco e a nova ordem é salva.
  - Itens de lista têm alça própria, antes do marcador.
  - Durante o arraste, os vizinhos deslizam com animação para abrir espaço onde o bloco vai cair; o bloco aparece apagado nesse espaço.
  - Ao passar o mouse sobre uma lista, uma barra fina à esquerda permite arrastar a lista inteira.
  - Itens e parágrafos podem mudar de nível: a altura do mouse escolhe a posição; nas bordas de uma lista, o movimento horizontal decide se o bloco fica dentro (direita) ou fora (esquerda) dela.
  - Conversões ao mudar de nível: item que sai da lista continua item, numa lista própria; parágrafo que entra numa lista vira item; item de lista ↔ item de checklist conforme a lista de destino. Listas vizinhas do mesmo tipo se juntam.
  - Títulos, citações, código, divisores e listas inteiras não entram em listas (movem-se só entre os blocos da nota).
- Barra lateral lista as notas por última edição, com busca (título e conteúdo), botão "nova nota", renomear (duplo clique no título ou botão ✎) e excluir com confirmação.
  - A barra lateral pode ser recolhida; o estado (aberta/recolhida) é lembrado.
- Título da nota: enquanto ela não tem título definido pelo usuário, o título acompanha a primeira linha de texto. Renomear fixa o título; renomear para vazio volta ao título automático.
- Nota vazia (sem texto e sem título definido) não é salva: abrir e fechar a aba não deixa lixo, e uma nota salva que fica vazia sai da lista.
- Recarregar a aba reabre a mesma nota (o id fica no `sessionStorage` da aba, que sobrevive à recarga e some ao fechá-la).
- Salvamento automático com debounce de ~500 ms. Mudança feita em outra aba aparece nesta (última gravação vence).
- Topo da barra lateral (visível só com ela aberta): ícones de exportar e importar backup ao lado do botão de recolher, e uma engrenagem à direita que abre a página de Configurações (também acessível em chrome://extensions → Opções).
- Página de Configurações:
  - Exportar backup agora (baixa um JSON).
  - Importar backup: valida o arquivo, pede confirmação e substitui tudo. As abas abertas do Draftab recarregam sozinhas depois da importação (nenhuma grava conteúdo antigo por cima).
  - Backup automático: desligado / 1 h / 6 h / 12 h / 24 h, mostrando a data do último backup.
- Nome do arquivo de backup (manual e automático): `draftab_AAAA-MM-DD-HHhMM.json` (ex.: `draftab_2026-10-11-15h05.json`).
- Backup automático salva em `Downloads/draftab-backups/` sem perguntar, e só se houve mudança desde o último backup.

## Fora do escopo (por enquanto)
- Sincronização entre computadores (o backup JSON cobre a transferência manual).
- Pastas e tags, tabelas, imagens, menu "/".
- Publicação na Chrome Web Store.
- Limpeza automática de backups antigos.
- Tema escuro (a avaliar).

## Stack e decisões técnicas
- Manifest V3 com `chrome_url_overrides.newtab`: padrão atual de extensões.
- Vite + TypeScript: build simples, tipos pegam erros, bibliotecas via npm.
- Tiptap 3 (StarterKit, TaskList/TaskItem, DragHandle, Markdown): atalhos markdown e alça de arrastar prontos e maduros.
- Sem React nem outro framework de UI: a interface ao redor do editor é pequena; menos camadas para ler.
- `chrome.storage.local` + permissão `unlimitedStorage`: sem o limite de ~5 MB do localStorage, não some ao limpar cookies e é acessível ao service worker.
- Uma chave por nota (`note:<id>`): evita regravar tudo a cada tecla.
- `chrome.alarms` + `chrome.downloads` no service worker: backup roda mesmo com a aba fechada. Arquivo gerado como `data:` URL (não há `URL.createObjectURL` no service worker).
- Vitest para as camadas de dados e backup; o editor é verificado manualmente.

## Modelo de dados
- `Note { id: string (uuid), doc: TiptapJSON, title: string, titleManual: boolean, createdAt: number, updatedAt: number }`
  `titleManual` = o usuário renomeou a nota; enquanto for `false`, `title` acompanha a primeira linha.
  O JSON do Tiptap é a fonte da verdade (sem perdas de conversão).
- `settings { autoBackupMinutes: 0 | 60 | 360 | 720 | 1440, sidebarCollapsed: boolean }`
- `meta { lastChangeAt: number, lastBackupAt: number, lastImportAt: number }` (`lastImportAt` avisa as abas abertas para recarregar)
- Arquivo de backup:
  `{ app: "draftab", version: 1, exportedAt, settings, notes: [{ id, title, titleManual, markdown, doc, createdAt, updatedAt }] }`
  `markdown` é para leitura humana; a importação restaura a partir de `doc`.

## Fluxos principais
1. **Escrever:** abro nova aba → digito `# Ideias` → vira título → na primeira tecla a nota é criada e aparece na lateral.
2. **Reordenar:** passo o mouse num parágrafo → arrasto a alça para cima de outro bloco → solto → a ordem persiste ao recarregar.
3. **Backup automático:** o alarme dispara → o service worker compara `lastChangeAt` com `lastBackupAt` → se mudou, baixa o JSON e atualiza `lastBackupAt`.

## Suposições e questões em aberto
- Se a opção do Chrome "Perguntar onde salvar cada arquivo" estiver ativa, o backup automático abrirá o diálogo de salvar. Documentar no README.
- Cada backup automático mostra brevemente o ícone de download do Chrome.
- Busca em memória basta para algumas centenas de notas.
- A conversão para markdown só é usada na exportação; perdas pequenas não afetam a restauração.
