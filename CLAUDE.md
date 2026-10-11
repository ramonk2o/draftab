# Draftab

Extensão do Chrome (Manifest V3) que substitui a nova aba por um bloco de notas com editor de blocos markdown (Tiptap 3) e reordenação por arrastar.
- Especificação e decisões: `SPEC.md`
- Etapas e status: `PLAN.md`

## Comandos
- Instalar: `npm install`
- Desenvolver (build em watch): `npm run dev`
- Build: `npm run build` (saída em `dist/`)
- Testes: `npm test` (Vitest)
- Carregar no Chrome: chrome://extensions → Modo do desenvolvedor → "Carregar sem compactação" → `dist/`. Após rebuild, clicar em ↻ na extensão e reabrir a aba.

## Convenções
- TypeScript estrito; sem React ou outro framework de UI.
- Todo acesso a `chrome.storage` passa por `src/storage.ts`.
- O JSON do Tiptap é a fonte da verdade das notas; markdown só na exportação.
- Permissões mínimas no manifest: `storage`, `unlimitedStorage`, `alarms`, `downloads`. Não adicionar outras sem registrar no SPEC.md.
- Comentários e textos da interface em português.
- O usuário lê JS básico: preferir código direto e legível a abstrações.

## Regras de trabalho
- Responder sempre em português do Brasil, inclusive mensagens intermediárias.
- Implementar uma etapa do PLAN.md por vez.
- Antes de declarar pronto, rodar a verificação da etapa e mostrar o resultado.
- Ao terminar: atualizar o **Status** no PLAN.md e fazer commit.
- Qualquer mudança de decisão vai para o SPEC.md antes do código.

## Backlog de features

Ideias de features ficam em FEATURES.md, não em SPEC.md nem PLAN.md. Leia o arquivo antes de alterá-lo. Uma ideia só vira etapa do PLAN.md quando eu decidir implementar.

- **Adicionar ideia:** se estiver vaga, faça 2 ou 3 perguntas curtas antes de salvar (que problema resolve? como imagino que funcione?); se estiver clara, registre direto. Escreva descrição e motivação com base no que eu disse, sem inventar requisitos. Verifique se já existe feature igual ou parecida e, se existir, pergunte se é para mesclar ou criar separada. Encaixe na área certa; se nenhuma servir, proponha uma nova seção e confirme. Status inicial: Ideia. Apenas registre, não implemente.
- **Apresentar:** resumo por área, com o nome e o status de cada feature. Aplique o filtro que eu pedir (área, status). Detalhe uma feature só se eu pedir.
- **Limpar:** identifique duplicadas, parecidas que podem ser mescladas, já implementadas no código e descartadas. Mostre o que pretende mudar e espere meu OK. Mova implementadas e descartadas para "Arquivo", sem apagar; só apague se eu pedir explicitamente.
- **Reorganizar:** se as áreas deixaram de fazer sentido (seção grande demais, features mal encaixadas), proponha a nova estrutura e aplique só depois de aprovada.
- **Mudar status:** atualize o campo quando eu disser. Se virar Implementada ou Descartada, pergunte se deve ir para "Arquivo".
