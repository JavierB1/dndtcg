// Constantes para las APIs de SheetDB
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau"; // URL para tus cartas
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp"; // URL para tu hoja 'producto_sellado'

// ===============================================
// ELEMENTOS DEL DOM - NAVEGACIÓN Y SECCIONES
// ===============================================
const navDashboard = document.getElementById('nav-dashboard');
const navCards = document.getElementById('nav-cards');
const navSealedProducts = document.getElementById('nav-sealed-products');
const navCategories = document.getElementById('nav-categories');
const navLogout = document.getElementById('nav-logout');

const adminContainer = document.querySelector('.admin-container'); // Referencia al contenedor principal
const dashboardSection = document.getElementById('dashboard-section');
const cardsSection = document.getElementById('cards-section');
const sealedProductsSection = document.getElementById('sealed-products-section');
const categoriesSection = document.getElementById('categories-section');

// ===============================================
// ELEMENTOS DEL DOM - GESTIÓN DE CARTAS
// ===============================================
const addCardBtn = document.getElementById('addCardBtn');
const cardsTableBody = document.querySelector('#cardsTable tbody');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminCategoryFilter = document.getElementById('adminCategoryFilter');
const categoryOptionsDatalist = document.getElementById('categoryOptions');

const adminPrevPageBtn = document.getElementById('adminPrevPageBtn');
const adminNextPageBtn = document.getElementById('adminNextPageBtn');
const adminPageInfo = document.getElementById('adminPageInfo');

// Modales y Formularios de Cartas
const cardModal = document.getElementById('cardModal');
const cardModalTitle = document.getElementById('cardModalTitle');
const cardForm = document.getElementById('cardForm');
const cardIdInput = document.getElementById('cardId');
const cardNameInput = document.getElementById('cardName');
const cardImageInput = document.getElementById('cardImage');
const cardPriceInput = document.getElementById('cardPrice');
const cardStockInput = document.getElementById('cardStock');
const cardCategoryInput = document.getElementById('cardCategory');
const saveCardBtn = document.getElementById('saveCardBtn');

// ===============================================
// ELEMENTOS DEL DOM - GESTIÓN DE PRODUCTOS SELLADOS
// ===============================================
const addSealedProductBtn = document.getElementById('addSealedProductBtn'); 
const sealedProductsTableBody = document.querySelector('#sealedProductsTable tbody'); 
const adminSealedSearchInput = document.getElementById('adminSealedSearchInput');
const adminSealedTypeFilter = document.getElementById('adminSealedTypeFilter');
const sealedProductTypeOptionsDatalist = document.getElementById('sealedProductTypeOptions');

const adminSealedPrevPageBtn = document.getElementById('adminSealedPrevPageBtn');
const adminSealedNextPageBtn = document.getElementById('adminSealedNextPageBtn');
const adminSealedPageInfo = document.getElementById('adminSealedPageInfo');

// Modales y Formularios de Productos Sellados
const sealedProductModal = document.getElementById('sealedProductModal');
const sealedProductModalTitle = document.getElementById('sealedProductModalTitle');
const sealedProductForm = document.getElementById('sealedProductForm');
const sealedProductIdInput = document.getElementById('sealedProductId');
const sealedProductNameInput = document.getElementById('sealedProductName'); // Corresponde a 'producto'
const sealedProductImageInput = document.getElementById('sealedProductImage'); // Corresponde a 'imagen'
const sealedProductTypeInput = document.getElementById('sealedProductType'); // Corresponde a 'tipo_producto'
const sealedProductPriceInput = document.getElementById('sealedProductPrice');
const sealedProductStockInput = document.getElementById('sealedProductStock');
const saveSealedProductBtn = document.getElementById('saveSealedProductBtn');

// ===============================================
// ELEMENTOS DEL DOM - GESTIÓN DE CATEGORÍAS
// ===============================================
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoriesTableBody = document.querySelector('#categoriesTable tbody');

// Modales y Formularios de Categorías
const categoryModal = document.getElementById('categoryModal');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const categoryForm = document.getElementById('categoryForm');
const categoryIdInput = document.getElementById('categoryId');
const categoryNameInput = document.getElementById('categoryName');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');

// ===============================================
// ELEMENTOS DEL DOM - MODAL DE CONFIRMACIÓN
// ===============================================
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// ===============================================
// ELEMENTOS DEL DOM - MODAL DE LOGIN
// ===============================================
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const loginBtn = document.getElementById('loginBtn');

// Botón de refrescar panel
const refreshAdminPageBtn = document.getElementById('refreshAdminPageBtn');

// ===============================================
// NUEVO: Elementos del DOM - Modal de Mensajes Personalizado
// Se usará el mismo HTML para el modal de confirmación, pero se cambiará el contenido
const customMessageModal = document.getElementById('confirmModal'); // Reutilizamos el modal de confirmación
const customMessageTitle = confirmModal.querySelector('h3'); // Título del modal de confirmación
const customMessageText = document.getElementById('confirmMessage'); // Párrafo de mensaje de confirmación
const customMessageOkBtn = document.getElementById('confirmDeleteBtn'); // Botón 'Eliminar' se convierte en 'Aceptar'
const customMessageCancelBtn = document.getElementById('cancelDeleteBtn'); // Botón 'Cancelar' se oculta o se convierte en 'Cerrar'


// ===============================================
// VARIABLES GLOBALES PARA DATOS Y PAGINACIÓN
// ===============================================
let allAdminCards = [];
let filteredAdminCards = [];
let adminCurrentPage = 1;
const adminCardsPerPage = 10;

let allAdminSealedProducts = [];
let filteredAdminSealedProducts = [];
let adminSealedCurrentPage = 1;
const adminSealedProductsPerPage = 10;

let allCategories = [];
let allProductTypes = [];

let isAuthenticated = false; // Manejado por JavaScript ahora

// ===============================================
// FUNCIÓN PARA MOSTRAR MENSAJES PERSONALIZADOS
// ===============================================
function showCustomMessageModal(title, message, isError = false) {
    customMessageTitle.textContent = title;
    customMessageText.textContent = message;
    
    // Cambiar la visibilidad y el texto de los botones según sea un mensaje o una confirmación
    customMessageOkBtn.textContent = 'Aceptar';
    customMessageOkBtn.style.backgroundColor = isError ? '#dc3545' : '#28a745'; // Rojo para error, verde para éxito
    customMessageOkBtn.onclick = () => { customMessageModal.style.display = 'none'; }; // Al hacer clic, solo cierra el modal
    
    customMessageCancelBtn.style.display = 'none'; // Ocultar el botón de cancelar para mensajes simples

    customMessageModal.style.display = 'flex';
}

// ===============================================
// GESTIÓN DE LA NAVEGACIÓN ENTRE SECCIONES
// ===============================================
function showSection(sectionToShow) {
    // Asegurarse de que el usuario esté autenticado antes de mostrar secciones
    if (!isAuthenticated) {
        showLoginModal();
        return;
    }

    const sections = [dashboardSection, cardsSection, sealedProductsSection, categoriesSection];
    sections.forEach(section => {
        if (section === sectionToShow) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    document.querySelectorAll('.admin-modal').forEach(modal => {
        if (modal !== loginModal && modal !== customMessageModal) { // Excluir customMessageModal
            modal.style.display = 'none';
        }
    });

    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    if (sectionToShow === dashboardSection) navDashboard.classList.add('active');
    if (sectionToShow === cardsSection) navCards.classList.add('active');
    if (sectionToShow === sealedProductsSection) navSealedProducts.classList.add('active');
    if (sectionToShow === categoriesSection) navCategories.classList.add('active');
}

navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(dashboardSection);
    updateDashboardStats();
});

navCards.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(cardsSection);
    loadAdminCards();
});

navSealedProducts.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(sealedProductsSection);
    loadAdminSealedProducts();
});

navCategories.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(categoriesSection);
    loadCategories();
});

navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    isAuthenticated = false;
    document.querySelector('.user-info span').textContent = "Invitado";
    showCustomMessageModal("Sesión Cerrada", "Has cerrado sesión correctamente.");
    showLoginModal(); // Mostrar modal de login después de cerrar sesión
});

// Listener para el botón de refrescar el panel
const refreshAdminPageBtn = document.getElementById('refreshAdminPageBtn'); // Asegurarse de que esté declarado si no lo está ya
refreshAdminPageBtn.addEventListener('click', () => {
    if (!isAuthenticated) { showLoginModal(); return; }

    // Determinar la sección activa y recargar solo esa sección
    if (dashboardSection.classList.contains('active')) {
        updateDashboardStats();
    } else if (cardsSection.classList.contains('active')) {
        loadAdminCards();
    } else if (sealedProductsSection.classList.contains('active')) {
        loadAdminSealedProducts();
    } else if (categoriesSection.classList.contains('active')) {
        loadCategories();
    }
});


// ===============================================
// LÓGICA DE AUTENTICACIÓN (AHORA CON JAVASCRIPT BÁSICO)
// ===============================================
function showLoginModal() {
    console.log("showLoginModal: Mostrando modal de login.");
    adminContainer.style.display = 'none'; // Ocultar el contenido del panel
    loginModal.style.display = 'flex'; // Asegurarse de que el modal de login se muestre
    loginMessage.textContent = '';
    loginForm.reset();
    usernameInput.focus();
}

function hideLoginModal() {
    console.log("hideLoginModal: Ocultando modal de login y mostrando panel.");
    adminContainer.style.display = 'flex'; // Mostrar el contenido del panel
    loginModal.style.display = 'none';
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Credenciales hardcodeadas para demostración
    const validUsername = "admin@example.com";
    const validPassword = "password123";

    if (username === validUsername && password === validPassword) {
        isAuthenticated = true;
        document.querySelector('.user-info span').textContent = username;
        hideLoginModal();
        showSection(dashboardSection); // Mostrar el dashboard
        updateDashboardStats();
    } else {
        loginMessage.textContent = "Usuario o contraseña incorrectos.";
    }
});


// ===============================================
// LÓGICA DE GESTIÓN DE CARTAS
// ===============================================

async function loadAdminCards() {
    if (!isAuthenticated) { showLoginModal(); return; }
    try {
        const response = await fetch(SHEETDB_CARDS_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allAdminCards = await response.json();
        
        populateCategoryFilter(allAdminCards);
        applyAdminFilters();
    } catch (error) {
        console.error("Error cargando cartas para el admin:", error);
        showCustomMessageModal("Error", "Error cargando cartas. Por favor, revisa la consola.", true); // Usar modal personalizado
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

    adminCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminCategoryFilter.appendChild(option);
        
        const datalistOption = document.createElement('option');
        datalistOption.value = category;
        categoryOptionsDatalist.appendChild(datalistOption);
    });
}

function applyAdminFilters() {
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;

    filteredAdminCards = allAdminCards.filter(card => {
        const matchesSearch = card.nombre.toLowerCase().includes(searchTerm) || 
                              card.id.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "" || card.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    adminCurrentPage = 1;
    renderAdminCardsTable(filteredAdminCards);
}

function renderAdminCardsTable(cardsToRender) {
    cardsTableBody.innerHTML = '';

    const startIndex = (adminCurrentPage - 1) * adminCardsPerPage;
    const endIndex = startIndex + adminCardsPerPage;
    const paginatedCards = cardsToRender.slice(startIndex, endIndex);

    if (paginatedCards.length === 0) {
        cardsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron cartas.</td></tr>';
    }

    paginatedCards.forEach(card => {
        const row = cardsTableBody.insertRow();
        row.dataset.cardId = card.id;

        row.innerHTML = `
            <td>${card.id}</td>
            <td><img src="${card.imagen || 'https://placehold.co/50x70/E0E0E0/white?text=No+Img'}" alt="${card.nombre}" onerror="this.onerror=null; this.src='https://placehold.co/50x70/E0E0E0/white?text=No+Img';" ></td>
            <td>${card.nombre}</td>
            <td>$${parseFloat(card.precio).toFixed(2)}</td>
            <td>${parseInt(card.stock)}</td>
            <td>${card.categoria || 'N/A'}</td>
            <td class="action-buttons">
                <button class="edit-button" data-id="${card.id}">Editar</button>
                <button class="delete-button" data-id="${card.id}">Eliminar</button>
            </td>
        `;
    });
    
    updateAdminPaginationControls(cardsToRender.length);
    attachCardActionListeners();
}

function updateAdminPaginationControls(totalCardsCount) {
    const totalPages = Math.ceil(totalCardsCount / adminCardsPerPage);
    adminPageInfo.textContent = `Página ${adminCurrentPage} de ${totalPages || 1}`;

    adminPrevPageBtn.disabled = adminCurrentPage === 1;
    adminNextPageBtn.disabled = adminCurrentPage === totalPages || totalPages === 0;
}

function attachCardActionListeners() {
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const cardId = e.target.dataset.id;
            editCard(cardId);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const cardId = e.target.dataset.id;
            confirmDeletion('card', cardId);
        });
    });
}

addCardBtn.addEventListener('click', () => openCardModalForAdd());
saveCardBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveCard();
});

function openCardModalForAdd() {
    if (!isAuthenticated) { showLoginModal(); return; }
    cardModal.style.display = 'flex';
    cardModalTitle.textContent = 'Añadir Nueva Carta';
    cardForm.reset();
    cardIdInput.value = '';
}

async function editCard(cardId) {
    if (!isAuthenticated) { showLoginModal(); return; }
    const card = allAdminCards.find(c => c.id === cardId);
    if (card) {
        cardModal.style.display = 'flex';
        cardModalTitle.textContent = `Editar Carta: ${card.nombre}`;
        cardIdInput.value = card.id;
        cardNameInput.value = card.nombre;
        cardImageInput.value = card.imagen;
        cardPriceInput.value = parseFloat(card.precio);
        cardStockInput.value = parseInt(card.stock);
        cardCategoryInput.value = card.categoria || '';
    } else {
        showCustomMessageModal("Error", "Carta no encontrada.", true); // Usar modal personalizado
    }
}

async function saveCard() {
    if (!isAuthenticated) { showLoginModal(); return; }
    const id = cardIdInput.value;
    const name = cardNameInput.value;
    const image = cardImageInput.value;
    const price = parseFloat(cardPriceInput.value);
    const stock = parseInt(cardStockInput.value);
    const category = cardCategoryInput.value;

    const cardData = { id, nombre: name, imagen: image, precio: price, stock: stock, categoria: category };

    try {
        let response;
        // DEBUG: Log the ID value before the conditional check
        console.log(`DEBUG: ID value before check: '${id}'`);

        if (id) {
            // DEBUG: Log that a PUT operation is being attempted
            console.log(`DEBUG: Attempting PUT operation for card ID: ${id}`);
            response = await fetch(`${SHEETDB_CARDS_API_URL}/id/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: cardData })
            });
        } else {
            // DEBUG: Log that a POST operation is being attempted and a new ID is generated
            console.log(`DEBUG: Attempting POST operation. Generating new ID.`);
            // MODIFICADO: Nuevo formato de ID para cartas
            cardData.id = `C-${Date.now().toString(36)}`; 
            response = await fetch(SHEETDB_CARDS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: cardData })
            });
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        cardModal.style.display = 'none';
        showCustomMessageModal("Éxito", "Carta guardada exitosamente."); // Usar modal personalizado
        loadAdminCards();
    }
    catch (error) {
        console.error("Error guardando carta:", error);
        showCustomMessageModal("Error", `Error al guardar carta: ${error.message}. Revisa la consola.`, true); // Usar modal personalizado
    }
}

// ===============================================
// ELEMENTOS DEL DOM - GESTIÓN DE PRODUCTOS SELLADOS
// ===============================================
const addSealedProductBtn = document.getElementById('addSealedProductBtn'); 
const sealedProductsTableBody = document.querySelector('#sealedProductsTable tbody'); 
const adminSealedSearchInput = document.getElementById('adminSealedSearchInput');
const adminSealedTypeFilter = document.getElementById('adminSealedTypeFilter');
const sealedProductTypeOptionsDatalist = document.getElementById('sealedProductTypeOptions');

const adminSealedPrevPageBtn = document.getElementById('adminSealedPrevPageBtn');
const adminSealedNextPageBtn = document.getElementById('adminSealedNextPageBtn');
const adminSealedPageInfo = document.getElementById('adminSealedPageInfo');

// Modales y Formularios de Productos Sellados
const sealedProductModal = document.getElementById('sealedProductModal');
const sealedProductModalTitle = document.getElementById('sealedProductModalTitle');
const sealedProductForm = document.getElementById('sealedProductForm');
const sealedProductIdInput = document.getElementById('sealedProductId');
const sealedProductNameInput = document.getElementById('sealedProductName'); // Corresponde a 'producto'
const sealedProductImageInput = document.getElementById('sealedProductImage'); // Corresponde a 'imagen'
const sealedProductTypeInput = document.getElementById('sealedProductType'); // Corresponde a 'tipo_producto'
const sealedProductPriceInput = document.getElementById('sealedProductPrice');
const sealedProductStockInput = document.getElementById('sealedProductStock');
const saveSealedProductBtn = document.getElementById('saveSealedProductBtn');

// ===============================================
// LÓGICA DE GESTIÓN DE PRODUCTOS SELLADOS (FRONTEND TIENDA)
// ===============================================
async function loadAdminSealedProducts() {
    if (!isAuthenticated) { showLoginModal(); return; }
    if (SHEETDB_SEALED_PRODUCTS_API_URL.includes("YOUR_SEALED_PRODUCTS_SHEETDB_ID")) {
        console.warn("ADVERTENCIA: La URL de la API para productos sellados no ha sido configurada en admin.js. Reemplaza 'YOUR_SEALED_PRODUCTS_SHEETDB_ID' con tu ID real de SheetDB.");
        sealedProductsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error: URL de API para Productos Sellados no configurada.</td></tr>';
        return;
    }

    try {
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allAdminSealedProducts = await response.json();
        
        populateSealedProductTypeFilter(allAdminSealedProducts);
        applyAdminSealedFilters();
    } catch (error) {
        console.error("Error cargando productos sellados para el admin:", error);
        showCustomMessageModal("Error", "No se pudieron cargar los productos sellados. Inténtalo de nuevo más tarde.");
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

    adminSealedTypeFilter.innerHTML = '<option value="">Todos los tipos</option>';
    sealedProductTypeOptionsDatalist.innerHTML = '';

    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        adminSealedTypeFilter.appendChild(option);
        
        const datalistOption = document.createElement('option');
        datalistOption.value = type;
        sealedProductTypeOptionsDatalist.appendChild(datalistOption);
    });
}


function applyAdminSealedFilters() {
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedType = adminSealedTypeFilter.value;

    filteredAdminSealedProducts = allAdminSealedProducts.filter(product => {
        const matchesSearch = (product.producto && product.producto.toLowerCase().includes(searchTerm)) || 
                              (product.id_producto && product.id_producto.toLowerCase().includes(searchTerm));
        const matchesType = selectedType === "" || (product.tipo_producto && product.tipo_producto === selectedType); 
        
        return matchesSearch && matchesType;
    });

    adminSealedCurrentPage = 1;
    renderSealedProductsTable(filteredAdminSealedProducts);
}

function renderAdminSealedProductsTable(productsToRender) {
    sealedProductsTableBody.innerHTML = '';

    const startIndex = (adminSealedCurrentPage - 1) * adminSealedProductsPerPage;
    const endIndex = startIndex + adminSealedProductsPerPage;
    const paginatedProducts = productsToRender.slice(startIndex, endIndex);

    if (paginatedProducts.length === 0) {
        sealedProductsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron productos sellados.</td></tr>'; // Colspan ajustado
    }

    paginatedProducts.forEach(product => {
        const row = sealedProductsTableBody.insertRow(); // Usar insertRow para tablas
        row.dataset.productId = product.id_producto;

        row.innerHTML = `
            <td>${product.id_producto}</td>
            <td><img src="${product.imagen || 'https://placehold.co/50x70/E0E0E0/white?text=No+Img'}" alt="${product.producto}" onerror="this.onerror=null; this.src='https://placehold.co/50x70/E0E0E0/white?text=No+Img';" ></td>
            <td>${product.producto}</td>
            <td>${product.tipo_producto || 'N/A'}</td>
            <td>$${parseFloat(product.precio).toFixed(2)}</td>
            <td>${parseInt(product.stock)}</td>
            <td class="action-buttons">
                <button class="edit-sealed-product-button" data-id="${product.id_producto}">Editar</button>
                <button class="delete-sealed-product-button" data-id="${product.id_producto}">Eliminar</button>
            </td>
        `;
    });
    
    updateAdminSealedPaginationControls(productsToRender.length);
    attachSealedProductActionListeners();
}

function updateAdminSealedPaginationControls(totalProductsCount) {
    const totalPages = Math.ceil(totalProductsCount / adminSealedProductsPerPage);
    adminSealedPageInfo.textContent = `Página ${adminSealedCurrentPage} de ${totalPages || 1}`;

    adminSealedPrevPageBtn.disabled = adminSealedCurrentPage === 1; 
    adminSealedNextPageBtn.disabled = adminSealedCurrentPage === totalPages || totalPages === 0; 
}

function attachSealedProductActionListeners() {
    document.querySelectorAll('.edit-sealed-product-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            editSealedProduct(productId);
        });
    });

    document.querySelectorAll('.delete-sealed-product-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            confirmDeletion('sealed_product', productId);
        });
    });
}

addSealedProductBtn.addEventListener('click', () => openSealedProductModalForAdd());
saveSealedProductBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveSealedProduct();
});

function openSealedProductModalForAdd() {
    if (!isAuthenticated) { showLoginModal(); return; }
    sealedProductModal.style.display = 'flex';
    sealedProductModalTitle.textContent = 'Añadir Nuevo Producto Sellado';
    sealedProductForm.reset();
    sealedProductIdInput.value = '';
}

async function editSealedProduct(productId) {
    if (!isAuthenticated) { showLoginModal(); return; }
    const product = allAdminSealedProducts.find(p => p.id_producto === productId);
    if (product) {
        sealedProductModal.style.display = 'flex';
        sealedProductModalTitle.textContent = `Editar Producto: ${product.producto}`;
        sealedProductIdInput.value = product.id_producto;
        sealedProductNameInput.value = product.producto;
        sealedProductImageInput.value = product.imagen;
        sealedProductTypeInput.value = product.tipo_producto || '';
        sealedProductPriceInput.value = parseFloat(product.precio);
        sealedProductStockInput.value = parseInt(product.stock);
    } else {
        showCustomMessageModal("Error", "Producto sellado no encontrado.", true); // Usar modal personalizado
    }
}

async function saveSealedProduct() {
    if (!isAuthenticated) { showLoginModal(); return; }
    let id_producto = sealedProductIdInput.value;
    const producto = sealedProductNameInput.value;
    const imagen = sealedProductImageInput.value;
    const tipo_producto = sealedProductTypeInput.value;
    const precio = parseFloat(sealedProductPriceInput.value);
    const stock = parseInt(sealedProductStockInput.value);

    const productData = { 
        id_producto: id_producto,
        producto: producto, 
        imagen: imagen, 
        tipo_producto: tipo_producto, 
        precio: precio, 
        stock: stock 
    };

    try {
        let targetUrl;
        let method;

        // DEBUG: Log the ID value before the conditional check
        console.log(`DEBUG: ID de producto antes de la comprobación: '${id_producto}'`);

        if (id_producto) {
            // DEBUG: Log that a PUT operation is being attempted
            console.log(`DEBUG: Intentando operación PUT para ID de producto: ${id_producto}`);
            targetUrl = `${SHEETDB_SEALED_PRODUCTS_API_URL}/id_producto/${id_producto}`;
            method = 'PUT';
        } else {
            // DEBUG: Log that a POST operation is being attempted and a new ID is generated
            console.log(`DEBUG: Intentando operación POST. Generando nuevo ID de producto.`);
            // MODIFICADO: Nuevo formato de ID para productos sellados
            id_producto = `P-${Date.now().toString(36)}`;
            productData.id_producto = id_producto;
            targetUrl = SHEETDB_SEALED_PRODUCTS_API_URL;
            method = 'POST';
        }

        // DEBUG: Imprimir la URL y el método a la consola antes de la llamada fetch
        // Corregido el mensaje para que diga "guardar" en lugar de "eliminar"
        console.log(`DEBUG: Intentando GUARDAR producto sellado en URL: ${targetUrl} con método: ${method}`);

        const response = await fetch(targetUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: productData })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        sealedProductModal.style.display = 'none';
        showCustomMessageModal("Éxito", "Producto sellado guardado exitosamente."); // Usar modal personalizado
        loadAdminSealedProducts();
    } catch (error) {
        console.error("Error guardando producto sellado:", error);
        showCustomMessageModal("Error", `Error al guardar producto sellado: ${error.message}. Revisa la consola.`, true); // Usar modal personalizado
    }
}


// ===============================================
// LÓGICA DE GESTIÓN DE CATEGORÍAS
// ===============================================

function loadCategories() {
    if (!isAuthenticated) { showLoginModal(); return; }
    renderCategoriesTable();
}

function renderCategoriesTable() {
    categoriesTableBody.innerHTML = '';

    if (allCategories.length === 0) {
        categoriesTableBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No se encontraron categorías.</td></tr>';
    }

    allCategories.forEach(categoryName => {
        const row = categoriesTableBody.insertRow();
        row.dataset.categoryName = categoryName;

        row.innerHTML = `
            <td>${categoryName}</td>
            <td class="action-buttons">
                <button class="edit-category-button" data-name="${categoryName}">Editar</button>
                <button class="delete-category-button" data-name="${categoryName}">Eliminar</button>
            </td>
        `;
    });
    attachCategoryActionListeners();
}

function attachCategoryActionListeners() {
    document.querySelectorAll('.edit-category-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryName = e.target.dataset.name;
            openCategoryModalForEdit(categoryName);
        });
    });

    document.querySelectorAll('.delete-category-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryName = e.target.dataset.name;
            confirmDeletion('category', categoryName);
        });
    });
}

addCategoryBtn.addEventListener('click', () => openCategoryModalForAdd());
saveCategoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveCategory();
});

function openCategoryModalForAdd() {
    if (!isAuthenticated) { showLoginModal(); return; }
    categoryModal.style.display = 'flex';
    categoryModalTitle.textContent = 'Añadir Nueva Categoría';
    categoryForm.reset();
    categoryIdInput.value = '';
}

function openCategoryModalForEdit(categoryName) {
    if (!isAuthenticated) { showLoginModal(); return; }
    categoryModal.style.display = 'flex';
    categoryModalTitle.textContent = `Editar Categoría: ${categoryName}`;
    categoryIdInput.value = categoryName;
    categoryNameInput.value = categoryName;
}

async function saveCategory() {
    if (!isAuthenticated) { showLoginModal(); return; }
    const originalCategoryName = categoryIdInput.value;
    const newCategoryName = categoryNameInput.value.trim();

    if (!newCategoryName) {
        showCustomMessageModal("Advertencia", "El nombre de la categoría no puede estar vacío.", true); // Usar modal personalizado
        return;
    }

    const categoryExists = allCategories.includes(newCategoryName);

    if (originalCategoryName && originalCategoryName !== newCategoryName) {
        if (categoryExists) {
            showCustomMessageModal("Advertencia", `La categoría "${newCategoryName}" ya existe.`, true); // Usar modal personalizado
            return;
        }
        allCategories = allCategories.map(cat => cat === originalCategoryName ? newCategoryName : cat);
        showCustomMessageModal("Éxito", `Categoría "${originalCategoryName}" renombrada a "${newCategoryName}".\n(Las cartas asociadas NO se han actualizado en la API. Esto requeriría lógica adicional).`); // Usar modal personalizado

    } else if (!originalCategoryName) {
        if (categoryExists) {
            showCustomMessageModal("Advertencia", `La categoría "${newCategoryName}" ya existe.`, true); // Usar modal personalizado
            return;
        }
        allCategories.push(newCategoryName);
        showCustomMessageModal("Éxito", `Categoría "${newCategoryName}" añadida.`); // Usar modal personalizado
    } else {
        showCustomMessageModal("Info", "El nombre de la categoría no ha cambiado."); // Usar modal personalizado
    }
    
    allCategories.sort();
    categoryModal.style.display = 'none';
    renderCategoriesTable();
    populateCategoryFilter(allAdminCards);
}


// ===============================================
// LÓGICA DEL MODAL DE CONFIRMACIÓN
// ===============================================
let itemToDeleteType = null;
let itemToDeleteId = null;

function confirmDeletion(type, id) {
    if (!isAuthenticated) { showLoginModal(); return; }
    itemToDeleteType = type;
    itemToDeleteId = id;
    
    // Configurar el modal para confirmación (restaurar botones y texto)
    customMessageTitle.textContent = 'Confirmar Eliminación';
    customMessageText.textContent = `¿Estás seguro de que quieres eliminar ${type === 'card' ? 'la carta con ID' : type === 'sealed_product' ? 'el producto sellado con ID' : 'la categoría'} "${id}"? Esta acción es irreversible.`;
    customMessageOkBtn.textContent = 'Eliminar';
    customMessageOkBtn.style.backgroundColor = '#dc3545'; // Rojo para eliminar
    customMessageOkBtn.onclick = async () => {
        customMessageModal.style.display = 'none';
        if (itemToDeleteType === 'card') {
            await deleteCard(itemToDeleteId);
        } else if (itemToDeleteType === 'sealed_product') {
            await deleteSealedProduct(itemToDeleteId);
        } else if (itemToDeleteType === 'category') {
            await deleteCategory(itemToDeleteId);
        }
        itemToDeleteType = null;
        itemToDeleteId = null;
    };
    customMessageCancelBtn.style.display = 'inline-block'; // Mostrar botón de cancelar
    customMessageCancelBtn.onclick = () => {
        customMessageModal.style.display = 'none';
        itemToDeleteType = null;
        itemToDeleteId = null;
    };

    customMessageModal.style.display = 'flex';
}


async function deleteCard(cardId) {
    if (!isAuthenticated) { showLoginModal(); return; }
    try {
        // DEBUG: Imprimir la URL y el método a la consola antes de la llamada fetch
        console.log(`DEBUG: Intentando eliminar carta desde URL: ${SHEETDB_CARDS_API_URL}/id/${cardId} con método: DELETE`);

        const response = await fetch(`${SHEETDB_CARDS_API_URL}/id/${cardId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        showCustomMessageModal("Éxito", `Carta con ID ${cardId} eliminada exitosamente.`); // Usar modal personalizado
        loadAdminCards();
    }
    catch (error) {
        console.error("Error eliminando carta:", error);
        showCustomMessageModal("Error", `Error al eliminar carta: ${error.message}. Revisa la consola.`, true); // Usar modal personalizado
    }
}

async function deleteSealedProduct(productId) {
    if (!isAuthenticated) { showLoginModal(); return; }
    try {
        // DEBUG: Imprimir la URL y el método a la consola antes de la llamada fetch
        console.log(`DEBUG: Intentando eliminar producto sellado desde URL: ${SHEETDB_SEALED_PRODUCTS_API_URL}/id_producto/${productId} con método: DELETE`);

        const response = await fetch(`${SHEETDB_SEALED_PRODUCTS_API_URL}/id_producto/${productId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        showCustomMessageModal("Éxito", `Producto sellado con ID ${productId} eliminado exitosamente.`); // Usar modal personalizado
        loadAdminSealedProducts();
    } catch (error) {
        console.error("Error eliminando producto sellado:", error);
        showCustomMessageModal("Error", `Error al eliminar producto sellado: ${error.message}. Por favor, revisa la consola.`, true); // Usar modal personalizado
    }
}

async function deleteCategory(categoryName) {
    if (!isAuthenticated) { showLoginModal(); return; }
    allCategories = allCategories.filter(cat => cat !== categoryName);
    showCustomMessageModal("Éxito", `Categoría "${categoryName}" eliminada de la lista del panel.\n(Las cartas con esta categoría NO se han modificado en la API).`); // Usar modal personalizado
    renderCategoriesTable();
    populateCategoryFilter(allAdminCards);
}

// ===============================================
// LÓGICA DE ESTADÍSTICAS DEL DASHBOARD
// ===============================================
function updateDashboardStats() {
    if (!isAuthenticated) {
        document.getElementById('totalCardsCount').textContent = 'N/A';
        document.getElementById('totalSealedProductsCount').textContent = 'N/A';
        document.getElementById('outOfStockCount').textContent = 'N/A';
        document.getElementById('uniqueCategoriesCount').textContent = 'N/A';
        return;
    }
    // Para asegurar que los datos del dashboard estén frescos, recargamos las cartas y productos sellados
    // antes de actualizar las estadísticas. Esto asegura que 'allAdminCards' y 'allAdminSealedProducts'
    // contengan la información más reciente al calcular las estadísticas.
    Promise.all([
        fetch(SHEETDB_CARDS_API_URL).then(res => res.json()),
        fetch(SHEETDB_SEALED_PRODUCTS_API_URL).then(res => res.json())
    ]).then(([cardsData, sealedProductsData]) => {
        allAdminCards = cardsData;
        allAdminSealedProducts = sealedProductsData;
        
        document.getElementById('totalCardsCount').textContent = allAdminCards.length;
        document.getElementById('totalSealedProductsCount').textContent = allAdminSealedProducts.length;
        
        const outOfStockCards = allAdminCards.filter(card => parseInt(card.stock) === 0).length;
        const outOfStockSealed = allAdminSealedProducts.filter(product => parseInt(product.stock) === 0).length;
        document.getElementById('outOfStockCount').textContent = outOfStockCards + outOfStockSealed;
        
        // Recalcular categorías si es necesario, aunque se debería hacer en loadCategories
        const categories = new Set();
        allAdminCards.forEach(card => {
            if (card.categoria) {
                categories.add(card.categoria.trim());
            }
        });
        allCategories = Array.from(categories).sort();
        document.getElementById('uniqueCategoriesCount').textContent = allCategories.length;

    }).catch(error => {
        console.error("Error al actualizar estadísticas del dashboard:", error);
        document.getElementById('totalCardsCount').textContent = 'Error';
        document.getElementById('totalSealedProductsCount').textContent = 'Error';
        document.getElementById('outOfStockCount').textContent = 'Error';
        document.getElementById('uniqueCategoriesCount').textContent = 'Error';
    });
}


// ===============================================
// INICIALIZACIÓN
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: El DOM ha sido completamente cargado."); // Mensaje de depuración

    // Event listeners para los botones de cierre de modales
    document.querySelectorAll('.admin-modal .close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.admin-modal');
            if (modal.id === 'loginModal' && !isAuthenticated) {
                // Prevenir cierre del modal de login si no está autenticado
                return;
            }
            modal.style.display = 'none';
        });
    });

    // Event listener para cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('admin-modal')) {
            if (e.target.id === 'loginModal' && !isAuthenticated) {
                // Prevenir cierre del modal de login si no está autenticado
                return;
            }
            // Asegurarse de que el click fuera no cierre el modal de confirmación
            // a menos que sea el mismo modal de confirmación clickeado directamente
            if (e.target.id === 'confirmModal' && (customMessageOkBtn.textContent === 'Aceptar' || customMessageOkBtn.textContent === 'Eliminar')) {
                // Si es el modal de confirmación y está mostrando un mensaje o pidiendo confirmación,
                // solo lo cerramos si se hace clic directamente en él y no en su contenido.
                e.target.style.display = 'none';
            } else if (e.target.id !== 'confirmModal') { // Si no es el modal de confirmación
                e.target.style.display = 'none';
            }
        }
    });


    adminPrevPageBtn.addEventListener('click', () => {
        if (!isAuthenticated) { showLoginModal(); return; }
        if (adminCurrentPage > 1) {
            adminCurrentPage--;
            renderAdminCardsTable(filteredAdminCards);
        }
    });

    adminNextPageBtn.addEventListener('click', () => {
        if (!isAuthenticated) { showLoginModal(); return; }
        const totalPages = Math.ceil(filteredAdminCards.length / adminCardsPerPage);
        if (adminCurrentPage < totalPages) {
            adminCurrentPage++;
            renderAdminCardsTable(filteredAdminCards);
        }
    });

    adminSealedPrevPageBtn.addEventListener('click', () => {
        if (!isAuthenticated) { showLoginModal(); return; }
        if (adminSealedCurrentPage > 1) {
            adminSealedCurrentPage--;
            renderAdminSealedProductsTable(filteredAdminSealedProducts);
        }
    });

    adminSealedNextPageBtn.addEventListener('click', () => {
        if (!isAuthenticated) { showLoginModal(); return; }
        const totalPages = Math.ceil(filteredAdminSealedProducts.length / adminSealedProductsPerPage);
        if (adminSealedCurrentPage < totalPages) {
            adminSealedCurrentPage++;
            renderAdminSealedProductsTable(filteredAdminSealedProducts);
        }
    });

    adminSearchInput.addEventListener('input', applyAdminFilters);
    adminCategoryFilter.addEventListener('change', applyAdminFilters);

    adminSealedSearchInput.addEventListener('input', applyAdminSealedFilters);
    adminSealedTypeFilter.addEventListener('change', applyAdminSealedFilters);
    
    // Al cargar el DOM, mostrar el modal de login
    showLoginModal();
});
