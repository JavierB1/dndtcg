// Constantes para las APIs de SheetDB
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau"; // URL de tus cartas
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp"; // URL para tu hoja 'producto_sellado'

// ===============================================
// ELEMENTOS DEL DOM - TIENDA PRINCIPAL
// ===============================================
const abrirModalProductosBtn = document.getElementById('abrirModalProductos');
const abrirCarritoBtn = document.getElementById('abrirCarrito');

// Elementos para el modal de selección de productos
const productSelectionModal = document.getElementById('productSelectionModal');
const closeProductSelectionModalBtn = document.getElementById('closeProductSelectionModal');
const openCardsModalBtn = document.getElementById('openCardsModalBtn');
const openSealedProductsModalBtn = document.getElementById('openSealedProductsModalBtn');

// Elementos del modal de cartas
const cardsModal = document.getElementById('cardsModal');
const closeCardsModalBtn = document.getElementById('closeCardsModal');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const cardsContainer = document.getElementById('cardsContainer');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

// Elementos del modal de productos sellados
const sealedProductsModal = document.getElementById('sealedProductsModal');
const closeSealedProductsModalBtn = document.getElementById('closeSealedProductsModal');
const sealedSearchInput = document.getElementById('sealedSearchInput');
const sealedTypeFilter = document.getElementById('sealedTypeFilter');
const sealedProductsContainer = document.getElementById('sealedProductsContainer');
const sealedPrevPageBtn = document.getElementById('sealedPrevPageBtn');
const sealedNextPageBtn = document.getElementById('sealedNextPageBtn');
const sealedPageInfo = document.getElementById('sealedPageInfo');

// Elementos del modal del carrito
const modalCarrito = document.getElementById('modalCarrito');
const cerrarCarritoBtn = document.getElementById('cerrarCarrito');
const listaCarrito = document.getElementById('lista-carrito');
const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
const enviarWhatsappBtn = document.getElementById('enviarWhatsapp');

// Elementos del modal de mensajes
const messageModal = document.getElementById('messageModal');
const closeMessageModalBtn = document.getElementById('closeMessageModal');
const messageModalTitle = document.getElementById('messageModalTitle');
const messageModalText = document.getElementById('messageModalText');
const okMessageModalBtn = document.getElementById('okMessageModal');

// ===============================================
// VARIABLES GLOBALES PARA DATOS Y PAGINACIÓN
// ===============================================
let allCards = [];
let filteredCards = [];
let currentPage = 1;
const cardsPerPage = 20;

let allSealedProducts = [];
let filteredSealedProducts = [];
let currentSealedPage = 1;
const sealedProductsPerPage = 12;

let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

// ===============================================
// LÓGICA DE CACHE-BUSTING PARA FETCH DE DATOS
// ===============================================
// Función para añadir un parámetro único a la URL y evitar la caché del navegador
function getCacheBustingUrl(url) {
    const d = new Date();
    return `${url}?_=${d.getTime()}`;
}

// ===============================================
// LÓGICA DE MODALES GENERAL
// ===============================================
function showModal(modalElement) {
    modalElement.style.display = 'flex';
}

function hideModal(modalElement) {
    modalElement.style.display = 'none';
}

// ===============================================
// LÓGICA PARA MODAL DE SELECCIÓN DE PRODUCTOS
// ===============================================
abrirModalProductosBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showModal(productSelectionModal);
});

closeProductSelectionModalBtn.addEventListener('click', () => {
    hideModal(productSelectionModal);
});

openCardsModalBtn.addEventListener('click', () => {
    hideModal(productSelectionModal);
    showModal(cardsModal);
    loadCards(); // Cargar cartas cada vez que se abre su modal
});

openSealedProductsModalBtn.addEventListener('click', () => {
    hideModal(productSelectionModal);
    showModal(sealedProductsModal);
    loadSealedProducts(); // Cargar productos sellados cada vez que se abre su modal
});

// ===============================================
// LÓGICA DE GESTIÓN DE CARTAS
// ===============================================
closeCardsModalBtn.addEventListener('click', () => {
    hideModal(cardsModal);
});

async function loadCards() {
    try {
        // Usar la función getCacheBustingUrl para asegurar que siempre se obtengan los datos frescos
        const response = await fetch(getCacheBustingUrl(SHEETDB_CARDS_API_URL), { cache: 'no-cache' }); // Añadido cache: 'no-cache'
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCards = await response.json();
        
        populateCategoryFilter(allCards);
        applyFilters();
    } catch (error) {
        console.error("Error cargando cartas:", error);
        showMessageModal("Error", "No se pudieron cargar las cartas. Inténtalo de nuevo más tarde.");
    }
}

function populateCategoryFilter(cards) {
    const categories = new Set();
    cards.forEach(card => {
        if (card.categoria) {
            categories.add(card.categoria.trim());
        }
    });
    const sortedCategories = Array.from(categories).sort();

    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    filteredCards = allCards.filter(card => {
        const matchesSearch = card.nombre.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "" || card.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    currentPage = 1;
    renderCards(filteredCards);
}

function renderCards(cardsToRender) {
    cardsContainer.innerHTML = '';

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const paginatedCards = cardsToRender.slice(startIndex, endIndex);

    if (paginatedCards.length === 0) {
        cardsContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">No se encontraron cartas con los criterios de búsqueda/filtro.</p>';
    }

    paginatedCards.forEach(card => {
        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('carta');
        // El estado de stock se calcula para deshabilitar el botón, pero no se muestra
        const isOutOfStock = parseInt(card.stock) === 0;

        cartaDiv.innerHTML = `
            <img src="${card.imagen || 'https://placehold.co/150x200/E0E0E0/white?text=No+Img'}" alt="${card.nombre}" onerror="this.onerror=null; this.src='https://placehold.co/150x200/E0E0E0/white?text=No+Img';">
            <h4>${card.nombre}</h4>
            <p>Precio: $${parseFloat(card.precio).toFixed(2)}</p>
            <div class="quantity-controls">
                <button class="decrease-quantity" data-id="${card.id}" ${isOutOfStock ? 'disabled' : ''}>-</button>
                <input type="number" class="quantity-input" data-id="${card.id}" value="1" min="1" max="${card.stock}" ${isOutOfStock ? 'disabled' : ''}>
                <button class="increase-quantity" data-id="${card.id}" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            <button class="agregar-carrito" data-id="${card.id}" data-name="${card.nombre}" data-price="${card.precio}" data-image="${card.imagen}" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
            </button>
        `;
        cardsContainer.appendChild(cartaDiv);
    });

    updatePaginationControls(cardsToRender.length);
    attachCardEventListeners();
}

function updatePaginationControls(totalCardsCount) {
    const totalPages = Math.ceil(totalCardsCount / cardsPerPage);
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function attachCardEventListeners() {
    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const input = document.querySelector(`.quantity-input[data-id="${id}"]`);
            if (input) {
                const max = parseInt(input.max);
                let value = parseInt(input.value);
                if (value < max) {
                    input.value = value + 1;
                }
            }
        });
    });

    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const input = document.querySelector(`.quantity-input[data-id="${id}"]`);
            if (input) {
                let value = parseInt(input.value);
                if (value > 1) {
                    input.value = value - 1;
                }
            }
        });
    });

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            const min = parseInt(e.target.min);
            const max = parseInt(e.target.max);
            if (isNaN(value) || value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
        });
    });

    document.querySelectorAll('.agregar-carrito').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            const image = e.target.dataset.image;
            const quantityInput = document.querySelector(`.quantity-input[data-id="${id}"]`);
            const quantity = parseInt(quantityInput.value);

            addToCart({ id, name, price, image, quantity, type: 'card' });
        });
    });
}

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderCards(filteredCards);
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderCards(filteredCards);
    }
});

searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);

// ===============================================
// LÓGICA DE GESTIÓN DE PRODUCTOS SELLADOS (FRONTEND TIENDA)
// ===============================================
closeSealedProductsModalBtn.addEventListener('click', () => {
    hideModal(sealedProductsModal);
});

async function loadSealedProducts() {
    if (SHEETDB_SEALED_PRODUCTS_API_URL.includes("YOUR_SEALED_PRODUCTS_SHEETDB_ID")) {
        console.warn("ADVERTENCIA: La URL de la API para productos sellados no ha sido configurada en index.js. Reemplaza 'YOUR_SEALED_PRODUCTS_SHEETDB_ID' con tu ID real de SheetDB.");
        sealedProductsContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: red;">Error: URL de API para Productos Sellados no configurada.</p>';
        return;
    }

    try {
        // Usar la función getCacheBustingUrl para asegurar que siempre se obtengan los datos frescos
        const response = await fetch(getCacheBustingUrl(SHEETDB_SEALED_PRODUCTS_API_URL), { cache: 'no-cache' }); // Añadido cache: 'no-cache'
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allSealedProducts = await response.json();
        
        populateSealedProductTypeFilter(allSealedProducts);
        applySealedProductFilters();
    } catch (error) {
        console.error("Error cargando productos sellados:", error);
        showMessageModal("Error", "No se pudieron cargar los productos sellados. Inténtalo de nuevo más tarde.");
    }
}

function populateSealedProductTypeFilter(products) {
    const types = new Set();
    products.forEach(product => {
        if (product.tipo_producto) {
            types.add(product.tipo_producto.trim());
        }
    });
    const sortedTypes = Array.from(types).sort();

    sealedTypeFilter.innerHTML = '<option value="">Todos los tipos</option>';
    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        sealedTypeFilter.appendChild(option);
    });
}

function applySealedProductFilters() {
    const searchTerm = sealedSearchInput.value.toLowerCase();
    const selectedType = sealedTypeFilter.value;

    filteredSealedProducts = allSealedProducts.filter(product => {
        const matchesSearch = (product.producto && product.producto.toLowerCase().includes(searchTerm)) || 
                              (product.id_producto && product.id_producto.toLowerCase().includes(searchTerm));
        const matchesType = selectedType === "" || (product.tipo_producto && product.tipo_producto === selectedType); 
        
        return matchesSearch && matchesType;
    });

    currentSealedPage = 1;
    renderSealedProducts(filteredSealedProducts);
}

function renderSealedProducts(productsToRender) {
    sealedProductsContainer.innerHTML = '';

    const startIndex = (currentSealedPage - 1) * sealedProductsPerPage;
    const endIndex = startIndex + sealedProductsPerPage;
    const paginatedProducts = productsToRender.slice(startIndex, endIndex);

    if (paginatedProducts.length === 0) {
        sealedProductsContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">No se encontraron productos sellados con los criterios de búsqueda/filtro.</p>';
    }

    paginatedProducts.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('carta');
        
        // El estado de stock se calcula para deshabilitar el botón, pero no se muestra
        const isOutOfStock = parseInt(product.stock) === 0;

        productDiv.innerHTML = `
            <img src="${product.imagen || 'https://placehold.co/150x200/E0E0E0/white?text=No+Img'}" alt="${product.producto}" onerror="this.onerror=null; this.src='https://placehold.co/150x200/E0E0E0/white?text=No+Img';">
            <h4>${product.producto}</h4>
            ${product.tipo_producto ? `<p>Tipo: ${product.tipo_producto}</p>` : ''}
            <p>Precio: $${parseFloat(product.precio).toFixed(2)}</p>
            <div class="quantity-controls">
                <button class="decrease-quantity" data-id="${product.id_producto}" ${isOutOfStock ? 'disabled' : ''}>-</button>
                <input type="number" class="quantity-input" data-id="${product.id_producto}" value="1" min="1" max="${product.stock}" ${isOutOfStock ? 'disabled' : ''}>
                <button class="increase-quantity" data-id="${product.id_producto}" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            <button class="agregar-carrito" data-id="${product.id_producto}" data-name="${product.producto}" data-price="${product.precio}" data-image="${product.imagen}" data-type="sealed" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
            </button>
        `;
        sealedProductsContainer.appendChild(productDiv);
    });

    updateSealedPaginationControls(productsToRender.length);
    attachSealedProductEventListeners();
}

function updateSealedPaginationControls(totalProductsCount) {
    const totalPages = Math.ceil(totalProductsCount / sealedProductsPerPage);
    sealedPageInfo.textContent = `Página ${currentSealedPage} de ${totalPages || 1}`;

    sealedPrevPageBtn.disabled = currentSealedPage === 1;
    sealedNextPageBtn.disabled = currentSealedPage === totalPages || totalPages === 0;
}

function attachSealedProductEventListeners() {
    document.querySelectorAll('#sealedProductsContainer .increase-quantity').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const input = document.querySelector(`#sealedProductsContainer .quantity-input[data-id="${id}"]`);
            if (input) {
                const max = parseInt(input.max);
                let value = parseInt(input.value);
                if (value < max) {
                    input.value = value + 1;
                }
            }
        });
    });

    document.querySelectorAll('#sealedProductsContainer .decrease-quantity').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const input = document.querySelector(`#sealedProductsContainer .quantity-input[data-id="${id}"]`);
            if (input) {
                let value = parseInt(input.value);
                if (value > 1) {
                    input.value = value - 1;
                }
            }
        });
    });

    document.querySelectorAll('#sealedProductsContainer .quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            const min = parseInt(e.target.min);
            const max = parseInt(e.target.max);
            if (isNaN(value) || value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
        });
    });

    document.querySelectorAll('#sealedProductsContainer .agregar-carrito').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            const image = e.target.dataset.image;
            const quantityInput = document.querySelector(`#sealedProductsContainer .quantity-input[data-id="${id}"]`);
            const quantity = parseInt(quantityInput.value);

            addToCart({ id, name, price, image, quantity, type: 'sealed_product' });
        });
    });
}

sealedPrevPageBtn.addEventListener('click', () => {
    if (currentSealedPage > 1) {
        currentSealedPage--;
        renderSealedProducts(filteredSealedProducts);
    }
});

sealedNextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredSealedProducts.length / sealedProductsPerPage);
    if (currentSealedPage < totalPages) {
        currentSealedPage++;
        renderSealedProducts(filteredSealedProducts);
    }
});

sealedSearchInput.addEventListener('input', applySealedProductFilters);
sealedTypeFilter.addEventListener('change', applySealedProductFilters);


// ===============================================
// LÓGICA DEL CARRITO
// ===============================================
abrirCarritoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderCart();
    showModal(modalCarrito);
});

cerrarCarritoBtn.addEventListener('click', () => {
    hideModal(modalCarrito);
});

function addToCart(item) {
    const existingItemIndex = cartItems.findIndex(i => i.id === item.id && i.type === item.type);

    if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += item.quantity;
    } else {
        cartItems.push(item);
    }
    saveCart();
    showMessageModal("Producto Añadido", `${item.name} ha sido añadido al carrito.`);
}

function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

function renderCart() {
    listaCarrito.innerHTML = '';

    if (cartItems.length === 0) {
        listaCarrito.innerHTML = '<p style="text-align: center;">El carrito está vacío.</p>';
        return;
    }

    cartItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `
            <img src="${item.image || 'https://placehold.co/70x70/E0E0E0/white?text=No+Img'}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <div class="quantity-controls-cart">
                <button class="decrease-cart" data-id="${item.id}" data-type="${item.type}">-</button>
                <input type="number" class="quantity-input-cart" data-id="${item.id}" data-type="${item.type}" value="${item.quantity}" min="1">
                <button class="increase-cart" data-id="${item.id}" data-type="${item.type}">+</button>
            </div>
            <button class="eliminar-item" data-id="${item.id}" data-type="${item.type}">Eliminar</button>
        `;
        listaCarrito.appendChild(itemDiv);
    });

    attachCartItemEventListeners();
}

function attachCartItemEventListeners() {
    document.querySelectorAll('.increase-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            updateCartItemQuantity(id, type, 1);
        });
    });

    document.querySelectorAll('.decrease-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            updateCartItemQuantity(id, type, -1);
        });
    });

    document.querySelectorAll('.quantity-input-cart').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            const newQuantity = parseInt(e.target.value);
            if (!isNaN(newQuantity) && newQuantity >= 1) {
                updateCartItemQuantityToValue(id, type, newQuantity);
            } else {
                renderCart();
            }
        });
    });

    document.querySelectorAll('.eliminar-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            removeFromCart(id, type);
        });
    });
}

function updateCartItemQuantity(id, type, delta) {
    const itemIndex = cartItems.findIndex(item => item.id === id && item.type === type);
    if (itemIndex > -1) {
        cartItems[itemIndex].quantity += delta;
        if (cartItems[itemIndex].quantity <= 0) {
            cartItems.splice(itemIndex, 1);
        }
        saveCart();
        renderCart();
    }
}

function updateCartItemQuantityToValue(id, type, value) {
    const itemIndex = cartItems.findIndex(item => item.id === id && item.type === type);
    if (itemIndex > -1) {
        cartItems[itemIndex].quantity = value;
        saveCart();
        renderCart();
    }
}

function removeFromCart(id, type) {
    cartItems = cartItems.filter(item => !(item.id === id && item.type === type));
    saveCart();
    renderCart();
}

vaciarCarritoBtn.addEventListener('click', () => {
    cartItems = [];
    saveCart();
    renderCart();
    showMessageModal("Carrito Vacío", "Tu carrito ha sido vaciado.");
});

enviarWhatsappBtn.addEventListener('click', () => {
    if (cartItems.length === 0) {
        showMessageModal("Carrito Vacío", "No hay elementos en el carrito para enviar.");
        return;
    }

    let message = "¡Hola! Mi pedido de DND TCG es:\n\n";
    cartItems.forEach(item => {
        message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    message += `\nTotal: $${total.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
});

// ===============================================
// LÓGICA DEL MODAL DE MENSAJES
// ===============================================
function showMessageModal(title, text) {
    messageModalTitle.textContent = title;
    messageModalText.textContent = text;
    showModal(messageModal);
}

closeMessageModalBtn.addEventListener('click', () => {
    hideModal(messageModal);
});

okMessageModalBtn.addEventListener('click', () => {
    hideModal(messageModal);
});

// ===============================================
// INICIALIZACIÓN
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});
