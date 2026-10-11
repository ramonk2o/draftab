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
- Implementar uma etapa do PLAN.md por vez.
- Antes de declarar pronto, rodar a verificação da etapa e mostrar o resultado.
- Ao terminar: atualizar o **Status** no PLAN.md e fazer commit.
- Qualquer mudança de decisão vai para o SPEC.md antes do código.
