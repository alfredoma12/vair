const assert = require("assert");
const { cleanText } = require("../catalog-data.js");

const input = "Acoplamiento rápido recto con hilo universal para conexiones neumáticas seguras y eficientes en alta presión. Características Principales: Medida Hilo: M5 Medida Conexión rápida : 4mm Material: Metal -  Plástico Aplicaciones: Industriales, automotrices y de automatización";

const output = cleanText(input);

assert.match(output, /rápido/);
assert.match(output, /Características/);
assert.match(output, /Conexión rápida/);
assert.match(output, /plástico/i);
assert.match(output, /Industriales/);
assert.match(output, /automatización/);
assert.strictEqual(cleanText("óptimo"), "óptimo");
assert.strictEqual(cleanText("despresurización"), "despresurización");
assert.strictEqual(cleanText("mini válvula neumática"), "mini válvula neumática");
assert.strictEqual(cleanText("YEE"), "YEE");
assert.strictEqual(cleanText("pasamuros"), "pasamuros");
assert.strictEqual(cleanText("a través"), "a través");
assert.strictEqual(cleanText("instalación"), "instalación");
assert.strictEqual(cleanText("neumáticas"), "neumáticas");
assert.strictEqual(cleanText("líneas"), "líneas");
assert.strictEqual(cleanText("está diseñada"), "está diseñada");
console.log("normalize-text test passed");
