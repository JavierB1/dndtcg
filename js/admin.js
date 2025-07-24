// ==========================================================================
// GLOBAL VARIABLES AND DOM ELEMENT REFERENCES
// ==========================================================================

// Firebase and Firestore SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

// Your actual Firebase configuration for dndtcgadmin project
// IMPORTANT: Replace with your specific Firebase project configuration
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
const analytics = getAnalytics(app); // Initialize Analytics

// Application ID and User ID
const appId = firebaseConfig.projectId; // Use projectId as appId for Firestore paths
let userId = null; // Will be set after successful Firebase authentication
let currentAdminUser = null; // Stores the authenticated Firebase User object

// Netlify Function URL
// IMPORTANT: Ensure this URL points to your deployed Netlify function
const NETLIFY_FUNCTION_URL = 'https://luminous-frangipane-754b8d.netlify.app/.netlify/functions/manage-sheetdb';

// SheetDB URLs for READ operations (safe to be in frontend for GET requests)
const SHEETDB_CARDS_API_URL = "https://sheetdb.io/api/v1/uqi0ko63u6yau";
const SHEETDB_SEALED_PRODUCTS_API_URL = "https://sheetdb.io/api/v1/vxfb9yfps7owp";


// DOM element references
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarMenu = document.getElementById('sidebar-menu');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mainHeader = document.querySelector('.main-header');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

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
const addSealedProductBtn = document = document.getElementById('addSealedProductBtn');
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

/**
 * Shows a specific admin section and hides all others.
 * @param {HTMLElement} sectionToShow - The DOM element of the section to display.
 */
function showSection(sectionToShow) {
    const sections = [dashboardSection, cardsSection, sealedProductsSection, categoriesSection];
    sections.forEach(section => {
        section.classList.remove('active');
    });
    sectionToShow.classList.add('active');
}

/**
 * Opens a modal.
 * @param {HTMLElement} modalElement - The modal DOM element to open.
 */
function openModal(modalElement) {
    modalElement.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent body scroll
}

/**
 * Closes a modal.
 * @param {HTMLElement} modalElement - The modal DOM element to close.
 */
function closeModal(modalElement) {
    modalElement.style.display = 'none';
    document.body.style.overflow = ''; // Restore body scroll
}

/**
 * Displays a login error message.
 * @param {string} message - The message to display.
 */
function showLoginError(message) {
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
}

/**
 * Clears the login error message.
 */
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
    // Ensure an admin user is authenticated before making the call
    if (!currentAdminUser) {
        console.error('No authenticated admin user.');
        showLoginError('Please log in to perform this operation.');
        openModal(loginModal);
        throw new Error('Not authenticated.');
    }

    try {
        // Get the Firebase ID token for the currently authenticated user
        const idToken = await currentAdminUser.getIdToken();

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
            // Handle errors from the Netlify function
            throw new Error(result.message || `Error in Netlify function: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error('Error calling Netlify function:', error);
        alert(`Operation failed: ${error.message}`); // Display user-friendly error
        throw error;
    }
}

// ==========================================================================
// AUTHENTICATION FUNCTIONS (FIREBASE AUTH)
// ==========================================================================

/**
 * Handles the admin login process using Firebase Email/Password authentication.
 * @param {Event} event - The form submission event.
 */
async function handleLogin(event) {
    event.preventDefault();
    const email = usernameInput.value;
    const password = passwordInput.value;
    clearLoginError();

    try {
        // Sign in with email and password using Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentAdminUser = userCredential.user; // Store the authenticated user object
        userId = currentAdminUser.uid; // Update userId with Firebase UID

        closeModal(loginModal); // Close the login modal
        showSection(dashboardSection); // Show the dashboard
        await loadAllData(); // Load all necessary data for the admin panel
        console.log('Admin logged in with Firebase Auth. User ID:', userId);
    } catch (error) {
        console.error('Error logging in with Firebase:', error);
        let errorMessage = 'Error logging in. Please try again.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Incorrect email or password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        }
        showLoginError(errorMessage); // Display specific error message to the user
    }
}

/**
 * Handles the admin logout process using Firebase authentication.
 */
async function handleLogout() {
    try {
        await signOut(auth); // Sign out from Firebase
        userId = null; // Clear user ID
        currentAdminUser = null; // Clear authenticated user object
        showSection(loginModal); // Show the login modal again
        clearLoginError(); // Clear any previous login errors
        console.log('Logged out with Firebase Auth.');
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    }
}

// ==========================================================================
// DATA LOADING FUNCTIONS (Firestore for Categories, SheetDB for Cards/Sealed Products)
// ==========================================================================

/**
 * Loads all categories from Firestore.
 */
async function loadCategories() {
    try {
        // Query the public categories collection in Firestore
        const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
        const categorySnapshot = await getDocs(categoriesCol);
        allCategories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        populateCategoryFilters(); // Update category filters and datalists
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Error loading categories. Check console for more details.');
    }
}

/**
 * Loads all cards data from SheetDB (direct read for display).
 */
async function loadCardsData() {
    try {
        // Fetch cards data directly from SheetDB API
        const response = await fetch(SHEETDB_CARDS_API_URL.replace(/"/g, ''));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allCards = await response.json();
        renderCardsTable(); // Render the cards table
        updateDashboardStats(); // Update dashboard statistics
    } catch (error) {
        console.error('Error loading cards data:', error);
        alert('Error loading cards. Check console for more details.');
    }
}

/**
 * Loads all sealed products data from SheetDB (direct read for display).
 */
async function loadSealedProductsData() {
    try {
        // Fetch sealed products data directly from SheetDB API
        const response = await fetch(SHEETDB_SEALED_PRODUCTS_API_URL.replace(/"/g, ''));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allSealedProducts = await response.json();
        renderSealedProductsTable(); // Render the sealed products table
        updateDashboardStats(); // Update dashboard statistics
    } catch (error) {
        console.error('Error loading sealed products data:', error);
        alert('Error loading sealed products. Check console for more details.');
    }
}

/**
 * Loads all necessary data for the admin panel (categories, cards, sealed products).
 */
async function loadAllData() {
    await loadCategories();
    await loadCardsData();
    await loadSealedProductsData();
}

/**
 * Populates category filters and datalists in forms.
 */
function populateCategoryFilters() {
    // Extract unique category names from loaded categories
    const categories = [...new Set(allCategories.map(cat => cat.name))];

    // Populate cards category filter
    adminCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminCategoryFilter.appendChild(option);
    });

    // Populate sealed products category filter
    adminSealedCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminSealedCategoryFilter.appendChild(option);
    });

    // Populate datalists for card and sealed product forms
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
 * Renders the cards table with filtering and pagination.
 */
function renderCardsTable() {
    cardsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;

    // Filter cards based on search term and selected category
    let filteredCards = allCards.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm) || card.id.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || card.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredCards.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const startIndex = (currentCardsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    // Populate table rows
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

/**
 * Renders the sealed products table with filtering and pagination.
 */
function renderSealedProductsTable() {
    sealedProductsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedCategory = adminSealedCategoryFilter.value;

    // Filter products based on search term and selected category
    let filteredProducts = allSealedProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || product.id_producto.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredProducts.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentSealedProductsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    // Populate table rows
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

/**
 * Renders the categories table.
 */
async function renderCategoriesTable() {
    categoriesTable.querySelector('tbody').innerHTML = '';
    // Categories are loaded from Firestore, no pagination needed if few.
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

/**
 * Updates pagination controls (page info, prev/next button states).
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {HTMLElement} prevBtn - The previous page button element.
 * @param {HTMLElement} nextBtn - The next page button element.
 * @param {HTMLElement} infoSpan - The span element displaying page information.
 * @param {number} totalItems - The total count of filtered items.
 */
function updatePaginationControls(currentPage, totalPages, prevBtn, nextBtn, infoSpan, totalItems) {
    infoSpan.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} items)`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Updates the dashboard statistics (total cards, sealed products, out of stock, unique categories).
 */
function updateDashboardStats() {
    totalCardsCount.textContent = allCards.length;
    totalSealedProductsCount.textContent = allSealedProducts.length;
    outOfStockCount.textContent = allCards.filter(card => card.stock === 0).length + allSealedProducts.filter(product => product.stock === 0).length;
    uniqueCategoriesCount.textContent = allCategories.length;
}

// ==========================================================================
// DATA MANAGEMENT FUNCTIONS (CRUD via Netlify Functions for Cards/Sealed Products)
// (Categories managed directly with Firestore)
// ==========================================================================

/**
 * Handles the submission of the card form (add/edit).
 * @param {Event} event - The form submission event.
 */
async function handleCardFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!cardId.value; // Check if it's an edit operation
    const cardData = {
        id: cardId.value || `C${Date.now()}`, // Generate new ID if adding
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
        closeModal(cardModal); // Close the modal
        await loadCardsData(); // Reload data to update table
        alert(`Carta ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error saving card:', error);
        alert(`Error al guardar carta: ${error.message}`);
    }
}

/**
 * Handles the submission of the sealed product form (add/edit).
 * @param {Event} event - The form submission event.
 */
async function handleSealedProductFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!sealedProductId.value; // Check if it's an edit operation
    const productData = {
        id_producto: sealedProductId.value || `S${Date.now()}`, // Generate new ID if adding
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
        closeModal(sealedProductModal); // Close the modal
        await loadSealedProductsData(); // Reload data to update table
        alert(`Producto sellado ${isEditing ? 'actualizado' : 'añadido'} con éxito.`);
    } catch (error) {
        console.error('Error saving sealed product:', error);
        alert(`Error al guardar producto sellado: ${error.message}`);
    }
}

/**
 * Handles the submission of the category form (add/edit).
 * This function interacts ONLY with Firestore.
 * @param {Event} event - The form submission event.
 */
async function handleCategoryFormSubmit(event) {
    event.preventDefault();
    const isEditing = !!categoryId.value; // Check if it's an edit operation
    const categoryData = {
        name: categoryName.value
    };
    const categoryDocId = categoryId.value;

    try {
        if (isEditing) {
            // Update existing category in Firestore
            const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, categoryDocId);
            await updateDoc(categoryRef, categoryData);
        } else {
            // Add new category to Firestore
            const categoriesCol = collection(db, `artifacts/${appId}/public/data/categories`);
            await addDoc(categoriesCol, categoryData);
        }
        
        console.log(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito en Firestore.`);
        closeModal(categoryModal); // Close the modal
        await loadCategories(); // Reload categories to update filters and tables
        updateDashboardStats(); // Update dashboard statistics
        alert(`Categoría ${isEditing ? 'actualizada' : 'añadida'} con éxito.`);
    } catch (error) {
        console.error('Error saving category to Firestore:', error);
        alert(`Error al guardar categoría: ${error.message}`);
    }
}

/**
 * Opens the confirmation modal for deletion.
 * @param {string} id - The ID of the item to delete.
 * @param {string} type - The type of item ('card', 'sealed', 'category').
 * @param {string} name - The name of the item (for display in message).
 */
function openConfirmModal(id, type, name = '') {
    currentDeleteTarget = { id, type, name };
    confirmMessage.textContent = `¿Estás seguro de que quieres eliminar ${name ? '"' + name + '"' : 'este elemento'}?`;
    openModal(confirmModal);
}

/**
 * Confirms and executes the deletion of the item.
 */
async function confirmDeletion() {
    if (!currentDeleteTarget) return; // If no item is selected for deletion, do nothing

    const { id, type, name } = currentDeleteTarget;
    try {
        let result;
        if (type === 'card') {
            // Delete card via Netlify function
            result = await callNetlifyFunction('cards', 'delete', {}, id);
            await loadCardsData(); // Reload cards data
        } else if (type === 'sealed') {
            // Delete sealed product via Netlify function
            result = await callNetlifyFunction('sealedProducts', 'delete', {}, id);
            await loadSealedProductsData(); // Reload sealed products data
        } else if (type === 'category') {
            // Delete category directly from Firestore
            const categoryRef = doc(db, `artifacts/${appId}/public/data/categories`, id);
            await deleteDoc(categoryRef);
            await loadCategories(); // Reload categories
            updateDashboardStats(); // Update dashboard stats
            console.log(`Categoría eliminada de Firestore.`);
        }
        console.log(result.message || `Elemento ${type} eliminado.`);
        closeModal(confirmModal); // Close confirmation modal
        alert(`Elemento ${type} eliminado con éxito.`);
    } catch (error) {
        console.error(`Error al eliminar ${type}:`, error);
        alert(`Error al eliminar ${type}: ${error.message}`);
    } finally {
        currentDeleteTarget = null; // Clear the deletion target
    }
}


// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

// Initial Firebase authentication check:
// This listener fires when the authentication state changes (e.g., on page load, login, logout).
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // If a user is authenticated (logged in)
        currentAdminUser = user; // Store the authenticated user object
        userId = user.uid; // Get the user's UID
        closeModal(loginModal); // Close the login modal if it's open
        showSection(dashboardSection); // Show the dashboard section
        await loadAllData(); // Load all data for the admin panel
        console.log('User authenticated:', userId);
    } else {
        // If no user is authenticated, always show the login modal to force authentication.
        openModal(loginModal);
        console.log('No authenticated user. Showing login modal.');
    }
});

// Add an event listener to sign out when the page is unloaded (closed or refreshed)
window.addEventListener('unload', async () => {
    // Note: signOut is asynchronous. There's no guarantee it will complete before the page unloads,
    // especially if the browser is closing quickly.
    // For robust security, rely on Firebase's session expiration and server-side token validation.
    console.log('Page is unloading. Attempting to sign out...');
    try {
        await signOut(auth);
        console.log('Signed out successfully on unload.');
    } catch (error) {
        console.error('Error signing out on unload:', error);
    }
});


// Sidebar toggle button events
sidebarToggleBtn.addEventListener('click', () => {
    sidebarMenu.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

// Sidebar overlay click event (closes sidebar when clicking outside)
sidebarOverlay.addEventListener('click', () => {
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

// Navigation links events
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(dashboardSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    updateDashboardStats(); // Ensure dashboard stats are updated
});

navCards.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(cardsSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    currentCardsPage = 1; // Reset pagination
    adminSearchInput.value = ''; // Clear search input
    adminCategoryFilter.value = ''; // Clear category filter
    renderCardsTable(); // Re-render table with fresh state
});

navSealedProducts.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(sealedProductsSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    currentSealedProductsPage = 1; // Reset pagination
    adminSealedSearchInput.value = ''; // Clear search input
    adminSealedCategoryFilter.value = ''; // Clear category filter
    renderSealedProductsTable(); // Re-render table with fresh state
});

navCategories.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(categoriesSection);
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    renderCategoriesTable(); // Render categories table
});

navOrders.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Order management will be available soon.'); // Placeholder for future functionality
    sidebarMenu.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout(); // Handle user logout
});

// Refresh button event
document.getElementById('refreshAdminPageBtn').addEventListener('click', async () => {
    alert('Refreshing admin panel data...');
    await loadAllData(); // Reload all data
    alert('Data updated.');
});

// Login form submission event
loginForm.addEventListener('submit', handleLogin);

// Close buttons for modals
document.querySelectorAll('.admin-modal .close-button').forEach(button => {
    button.addEventListener('click', (e) => {
        closeModal(e.target.closest('.admin-modal'));
    });
});

// Close modals when clicking outside their content (except login modal)
window.addEventListener('click', (event) => {
    if (event.target === cardModal) closeModal(cardModal);
    if (event.target === sealedProductModal) closeModal(sealedProductModal);
    if (event.target === categoryModal) closeModal(categoryModal);
    if (event.target === confirmModal) closeModal(confirmModal);
    // The login modal is intentionally not closed by clicking outside to force login
});

// ======================= Cards =======================
addCardBtn.addEventListener('click', () => {
    cardModalTitle.textContent = 'Add New Card';
    cardForm.reset(); // Clear form fields
    cardId.value = ''; // Ensure ID is empty for new entry
    openModal(cardModal);
});
cardForm.addEventListener('submit', handleCardFormSubmit); // Handle card form submission

cardsTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-button')) {
        // Handle edit button click for cards
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
        // Handle delete button click for cards
        const id = e.target.dataset.id;
        const card = allCards.find(c => c.id === id);
        openConfirmModal(id, 'card', card ? card.name : 'this card');
    }
});

adminSearchInput.addEventListener('input', () => {
    currentCardsPage = 1; // Reset page on search
    renderCardsTable();
});
adminCategoryFilter.addEventListener('change', () => {
    currentCardsPage = 1; // Reset page on filter change
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

// ======================= Sealed Products =======================
addSealedProductBtn.addEventListener('click', () => {
    sealedProductModalTitle.textContent = 'Add New Sealed Product';
    sealedProductForm.reset(); // Clear form fields
    sealedProductId.value = ''; // Ensure ID is empty for new entry
    openModal(sealedProductModal);
});
sealedProductForm.addEventListener('submit', handleSealedProductFormSubmit); // Handle sealed product form submission

sealedProductsTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-sealed-product-button')) {
        // Handle edit button click for sealed products
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
        // Handle delete button click for sealed products
        const id = e.target.dataset.id;
        const product = allSealedProducts.find(p => p.id_producto === id);
        openConfirmModal(id, 'sealed', product ? product.name : 'this sealed product');
    }
});

adminSealedSearchInput.addEventListener('input', () => {
    currentSealedProductsPage = 1; // Reset page on search
    renderSealedProductsTable();
});
adminSealedCategoryFilter.addEventListener('change', () => {
    currentSealedProductsPage = 1; // Reset page on filter change
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

// ======================= Categories =======================
addCategoryBtn.addEventListener('click', () => {
    categoryModalTitle.textContent = 'Add New Category';
    categoryForm.reset(); // Clear form fields
    categoryId.value = ''; // Ensure ID is empty for new entry
    openModal(categoryModal);
});
categoryForm.addEventListener('submit', handleCategoryFormSubmit); // Handle category form submission

categoriesTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-category-button')) {
        // Handle edit button click for categories
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        categoryModalTitle.textContent = 'Edit Category';
        categoryId.value = id;
        categoryName.value = name;
        openModal(categoryModal);
    } else if (e.target.classList.contains('delete-category-button')) {
        // Handle delete button click for categories
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        openConfirmModal(id, 'category', name);
    }
});

// ======================= Confirmation of Deletion =======================
cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
confirmDeleteBtn.addEventListener('click', confirmDeletion);

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================
// Initial data loading is handled by the onAuthStateChanged listener after Firebase authentication state is determined.
