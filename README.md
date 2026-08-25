# Monitoramento - APP Mobby

![Banner](gemini-banner-git.png)

Aplicativo interno para monitoramento de dados transacionais do APP Mobby, permitindo filtrar, atualizar e visualizar informações de serviços por secretaria e agrupamento.

## Funcionalidades

- **Atualizar Dados** — Formulário dinâmico com accordion para preencher métricas (Aberto, Andamento, Encerrado, Observação) por serviço, com upsert automático na planilha.
- **Visão Geral** — Tabela paginada com filtros por Secretaria, Agrupamento, Data e Serviço, alimentada pela Google Sheets API.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Vue 3 (Composition API, JS) |
| Build | Vite |
| Roteamento | Vue Router (hash history) |
| Estado | Pinia |
| Estilo | Bootstrap 5.3 + Bootstrap Icons (via CDN) |
| Data | Flatpickr (via CDN) |
| CSV | PapaParse (via CDN) |

## Fluxo de Dados

```
CSV de referência (local) ──PapaParse──→ FilterPanel (popula selects)
                                                 ↓
Google Sheets API v4 (GET) ──API Key──→ OverviewPage / "Puxar dados salvos"
                                                 ↓
Google Apps Script (POST)  ──upsert──→ Planilha (escrita)
```

- **Leitura de referência:** CSV local com PapaParse → popula selects de Secretaria, Agrupamento e Responsável.
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
    csvParser.js        # PapaParse + normalizar()
    sheetApi.js         # Leitura via Google Sheets API v4
    sheetWriter.js      # Escrita via Apps Script
  stores/
    monitorStore.js     # Pinia (estado global)
  components/
    AppHeader.vue       # Navegação
    FilterPanel.vue     # Filtros (Secretaria, Agrupamento, Data, Serviço)
    ServiceCard.vue     # Formulário de serviço
    UpdateForm.vue      # Accordion + formulário de atualização
    DataTable.vue       # Tabela paginada
  views/
    UpdatePage.vue      # Rota / (atualização)
    OverviewPage.vue    # Rota /visao-geral (visualização)
```

## Configuração local

Crie um arquivo `.env` na raiz (não versionado):

```env
VITE_SHEETS_API_KEY=SUA_CHAVE
VITE_SPREADSHEET_ID=ID_DA_PLANILHA
VITE_SHEETS_RANGE=nome_da_aba
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
```

## Planilha de dados

A planilha Google Sheets utilizada como fonte de dados pode ser acessada internamente em:

[https://docs.google.com/spreadsheets/d/1Delbh5o2f6cX9lH1WFRFJ3Kic131BXUKm4ng3oOIK2I/](https://docs.google.com/spreadsheets/d/1Delbh5o2f6cX9lH1WFRFJ3Kic131BXUKm4ng3oOIK2I/)

## Versão

v2.0.0 — Refatoração para Vue 3. Substituído SheetDB por Google Sheets API v4 + Apps Script.