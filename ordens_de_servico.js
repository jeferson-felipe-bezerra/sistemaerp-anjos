let db;

        // Inicializando o IndexedDB
        const request = indexedDB.open('ordensDeServicoDB', 1);

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains('ordens')) {
                db.createObjectStore('ordens', { keyPath: 'id', autoIncrement: true });
            }
            console.log('IndexedDB: banco de dados criado ou atualizado.');
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('IndexedDB: banco de dados aberto com sucesso.');
            carregarOrdens(); // Carrega ordens existentes no IndexedDB
        };

        request.onerror = function(event) {
            console.error('Erro ao abrir o banco de dados IndexedDB:', event.target.errorCode);
            alert('Erro ao abrir o banco de dados: ' + event.target.errorCode);
        };

        // Função para salvar a ordem de serviço
        function salvarOrdemServico(event) {
            event.preventDefault();

            const ordemServico = {
                numero: 'ORD' + new Date().getTime(),
                dataOrdem: document.getElementById('dataOrdem').value,
                nomeCliente: document.getElementById('nomeCliente').value,
                telefone: document.getElementById('telefone').value,
                email: document.getElementById('email').value,
                tipoServico: document.getElementById('tipoServico').value,
                descricaoServico: document.getElementById('descricaoServico').value,
                status: document.getElementById('status').value,
                dataAgendamento: document.getElementById('dataAgendamento').value,
                horaAgendamento: document.getElementById('horaAgendamento').value
            };

            const transaction = db.transaction(['ordens'], 'readwrite');
            const objectStore = transaction.objectStore('ordens');
            const request = objectStore.add(ordemServico);

            request.onsuccess = function() {
                alert('Ordem de serviço salva com sucesso!');
                carregarOrdens(); // Recarrega a tabela após salvar
                document.getElementById('ordemServicoForm').reset();
            };

            request.onerror = function(event) {
                console.error('Erro ao salvar a ordem de serviço:', event.target.errorCode);
                alert('Erro ao salvar a ordem de serviço: ' + event.target.errorCode);
            };
        }

        // Função para carregar as ordens de serviço existentes
        function carregarOrdens() {
            if (!db) {
                console.error('Banco de dados não está aberto!');
                alert('Erro ao carregar ordens: banco de dados não está aberto.');
                return;
            }

            const tabelaBody = document.querySelector('tbody');
            tabelaBody.innerHTML = ''; // Limpa a tabela

            const transaction = db.transaction(['ordens'], 'readonly');
            const objectStore = transaction.objectStore('ordens');
            const request = objectStore.openCursor();

            request.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    adicionarOrdemNaTabela(cursor.value);
                    cursor.continue();
                } else {
                    console.log('Todas as ordens de serviço foram carregadas.');
                }
            };

            request.onerror = function(event) {
                console.error('Erro ao carregar ordens:', event.target.errorCode);
                alert('Erro ao carregar ordens: ' + event.target.errorCode);
            };
        }

        // Função para adicionar uma ordem de serviço na tabela HTML
        function adicionarOrdemNaTabela(ordem) {
            const tabelaBody = document.querySelector('tbody');
            const novaLinha = tabelaBody.insertRow();

            novaLinha.innerHTML = `
                <td>${ordem.numero}</td>
                <td>${ordem.nomeCliente}</td>
                <td>${ordem.tipoServico}</td>
                <td>${ordem.status}</td>
                <td>${ordem.dataOrdem}</td>
                <td>
                    <button onclick="editarOrdem(${ordem.id})">Editar</button>
                    <button onclick="excluirOrdem(${ordem.id})">Excluir</button>
                    <button onclick="imprimirOrdem(${ordem.id})">Imprimir</button>
                </td>
            `;
        }

        // Função para excluir uma ordem de serviço
        function excluirOrdem(id) {
            const transaction = db.transaction(['ordens'], 'readwrite');
            const objectStore = transaction.objectStore('ordens');
            const request = objectStore.delete(id);

            request.onsuccess = function() {
                alert('Ordem de serviço excluída com sucesso!');
                carregarOrdens();
            };

            request.onerror = function(event) {
                console.error('Erro ao excluir ordem de serviço:', event.target.errorCode);
                alert('Erro ao excluir ordem de serviço: ' + event.target.errorCode);
            };
        }

        // Função para imprimir uma ordem de serviço
        function imprimirOrdem(id) {
            const transaction = db.transaction(['ordens'], 'readonly');
            const objectStore = transaction.objectStore('ordens');
            const request = objectStore.get(id);
        
            request.onsuccess = function(event) {
                const ordem = event.target.result;
        
                // Função para formatar a data
                function formatarData(dataString) {
                    const data = new Date(dataString);
                    return data.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
        
                const conteudo = `
                    <html>
                        <head>
                            <title>Ordem de Serviço #${ordem.numero}</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    margin: 20px;
                                    padding: 0;
                                    color: #333;
                                }
                                h1 {
                                    text-align: center;
                                    color: #2c3e50;
                                }
                                p {
                                    font-size: 14px;
                                    line-height: 1.6;
                                    margin: 10px 0;
                                }
                                .container {
                                    border: 1px solid #ccc;
                                    border-radius: 5px;
                                    padding: 20px;
                                    background-color: #f9f9f9;
                                }
                                .header {
                                    margin-bottom: 20px;
                                    text-align: center;
                                }
                                .footer {
                                    margin-top: 20px;
                                    text-align: center;
                                    font-size: 12px;
                                    color: #777;
                                }
                                .status {
                                    font-weight: bold;
                                    color: ${ordem.status === 'Concluída' ? 'green' : 'red'};
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>Ordem de Serviço #${ordem.numero}</h1>
                                <div class="header">
                                    <p><strong>Data da Ordem:</strong> ${formatarData(ordem.dataOrdem)}</p>
                                    <p><strong>Cliente:</strong> ${ordem.nomeCliente}</p>
                                    <p><strong>Telefone:</strong> ${ordem.telefone}</p>
                                    <p><strong>E-mail:</strong> ${ordem.email}</p>
                                </div>
                                <p><strong>Tipo de Serviço:</strong> ${ordem.tipoServico}</p>
                                <p><strong>Descrição:</strong> ${ordem.descricaoServico}</p>
                                <p><strong>Status:</strong> <span class="status">${ordem.status}</span></p>
                                <p><strong>Data de Agendamento:</strong> ${formatarData(ordem.dataAgendamento)}</p>
                                <p><strong>Hora de Agendamento:</strong> ${ordem.horaAgendamento}</p>
                                <div class="footer">
                                    <p>Obrigado por escolher nossos serviços!</p>
                                </div>
                            </div>
                        </body>
                    </html>
                `;
        
                const novaJanela = window.open('', '_blank');
                novaJanela.document.write(conteudo);
                novaJanela.document.close();
                novaJanela.print();
            };
        
            request.onerror = function(event) {
                console.error('Erro ao buscar ordem para impressão:', event.target.errorCode);
                alert('Erro ao buscar ordem para impressão: ' + event.target.errorCode);
            };
        }
        
        // Evento de submissão do formulário
        document.getElementById('ordemServicoForm').addEventListener('submit', salvarOrdemServico);