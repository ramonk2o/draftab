# Chrome Web Store listing

Everything the Chrome Web Store developer dashboard asks for, ready to copy. The summary comes from the manifest (`public/_locales/*/messages.json`); the rest is filled in the dashboard.

## Package

- **File:** `draftab-1.1.0.zip` (run `npm run zip`)
- **Default language:** English (`default_locale: en`); the listing is also localized to Portuguese (Brazil)

## Store listing — English (en-US)

**Name:** Draftab

**Summary** (from the manifest, 126/132 characters):
> A markdown block notepad in your new tab. Drag to reorder, dark mode, automatic backups. Your notes never leave your computer.

**Description:**

```
Draftab turns every new tab into a clean notepad. Open a tab and start typing: the cursor is already there.

WRITE IN MARKDOWN, SEE IT FORMATTED
Type # for a heading, - for a list, [ ] for a checklist, > for a quote, ``` for code, --- for a divider, **bold**, *italic*, `code` and [links](https://example.com). Everything becomes formatting as you type.

DRAG ANY BLOCK TO REORDER
Hover a block and drag its handle. The other blocks slide out of the way so you can see where it will land. Move list items, whole lists, and take items in and out of lists.

ALL YOUR NOTES, ONE CLICK AWAY
A collapsible sidebar lists your notes — by last edit, title or creation date — with instant search across titles and content. Rename, delete, and keep several tabs open at once: what you write in one shows up in the others.

BACKUPS YOU CAN TRUST
Export and import a JSON backup of all notes and settings (each note also comes in plain markdown). Turn on automatic backups — every minute, hour, day, week or month — saved to Downloads/draftab-backups/, only when something changed.

LIGHT AND DARK
Light, dark, or automatic theme that follows your system.

PRIVATE BY DESIGN
Your notes are stored only in your browser, on your computer. Draftab has no account, no server, no analytics and no tracking. It never sends your data anywhere.

OPEN SOURCE
Draftab is free and open source under the MIT license: https://github.com/ramonk2o/draftab

Tip: uninstalling the extension deletes its notes, so export a backup first.
```

## Store listing — Portuguese, Brazil (pt-BR)

**Name:** Draftab

**Summary** (from the manifest, 131/132 characters):
> Bloco de notas em markdown na nova aba. Arraste para reordenar, tema escuro e backup automático. Suas notas não saem do computador.

**Description:**

```
O Draftab transforma cada nova aba num bloco de notas limpo. Abra uma aba e comece a digitar: o cursor já está lá.

ESCREVA EM MARKDOWN, VEJA FORMATADO
Digite # para um título, - para uma lista, [ ] para um checklist, > para uma citação, ``` para código, --- para um divisor, **negrito**, *itálico*, `código` e [links](https://example.com). Tudo vira formatação enquanto você digita.

ARRASTE QUALQUER BLOCO PARA REORDENAR
Passe o mouse num bloco e arraste a alça. Os outros blocos abrem espaço para você ver onde ele vai cair. Mova itens de lista, listas inteiras e tire itens de listas ou coloque dentro delas.

TODAS AS NOTAS A UM CLIQUE
Uma barra lateral recolhível lista as notas — pela última edição, pelo título ou pela data de criação — com busca instantânea no título e no conteúdo. Renomeie, exclua e use várias abas ao mesmo tempo: o que você escreve numa aparece nas outras.

BACKUP CONFIÁVEL
Exporte e importe um backup em JSON com todas as notas e configurações (cada nota vem também em markdown). Ligue o backup automático — a cada minuto, hora, dia, semana ou mês — salvo em Downloads/draftab-backups/, só quando algo mudou.

CLARO E ESCURO
Tema claro, escuro ou automático, que segue o sistema.

PRIVADO DE VERDADE
Suas notas ficam só no seu navegador, no seu computador. O Draftab não tem conta, servidor, estatísticas de uso nem rastreamento. Ele nunca envia seus dados para lugar nenhum.

CÓDIGO ABERTO
O Draftab é gratuito e open source, com licença MIT: https://github.com/ramonk2o/draftab

A interface da extensão está em inglês.

Dica: desinstalar a extensão apaga as notas, então exporte um backup antes.
```

## Other listing fields

| Field | Value |
|---|---|
| Category | Productivity → Workflow & Planning |
| Language | English (with a Portuguese (Brazil) listing) |
| Official URL / Homepage | https://github.com/ramonk2o/draftab |
| Support URL | https://github.com/ramonk2o/draftab/issues |
| Mature content | No |

## Graphic assets

| Asset | Size | File |
|---|---|---|
| Store icon | 128×128 | `public/icons/icon-128.png` |
| Screenshots (1 to 5) | 1280×800 | `docs/store/en/screenshot-*.png` and `docs/store/pt-BR/screenshot-*.png` |
| Small promo tile | 440×280 | `docs/store/en/promo-small.png` and `docs/store/pt-BR/promo-small.png` |

## Privacy practices

**Single purpose:**
> Replace the new tab page with a local note-taking editor, where notes are written, organized and backed up on the user's own computer.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Stores the user's notes and settings locally, on the user's device, with chrome.storage.local. |
| `unlimitedStorage` | Notes are kept indefinitely and can grow beyond the default storage quota; without it, saving could fail and the user could lose notes. |
| `alarms` | Runs the optional automatic backup at the interval the user chooses (every minute, hour, day, week or month), even when no new tab is open. |
| `downloads` | Saves the optional automatic backup as a JSON file to the user's Downloads/draftab-backups/ folder, without opening a save dialog every time. |

**Remote code:** No, I am not using remote code. (All code is bundled in the package.)

**Data usage:** check none of the data categories — Draftab collects no user data. Then certify all three statements:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/ramonk2o/draftab/blob/main/PRIVACY.md

## Distribution

- **Visibility:** Public
- **Regions:** All regions

## Submitting, step by step

1. **Before submitting:** push the repository to GitHub (the privacy policy URL must be public) and run `npm run zip`.
2. **Developer account:** go to <https://chrome.google.com/webstore/devconsole>, sign in with your Google account, accept the agreement and pay the one-time US$ 5 registration fee. Verify the contact email the dashboard asks for.
3. **New item:** click **New item** and upload `draftab-1.1.0.zip`.
4. **Store listing tab:**
   - Description: paste the English description above.
   - Category and language: as in "Other listing fields".
   - Graphic assets: upload the store icon, the 5 screenshots and the small promo tile from `docs/store/en/`.
   - Homepage and support URLs: as in "Other listing fields".
   - Add the Portuguese (Brazil) localization: paste the pt-BR description and upload the screenshots and promo tile from `docs/store/pt-BR/`.
5. **Privacy tab:** paste the single purpose, the four permission justifications, answer "No" to remote code, leave every data category unchecked, check the three certifications and paste the privacy policy URL.
6. **Distribution tab:** Public, all regions.
7. **Submit for review.** Reviews usually take from a few days to a few weeks; the dashboard emails you when it's done.
