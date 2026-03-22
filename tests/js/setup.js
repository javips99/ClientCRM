/**
 * setup.js — Preparación del entorno de tests Jest
 *
 * Se ejecuta antes de cada archivo de tests (configurado en package.json).
 * Carga las funciones globales de utils.js en el entorno jsdom.
 */

const fs   = require('fs');
const path = require('path');

// Leer y evaluar utils.js para hacer disponibles las funciones globales
const utilsCode = fs.readFileSync(
  path.join(__dirname, '../../assets/js/utils.js'),
  'utf8'
);
eval(utilsCode);

// Mock global de fetch (todas las peticiones AJAX pasan por aquí)
global.fetch = jest.fn();

// Estructura mínima del DOM requerida por algunas funciones
document.body.innerHTML = `
  <div id="toastContainer"></div>
  <nav class="navbar">
    <span id="navUserName"></span>
  </nav>
`;

// sessionStorage limpio antes de cada test
beforeEach(() => {
  sessionStorage.clear();
  jest.clearAllMocks();
});
