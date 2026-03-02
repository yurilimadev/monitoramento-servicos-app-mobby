# Monitoramento - APP Mobby - Regras de Negócio

Este documento descreve as regras de negócio e o funcionamento do aplicativo interno de Monitoramento - APP Mobby.

## Visão Geral

O aplicativo tem como objetivo monitorar dados transacionais do APP Mobby, permitindo filtrar, atualizar e visualizar informações relevantes.

## Regras de Negócio

1.  **Filtragem de Dados:**

    *   Os dados podem ser filtrados por:
        *   `Secretaria`: Permite selecionar uma secretaria específica.
        *   `Agrupamento`: Permite selecionar um agrupamento dentro da secretaria.
        *   `Responsável`: Permite filtrar por um responsável específico.
        *   `Data`: Permite filtrar por uma data específica.
    *   A filtragem é realizada tanto na interface desktop quanto mobile.

2.  **Atualização de Dados:**

    *   A atualização de dados é feita através de um formulário dinâmico.
    *   O formulário é carregado após a seleção de uma secretaria e um agrupamento.
    *   Os campos a serem preenchidos incluem:
        *   `Aberto`: Número de serviços abertos.
        *   `Andamento`: Número de serviços em andamento.
        *   `Encerrado`: Número de serviços encerrados.
        *   `Observação`: Observações adicionais sobre o serviço.
    *   A data de atualização e o responsável são campos obrigatórios no formulário.

## Fluxo de Trabalho

1.  O usuário seleciona a `Secretaria` e o `Agrupamento`.
2.  O sistema carrega dinamicamente os serviços relacionados.
3.  O usuário preenche os dados de monitoramento (Aberto, Andamento, Encerrado, Observação).
4.  O usuário preenche o `Responsável` e a `Data de Atualização`.
5.  O usuário clica em "Atualizar" para salvar os dados no banco de dados.

---

## Documentação Técnica

Esta seção destina-se à equipe de TI para manutenção e evolução do sistema.

### Stack Tecnológico

*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+).
*   **Framework CSS:** Bootstrap 5.3 (via CDN).
*   **Ícones:** Bootstrap Icons (via CDN).
*   **Fontes:** Google Fonts (Família "Nunito").

### Bibliotecas e Dependências

1.  **PapaParse (v5.3.2):**
    *   Utilizada para processar (parse) arquivos CSV.
    *   O sistema consome dados do Google Sheets no formato CSV e utiliza o PapaParse para converter esses dados em objetos JavaScript manipuláveis para a renderização da tabela e dos selects.

2.  **Flatpickr:**
    *   Utilizada para os campos de seleção de data (`input[name="data"]`).
    *   Garante que o formato da data seja enviado consistentemente como `DD/MM/AAAA` e fornece localização em PT-BR.

### Integrações e APIs

*   **Google Sheets API (Visualização/Leitura):**
    *   Utiliza o endpoint `/gviz/tq?tqx=out:csv` do Google Sheets para obter os dados de forma pública e rápida para leitura.
    *   Localização: `visao-geral-dados.html` e `teste-google-sheets.html`.

*   **SheetDB (Escrita/Gravação):**
    *   Utiliza a API SheetDB.io para realizar operações de `POST` (inserção de novas linhas) na planilha.
    *   Localização: `update.js`.

### Estrutura de Arquivos Principais

*   `index.html`: Página principal contendo o formulário de atualização de dados.
*   `visao-geral-dados.html`: Dashboard para visualização, filtragem e paginação dos dados já registrados.
*   `update.js`: Contém a lógica de carregamento dinâmico do formulário, validação de inputs e comunicação com a API SheetDB.
*   `style.css`: Estilizações personalizadas e overrides do Bootstrap.