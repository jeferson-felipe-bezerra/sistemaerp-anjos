let db;
const request = indexedDB.open("vendasDB", 1);

request.onsuccess = function(event) {
    db = event.target.result;
    updateProductList(); // Atualiza a lista de produtos ao abrir o DB
    loadSales(); // Carrega vendas ao iniciar
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
    db.createObjectStore("sales", { keyPath: "id", autoIncrement: true });
};

// Função para adicionar produto
function addProduct() {
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const quantity = parseInt(document.getElementById('product-quantity').value);

    if (validateProductInputs(name, price, quantity)) {
        const transaction = db.transaction(["products"], "readwrite");
        const store = transaction.objectStore("products");
        const product = { name, description, price, quantity };
        
        store.add(product);
        updateProductList();
        showMessage('Produto cadastrado com sucesso!', 'product-message');
        clearProductInputs();
    } else {
        showMessage('Preencha todos os campos corretamente!', 'product-message');
    }
}

// Função para validar os campos do produto
function validateProductInputs(name, price, quantity) {
    return name && !isNaN(price) && !isNaN(quantity) && quantity >= 0;
}

// Atualiza a lista de produtos
function updateProductList() {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");
    
    store.getAll().onsuccess = function(event) {
        const products = event.target.result;
        const registeredProductsContainer = document.getElementById('registered-products');
        registeredProductsContainer.innerHTML = '';
        
        products.forEach((product) => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item';
            productDiv.innerHTML = `
                <div>${product.name}</div>
                <div>R$ ${product.price.toFixed(2)}</div>
                <div>Em estoque: ${product.quantity}</div>
                <button onclick="editProduct(${product.id})">Editar</button>
                <button onclick="removeProduct(${product.id})" style="background-color: #dc3545;">Remover</button>
            `;
            registeredProductsContainer.appendChild(productDiv);
        });
    };
}

// Editar produto
function editProduct(id) {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");

    store.get(id).onsuccess = function(event) {
        const product = event.target.result;
        if (product) {
            fillProductForm(product);
            changeAddButtonToUpdate(id);
        }
    };
}

// Preenche o formulário com dados do produto
function fillProductForm(product) {
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-quantity').value = product.quantity;
}

// Altera o botão de adicionar para atualizar
function changeAddButtonToUpdate(id) {
    const addButton = document.getElementById('add-product');
    if (addButton) {
        addButton.innerText = 'Atualizar Produto';
        addButton.onclick = () => updateProduct(id);
    }
}

// Atualiza o produto
function updateProduct(id) {
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const quantity = parseInt(document.getElementById('product-quantity').value);

    if (validateProductInputs(name, price, quantity)) {
        const transaction = db.transaction(["products"], "readwrite");
        const store = transaction.objectStore("products");
        const updatedProduct = { id, name, description, price, quantity };
        
        store.put(updatedProduct);
        updateProductList();
        showMessage('Produto atualizado com sucesso!', 'product-message');
        clearProductInputs();
    } else {
        showMessage('Preencha todos os campos corretamente!', 'product-message');
    }
}

// Remove o produto
function removeProduct(id) {
    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");

    store.delete(id);
    updateProductList();
    showMessage('Produto removido com sucesso!', 'product-message');
}

// Limpa os campos de entrada do produto
function clearProductInputs() {
    document.getElementById('product-name').value = '';
    document.getElementById('product-description').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-quantity').value = '';

    const addButton = document.getElementById('add-product');
    if (addButton) {
        addButton.innerText = 'Adicionar Produto';
        addButton.onclick = addProduct;
    }
}

// Filtra produtos
function filterProducts() {
    const query = document.getElementById('search-product').value.toLowerCase();
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");

    store.getAll().onsuccess = function(event) {
        const products = event.target.result;
        const availableProductsContainer = document.getElementById('available-products');
        availableProductsContainer.innerHTML = '';
        
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(query));
        filteredProducts.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item';
            productDiv.innerHTML = `
                <div>${product.name}</div>
                <div>R$ ${product.price.toFixed(2)}</div>
                <div>Em estoque: ${product.quantity}</div>
                <button onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
            `;
            availableProductsContainer.appendChild(productDiv);
        });
    };
}

// Adiciona produto ao carrinho
const cart = [];
let totalAmount = 0;

function addToCart(productId) {
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");

    store.get(productId).onsuccess = function(event) {
        const product = event.target.result;
        if (product && product.quantity > 0) {
            updateCartItems(product);
            product.quantity -= 1; // Diminui a quantidade no estoque
            updateProductInDB(product);
            updateCart();
            showMessage('Produto adicionado ao carrinho!', 'message');
        } else {
            alert('Produto fora de estoque!');
        }
    };
}

// Atualiza itens no carrinho
function updateCartItems(product) {
    const cartItemIndex = cart.findIndex(item => item.id === product.id);
    if (cartItemIndex > -1) {
        cart[cartItemIndex].quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
}

// Atualiza o produto no IndexedDB
function updateProductInDB(product) {
    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");
    store.put(product); // Atualiza o produto no DB
}

// Atualiza o carrinho
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    totalAmount = 0;

    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>${item.name} - R$ ${item.price.toFixed(2)} x 
            <input type="number" value="${item.quantity}" min="1" onchange="updateItemQuantity(${index}, this.value)"></div>
            <button class="remove-btn" onclick="removeFromCart(${index})">Remover</button>
        `;
        cartItemsContainer.appendChild(cartItem);
        totalAmount += item.price * item.quantity;
    });

    document.getElementById('total-amount').textContent = `Total: R$ ${totalAmount.toFixed(2)}`;
}

// Atualiza a quantidade do item no carrinho
function updateItemQuantity(index, quantity) {
    const item = cart[index];
    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");

    store.get(item.id).onsuccess = function(event) {
        const product = event.target.result;
        if (quantity > 0) {
            product.quantity += (item.quantity - quantity);
            item.quantity = quantity;
            store.put(product); // Atualiza o produto no DB
            updateCart();
        } else {
            alert('A quantidade deve ser pelo menos 1!');
        }
    };
}

// Remove item do carrinho
function removeFromCart(index) {
    const item = cart[index];
    totalAmount -= item.price * item.quantity; // Atualiza total
    cart.splice(index, 1);
    const transaction = db.transaction(["products"], "readwrite");
    const store = transaction.objectStore("products");

    store.get(item.id).onsuccess = function(event) {
        const product = event.target.result;
        if (product) {
            product.quantity += item.quantity; // Atualiza estoque
            store.put(product); // Atualiza o produto no DB
            updateCart();
        }
    };
}

// Finaliza a venda
function finalizeSale() {
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethod) {
        alert('Selecione um método de pagamento!');
        return;
    }

    const sale = {
        date: new Date().toLocaleString(),
        items: cart,
        total: totalAmount,
        paymentMethod: paymentMethod.value
    };

    const transaction = db.transaction(["sales"], "readwrite");
    const store = transaction.objectStore("sales");
    store.add(sale);

    // Limpar carrinho e atualizar a interface
    cart.length = 0; // Limpa o carrinho
    updateCart();
    showMessage('Venda finalizada com sucesso!', 'message');

    // Carregar vendas (opcional, caso você tenha algum relatório ou lista de vendas)
    loadSales();

    // Recarregar a página
    location.reload();
}


// Carrega vendas
function loadSales() {
    const transaction = db.transaction(["sales"], "readonly");
    const store = transaction.objectStore("sales");

    store.getAll().onsuccess = function(event) {
        const sales = event.target.result;
        const salesListContainer = document.getElementById('sales-list-report');
        if (salesListContainer) {
            salesListContainer.innerHTML = '';
            sales.forEach(sale => {
                const salesItem = document.createElement('div');
                salesItem.className = 'sales-item';
                salesItem.innerHTML = `
                    <div>${sale.date} - ${sale.paymentMethod} - R$ ${sale.total.toFixed(2)}</div>
                `;
                salesListContainer.appendChild(salesItem);
            });
        } else {
            console.error("Elemento 'sales-list-report' não encontrado.");
        }
    };
}

let discount = 0;

// Inicializa eventos após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-product').onclick = addProduct;
    document.getElementById('finalize-sale').onclick = finalizeSale;

    document.addEventListener('keydown', (event) => {
        if (event.key === 'F2') {
            openPopup();
        }
    });
});

// Mensagem de sucesso ou erro
function showMessage(message, elementId) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
    }
}

// Abre o popup
function openPopup() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('product-popup').style.display = 'block';
}

// Fecha o popup
function closePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('product-popup').style.display = 'none';
    document.getElementById('popup-search-input').value = '';
}

// Pesquisa produto
function searchProduct() {
    const query = document.getElementById('popup-search-input').value.toLowerCase();
    const transaction = db.transaction(["products"], "readonly");
    const store = transaction.objectStore("products");

    store.getAll().onsuccess = function(event) {
        const products = event.target.result;
        const availableProductsContainer = document.getElementById('available-products');
        availableProductsContainer.innerHTML = '';
        
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(query));
        filteredProducts.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item';
            productDiv.innerHTML = `
                <div>${product.name}</div>
                <div>R$ ${product.price.toFixed(2)}</div>
                <div>Em estoque: ${product.quantity}</div>
                <button onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
            `;
            availableProductsContainer.appendChild(productDiv);
        });
    };
}

// Exibe a seção selecionada
function showSection(section) {
    document.querySelectorAll('.container').forEach(container => {
        container.style.display = 'none'; // Oculta todas as seções
    });
    document.getElementById(section).style.display = 'block'; // Mostra a seção selecionada
}

// Exibe a seção de vendas por padrão
showSection('sales');

// Filtra vendas por data
function filterSalesByDate() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!startDate || !endDate) {
        alert('Por favor, selecione ambas as datas.');
        return;
    }

    const transaction = db.transaction(["sales"], "readonly");
    const store = transaction.objectStore("sales");

    store.getAll().onsuccess = function(event) {
        const sales = event.target.result;
        const salesListContainer = document.getElementById('sales-list-report');
        salesListContainer.innerHTML = '';

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });

        filteredSales.forEach(sale => {
            const salesItem = document.createElement('div');
            salesItem.className = 'sales-item';
            salesItem.innerHTML = `
                <div>${sale.date} - ${sale.paymentMethod} - R$ ${sale.total.toFixed(2)}</div>
            `;
            salesListContainer.appendChild(salesItem);
        });

        if (filteredSales.length === 0) {
            salesListContainer.innerHTML = '<div>Nenhuma venda encontrada para as datas selecionadas.</div>';
        }
    };
}
// Função para alternar a exibição das últimas vendas
document.getElementById('toggle-sales-button').addEventListener('click', function() {
    const salesList = document.getElementById('sales-list-report');
    const button = document.getElementById('toggle-sales-button');

    // Verifica se a lista está oculta ou visível
    if (salesList.style.display === 'none') {
        salesList.style.display = 'block';
        button.textContent = 'Ocultar Últimas Vendas'; // Alterar o texto do botão
    } else {
        salesList.style.display = 'none';
        button.textContent = 'Mostrar Últimas Vendas'; // Alterar o texto do botão
    }
});
function generateProductSalesReport() {
    // Supondo que existe uma função que retorna os dados de vendas
    const salesData = getSalesData();
    const productSales = {};
    let grandTotal = 0;
    let totalSalesCount = salesData.length;

    // Processa os dados de vendas e agrupa por produto
    salesData.forEach(sale => {
        const productName = sale.productName;
        if (!productSales[productName]) {
            productSales[productName] = {
                quantity: 0,
                total: 0,
                salesCount: 0
            };
        }
        productSales[productName].quantity += sale.quantity;
        productSales[productName].total += sale.total;
        productSales[productName].salesCount += 1;
        grandTotal += sale.total;
    });

    // Exibir os resultados de forma detalhada
    const reportElement = document.getElementById('product-sales-report');
    reportElement.innerHTML = '<h4>Relatório de Vendas por Produto</h4>';
    reportElement.innerHTML += `<p><strong>Total de Vendas Realizadas:</strong> ${totalSalesCount}</p>`;
    reportElement.innerHTML += `<p><strong>Total Geral das Vendas:</strong> R$ ${grandTotal.toFixed(2)}</p>`;

    reportElement.innerHTML += '<ul>';
    for (const product in productSales) {
        const data = productSales[product];
        const averagePrice = data.total / data.quantity;
        const salesPercentage = (data.total / grandTotal) * 100;

        reportElement.innerHTML += `
            <li>
                <strong>${product}</strong>:<br>
                - Quantidade Vendida: ${data.quantity}<br>
                - Total de Vendas: R$ ${data.total.toFixed(2)}<br>
                - Preço Médio por Unidade: R$ ${averagePrice.toFixed(2)}<br>
                - Número de Vendas: ${data.salesCount}<br>
                - Percentual do Total de Vendas: ${salesPercentage.toFixed(2)}%
            </li>
        `;
    }
    reportElement.innerHTML += '</ul>';
}

function generateLowStockReport() {
    const products = getRegisteredProducts(); // Função que busca produtos registrados
    const threshold = 5; // Defina o limite de estoque baixo
    const lowStockProducts = products.filter(product => product.quantity < threshold);

    const reportElement = document.getElementById('low-stock-report');
    reportElement.innerHTML = '<h4>Produtos com Estoque Baixo</h4>';
    if (lowStockProducts.length > 0) {
        lowStockProducts.forEach(product => {
            reportElement.innerHTML += `<p>${product.name}: Quantidade em estoque: ${product.quantity}</p>`;
        });
    } else {
        reportElement.innerHTML = '<p>Todos os produtos estão com estoque suficiente.</p>';
    }
}
function renderSalesChart() {
    const salesData = getSalesData();
    const labels = salesData.map(sale => sale.productName);
    const data = salesData.map(sale => sale.total);

    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas por Produto',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
function generateFinancialReport() {
    getSalesData(function(salesData) {
        const paymentMethods = { dinheiro: 0, cartao: 0, pix: 0 };

        salesData.forEach(sale => {
            paymentMethods[sale.paymentMethod] += sale.total; // Assumindo que 'total' é o total da venda
        });

        const reportElement = document.getElementById('financial-report');
        reportElement.innerHTML = `
            <h4>Relatório Financeiro</h4>
            <p>Total em Dinheiro: R$ ${paymentMethods.dinheiro.toFixed(2)}</p>
            <p>Total em Cartão: R$ ${paymentMethods.cartao.toFixed(2)}</p>
            <p>Total em Pix: R$ ${paymentMethods.pix.toFixed(2)}</p>
        `;
    });
}

function exportReportToPDF() {
    const element = document.getElementById('sales-report'); // Supondo que esse seja o elemento que você quer exportar
    html2pdf().from(element).save();
}

function exportReportToCSV() {
    getSalesData(function(sales) {
        let csvContent = "data:text/csv;charset=utf-8,Data,Pagamento,Total\n";
        
        sales.forEach(sale => {
            const totalAmount = sale.totalAmount ? sale.totalAmount.toFixed(2) : '0.00';
            csvContent += `${sale.date},${sale.paymentMethod},${totalAmount}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_vendas.csv");
        document.body.appendChild(link);
        link.click();
    });
}

function getSalesData(callback) {
    const request = indexedDB.open('erp', 1);

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['sales'], 'readonly');
        const objectStore = transaction.objectStore('sales');
        const sales = [];

        objectStore.openCursor().onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                sales.push(cursor.value);
                cursor.continue();
            } else {
                callback(sales); // Passar os dados de vendas para o callback
            }
        };
    };

    request.onerror = function(event) {
        console.error("Erro ao acessar o banco de dados.");
    };
}

function getRegisteredProducts(callback) {
    const request = indexedDB.open('erp', 1);

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['products'], 'readonly');
        const objectStore = transaction.objectStore('products');
        const products = [];

        objectStore.openCursor().onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                products.push(cursor.value);
                cursor.continue();
            } else {
                callback(products); // Passar os produtos para o callback
            }
        };
    };

    request.onerror = function(event) {
        console.error("Erro ao acessar o banco de dados.");
    };
}

function generateLowStockReport() {
    getRegisteredProducts(function(products) {
        const threshold = 5; // Limite de estoque baixo
        const lowStockProducts = products.filter(product => product.stockQuantity <= threshold);

        const reportElement = document.getElementById('low-stock-report');
        reportElement.innerHTML = '<h4>Produtos com Estoque Baixo</h4>';
        
        if (lowStockProducts.length > 0) {
            lowStockProducts.forEach(product => {
                reportElement.innerHTML += `<p>${product.name}: Quantidade em estoque: ${product.stockQuantity}</p>`;
            });
        } else {
            reportElement.innerHTML += '<p>Todos os produtos estão com estoque suficiente.</p>';
        }
    });
}

function renderSalesChart() {
    getSalesData(function(salesData) {
        const productSales = {};
        
        salesData.forEach(sale => {
            const productName = sale.productName; // Assumindo que você tem um campo productName em sales
            if (!productSales[productName]) {
                productSales[productName] = 0;
            }
            productSales[productName] += sale.total; // Acumulando o total de vendas
        });

        const labels = Object.keys(productSales);
        const data = Object.values(productSales);

        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas por Produto',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

// Exibe ou oculta o campo de endereço de entrega
document.querySelectorAll('input[name="delivery-method"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const addressField = document.getElementById('delivery-address');
        addressField.style.display = this.value === 'delivery' ? 'block' : 'none';
    });
});

function emitirNotaFiscal() {
    const customerName = document.getElementById('customer-name').value;
    const customerCpf = document.getElementById('customer-cpf').value;
    const customerPhone = document.getElementById('customer-phone').value;

    if (!customerName || !customerCpf || !customerPhone) {
        alert("Preencha todos os dados do cliente.");
        return;
    }

    let cartItemsHTML = '';
    let totalAmount = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        totalAmount += subtotal;

        cartItemsHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>R$ ${item.price.toFixed(2)}</td>
                <td>R$ ${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    generateDanfe(customerName, customerCpf, customerPhone, cartItemsHTML, totalAmount);
}

function generateDanfe(customerName, customerCpf, customerPhone, cartItemsHTML, totalAmount) {
    // Função para mascarar o CPF
    function maskCpf(cpf) {
        const firstThree = cpf.slice(0, 3);
        const lastDigit = cpf.slice(-1);
        return `${firstThree}.***.***-${lastDigit}`;
    }

    // Aplica a máscara no CPF
    const maskedCpf = maskCpf(customerCpf);

    const newWindow = window.open('', '', 'width=800,height=600');
    if (!newWindow) {
        alert("Falha ao abrir nova janela. Verifique se o seu navegador bloqueou pop-ups.");
        return;
    }

    newWindow.document.write(`
        <html>
        <head>
            <title>DANFE</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header { text-align: center; margin-bottom: 20px; }
                .info, .cart { margin-bottom: 20px; }
                .info h3, .cart h3 { margin: 10px 0; }
                .info p { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; font-size: 1.2em; }
                .footer { margin-top: 30px; text-align: center; }
                .footer p { margin: 5px 0; }
                .print-button { display: block; margin: 20px auto; padding: 10px 20px; font-size: 1em; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
                .print-button:hover { background-color: #45a049; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Documento Auxiliar da Nota Fiscal Eletrônica - DANFE</h1>
                <p>Este documento não é um documento fiscal.</p>
            </div>
            <div class="info">
                <h3>Dados do Cliente</h3>
                <p><strong>Nome:</strong> ${customerName}</p>
                <p><strong>CPF:</strong> ${maskedCpf}</p> <!-- Usando o CPF mascarado -->
                <p><strong>Telefone:</strong> ${customerPhone}</p>
            </div>
            <div class="cart">
                <h3>Carrinho de Compras</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Preço Unitário</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cartItemsHTML}
                    </tbody>
                </table>
                <div class="total">Total: R$ ${totalAmount.toFixed(2)}</div>
            </div>
            <div class="footer">
                <p>Obrigado pela sua compra!</p>
                <button class="print-button" onclick="window.print();">Imprimir</button>
            </div>
        </body>
        </html>
    `);
    newWindow.document.close();
}

