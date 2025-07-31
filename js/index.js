// ==========================================================================
// GLOBAL VARIABLES AND DOM REFERENCES
// ==========================================================================

// Firebase and Firestore SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Firebase configuration
// Esta es la configuración REAL de tu proyecto Firebase 'dndtcgadmin'.
// Copiada directamente desde tu archivo admin.js.
const firebaseConfig = {
    apiKey: "AIzaSyDjRTOnQ4d9-4l_W-EwRbYNQ8xkTLKbwsM",
    authDomain: "dndtcgadmin.firebaseapp.com",
    projectId: "dndtcgadmin",
    storageBucket: "dndtcgadmin.firebasbasestorage.app",
    messagingSenderId: "754642671504",
    appId: "1:754642671504:web:c087cc703862cf8c228515",
    measurementId: "G-T8KRZX5S7R"
};

// Initialize Firebase with the obtained configuration
let app;
let db;
let auth;

// Initialize Firebase only if config is available (should always be true with hardcoded config)
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) { // Basic check for valid config
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} else {
    console.error('Firebase configuration is incomplete or invalid. Firebase services will not be initialized.');
    showMessageModal('Error de Configuración', 'La aplicación no pudo cargar la configuración de Firebase. Por favor, asegúrate de que los valores de configuración de Firebase sean correctos en index.js.');
}

// Application ID and User ID
// Usamos el projectId de firebaseConfig como appId si __app_id no está definido.
const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId || 'default-app-id';
let userId = null; // Will be set after authentication

// SheetDB URLs for READ operations (these can be in the frontend for GET requests)
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau";
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp";

let allCards = [];
let allSealedProducts = [];
// El carrito ahora solo almacena el ID, tipo y cantidad. El precio y nombre se obtienen de allCards/allSealedProducts.
let cart = JSON.parse(localStorage.getItem('cart')) || {}; // Load cart from localStorage
let currentCardsPage = 1;
let currentSealedProductsPage = 1;
const itemsPerPage = 10;

// DOM Element References (declared globally for access by all functions)
const abrirModalProductosBtn = document.getElementById('abrirModalProductos');
const productSelectionModal = document.getElementById('productSelectionModal');
const closeProductSelectionModalBtn = document.getElementById('closeProductSelectionModal');
const openCardsModalBtn = document.getElementById('openCardsModalBtn');
const openSealedProductsModalBtn = document.getElementById('openSealedProductsModalBtn');

const cardsModal = document.getElementById('cardsModal');
const closeCardsModalBtn = document.getElementById('closeCardsModal');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const cardsContainer = document.getElementById('cardsContainer');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

const sealedProductsModal = document.getElementById('sealedProductsModal');
const closeSealedProductsModalBtn = document.getElementById('closeSealedProductsModal');
const sealedSearchInput = document.getElementById('sealedSearchInput');
const sealedTypeFilter = document.getElementById('sealedTypeFilter');
const sealedProductsContainer = document.getElementById('sealedProductsContainer');
const sealedPrevPageBtn = document.getElementById('sealedPrevPageBtn');
const sealedNextPageBtn = document.getElementById('sealedNextPageBtn');
const sealedPageInfo = document.getElementById('sealedPageInfo');

const abrirCarritoBtn = document.getElementById('abrirCarrito');
const modalCarrito = document.getElementById('modalCarrito');
const cerrarCarritoBtn = document.getElementById('cerrarCarrito');
const listaCarrito = document.getElementById('lista-carrito');
const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
const openCheckoutModalBtn = document.getElementById('openCheckoutModalBtn');

const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModalBtn = document.getElementById('closeCheckoutModal');
const checkoutForm = document.getElementById('checkoutForm');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput = document.getElementById('customerPhone');
const customerAddressInput = document.getElementById('customerAddress');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const checkoutLoadingSpinner = document.getElementById('checkoutLoadingSpinner');

const messageModal = document.getElementById('messageModal');
const closeMessageModalBtn = document.getElementById('closeMessageModal');
const messageModalTitle = document.getElementById('messageModalTitle');
const messageModalText = document.getElementById('messageModalText');
const okMessageModalBtn = document.getElementById('okMessageModal');

// NUEVA REFERENCIA DOM para el botón "Ver Todas las Cartas"
const viewAllCardsBtn = document.getElementById('viewAllCardsBtn');
// NUEVA REFERENCIA DOM para el contenedor de cartas flotantes dinámicas
const dynamicFloatingCardsContainer = document.getElementById('dynamicFloatingCardsContainer');

// NUEVA REFERENCIA DOM para la notificación "Agregado al carrito"
const addedToCartNotification = document.getElementById('addedToCartNotification');


// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Displays a custom message modal.
 * @param {string} title - The title of the message.
 * @param {string} message - The message content.
 */
function showMessageModal(title, message) {
    messageModalTitle.textContent = title;
    messageModalText.textContent = message;
    messageModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the custom message modal.
 */
function closeMessageModal() {
    messageModal.style.display = 'none';
    document.body.style.overflow = '';
}

/**
 * Muestra una pequeña notificación temporal "Agregado al carrito".
 * @param {string} itemName - El nombre del artículo agregado.
 */
function showAddedToCartNotification(itemName) {
    if (addedToCartNotification) {
        addedToCartNotification.textContent = `${itemName} agregado al carrito`;
        addedToCartNotification.classList.add('show');
        setTimeout(() => {
            addedToCartNotification.classList.remove('show');
        }, 1500); // Oculta el mensaje después de 1.5 segundos
    }
}

/**
 * Opens a given modal element.
 * @param {HTMLElement} modalElement - The modal DOM element to open.
 */
function openModal(modalElement) {
    if (modalElement) { // Added null check
        modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling on the body
    }
}

/**
 * Closes a given modal element.
 * @param {HTMLElement} modalElement - The modal DOM element to close.
 */
function closeModal(modalElement) {
    if (modalElement) { // Added null check
        modalElement.style.display = 'none';
        document.body.style.overflow = ''; // Restore body scrolling
    }
}

/**
 * Saves the current cart to localStorage.
 */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ==========================================================================
// DATA LOADING FUNCTIONS
// ==========================================================================

/**
 * Loads all cards data from SheetDB.
 */
async function loadCardsData() {
    try {
        const response = await fetch(SHEETDB_CARDS_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Ensure price and stock are numbers when loading
        allCards = (await response.json()).map(card => ({
            ...card,
            precio: parseFloat(card.precio) || 0,
            stock: parseInt(card.stock) || 0
        }));
        populateCategoryFilter();
        renderCards();
        renderFloatingCards(); // Call this to display cards on the main page
    } catch (error) {
        console.error('Error loading cards data:', error);
        showMessageModal('Error de Carga', 'No se pudieron cargar las cartas. Inténtalo de nuevo más tarde.');
    }
}

/**
 * Loads all sealed products data from SheetDB.
 */
async function loadSealedProductsData() {
    try {
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Ensure price and stock are numbers when loading
        allSealedProducts = (await response.json()).map(product => ({
            ...product,
            precio: parseFloat(product.precio) || 0,
            stock: parseInt(product.stock) || 0
        }));
        populateSealedTypeFilter();
        renderSealedProducts();
    } catch (error) {
        console.error('Error loading sealed products data:', error);
        showMessageModal('Error de Carga', 'No se pudieron cargar los productos sellados. Inténtalo de nuevo más tarde.');
    }
}

/**
 * Populates the category filter dropdown for cards.
 */
function populateCategoryFilter() {
    const categories = [...new Set(allCards.map(card => card.categoria))].filter(Boolean); // Get unique categories, filter out empty
    if (categoryFilter) { // Added null check
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
}

/**
 * Populates the type filter dropdown for sealed products.
 */
function populateSealedTypeFilter() {
    const types = [...new Set(allSealedProducts.map(product => product.tipo_producto))].filter(Boolean); // Get unique types, filter out empty
    if (sealedTypeFilter) { // Added null check
        sealedTypeFilter.innerHTML = '<option value="">Todos los tipos</option>';
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            sealedTypeFilter.appendChild(option);
        });
    }
}

// ==========================================================================
// RENDERING FUNCTIONS
// ==========================================================================

/**
 * Renders a selection of cards in the floating section on the main page.
 */
function renderFloatingCards() {
    if (!dynamicFloatingCardsContainer) return; // Ensure element exists

    dynamicFloatingCardsContainer.innerHTML = ''; // Clear previous cards

    // Get a subset of cards to display (e.g., first 5 or random 5)
    // For simplicity, let's take the first 5 available cards that have an image.
    // CORRECCIÓN: Aseguramos que 'imagen' sea una URL válida antes de usarla
    const cardsToDisplay = allCards.filter(card => card.imagen && typeof card.imagen === 'string' && card.imagen.startsWith('http')).slice(0, 5);

    if (cardsToDisplay.length === 0) {
        dynamicFloatingCardsContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">No hay cartas disponibles para mostrar.</p>';
        return;
    }

    cardsToDisplay.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('floating-card');
        // Use a CSS custom property for animation delay
        cardElement.style.setProperty('--i', index + 1); 
        cardElement.innerHTML = `
            <img src="${card.imagen}" alt="${card.nombre}" onerror="this.onerror=null;this.src='https://placehold.co/150x210/cccccc/333333?text=No+Image';" />
        `;
        dynamicFloatingCardsContainer.appendChild(cardElement);
    });
}


/**
 * Renders cards based on current filters and pagination.
 */
function renderCards() {
    if (!cardsContainer || !searchInput || !categoryFilter || !pageInfo || !prevPageBtn || !nextPageBtn) { // Added null checks
        console.warn("One or more DOM elements for cards rendering are missing. Check index.html IDs.");
        return;
    }
    cardsContainer.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    let filteredCards = allCards.filter(card => {
        const matchesSearch = card.nombre.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || card.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredCards.sort((a, b) => a.nombre.localeCompare(b.nombre)); // Sort alphabetically by name

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const startIndex = (currentCardsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    if (cardsToDisplay.length === 0) {
        cardsContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">No se encontraron cartas.</p>';
    }

    cardsToDisplay.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('carta');
        // El input de cantidad ahora siempre inicia en 1 para "añadir"
        cardElement.innerHTML = `
            <img src="${card.imagen}" alt="${card.nombre}" onerror="this.onerror=null;this.src='https://placehold.co/180x250/cccccc/333333?text=No+Image';" />
            <h4>${card.nombre}</h4>
            <p>Precio: $${card.precio.toFixed(2)}</p>
            <p>Stock: ${card.stock}</p>
            <div class="quantity-controls">
                <button class="decrease-quantity" data-id="${card.id}" data-type="card">-</button>
                <input type="number" class="quantity-input" value="1" min="1" max="${card.stock}" data-id="${card.id}" data-type="card">
                <button class="increase-quantity" data-id="${card.id}" data-type="card">+</button>
            </div>
            <button class="agregar-carrito" data-id="${card.id}" data-type="card" ${card.stock === 0 ? 'disabled' : ''}>
                ${card.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
            </button>
        `;
        cardsContainer.appendChild(cardElement);
    });

    updatePaginationControls(currentCardsPage, totalPages, pageInfo, prevPageBtn, nextPageBtn, filteredCards.length);
}

/**
 * Renders sealed products based on current filters and pagination.
 */
function renderSealedProducts() {
    if (!sealedProductsContainer || !sealedSearchInput || !sealedTypeFilter || !sealedPageInfo || !sealedPrevPageBtn || !sealedNextPageBtn) { // Added null checks
        console.warn("One or more DOM elements for sealed products rendering are missing. Check index.html IDs.");
        return;
    }
    sealedProductsContainer.innerHTML = '';
    const searchTerm = sealedSearchInput.value.toLowerCase();
    const selectedType = sealedTypeFilter.value;

    let filteredProducts = allSealedProducts.filter(product => {
        const matchesSearch = product.producto.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === '' || product.tipo_producto === selectedType;
        return matchesSearch && matchesType;
    });

    filteredProducts.sort((a, b) => a.producto.localeCompare(b.producto)); // Sort alphabetically by name

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentSealedProductsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    if (productsToDisplay.length === 0) {
        sealedProductsContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">No se encontraron productos sellados.</p>';
    }

    productsToDisplay.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('carta'); // Reusing 'carta' class for styling consistency
        // El input de cantidad ahora siempre inicia en 1 para "añadir"
        productElement.innerHTML = `
            <img src="${product.imagen}" alt="${product.producto}" onerror="this.onerror=null;this.src='https://placehold.co/180x250/cccccc/333333?text=No+Image';" />
            <h4>${product.producto}</h4>
            <p>Tipo: ${product.tipo_producto}</p>
            <p>Precio: $${product.precio.toFixed(2)}</p>
            <p>Stock: ${product.stock}</p>
            <div class="quantity-controls">
                <button class="decrease-quantity" data-id="${product.id_producto}" data-type="sealed">-</button>
                <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" data-id="${product.id_producto}" data-type="sealed">
                <button class="increase-quantity" data-id="${product.id_producto}" data-type="sealed">+</button>
            </div>
            <button class="agregar-carrito" data-id="${product.id_producto}" data-type="sealed" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'Agotado' : 'Añadir al Carrito'}
            </button>
        `;
        sealedProductsContainer.appendChild(productElement);
    });

    updatePaginationControls(currentSealedProductsPage, totalPages, sealedPageInfo, sealedPrevPageBtn, sealedNextPageBtn, filteredProducts.length);
}

/**
 * Updates pagination controls (page info, prev/next button states).
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {HTMLElement} infoSpan - The span element displaying page info.
 * @param {HTMLElement} prevBtn - The previous page button element.
 * @param {HTMLElement} nextBtn - The next page button element.
 * @param {number} totalItems - The total count of filtered items.
 */
function updatePaginationControls(currentPage, totalPages, infoSpan, prevBtn, nextBtn, totalItems) {
    if (!infoSpan || !prevBtn || !nextBtn) return; // Added null checks
    infoSpan.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} items)`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Renders the shopping cart content.
 */
function renderCart() {
    if (!listaCarrito || !vaciarCarritoBtn || !openCheckoutModalBtn) { // Added null checks
        console.warn("One or more DOM elements for cart rendering are missing. Check index.html IDs.");
        return;
    }
    listaCarrito.innerHTML = '';
    let total = 0;

    if (Object.keys(cart).length === 0) {
        listaCarrito.innerHTML = '<p style="text-align: center; color: #666;">El carrito está vacío.</p>';
        vaciarCarritoBtn.disabled = true;
        openCheckoutModalBtn.disabled = true;
        return;
    } else {
        vaciarCarritoBtn.disabled = false;
        openCheckoutModalBtn.disabled = false;
    }

    for (const id in cart) {
        const item = cart[id];
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');

        let imageUrl = '';
        let itemName = '';
        let itemPrice = 0;
        let itemStock = 0;

        if (item.type === 'card') {
            const card = allCards.find(c => c.id === id);
            if (card) {
                imageUrl = card.imagen;
                itemName = card.nombre;
                itemPrice = card.precio;
                itemStock = card.stock;
            }
        } else if (item.type === 'sealed') {
            const product = allSealedProducts.find(p => p.id_producto === id);
            if (product) {
                imageUrl = product.imagen;
                itemName = product.producto;
                itemPrice = product.precio;
                itemStock = product.stock;
            }
        }

        itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${itemName}" onerror="this.onerror=null;this.src='https://placehold.co/70x70/cccccc/333333?text=No+Image';" />
            <div class="item-details">
                <h4>${itemName}</h4>
                <p>Precio: $${itemPrice.toFixed(2)}</p>
                <p>Subtotal: $${(item.quantity * itemPrice).toFixed(2)}</p>
            </div>
            <div class="cart-item-controls-wrapper"> <!-- NUEVO: Wrapper para los controles de cantidad y eliminar -->
                <div class="quantity-controls-cart">
                    <button class="decrease-cart-quantity" data-id="${id}" data-type="${item.type}">-</button>
                    <input type="number" class="quantity-input-cart" value="${cart[id] ? cart[id].quantity : 0}" min="1" max="${itemStock}" data-id="${id}" data-type="${item.type}">
                    <button class="increase-cart-quantity" data-id="${id}" data-type="${item.type}">+</button>
                </div>
                <button class="eliminar-item" data-id="${id}" data-type="${item.type}">Eliminar</button>
            </div>
        `;
        listaCarrito.appendChild(itemElement);
        total += item.quantity * itemPrice;
    }

    const totalElement = document.createElement('div');
    totalElement.classList.add('cart-total');
    totalElement.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3>`;
    listaCarrito.appendChild(totalElement);
}

// ==========================================================================
// CART MANAGEMENT FUNCTIONS
// ==========================================================================

/**
 * Adds an item to the cart or updates its quantity.
 * @param {string} id - The ID of the item.
 * @param {string} type - The type of the item ('card' or 'sealed').
 * @param {number} quantityToAdd - La cantidad que se intenta añadir.
 * @param {boolean} [showNotification=true] - Si se debe mostrar la notificación "Agregado al carrito".
 */
function addToCart(id, type, quantityToAdd, showNotification = true) {
    let item = null;
    let currentStock = 0;
    let itemName = ''; // Para la notificación

    if (type === 'card') {
        item = allCards.find(c => c.id === id);
        currentStock = item ? item.stock : 0;
        itemName = item ? item.nombre : 'Artículo';
    } else if (type === 'sealed') {
        item = allSealedProducts.find(p => p.id_producto === id);
        currentStock = item ? item.stock : 0;
        itemName = item ? item.producto : 'Artículo';
    }

    if (!item) {
        showMessageModal('Error', 'Producto no encontrado.');
        return;
    }

    const currentQuantityInCart = cart[id] ? cart[id].quantity : 0;
    const newQuantity = currentQuantityInCart + quantityToAdd;

    // Lógica para no exceder el stock disponible
    if (newQuantity > currentStock) {
        showMessageModal('Stock Insuficiente', `Solo hay ${currentStock} unidades de "${itemName}" disponibles. No se puede añadir ${quantityToAdd} más.`);
        return; // No se agrega al carrito si excede el stock
    }

    if (newQuantity <= 0) {
        delete cart[id];
    } else {
        cart[id] = {
            id: id,
            type: type,
            quantity: newQuantity
        };
    }
    saveCart();
    renderCart();
    renderCards(); // Re-render cards to update quantity inputs (which will now reset to 1)
    renderSealedProducts(); // Re-render sealed products to update quantity inputs (which will now reset to 1)

    // Mostrar notificación solo si showNotification es true y la cantidad es mayor a 0
    if (showNotification && quantityToAdd > 0) { // Notificación basada en la cantidad que se intentó añadir
        showAddedToCartNotification(itemName);
    }
}

/**
 * Removes an item from the cart.
 * @param {string} id - The ID of the item to remove.
 */
function removeFromCart(id) {
    delete cart[id];
    saveCart();
    renderCart();
    renderCards(); // Re-render cards to update quantity inputs
    renderSealedProducts(); // Re-render sealed products to update quantity inputs
}

/**
 * Empties the entire cart.
 */
function clearCart() {
    cart = {};
    saveCart();
    renderCart();
    renderCards(); // Re-render cards to update quantity inputs
    renderSealedProducts(); // Re-render sealed products to update quantity inputs
}

// ==========================================================================
// CHECKOUT FUNCTIONS
// ==========================================================================

/**
 * Handles the order confirmation and sends a WhatsApp message.
 */
async function confirmOrder() {
    if (!customerNameInput || !customerPhoneInput || !customerAddressInput || !confirmOrderBtn || !checkoutLoadingSpinner) { // Added null checks
        console.warn("One or more DOM elements for checkout are missing. Check index.html IDs.");
        return;
    }
    const customerName = customerNameInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();

    if (!customerName || !customerPhone || !customerAddress) {
        showMessageModal('Error', 'Por favor, completa todos los campos del formulario.');
        return;
    }

    if (Object.keys(cart).length === 0) {
        showMessageModal('Carrito Vacío', 'No hay productos en tu carrito para realizar un pedido.');
        return;
    }

    confirmOrderBtn.disabled = true;
    checkoutLoadingSpinner.style.display = 'inline-block';

    let orderDetails = '¡Nuevo pedido de DND TCG!\n\n';
    orderDetails += `Cliente: ${customerName}\n`;
    orderDetails += `Teléfono: ${customerPhone}\n`;
    orderDetails += `Dirección: ${customerAddress}\n\n`;
    orderDetails += 'Detalles del Pedido:\n';

    let totalOrderPrice = 0;

    for (const id in cart) {
        const item = cart[id];
        let productInfo = null;
        if (item.type === 'card') {
            productInfo = allCards.find(c => c.id === id);
        } else if (item.type === 'sealed') {
            productInfo = allSealedProducts.find(p => p.id_producto === id);
        }

        if (productInfo) {
            const subtotal = item.quantity * productInfo.precio;
            orderDetails += `- ${item.quantity}x ${productInfo.nombre || productInfo.producto} ($${productInfo.precio.toFixed(2)} c/u) - Subtotal: $${subtotal.toFixed(2)}\n`;
            totalOrderPrice += subtotal;
        }
    }

    orderDetails += `\nTotal del Pedido: $${totalOrderPrice.toFixed(2)}\n\n`;
    orderDetails += '¡Gracias por tu compra!';

    // Encode the message for WhatsApp URL
    const whatsappMessage = encodeURIComponent(orderDetails);
    const whatsappUrl = `https://wa.me/50377478050?text=${whatsappMessage}`; // Replace with your WhatsApp number

    // Simulate sending order to backend (e.g., Firestore)
    try {
        // Ensure db is initialized before attempting Firestore operations
        if (!db) {
            throw new Error('Firestore is not initialized.');
        }

        // Add order to Firestore
        await addDoc(collection(db, `artifacts/${appId}/public/data/orders`), {
            customerName,
            customerPhone,
            customerAddress,
            cart: JSON.stringify(cart), // Store cart as string to handle complex objects
            total: totalOrderPrice,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');

        showMessageModal('Pedido Confirmado', 'Tu pedido ha sido enviado. ¡Gracias por tu compra! Serás redirigido a WhatsApp para finalizar la comunicación.');
        clearCart(); // Clear cart after successful order
        closeModal(checkoutModal); // Close checkout modal
        checkoutForm.reset(); // Reset form
        
        // Re-render products to reflect updated stock (if you implement stock deduction)
        await loadCardsData();
        await loadSealedProductsData();

    } catch (error) {
        console.error('Error al confirmar el pedido o enviar a Firestore:', error);
        showMessageModal('Error al Confirmar', `Hubo un problema al procesar tu pedido: ${error.message}. Por favor, inténtalo de nuevo.`);
    } finally {
        confirmOrderBtn.disabled = false;
        checkoutLoadingSpinner.style.display = 'none';
    }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

// Firebase Auth State Listener and Initial Sign-In Logic
// Separamos la lógica de inicio de sesión inicial del listener para mayor claridad.
if (auth) {
    // 1. Escuchamos los cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            console.log('User is signed in with UID:', userId);
            // Cuando el usuario está autenticado, cargamos los datos
            loadCardsData();
            loadSealedProductsData();
        } else {
            // El usuario no está autenticado (puede ser la primera carga)
            console.log('No user is currently signed in.');
            // En este punto, no hacemos nada. La lógica de inicio de sesión
            // inicial se ejecutará una sola vez fuera de este listener.
        }
    });

    // 2. Intentamos iniciar sesión de forma inicial si no hay un usuario
    // Ya que el token de Canvas no estará en Netlify, usamos la autenticación anónima
    // directamente, con un robusto manejo de errores.
    async function handleInitialAuth() {
        try {
            // Si el token de Canvas está definido, lo usamos.
            // En Netlify, esta condición será falsa.
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log('Successfully signed in with custom token.');
            } else {
                // Si no estamos en el entorno de Canvas, intentamos un inicio de sesión anónimo
                await signInAnonymously(auth);
                console.log('Successfully signed in anonymously.');
            }
        } catch (error) {
            console.error('Error during initial sign-in attempt:', error);
            showMessageModal('Error de Autenticación', 'No se pudo iniciar sesión. La tienda podría no funcionar correctamente. Por favor, revisa la configuración de Firebase.');
        }
    }

    // Llamamos a la función de autenticación inicial
    handleInitialAuth();

} else {
    // If auth is not initialized, log an error and potentially show a message
    console.error('Firebase Auth is not initialized. User authentication and Firestore operations will not work.');
    showMessageModal('Error de Inicio', 'La autenticación no está disponible. Por favor, recarga la página o contacta al soporte.');
    // Incluso si Firebase Auth no se inicializa, intentamos cargar los datos de SheetDB
    // para que la tienda sea funcional aunque no se guarden pedidos en Firestore.
    loadCardsData();
    loadSealedProductsData();
}


document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for modals
    if (abrirModalProductosBtn) abrirModalProductosBtn.addEventListener('click', () => openModal(productSelectionModal));
    if (closeProductSelectionModalBtn) closeProductSelectionModalBtn.addEventListener('click', () => closeModal(productSelectionModal));
    if (openCardsModalBtn) openCardsModalBtn.addEventListener('click', () => {
        closeModal(productSelectionModal);
        openModal(cardsModal);
        currentCardsPage = 1; // Reset pagination when opening
        if (searchInput) searchInput.value = ''; // Clear search
        if (categoryFilter) categoryFilter.value = ''; // Clear filter
        renderCards();
    });
    if (openSealedProductsModalBtn) openSealedProductsModalBtn.addEventListener('click', () => {
        closeModal(productSelectionModal);
        openModal(sealedProductsModal);
        currentSealedProductsPage = 1; // Reset pagination when opening
        if (sealedSearchInput) sealedSearchInput.value = ''; // Clear search
        if (sealedTypeFilter) sealedTypeFilter.value = ''; // Clear filter
        renderSealedProducts();
    });

    if (closeCardsModalBtn) closeCardsModalBtn.addEventListener('click', () => closeModal(cardsModal));
    if (closeSealedProductsModalBtn) closeSealedProductsModalBtn.addEventListener('click', () => closeModal(sealedProductsModal));

    if (abrirCarritoBtn) abrirCarritoBtn.addEventListener('click', () => {
        renderCart();
        openModal(modalCarrito);
    });
    if (cerrarCarritoBtn) cerrarCarritoBtn.addEventListener('click', () => closeModal(modalCarrito));

    if (openCheckoutModalBtn) openCheckoutModalBtn.addEventListener('click', () => {
        closeModal(modalCarrito); // Close cart modal
        openModal(checkoutModal); // Open checkout modal
    });
    if (closeCheckoutModalBtn) closeCheckoutModalBtn.addEventListener('click', () => closeModal(checkoutModal));

    if (okMessageModalBtn) okMessageModalBtn.addEventListener('click', closeMessageModal);
    if (closeMessageModalBtn) closeMessageModalBtn.addEventListener('click', closeMessageModal);


    // Event listeners for card/product list interactions
    if (searchInput) searchInput.addEventListener('input', () => {
        currentCardsPage = 1;
        renderCards();
    });
    if (categoryFilter) categoryFilter.addEventListener('change', () => {
        currentCardsPage = 1;
        renderCards();
    });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        if (currentCardsPage > 1) {
            currentCardsPage--;
            renderCards();
        }
    });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const filteredCards = allCards.filter(card => {
            const matchesSearch = card.nombre.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || card.categoria === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
        if (currentCardsPage < totalPages) {
            currentCardsPage++;
            renderCards();
        }
    });

    if (sealedSearchInput) sealedSearchInput.addEventListener('input', () => {
        currentSealedProductsPage = 1;
        renderSealedProducts();
    });
    if (sealedTypeFilter) sealedTypeFilter.addEventListener('change', () => {
        currentSealedProductsPage = 1;
        renderSealedProducts();
    });
    if (sealedPrevPageBtn) sealedPrevPageBtn.addEventListener('click', () => {
        if (currentSealedProductsPage > 1) {
            currentSealedProductsPage--;
            renderSealedProducts();
        }
    });
    if (sealedNextPageBtn) sealedNextPageBtn.addEventListener('click', () => {
        const searchTerm = sealedSearchInput.value.toLowerCase();
        const selectedType = sealedTypeFilter.value;
        const filteredProducts = allSealedProducts.filter(product => {
            const matchesSearch = product.producto.toLowerCase().includes(searchTerm);
            const matchesType = selectedType === '' || product.tipo_producto === selectedType;
            return matchesSearch && matchesType;
        });
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (currentSealedProductsPage < totalPages) {
            currentSealedProductsPage++;
            renderSealedProducts();
        }
    });

    // Delegated event listener for "Add to Cart" and quantity buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('agregar-carrito')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            // Encuentra el input de cantidad asociado a este botón "Añadir al Carrito"
            const quantityInput = e.target.closest('.carta').querySelector('.quantity-input');
            let quantityToAdd = parseInt(quantityInput.value);
            
            // Si la cantidad es inválida o menor a 1, por defecto añadir 1
            if (isNaN(quantityToAdd) || quantityToAdd < 1) {
                quantityToAdd = 1;
                quantityInput.value = 1; // Ajusta el input visualmente si era inválido
            }

            addToCart(id, type, quantityToAdd, true); // Pasa 'true' para mostrar la notificación
            // El input se reiniciará a 1 automáticamente después de renderCards/renderSealedProducts
        } else if (e.target.classList.contains('increase-quantity')) {
            const quantityInput = e.target.parentNode.querySelector('.quantity-input');
            let currentValue = parseInt(quantityInput.value);
            if (isNaN(currentValue)) currentValue = 0; // Manejar caso de input vacío/inválido
            
            // Obtener el stock máximo para esta carta/producto
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            let item = null;
            let currentStock = 0;
            if (type === 'card') {
                item = allCards.find(c => c.id === id);
            } else if (type === 'sealed') {
                item = allSealedProducts.find(p => p.id_producto === id);
            }
            currentStock = item ? item.stock : 0;

            if (currentValue < currentStock) {
                quantityInput.value = currentValue + 1;
            } else {
                showMessageModal('Stock Máximo', `Solo puedes añadir hasta ${currentStock} unidades.`);
            }
            // No se llama a addToCart aquí, solo se actualiza el input
        } else if (e.target.classList.contains('decrease-quantity')) {
            const quantityInput = e.target.parentNode.querySelector('.quantity-input');
            let currentValue = parseInt(quantityInput.value);
            if (isNaN(currentValue)) currentValue = 0; // Manejar caso de input vacío/inválido

            if (currentValue > 1) { // No permitir que baje de 1
                quantityInput.value = currentValue - 1;
            } else {
                showMessageModal('Cantidad Mínima', 'La cantidad mínima a añadir es 1.');
            }
            // No se llama a addToCart aquí, solo se actualiza el input
        } else if (e.target.classList.contains('eliminar-item')) {
            const id = e.target.dataset.id;
            removeFromCart(id);
        } else if (e.target.classList.contains('increase-cart-quantity')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            addToCart(id, type, 1, false); // Pasa 'false' para NO mostrar la notificación
        } else if (e.target.classList.contains('decrease-cart-quantity')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            addToCart(id, type, -1, false); // Pasa 'false' para NO mostrar la notificación
        }
    });

    // Delegated event listener for quantity input changes (manual typing)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            let newQuantity = parseInt(e.target.value);

            let item = null;
            let currentStock = 0;
            let itemName = ''; 

            if (type === 'card') {
                item = allCards.find(c => c.id === id);
                currentStock = item ? item.stock : 0;
                itemName = item ? item.nombre : 'Artículo';
            } else if (type === 'sealed') {
                item = allSealedProducts.find(p => p.id_producto === id);
                currentStock = item ? item.stock : 0;
                itemName = item ? item.producto : 'Artículo';
            }

            if (!item) {
                showMessageModal('Error', 'Producto no encontrado.');
                e.target.value = 1; // Reset to 1 if item not found
                return;
            }

            if (isNaN(newQuantity) || newQuantity < 1) { // Mínimo 1 para añadir
                newQuantity = 1;
                showMessageModal('Cantidad Inválida', 'La cantidad debe ser al menos 1.');
            }
            if (newQuantity > currentStock) {
                newQuantity = currentStock; // Ajusta la cantidad al stock máximo
                showMessageModal('Stock Máximo', `Solo puedes añadir hasta ${currentStock} unidades de "${itemName}".`);
            }

            e.target.value = newQuantity; // Update input value to corrected quantity
            // No se llama a addToCart aquí, solo se valida y ajusta el input
        } else if (e.target.classList.contains('quantity-input-cart')) {
            // Lógica para inputs en el carrito (mantener el comportamiento actual de actualizar el carrito)
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            let newQuantity = parseInt(e.target.value);

            let item = null;
            let currentStock = 0;
            let itemName = ''; 

            if (type === 'card') {
                item = allCards.find(c => c.id === id);
                currentStock = item ? item.stock : 0;
                itemName = item ? item.nombre : 'Artículo';
            } else if (type === 'sealed') {
                item = allSealedProducts.find(p => p.id_producto === id);
                currentStock = item ? item.stock : 0;
                itemName = item ? item.producto : 'Artículo';
            }

            if (!item) {
                showMessageModal('Error', 'Producto no encontrado.');
                return;
            }

            if (isNaN(newQuantity) || newQuantity < 0) {
                newQuantity = 0;
            }
            if (newQuantity > currentStock) {
                newQuantity = currentStock;
                showMessageModal('Stock Insuficiente', `Solo hay ${currentStock} unidades de "${itemName}" disponibles.`);
            }

            e.target.value = newQuantity; // Update input value to corrected quantity

            if (newQuantity === 0) {
                delete cart[id];
            } else {
                cart[id] = {
                    id: id,
                    type: type,
                    quantity: newQuantity
                };
            }
            saveCart();
            renderCart();
            renderCards(); // Re-render to update other quantity inputs
            renderSealedProducts(); // Re-render to update other quantity inputs
        }
    });

    if (vaciarCarritoBtn) vaciarCarritoBtn.addEventListener('click', clearCart);
    if (confirmOrderBtn) confirmOrderBtn.addEventListener('click', confirmOrder);

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === productSelectionModal) closeModal(productSelectionModal);
        if (event.target === cardsModal) closeModal(cardsModal);
        if (event.target === sealedProductsModal) closeModal(sealedProductsModal);
        if (event.target === modalCarrito) closeModal(modalCarrito);
        if (event.target === checkoutModal) closeModal(checkoutModal);
        if (event.target === messageModal) closeModal(messageModal);
    });

    // NUEVO: Event listener para el botón "Ver Todas las Cartas" en la sección flotante
    if (viewAllCardsBtn) {
        viewAllCardsBtn.addEventListener('click', () => {
            openModal(cardsModal); // Abre el modal de cartas
            currentCardsPage = 1; // Reinicia la paginación del modal de cartas
            if (searchInput) searchInput.value = ''; // Limpia el campo de búsqueda
            if (categoryFilter) categoryFilter.value = ''; // Limpia el filtro de categoría
            renderCards(); // Renderiza las cartas en el modal
        });
    }
});
