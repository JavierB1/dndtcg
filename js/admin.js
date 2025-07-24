// ==========================================================================
// VARIABLES GLOBALES Y REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================================================

// Firebase y Firestore
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'; // Updated to v12.0.0
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'; // Updated to v12.0.0
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'; // Updated to v12.0.0
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js"; // Added for Analytics

// Your real Firebase configuration for dndtcgadmin
const firebaseConfig = {
    apiKey: "AIzaSyDjRTOnQ4d9-4l_W-EwRbYNQ8xkTLKbwsM",
    authDomain: "dndtcgadmin.firebaseapp.com",
    projectId: "dndtcgadmin",
    storageBucket: "dndtcgadmin.firebasestorage.app",
    messagingSenderId: "754642671504",
    appId: "1:754642671504:web:c087cc703862cf8c228515",
    measurementId: "G-T8KRZX5S7R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app); // Initialize Analytics

// App ID and User ID
const appId = firebaseConfig.projectId; // Now we can use the projectId directly
let userId = null; // Will be set after authentication
let currentAdminUser = null; // To store the Firebase Auth user object

// Netlify Function URL (IMPORTANT: Replace with your actual Netlify domain after deployment!)
const NETLIFY_FUNCTION_URL = 'https://luminous-frangipane-754b8d.netlify.app/.netlify/functions/manage-sheetdb'; // Replace with your Netlify domain

// SheetDB URLs for READ operations (these can be in the frontend for GET requests)
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau"; // URL for your cards sheet
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp"; // URL for your 'producto_sellado' sheet


// DOM element references
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarMenu = document.getElementById('sidebar-menu');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mainHeader = document.querySelector('.main-header');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const usernameInput = document.getElementById('username'); // Ensure this ID exists in your HTML
const passwordInput = document.getElementById('password'); // Ensure this ID exists in your HTML

const navDashboard = document.getElementById('nav-dashboard');
const navCards = document.getElementById('nav-cards');
const navSealedProducts = document.getElementById('nav-sealed-products');
const navCategories = document.getElementById('nav-categories');
const navOrders = document.getElementById('nav-orders');
const navLogout = document.getElementById('nav-logout');

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
// UTILITY FUNCTIONS
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
 * Makes a request to the Netlify function.
 * Includes the Firebase authentication token in the headers.
 * @param {string} entityType - The entity type ('cards', 'sealedProducts').
 * @param {string} action - The action to perform ('add', 'update', 'delete').
 * @param {Object} data - The data to send (for 'add'/'update').
 * @param {string} id - The ID of the item (for 'update'/'delete').
 * @returns {Promise<Object>} - The function's response.
 */
async function callNetlifyFunction(entityType, action, data = {}, id = null) {
    if (!currentAdminUser) {
        console.error('No authenticated admin user.');
        showLoginError('Please log in to perform this operation.');
        openModal(loginModal);
        throw new Error('Not authenticated.');
    }

    try {
        const idToken = await currentAdminUser.getIdToken(); // Get the Firebase Auth token

        const response = await fetch(NETLIFY_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` // Send the Firebase token in the Authorization header
            },
            body: JSON.stringify({ entityType, action, data, id })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Error in Netlify function: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error('Error calling Netlify function:', error);
        throw error;
    }
}

// ==========================================================================
// AUTHENTICATION FUNCTIONS (NOW WITH FIREBASE AUTH)
// ==========================================================================

async function handleLogin(event) {
    event.preventDefault();
    const email = usernameInput.value; // Use email for Firebase Auth
    const password = passwordInput.value; // Use password for Firebase Auth
    clearLoginError();

    try {
        // Log in with email and password from Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentAdminUser = userCredential.user; // Store the authenticated user
        userId = currentAdminUser.uid; // Update userId with Firebase UID

        closeModal(loginModal);
        showSection(dashboardSection);
        loadAllData();
        console.log('Admin logged in with Firebase Auth. User ID:', userId);
    } catch (error) {
        console.error('Error logging in with Firebase:', error);
        let errorMessage = 'Error logging in. Please try again.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Incorrect email or password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        }
        showLoginError(errorMessage);
    }
}

async function handleLogout() {
    try {
        await signOut(auth); // Log out from Firebase
        userId = null;
        currentAdminUser = null; // Clear authenticated user
        showSection(loginModal);
        clearLoginError();
        console.log('Logged out with Firebase Auth.');
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    }
}

// ==========================================================================
// DATA LOADING FUNCTIONS (Firestore and SheetDB)
// ==========================================================================

async function loadCategories() {
    try {
        const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
        const categorySnapshot = await getDocs(categoriesCol);
        allCategories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        populateCategoryFilters();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCardsData() {
    try {
        const response = await fetch(SHEETDB_CARDS_API_URL.replace(/"/g, ''));
        allCards = await response.json();
        renderCardsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading cards data:', error);
        alert('Error loading cards. Check console for more details.');
    }
}

async function loadSealedProductsData() {
    try {
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL.replace(/"/g, ''));
        allSealedProducts = await response.json();
        renderSealedProductsTable();
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading sealed products data:', error);
        alert('Error loading sealed products. Check console for more details.');
    }
}

async function loadAllData() {
    await loadCategories();
    await loadCardsData();
    await loadSealedProductsData();
}

function populateCategoryFilters() {
    const categories = [...new Set(allCategories.map(cat => cat.name))];

    adminCategoryFilter.innerHTML = '<option value="">All categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminCategoryFilter.appendChild(option);
    });

    adminSealedCategoryFilter.innerHTML = '<option value="">All categories</option>';
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
                    <button class="edit-button" data-id="${card.id}" data-type="card">Edit</button>
                    <button class="delete-button" data-id="${card.id}" data-type="card">Delete</button>
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
                    <button class="edit-sealed-product-button" data-id="${product.id_producto}" data-type="sealed">Edit</button>
                    <button class="delete-sealed-product-button" data-id="${product.id_producto}" data-type="sealed">Delete</button>
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
                    <button class="edit-category-button" data-id="${category.id}" data-name="${category.name}">Edit</button>
                    <button class="delete-category-button" data-id="${category.id}" data-name="${category.name}">Delete</button>
                </div>
            </td>
        `;
    });
}

function updatePaginationControls(currentPage, totalPages, prevBtn, nextBtn, infoSpan, totalItems) {
    infoSpan.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} items)`;
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
// DATA MANAGEMENT FUNCTIONS (CRUD via Netlify Functions)
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
        alert(`Card ${isEditing ? 'updated' : 'added'} successfully.`);
    } catch (error) {
        console.error('Error saving card:', error);
        alert(`Error saving card: ${error.message}`);
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
        alert(`Sealed product ${isEditing ? 'updated' : 'added'} successfully.`);
    } catch (error) {
        console.error('Error saving sealed product:', error);
        alert(`Error saving sealed product: ${error.message}`);
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
        
        console.log(`Category ${isEditing ? 'updated' : 'added'} successfully in Firestore.`);
        closeModal(categoryModal);
        await loadCategories();
        updateDashboardStats();
        alert(`Category ${isEditing ? 'updated' : 'added'} successfully.`);
    } catch (error) {
        console.error('Error saving category to Firestore:', error);
        alert(`Error saving category: ${error.message}`);
    }
}

function openConfirmModal(id, type, name = '') {
    currentDeleteTarget = { id, type, name };
    confirmMessage.textContent = `Are you sure you want to delete ${name ? '"' + name + '"' : 'this item'}?`;
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
            console.log(`Category deleted from Firestore.`);
        }
        console.log(result.message || `Item ${type} deleted.`);
        closeModal(confirmModal);
        alert(`Item ${type} deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`Error deleting ${type}: ${error.message}`);
    } finally {
        currentDeleteTarget = null;
    }
}


// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

// Initial Firebase authentication: Now only shows the login modal if no user is authenticated.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentAdminUser = user;
        userId = user.uid;
        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData();
        console.log('User authenticated:', userId);
    } else {
        // If no user is authenticated, always show the login modal
        openModal(loginModal);
        console.log('No authenticated user. Showing login modal.');
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
    alert('Order management will be available soon.');
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

document.getElementById('refreshAdminPageBtn').addEventListener('click', async () => {
    alert('Refreshing admin panel data...');
    await loadAllData();
    alert('Data updated.');
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
        // Do not close the login modal if it's active and clicked outside
        // This forces the user to log in.
    }
});

addCardBtn.addEventListener('click', () => {
    cardModalTitle.textContent = 'Add New Card';
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
            cardModalTitle.textContent = 'Edit Card';
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
        openConfirmModal(id, 'card', card ? card.name : 'this card');
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
    sealedProductModalTitle.textContent = 'Add New Sealed Product';
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
            sealedProductModalTitle.textContent = 'Edit Sealed Product';
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
        openConfirmModal(id, 'sealed', product ? product.name : 'this sealed product');
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
    categoryModalTitle.textContent = 'Add New Category';
    categoryForm.reset();
    categoryId.value = '';
    openModal(categoryModal);
});
categoryForm.addEventListener('submit', handleCategoryFormSubmit);

categoriesTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-category-button')) {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        categoryModalTitle.textContent = 'Edit Category';
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

// Initial data loading is done after authentication in onAuthStateChanged
