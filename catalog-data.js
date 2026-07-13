(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.VairCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  // SEO: el CNAME publica el dominio raiz; usarlo como canonical evita duplicados entre www y non-www en Google Search Console.
  const SITE_URL = "https://vair.cl";
  const PRODUCT_SOURCES = [
    { file: "sanflex.json", categoryId: "racores", categoryName: "Racores y conectores PU", shortName: "Racores" },
    { file: "manguera-pu.json", categoryId: "tubing", categoryName: "Mangueras de poliuretano PU", shortName: "Tubing PU" },
    { file: "acoples -rapidos.json", categoryId: "acoples", categoryName: "Acoples rapidos", shortName: "Acoples" }
  ];

  function cleanText(value) {
    return repairMojibake(String(value ?? "")).replace(/\s+/g, " ").trim();
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

  function slugify(value) {
    return cleanText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/["'’´`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function makeSku(categoryId, index) {
    return `${categoryId.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`;
  }

  function normalizeProduct(item, source, index, seenSlugs) {
    const price = Number(item.precio) || 0;
    const name = cleanText(item.nombre || "Producto sin nombre");
    const categoryText = cleanText(item.categoria || source.categoryName);
    const baseSlug = slugify(name) || `${source.categoryId}-${index + 1}`;
    const slug = uniqueSlug(baseSlug, seenSlugs);

    return {
      id: `${source.categoryId}-${index}`,
      name,
      slug,
      url: `/producto/${slug}/`,
      absoluteUrl: `${SITE_URL}/producto/${slug}/`,
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

  function uniqueSlug(baseSlug, seenSlugs) {
    if (!seenSlugs) return baseSlug;
    const next = (seenSlugs.get(baseSlug) || 0) + 1;
    seenSlugs.set(baseSlug, next);
    return next === 1 ? baseSlug : `${baseSlug}-${next}`;
  }

  function metaDescription(product) {
    const cleanedName = cleanText(product.name).replace(/\s*\|\s*/g, " ");
    const fallback = `${cleanedName} en ${product.categoryName}. Cotiza en VAIR Chile con stock permanente, despacho nacional y asesoría técnica especializada.`;
    return truncate(product.description || fallback, 155);
  }

  function metaTitle(product) {
    const cleanedName = cleanText(product.name).replace(/\s*\|\s*/g, " ");
    return truncate(`${cleanedName} | VAIR Chile`, 60);
  }

  function keywords(product) {
    return [
      product.name,
      product.categoryName,
      product.brand,
      product.material,
      product.diameter,
      "componentes neumaticos Chile",
      "VAIR"
    ].filter(Boolean).join(", ");
  }

  function truncate(value, maxLength) {
    const text = cleanText(value);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3).trim().replace(/[.,;:]+$/, "")}...`;
  }

  return {
    SITE_URL,
    PRODUCT_SOURCES,
    cleanText,
    repairMojibake,
    slugify,
    makeSku,
    normalizeProduct,
    metaDescription,
    metaTitle,
    keywords
  };
});
