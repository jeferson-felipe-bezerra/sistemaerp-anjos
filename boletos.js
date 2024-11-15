let db;

document.addEventListener('DOMContentLoaded', () => {
    const request = indexedDB.open('GerenciamentoContas', 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('contas', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('tipo', 'tipo', { unique: false });
        objectStore.createIndex('fornecedor', 'fornecedor', { unique: false });
        objectStore.createIndex('valor', 'valor', { unique: false });
        objectStore.createIndex('dataEmissao', 'dataEmissao', { unique: false });
        objectStore.createIndex('dataVencimento', 'dataVencimento', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        carregarContas();
    };

    request.onerror = (event) => {
        console.error('Erro ao abrir o banco de dados:', event.target.error);
    };
});

function carregarContas() {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';
    const transaction = db.transaction('contas', 'readonly');
    const objectStore = transaction.objectStore('contas');

    const hoje = new Date();
    const tresDiasDepois = new Date(hoje);
    tresDiasDepois.setDate(hoje.getDate() + 3);

    let contasVencendo = [];

    objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const dataVencimento = new Date(cursor.value.dataVencimento);
            if (dataVencimento <= tresDiasDepois && dataVencimento >= hoje) {
                contasVencendo.push(cursor.value);
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cursor.value.tipo}</td>
                <td>${cursor.value.fornecedor}</td>
                <td>${cursor.value.valor}</td>
                <td>${cursor.value.dataEmissao}</td>
                <td>${cursor.value.dataVencimento}</td>
                <td>${cursor.value.status}</td>
                <td>
                    <button onclick="editarConta(${cursor.value.id})">Editar</button>
                    <button onclick="excluirConta(${cursor.value.id})">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
            cursor.continue();
        } else {
            // Verifica se há contas vencendo e exibe um alerta
            if (contasVencendo.length > 0) {
                const mensagem = contasVencendo.map(conta => 
                    `Tipo: ${conta.tipo}, Fornecedor: ${conta.fornecedor}, Vencimento: ${conta.dataVencimento}`
                ).join('\n');
                alert(`Contas vencendo nos próximos 3 dias:\n${mensagem}`);
            }
        }
    };
}

function salvarConta(event) {
    event.preventDefault();
    const tipo = document.getElementById('tipo').value;
    const fornecedor = document.getElementById('fornecedor').value;
    const numeroFatura = document.getElementById('numeroFatura').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const dataEmissao = document.getElementById('dataEmissao').value;
    const dataVencimento = document.getElementById('dataVencimento').value;
    const dataPagamento = document.getElementById('dataPagamento').value;
    const status = document.getElementById('status').value;
    const formaPagamento = document.getElementById('formaPagamento').value;
    const recorrente = document.getElementById('recorrente').checked;
    const descricao = document.getElementById('descricao').value;
    const categoria = document.getElementById('categoria').value;

    const conta = {
        tipo,
        fornecedor,
        numeroFatura,
        valor,
        dataEmissao,
        dataVencimento,
        dataPagamento,
        status,
        formaPagamento,
        recorrente,
        descricao,
        categoria
    };

    const transaction = db.transaction('contas', 'readwrite');
    const objectStore = transaction.objectStore('contas');

    if (conta.id) {
        objectStore.put(conta).onsuccess = () => {
            alert('Conta atualizada com sucesso!');
            carregarContas();
            fecharFormulario();
        };
    } else {
        objectStore.add(conta).onsuccess = () => {
            alert('Conta adicionada com sucesso!');
            carregarContas();
            fecharFormulario();
        };
    }
}

function editarConta(id) {
    const transaction = db.transaction('contas', 'readonly');
    const objectStore = transaction.objectStore('contas');
    
    objectStore.get(id).onsuccess = (event) => {
        const conta = event.target.result;
        if (conta) {
            document.getElementById('tipo').value = conta.tipo;
            document.getElementById('fornecedor').value = conta.fornecedor;
            document.getElementById('numeroFatura').value = conta.numeroFatura;
            document.getElementById('valor').value = conta.valor;
            document.getElementById('dataEmissao').value = conta.dataEmissao;
            document.getElementById('dataVencimento').value = conta.dataVencimento;
            document.getElementById('dataPagamento').value = conta.dataPagamento;
            document.getElementById('status').value = conta.status;
            document.getElementById('formaPagamento').value = conta.formaPagamento;
            document.getElementById('recorrente').checked = conta.recorrente;
            document.getElementById('descricao').value = conta.descricao;
            document.getElementById('categoria').value = conta.categoria;

            abrirFormulario();
            // Adicione o ID da conta ao formulário para a atualização
            document.getElementById('contaForm').setAttribute('data-id', conta.id);
        }
    };
}

function excluirConta(id) {
    const transaction = db.transaction('contas', 'readwrite');
    const objectStore = transaction.objectStore('contas');

    objectStore.delete(id).onsuccess = () => {
        alert('Conta excluída com sucesso!');
        carregarContas();
    };
}

// Conecte a função de salvar ao evento de envio do formulário
document.getElementById('contaForm').addEventListener('submit', salvarConta);
