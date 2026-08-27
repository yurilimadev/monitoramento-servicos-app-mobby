# AGENTS.md — monitoramento-servicos-app-mobby

## Stack

Vue 3 (JS) + Vite + Vue Router (hash history) + Pinia.
Bootstrap 5.3, Flatpickr, PapaParse — todos via CDN no `index.html`.

## Commands

```bash
npm run dev      # dev server (Vite)
npm run build    # produz dist/
npm run preview  # serve dist/ localmente
```

## Estrutura

```
src/
  config.js             # lê import.meta.env.VITE_* (injetado no build)
  services/
    csvParser.js        # PapaParse + normalizar() helper
    sheetApi.js         # GET Google Sheets API v4 (leitura)
    sheetWriter.js      # POST Google Apps Script (escrita/upsert)
  stores/
    monitorStore.js     # Pinia: estado global (secretaria, agrupamento, dados)
  components/
    AppHeader.vue       # navegação (router-link)
    FilterPanel.vue     # selects + data + botão Filtrar
    ServiceCard.vue     # formulário individual (aberto/andamento/encerrado/obs)
    UpdateForm.vue      # container de ServiceCards + "Puxar dados" + "Atualizar"
    DataTable.vue       # tabela com paginação (20 items/página)
  views/
    UpdatePage.vue      # rota / (FilterPanel + UpdateForm)
    OverviewPage.vue    # rota /visao-geral (FilterPanel + DataTable)
```

## Fluxo de dados

- **Leitura referência**: Google Sheets API v4 (`GET .../values/{range}?key={API_KEY}`) → FilterPanel (popula selects)
- **Leitura planilha**: Google Sheets API v4 (`GET .../values/{range}?key={API_KEY}`)
- **Escrita**: POST para Google Apps Script Web App (upsert por `codigo_unico`)
- **Hash único**: SHA-256 gerado via `crypto.subtle.digest` (quando não existe `codigo_unico` salvo)

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`):
- Cria `.env.production` com secrets do GitHub → `npm run build` → deploy da `dist/` para `gh-pages`
- Branch `main` aciona deploy automático

## Secrets do GitHub necessários

| Secret | Finalidade |
|---|---|
| `SHEETS_API_KEY` | Chave da Google Sheets API v4 |
| `APPS_SCRIPT_URL` | URL do Web App do Google Apps Script |
| `SPREADSHEET_ID` | ID da planilha Google Sheets |

## Branch & PR

- Trabalho ativo em `refactor/vue`
- PRs de `refactor/vue` → `main`
- `template/public` — branch pública derivada de `main` com dados sanitizados para open source
  - Merge de `main` → `template/public` para sincronizar novidades
  - Ver `README_DEV.md` para instruções de merge
- Não há testes automatizados nem linter configurado