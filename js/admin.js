// ==========================================================================
// VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================================================

// Firebase y Firestore
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'; // Actualizado a v12.0.0
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'; // Actualizado a v12.0.0
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'; // Actualizado a v12.0.0
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js"; // Añadido para Analytics

// Tu configuración real de Firebase para dndtcgadmin
const firebaseConfig = {
    apiKey: "AIzaSyDjRTOnQ4d9-4l_W-EwRbYNQ8xkTLKbwsM",
    authDomain: "dndtcgadmin.firebaseapp.com",
    projectId: "dndtcgadmin",
    storageBucket: "dndtcgadmin.firebasestorage.app",
    messagingSenderId: "754642671504",
    appId: "1:754642671504:web:c087cc703862cf8c228515",
    measurementId: "G-T8KRZX5S7R"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app); // Inicializa Analytics

// ID de la aplicación y del usuario
const appId = firebaseConfig.projectId; // Ahora podemos usar el projectId directamente
let userId = null; // Se establecerá después de la autenticación
let currentAdminUser = null; // Para almacenar el objeto de usuario de Firebase Auth

// URL de la función de Netlify (¡IMPORTANTE: Reemplaza con tu URL real después de desplegar!)
const NETLIFY_FUNCTION_URL = 'https://luminous-frangipane-754b8d.netlify.app/.netlify/functions/manage-sheetdb'; // Reemplaza con tu dominio Netlify

// Las URLs de SheetDB para LECTURA (estas sí pueden estar en el frontend si solo son para GET)
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau"; // URL de tus cartas
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp"; // URL para tu hoja 'producto_sellado'


// Referencias a elementos del DOM
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarMenu = document.getElementById('sidebar-menu');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mainHeader = document.querySelector('.main-header');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const usernameInput = document.getElementById('username'); // Asegúrate de que este ID exista en tu HTML
const passwordInput = document.getElementById('password'); // Asegúrate de que este ID exista en tu HTML

const navDashboard = document.getElementById('nav-dashboard');
const navCards = document.getElementById('nav-cards');
const navSealedProducts = document.getElementById('nav-sealed-products');
const navCategories = document.getElementById('nav-categories');
const navOrders = document.getElementById('nav-orders');
const navLogout = document = document.getElementById('nav-logout');

const dashboardSection = document.getElementById('dashboard-section');
const cardsSection = document.getElementById('cards-section');
const sealedProductsSection = document.getElementById('sealed-products-section');
const categoriesSection = document.getElementById('categories-section');

const addCardBtn = document.getElementById('addCardBtn');
const addSealedProductBtn = document.getElementById('addSealedProductBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');

const cardModal = document.getElementById('cardModal');
const cardModalTitle = document.getElementById('cardModalTitle');
const cardForm = document.getElementById('cardForm');
const cardId = document.getElementById('cardId');
const cardName = document.getElementById('cardName');
const cardImage = document.getElementById('cardImage');
const cardPrice = document.getElementById('cardPrice');
const cardStock = document.getElementById('cardStock');
const cardCategory = document.getElementById('cardCategory');
const categoryOptions = document.getElementById('categoryOptions');
const saveCardBtn = document.getElementById('saveCardBtn');

const sealedProductModal = document.getElementById('sealedProductModal');
const sealedProductModalTitle = document.getElementById('sealedProductModalTitle');
const sealedProductForm = document.getElementById('sealedProductForm');
const sealedProductId = document.getElementById('sealedProductId');
const sealedProductName = document.getElementById('sealedProductName');
const sealedProductImage = document.getElementById('sealedProductImage');
const sealedProductCategory = document.getElementById('sealedProductCategory');
const sealedProductCategoryOptions = document.getElementById('sealedProductCategoryOptions');
const sealedProductPrice = document.getElementById('sealedProductPrice');
const sealedProductStock = document.getElementById('sealedProductStock');
const saveSealedProductBtn = document.getElementById('saveSealedProductBtn');

const categoryModal = document.getElementById('categoryModal');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const categoryForm = document.getElementById('categoryForm');
const categoryId = document.getElementById('categoryId');
const categoryName = document.getElementById('categoryName');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const cardsTable = document.getElementById('cardsTable');
const sealedProductsTable = document.getElementById('sealedProductsTable');
const categoriesTable = document.getElementById('categoriesTable');

const adminSearchInput = document.getElementById('adminSearchInput');
const adminCategoryFilter = document.getElementById('adminCategoryFilter');
const adminPrevPageBtn = document.getElementById('adminPrevPageBtn');
const adminNextPageBtn = document.getElementById('adminNextPageBtn');
const adminPageInfo = document.getElementById('adminPageInfo');

const adminSealedSearchInput = document.getElementById('adminSealedSearchInput');
const adminSealedCategoryFilter = document.getElementById('adminSealedCategoryFilter');
const adminSealedPrevPageBtn = document.getElementById('adminSealedPrevPageBtn');
const adminSealedNextPageBtn = document.getElementById('adminSealedNextPageBtn');
const adminSealedPageInfo = document.getElementById('adminSealedPageInfo');

const totalCardsCount = document.getElementById('totalCardsCount');
const totalSealedProductsCount = document.getElementById('totalSealedProductsCount');
const outOfStockCount = document.getElementById('outOfStockCount');
const uniqueCategoriesCount = document.getElementById('uniqueCategoriesCount');

let allCards = [];
let allSealedProducts = [];
let allCategories = [];

const itemsPerPage = 10;
let currentCardsPage = 1;
let currentSealedProductsPage = 1;

let currentDeleteTarget = null;

// ==========================================================================
// FUNCIONES DE UTILIDAD
// ==========================================================================

function showSection(sectionToShow) {
    const sections = [dashboardSection, cardsSection, sealedProductsSection, categoriesSection];
    sections.forEach(section => {
        section.classList.remove('active');
    });
    sectionToShow.classList.add('active');
}

function openModal(modalElement) {
    modalElement.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalElement) {
    modalElement.style.display = 'none';
    document.body.style.overflow = '';
}

function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
}

function clearLoginError() {
    loginMessage.textContent = '';
    loginMessage.style.display = 'none';
}

/**
 * Realiza una petición a la función de Netlify.
 * Incluye el token de autenticación de Firebase en las cabeceras.
 * @param {string} entityType - El tipo de entidad ('cards', 'sealedProducts').
 * @param {string} action - La acción a realizar ('add', 'update', 'delete').
 * @param {Object} data - Los datos a enviar (para 'add'/'update').
 * @param {string} id - El ID del elemento (para 'update'/'delete').
 * @returns {Promise<Object>} - La respuesta de la función.
 */
async function callNetlifyFunction(entityType, action, data = {}, id = null) {
    if (!currentAdminUser) {
        console.error('No hay usuario administrador autenticado.');
        showLoginError('Por favor, inicia sesión para realizar esta operación.');
        openModal(loginModal);
        throw new Error('No autenticado.');
    }

    try {
        const idToken = await currentAdminUser.getIdToken(); // Obtiene el token de Firebase Auth

        const response = await fetch(NETLIFY_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` // Envía el token de Firebase en la cabecera Authorization
            },
            body: JSON.stringify({ entityType, action, data, id })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Error en la función de Netlify: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error('Error al llamar a la función de Netlify:', error);
        throw error;
    }
}

// ==========================================================================
// FUNCIONES DE AUTENTICACIÓN (AHORA CON FIREBASE AUTH)
// ==========================================================================

async function handleLogin(event) {
    event.preventDefault();
    const email = usernameInput.value; // Usar email para Firebase Auth
    const password = passwordInput.value; // Usar password para Firebase Auth
    clearLoginError();

    try {
        // Iniciar sesión con email y contraseña de Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentAdminUser = userCredential.user; // Almacena el usuario autenticado
        userId = currentAdminUser.uid; // Actualiza el userId con el UID de Firebase

        closeModal(loginModal);
        showSection(dashboardSection);
        loadAllData();
        console.log('Admin logeado con Firebase Auth. User ID:', userId);
    } catch (error) {
        console.error('Error al iniciar sesión con Firebase:', error);
        let errorMessage = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Correo electrónico o contraseña incorrectos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de correo electrónico inválido.';
        }
        showLoginError(errorMessage);
    }
}

async function handleLogout() {
    try {
        await signOut(auth); // Cerrar sesión de Firebase
        userId = null;
        currentAdminUser = null; // Limpiar el usuario autenticado
        showSection(loginModal);
        clearLoginError();
        console.log('Sesión cerrada con Firebase Auth.');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
    }
}

// ==========================================================================
// FUNCIONES DE CARGA DE DATOS (Firestore y SheetDB)
// ==========================================================================

async function loadCategories() {
    try {
        const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
        const categorySnapshot = await getDocs(categoriesCol);
        allCategories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        populateCategoryFilters();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function loadCardsData() {
    try {
        const response = await fetch(SHEETDB_CARDS_API_URL.replace(/"/g, ''));
        allCards = await response.json();
        renderCardsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error al cargar datos de cartas:', error);
        alert('Error al cargar cartas. Verifica la consola para más detalles.');
    }
}

async function loadSealedProductsData() {
    try {
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL.replace(/"/g, ''));
        allSealedProducts = await response.json();
        renderSealedProductsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error al cargar datos de productos sellados:', error);
        alert('Error al cargar productos sellados. Verifica la consola para más detalles.');
    }
}

async function loadAllData() {
    await loadCategories();
    await loadCardsData();
    await loadSealedProductsData();
}

function populateCategoryFilters() {
    const categories = [...new Set(allCategories.map(cat => cat.name))];

    adminCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminCategoryFilter.appendChild(option);
    });

    adminSealedCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
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
// FUNCIONES DE RENDERIZADO DE TABLAS
// ==========================================================================

function renderCardsTable() {
    cardsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;

    let filteredCards = allCards.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm) || card.id.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || card.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredCards.sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const startIndex = (currentCardsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    cardsToDisplay.forEach(card => {
        const row = cardsTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${card.id}</td>
            <td><img src="${card.image}" alt="${card.name}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=No+Image';" /></td>
            <td>${card.name}</td>
            <td>$${card.price.toFixed(2)}</td>
            <td>${card.stock}</td>
            <td>${card.category}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-button" data-id="${card.id}" data-type="card">Editar</button>
                    <button class="delete-button" data-id="${card.id}" data-type="card">Eliminar</button>
                </div>
            </td>
        `;
    });

    updatePaginationControls(currentCardsPage, totalPages, adminPrevPageBtn, adminNextPageBtn, adminPageInfo, filteredCards.length);
}

function renderSealedProductsTable() {
    sealedProductsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedCategory = adminSealedCategoryFilter.value;

    let filteredProducts = allSealedProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || product.id_producto.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentSealedProductsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    productsToDisplay.forEach(product => {
        const row = sealedProductsTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${product.id_producto}</td>
            <td><img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=No+Image';" /></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-sealed-product-button" data-id="${product.id_producto}" data-type="sealed">Editar</button>
                    <button class="delete-sealed-product-button" data-id="${product.id_producto}" data-type="sealed">Eliminar</button>
                </div>
            </td>
        `;
    });

    updatePaginationControls(currentSealedProductsPage, totalPages, adminSealedPrevPageBtn, adminSealedNextPageBtn, adminSealedPageInfo, filteredProducts.length);
}

async function renderCategoriesTable() {
    categoriesTable.querySelector('tbody').innerHTML = '';
    allCategories.forEach(category => {
        const row = categoriesTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${category.name}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-category-button" data-id="${category.id}" data-name="${category.name}">Editar</button>
                    <button class="delete-category-button" data-id="${category.id}" data-name="${category.name}">Eliminar</button>
                </div>
            </td>
        `;
    });
}

function updatePaginationControls(currentPage, totalPages, prevBtn, nextBtn, infoSpan, totalItems) {
    infoSpan.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} items)`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function updateDashboardStats() {
    totalCardsCount.textContent = allCards.length;
    totalSealedProductsCount.textContent = allSealedProducts.length;
    outOfStockCount.textContent = allCards.filter(card => card.stock === 0).length + allSealedProducts.filter(product => product.stock === 0).length;
    uniqueCategoriesCount.textContent = allCategories.length;
}

// ==========================================================================
// FUNCIONES DE GESTIÓN DE DATOS (CRUD a través de Netlify Functions)
// ==========================================================================

async function handleCardFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!cardId.value;
    const cardData = {
        id: cardId.value || `C${Date.now()}`,
        name: cardName.value,
        image: cardImage.value,
        price: parseFloat(cardPrice.value),
        stock: parseInt(cardStock.value),
        category: cardCategory.value
    };

    try {
        let result;
        if (isEditing) {
            result = await callNetlifyFunction('cards', 'update', cardData, cardData.id);
        } else {
            result = await callNetlifyFunction('cards', 'add', cardData);
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

async function handleSealedProductFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!sealedProductId.value;
    const productData = {
        id_producto: sealedProductId.value || `S${Date.now()}`,
        name: sealedProductName.value,
        image: sealedProductImage.value,
        category: sealedProductCategory.value,
        price: parseFloat(sealedProductPrice.value),
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
        closeModal(sealedProductModal);
        await loadSealedProductsData();
        alert(`Producto sellado ${isEditing ? 'actualizado' : 'añadido'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar producto sellado:', error);
        alert(`Error al guardar producto sellado: ${error.message}`);
    }
}

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
        
        console.log(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito en Firestore.`);
        closeModal(categoryModal);
        await loadCategories();
        updateDashboardStats();
        alert(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error al guardar categoría en Firestore:', error);
        alert(`Error al guardar categoría: ${error.message}`);
    }
}

function openConfirmModal(id, type, name = '') {
    currentDeleteTarget = { id, type, name };
    confirmMessage.textContent = `¿Estás seguro de que quieres eliminar ${name ? '"' + name + '"' : 'este elemento'}?`;
    openModal(confirmModal);
}

async function confirmDeletion() {
    if (!currentDeleteTarget) return;

    const { id, type, name } = currentDeleteTarget;
    try {
        let result;
        if (type === 'card') {
            result = await callNetlifyFunction('cards', 'delete', {}, id);
            await loadCardsData();
        } else if (type === 'sealed') {
            result = await callNetlifyFunction('sealedProducts', 'delete', {}, id);
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentAdminUser = user;
        userId = user.uid;
        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData();
        console.log('Usuario autenticado:', userId);
    } else {
        // En un entorno de producción, aquí se mostraría siempre el modal de login
        // para forzar la autenticación.
        // Para el entorno de Canvas, se intenta signInAnonymously si hay token inicial.
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
            } catch (authError) {
                console.error("Error signing in with custom token:", authError);
                try {
                    await signInAnonymously(auth);
                } catch (anonSignInError) {
                    console.error("Error signing in anonymously:", anonSignInError);
                    openModal(loginModal);
                }
            }
        } else {
            try {
                await signInAnonymously(auth);
            } catch (anonError) {
                console.error("Error signing in anonymously:", anonError);
                openModal(loginModal);
            }
        }
    }
});

sidebarToggleBtn.addEventListener('click', () => {
    sidebarMenu.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(dashboardSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    updateDashboardStats();
});

navCards.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(cardsSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    currentCardsPage = 1;
    adminSearchInput.value = '';
    adminCategoryFilter.value = '';
    renderCardsTable();
});

navSealedProducts.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(sealedProductsSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    currentSealedProductsPage = 1;
    adminSealedSearchInput.value = '';
    adminSealedCategoryFilter.value = '';
    renderSealedProductsTable();
});

navCategories.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(categoriesSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    renderCategoriesTable();
});

navOrders.addEventListener('click', (e) => {
    e.preventDefault();
    alert('La gestión de pedidos estará disponible pronto.');
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

document.getElementById('refreshAdminPageBtn').addEventListener('click', async () => {
    alert('Refrescando datos del panel...');
    await loadAllData();
    alert('Datos actualizados.');
});

loginForm.addEventListener('submit', handleLogin);

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
    if (event.target === loginModal && loginModal.style.display === 'flex') {
    }
});

addCardBtn.addEventListener('click', () => {
    cardModalTitle.textContent = 'Añadir Nueva Carta';
    cardForm.reset();
    cardId.value = '';
    openModal(cardModal);
});
cardForm.addEventListener('submit', handleCardFormSubmit);

cardsTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-button')) {
        const id = e.target.dataset.id;
        const card = allCards.find(c => c.id === id);
        if (card) {
            cardModalTitle.textContent = 'Editar Carta';
            cardId.value = card.id;
            cardName.value = card.name;
            cardImage.value = card.image;
            cardPrice.value = card.price;
            cardStock.value = card.stock;
            cardCategory.value = card.category;
            openModal(cardModal);
        }
    } else if (e.target.classList.contains('delete-button')) {
        const id = e.target.dataset.id;
        const card = allCards.find(c => c.id === id);
        openConfirmModal(id, 'card', card ? card.name : 'esta carta');
    }
});

adminSearchInput.addEventListener('input', () => {
    currentCardsPage = 1;
    renderCardsTable();
});
adminCategoryFilter.addEventListener('change', () => {
    currentCardsPage = 1;
    renderCardsTable();
});
adminPrevPageBtn.addEventListener('click', () => {
    if (currentCardsPage > 1) {
        currentCardsPage--;
        renderCardsTable();
    }
});
adminNextPageBtn.addEventListener('click', () => {
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;
    const filteredCards = allCards.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm) || card.id.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || card.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    if (currentCardsPage < totalPages) {
        currentCardsPage++;
        renderCardsTable();
    }
});

addSealedProductBtn.addEventListener('click', () => {
    sealedProductModalTitle.textContent = 'Añadir Nuevo Producto Sellado';
    sealedProductForm.reset();
    sealedProductId.value = '';
    openModal(sealedProductModal);
});
sealedProductForm.addEventListener('submit', handleSealedProductFormSubmit);

sealedProductsTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-sealed-product-button')) {
        const id = e.target.dataset.id;
        const product = allSealedProducts.find(p => p.id_producto === id);
        if (product) {
            sealedProductModalTitle.textContent = 'Editar Producto Sellado';
            sealedProductId.value = product.id_producto;
            sealedProductName.value = product.name;
            sealedProductImage.value = product.image;
            sealedProductCategory.value = product.category;
            sealedProductPrice.value = product.price;
            sealedProductStock.value = product.stock;
            openModal(sealedProductModal);
        }
    } else if (e.target.classList.contains('delete-sealed-product-button')) {
        const id = e.target.dataset.id;
        const product = allSealedProducts.find(p => p.id_producto === id);
        openConfirmModal(id, 'sealed', product ? product.name : 'este producto sellado');
    }
});

adminSealedSearchInput.addEventListener('input', () => {
    currentSealedProductsPage = 1;
    renderSealedProductsTable();
});
adminSealedCategoryFilter.addEventListener('change', () => {
    currentSealedProductsPage = 1;
    renderSealedProductsTable();
});
adminSealedPrevPageBtn.addEventListener('click', () => {
    if (currentSealedProductsPage > 1) {
        currentSealedProductsPage--;
        renderSealedProductsTable();
    }
});
adminSealedNextPageBtn.addEventListener('click', () => {
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedCategory = adminSealedCategoryFilter.value;
    const filteredProducts = allSealedProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || product.id_producto.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentSealedProductsPage < totalPages) {
        currentSealedProductsPage++;
        renderSealedProductsTable();
    }
});

addCategoryBtn.addEventListener('click', () => {
    categoryModalTitle.textContent = 'Añadir Nueva Categoría';
    categoryForm.reset();
    categoryId.value = '';
    openModal(categoryModal);
});
categoryForm.addEventListener('submit', handleCategoryFormSubmit);

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

cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
confirmDeleteBtn.addEventListener('click', confirmDeletion);

// La carga inicial de datos se realiza después de la autenticación en onAuthStateChanged
