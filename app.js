const APP_VERSION = "1.2.0";
const CART_STORAGE_KEY = "mi-empresa-store-cart";
const CATALOG_STORAGE_KEY = "mi-empresa-store-catalog";
const DEMO_PRODUCTS = [
  { id: 1, nombre: "Auriculares esenciales", categoria: "Tecnología", descripcion: "Sonido envolvente para acompañar tu ritmo.", precio: 89.9, stock: 12, foto: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82" },
  { id: 2, nombre: "Reloj de todos los días", categoria: "Accesorios", descripcion: "Diseño limpio, cómodo y listo para salir.", precio: 119, stock: 8, foto: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82" },
  { id: 3, nombre: "Parlante compacto", categoria: "Tecnología", descripcion: "Tu música favorita, en cualquier rincón.", precio: 74.5, stock: 10, foto: "https://images.unsplash.com/photo-1608043152269-423dbba4e797?auto=format&fit=crop&w=900&q=82" },
  { id: 4, nombre: "Botella reutilizable", categoria: "Hogar", descripcion: "Un pequeño hábito para un día más ligero.", precio: 32, stock: 18, foto: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=82" },
  { id: 5, nombre: "Lámpara de sobremesa", categoria: "Hogar", descripcion: "Luz cálida para tus momentos tranquilos.", precio: 96, stock: 5, foto: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82" },
  { id: 6, nombre: "Zapatillas urbanas", categoria: "Accesorios", descripcion: "Comodidad sencilla para ir un poco más lejos.", precio: 145, stock: 7, foto: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82" },
];

const elements = {
  products: document.querySelector("[data-products]"),
  categories: document.querySelector("[data-categories]"),
  search: document.querySelector("[data-search]"),
  results: document.querySelector("[data-results-count]"),
  emptyState: document.querySelector("[data-empty-state]"),
  notice: document.querySelector("[data-store-notice]"),
  emptyTitle: document.querySelector("[data-empty-state] h3"),
  emptyDescription: document.querySelector("[data-empty-state] p"),
  clearSearch: document.querySelector("[data-clear-search]"),
  cartCount: document.querySelector("[data-cart-count]"),
  cartDrawer: document.querySelector("[data-cart-drawer]"),
  cartScrim: document.querySelector("[data-cart-scrim]"),
  cartItems: document.querySelector("[data-cart-items]"),
  cartEmpty: document.querySelector("[data-cart-empty]"),
  cartSummary: document.querySelector("[data-cart-summary]"),
  cartTotal: document.querySelector("[data-cart-total]"),
  cartOffline: document.querySelector("[data-cart-offline]"),
  checkoutDialog: document.querySelector("[data-checkout-dialog]"),
  checkoutForm: document.querySelector("[data-checkout-form]"),
  checkoutTotal: document.querySelector("[data-checkout-total]"),
  formError: document.querySelector("[data-form-error]"),
  submitOrder: document.querySelector("[data-submit-order]"),
  orderSuccess: document.querySelector("[data-order-success]"),
  successMessage: document.querySelector("[data-success-message]"),
  updateBanner: document.querySelector("[data-update-banner]"),
};

const state = {
  products: [],
  cart: readCart(),
  category: "Todos",
  catalogMode: "loading",
  registration: null,
};

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => Number.isSafeInteger(item.id) && Number.isSafeInteger(item.quantity) && item.quantity > 0);
  } catch (error) {
    console.warn("No se pudo recuperar el carrito guardado.", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch (error) {
    console.error("No se pudo guardar el carrito en este dispositivo.", error);
    showNotice("No pudimos guardar el carrito en este dispositivo. Podrás continuar comprando mientras mantengas esta página abierta.", true);
  }
  renderCart();
}

function formatPrice(price) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(price);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function safeImageUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function showNotice(message, isError = false) {
  elements.notice.textContent = message;
  elements.notice.classList.toggle("store-notice-error", isError);
  elements.notice.hidden = false;
}

function setCatalog(products, mode) {
  state.products = products;
  state.catalogMode = mode;
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("No se pudo guardar el catálogo en este dispositivo.", error);
    showNotice("No pudimos guardar el catálogo para usarlo sin conexión en este dispositivo.", true);
  }
  renderCategories();
  renderProducts();
  renderCart();
}

function renderCategories() {
  const categories = ["Todos", ...new Set(state.products.map((product) => product.categoria).filter(Boolean))];
  if (!categories.includes(state.category)) state.category = "Todos";
  elements.categories.innerHTML = categories.map((category) => `
    <button class="category-chip${state.category === category ? " category-chip-active" : ""}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">
      ${escapeHtml(category)}
    </button>
  `).join("");
}

function getVisibleProducts() {
  const search = elements.search.value.trim().toLocaleLowerCase("es");
  return state.products.filter((product) => {
    const matchesCategory = state.category === "Todos" || product.categoria === state.category;
    const matchesSearch = !search || [product.nombre, product.descripcion, product.categoria]
      .some((value) => String(value || "").toLocaleLowerCase("es").includes(search));
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const products = getVisibleProducts();
  elements.results.textContent = `${products.length} ${products.length === 1 ? "hallazgo" : "hallazgos"}`;
  elements.products.setAttribute("aria-busy", "false");
  elements.emptyState.hidden = products.length > 0;
  const emptyStore = state.products.length === 0;
  elements.emptyTitle.textContent = emptyStore ? "Pronto habrá novedades." : "No encontramos ese hallazgo.";
  elements.emptyDescription.textContent = emptyStore
    ? "Todavía no se publicaron productos en esta tienda."
    : "Prueba con otra búsqueda o elige una categoría distinta.";
  elements.clearSearch.hidden = emptyStore;
  elements.products.hidden = products.length === 0;
  elements.products.innerHTML = products.map((product) => {
    const image = safeImageUrl(product.foto);
    const outOfStock = product.stock < 1;
    return `
      <article class="product-card">
        <div class="product-image-wrap">
          ${image ? `<img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.nombre)}" loading="lazy">` : `<div class="product-image-placeholder" aria-hidden="true">${escapeHtml(product.nombre.slice(0, 1))}</div>`}
          <span class="product-category">${escapeHtml(product.categoria || "Selección")}</span>
        </div>
        <div class="product-details">
          <div class="product-name-row">
            <h3 class="product-name">${escapeHtml(product.nombre)}</h3>
            <p class="product-price">${formatPrice(product.precio)}</p>
          </div>
          <p class="product-description">${escapeHtml(product.descripcion)}</p>
          <div class="product-actions">
            <span class="stock-label${outOfStock ? " stock-label-out" : ""}">${outOfStock ? "Agotado por ahora" : product.stock < 5 ? `Quedan ${product.stock}` : "Disponible"}</span>
            <button class="add-button" type="button" data-add-product="${product.id}" ${outOfStock ? "disabled" : ""} aria-label="Agregar ${escapeHtml(product.nombre)} al carrito">
              Agregar <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
  elements.products.querySelectorAll(".product-image").forEach((image) => {
    image.addEventListener("error", () => {
      const placeholder = document.createElement("div");
      placeholder.className = "product-image-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.textContent = image.alt.slice(0, 1);
      image.replaceWith(placeholder);
    }, { once: true });
  });
}

function getCartLines() {
  return state.cart.flatMap((item) => {
    const product = state.products.find((candidate) => candidate.id === item.id);
    return product ? [{ product, quantity: Math.min(item.quantity, product.stock) }] : [];
  }).filter((line) => line.quantity > 0);
}

function renderCart() {
  const lines = getCartLines();
  const quantity = lines.reduce((total, line) => total + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.precio * line.quantity, 0);
  const checkoutButton = document.querySelector("[data-checkout]");
  elements.cartCount.textContent = String(quantity);
  elements.cartEmpty.hidden = lines.length > 0;
  elements.cartSummary.hidden = lines.length === 0;
  elements.cartOffline.hidden = state.catalogMode === "database" || lines.length === 0;
  elements.cartOffline.textContent = state.catalogMode === "cached"
    ? "Reconéctate para actualizar la tienda y confirmar tu pedido."
    : "La tienda de demostración no registra pedidos.";
  checkoutButton.disabled = state.catalogMode !== "database";
  elements.cartTotal.textContent = formatPrice(total);
  elements.checkoutTotal.textContent = formatPrice(total);
  elements.cartItems.innerHTML = lines.map(({ product, quantity: count }) => {
    const image = safeImageUrl(product.foto);
    return `
      <article class="cart-item">
        ${image ? `<img class="cart-item-image" src="${escapeHtml(image)}" alt="" loading="lazy">` : `<div class="cart-item-image product-image-placeholder" aria-hidden="true">${escapeHtml(product.nombre.slice(0, 1))}</div>`}
        <div>
          <h3 class="cart-item-name">${escapeHtml(product.nombre)}</h3>
          <p class="cart-item-price">${formatPrice(product.precio)}</p>
          <div class="quantity-control" aria-label="Cantidad de ${escapeHtml(product.nombre)}">
            <button type="button" data-change-quantity="${product.id}" data-change-by="-1" aria-label="Quitar una unidad de ${escapeHtml(product.nombre)}">−</button>
            <span>${count}</span>
            <button type="button" data-change-quantity="${product.id}" data-change-by="1" aria-label="Agregar una unidad de ${escapeHtml(product.nombre)}" ${count >= product.stock ? "disabled" : ""}>+</button>
          </div>
        </div>
        <strong class="cart-item-total">${formatPrice(product.precio * count)}</strong>
      </article>
    `;
  }).join("");
}

async function loadCatalog() {
  try {
    const response = await fetch("/api/products", { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "No pudimos cargar el catálogo.");
    if (!Array.isArray(payload.products)) throw new Error("La respuesta del catálogo no es válida.");
    const products = payload.products.map((product) => ({
      id: Number(product.id),
      nombre: String(product.nombre || ""),
      categoria: String(product.categoria || "Selección"),
      descripcion: String(product.descripcion || ""),
      precio: Number(product.precio),
      stock: Number(product.stock),
      foto: String(product.foto || ""),
    })).filter((product) => Number.isSafeInteger(product.id)
      && product.nombre && Number.isFinite(product.precio) && product.precio >= 0
      && Number.isSafeInteger(product.stock) && product.stock >= 0);
    setCatalog(products, "database");
    if (products.length === 0) {
      showNotice("La conexión con la tienda está lista, pero todavía no hay productos publicados.");
    } else {
      elements.notice.hidden = true;
    }
  } catch (error) {
    const cachedProducts = getCachedCatalog();
    if (cachedProducts.length) {
      setCatalog(cachedProducts, "cached");
      showNotice("No pudimos conectar con la tienda. Estás viendo el último catálogo guardado; los pedidos necesitan conexión.");
    } else {
      setCatalog(DEMO_PRODUCTS, "demo");
      showNotice("Catálogo de demostración: conecta TiDB Cloud para publicar tus productos y recibir pedidos.");
    }
    if (error instanceof TypeError || error.message !== "No pudimos cargar el catálogo.") {
      console.warn("No se pudo actualizar el catálogo.", error);
    }
  }
}

function getCachedCatalog() {
  try {
    const products = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) || "[]");
    if (!Array.isArray(products)) return [];
    return products.filter((product) => Number.isSafeInteger(product.id)
      && typeof product.nombre === "string" && Number.isFinite(product.precio)
      && Number.isSafeInteger(product.stock));
  } catch (error) {
    console.warn("No se pudo recuperar el catálogo guardado.", error);
    return [];
  }
}

function openCart() {
  elements.cartDrawer.classList.add("cart-drawer-open");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
  elements.cartDrawer.removeAttribute("inert");
  elements.cartScrim.hidden = false;
  document.body.style.overflow = "hidden";
  elements.cartDrawer.querySelector("[data-close-cart]").focus();
}

function closeCart() {
  elements.cartDrawer.classList.remove("cart-drawer-open");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.cartDrawer.setAttribute("inert", "");
  elements.cartScrim.hidden = true;
  document.body.style.overflow = "";
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || product.stock < 1) return;
  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    if (existing.quantity >= product.stock) return;
    existing.quantity += 1;
  } else {
    state.cart.push({ id, quantity: 1 });
  }
  saveCart();
}

function changeQuantity(id, amount) {
  const item = state.cart.find((candidate) => candidate.id === id);
  const product = state.products.find((candidate) => candidate.id === id);
  if (!item || !product) return;
  item.quantity = Math.min(product.stock, item.quantity + amount);
  if (item.quantity <= 0) state.cart = state.cart.filter((candidate) => candidate.id !== id);
  saveCart();
}

function openCheckout() {
  const lines = getCartLines();
  if (!lines.length || state.catalogMode !== "database") return;
  closeCart();
  elements.formError.hidden = true;
  elements.checkoutForm.hidden = false;
  elements.orderSuccess.hidden = true;
  elements.checkoutDialog.showModal();
  elements.checkoutForm.elements.name.focus();
}

async function submitOrder(event) {
  event.preventDefault();
  const lines = getCartLines();
  if (!lines.length || state.catalogMode !== "database") return;
  const formData = new FormData(elements.checkoutForm);
  const customer = Object.fromEntries(formData.entries());
  const payload = {
    customer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim(),
      phone: String(customer.phone).trim(),
      address: String(customer.address).trim(),
    },
    items: lines.map(({ product, quantity }) => ({ id: product.id, quantity })),
  };
  elements.formError.hidden = true;
  elements.submitOrder.disabled = true;
  elements.submitOrder.textContent = "Enviando tu pedido…";
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) await loadCatalog();
      throw new Error(result.error || "No pudimos confirmar el pedido. Inténtalo nuevamente.");
    }
    state.cart = [];
    saveCart();
    await loadCatalog();
    elements.checkoutForm.hidden = true;
    elements.orderSuccess.hidden = false;
    elements.successMessage.textContent = `Tu pedido #${result.orderId} por ${formatPrice(result.total)} quedó registrado. Pronto coordinaremos contigo los detalles de entrega.`;
  } catch (error) {
    elements.formError.textContent = error.message || "No pudimos conectar con la tienda. Comprueba tu conexión e inténtalo otra vez.";
    elements.formError.hidden = false;
  } finally {
    elements.submitOrder.disabled = false;
    elements.submitOrder.innerHTML = 'Confirmar pedido <span aria-hidden="true">→</span>';
  }
}

function showUpdate() {
  elements.updateBanner.hidden = false;
}

async function checkForVersion() {
  try {
    const response = await fetch(`/version.json?current=${encodeURIComponent(APP_VERSION)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo consultar la versión (${response.status}).`);
    const version = await response.json();
    if (version.version && version.version !== APP_VERSION) showUpdate();
  } catch (error) {
    console.warn("No se pudo comprobar si hay una nueva versión.", error);
  }
}

async function activateUpdate() {
  const waitingWorker = state.registration?.waiting;
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    return;
  }
  if (state.registration) {
    await state.registration.update();
    if (state.registration.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }
  }
  window.location.reload();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").then((registration) => {
    state.registration = registration;
    if (registration.waiting && navigator.serviceWorker.controller) showUpdate();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate();
      });
    });
    window.addEventListener("focus", () => registration.update().catch((error) => {
      console.warn("No se pudo buscar una actualización de la aplicación.", error);
    }));
  }).catch((error) => {
    console.error("No se pudo registrar el modo instalable de la aplicación.", error);
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

elements.categories.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories();
  renderProducts();
});
elements.search.addEventListener("input", renderProducts);
elements.products.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (!button) return;
  addToCart(Number(button.dataset.addProduct));
  button.querySelector("span").textContent = "✓";
  window.setTimeout(() => {
    if (button.isConnected) button.querySelector("span").textContent = "+";
  }, 800);
});
elements.cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-change-quantity]");
  if (button) changeQuantity(Number(button.dataset.changeQuantity), Number(button.dataset.changeBy));
});
document.querySelectorAll("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));
document.querySelector("[data-close-cart]").addEventListener("click", closeCart);
elements.cartScrim.addEventListener("click", closeCart);
document.querySelectorAll("[data-continue-shopping]").forEach((button) => button.addEventListener("click", closeCart));
document.querySelector("[data-checkout]").addEventListener("click", openCheckout);
document.querySelector("[data-close-checkout]").addEventListener("click", () => elements.checkoutDialog.close());
elements.checkoutDialog.addEventListener("click", (event) => {
  if (event.target === elements.checkoutDialog) elements.checkoutDialog.close();
});
elements.checkoutForm.addEventListener("submit", submitOrder);
document.querySelector("[data-finish-order]").addEventListener("click", () => elements.checkoutDialog.close());
document.querySelector("[data-clear-search]").addEventListener("click", () => {
  elements.search.value = "";
  state.category = "Todos";
  renderCategories();
  renderProducts();
});
document.querySelector("[data-update-app]").addEventListener("click", activateUpdate);
document.querySelector("[data-dismiss-update]").addEventListener("click", () => {
  elements.updateBanner.hidden = true;
});
document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
    elements.search.scrollIntoView({ block: "center" });
  }
  if (event.key === "Escape" && elements.cartDrawer.classList.contains("cart-drawer-open")) closeCart();
});

renderCart();
loadCatalog();
checkForVersion();
registerServiceWorker();
