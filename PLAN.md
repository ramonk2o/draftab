# Plano

Etapas em ordem de risco: o que pode invalidar a ideia vem primeiro.

## Etapa 1: Esqueleto andando
- **Entrega:** projeto Vite + TypeScript, manifest MV3 sobrescrevendo a nova aba, página com editor Tiptap básico (StarterKit). Versões das libs fixadas consultando a documentação atual do Tiptap 3.
- **Como verificar:** `npm install && npm run build` sem erros; em chrome://extensions, "Carregar sem compactação" apontando para `dist/`; abrir nova aba, digitar `# oi` e ver um título.
- **Status:** concluída (install, build e `npm test` sem erros; teste manual no Chrome ok: `# oi` vira título). Versões fixadas: Tiptap 3.31.4, Vite 8.3.4, TypeScript 7.0.2, Vitest 5.0.3.

## Etapa 2: Editor de blocos completo + arrastar
- **Entrega:** todos os blocos do escopo (títulos, listas, checklist, código, citação, divisor, marcas inline, links), alça DragHandle à esquerda de cada bloco e CSS dos blocos.
- **Como verificar:** checklist manual — cada atalho markdown do SPEC vira o bloco certo; arrastar um bloco para o topo e para o fim da nota funciona; checklist é clicável.
- **Status:** concluída. Build ok; atalhos e arraste testados no Chrome (script automatizado) e checklist manual aprovado. Além do previsto: reordenação animada, arrastar lista inteira e blocos entre níveis (ver SPEC).

## Etapa 3: Persistência e lista de notas
- **Entrega:** `src/storage.ts` (CRUD em `chrome.storage.local`), nova nota por aba, descarte de nota vazia, título automático pela primeira linha até a nota ser renomeada, barra lateral recolhível com busca, renomear e exclusão, sincronização entre abas via `chrome.storage.onChanged`.
- **Como verificar:** `npm test` passa (CRUD com `chrome.storage` simulado). Manual: recarregar mantém notas e ordem dos blocos; abrir e fechar aba sem digitar não cria nota; duas abas na mesma nota se atualizam; renomear fixa o título; recolher a barra persiste ao recarregar.
- **Status:** concluída. `npm test`: 23 testes ok; roteiro manual executado no Chrome com a extensão carregada (18 verificações ok) e aprovado no uso. Ajustes extras: ícones minimalistas, busca com lupa, alinhamento de checkboxes e alças.

## Etapa 4: Backup manual
- **Entrega:** ícones de exportar/importar e engrenagem no topo da barra lateral; página de Configurações com Exportar (JSON no formato do SPEC, incluindo markdown) e Importar (valida `app`/`version`, confirma, substitui tudo).
- **Como verificar:** `npm test` passa (exportar → importar devolve dados idênticos; arquivo inválido é recusado). Manual: exportar, apagar uma nota, importar e ver a nota de volta.
- **Status:** concluída. `npm test`: 39 testes ok (exportar → importar idêntico; 9 tipos de arquivo inválido recusados); roteiro manual no Chrome com a extensão: 13 verificações ok; aprovado no uso. Nome do arquivo: `draftab_AAAA-MM-DD-HHhMM.json`.

## Etapa 5: Backup automático
- **Entrega:** seletor de intervalo nas Configurações, `chrome.alarms` + `chrome.downloads` no service worker, pula quando nada mudou, mostra data do último backup.
- **Como verificar:** com intervalo de teste de 1 min (só em build de dev), editar uma nota e ver o arquivo em `Downloads/draftab-backups/`; sem editar, nenhum arquivo novo aparece.
- **Status:** implementada (`npm test`: 48 testes ok; no Chrome com a extensão (build de dev, intervalo de 1 min): editar → backup em `draftab-backups/`; sem editar → nenhum arquivo novo; editar de novo → segundo arquivo; 10 verificações ok); falta seu teste no Chrome.

## Etapa 6: Pronto para uso diário
- **Entrega:** ícones, atalho de teclado para nova nota, estados vazios, script `npm run zip`, rascunho de política de privacidade para publicação futura.
- **Como verificar:** `npm run zip` gera o .zip instalável; uso por um dia sem fricção. Começa o teste de 2 semanas.
- **Status:** pendente
