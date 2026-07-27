const assert = require("assert");
const { cleanText } = require("../catalog-data.js");

const input = "Acoplamiento rpido recto con hilo universal para conexiones neumticas seguras y eficientes en alta presin. Caractersticas Principales: Medidal Hilo: M5 Medida Conexin rpida : 4mm Material: Metal -  Plstico Aplicaciones: I ndustriales, automotrices y de automatizacin";

const output = cleanText(input);

assert.match(output, /rápido/);
assert.match(output, /Características/);
assert.match(output, /Conexión rápida/);
assert.match(output, /plástico/i);
assert.match(output, /Industriales/);
assert.match(output, /automatización/);

console.log("normalize-text test passed");
