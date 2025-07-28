// ==========================================================================
// GLOBAL VARIABLES (non-DOM related)
// ==========================================================================

// Firebase and Firestore SDK imports
import { initializeApp }
from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc }
from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getAnalytics }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

// Your actual Firebase configuration for dndtcgadmin project
const firebaseConfig = {
    apiKey: "AIzaSyDjRTOnQ4d9-4l_W-EwRbYNQ8xkTLKbwsM",
    authDomain: "dndtcgadmin.firebaseapp.com",
    projectId: "dndtcgadmin",
    storageBucket: "dndtcgadmin.firebasbasestorage.app",
    messagingSenderId: "754642671504",
    appId: "1:754642671504:web:c087cc703862cf8c228515",
    measurementId: "G-T8KRZX5S7R"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app); // Inicializa Analytics si lo necesitas, si no, puedes eliminar esta línea.

// Application ID and User ID
const appId = firebaseConfig.projectId;
let userId = null;
let currentAdminUser = null;

// URL de tu función de Netlify para operaciones de escritura (ADD, UPDATE, DELETE)
// ¡IMPORTANTE! Asegúrate de que esta URL sea EXACTA y que tu función esté desplegada.
const NETLIFY_FUNCTION_URL = 'https://luminous-frangipane-754b8d.netlify.app/.netlify/functions/netlify-function-sheetdb'; // <-- ¡URL DE FUNCIÓN CORREGIDA AQUÍ!

// Contraseña para autenticar con tu función de Netlify.
// ¡DEBE COINCIDIR EXACTAMENTE con el valor de la variable de entorno ADMIN_PASSWORD en Netlify!
const ADMIN_FUNCTION_PASSWORD = 'Blarias616!'; // <-- Contraseña confirmada

// URLs de SheetDB para operaciones de LECTURA directa (GET)
// Estas URLs se usan para cargar los datos en las tablas.
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau";
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp";

// Arrays para almacenar los datos cargados
let allCards = [];
let allSealedProducts = [];
let allCategories = [];

// Configuración de paginación
const itemsPerPage = 10;
let currentCardsPage = 1;
let currentSealedProductsPage = 1;

// Variable para el elemento a eliminar
let currentDeleteTarget = null;

// ==========================================================================
// DOM ELEMENT REFERENCES (Declaradas con 'let' en el ámbito global para acceso fácil)
// Se asignarán en DOMContentLoaded
// ==========================================================================
let sidebarToggleBtn;
let sidebarMenu;
let sidebarOverlay;
let mainHeader;
let loginModal;
let loginForm;
let loginMessage;
let usernameInput;
let passwordInput;

let navDashboard;
let navCards;
let navSealedProducts;
let navCategories;
let navOrders;
let navLogout;

let dashboardSection;
let cardsSection;
let sealedProductsSection;
let categoriesSection;

let addCardBtn;
let addSealedProductBtn;
let addCategoryBtn;

let cardModal;
let cardModalTitle;
let cardForm;
let cardId;
let cardName;
let cardImage;
let cardPrice;
let cardStock;
let cardCategory;
let categoryOptions; // Datalist para categorías de cartas
let saveCardBtn;

let sealedProductModal;
let sealedProductModalTitle;
let sealedProductForm;
let sealedProductId;
let sealedProductName;
let sealedProductImage;
let sealedProductCategory;
let sealedProductCategoryOptions; // Datalist para categorías de productos sellados
let sealedProductPrice;
let sealedProductStock;
let saveSealedProductBtn;

let categoryModal;
let categoryModalTitle;
let categoryForm;
let categoryId;
let categoryName;
let saveCategoryBtn;

let confirmModal;
let confirmMessage;
let cancelDeleteBtn;
let confirmDeleteBtn;

let cardsTable;
let sealedProductsTable;
let categoriesTable;

let adminSearchInput;
let adminCategoryFilter;
let adminPrevPageBtn;
let adminNextPageBtn;
let adminPageInfo;

let adminSealedSearchInput;
let adminSealedCategoryFilter;
let adminSealedPrevPageBtn;
let adminSealedNextPageBtn;
let adminSealedPageInfo;

let totalCardsCount;
let totalSealedProductsCount;
let outOfStockCount;
let uniqueCategoriesCount;


// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Muestra una sección del panel de administración y oculta las demás.
 * @param {HTMLElement} sectionToShow - El elemento DOM de la sección a mostrar.
 */
function showSection(sectionToShow) {
    const sections = [dashboardSection, cardsSection, sealedProductsSection, categoriesSection];
    sections.forEach(section => {
        if (section) section.classList.remove('active');
    });
    if (sectionToShow) {
        sectionToShow.classList.add('active');
    }
}

/**
 * Abre un modal.
 * @param {HTMLElement} modalElement - El elemento modal a abrir.
 */
function openModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Evita el scroll del body
    }
}

/**
 * Cierra un modal.
 * @param {HTMLElement} modalElement - El elemento modal a cerrar.
 */
function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
        document.body.style.overflow = ''; // Restaura el scroll del body
    }
}

/**
 * Muestra un mensaje de error en el modal de login.
 * @param {string} message - El mensaje a mostrar.
 */
function showLoginError(message) {
    if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.style.display = 'block';
    }
}

/**
 * Limpia el mensaje de error del modal de login.
 */
function clearLoginError() {
    if (loginMessage) {
        loginMessage.textContent = '';
        loginMessage.style.display = 'none';
    }
}

/**
 * Realiza una petición a la función Netlify para operaciones de escritura (ADD, UPDATE, DELETE).
 * Incluye la contraseña de administrador en las cabeceras para autenticación de la función.
 * @param {string} entityType - El tipo de entidad ('cards', 'sealedProducts', 'categories').
 * @param {string} action - La acción a realizar ('add', 'update', 'delete').
 * @param {Object} data - Los datos a enviar (para 'add'/'update').
 * @param {string} id - El ID del elemento (para 'update'/'delete').
 * @returns {Promise<Object>} - La respuesta de la función Netlify.
 */
async function callBackendFunction(entityType, action, data = {}, id = null) {
    // Verificación básica de autenticación de usuario Firebase antes de llamar al backend
    if (!currentAdminUser) {
        console.error('No hay usuario administrador autenticado. Operación cancelada.');
        showLoginError('Por favor, inicia sesión para realizar esta operación.');
        openModal(loginModal);
        throw new Error('No autenticado para realizar esta operación.');
    }

    try {
        const response = await fetch(NETLIFY_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': ADMIN_FUNCTION_PASSWORD // Envía la contraseña de la función
            },
            body: JSON.stringify({ entityType, action, data, id })
        });

        const result = await response.json();
        if (!response.ok) {
            // Manejar errores HTTP (ej. 401 Unauthorized, 404 Not Found, 500 Internal Server Error)
            console.error(`Error en la respuesta del backend (${response.status}):`, result);
            throw new Error(result.message || `Error en la función Netlify: ${response.status} ${response.statusText}`);
        }
        return result;
    } catch (error) {
        console.error('Error al llamar a la función Netlify:', error);
        alert(`Operación fallida: ${error.message}`);
        throw error;
    }
}

// ==========================================================================
// FIREBASE AUTHENTICATION FUNCTIONS
// ==========================================================================

/**
 * Maneja el proceso de inicio de sesión del administrador usando Firebase Email/Password Auth.
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleLogin(event) {
    event.preventDefault();
    const email = usernameInput ? usernameInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    clearLoginError();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentAdminUser = userCredential.user;
        userId = currentAdminUser.uid;
        console.log('Administrador ha iniciado sesión con Firebase Auth. ID de usuario:', userId);

        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData(); // Carga todos los datos después de un inicio de sesión exitoso
    } catch (error) {
        console.error('Error al iniciar sesión con Firebase:', error);
        let errorMessage = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Correo electrónico o contraseña incorrectos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de correo electrónico no válido.';
        }
        showLoginError(errorMessage);
    }
}

/**
 * Maneja el proceso de cierre de sesión del administrador usando Firebase Auth.
 */
async function handleLogout() {
    try {
        await signOut(auth);
        userId = null;
        currentAdminUser = null;
        console.log('Sesión cerrada con Firebase Auth.');

        openModal(loginModal); // Muestra el modal de inicio de sesión de nuevo
        clearLoginError();
        // Opcional: Limpiar datos o redirigir a una página de inicio
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
    }
}

// Firebase Auth State Listener: Se ejecuta cuando el estado de autenticación cambia
onAuthStateChanged(auth, (user) => {
    currentAdminUser = user;
    userId = user ? user.uid : null;
    console.log('Cambio de estado de autenticación de Firebase. Usuario:', userId);
    // La lógica de UI inicial se maneja en DOMContentLoaded para asegurar que el DOM esté listo.
});


// ==========================================================================
// DATA LOADING FUNCTIONS (Firestore for Categories, SheetDB for Cards/Sealed Products)
// ==========================================================================

/**
 * Carga todas las categorías desde Firestore.
 */
async function loadCategories() {
    try {
        const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
        const categorySnapshot = await getDocs(categoriesCol);
        allCategories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populateCategoryFilters();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        alert('Error al cargar categorías. Consulta la consola para más detalles.');
    }
}

/**
 * Carga todos los datos de cartas desde SheetDB (lectura directa para visualización).
 */
async function loadCardsData() {
    try {
        const response = await fetch(SHEETDB_CARDS_API_URL);
        if (!response.ok) {
            throw new Error(`¡Error HTTP! status: ${response.status}`);
        }
        // Asegura que precio y stock sean números al cargarlos
        allCards = (await response.json()).map(card => ({
            ...card,
            precio: parseFloat(card.precio) || 0,
            stock: parseInt(card.stock) || 0
        }));
        renderCardsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error al cargar datos de cartas:', error);
        alert('Error al cargar cartas. Consulta la consola para más detalles.');
    }
}

/**
 * Carga todos los datos de productos sellados desde SheetDB (lectura directa para visualización).
 */
async function loadSealedProductsData() {
    try {
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL);
        if (!response.ok) {
            throw new Error(`¡Error HTTP! status: ${response.status}`);
        }
        // Asegura que precio y stock sean números al cargarlos
        allSealedProducts = (await response.json()).map(product => ({
            ...product,
            precio: parseFloat(product.precio) || 0,
            stock: parseInt(product.stock) || 0
        }));
        console.log('Datos de productos sellados cargados:', allSealedProducts); // Para depuración
        renderSealedProductsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error al cargar datos de productos sellados:', error);
        alert('Error al cargar productos sellados. Consulta la consola para más detalles.');
    }
}

/**
 * Carga todos los datos necesarios para el panel de administración.
 */
async function loadAllData() {
    await loadCategories();
    await loadCardsData();
    await loadSealedProductsData();
}

/**
 * Rellena los filtros de categoría y los datalists en los formularios.
 */
function populateCategoryFilters() {
    // Se añade null check para seguridad, si estas advertencias persisten, VERIFICA los IDs en admin.html
    if (!adminCategoryFilter || !adminSealedCategoryFilter || !categoryOptions || !sealedProductCategoryOptions) {
        console.warn("Elementos DOM para filtros de categoría no disponibles. Verifica los IDs en admin.html.");
        return;
    }

    const categories = [...new Set(allCategories.map(cat => cat.name))];

    adminCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminCategoryFilter.appendChild(option);
    });

    adminSealedCategoryFilter.innerHTML = '<option value="">Todos los tipos</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminSealedCategoryFilter.appendChild(option);
    });

    categoryOptions.innerHTML = '';
    sealedProductCategoryOptions.innerHTML = '';
    categories.forEach(category => {
        const cardOption = document.createElement('option');
        cardOption.value = category;
        categoryOptions.appendChild(cardOption);

        const sealedOption = document.createElement('option');
        sealedOption.value = category;
        sealedProductCategoryOptions.appendChild(sealedOption);
    });
}

// ==========================================================================
// TABLE RENDERING FUNCTIONS
// ==========================================================================

/**
 * Renderiza la tabla de cartas con filtrado y paginación.
 */
function renderCardsTable() {
    if (!cardsTable || !adminSearchInput || !adminCategoryFilter || !adminPrevPageBtn || !adminNextPageBtn || !adminPageInfo) {
        console.warn("Elementos DOM para la tabla de cartas no disponibles. Verifica los IDs en admin.html.");
        return;
    }
    cardsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;

    let filteredCards = allCards.filter(card => {
        const cardName = card.nombre ? String(card.nombre).toLowerCase() : '';
        const cardId = card.id ? String(card.id).toLowerCase() : '';
        const matchesSearch = cardName.includes(searchTerm) || cardId.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || String(card.categoria) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredCards.sort((a, b) => (String(a.nombre) || '').localeCompare(String(b.nombre) || ''));

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const startIndex = (currentCardsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    cardsToDisplay.forEach(card => {
        const row = cardsTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${card.id || ''}</td>
            <td><img src="${card.imagen || 'https://placehold.co/50x50/cccccc/333333?text=No+Image'}" alt="${card.nombre || 'No Image'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=No+Image';" /></td>
            <td>${card.nombre || ''}</td>
            <td>$${(card.precio || 0).toFixed(2)}</td>
            <td>${card.stock || 0}</td>
            <td>${card.categoria || ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-button" data-id="${card.id || ''}" data-type="card">Editar</button>
                    <button class="delete-button" data-id="${card.id || ''}" data-type="card">Eliminar</button>
                </div>
            </td>
        `;
    });
    updatePaginationControls(currentCardsPage, totalPages, adminPrevPageBtn, adminNextPageBtn, adminPageInfo, filteredCards.length);
}

/**
 * Renderiza la tabla de productos sellados con filtrado y paginación.
 */
function renderSealedProductsTable() {
    if (!sealedProductsTable || !adminSealedSearchInput || !adminSealedCategoryFilter || !adminSealedPrevPageBtn || !adminSealedNextPageBtn || !adminSealedPageInfo) {
        console.warn("Elementos DOM para la tabla de productos sellados no disponibles. Verifica los IDs en admin.html.");
        return;
    }
    sealedProductsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedCategory = adminSealedCategoryFilter.value;

    let filteredProducts = allSealedProducts.filter(product => {
        const productName = product.producto ? String(product.producto).toLowerCase() : '';
        const productId = product.id_producto ? String(product.id_producto).toLowerCase() : '';
        const matchesSearch = productName.includes(searchTerm) || productId.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || String(product.tipo_producto) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredProducts.sort((a, b) => (String(a.producto) || '').localeCompare(String(b.producto) || ''));

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentSealedProductsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    productsToDisplay.forEach(product => {
        const row = sealedProductsTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${product.id_producto || ''}</td>
            <td><img src="${product.imagen || 'https://placehold.co/50x50/cccccc/333333?text=No+Image'}" alt="${product.producto || 'No Image'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=No+Image';" /></td>
            <td>${product.producto || ''}</td>
            <td>${product.tipo_producto || ''}</td>
            <td>$${(product.precio || 0).toFixed(2)}</td>
            <td>${product.stock || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-sealed-product-button" data-id="${product.id_producto || ''}" data-type="sealed">Editar</button>
                    <button class="delete-sealed-product-button" data-id="${product.id_producto || ''}" data-type="sealed">Eliminar</button>
                </div>
            </td>
        `;
    });
    updatePaginationControls(currentSealedProductsPage, totalPages, adminSealedPrevPageBtn, adminSealedNextPageBtn, adminSealedPageInfo, filteredProducts.length);
}

/**
 * Renderiza la tabla de categorías.
 */
async function renderCategoriesTable() {
    if (!categoriesTable) {
        console.warn("El elemento DOM para la tabla de categorías no está disponible. Verifica los IDs en admin.html.");
        return;
    }
    categoriesTable.querySelector('tbody').innerHTML = '';
    allCategories.forEach(category => {
        const row = categoriesTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${category.name || ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-category-button" data-id="${category.id || ''}" data-name="${category.name || ''}">Editar</button>
                    <button class="delete-category-button" data-id="${category.id || ''}" data-name="${category.name || ''}">Eliminar</button>
                </div>
            </td>
        `;
    });
}

/**
 * Actualiza los controles de paginación.
 * @param {number} currentPage - La página actual.
 * @param {number} totalPages - El total de páginas.
 * @param {HTMLElement} prevBtn - Botón "anterior".
 * @param {HTMLElement} nextBtn - Botón "siguiente".
 * @param {HTMLElement} infoSpan - Span de información de página.
 * @param {number} totalItems - Total de elementos filtrados.
 */
function updatePaginationControls(currentPage, totalPages, prevBtn, nextBtn, infoSpan, totalItems) {
    if (!infoSpan || !prevBtn || !nextBtn) return; // Null check
    infoSpan.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} items)`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Actualiza las estadísticas del dashboard.
 */
function updateDashboardStats() {
    if (!totalCardsCount || !totalSealedProductsCount || !outOfStockCount || !uniqueCategoriesCount) {
        console.warn("Elementos DOM de estadísticas del dashboard no disponibles. Verifica los IDs en admin.html.");
        return;
    }
    totalCardsCount.textContent = allCards.length;
    totalSealedProductsCount.textContent = allSealedProducts.length;
    outOfStockCount.textContent = allCards.filter(card => (card.stock || 0) === 0).length + allSealedProducts.filter(product => (product.stock || 0) === 0).length;
    uniqueCategoriesCount.textContent = allCategories.length;
}

// ==========================================================================
// DATA MANAGEMENT FUNCTIONS (CRUD via Netlify Functions)
// ==========================================================================

/**
 * Maneja el envío del formulario de cartas (añadir/editar).
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleCardFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!cardId.value;
    const cardData = {
        id: cardId.value || `C${Date.now()}`,
        nombre: cardName.value,
        imagen: cardImage.value,
        precio: parseFloat(cardPrice.value),
        stock: parseInt(cardStock.value),
        categoria: cardCategory.value
    };

    try {
        let result;
        if (isEditing) {
            result = await callBackendFunction('cards', 'update', cardData, cardData.id);
        } else {
            result = await callBackendFunction('cards', 'add', cardData);
        }
        console.log(result.message, result.data);
        closeModal(cardModal);
        await loadCardsData();
        alert(`Carta ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar carta:', error);
        alert(`Error al guardar carta: ${error.message}`);
    }
}

/**
 * Maneja el envío del formulario de productos sellados (añadir/editar).
 */
async function handleSealedProductFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!sealedProductId.value;
    const productData = {
        id_producto: sealedProductId.value || `S${Date.now()}`,
        producto: sealedProductName.value,
        imagen: sealedProductImage.value,
        tipo_producto: sealedProductCategory.value,
        precio: parseFloat(sealedProductPrice.value),
        stock: parseInt(sealedProductStock.value)
    };

    try {
        let result;
        if (isEditing) {
            result = await callBackendFunction('sealedProducts', 'update', productData, productData.id_producto);
        } else {
            result = await callBackendFunction('sealedProducts', 'add', productData);
        }
        console.log(result.message, result.data);
        closeModal(sealedProductModal);
        await loadSealedProductsData();
        alert(`Producto sellado ${isEditing ? 'actualizado' : 'añadido'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar producto sellado:', error);
        alert(`Error al guardar producto sellado: ${error.message}`);
    }
}

/**
 * Maneja el envío del formulario de categorías (añadir/editar).
 * Esta función interactúa con Firestore y, opcionalmente, con SheetDB a través del backend.
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleCategoryFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!categoryId.value;
    const categoryData = {
        name: categoryName.value
    };
    const categoryDocId = categoryId.value;

    try {
        if (isEditing) {
            const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, categoryDocId);
            await updateDoc(categoryRef, categoryData);
        } else {
            const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
            await addDoc(categoriesCol, categoryData);
        }
        
        console.log(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
        closeModal(categoryModal);
        await loadCategories();
        updateDashboardStats();
        alert(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        alert(`Error al guardar categoría: ${error.message}`);
    }
}

/**
 * Abre el modal de confirmación para eliminar.
 * @param {string} id - El ID del elemento a eliminar.
 * @param {string} type - El tipo de elemento ('card', 'sealed', 'category').
 * @param {string} name - El nombre del elemento (para mostrar en el mensaje).
 */
function openConfirmModal(id, type, name = '') {
    currentDeleteTarget = { id, type, name };
    if (confirmMessage) confirmMessage.textContent = `¿Estás seguro de que quieres eliminar ${name ? '"' + name + '"' : 'este elemento'}?`;
    openModal(confirmModal);
}

/**
 * Confirma y ejecuta la eliminación del elemento.
 */
async function confirmDeletion() {
    if (!currentDeleteTarget) return;

    const { id, type, name } = currentDeleteTarget;
    try {
        let result;
        if (type === 'card') {
            result = await callBackendFunction('cards', 'delete', {}, id);
            await loadCardsData();
        } else if (type === 'sealed') {
            result = await callBackendFunction('sealedProducts', 'delete', {}, id);
            await loadSealedProductsData();
        } else if (type === 'category') {
            const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, id);
            await deleteDoc(categoryRef);
            await loadCategories();
            updateDashboardStats();
            console.log(`Categoría eliminada de Firestore.`);
        }
        console.log(result.message || `Elemento ${type} eliminado.`);
        closeModal(confirmModal);
        alert(`Elemento ${type} eliminado con éxito.`);
    } catch (error) {
        console.error(`Error al eliminar ${type}:`, error);
        alert(`Error al eliminar ${type}: ${error.message}`);
    } finally {
        currentDeleteTarget = null;
    }
}


// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

// Verificación inicial de autenticación de Firebase:
onAuthStateChanged(auth, async (user) => {
    currentAdminUser = user;
    userId = user ? user.uid : null;
    console.log('Cambio de estado de autenticación de Firebase. Usuario:', userId);
    // La lógica de UI inicial se maneja en DOMContentLoaded para asegurar que el DOM esté listo.
});

// Añadir un listener de eventos para cerrar sesión cuando la página se descarga (se cierra o se actualiza)
window.addEventListener('unload', async () => {
    console.log('La página se está descargando. Intentando cerrar sesión...');
    try {
        await signOut(auth);
        console.log('Sesión cerrada correctamente al descargar.');
    } catch (error) {
        console.error('Error al cerrar sesión al descargar:', error);
    }
});


// ==========================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================================================
// Envolver todo el código relacionado con el DOM en DOMContentLoaded para asegurar que los elementos estén disponibles
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded disparado. Asignando elementos DOM y adjuntando listeners...');

    // Asignar elementos DOM aquí después de que el documento esté completamente cargado
    sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    sidebarMenu = document.getElementById('sidebar-menu');
    sidebarOverlay = document.getElementById('sidebar-overlay');
    mainHeader = document.querySelector('.main-header');
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    loginMessage = document.getElementById('loginMessage');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');

    navDashboard = document.getElementById('nav-dashboard');
    navCards = document.getElementById('nav-cards');
    navSealedProducts = document.getElementById('nav-sealed-products');
    navCategories = document.getElementById('nav-categories');
    navOrders = document.getElementById('nav-orders');
    navLogout = document.getElementById('nav-logout');

    dashboardSection = document.getElementById('dashboard-section');
    cardsSection = document.getElementById('cards-section');
    sealedProductsSection = document.getElementById('sealed-products-section');
    categoriesSection = document.getElementById('categories-section');

    addCardBtn = document.getElementById('addCardBtn');
    addSealedProductBtn = document.getElementById('addSealedProductBtn');
    addCategoryBtn = document.getElementById('addCategoryBtn');

    cardModal = document.getElementById('cardModal');
    cardModalTitle = document.getElementById('cardModalTitle');
    cardForm = document.getElementById('cardForm');
    cardId = document.getElementById('cardId');
    cardName = document.getElementById('cardName');
    cardImage = document.getElementById('cardImage');
    cardPrice = document.getElementById('cardPrice');
    cardStock = document.getElementById('cardStock');
    cardCategory = document.getElementById('cardCategory');
    categoryOptions = document.getElementById('categoryOptions');
    saveCardBtn = document.getElementById('saveCardBtn');

    sealedProductModal = document.getElementById('sealedProductModal');
    sealedProductModalTitle = document.getElementById('sealedProductModalTitle');
    sealedProductForm = document.getElementById('sealedProductForm');
    sealedProductId = document.getElementById('sealedProductId');
    sealedProductName = document.getElementById('sealedProductName');
    sealedProductImage = document.getElementById('sealedProductImage');
    sealedProductCategory = document.getElementById('sealedProductCategory');
    sealedProductCategoryOptions = document.getElementById('sealedProductCategoryOptions');
    sealedProductPrice = document.getElementById('sealedProductPrice');
    sealedProductStock = document.getElementById('sealedProductStock');
    saveSealedProductBtn = document.getElementById('saveSealedProductBtn');

    categoryModal = document.getElementById('categoryModal');
    categoryModalTitle = document.getElementById('categoryModalTitle');
    categoryForm = document.getElementById('categoryForm');
    categoryId = document.getElementById('categoryId');
    categoryName = document.getElementById('categoryName');
    saveCategoryBtn = document.getElementById('saveCategoryBtn');

    confirmModal = document.getElementById('confirmModal');
    confirmMessage = document.getElementById('confirmMessage');
    cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    cardsTable = document.getElementById('cardsTable');
    sealedProductsTable = document.getElementById('sealedProductsTable');
    categoriesTable = document.getElementById('categoriesTable');

    adminSearchInput = document.getElementById('adminSearchInput');
    adminCategoryFilter = document.getElementById('adminCategoryFilter');
    adminPrevPageBtn = document.getElementById('adminPrevPageBtn');
    adminNextPageBtn = document.getElementById('adminNextPageBtn');
    adminPageInfo = document.getElementById('adminPageInfo');

    adminSealedSearchInput = document.getElementById('adminSealedSearchInput');
    adminSealedCategoryFilter = document.getElementById('adminSealedCategoryFilter');
    adminSealedPrevPageBtn = document.getElementById('adminSealedPrevPageBtn');
    adminSealedNextPageBtn = document.getElementById('adminSealedNextPageBtn');
    adminSealedPageInfo = document.getElementById('adminSealedPageInfo');

    totalCardsCount = document.getElementById('totalCardsCount');
    totalSealedProductsCount = document.getElementById('totalSealedProductsCount');
    outOfStockCount = document.getElementById('outOfStockCount');
    uniqueCategoriesCount = document.getElementById('uniqueCategoriesCount');

    // Establecer la bandera DOM ready *después* de todas las asignaciones
    // Lógica de autenticación inicial:
    // Si ya hay un usuario autenticado (por sesión persistente de Firebase), cargar datos.
    // De lo contrario, mostrar el modal de login.
    if (auth.currentUser) {
        currentAdminUser = auth.currentUser;
        userId = currentAdminUser.uid;
        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData();
    } else {
        // En un entorno local sin __initial_auth_token, simplemente mostramos el modal de login.
        openModal(loginModal);
        clearLoginError();
    }

    // Adjuntar todos los listeners de eventos aquí (después de que los elementos DOM estén asignados)
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebarMenu.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(dashboardSection);
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            updateDashboardStats();
        });
    }

    if (navCards) {
        navCards.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(cardsSection);
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            currentCardsPage = 1;
            if (adminSearchInput) adminSearchInput.value = '';
            if (adminCategoryFilter) adminCategoryFilter.value = '';
            renderCardsTable();
        });
    }

    if (navSealedProducts) {
        navSealedProducts.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(sealedProductsSection);
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            currentSealedProductsPage = 1;
            if (adminSealedSearchInput) adminSealedSearchInput.value = '';
            if (adminSealedCategoryFilter) adminSealedCategoryFilter.value = '';
            renderSealedProductsTable();
        });
    }

    if (navCategories) {
        navCategories.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(categoriesSection);
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            renderCategoriesTable();
        });
    }

    if (navOrders) {
        navOrders.addEventListener('click', (e) => {
            e.preventDefault();
            alert('La gestión de pedidos estará disponible pronto.');
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    const refreshAdminPageBtn = document.getElementById('refreshAdminPageBtn');
    if (refreshAdminPageBtn) {
        refreshAdminPageBtn.addEventListener('click', async () => {
            alert('Refrescando datos del panel...');
            await loadAllData();
            alert('Datos actualizados.');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    document.querySelectorAll('.admin-modal .close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            closeModal(e.target.closest('.admin-modal'));
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === cardModal) closeModal(cardModal);
        if (event.target === sealedProductModal) closeModal(sealedProductModal);
        if (event.target === categoryModal) closeModal(categoryModal);
        if (event.target === confirmModal) closeModal(confirmModal);
        // El modal de inicio de sesión no se cierra intencionalmente al hacer clic fuera para forzar el inicio de sesión
        // if (event.target === loginModal && loginModal.style.display === 'flex') {
        //     // No cerrar el modal de inicio de sesión si está activo y se hace clic fuera
        //     // Esto fuerza al usuario a iniciar sesión.
        // }
    });

    // ======================= Cartas =======================
    if (addCardBtn) {
        addCardBtn.addEventListener('click', () => {
            cardModalTitle.textContent = 'Añadir Nueva Carta';
            cardForm.reset();
            cardId.value = ''; // Asegurarse de que el ID esté vacío para añadir
            openModal(cardModal);
        });
    }
    if (cardForm) {
        cardForm.addEventListener('submit', handleCardFormSubmit);
    }

    if (cardsTable) {
        cardsTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-button')) {
                const id = e.target.dataset.id;
                const card = allCards.find(c => c.id === id);
                if (card) {
                    cardModalTitle.textContent = 'Editar Carta';
                    cardId.value = card.id;
                    cardName.value = card.nombre; // Usar 'nombre'
                    cardImage.value = card.imagen; // Usar 'imagen'
                    cardPrice.value = card.precio;
                    cardStock.value = card.stock;
                    cardCategory.value = card.categoria; // Usar 'categoria'
                    openModal(cardModal);
                }
            } else if (e.target.classList.contains('delete-button')) {
                const id = e.target.dataset.id;
                const card = allCards.find(c => c.id === id);
                openConfirmModal(id, 'card', card ? card.nombre : 'esta carta'); // Usar 'nombre'
            }
        });
    }

    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', () => {
            currentCardsPage = 1;
            renderCardsTable();
        });
    }
    if (adminCategoryFilter) {
        adminCategoryFilter.addEventListener('change', () => {
            currentCardsPage = 1;
            renderCardsTable();
        });
    }
    if (adminPrevPageBtn) {
        adminPrevPageBtn.addEventListener('click', () => {
            if (currentCardsPage > 1) {
                currentCardsPage--;
                renderCardsTable();
            }
        });
    }
    if (adminNextPageBtn) {
        adminNextPageBtn.addEventListener('click', () => {
            const searchTerm = adminSearchInput.value.toLowerCase();
            const selectedCategory = adminCategoryFilter.value;
            const filteredCards = allCards.filter(card => {
                const matchesSearch = (card.nombre && card.nombre.toLowerCase().includes(searchTerm)) || (card.id && card.id.toLowerCase().includes(searchTerm));
                const matchesCategory = selectedCategory === '' || (card.categoria && card.categoria === selectedCategory);
                return matchesSearch && matchesCategory;
            });
            const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
            if (currentCardsPage < totalPages) {
                currentCardsPage++;
                renderCardsTable();
            }
        });
    }

    // ======================= Productos Sellados =======================
    if (addSealedProductBtn) {
        addSealedProductBtn.addEventListener('click', () => {
            sealedProductModalTitle.textContent = 'Añadir Nuevo Producto Sellado';
            sealedProductForm.reset();
            sealedProductId.value = ''; // Asegurarse de que el ID esté vacío para añadir
            openModal(sealedProductModal);
        });
    }
    if (sealedProductForm) {
        sealedProductForm.addEventListener('submit', handleSealedProductFormSubmit);
    }

    if (sealedProductsTable) {
        sealedProductsTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-sealed-product-button')) {
                const id = e.target.dataset.id;
                const product = allSealedProducts.find(p => p.id_producto === id);
                if (product) {
                    sealedProductModalTitle.textContent = 'Editar Producto Sellado';
                    sealedProductId.value = product.id_producto;
                    sealedProductName.value = product.producto; // Usar 'producto'
                    sealedProductImage.value = product.imagen; // Usar 'imagen'
                    sealedProductCategory.value = product.tipo_producto; // Usar 'tipo_producto'
                    sealedProductPrice.value = product.precio;
                    sealedProductStock.value = product.stock;
                    openModal(sealedProductModal);
                }
            } else if (e.target.classList.contains('delete-sealed-product-button')) {
                const id = e.target.dataset.id;
                const product = allSealedProducts.find(p => p.id_producto === id);
                openConfirmModal(id, 'sealed', product ? product.producto : 'este producto sellado'); // Usar 'producto'
            }
        });
    }

    if (adminSealedSearchInput) {
        adminSealedSearchInput.addEventListener('input', () => {
            currentSealedProductsPage = 1;
            renderSealedProductsTable();
        });
    }
    if (adminSealedCategoryFilter) {
        adminSealedCategoryFilter.addEventListener('change', () => {
            currentSealedProductsPage = 1;
            renderSealedProductsTable();
        });
    }
    if (adminSealedPrevPageBtn) {
        adminSealedPrevPageBtn.addEventListener('click', () => {
            if (currentSealedProductsPage > 1) {
                currentSealedProductsPage--;
                renderSealedProductsTable();
            }
        });
    }
    if (adminSealedNextPageBtn) {
        adminSealedNextPageBtn.addEventListener('click', () => {
            const searchTerm = adminSealedSearchInput.value.toLowerCase();
            const selectedCategory = adminSealedCategoryFilter.value;
            const filteredProducts = allSealedProducts.filter(product => {
                const matchesSearch = (product.producto && product.producto.toLowerCase().includes(searchTerm)) || (product.id_producto && product.id_producto.toLowerCase().includes(searchTerm));
                const matchesCategory = selectedCategory === '' || (product.tipo_producto && product.tipo_producto === selectedCategory);
                return matchesSearch && matchesCategory;
            });
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            if (currentSealedProductsPage < totalPages) {
                currentSealedProductsPage++;
                renderSealedProductsTable();
            }
        });
    }

    // ======================= Categorías =======================
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            categoryModalTitle.textContent = 'Añadir Nueva Categoría';
            categoryForm.reset();
            categoryId.value = ''; // Asegurarse de que el ID esté vacío para añadir
            openModal(categoryModal);
        });
    }
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    }

    if (categoriesTable) {
        categoriesTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-category-button')) {
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                categoryModalTitle.textContent = 'Editar Categoría';
                categoryId.value = id;
                categoryName.value = name;
                openModal(categoryModal);
            } else if (e.target.classList.contains('delete-category-button')) {
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                openConfirmModal(id, 'category', name);
            }
        });
    }

    // ======================= Confirmación de Eliminación =======================
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeletion);
    }
});
