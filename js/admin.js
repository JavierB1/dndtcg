// ==========================================================================
// GLOBAL VARIABLES (non-DOM related)
// ==========================================================================

// Firebase and Firestore SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
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
let pendingAuthUser = null;
let isDomReady = false;

// Netlify Function URL
const NETLIFY_FUNCTION_URL = 'https://luminous-frangipane-754b8d.netlify.app/.netlify/functions/manage-sheetdb';

// SheetDB URLs for READ operations
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
 * Shows a specific admin section and hides all others.
 * @param {HTMLElement} sectionToShow - The DOM element of the section to display.
 */
function showSection(sectionToShow) {
    const sections = [dashboardSection, cardsSection, sealedProductsSection, categoriesSection];
    sections.forEach(section => {
        section.classList.remove('active');
    });
    if (sectionToShow) { // Added null check
        sectionToShow.classList.add('active');
    }
}

/**
 * Opens a modal.
 * @param {HTMLElement} modalElement - The modal DOM element to open.
 */
function openModal(modalElement) {
    if (modalElement) { // Added null check
        modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent body scroll
    }
}

/**
 * Closes a modal.
 * @param {HTMLElement} modalElement - The modal DOM element to close.
 */
function closeModal(modalElement) {
    if (modalElement) { // Added null check
        modalElement.style.display = 'none';
        document.body.style.overflow = ''; // Restore body scroll
    }
}

/**
 * Displays a login error message.
 * @param {string} message - The message to display.
 */
function showLoginError(message) {
    if (loginMessage) { // Added null check
        loginMessage.textContent = message;
        loginMessage.style.display = 'block';
    }
}

/**
 * Clears the login error message.
 */
function clearLoginError() {
    if (loginMessage) { // Added null check
        loginMessage.textContent = '';
        loginMessage.style.display = 'none';
    }
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

        // Directly update UI and load data as this is triggered by user action (login form submit)
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
        // Directly update UI as this is triggered by user action (logout button click)
        openModal(loginModal); // Show the login modal again
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
    // Ensure elements exist before trying to populate them
    if (!adminCategoryFilter || !adminSealedCategoryFilter || !categoryOptions || !sealedProductCategoryOptions) {
        console.warn("DOM elements for category filters not yet available.");
        return;
    }

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
    if (!cardsTable || !adminSearchInput || !adminCategoryFilter || !adminPrevPageBtn || !adminNextPageBtn || !adminPageInfo) {
        console.warn("DOM elements for cards table not yet available.");
        return;
    }
    cardsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSearchInput.value.toLowerCase();
    const selectedCategory = adminCategoryFilter.value;

    // Filter cards based on search term and selected category
    let filteredCards = allCards.filter(card => {
        // Ensure card.name and card.id exist before calling toLowerCase
        const cardName = card.name ? card.name.toLowerCase() : '';
        const cardId = card.id ? card.id.toLowerCase() : '';
        const matchesSearch = cardName.includes(searchTerm) || cardId.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || card.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredCards.sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort alphabetically by name, handling null/undefined

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const startIndex = (currentCardsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const cardsToDisplay = filteredCards.slice(startIndex, endIndex);

    // Populate table rows
    cardsToDisplay.forEach(card => {
        const row = cardsTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${card.id || ''}</td>
            <td><img src="${card.image || 'https://placehold.co/50x50/cccccc/333333?text=No+Image'}" alt="${card.name || 'No Image'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=No+Image';" /></td>
            <td>${card.name || ''}</td>
            <td>$${(card.price || 0).toFixed(2)}</td>
            <td>${card.stock || 0}</td>
            <td>${card.category || ''}</td>
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
 * Renders the sealed products table with filtering and pagination.
 */
function renderSealedProductsTable() {
    if (!sealedProductsTable || !adminSealedSearchInput || !adminSealedCategoryFilter || !adminSealedPrevPageBtn || !adminSealedNextPageBtn || !adminSealedPageInfo) {
        console.warn("DOM elements for sealed products table not yet available.");
        return;
    }
    sealedProductsTable.querySelector('tbody').innerHTML = '';
    const searchTerm = adminSealedSearchInput.value.toLowerCase();
    const selectedCategory = adminSealedCategoryFilter.value;

    // Filter products based on search term and selected category
    let filteredProducts = allSealedProducts.filter(product => {
        // Ensure product.name and product.id_producto exist before calling toLowerCase
        const productName = product.name ? product.name.toLowerCase() : '';
        const productId = product.id_producto ? product.id_producto.toLowerCase() : '';
        const matchesSearch = productName.includes(searchTerm) || productId.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort alphabetically by name, handling null/undefined

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentSealedProductsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    // Populate table rows
    productsToDisplay.forEach(product => {
        const row = sealedProductsTable.querySelector('tbody').insertRow();
        row.innerHTML = `
            <td>${product.id_producto || ''}</td>
            <td><img src="${product.image || 'https://placehold.co/50x50/cccccc/333333?text=No+Image'}" alt="${product.name || 'No Image'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/cccccc/333333?text=No+Image';" /></td>
            <td>${product.name || ''}</td>
            <td>${product.category || ''}</td>
            <td>$${(product.price || 0).toFixed(2)}</td>
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
 * Renders the categories table.
 */
async function renderCategoriesTable() {
    if (!categoriesTable) {
        console.warn("DOM element for categories table not yet available.");
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
 * Updates pagination controls (page info, prev/next button states).
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {HTMLElement} prevBtn - The previous page button element.
 * @param {HTMLElement} nextBtn - The next page button element.
 * @param {HTMLElement} infoSpan - The span element displaying page information.
 * @param {number} totalItems - The total count of filtered items.
 */
function updatePaginationControls(currentPage, totalPages, prevBtn, nextBtn, infoSpan, totalItems) {
    if (!infoSpan || !prevBtn || !nextBtn) { // Added null checks
        console.warn("Pagination control DOM elements not yet available.");
        return;
    }
    infoSpan.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} items)`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Updates the dashboard statistics (total cards, sealed products, out of stock, unique categories).
 */
function updateDashboardStats() {
    if (!totalCardsCount || !totalSealedProductsCount || !outOfStockCount || !uniqueCategoriesCount) {
        console.warn("Dashboard stats DOM elements not yet available.");
        return;
    }
    totalCardsCount.textContent = allCards.length;
    totalSealedProductsCount.textContent = allSealedProducts.length;
    outOfStockCount.textContent = allCards.filter(card => (card.stock || 0) === 0).length + allSealedProducts.filter(product => (product.stock || 0) === 0).length;
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
// EVENT LISTENERS (Authentication listener remains global, others move to DOMContentLoaded)
// ==========================================================================

// Initial Firebase authentication check:
// This listener fires when the authentication state changes (e.g., on page load, login, logout).
// It remains outside DOMContentLoaded as it's a core Firebase SDK listener and needs to fire early.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentAdminUser = user;
        userId = user.uid;
        console.log('User authenticated:', userId);
        if (isDomReady) {
            // If DOM is already ready, directly update UI and load data.
            closeModal(loginModal);
            showSection(dashboardSection);
            await loadAllData();
        } else {
            // If DOM is not ready, store user and wait for DOMContentLoaded to handle UI
            pendingAuthUser = user; 
        }
    } else {
        currentAdminUser = null;
        userId = null;
        console.log('No authenticated user.');
        if (isDomReady) {
            // If DOM is already ready, show login modal.
            openModal(loginModal);
            clearLoginError();
        } else {
            // If DOM is not ready, ensure no pending user. DOMContentLoaded will show login modal.
            pendingAuthUser = null; 
        }
    }
});

// Add an event listener to sign out when the page is unloaded (closed or refreshed)
window.addEventListener('unload', async () => {
    console.log('Page is unloading. Attempting to sign out...');
    try {
        await signOut(auth);
        console.log('Signed out successfully on unload.');
    } catch (error) {
        console.error('Error signing out on unload:', error);
    }
});


// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================
// Wrap all DOM-related code in DOMContentLoaded to ensure elements are available
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded fired. Assigning DOM elements and attaching listeners...');

    // Assign DOM elements here after the document is fully loaded
    // Assign to globally declared 'let' variables
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

    // Set DOM ready flag
    isDomReady = true;

    // Now that DOM is ready, handle initial UI state based on authentication
    if (currentAdminUser) { // If user was already authenticated (e.g., persistent session)
        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData();
    } else if (pendingAuthUser) { // If user authenticated *before* DOM was ready
        currentAdminUser = pendingAuthUser;
        userId = pendingAuthUser.uid;
        closeModal(loginModal);
        showSection(dashboardSection);
        await loadAllData();
        pendingAuthUser = null; // Clear pending user
    } else { // No user authenticated, show login modal
        openModal(loginModal);
        clearLoginError();
    }

    // Attach all event listeners here
    if (sidebarToggleBtn) { // Added null check
        sidebarToggleBtn.addEventListener('click', () => {
            sidebarMenu.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) { // Added null check
        sidebarOverlay.addEventListener('click', () => {
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (navDashboard) { // Added null check
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(dashboardSection);
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            updateDashboardStats();
        });
    }

    if (navCards) { // Added null check
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

    if (navSealedProducts) { // Added null check
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

    if (navCategories) { // Added null check
        navCategories.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(categoriesSection);
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            renderCategoriesTable();
        });
    }

    if (navOrders) { // Added null check
        navOrders.addEventListener('click', (e) => {
            e.preventDefault();
            alert('La gestión de pedidos estará disponible pronto.');
            sidebarMenu.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (navLogout) { // Added null check
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    const refreshAdminPageBtn = document.getElementById('refreshAdminPageBtn');
    if (refreshAdminPageBtn) { // Added null check
        refreshAdminPageBtn.addEventListener('click', async () => {
            alert('Refrescando datos del panel...');
            await loadAllData();
            alert('Datos actualizados.');
        });
    }

    if (loginForm) { // Added null check
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
        if (event.target === loginModal && loginModal.style.display === 'flex') {
            // No cerrar el modal de login si está activo y se hace clic fuera
            // Esto fuerza al usuario a iniciar sesión.
        }
    });

    if (addCardBtn) { // Added null check
        addCardBtn.addEventListener('click', () => {
            cardModalTitle.textContent = 'Añadir Nueva Carta';
            cardForm.reset();
            cardId.value = ''; // Asegurarse de que el ID esté vacío para añadir
            openModal(cardModal);
        });
    }
    if (cardForm) { // Added null check
        cardForm.addEventListener('submit', handleCardFormSubmit);
    }

    if (cardsTable) { // Added null check
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
    }

    if (adminSearchInput) { // Added null check
        adminSearchInput.addEventListener('input', () => {
            currentCardsPage = 1;
            renderCardsTable();
        });
    }
    if (adminCategoryFilter) { // Added null check
        adminCategoryFilter.addEventListener('change', () => {
            currentCardsPage = 1;
            renderCardsTable();
        });
    }
    if (adminPrevPageBtn) { // Added null check
        adminPrevPageBtn.addEventListener('click', () => {
            if (currentCardsPage > 1) {
                currentCardsPage--;
                renderCardsTable();
            }
        });
    }
    if (adminNextPageBtn) { // Added null check
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
    }

    // ======================= Productos Sellados =======================
    if (addSealedProductBtn) { // Added null check
        addSealedProductBtn.addEventListener('click', () => {
            sealedProductModalTitle.textContent = 'Añadir Nuevo Producto Sellado';
            sealedProductForm.reset();
            sealedProductId.value = ''; // Asegurarse de que el ID esté vacío para añadir
            openModal(sealedProductModal);
        });
    }
    if (sealedProductForm) { // Added null check
        sealedProductForm.addEventListener('submit', handleSealedProductFormSubmit);
    }

    if (sealedProductsTable) { // Added null check
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
    }

    if (adminSealedSearchInput) { // Added null check
        adminSealedSearchInput.addEventListener('input', () => {
            currentSealedProductsPage = 1;
            renderSealedProductsTable();
        });
    }
    if (adminSealedCategoryFilter) { // Added null check
        adminSealedCategoryFilter.addEventListener('change', () => {
            currentSealedProductsPage = 1;
            renderSealedProductsTable();
        });
    }
    if (adminSealedPrevPageBtn) { // Added null check
        adminSealedPrevPageBtn.addEventListener('click', () => {
            if (currentSealedProductsPage > 1) {
                currentSealedProductsPage--;
                renderSealedProductsTable();
            }
        });
    }
    if (adminSealedNextPageBtn) { // Added null check
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
    }

    // ======================= Categorías =======================
    if (addCategoryBtn) { // Added null check
        addCategoryBtn.addEventListener('click', () => {
            categoryModalTitle.textContent = 'Añadir Nueva Categoría';
            categoryForm.reset();
            categoryId.value = ''; // Asegurarse de que el ID esté vacío para añadir
            openModal(categoryModal);
        });
    }
    if (categoryForm) { // Added null check
        categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    }

    if (categoriesTable) { // Added null check
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
    if (cancelDeleteBtn) { // Added null check
        cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
    }
    if (confirmDeleteBtn) { // Added null check
        confirmDeleteBtn.addEventListener('click', confirmDeletion);
    }
});
