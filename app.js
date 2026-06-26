const PRODUCT_SOURCES = [
  { file: "sanflex.json", categoryId: "racores", categoryName: "Racores y conectores PU", shortName: "Racores" },
  { file: "manguera-pu.json", categoryId: "tubing", categoryName: "Mangueras de poliuretano PU", shortName: "Tubing PU" },
  { file: "acoples -rapidos.json", categoryId: "acoples", categoryName: "Acoples rapidos", shortName: "Acoples" }
];

const CATEGORY_ALIASES = {
  conectores: "acoples",
  valvulas: "racores"
};

const WHATSAPP_NUMBER = "56948543511";

const state = {
  products: [],
  filtered: [],
  category: "all",
  sort: "default",
  search: "",
  cart: [],          // reutilizamos cart como lista de cotización
  currentProduct: null,
  currentQty: 1
};

const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

document.addEventListener("DOMContentLoaded", () => {
  revealAnimatedItems();
  loadProducts();
  window.addEventListener("scroll", handleHeaderScroll, { passive: true });
});

function revealAnimatedItems() {
  document.querySelectorAll(".fade-up").forEach((item) => item.classList.add("visible"));
}

async function loadProducts() {
  try {
    const sourceResults = await Promise.all(
      PRODUCT_SOURCES.map(async (source) => {
        const response = await fetch(encodeURI(source.file));
        if (!response.ok) throw new Error(`No se pudo cargar ${source.file}`);
        const items = await response.json();
        return items.map((item, index) => normalizeProduct(item, source, index));
      })
    );

    state.products = sourceResults.flat();
    state.filtered = [...state.products];
    renderAll();
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

function normalizeProduct(item, source, index) {
  const price = Number(item.precio) || 0;
  const name = cleanText(item.nombre || "Producto sin nombre");
  const categoryText = cleanText(item.categoria || source.categoryName);

  return {
    id: `${source.categoryId}-${index}`,
    name,
    description: cleanText(item.descripcion || ""),
    price,
    productUrl: item.url_producto || "#",
    image: item.url_imagen || "",
    brand: cleanText(item.marca || source.shortName || "Sanflex"),
    categoryId: source.categoryId,
    categoryName: source.categoryName,
    categoryText,
    diameter: cleanText(item.diametro_tubing || ""),
    connectorType: cleanText(item.tipo_conector || ""),
    threadType: cleanText(item.tipo_hilo || ""),
    material: cleanText(item.material || ""),
    sku: makeSku(source.categoryId, index)
  };
}

function cleanText(value) {
  return repairMojibake(String(value)).replace(/\s+/g, " ").trim();
}

function repairMojibake(value) {
  if (!/[ÃÂâ]/.test(value)) return value;

  try {
    const bytes = new Uint8Array([...value].map((char) => char.charCodeAt(0) & 255));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded.includes("?") ? value : decoded;
  } catch {
    return value;
  }
}

function makeSku(categoryId, index) {
  return `${categoryId.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`;
}

function renderAll() {
  renderCategoryCards();
  renderSidebar();
  applyFilters();
  renderFeatured();
  updateQuote();
}

function renderCategoryCards() {
  const cards = document.querySelectorAll(".cat-card");
  const categories = getCategories();

  cards.forEach((card, index) => {
    const category = categories[index];
    if (!category) {
      card.style.display = "none";
      return;
    }

    card.style.display = "";
    card.onclick = () => filterCatalog(category.id);
    card.querySelector(".cat-card-name").textContent = category.name;
    card.querySelector(".cat-card-count").textContent = `${category.count} productos`;
  });
}

function renderSidebar() {
  const list = document.querySelector(".sidebar-cats");
  if (!list) return;

  const categories = getCategories();
  list.innerHTML = [
    `<li><button class="sidebar-cat-btn active" onclick="filterCatalog('all')">Todos <span>${state.products.length}</span></button></li>`,
    ...categories.map((category) => (
      `<li><button class="sidebar-cat-btn" onclick="filterCatalog('${category.id}')">${escapeHtml(category.name)} <span>${category.count}</span></button></li>`
    ))
  ].join("");

  renderBrandFilters();
}

function renderBrandFilters() {
  const list = document.querySelector(".sidebar-checks");
  if (!list) return;

  const brands = [...new Set(state.products.map((product) => product.brand).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"))
    .slice(0, 10);

  list.innerHTML = brands.map((brand) => (
    `<li><label><input type="checkbox" onchange="applyFilters()" data-brand="${escapeHtml(brand)}" /> ${escapeHtml(brand)}</label></li>`
  )).join("");
}

function getCategories() {
  return PRODUCT_SOURCES.map((source) => ({
    id: source.categoryId,
    name: source.categoryName,
    count: state.products.filter((product) => product.categoryId === source.categoryId).length
  })).filter((category) => category.count > 0);
}

function applyFilters() {
  const min = Number(document.getElementById("price-min")?.value || 0);
  const max = Number(document.getElementById("price-max")?.value || 0);
  const selectedBrands = [...document.querySelectorAll("[data-brand]:checked")].map((input) => input.dataset.brand);
  const query = state.search.toLowerCase();

  state.filtered = state.products.filter((product) => {
    const matchesCategory =
      state.category === "all" ||
      product.categoryId === state.category;
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesPrice = (!min || product.price >= min) && (!max || product.price <= max);
    const text = `${product.name} ${product.description} ${product.brand} ${product.categoryName} ${product.material}`.toLowerCase();
    const matchesSearch = !query || text.includes(query);
    return matchesCategory && matchesBrand && matchesPrice && matchesSearch;
  });

  sortProducts();
  renderCatalog();
}

function sortCatalog(value) {
  state.sort = value;
  sortProducts();
  renderCatalog();
}

function sortProducts() {
  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name, "es")
  };
  if (sorters[state.sort]) state.filtered.sort(sorters[state.sort]);
}

function filterCatalog(categoryId) {
  state.category = CATEGORY_ALIASES[categoryId] || categoryId;
  showPage("catalog");
  updateActiveCategory();
  applyFilters();
}

function updateActiveCategory() {
  document.querySelectorAll(".sidebar-cat-btn").forEach((button) => {
    const click = button.getAttribute("onclick") || "";
    button.classList.toggle("active", click.includes(`'${state.category}'`));
  });
}

function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  const count = document.getElementById("catalog-count");
  const breadcrumb = document.getElementById("catalog-breadcrumb");
  if (!grid) return;

  const categoryName = state.category === "all"
    ? "Todos los productos"
    : getCategories().find((category) => category.id === state.category)?.name || "Productos";

  if (count) {
    count.textContent = `${state.filtered.length} producto${state.filtered.length === 1 ? "" : "s"} encontrados`;
  }
  if (breadcrumb) breadcrumb.textContent = categoryName;

  grid.innerHTML = state.filtered.length
    ? state.filtered.map(renderProductCard).join("")
    : `<div class="catalog-empty">No encontramos productos con esos filtros.</div>`;
}

function renderFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  const featured = state.products.slice(0, 8);
  grid.innerHTML = featured.map(renderProductCard).join("");
}

function renderProductCard(product) {
  const badge = `<span class="product-badge badge-new">${escapeHtml(product.categoryName.split(" ")[0])}</span>`;
  const inQuote = state.cart.some((item) => item.id === product.id);

  return `
    <article class="product-card" onclick="openProduct('${product.id}')">
      <div class="product-img-wrap">
        <div class="product-img-inner">
          <img class="product-photo" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.closest('.product-img-inner').innerHTML = productFallbackIcon();" />
        </div>
        ${badge}
        <button class="product-wish" onclick="event.stopPropagation(); this.classList.toggle('active')" aria-label="Favorito">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.35-9.33-8.2C.33 8.95 2.42 4 6.82 4c2.1 0 3.45 1.1 4.18 2.02C11.73 5.1 13.08 4 15.18 4c4.4 0 6.49 4.95 4.15 8.8C17 16.65 12 21 12 21z"/></svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-brand">${escapeHtml(product.brand)}</div>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="product-sku">${escapeHtml(product.sku)}${product.diameter ? ` · ${escapeHtml(product.diameter)}` : ""}</div>
        <div class="product-rating">
          <span class="stock-badge">✔ Stock disponible</span>
        </div>
        <div class="product-price-row">
          <span class="price-main">${money.format(product.price)}</span>
        </div>
        <button class="btn btn-orange btn-sm ${inQuote ? 'btn-in-quote' : ''}" onclick="event.stopPropagation(); addToQuote('${product.id}')">
          ${inQuote ? '✔ En cotización' : 'Agregar a cotización'}
        </button>
      </div>
    </article>
  `;
}

function openProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  state.currentProduct = product;
  state.currentQty = 1;

  setText("detail-brand", product.brand);
  setText("detail-title", product.name);
  setText("detail-sku", product.sku);
  setText("detail-price", money.format(product.price));
  setText("detail-desc", product.description);
  setText("tab-desc-text", product.description);
  setText("detail-reviews", "✔ Stock disponible");
  setText("qty-display", "1");

  const gallery = document.getElementById("gallery-main-img");
  if (gallery) {
    gallery.innerHTML = `<img class="detail-photo" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.outerHTML = productFallbackIcon();" />`;
  }

  const thumbs = document.getElementById("gallery-thumbs");
  if (thumbs) {
    thumbs.innerHTML = `<button class="gallery-thumb active"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" /></button>`;
  }

  renderSpecs(product);
  renderProductBreadcrumb(product);
  showPage("product");
}

function renderSpecs(product) {
  const table = document.getElementById("specs-table");
  if (!table) return;

  const rows = [
    ["Categoría", product.categoryName],
    ["Marca", product.brand],
    ["Material", product.material || "No especificado"],
    ["Diámetro tubing", product.diameter || "No aplica"],
    ["Tipo conector", product.connectorType || "No aplica"],
    ["Tipo hilo", product.threadType || "No aplica"],
    ["SKU", product.sku]
  ];

  table.innerHTML = rows.map(([label, value]) => (
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
  )).join("");
}

function renderProductBreadcrumb(product) {
  const breadcrumb = document.getElementById("product-breadcrumb");
  if (!breadcrumb) return;

  breadcrumb.innerHTML = `
    <a href="#" onclick="showPage('home'); return false;">Inicio</a>
    <span>›</span>
    <a href="#" onclick="filterCatalog('${product.categoryId}'); return false;">${escapeHtml(product.categoryName)}</a>
    <span>›</span>
    <span class="current">${escapeHtml(product.name)}</span>
  `;
}

function changeQty(delta) {
  state.currentQty = Math.max(1, state.currentQty + delta);
  setText("qty-display", String(state.currentQty));
}

function addCurrentToQuote() {
  if (!state.currentProduct) return;
  addToQuote(state.currentProduct.id, state.currentQty);
}

function addToQuote(productId, qty = 1) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += qty;
    showToast("Cantidad actualizada en la cotización");
  } else {
    state.cart.push({ id: productId, qty });
    showToast("Producto agregado a la cotización ✔");
  }

  updateQuote();
  // re-render tarjetas para actualizar el estado del botón
  renderCatalog();
  renderFeatured();
}

function updateQuote() {
  const count = state.cart.reduce((total, item) => total + item.qty, 0);

  setText("cart-count", String(count));
  setText("cart-head-count", `${count} producto${count === 1 ? "" : "s"}`);

  const list = document.getElementById("cart-items-list");
  const footer = document.getElementById("cart-footer");
  if (!list || !footer) return;

  footer.style.display = count ? "" : "none";
  list.innerHTML = count ? state.cart.map(renderQuoteItem).join("") : `
    <div class="cart-empty">
      <div class="cart-empty-title">Tu cotización está vacía</div>
      <div class="cart-empty-sub">Agrega productos desde el catálogo para solicitar una cotización.</div>
    </div>
  `;
}

function renderQuoteItem(item) {
  const product = state.products.find((entry) => entry.id === item.id);
  if (!product) return "";

  return `
    <div class="cart-item">
      <img class="cart-item-img" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(product.name)}</div>
        <div class="cart-item-meta">${escapeHtml(product.sku)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn-sm" onclick="changeQuoteQty('${product.id}', -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn-sm" onclick="changeQuoteQty('${product.id}', 1)">+</button>
        </div>
      </div>
      <button class="close-btn" onclick="removeFromQuote('${product.id}')" aria-label="Quitar">×</button>
    </div>
  `;
}

function changeQuoteQty(productId, delta) {
  const item = state.cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  updateQuote();
}

function removeFromQuote(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  updateQuote();
  renderCatalog();
  renderFeatured();
}

function sendQuoteWhatsapp() {
  if (state.cart.length === 0) {
    showToast("Agrega al menos un producto antes de cotizar");
    return;
  }

  let message = "Hola VAIR, me gustaría solicitar una *cotización* de los siguientes productos:\n\n";

  state.cart.forEach((item, index) => {
    const product = state.products.find((p) => p.id === item.id);
    if (!product) return;
    message += `${index + 1}. *${product.name}*\n`;
    message += `   SKU: ${product.sku}\n`;
    message += `   Cantidad: ${item.qty}\n`;
    if (product.diameter) message += `   Diámetro: ${product.diameter}\n`;
    message += "\n";
  });

  message += "Por favor confirmar disponibilidad y precio final. ¡Gracias!";

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function toggleCart() {
  document.getElementById("cart-overlay")?.classList.toggle("open");
  document.getElementById("cart-drawer")?.classList.toggle("open");
}

function showPage(pageId) {
  document.querySelectorAll(".page-view").forEach((page) => page.classList.remove("active"));
  document.getElementById(`page-${pageId}`)?.classList.add("active");
  document.querySelectorAll(".nav-list a").forEach((link) => link.classList.remove("active"));
  const activeLink = [...document.querySelectorAll(".nav-list a")].find((link) => {
    const click = link.getAttribute("onclick") || "";
    return click.includes(`'${pageId}'`);
  });
  activeLink?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToSection(sectionId) {
  showPage("home");
  setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

function handleSearch(value) {
  state.search = value;
  state.category = "all";
  showPage("catalog");
  updateActiveCategory();
  applyFilters();
}

function toggleMobileNav() {
  document.getElementById("mobile-nav")?.classList.toggle("open");
}

function switchTab(button, panelId) {
  document.querySelectorAll(".tab-btn").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  button.classList.add("active");
  document.getElementById(panelId)?.classList.add("active");
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 20);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, 2400);
}

function handleHeaderScroll() {
  document.getElementById("site-header")?.classList.toggle("scrolled", window.scrollY > 8);
}

function showLoadError() {
  ["catalog-grid", "featured-grid"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<div class="catalog-empty">No se pudieron cargar los productos. Abre la página desde un servidor local para permitir la lectura de los JSON.</div>`;
    }
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function productFallbackIcon() {
  return `
    <svg class="product-svg-icon" width="92" height="92" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="44" stroke="#0052CC" stroke-width="8"/>
      <path d="M22 60h76M60 22v76" stroke="#F97316" stroke-width="8" stroke-linecap="round"/>
    </svg>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}