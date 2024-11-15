// Abrir ou criar a base de dados
let request; // Declarar a variável global

function openDatabase() {
    request = indexedDB.open('AgendamentosDB', 1);

    request.onerror = (event) => {
        console.error('Erro ao abrir a base de dados:', event.target.errorCode);
    };

    request.onsuccess = (event) => {
        console.log('Base de dados aberta com sucesso');
        loadAgendamentos();
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore('agendamentos', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('data', 'data', { unique: false });
        objectStore.createIndex('hora', 'hora', { unique: false });
    };
}

// Função para adicionar ou atualizar um agendamento
function saveAgendamento(agendamento) {
    const db = request.result;
    const transaction = db.transaction('agendamentos', 'readwrite');
    const objectStore = transaction.objectStore('agendamentos');

    if (agendamento.id) {
        // Atualiza o agendamento se já existir um ID
        const updateRequest = objectStore.put(agendamento);
        updateRequest.onsuccess = () => {
            console.log('Agendamento atualizado com sucesso');
        };
    } else {
        // Adiciona um novo agendamento
        const addRequest = objectStore.add(agendamento);
        addRequest.onsuccess = () => {
            console.log('Agendamento adicionado com sucesso');
        };
    }

    loadAgendamentos();
}

// Função para carregar agendamentos
function loadAgendamentos() {
    const db = request.result;
    const transaction = db.transaction('agendamentos', 'readonly');
    const objectStore = transaction.objectStore('agendamentos');
    const getRequest = objectStore.getAll();

    getRequest.onsuccess = (event) => {
        const agendamentos = event.target.result;
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = ''; // Limpa a tabela antes de carregar

        agendamentos.forEach((agendamento) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${agendamento.data}</td>
                <td>${agendamento.hora}</td>
                <td>${agendamento.nome}</td>
                <td>${agendamento.servico}</td>
                <td>${agendamento.status || 'Pendente'}</td>
                <td>
                    <button onclick="editAgendamento(${agendamento.id})">Editar</button>
                    <button onclick="deleteAgendamento(${agendamento.id})">Excluir</button>
                    <button onclick="printAgendamento(${agendamento.id})">Imprimir</button> <!-- Botão para imprimir -->
                </td>
            `;
            tbody.appendChild(row);
        });
    };
}

// Função para imprimir um agendamento
function printAgendamento(id) {
    const db = request.result;
    const transaction = db.transaction('agendamentos', 'readonly');
    const objectStore = transaction.objectStore('agendamentos');

    const getRequest = objectStore.get(id);
    getRequest.onsuccess = (event) => {
        const agendamento = event.target.result;
        if (agendamento) {
            // Criar um novo documento PDF
            const { jsPDF } = window.jspdf; // Acesso à biblioteca jsPDF
            const doc = new jsPDF();

            // Adiciona cabeçalho
            doc.setFontSize(18);
            doc.text('Anjos do Clima', 20, 10); // Nome da empresa
            doc.setFontSize(12);
            doc.text('Endereço da Empresa', 20, 15); // Endereço
            doc.text('Telefone: (XX) XXXXX-XXXX', 20, 20); // Telefone
            doc.text('Email: contato@empresa.com', 20, 25); // Email
            doc.line(10, 30, 200, 30); // Linha horizontal
            doc.setFontSize(16);
            doc.text('Detalhes do Agendamento', 20, 40);
            doc.line(10, 45, 200, 45); // Linha horizontal

            // Adiciona conteúdo ao PDF
            doc.setFontSize(12);
            doc.text(`Nome: ${agendamento.nome || 'N/A'}`, 20, 55);
            doc.text(`Telefone: ${agendamento.telefone || 'N/A'}`, 20, 60);
            doc.text(`Email: ${agendamento.email || 'N/A'}`, 20, 65);
            doc.text(`Serviço: ${agendamento.servico || 'N/A'}`, 20, 70);
            doc.text(`Prioridade: ${agendamento.prioridade || 'N/A'}`, 20, 75);
            doc.text(`Local: ${agendamento.local || 'N/A'}`, 20, 80);
            doc.text(`Descrição: ${agendamento.descricao || 'N/A'}`, 20, 85);
            doc.text(`Data: ${agendamento.data || 'N/A'}`, 20, 90);
            doc.text(`Hora: ${agendamento.hora || 'N/A'}`, 20, 95);
            doc.text(`Duração: ${agendamento.duracao || 'N/A'}`, 20, 100);

            // Adiciona rodapé
            doc.setFontSize(10);
            doc.line(10, 210, 200, 210); // Linha horizontal
            doc.text('Este é um documento gerado automaticamente.', 20, 215);
            doc.text('Obrigado por escolher nossos serviços!', 20, 220);

            // Salvar o PDF
            doc.save(`agendamento_${agendamento.id}.pdf`);
        } else {
            console.error('Agendamento não encontrado.');
        }
    };
}

// Função para editar um agendamento
function editAgendamento(id) {
    const db = request.result;
    const transaction = db.transaction('agendamentos', 'readonly');
    const objectStore = transaction.objectStore('agendamentos');

    const getRequest = objectStore.get(id);
    getRequest.onsuccess = (event) => {
        const agendamento = event.target.result;
        // Preenche o formulário com os dados do agendamento selecionado
        document.getElementById('nome').value = agendamento.nome;
        document.getElementById('telefone').value = agendamento.telefone;
        document.getElementById('email').value = agendamento.email;
        document.getElementById('servico').value = agendamento.servico;
        document.getElementById('prioridade').value = agendamento.prioridade;
        document.getElementById('local').value = agendamento.local;
        document.getElementById('descricao').value = agendamento.descricao;
        document.getElementById('data').value = agendamento.data;
        document.getElementById('hora').value = agendamento.hora;
        document.getElementById('duracao').value = agendamento.duracao;

        // Adiciona o ID ao objeto agendamento para edição
        agendamento.id = id;
        document.getElementById('agendamentoForm').setAttribute('data-edit-id', id);
    };
}

// Função para excluir um agendamento
function deleteAgendamento(id) {
    const db = request.result;
    const transaction = db.transaction('agendamentos', 'readwrite');
    const objectStore = transaction.objectStore('agendamentos');

    const deleteRequest = objectStore.delete(id);
    deleteRequest.onsuccess = () => {
        console.log('Agendamento excluído com sucesso');
        loadAgendamentos();
    };

    deleteRequest.onerror = (event) => {
        console.error('Erro ao excluir agendamento:', event.target.errorCode);
    };
}

// Evento do formulário para adicionar ou atualizar agendamento
document.getElementById('agendamentoForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const agendamento = {
        nome: document.getElementById('nome').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        servico: document.getElementById('servico').value,
        prioridade: document.getElementById('prioridade').value,
        local: document.getElementById('local').value,
        descricao: document.getElementById('descricao').value,
        data: document.getElementById('data').value,
        hora: document.getElementById('hora').value,
        duracao: document.getElementById('duracao').value
    };

    const editId = document.getElementById('agendamentoForm').getAttribute('data-edit-id');
    if (editId) {
        agendamento.id = parseInt(editId);
    }

    saveAgendamento(agendamento);

    // Limpar o formulário
    document.getElementById('agendamentoForm').reset();
    document.getElementById('agendamentoForm').removeAttribute('data-edit-id');
});

// Abrir a base de dados ao carregar o script
openDatabase();
