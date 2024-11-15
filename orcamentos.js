let db;
let idOrcamento = 1; // Inicializa o ID do orçamento com 1
const request = indexedDB.open('orcamentosDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('orcamentos', { keyPath: 'id' });
};

request.onsuccess = function(event) {
    db = event.target.result;
    carregarOrcamentos();
};

request.onerror = function(event) {
    console.error('Erro ao abrir IndexedDB:', event.target.error);
};

// Função para carregar os orçamentos do IndexedDB
function carregarOrcamentos() {
    const transaction = db.transaction(['orcamentos'], 'readonly');
    const objectStore = transaction.objectStore('orcamentos');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const orcamentos = event.target.result;
        orcamentos.forEach(adicionarOrcamentoNaTabela);
        if (orcamentos.length > 0) {
            idOrcamento = orcamentos[orcamentos.length - 1].id + 1; // Atualiza o ID para o próximo orçamento
        }
    };
}

// Função para adicionar um orçamento no IndexedDB
function salvarOrcamento() {
    const orcamento = {
        id: idOrcamento++, // Incrementa o ID para cada orçamento
        cliente: document.getElementById('cliente').value,
        dataOrcamento: document.getElementById('dataOrcamento').value,
        validade: document.getElementById('validade').value,
        descricao: document.getElementById('descricao').value,
        itens: [],
        formaPagamento: document.getElementById('formaPagamento').value,
        observacoes: document.getElementById('observacoes').value,
        total: parseFloat(document.getElementById('totalOrcamento').innerText)
    };

    // Adiciona os itens do orçamento
    const itens = document.querySelectorAll('#itensTabela tbody tr');
    itens.forEach(item => {
        const descricaoItem = item.querySelector('.descricaoItem').value;
        const quantidadeItem = item.querySelector('.quantidadeItem').value;
        const precoItem = item.querySelector('.precoItem').value;
        const subtotalItem = item.querySelector('.subtotalItem').value;
        orcamento.itens.push({ descricaoItem, quantidadeItem, precoItem, subtotalItem });
    });

    const transaction = db.transaction(['orcamentos'], 'readwrite');
    const objectStore = transaction.objectStore('orcamentos');
    const request = objectStore.add(orcamento); // Adiciona o orçamento ao IndexedDB

    request.onsuccess = function() {
        alert('Orçamento salvo com sucesso!');
        adicionarOrcamentoNaTabela(orcamento);
        document.getElementById('orcamentoForm').reset();
        calcularTotalOrcamento(); // Atualiza o total do orçamento após salvar
    };

    request.onerror = function(event) {
        console.error('Erro ao salvar orçamento:', event.target.error);
    };
}

// Função para adicionar um orçamento na tabela na tela
function adicionarOrcamentoNaTabela(orcamento) {
    const tabelaBody = document.getElementById('orcamentosTabela').getElementsByTagName('tbody')[0];
    const novaLinha = tabelaBody.insertRow();

    novaLinha.innerHTML = `
        <td>${orcamento.id}</td>
        <td>${orcamento.cliente}</td>
        <td>R$ ${orcamento.total.toFixed(2)}</td>
        <td>
            
            <button onclick="excluirOrcamento(${orcamento.id})">Excluir</button>
            <button onclick="imprimirOrcamento(${orcamento.id})">Imprimir</button>
        </td>
    `;
}

// Função para calcular o total do orçamento
function calcularTotalOrcamento() {
    const itens = document.querySelectorAll('#itensTabela tbody tr');
    let total = 0;

    itens.forEach(item => {
        const subtotalItem = parseFloat(item.querySelector('.subtotalItem').value) || 0;
        total += subtotalItem;
    });

    document.getElementById('totalOrcamento').innerText = total.toFixed(2);
}

// Função para calcular o subtotal do item
function calcularSubtotal(element) {
    const linha = element.closest('tr');
    const quantidade = parseFloat(linha.querySelector('.quantidadeItem').value) || 0;
    const preco = parseFloat(linha.querySelector('.precoItem').value) || 0;
    const subtotal = quantidade * preco;

    linha.querySelector('.subtotalItem').value = subtotal.toFixed(2);
    calcularTotalOrcamento(); // Atualiza o total do orçamento após calcular o subtotal
}

// Função para adicionar um item à tabela
function adicionarItem() {
    const novaLinha = `
        <tr>
            <td><input type="text" placeholder="Descrição" class="descricaoItem" required></td>
            <td><input type="number" class="quantidadeItem" value="1" min="1" oninput="calcularSubtotal(this)"></td>
            <td><input type="number" class="precoItem" value="0" min="0" step="0.01" oninput="calcularSubtotal(this)"></td>
            <td><input type="text" class="subtotalItem" value="0" readonly></td>
            <td><button type="button" onclick="removerItem(this)">Remover</button></td>
        </tr>
    `;
    document.querySelector('#itensTabela tbody').insertAdjacentHTML('beforeend', novaLinha);
}

// Função para remover um item da tabela
function removerItem(button) {
    const linha = button.closest('tr');
    linha.remove();
    calcularTotalOrcamento(); // Atualiza o total do orçamento após remover um item
}

// Função para editar um orçamento
function editarOrcamento(id) {
    const transaction = db.transaction(['orcamentos'], 'readonly');
    const objectStore = transaction.objectStore('orcamentos');
    const request = objectStore.get(id);

    request.onsuccess = function(event) {
        const orcamento = event.target.result;
        if (orcamento) {
            document.getElementById('cliente').value = orcamento.cliente;
            document.getElementById('dataOrcamento').value = orcamento.dataOrcamento;
            document.getElementById('validade').value = orcamento.validade;
            document.getElementById('descricao').value = orcamento.descricao;
            document.getElementById('formaPagamento').value = orcamento.formaPagamento;
            document.getElementById('observacoes').value = orcamento.observacoes;

            // Limpa os itens existentes
            document.getElementById('itensTabela').getElementsByTagName('tbody')[0].innerHTML = '';

            // Adiciona os itens ao formulário
            orcamento.itens.forEach(item => {
                adicionarItem();
                const linhas = document.querySelectorAll('#itensTabela tbody tr');
                const ultimaLinha = linhas[linhas.length - 1];
                ultimaLinha.querySelector('.descricaoItem').value = item.descricaoItem;
                ultimaLinha.querySelector('.quantidadeItem').value = item.quantidadeItem;
                ultimaLinha.querySelector('.precoItem').value = item.precoItem;
                ultimaLinha.querySelector('.subtotalItem').value = item.subtotalItem;
            });

            // Remove o orçamento da tabela para não duplicar
            excluirOrcamento(id);
        }
    };
}

// Função para excluir um orçamento
function excluirOrcamento(id) {
    const transaction = db.transaction(['orcamentos'], 'readwrite');
    const objectStore = transaction.objectStore('orcamentos');
    const request = objectStore.delete(id); // Deleta o orçamento do IndexedDB

    request.onsuccess = function() {
        const tabelaBody = document.getElementById('orcamentosTabela').getElementsByTagName('tbody')[0];
        tabelaBody.innerHTML = ''; // Limpa a tabela
        carregarOrcamentos(); // Recarrega os orçamentos restantes
        alert('Orçamento excluído com sucesso!');
    };

    request.onerror = function(event) {
        console.error('Erro ao excluir orçamento:', event.target.error);
    };
}

// Função para imprimir um orçamento
function imprimirOrcamento(id) {
    const transaction = db.transaction(['orcamentos'], 'readonly');
    const objectStore = transaction.objectStore('orcamentos');
    const request = objectStore.get(id);

    request.onsuccess = function(event) {
        const orcamento = event.target.result;
        
        if (!orcamento || !orcamento.itens) {
            alert("Orçamento inválido para impressão.");
            return;
        }

        const conteudo = `
            <html>
                <head>
                    <title>Imprimir Orçamento #${orcamento.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        h1 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>Orçamento #${orcamento.id}</h1>
                    <p>Cliente: ${orcamento.cliente}</p>
                    <p>Data: ${orcamento.dataOrcamento}</p>
                    <p>Validade: ${orcamento.validade}</p>
                    <p>Forma de Pagamento: ${orcamento.formaPagamento}</p>
                    <p>Observações: ${orcamento.observacoes}</p>
                    <h2>Itens</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Quantidade</th>
                                <th>Preço</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orcamento.itens.map(item => `
                                <tr>
                                    <td>${item.descricaoItem}</td>
                                    <td>${item.quantidadeItem}</td>
                                    <td>R$ ${parseFloat(item.precoItem).toFixed(2)}</td>
                                    <td>R$ ${parseFloat(item.subtotalItem).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <h3>Total: R$ ${orcamento.total.toFixed(2)}</h3>
                </body>
            </html>
        `;

        const novaJanela = window.open('', '', 'width=800,height=600');
        novaJanela.document.write(conteudo);
        novaJanela.document.close();
        novaJanela.print();
    };

    request.onerror = function(event) {
        console.error('Erro ao obter orçamento para impressão:', event.target.error);
    };
}
