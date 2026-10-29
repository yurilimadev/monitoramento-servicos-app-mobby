# Monitoramento - APP Mobby

![Banner](gemini-banner-git.png)

![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Bootstrap 5.3](https://img.shields.io/badge/Bootstrap_5.3-7952B3?logo=bootstrap&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?logo=pinia&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chart.js&logoColor=white)
![Google Sheets API](https://img.shields.io/badge/Google_Sheets_API-34A853?logo=googlesheets&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?logo=githubpages&logoColor=white)

Aplicativo interno para monitoramento de dados transacionais do APP Mobby, permitindo filtrar, atualizar e visualizar informações de serviços por secretaria e agrupamento.

## Funcionalidades

- **Atualizar Dados** — Formulário dinâmico com accordion para preencher métricas (Aberto, Andamento, Encerrado, Observação) por serviço, com upsert automático na planilha.
- **Visão Geral** — Tabela paginada com ordenação por coluna, filtros por Secretaria, Agrupamento, Serviço (autocomplete) e Período (range de datas). Gráficos de barras e linhas lado a lado para análise de série histórica.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Vue 3 (Composition API, JS) |
| Build | Vite |
| Roteamento | Vue Router (hash history) |
| Estado | Pinia |
| Estilo | Bootstrap 5.3 + Bootstrap Icons (via CDN) |
| Data | Flatpickr (via CDN) |
| Gráficos | Chart.js (via CDN) |

## Fluxo de Dados

```
Google Sheets API v4 (GET) ── aba transacoes ──→ OverviewPage / "Puxar dados salvos"
                                                  ↓
Google Sheets API v4 (GET) ── aba referencia_servicos ──→ FilterPanel (popula selects)
                                                  ↓
Google Apps Script (POST)  ──upsert──→ Planilha (escrita)
```

- **Leitura de referência:** Google Sheets API → aba `referencia_servicos` → popula selects de Secretaria, Agrupamento e Responsável.
- **Leitura da planilha:** Google Sheets API v4 (`GET /v4/spreadsheets/{id}/values/{range}?key={API_KEY}`).
- **Escrita:** POST para Google Apps Script Web App, que faz upsert na planilha usando `codigo_unico` como chave (SHA-256 gerado via `crypto.subtle.digest`).

## Comandos

```bash
npm run dev      # Servidor de desenvolvimento (Vite)
npm run build    # Produz dist/ para deploy
npm run preview  # Serve dist/ localmente
```

## Requisitos para Deploy (GitHub Actions)

| Secret do GitHub | Finalidade |
|---|---|
| `SHEETS_API_KEY` | Chave da Google Sheets API v4 |
| `APPS_SCRIPT_URL` | URL do Web App do Google Apps Script |
| `SPREADSHEET_ID` | ID da planilha Google Sheets |

O deploy é automático via `main` → GitHub Pages (`gh-pages`). Base URL: `/monitoramento-servicos-app-mobby/`.

## Estrutura do Projeto

```
src/
  config.js             # Lê import.meta.env.VITE_*
  services/
    csvParser.js        # normalizar() helper (sem PapaParse)
    sheetApi.js         # Leitura via Google Sheets API v4
    sheetWriter.js      # Escrita via Apps Script
  stores/
    monitorStore.js     # Pinia (estado global)
  components/
    AppHeader.vue       # Navegação
    FilterPanel.vue     # Filtros (Secretaria, Agrupamento, Serviço, Período)
    ServiceCard.vue     # Formulário de serviço
    UpdateForm.vue      # Accordion + formulário de atualização
    DataTable.vue       # Tabela paginada com ordenação
    BarChart.vue        # Gráfico de barras (série histórica)
    LineChart.vue       # Gráfico de linhas (tendência)
  views/
    UpdatePage.vue      # Rota / (atualização)
    OverviewPage.vue    # Rota /visao-geral (visualização)
```

## Configuração local

Crie um arquivo `.env.local` na raiz (não versionado). O `.env` é usado apenas pelo pipeline ETL/SMTP:

```env
VITE_SHEETS_API_KEY=SUA_CHAVE
VITE_SPREADSHEET_ID=ID_DA_PLANILHA
VITE_SHEETS_RANGE=transacoes
VITE_REFERENCE_RANGE=referencia_servicos
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
```

## Planilha de dados

A planilha Google Sheets utilizada como fonte de dados (cópia recuperada em 10/2026) está em:

[https://docs.google.com/spreadsheets/d/18zcBi2PG2-8R8F6fOLHbXnAJGQwLgJC181_md4nOPjo/](https://docs.google.com/spreadsheets/d/18zcBi2PG2-8R8F6fOLHbXnAJGQwLgJC181_md4nOPjo/)

> A planilha precisa estar compartilhada como **“Qualquer pessoa com o link → Leitor”** para a leitura via API key.
> Enquanto não houver acesso ao domínio da prefeitura, a propriedade continua em conta individual.
> **Próximo passo recomendado:** mover para uma **Unidade compartilhada** do Workspace e adicionar ao menos 2 proprietários.

## Google Apps Script

O script responsável pela escrita/upsert dos dados está em:

[https://script.google.com/home/projects/1oO7I4WPvqclHC__6bs2HIzaUDKHZyyNjdsfNGmQaGLYC8WTrBqHHR41A/edit](https://script.google.com/home/projects/1oO7I4WPvqclHC__6bs2HIzaUDKHZyyNjdsfNGmQaGLYC8WTrBqHHR41A/edit)

- `AppScriptMonitoramento.gs` é a fonte versionada; `npm run apps-script:sync` copia para `Código.js` (arquivo enviado pelo clasp).
- O ID da planilha vem de **Script Properties** (`SPREADSHEET_ID`) e cai no `SPREADSHEET_ID_PADRAO` do código se a propriedade não existir.
- O `doGet` do Web App retorna um diagnóstico (`ok`, `spreadsheetId` e nomes/linhas das abas) sem expor dados.

## Backup e monitoramento

- **Health check diário** (`.github/workflows/healthcheck-planilha.yml`): valida leitura via Sheets API e escrita via Apps Script, gera CSVs de `transacoes`/`referencia_servicos`/`etl_protocolos` e publica como artifact (90 dias). Em falha, envia e-mail via SMTP.
- **Snapshot do ETL**: cada execução salva o payload em `backup/etl-AAAA-MM-DD.json` e publica como artifact.
- **Backup local**: baixe periodicamente o `.xlsx` da planilha e guarde fora do Drive (o repositório ignora `backup/` e `*.xlsx`).
- Artifacts do GitHub expiram; para retenção longa, copie para um repositório privado ou storage externo.

## Versão

v2.1.0 — Gráficos (barras + linhas), ordenação de colunas, intervalo de datas, dropdown de serviços, layout wide.