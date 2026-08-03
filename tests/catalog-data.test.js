const assert = require("assert");
const { PRODUCT_SOURCES } = require("../catalog-data.js");

const manguerasSources = PRODUCT_SOURCES.filter((source) => source.categoryId === "mangueras");
assert.ok(manguerasSources.length >= 2, "Debe existir más de una fuente para la categoría mangueras");
assert.ok(manguerasSources.some((source) => source.file === "sanflex_products.json"), "Debe incluir sanflex_products.json como fuente");
assert.strictEqual(manguerasSources[0].categoryName, "Mangueras");
console.log("catalog-data test passed");
