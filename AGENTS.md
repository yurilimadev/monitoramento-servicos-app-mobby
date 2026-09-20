# AGENTS.md — MobView

## Stack

Vue 3 (JS) + Vite + Vue Router (hash history) + Pinia.
Bootstrap 5.3, Flatpickr (+ locale pt), PapaParse e Chart.js — todos via CDN no `index.html`.

## Commands

```bash
npm run dev      # dev server (Vite)
npm run build    # produz dist/
npm run preview  # serve dist/ localmente
```

Não há testes, linter nem typecheck configurados. Build é a única verificação automatizada.
Variáveis `VITE_*` vêm de `.env.production` (criado pelo CI no deploy) ou `.env.local` em dev — localmente o app grava/leve falha se estiverem ausentes.

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
    DataTable.vue       # tabela com paginação (20 itens/página)
    LineChart.vue       # gráfico de linha (Chart.js) — usado só em OverviewPage
    BarChart.vue        # gráfico de barras (Chart.js) — usado só em OverviewPage
  views/
    UpdatePage.vue      # rota / (FilterPanel + UpdateForm)
    OverviewPage.vue    # rota /visao-geral (FilterPanel + DataTable + BarChart + LineChart)
```

## Fluxo de dados

- **Leitura referência**: CSV local (raiz: `dados_transacoes_entrada_manual - referencia_servicos.csv`) → PapaParse → FilterPanel (popula selects)
- **Leitura planilha**: Google Sheets API v4 (`GET .../values/{range}?key={API_KEY}`); aba definida por `VITE_SHEETS_RANGE` (default `transacoes`); aba de referência fixa em `src/config.js` (`referencia_servicos`)
- **Escrita**: POST para Google Apps Script Web App (upsert por `codigo_unico`). O Apps Script casa as chaves do payload com os headers da aba; chave sem correspondência é **ignorada silenciosamente** (grava vazio). Header real da aba `transacoes` é **`em andamento`** (normaliza para `em_andamento`) — payload deve enviar `em_andamento`, nunca `andamento` (regressão histórica de 08/2026).
- **Hash único**: SHA-256 gerado via `crypto.subtle.digest` (quando não existe `codigo_unico` salvo)

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`):
- Cria `.env.production` com secrets do GitHub → `npm ci` → `npm run build` → deploy da `dist/` para branch `gh-pages`
- Apenas push em `main` aciona deploy
- Base URL: `/monitoramento-servicos-app-mobby/` (em `vite.config.js`) — URLs internas devem respeitar hash routing por isso

## Env vars

| Vite env | Finalidade |
|---|---|
| `VITE_SHEETS_API_KEY` | Chave da Google Sheets API v4 (secret GitHub: `SHEETS_API_KEY`) |
| `VITE_SPREADSHEET_ID` | ID da planilha (secret: `SPREADSHEET_ID`) |
| `VITE_SHEETS_RANGE` | Aba de leitura (secret-free; CI fixa `transacoes`) |
| `VITE_APPS_SCRIPT_URL` | URL do Web App do Google Apps Script (secret: `APPS_SCRIPT_URL`) |

## Branch & PR

- **Nunca commitar diretamente em `main`**: push em `main` dispara deploy automático para GitHub Pages. Todo trabalho vai em branch `feat/*` ou `fix/*`, com PR → `main` (deploy só acontece no merge).
- **Commit por artefato**: um commit por arquivo/escopo (ex.: componente alterado, docs). Prefixos usados no repo: `feat:`, `fix:`, `docs:`.
- Branch legado `refactor/vue` já mergeado.
