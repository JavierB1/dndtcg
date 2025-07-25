// ==========================================================================
// GLOBAL VARIABLES (non-DOM related)
// ==========================================================================

// Firebase and Firestore SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

// Your actual Firebase configuration for dndtcgadmin project
const firebaseConfig = {
    apiKey: "AIzaSyDjRTOnQ4d9-4l_W-EwRbYNQ8xkTLKbwsM",
    authDomain: "dndtcgadmin.firebaseapp.com",
    projectId: "dndtcgadmin",
    storageBucket: "dndtcgadmin.firebasestorage.app",
    messagingSenderId: "754642671504",
    appId: "1:754642671504:web:c087cc703862cf8c228515",
    measurementId: "G-T8KRZX5S7R"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Application ID and User ID
const appId = firebaseConfig.projectId;
let userId = null;
let currentAdminUser = null;
let pendingAuthUser = null; // Used to store user if authenticated before DOM is ready
let isDomReady = false; // Flag to indicate if DOMContentLoaded has fired

// Netlify Function URL
const NETLIFY_FUNCTION_URL = 'https://luminous-frangipane-754b8d.netlify.app/.netlify/functions/manage-sheetdb';

// SheetDB URLs for READ operations
// NOTA: Estas URLs son para lectura directa desde el frontend. Asegúrate de que tus hojas de cálculo
// tengan los permisos de lectura configurados para "cualquiera" en SheetDB.
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau";
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp";

let allCards = [];
let allSealedProducts = [];
let allCategories = [];

const itemsPerPage = 10;
let currentCardsPage = 1;
let currentSealedProductsPage = 1;

let currentDeleteTarget = null;

// ==========================================================================
// DOM ELEMENT REFERENCES (Declaradas con 'let' en el ámbito global)
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
let categoryOptions;
let saveCardBtn;

let sealedProductModal;
let sealedProductModalTitle;
let sealedProductForm;
let sealedProductId;
let sealedProductName;
let sealedProductImage;
let sealedProductCategory;
let sealedProductCategoryOptions;
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
// UTILITY FUNCTIONS (Estas funciones ahora pueden acceder a las variables DOM globales)
// ==========================================================================

/**
 * Muestra una sección del panel de administración y oculta las demás.
 * @param {HTMLElement} sectionToShow - El elemento DOM de la sección a mostrar.
 */
function showSection(sectionToShow) {
    const sections = [dashboardSection, cardsSection, sealedProductsSection, categoriesSection];
    sections.forEach(section => {
        if (section) section.classList.remove('active'); // Se añade null check para seguridad
    });
    if (sectionToShow) { // Se añade null check para seguridad
        sectionToShow.classList.add('active');
    }
}

/**
 * Abre un modal.
 * @param {HTMLElement} modalElement - El elemento modal a abrir.
 */
function openModal(modalElement) {
    if (modalElement) { // Se añade null check para seguridad
        modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Evita el scroll del body
    }
}

/**
 * Cierra un modal.
 * @param {HTMLElement} modalElement - El elemento modal a cerrar.
 */
function closeModal(modalElement) {
    if (modalElement) { // Se añade null check para seguridad
        modalElement.style.display = 'none';
        document.body.style.overflow = ''; // Restaura el scroll del body
    }
}

/**
 * Muestra un mensaje de error en el modal de login.
 * @param {string} message - El mensaje a mostrar.
 */
function showLoginError(message) {
    if (loginMessage) { // Se añade null check para seguridad
        loginMessage.textContent = message;
        loginMessage.style.display = 'block';
    }
}

/**
 * Limpia el mensaje de error del modal de login.
 */
function clearLoginError() {
    if (loginMessage) { // Se añade null check para seguridad
        loginMessage.textContent = '';
        loginMessage.style.display = 'none';
    }
}

/**
 * Realiza una petición a la función Netlify.
 * Incluye el token de autenticación de Firebase en las cabeceras.
 * @param {string} entityType - El tipo de entidad ('cards', 'sealedProducts').
 * @param {string} action - La acción a realizar ('add', 'update', 'delete').
 * @param {Object} data - Los datos a enviar (para 'add'/'update').
 * @param {string} id - El ID del elemento (para 'update'/'delete').
 * @returns {Promise<Object>} - La respuesta de la función Netlify.
 */
async function callNetlifyFunction(entityType, action, data = {}, id = null) {
    // Asegurarse de que un usuario administrador esté autenticado antes de hacer la llamada
    if (!currentAdminUser) {
        console.error('No hay usuario administrador autenticado.');
        showLoginError('Por favor, inicia sesión para realizar esta operación.');
        openModal(loginModal);
        throw new Error('No autenticado.');
    }

    try {
        // Obtener el token de ID de Firebase para el usuario autenticado actualmente
        const idToken = await currentAdminUser.getIdToken();

        const response = await fetch(NETLIFY_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` // Enviar el token de Firebase en la cabecera Authorization
            },
            body: JSON.stringify({ entityType, action, data, id })
        });

        const result = await response.json();
        if (!response.ok) {
            // Manejar errores de la función Netlify
            throw new Error(result.message || `Error en la función Netlify: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error('Error al llamar a la función Netlify:', error);
        alert(`Operación fallida: ${error.message}`); // Mostrar error amigable al usuario
        throw error;
    }
}

// ==========================================================================
// FUNCIONES DE AUTENTICACIÓN (FIREBASE AUTH)
// ==========================================================================

/**
 * Maneja el proceso de inicio de sesión del administrador usando la autenticación de Email/Contraseña de Firebase.
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleLogin(event) {
    event.preventDefault();
    const email = usernameInput ? usernameInput.value : ''; // Se añade null check
    const password = passwordInput ? passwordInput.value : ''; // Se añade null check
    clearLoginError();

    try {
        // Iniciar sesión con email y contraseña usando Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentAdminUser = userCredential.user; // Almacenar el objeto de usuario autenticado
        userId = currentAdminUser.uid; // Actualizar userId con el UID de Firebase

        // Actualizar la interfaz de usuario y cargar datos directamente, ya que esto es activado por la acción del usuario (envío del formulario de inicio de sesión)
        closeModal(loginModal); // Cerrar el modal de inicio de sesión
        showSection(dashboardSection); // Mostrar el dashboard
        await loadAllData(); // Cargar todos los datos necesarios para el panel de administración
        
        console.log('Administrador ha iniciado sesión con Firebase Auth. ID de usuario:', userId);
    } catch (error) {
        console.error('Error al iniciar sesión con Firebase:', error);
        let errorMessage = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Correo electrónico o contraseña incorrectos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de correo electrónico no válido.';
        }
        showLoginError(errorMessage); // Mostrar mensaje de error específico al usuario
    }
}

/**
 * Maneja el proceso de cierre de sesión del administrador usando la autenticación de Firebase.
 */
async function handleLogout() {
    try {
        await signOut(auth); // Cerrar sesión de Firebase
        userId = null; // Limpiar ID de usuario
        currentAdminUser = null; // Limpiar objeto de usuario autenticado
        // Actualizar la interfaz de usuario directamente, ya que esto es activado por la acción del usuario (clic en el botón de cerrar sesión)
        openModal(loginModal); // Mostrar el modal de inicio de sesión de nuevo
        clearLoginError(); // Limpiar cualquier error de inicio de sesión anterior
        
        console.log('Sesión cerrada con Firebase Auth.');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
    }
}

// ==========================================================================
// FUNCIONES DE CARGA DE DATOS (Firestore para Categorías, SheetDB para Cartas/Productos Sellados)
// ==========================================================================

/**
 * Carga todas las categorías desde Firestore.
 */
async function loadCategories() {
    try {
        // Consultar la colección de categorías públicas en Firestore
        const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
        const categorySnapshot = await getDocs(categoriesCol);
        allCategories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        populateCategoryFilters(); // Actualizar filtros de categoría y datalists
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
        // Obtener datos de cartas directamente de la API de SheetDB
        const response = await fetch(SHEETDB_CARDS_API_URL.replace(/"/g, ''));
        if (!response.ok) {
            throw new Error(`¡Error HTTP! estado: ${response.status}`);
        }
        allCards = await response.json();
        
        renderCardsTable(); // Renderizar la tabla de cartas
        updateDashboardStats(); // Actualizar estadísticas del dashboard
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
        // Obtener datos de productos sellados directamente de la API de SheetDB
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL.replace(/"/g, ''));
        if (!response.ok) {
            throw new Error(`¡Error HTTP! estado: ${response.status}`);
        }
        allSealedProducts = await response.json();
        
        renderSealedProductsTable(); // Renderizar la tabla de productos sellados
        updateDashboardStats(); // Actualizar estadísticas del dashboard
    } catch (error) {
        console.error('Error al cargar datos de productos sellados:', error);
        alert('Error al cargar productos sellados. Consulta la consola para más detalles.');
    }
}

/**
 * Carga todos los datos necesarios para el panel de administración (categorías, cartas, productos sellados).
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
    // Asegurarse de que los elementos existan antes de intentar rellenarlos
    // NOTA: Si estas advertencias persisten, VERIFICA los IDs en tu archivo admin.html
    if (!adminCategoryFilter || !adminSealedCategoryFilter || !categoryOptions || !sealedProductCategoryOptions) {
        console.warn("Los elementos DOM para los filtros de categoría aún no están disponibles. Por favor, verifica los IDs en admin.html.");
        return;
    }

    // Extraer nombres de categorías únicos de las categorías cargadas
    const categories = [...new Set(allCategories.map(cat => cat.name))];

    // Rellenar filtro de categorías de cartas
    adminCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminCategoryFilter.appendChild(option);
    });

    // Rellenar filtro de categorías de productos sellados
    adminSealedCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminSealedCategoryFilter.appendChild(option);
    });

    // Rellenar datalists para formularios de cartas y productos sellados
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
// FUNCIONES DE RENDERIZADO DE TABLAS
// ==========================================================================

/**
 * Renderiza la tabla de cartas con filtrado y paginación.
 */
function renderCardsTable() {
    // NOTA: Si estas advertencias persisten, VERIFICA los IDs en tu archivo admin.html
    if (!cardsTable || !adminSearchInput || !adminCategoryFilter || !adminPrevPageBtn || !adminNextPageBtn || !adminPageInfo) {
        console.warn("Los elementos DOM para la tabla de cartas aún no están disponibles. Por favor, verifica los IDs en admin.html.");
        return;
    }
    cardsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;

    // Filtrar cartas según el término de búsqueda y la categoría seleccionada
    let filteredCards = allCards.filter(card => {
        // Asegurarse de que las propiedades existan antes de llamar a toLowerCase
        const cardName = card.nombre ? card.nombre.toLowerCase() : ''; // CAMBIO: Usar card.nombre
        const cardId = card.id ? card.id.toLowerCase() : '';
        const matchesSearch = cardName.includes(searchTerm) || cardId.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || card.categoria === selectedCategory; // CAMBIO: Usar card.categoria
        return matchesSearch && matchesCategory;
    });

    filteredCards.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')); // Ordenar alfabéticamente por nombre, manejando nulos/indefinidos

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const startIndex = (currentCardsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    // Rellenar filas de la tabla
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
    // NOTA: Si estas advertencias persisten, VERIFICA los IDs en tu archivo admin.html
    if (!sealedProductsTable || !adminSealedSearchInput || !adminSealedCategoryFilter || !adminSealedPrevPageBtn || !adminSealedNextPageBtn || !adminSealedPageInfo) {
        console.warn("Los elementos DOM para la tabla de productos sellados aún no están disponibles. Por favor, verifica los IDs en admin.html.");
        return;
    }
    sealedProductsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedCategory = adminSealedCategoryFilter.value;

    // Filtrar productos según el término de búsqueda y la categoría seleccionada
    let filteredProducts = allSealedProducts.filter(product => {
        // Asegurarse de que las propiedades existan antes de llamar a toLowerCase
        const productName = product.producto ? product.producto.toLowerCase() : ''; // CAMBIO: Usar product.producto
        const productId = product.id_producto ? product.id_producto.toLowerCase() : '';
        const matchesSearch = productName.includes(searchTerm) || productId.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || product.tipo_producto === selectedCategory; // CAMBIO: Usar product.tipo_producto
        return matchesSearch && matchesCategory;
    });

    filteredProducts.sort((a, b) => (a.producto || '').localeCompare(b.producto || '')); // Ordenar alfabéticamente por nombre, manejando nulos/indefinidos

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentSealedProductsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    // Rellenar filas de la tabla
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
    // NOTA: Si estas advertencias persisten, VERIFICA los IDs en tu archivo admin.html
    if (!categoriesTable) {
        console.warn("El elemento DOM para la tabla de categorías aún no está disponible. Por favor, verifica los IDs en admin.html.");
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
 * Actualiza los controles de paginación (información de página, estados de botón anterior/siguiente).
 * @param {number} currentPage - El número de página actual.
 * @param {number} totalPages - El número total de páginas.
 * @param {HTMLElement} prevBtn - El elemento del botón de página anterior.
 * @param {HTMLElement} nextBtn - El elemento del botón de página siguiente.
 * @param {HTMLElement} infoSpan - El elemento span que muestra la información de la página.
 * @param {number} totalItems - El recuento total de elementos filtrados.
 */
function updatePaginationControls(currentPage, totalPages, prevBtn, nextBtn, infoSpan, totalItems) {
    // Se añaden null checks para seguridad
    if (!infoSpan || !prevBtn || !nextBtn) {
        console.warn("Los elementos DOM de control de paginación aún no están disponibles. Por favor, verifica los IDs en admin.html.");
        return;
    }
    infoSpan.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} items)`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Actualiza las estadísticas del dashboard (total de cartas, productos sellados, agotados, categorías únicas).
 */
function updateDashboardStats() {
    // Se añaden null checks para seguridad
    if (!totalCardsCount || !totalSealedProductsCount || !outOfStockCount || !uniqueCategoriesCount) {
        console.warn("Los elementos DOM de estadísticas del dashboard aún no están disponibles. Por favor, verifica los IDs en admin.html.");
        return;
    }
    totalCardsCount.textContent = allCards.length;
    totalSealedProductsCount.textContent = allSealedProducts.length;
    outOfStockCount.textContent = allCards.filter(card => (card.stock || 0) === 0).length + allSealedProducts.filter(product => (product.stock || 0) === 0).length;
    uniqueCategoriesCount.textContent = allCategories.length;
}

// ==========================================================================
// FUNCIONES DE GESTIÓN DE DATOS (CRUD a través de funciones Netlify para Cartas/Productos Sellados)
// (Categorías gestionadas directamente con Firestore)
// ==========================================================================

/**
 * Maneja el envío del formulario de cartas (añadir/editar).
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleCardFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!cardId.value; // Verificar si es una operación de edición
    const cardData = {
        id: cardId.value || `C${Date.now()}`, // Generar nuevo ID si se está añadiendo
        nombre: cardName.value, // CAMBIO: Usar 'nombre'
        imagen: cardImage.value, // CAMBIO: Usar 'imagen'
        precio: parseFloat(cardPrice.value),
        stock: parseInt(cardStock.value),
        categoria: cardCategory.value // CAMBIO: Usar 'categoria'
    };

    try {
        let result;
        if (isEditing) {
            result = await callNetlifyFunction('cards', 'update', cardData, cardData.id);
        } else {
            result = await callNetlifyFunction('cards', 'add', cardData);
        }
        console.log(result.message, result.data);
        closeModal(cardModal); // Cerrar el modal
        await loadCardsData(); // Recargar datos para actualizar la tabla
        alert(`Carta ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar carta:', error);
        alert(`Error al guardar carta: ${error.message}`);
    }
}

/**
 * Maneja el envío del formulario de productos sellados (añadir/editar).
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleSealedProductFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!sealedProductId.value; // Verificar si es una operación de edición
    const productData = {
        id_producto: sealedProductId.value || `S${Date.now()}`, // Generar nuevo ID si se está añadiendo
        producto: sealedProductName.value, // CAMBIO: Usar 'producto'
        imagen: sealedProductImage.value, // CAMBIO: Usar 'imagen'
        tipo_producto: sealedProductCategory.value, // CAMBIO: Usar 'tipo_producto'
        precio: parseFloat(sealedProductPrice.value),
        stock: parseInt(sealedProductStock.value)
    };

    try {
        let result;
        if (isEditing) {
            result = await callNetlifyFunction('sealedProducts', 'update', productData, productData.id_producto);
        } else {
            result = await callNetlifyFunction('sealedProducts', 'add', productData);
        }
        console.log(result.message, result.data);
        closeModal(sealedProductModal); // Cerrar el modal
        await loadSealedProductsData(); // Recargar datos para actualizar la tabla
        alert(`Producto sellado ${isEditing ? 'actualizado' : 'añadido'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar producto sellado:', error);
        alert(`Error al guardar producto sellado: ${error.message}`);
    }
}

/**
 * Maneja el envío del formulario de categorías (añadir/editar).
 * Esta función interactúa ÚNICAMENTE con Firestore.
 * @param {Event} event - El evento de envío del formulario.
 */
async function handleCategoryFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!categoryId.value; // Verificar si es una operación de edición
    const categoryData = {
        name: categoryName.value
    };
    const categoryDocId = categoryId.value;

    try {
        if (isEditing) {
            // Actualizar categoría existente en Firestore
            const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, categoryDocId);
            await updateDoc(categoryRef, categoryData);
        } else {
            // Añadir nueva categoría a Firestore
            const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
            await addDoc(categoriesCol, categoryData);
        }
        
        console.log(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito en Firestore.`);
        closeModal(categoryModal); // Cerrar el modal
        await loadCategories(); // Recargar categorías para actualizar filtros y tablas
        updateDashboardStats(); // Actualizar estadísticas del dashboard
        alert(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar categoría en Firestore:', error);
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
    if (confirmMessage) confirmMessage.textContent = `¿Estás seguro de que quieres eliminar ${name ? '"' + name + '"' : 'este elemento'}?`; // Se añade null check
    openModal(confirmModal);
}

/**
 * Confirma y ejecuta la eliminación del elemento.
 */
async function confirmDeletion() {
    if (!currentDeleteTarget) return; // Si no hay elemento seleccionado para eliminar, no hacer nada

    const { id, type, name } = currentDeleteTarget;
    try {
        let result;
        if (type === 'card') {
            // Eliminar carta a través de la función Netlify
            result = await callNetlifyFunction('cards', 'delete', {}, id);
            await loadCardsData(); // Recargar datos de cartas
        } else if (type === 'sealed') {
            // Eliminar producto sellado a través de la función Netlify
            result = await callNetlifyFunction('sealedProducts', 'delete', {}, id);
            await loadSealedProductsData(); // Recargar datos de productos sellados
        } else if (type === 'category') {
            // Eliminar categoría directamente de Firestore
            const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, id);
            await deleteDoc(categoryRef);
            await loadCategories(); // Recargar categorías
            updateDashboardStats(); // Actualizar estadísticas del dashboard
            console.log(`Categoría eliminada de Firestore.`);
        }
        console.log(result.message || `Elemento ${type} eliminado.`);
        closeModal(confirmModal); // Cerrar modal de confirmación
        alert(`Elemento ${type} eliminado con éxito.`);
    } catch (error) {
        console.error(`Error al eliminar ${type}:`, error);
        alert(`Error al eliminar ${type}: ${error.message}`);
    } finally {
        currentDeleteTarget = null; // Limpiar el objetivo de eliminación
    }
}


// ==========================================================================
// EVENT LISTENERS (El listener de autenticación permanece global, otros se mueven a DOMContentLoaded)
// ==========================================================================

// Verificación inicial de autenticación de Firebase:
// Este listener se dispara cuando el estado de autenticación cambia (ej. al cargar la página, iniciar sesión, cerrar sesión).
// Permanece fuera de DOMContentLoaded ya que es un listener principal del SDK de Firebase y necesita dispararse temprano.
onAuthStateChanged(auth, (user) => {
    currentAdminUser = user;
    userId = user ? user.uid : null;
    console.log('Cambio de estado de autenticación de Firebase. Usuario:', userId);
    // IMPORTANTE: No hay manipulación de la interfaz de usuario aquí. El listener DOMContentLoaded manejará el estado inicial de la interfaz de usuario.
    // Si un usuario inicia/cierra sesión *después* de la carga inicial, las funciones handleLogin/handleLogout
    // gestionarán explícitamente la interfaz de usuario.
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
    // Asignar a variables 'let' declaradas globalmente
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
    isDomReady = true;

    // Lógica de autenticación inicial para el entorno Canvas
    // Esta parte intenta iniciar sesión de forma anónima o con un token personalizado primero.
    // El listener onAuthStateChanged luego actualizará currentAdminUser.
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
            await auth.signInWithCustomToken(__initial_auth_token);
        } catch (error) {
            console.error("Error al iniciar sesión con token personalizado:", error);
            // Fallback a anónimo si el token personalizado falla
            try {
                await auth.signInAnonymously();
            } catch (anonError) {
                console.error("Error al iniciar sesión anónimamente:", anonError);
            }
        }
    } else {
        try {
            await auth.signInAnonymously();
        } catch (anonError) {
            console.error("Error al iniciar sesión anónimamente:", anonError);
        }
    }

    // Ahora, después de los intentos iniciales de inicio de sesión, verificar el estado de autenticación actual
    // e inicializar la interfaz de usuario. Esto asegura que currentAdminUser esté configurado correctamente.
    // Esta verificación debe ocurrir DESPUÉS de que los intentos iniciales de inicio de sesión hayan potencialmente actualizado currentAdminUser.
    // Podemos usar un pequeño retraso o asegurarnos de que onAuthStateChanged se haya disparado.
    // Sin embargo, onAuthStateChanged es asíncrono. La forma más segura es
    // verificar explícitamente `auth.currentUser` después de los intentos iniciales de inicio de sesión.
    if (auth.currentUser) {
        currentAdminUser = auth.currentUser; // Asegurar que currentAdminUser esté actualizado
        userId = currentAdminUser.uid;
        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData();
    } else {
        // Si no hay ningún usuario autenticado después de los intentos iniciales, mostrar el modal de inicio de sesión.
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
                // CAMBIO: Buscar por el ID correcto de SheetDB
                const card = allCards.find(c => c.id === id); 
                if (card) {
                    cardModalTitle.textContent = 'Editar Carta';
                    cardId.value = card.id;
                    cardName.value = card.nombre; // CAMBIO: Usar card.nombre
                    cardImage.value = card.imagen; // CAMBIO: Usar card.imagen
                    cardPrice.value = card.precio;
                    cardStock.value = card.stock;
                    cardCategory.value = card.categoria; // CAMBIO: Usar card.categoria
                    openModal(cardModal);
                }
            } else if (e.target.classList.contains('delete-button')) {
                const id = e.target.dataset.id;
                const card = allCards.find(c => c.id === id); // CAMBIO: Buscar por el ID correcto de SheetDB
                openConfirmModal(id, 'card', card ? card.nombre : 'esta carta'); // CAMBIO: Usar card.nombre
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
                // CAMBIO: Usar nombres de campos de SheetDB
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
                // CAMBIO: Buscar por el ID correcto de SheetDB
                const product = allSealedProducts.find(p => p.id_producto === id);
                if (product) {
                    sealedProductModalTitle.textContent = 'Editar Producto Sellado';
                    sealedProductId.value = product.id_producto;
                    sealedProductName.value = product.producto; // CAMBIO: Usar product.producto
                    sealedProductImage.value = product.imagen; // CAMBIO: Usar product.imagen
                    sealedProductCategory.value = product.tipo_producto; // CAMBIO: Usar product.tipo_producto
                    sealedProductPrice.value = product.precio;
                    sealedProductStock.value = product.stock;
                    openModal(sealedProductModal);
                }
            } else if (e.target.classList.contains('delete-sealed-product-button')) {
                const id = e.target.dataset.id;
                const product = allSealedProducts.find(p => p.id_producto === id); // CAMBIO: Buscar por el ID correcto de SheetDB
                openConfirmModal(id, 'sealed', product ? product.producto : 'este producto sellado'); // CAMBIO: Usar product.producto
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
                // CAMBIO: Usar nombres de campos de SheetDB
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
