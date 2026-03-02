document.addEventListener('DOMContentLoaded', function() {
    // Configurações carregadas do config.js
    
    // Verificação de Segurança: Se o config.js falhar, para tudo e avisa.
    if (typeof AppConfig === 'undefined') {
        console.error("ERRO CRÍTICO: O arquivo config.js não foi carregado. Verifique se a Secret SHEETDB_API_URL está configurada no GitHub e se o deploy incluiu o arquivo.");
        alert("Erro de configuração: Não foi possível carregar as chaves de acesso. Consulte o console.");
        return;
    }

    const API_URL = AppConfig.API_URL;
    const CSV_REFERENCE_URL = AppConfig.CSV_REFERENCE_URL;
    let referenceData = [];

    // --- Seletores de Elementos ---

    // Seção de Filtros
    const secretariaSelect = document.getElementById('filtro-secretaria');
    const agrupamentoSelect = document.getElementById('filtro-agrupamento');
    const filterButton = document.getElementById('btn-filtrar');

    // Seção de Cabeçalho do Conteúdo
    const responsavelInput = document.querySelector('input[name="responsavel"]');
    const dataAtualizacaoInput = document.querySelector('input[name="data-atualizacao"]');

    // Seção de Display
    const displaySecretaria = document.getElementById('display-secretaria');
    const displayAgrupamento = document.getElementById('display-agrupamento');
    const dynamicContentWrapper = document.getElementById('dynamic-content-wrapper');

    // Botão de Ação
    const updateButton = document.querySelector('button[type="submit"]');
    const updateForm = document.getElementById('form-update');

    // --- Inicializações ---

    // 1. Carregar dados de referência do CSV
    Papa.parse(CSV_REFERENCE_URL, {
        download: true,
        header: true,
        complete: function(results) {
            // Filtra linhas vazias e armazena os dados
            referenceData = results.data.filter(item => item.secretaria && item.secretaria.trim() !== '');
            populateSecretarias(referenceData);
        },
        error: function(err) {
            console.error("Erro ao carregar o arquivo CSV de referência:", err);
            secretariaSelect.innerHTML = '<option disabled selected>Erro ao carregar</option>';
        }
    });

    // Inicializa o Flatpickr no campo de data
    flatpickr(dataAtualizacaoInput, {
        locale: "pt", // Define o idioma para português
        dateFormat: "d/m/Y", // Formato da data amigável
        allowInput: true, // Permite que o campo seja editável, ativando a validação 'required' nativa
    });

    // --- Funções ---

    function populateSecretarias(data) {
        const secretarias = [...new Set(data.map(item => item.secretaria))].sort();
        secretariaSelect.innerHTML = '<option selected disabled>Selecione...</option>';
        secretarias.forEach(sec => {
            const option = document.createElement('option');
            option.value = sec;
            option.textContent = sec;
            secretariaSelect.appendChild(option);
        });
    }

    function renderDynamicForm(services) {
        dynamicContentWrapper.innerHTML = ''; // Limpa conteúdo anterior

        if (services.length === 0) {
            dynamicContentWrapper.innerHTML = '<p class="text-center text-muted">Nenhum serviço encontrado para esta seleção.</p>';
            return;
        }

        services.forEach((service, index) => {
            const serviceHTML = `
                <div class="p-3 border rounded shadow-sm service-entry overflow-hidden">
                    <!-- Dados ocultos para referência no envio -->
                    <input type="hidden" class="service-name" value="${service.serviço}">
                    <input type="hidden" class="service-subcategory" value="${service.subcategoria}">

                    <div class="row g-2">
                        <div class="col-12 col-md-6">
                            <label class="form-label fw-bold small">Serviço</label>
                            <p class="form-control-plaintext bg-light p-2 rounded text-truncate">${service.serviço}</p>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label fw-bold small">Subcategoria</label>
                            <p class="form-control-plaintext bg-light p-2 rounded text-truncate">${service.subcategoria}</p>
                        </div>
                    </div>
                    <div class="row g-2 mt-1">
                        <div class="col-4">
                            <label for="aberto_${index}" class="form-label fw-bold small">Aberto</label>
                            <input type="number" class="form-control data-input-aberto" id="aberto_${index}" placeholder="0" min="0" required>
                        </div>
                        <div class="col-4">
                            <label for="em_andamento_${index}" class="form-label fw-bold small">Andamento</label>
                            <input type="number" class="form-control data-input-andamento" id="em_andamento_${index}" placeholder="0" min="0" required>
                        </div>
                        <div class="col-4">
                            <label for="encerrado_${index}" class="form-label fw-bold small">Encerrado</label>
                            <input type="number" class="form-control data-input-encerrado" id="encerrado_${index}" placeholder="0" min="0" required>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-12">
                            <label for="observacao_${index}" class="form-label small">Observação</label>
                            <textarea class="form-control data-input-observacao" id="observacao_${index}" rows="2" required></textarea>
                        </div>
                    </div>
                </div>
            `;
            dynamicContentWrapper.innerHTML += serviceHTML;
        });
    }

    // --- Event Listeners ---

    // 1. Seleção de Secretaria (para popular agrupamentos)
    secretariaSelect.addEventListener('change', () => {
        const selectedSecretaria = secretariaSelect.value;
        const agrupamentos = [...new Set(
            referenceData
                .filter(item => item.secretaria === selectedSecretaria)
                .map(item => item.nome_agrupamento)
        )].sort();

        agrupamentoSelect.innerHTML = '<option selected disabled>Selecione...</option>';
        agrupamentos.forEach(agrup => {
            const option = document.createElement('option');
            option.value = agrup;
            option.textContent = agrup;
            agrupamentoSelect.appendChild(option);
        });
        agrupamentoSelect.disabled = false;
    });

    // 2. Botão "Filtrar"
    if (filterButton) {
        filterButton.addEventListener('click', function() {
            const selectedSecretaria = secretariaSelect.value;
            const selectedAgrupamento = agrupamentoSelect.value;

            if (!selectedSecretaria || selectedSecretaria === 'Selecione...' || !selectedAgrupamento || selectedAgrupamento === 'Selecione...') {
                alert('Por favor, selecione uma Secretaria e um Agrupamento.');
                return;
            }

            // Atualiza os cabeçalhos de display
            displaySecretaria.textContent = selectedSecretaria;
            displayAgrupamento.textContent = selectedAgrupamento;

            // Filtra os dados para encontrar os serviços correspondentes
            const servicesToRender = referenceData.filter(item =>
                item.secretaria === selectedSecretaria && item.nome_agrupamento === selectedAgrupamento
            );

            // Renderiza o formulário dinâmico
            renderDynamicForm(servicesToRender);
        });
    }

    // 3. Botão "Atualizar"
    if (updateForm) {
        updateForm.addEventListener('submit', function(event) {
            // Verifica se o formulário é válido (respeita os atributos 'required')
            if (!updateForm.checkValidity()) {
                event.preventDefault();
                updateForm.reportValidity(); // Mostra os erros nativos do navegador
                return;
            }

            // Validação manual para o campo de Data
            // O Flatpickr adiciona 'readonly' ao input, o que faz o navegador ignorar o atributo 'required' nativo
            if (!dataAtualizacaoInput.value) {
                event.preventDefault();
                alert('Por favor, preencha o campo "Data Atualização".');
                return;
            }

            event.preventDefault(); // Impede o envio padrão do formulário (reload)

            const allEntries = document.querySelectorAll('.service-entry');
            if (allEntries.length === 0) {
                alert('Filtre e carregue os serviços antes de atualizar.');
                return;
            }

            const dataToSend = [];
            const responsavel = responsavelInput.value;
            const dataAtualizacao = dataAtualizacaoInput.value;

            allEntries.forEach(entry => {
                const rowData = {
                    "dia_da_atualizacao": dataAtualizacao,
                    "secretaria": displaySecretaria.textContent,
                    "nome_agrupamento": displayAgrupamento.textContent,
                    "serviço": entry.querySelector('.service-name').value,
                    "subcategoria": entry.querySelector('.service-subcategory').value,
                    "aberto": entry.querySelector('.data-input-aberto').value || '0',
                    "em andamento": entry.querySelector('.data-input-andamento').value || '0',
                    "encerrado": entry.querySelector('.data-input-encerrado').value || '0',
                    "responsavel": responsavel,
                    "observacao": entry.querySelector('.data-input-observacao').value || ''
                };
                dataToSend.push(rowData);
            });

            // Debug no console
            console.log("--- Botão ATUALIZAR Clicado ---");
            console.log("Informações para Atualização:", dataToSend);

            // Envia os dados para a API (SheetDB)
            updateButton.disabled = true; // Evita duplo clique
            updateButton.innerText = "Enviando...";

            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: dataToSend }) // Envia um array de objetos
            })
            .then(response => response.json())
            .then(data => {
                console.log('Sucesso:', data);
                alert('Dados salvos com sucesso!');
                // Opcional: Limpar formulário após o sucesso
                updateButton.disabled = false;
                updateButton.innerText = "Atualizar";
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao salvar dados.');
                updateButton.disabled = false;
                updateButton.innerText = "Atualizar";
            });
        });
    }
});