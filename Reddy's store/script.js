// AuraMart E-Commerce Client Logic
let products = [];
let cart = [];
let appliedCoupon = null;
let currentOrderDetails = null;

// Filter state
let searchQuery = "";
let selectedCategory = "All";
let maxPrice = 2500;
let activeSort = "featured";

// DOM references
const productGrid = document.getElementById('product-grid');
const resultsCount = document.getElementById('results-count');
const cartCountBadge = document.getElementById('cart-count-badge');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartOverlay = document.getElementById('cart-overlay');

// Price summaries
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryDiscountRow = document.getElementById('summary-discount-row');
const summaryDiscountLabel = document.getElementById('summary-discount-label');
const summaryDiscountVal = document.getElementById('summary-discount-val');
const summaryShipping = document.getElementById('summary-shipping');
const summaryTotal = document.getElementById('summary-total');

// Coupon DOM
const couponInput = document.getElementById('coupon-input');
const applyCouponBtn = document.getElementById('apply-coupon-btn');
const couponStatus = document.getElementById('coupon-status');

// Checkout DOM
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const checkoutCloseBtn = document.getElementById('checkout-close-btn');
const checkoutForm = document.getElementById('checkout-form');
const checkoutSummaryItems = document.getElementById('checkout-summary-items');

// Success DOM
const successModal = document.getElementById('success-modal');
const successOrderId = document.getElementById('success-order-id');
const successDeliveryDate = document.getElementById('success-delivery-date');
const downloadReceiptBtn = document.getElementById('download-receipt-btn');
const closeSuccessBtn = document.getElementById('close-success-btn');

// Order History DOM
const viewOrdersBtn = document.getElementById('view-orders-btn');
const ordersModal = document.getElementById('orders-modal');
const ordersCloseBtn = document.getElementById('orders-close-btn');
const ordersHistoryContainer = document.getElementById('orders-history-container');

// Search & Slider DOM
const productSearchInput = document.getElementById('product-search');
const priceSlider = document.getElementById('price-slider');
const priceMaxValText = document.getElementById('price-max-val');
const sortSelector = document.getElementById('sort-selector');
const categoryTabs = document.querySelectorAll('.cat-tab');

// 1. Initializer & Event Setup
window.addEventListener('DOMContentLoaded', () => {
    // Load Cart from LocalStorage
    try {
        const storedCart = localStorage.getItem('auramart_cart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
            updateCartUI();
        }
    } catch(err) {
        console.error("Error loading cart:", err);
    }
    
    fetchProducts();
    
    // Search listener (with instant query filtering)
    productSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        fetchProducts();
    });
    
    // Price range slider listener
    priceSlider.addEventListener('input', (e) => {
        maxPrice = parseInt(e.target.value);
        priceMaxValText.innerText = maxPrice === 2500 ? "$2500+" : `$${maxPrice}`;
        fetchProducts();
    });
    
    // Sort select listener
    sortSelector.addEventListener('change', (e) => {
        activeSort = e.target.value;
        fetchProducts();
    });
    
    // Category Tabs click listeners
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedCategory = tab.dataset.category;
            fetchProducts();
        });
    });
    
    // Cart drawer toggles
    cartToggleBtn.addEventListener('click', () => toggleCart(true));
    cartCloseBtn.addEventListener('click', () => toggleCart(false));
    cartOverlay.addEventListener('click', () => toggleCart(false));
    
    // Coupon click
    applyCouponBtn.addEventListener('click', applyCouponCode);
    
    // Checkout trigger click
    checkoutBtn.addEventListener('click', () => {
        toggleCart(false);
        openCheckoutModal();
    });
    checkoutCloseBtn.addEventListener('click', () => toggleModal(checkoutModal, false));
    
    // Form submission
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    
    // Success Modal Close
    closeSuccessBtn.addEventListener('click', () => toggleModal(successModal, false));
    
    // Receipt download
    downloadReceiptBtn.addEventListener('click', downloadTextInvoice);
    
    // Order history list
    viewOrdersBtn.addEventListener('click', openOrdersModal);
    ordersCloseBtn.addEventListener('click', () => toggleModal(ordersModal, false));
});

// 2. Fetch and Render Catalog from API
async function fetchProducts() {
    try {
        const url = `/api/products/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}&min_price=0&max_price=${maxPrice}&sort=${activeSort}`;
        const response = await fetch(url);
        if (response.ok) {
            products = await response.json();
            renderCatalog(products);
        } else {
            productGrid.innerHTML = `<p class="error-msg">Failed to load catalogue. Backend error.</p>`;
        }
    } catch(err) {
        console.error("Failed to connect to API:", err);
        productGrid.innerHTML = `<p class="error-msg">Server offline. Run: python main.py</p>`;
    }
}

function renderCatalog(items) {
    if (!items || items.length === 0) {
        productGrid.innerHTML = `
            <div class="loader-container">
                <i class="fa-solid fa-ban" style="font-size: 28px; color: var(--accent-red)"></i>
                <p>No products match your search/filter parameters.</p>
            </div>`;
        resultsCount.innerText = "0 Tech Items Found";
        return;
    }
    
    resultsCount.innerText = `Showing ${items.length} Premium Products`;
    productGrid.innerHTML = "";
    
    items.forEach(prod => {
        const card = document.createElement('div');
        card.className = "product-card";
        
        // Render specs tags
        let specsHtml = "";
        if (prod.specs) {
            prod.specs.forEach(s => {
                specsHtml += `<span class="spec-tag">${s}</span>`;
            });
        }
        
        // Stars generator
        let starsHtml = "";
        const wholeStars = Math.floor(prod.rating);
        for (let s = 0; s < 5; s++) {
            if (s < wholeStars) {
                starsHtml += `<i class="fa-solid fa-star"></i>`;
            } else if (s === wholeStars && prod.rating % 1 !== 0) {
                starsHtml += `<i class="fa-solid fa-star-half-stroke"></i>`;
            } else {
                starsHtml += `<i class="fa-regular fa-star"></i>`;
            }
        }
        
        // Badge class customization
        const badgeClass = prod.badge.toLowerCase();
        
        card.innerHTML = `
            <div class="card-img-wrap">
                <span class="card-badge ${badgeClass}">${prod.badge}</span>
                <img src="${prod.image}" alt="${prod.name}">
            </div>
            <div class="card-body">
                <span class="card-cat">${prod.category}</span>
                <h3>${prod.name}</h3>
                <div class="rating-row">
                    <span class="rating-stars">${starsHtml}</span>
                    <span class="rating-count">(${prod.reviews} reviews)</span>
                </div>
                <p class="card-desc">${prod.description}</p>
                <div class="specs-row">
                    ${specsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-price">$${prod.price.toFixed(2)}</span>
                    <button class="add-cart-btn" onclick="addToCart(${prod.id})" title="Add to Cart">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// 3. Cart State Management
function addToCart(productId) {
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        item.quantity += 1;
    } else {
        const prod = products.find(p => p.id === productId) || PRODUCTS_FALLBACK.find(p => p.id === productId);
        if (prod) {
            cart.push({
                id: prod.id,
                name: prod.name,
                price: prod.price,
                image: prod.image,
                quantity: 1
            });
        }
    }
    
    saveCart();
    updateCartUI();
    
    // Simple micro-animation toggle on cart badge
    cartCountBadge.style.transform = "scale(1.3)";
    setTimeout(() => {
        cartCountBadge.style.transform = "scale(1)";
    }, 200);
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('auramart_cart', JSON.stringify(cart));
}

function toggleCart(isOpen) {
    if (isOpen) {
        cartDrawer.classList.add('active');
        document.body.style.overflow = "hidden"; // disable background scrolling
    } else {
        cartDrawer.classList.remove('active');
        document.body.style.overflow = "";
    }
}

// 4. Cart Drawer Calculations UI
function updateCartUI() {
    // Total count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.innerText = totalItems;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-state" style="padding:60px 10px; text-align:center; color:var(--text-secondary);">
                <i class="fa-solid fa-basket-shopping" style="font-size:36px; opacity:0.3; margin-bottom:10px;"></i>
                <p style="font-weight:600;">Your shopping cart is empty.</p>
                <span style="font-size:11px;">Select premium tech from our list to begin!</span>
            </div>`;
        
        summarySubtotal.innerText = "$0.00";
        summaryShipping.innerText = "$0.00";
        summaryTotal.innerText = "$0.00";
        summaryDiscountRow.classList.add('hidden');
        checkoutBtn.disabled = true;
        return;
    }
    
    checkoutBtn.disabled = false;
    cartItemsContainer.innerHTML = "";
    
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        
        const row = document.createElement('div');
        row.className = "cart-item";
        row.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
                <div class="qty-val">${item.quantity}</div>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
        `;
        cartItemsContainer.appendChild(row);
    });
    
    // Apply local calculations
    let discount = 0;
    let shipping = subtotal >= 150.0 ? 0.0 : 15.0; // Free shipping over $150
    
    if (appliedCoupon) {
        if (appliedCoupon.code === "AURAMART15") {
            discount = subtotal * 0.15;
        } else if (appliedCoupon.code === "FREESHIP") {
            shipping = 0.0;
        } else if (appliedCoupon.code === "COLLEGE20") {
            discount = subtotal * 0.20;
        }
    }
    
    const tax = Math.max(0.0, subtotal - discount) * 0.08;
    const grandTotal = subtotal - discount + shipping + tax;
    
    summarySubtotal.innerText = `$${subtotal.toFixed(2)}`;
    summaryShipping.innerText = shipping === 0.0 ? "FREE" : `$${shipping.toFixed(2)}`;
    
    if (discount > 0) {
        summaryDiscountLabel.innerText = `Discount (${appliedCoupon.code})`;
        summaryDiscountVal.innerText = `-$${discount.toFixed(2)}`;
        summaryDiscountRow.classList.remove('hidden');
    } else {
        summaryDiscountRow.classList.add('hidden');
    }
    
    summaryTotal.innerText = `$${grandTotal.toFixed(2)}`;
}

// 5. Coupon validation
function applyCouponCode() {
    const code = couponInput.value.trim().toUpperCase();
    if (!code) return;
    
    couponStatus.className = "coupon-status-msg";
    
    if (code === "AURAMART15") {
        appliedCoupon = { code: "AURAMART15", value: 0.15 };
        couponStatus.innerText = "Coupon code 'AURAMART15' applied (15% Off)!";
        couponStatus.classList.add('success');
    } else if (code === "FREESHIP") {
        appliedCoupon = { code: "FREESHIP", value: 15.0 };
        couponStatus.innerText = "Coupon code 'FREESHIP' applied (Free Shipping)!";
        couponStatus.classList.add('success');
    } else if (code === "COLLEGE20") {
        appliedCoupon = { code: "COLLEGE20", value: 0.20 };
        couponStatus.innerText = "Coupon code 'COLLEGE20' applied (20% Off)!";
        couponStatus.classList.add('success');
    } else {
        appliedCoupon = null;
        couponStatus.innerText = "Invalid coupon code format.";
        couponStatus.classList.add('error');
    }
    
    updateCartUI();
}

// 6. Checkout Modal Actions
function openCheckoutModal() {
    checkoutSummaryItems.innerHTML = "";
    
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const row = document.createElement('div');
        row.className = "checkout-item-mini";
        row.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        checkoutSummaryItems.appendChild(row);
    });
    
    // Side totals calculations
    let discount = 0;
    let shipping = subtotal >= 150.0 ? 0.0 : 15.0;
    
    if (appliedCoupon) {
        if (appliedCoupon.code === "AURAMART15") {
            discount = subtotal * 0.15;
        } else if (appliedCoupon.code === "FREESHIP") {
            shipping = 0.0;
        } else if (appliedCoupon.code === "COLLEGE20") {
            discount = subtotal * 0.20;
        }
    }
    
    const tax = Math.max(0.0, subtotal - discount) * 0.08;
    const grandTotal = subtotal - discount + shipping + tax;
    
    const totalsDiv = document.querySelector('.checkout-totals');
    totalsDiv.innerHTML = `
        <div class="price-row"><span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span></div>
        ${discount > 0 ? `<div class="price-row discount-row"><span>Coupon (${appliedCoupon.code}):</span><span>-$${discount.toFixed(2)}</span></div>` : ""}
        <div class="price-row"><span>Shipping:</span><span>${shipping === 0.0 ? "FREE" : `$${shipping.toFixed(2)}`}</span></div>
        <div class="price-row"><span>Est. Tax (8%):</span><span>$${tax.toFixed(2)}</span></div>
        <div class="price-row total-row"><span>Grand Total:</span><span>$${grandTotal.toFixed(2)}</span></div>
    `;
    
    toggleModal(checkoutModal, true);
}

// 7. Checkout API submit handler
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('ship-name').value.trim();
    const email = document.getElementById('ship-email').value.trim();
    const address = document.getElementById('ship-address').value.trim();
    const city = document.getElementById('ship-city').value.trim();
    const zipCode = document.getElementById('ship-zip').value.trim();
    
    const submitBtn = document.querySelector('.place-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Secure Payment...`;
    
    const checkoutData = {
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
        shipping: {
            fullName: name,
            email: email,
            address: address,
            city: city,
            zipCode: zipCode
        },
        couponCode: appliedCoupon ? appliedCoupon.code : null
    };
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutData)
        });
        
        if (response.ok) {
            const data = await response.json();
            currentOrderDetails = data;
            
            // Show Success screen
            toggleModal(checkoutModal, false);
            openSuccessModal(data);
            
            // Clear shopping cart
            cart = [];
            appliedCoupon = null;
            couponInput.value = "";
            couponStatus.innerText = "";
            saveCart();
            updateCartUI();
        } else {
            alert("Error during payment checkout. Please verify details.");
        }
    } catch(err) {
        console.error("Checkout submit error:", err);
        alert("Server network error. Check terminal running backend.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Complete Secure Payment`;
    }
}

function openSuccessModal(orderData) {
    successOrderId.innerText = orderData.orderId;
    successDeliveryDate.innerText = "3 Business Days (Standard Ground)";
    toggleModal(successModal, true);
}

// 8. Download Invoice Hook
function downloadTextInvoice() {
    if (!currentOrderDetails || !currentOrderDetails.orderId) return;
    
    const orderId = currentOrderDetails.orderId;
    const downloadUrl = `/api/invoice/${orderId}`;
    
    // Open a trigger link to fetch and download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `invoice_${orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 9. Order Database Modal Handler
async function openOrdersModal() {
    ordersHistoryContainer.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p>Loading database records...</p>
        </div>`;
    
    toggleModal(ordersModal, true);
    
    try {
        const response = await fetch('/api/orders');
        if (response.ok) {
            const orders = await response.json();
            renderOrdersHistory(orders);
        } else {
            ordersHistoryContainer.innerHTML = `<p class="error-msg">Failed to retrieve historical transactions.</p>`;
        }
    } catch(err) {
        console.error("Order history fetch failed:", err);
        ordersHistoryContainer.innerHTML = `<p class="error-msg">Connection error.</p>`;
    }
}

function renderOrdersHistory(orders) {
    if (!orders || orders.length === 0) {
        ordersHistoryContainer.innerHTML = `
            <div class="empty-state" style="padding:40px 10px; text-align:center;">
                <i class="fa-solid fa-receipt" style="font-size:32px; opacity:0.3; margin-bottom:8px;"></i>
                <p>No transactions found in orders.json database.</p>
                <span>Make a purchase to populate record logs.</span>
            </div>`;
        return;
    }
    
    ordersHistoryContainer.innerHTML = "";
    
    // Sort in reverse chronological order
    orders.slice().reverse().forEach(o => {
        const card = document.createElement('div');
        card.className = "order-archive-card";
        
        const totalItemsCount = o.items.reduce((sum, item) => sum + item.quantity, 0);
        
        card.innerHTML = `
            <div class="order-archive-details">
                <div class="order-arc-title">${o.orderId}</div>
                <div class="order-arc-meta">
                    <span>Date: <strong>${o.date}</strong></span>
                    <span>Items: <strong>${totalItemsCount}</strong></span>
                    <span>Customer: <strong>${o.customer}</strong></span>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="order-arc-total">$${o.total.toFixed(2)}</div>
                <button class="nav-btn-outline" onclick="triggerDirectInvoiceDownload('${o.orderId}')" title="Download Invoice">
                    <i class="fa-solid fa-file-arrow-down"></i>
                </button>
            </div>
        `;
        ordersHistoryContainer.appendChild(card);
    });
}

function triggerDirectInvoiceDownload(orderId) {
    const downloadUrl = `/api/invoice/${orderId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `invoice_${orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 10. General Modal Helper
function toggleModal(modalEl, isOpen) {
    if (isOpen) {
        modalEl.classList.remove('hidden');
        document.body.style.overflow = "hidden";
    } else {
        modalEl.classList.add('hidden');
        document.body.style.overflow = "";
    }
}

// Fallback items in case API is temporarily unavailable on first load
const PRODUCTS_FALLBACK = [
    { id: 1, name: "AeroBook Pro 16", price: 1499.99, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" },
    { id: 2, name: "NovaPhone 13 Ultra", price: 1099.99, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80" },
    { id: 3, name: "SoundZen Wireless ANC", price: 299.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80" }
];
