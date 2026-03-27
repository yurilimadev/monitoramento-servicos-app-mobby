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
    const responsavelInput = document.getElementById('filtro-responsavel');
    const dataAtualizacaoInput = document.querySelector('input[name="data-atualizacao"]');

    // Seção de Display
    const displaySecretaria = document.getElementById('display-secretaria');
    const displayAgrupamento = document.getElementById('display-agrupamento');
    const dynamicContentWrapper = document.getElementById('dynamic-content-wrapper');

    // Botão de Ação
    const updateButton = document.querySelector('button[type="submit"]');
    const updateForm = document.getElementById('form-update');

    // Botão de Carregar Dados
    const btnCarregarDados = document.getElementById('btn-carregar-dados');

    // --- Inicializações ---

    // 1. Carregar dados de referência do CSV
    Papa.parse(CSV_REFERENCE_URL, {
        download: true,
        header: true,
        complete: function(results) {
            // Filtra linhas vazias e armazena os dados
            referenceData = results.data.filter(item => item.secretaria && item.secretaria.trim() !== '');
            populateSecretarias(referenceData);
            populateResponsaveis(referenceData);
        },
        error: function(err) {
            console.error("Erro ao carregar o arquivo CSV de referência:", err);
            secretariaSelect.innerHTML = '<option disabled selected>Erro ao carregar</option>';
            responsavelInput.innerHTML = '<option disabled selected>Erro ao carregar</option>';
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

    function populateResponsaveis(data) {
        // Assumindo que o CSV de referência contém uma coluna 'responsavel'
        const responsaveis = [...new Set(
            data
                .map(item => item.responsavel)
                .filter(resp => resp && resp.trim() !== '') // Filtra valores nulos ou vazios
        )].sort();

        responsavelInput.innerHTML = '<option value="" selected disabled>Selecione...</option>';
        responsaveis.forEach(resp => {
            const option = document.createElement('option');
            option.value = resp;
            option.textContent = resp;
            responsavelInput.appendChild(option);
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
                    <input type="hidden" class="codigo-unico-input" value="">

                    <div class="row g-2">
                        <div class="col-12">
                            <label class="form-label fw-bold small">Serviço</label>
                            <p class="form-control-plaintext bg-light p-2 rounded text-truncate">${service.serviço}</p>
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
                            <textarea class="form-control data-input-observacao" id="observacao_${index}" rows="2"></textarea>
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
            const rawServices = referenceData.filter(item =>
                item.secretaria === selectedSecretaria && item.nome_agrupamento === selectedAgrupamento
            );

            // Remove duplicatas de serviços (caso existam múltiplas subcategorias para o mesmo serviço)
            const servicesToRender = [];
            const seenServices = new Set();

            rawServices.forEach(item => {
                if (!seenServices.has(item.serviço)) {
                    seenServices.add(item.serviço);
                    servicesToRender.push(item);
                }
            });

            // Renderiza o formulário dinâmico
            renderDynamicForm(servicesToRender);

            // Mostra o botão de puxar dados assim que os formulários aparecerem
            if (btnCarregarDados) {
                btnCarregarDados.classList.remove('d-none');
            }
        });
    }

    // 2.5 Botão "Puxar Dados Salvos"
    if (btnCarregarDados) {
        btnCarregarDados.addEventListener('click', function() {
            const dataSelecionada = dataAtualizacaoInput.value;
            const secretariaSelecionada = displaySecretaria.textContent;
            const agrupamentoSelecionado = displayAgrupamento.textContent;
            
            if (!dataSelecionada) {
                alert('Por favor, selecione a "Data Atualização" primeiro para buscar os dados daquele dia.');
                return;
            }
            
            btnCarregarDados.innerText = "Buscando...";
            btnCarregarDados.disabled = true;
            
            // Utilizamos a mesma URL pública do Visão Geral para checar os dados
            // Adiciona um parâmetro de timestamp para evitar o cache do Google Sheets e garantir dados frescos.
            const URL_PLANILHA = `https://docs.google.com/spreadsheets/d/1Delbh5o2f6cX9lH1WFRFJ3Kic131BXUKm4ng3oOIK2I/gviz/tq?tqx=out:csv&gid=0&t=${new Date().getTime()}`;

            Papa.parse(URL_PLANILHA, {
                download: true,
                header: true,
                complete: function(resultados) {
                    const dados = resultados.data;
                    console.log("Todos os dados puxados da planilha:", dados);
                    const allEntries = document.querySelectorAll('.service-entry');
                    let dadosEncontrados = 0;
                    
                    allEntries.forEach(entry => {
                        const servicoNome = entry.querySelector('.service-name').value;
                        
                        const registro = dados.find(linha => {
                            const normalizar = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                            const chaves = Object.keys(linha);
                            const getVal = (keyword) => linha[chaves.find(c => normalizar(c).includes(keyword))] || '';
                            
                            const valSecretaria = getVal('secretaria');
                            const valAgrupamento = getVal('agrupamento');
                            const valServico = getVal('servico');
                            let valData = getVal('dia') || getVal('data');
                            
                            // Tratamento de Data para comparar "DD/MM/AAAA" do Flatpickr com formatos do Sheets
                            let dataMatch = false;
                            if (valData) {
                                const vData = valData.split(' ')[0]; // Remove horas se houver
                                if (vData === dataSelecionada) {
                                    dataMatch = true;
                                } else if (vData.includes('-')) {
                                    const [ano, mes, dia] = vData.split('-');
                                    if (`${dia}/${mes}/${ano}` === dataSelecionada) dataMatch = true;
                                }
                            }
                            
                            return normalizar(valSecretaria) === normalizar(secretariaSelecionada) &&
                                   normalizar(valAgrupamento) === normalizar(agrupamentoSelecionado) &&
                                   normalizar(valServico) === normalizar(servicoNome) &&
                                   dataMatch;
                        });
                        
                        if (registro) {
                            console.log(`Registro compatível encontrado [${servicoNome}]:`, registro);
                            dadosEncontrados++;
                            const chaves = Object.keys(registro);
                            const normalizar = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                            const getVal = (keyword) => registro[chaves.find(c => normalizar(c).includes(keyword))] || '';
                            
                            entry.querySelector('.data-input-aberto').value = getVal('aberto') || '0';
                            entry.querySelector('.data-input-andamento').value = getVal('andamento') || '0';
                            entry.querySelector('.data-input-encerrado').value = getVal('encerrado') || '0';
                            entry.querySelector('.data-input-observacao').value = getVal('observacao') || '';
                            entry.querySelector('.codigo-unico-input').value = getVal('codigo') || '';
                        }
                    });
                    
                    btnCarregarDados.innerHTML = '<i class="bi bi-cloud-download"></i> Puxar dados já salvos desta data';
                    btnCarregarDados.disabled = false;
                    
                    if (dadosEncontrados > 0) {
                        alert(`Foram encontrados e carregados ${dadosEncontrados} registros para a data ${dataSelecionada}!`);
                    } else {
                        alert('Nenhum dado prévio encontrado para esta Secretaria, Agrupamento e Data.');
                    }
                },
                error: function(err) {
                    console.error("Erro ao puxar dados:", err);
                    alert('Erro ao buscar dados na planilha.');
                    btnCarregarDados.innerHTML = '<i class="bi bi-cloud-download"></i> Puxar dados já salvos desta data';
                    btnCarregarDados.disabled = false;
                }
            });
        });
    }

    // Função auxiliar para gerar SHA-256 (para novos registros)
    async function gerarHashSHA256(mensagem) {
        const msgBuffer = new TextEncoder().encode(mensagem);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 3. Botão "Atualizar"
    if (updateForm) {
        updateForm.addEventListener('submit', async function(event) {
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
            const secretaria = displaySecretaria.textContent;
            const agrupamento = displayAgrupamento.textContent;

            updateButton.disabled = true; // Evita duplo clique antecipado
            updateButton.innerText = "Processando...";

            for (const entry of allEntries) {
                const servicoNome = entry.querySelector('.service-name').value;
                let codigoUnico = entry.querySelector('.codigo-unico-input').value;
                
                // Se o serviço não tem código salvo da planilha, gera um Hash virgem
                if (!codigoUnico) {
                    const tempString = String(dataAtualizacao) + String(secretaria) + String(agrupamento) + String(servicoNome);
                    codigoUnico = await gerarHashSHA256(tempString);
                }

                const rowData = {
                    "codigo_unico": codigoUnico,
                    "dia_da_atualizacao": dataAtualizacao,
                    "secretaria": secretaria,
                    "nome_agrupamento": agrupamento,
                    "serviço": servicoNome,
                    "aberto": entry.querySelector('.data-input-aberto').value || '0',
                    "em andamento": entry.querySelector('.data-input-andamento').value || '0',
                    "encerrado": entry.querySelector('.data-input-encerrado').value || '0',
                    "responsavel": responsavel,
                    "observacao": entry.querySelector('.data-input-observacao').value || ''
                };
                dataToSend.push(rowData);
            }

            // Debug no console
            console.log("--- Botão ATUALIZAR Clicado ---");
            console.log("Informações para Atualização:", dataToSend);

            // Envia os dados para a API (SheetDB)
            updateButton.innerText = "Enviando...";

            // Prepara o payload para a API, instruindo o SheetDB a ATUALIZAR
            // as linhas existentes em vez de criar novas.
            const payload = {
                data: dataToSend,
                "sheetdb-behaviour": "upsert",
                "sheetdb-search": {
                    "codigo_unico": "{{codigo_unico}}"
                }
            };

            fetch(API_URL, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Sucesso:', data);
                alert('Dados salvos com sucesso!');
                window.location.reload();
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