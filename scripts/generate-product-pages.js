const fs = require("fs");
const path = require("path");
const {
  SITE_URL,
  PRODUCT_SOURCES,
  normalizeProduct,
  metaDescription,
  metaTitle,
  keywords
} = require("../catalog-data.js");

const rootDir = path.resolve(__dirname, "..");
const productRoot = path.join(rootDir, "producto");
const today = new Date().toISOString().slice(0, 10);
const money = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

function readProducts() {
  const seenSlugs = new Map();
  return PRODUCT_SOURCES.flatMap((source) => {
    const raw = fs.readFileSync(path.join(rootDir, source.file), "utf8");
    const items = JSON.parse(raw);
    return items.map((item, index) => normalizeProduct(item, source, index, seenSlugs));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function absoluteAsset(url) {
  if (!url) return `${SITE_URL}/vair.png`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}/${url.replace(/^\/+/, "")}`;
}

function productSpecs(product) {
  return [
    ["Categoria", product.categoryName],
    ["Subcategoria", product.categoryText],
    ["Marca", product.brand],
    ["Material", product.material || "No especificado"],
    ["Diametro tubing", product.diameter || "No aplica"],
    ["Tipo conector", product.connectorType || "No aplica"],
    ["Tipo hilo", product.threadType || "No aplica"],
    ["SKU", product.sku]
  ];
}

function breadcrumbItems(product) {
  const items = [
    { name: "Inicio", url: `${SITE_URL}/` },
    { name: product.categoryName, url: `${SITE_URL}/#catalogo` }
  ];

  if (product.categoryText && product.categoryText !== product.categoryName) {
    items.push({ name: product.categoryText, url: `${SITE_URL}/#catalogo` });
  }

  items.push({ name: product.name, url: product.absoluteUrl });
  return items;
}

function productSchema(product) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${product.absoluteUrl}#product`,
    "name": product.name,
    "description": metaDescription(product),
    "sku": product.sku,
    "url": product.absoluteUrl,
    "image": [absoluteAsset(product.image)],
    "brand": {
      "@type": "Brand",
      "name": product.brand || "VAIR"
    },
    "category": product.categoryName,
    "offers": {
      "@type": "Offer",
      "url": product.absoluteUrl,
      "priceCurrency": "CLP",
      "price": String(product.price),
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "VAIR Chile"
      }
    }
  };

  if (product.ratingValue && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.ratingValue,
      "reviewCount": product.reviewCount
    };
  }

  return schema;
}

function breadcrumbSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems(product).map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

function relatedProducts(product, allProducts) {
  return allProducts
    .filter((item) => item.id !== product.id && item.categoryId === product.categoryId)
    .slice(0, 4);
}

function renderProductPage(product, allProducts) {
  const title = metaTitle(product);
  const description = metaDescription(product);
  const image = absoluteAsset(product.image);
  const related = relatedProducts(product, allProducts);
  const crumbs = breadcrumbItems(product);
  const whatsappMessage = `Hola VAIR, me gustaría cotizar ${product.name}. SKU: ${product.sku}. URL: ${product.absoluteUrl}`;
  const whatsappUrl = `https://wa.me/56948543511?text=${encodeURIComponent(whatsappMessage)}`;

  return `<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="${escapeHtml(keywords(product))}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${escapeHtml(product.absoluteUrl)}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="VAIR Chile" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(product.absoluteUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="product:price:amount" content="${escapeHtml(product.price)}" />
  <meta property="product:price:currency" content="CLP" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="preload" href="/styles.css" as="style" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="icon" href="/vair.png" type="image/png" />
  <script type="application/ld+json">${jsonLd(productSchema(product))}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbSchema(product))}</script>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <div class="header-inner">
        <a href="/" class="logo logo-vair" aria-label="VAIR">
          <img src="/vair.png" alt="VAIR Chile" class="logo-img" width="120" height="40" />
        </a>
        <nav class="site-nav" aria-label="Principal">
          <ul class="nav-list">
            <li><a href="/">Inicio</a></li>
            <li><a href="/#catalogo">Productos</a></li>
            <li><a href="/#footer">Contacto</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <main class="product-static">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${crumbs.map((item, index) => index === crumbs.length - 1
          ? `<span class="current">${escapeHtml(item.name)}</span>`
          : `<a href="${escapeHtml(item.url.replace(SITE_URL, ""))}">${escapeHtml(item.name)}</a><span>›</span>`
        ).join("")}
      </nav>

      <article class="product-layout product-page">
        <section class="product-gallery" aria-label="Imagen del producto">
          <div class="gallery-main">
            <img class="detail-photo" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="700" height="700" loading="eager" decoding="async" />
          </div>
        </section>

        <section class="product-detail-info">
          <div class="product-detail-brand">${escapeHtml(product.brand)}</div>
          <h1 class="product-detail-title">${escapeHtml(product.name)}</h1>
          <div class="product-detail-sku">${escapeHtml(product.sku)}</div>
          <div class="product-detail-rating"><span class="stock-badge">Stock disponible</span></div>
          <div class="product-detail-price">
            <span class="product-detail-price-main">${escapeHtml(money.format(product.price))}</span>
          </div>
          <div class="iva-note">Precio incluye IVA · Facturable a empresa</div>
          <p class="product-detail-desc">${escapeHtml(product.description || description)}</p>
          <div class="buy-actions">
            <a class="btn btn-orange btn-lg" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">Solicitar cotización</a>
            <a class="btn btn-outline" href="/#catalogo">Volver al catálogo</a>
          </div>
          <div class="product-meta">
            <div class="meta-row"><span>Despacho: <strong>1-3 días hábiles</strong></span></div>
            <div class="meta-row"><span>Producto <strong>certificado y garantizado</strong></span></div>
            <div class="meta-row"><span>Soporte técnico: <strong>+56 9 4954 3511</strong></span></div>
          </div>
        </section>
      </article>

      <section class="product-static-section">
        <h2>Especificaciones</h2>
        <table class="specs-table">
          ${productSpecs(product).map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}
        </table>
      </section>

      <section class="product-static-section">
        <h2>Productos relacionados</h2>
        <div class="products-grid">
          ${related.map((item) => `
            <article class="product-card">
              <a class="product-card-link" href="${escapeHtml(item.url)}">
                <div class="product-img-wrap">
                  <div class="product-img-inner">
                    <img class="product-photo" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" />
                  </div>
                </div>
                <div class="product-info">
                  <div class="product-brand">${escapeHtml(item.brand)}</div>
                  <h3 class="product-name">${escapeHtml(item.name)}</h3>
                  <div class="product-sku">${escapeHtml(item.sku)}</div>
                  <div class="product-price-row"><span class="price-main">${escapeHtml(money.format(item.price))}</span></div>
                </div>
              </a>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
  </main>

  <footer class="site-footer" id="footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="/" class="logo logo-vair"><img src="/vair.png" alt="VAIR Chile" class="logo-img" width="120" height="40" /></a>
          <p class="footer-tagline">VAIR distribuye componentes neumáticos industriales para Chile: racores PU, tubing de poliuretano y acoples rápidos.</p>
        </div>
        <div>
          <div class="footer-col-title">Contacto</div>
          <div class="footer-contact-item"><div><strong>+56 9 4954 3511</strong><span>Lunes a viernes 8:30-18:00</span></div></div>
          <div class="footer-contact-item"><div><strong>ventas@vair.cl</strong><span>Respondemos en menos de 2h</span></div></div>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>
`;
}

function renderSitemap(products) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0" },
    ...products.map((product) => ({ loc: product.absoluteUrl, priority: "0.8" }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeHtml(url.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

function renderRobots() {
  return `User-agent: *
Allow: /
Allow: /producto/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function build() {
  const products = readProducts();
  fs.rmSync(productRoot, { recursive: true, force: true });
  fs.mkdirSync(productRoot, { recursive: true });

  for (const product of products) {
    const dir = path.join(productRoot, product.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderProductPage(product, products), "utf8");
  }

  fs.writeFileSync(path.join(rootDir, "sitemap.xml"), renderSitemap(products), "utf8");
  fs.writeFileSync(path.join(rootDir, "robots.txt"), renderRobots(), "utf8");

  console.log(`Generated ${products.length} product pages.`);
}

build();
