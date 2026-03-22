/**
 * utils.js — Funciones compartidas por todas las páginas
 *
 * Exporta al scope global (sin módulos, para compatibilidad máxima):
 *   apiCall(url, method, body)  → Promise<any>
 *   escapeHtml(str)             → string
 *   showToast(msg, type)        → void
 *   formatDate(dateStr)         → string
 *   formatCurrency(amount)      → string
 *   estadoBadge(estado)         → string (HTML)
 */

// ── Fetch wrapper ──────────────────────────────────────────────────────────

/**
 * Realiza una petición AJAX y devuelve los datos JSON.
 * Lanza un Error con el mensaje del servidor si la respuesta no es 2xx.
 *
 * @param {string}  url     Ruta del endpoint
 * @param {string}  method  Método HTTP (GET|POST|PUT|DELETE)
 * @param {object}  [body]  Payload a enviar como JSON
 * @returns {Promise<any>}
 *
 * @example
 *   const clientes = await apiCall('api/clientes.php');
 *   await apiCall('api/clientes.php', 'POST', { nombre: 'Test', estado: 'frio' });
 */
async function apiCall(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',   // envía cookies de sesión
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data     = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Usa el mensaje del servidor si existe
    throw new Error(data.error || `Error ${response.status}`);
  }

  return data;
}

// ── Seguridad ──────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML peligrosos para prevenir XSS.
 *
 * @param {string} str  Texto sin procesar
 * @returns {string}    Texto seguro para insertar en innerHTML
 *
 * @example
 *   td.innerHTML = escapeHtml(cliente.nombre);
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ── Notificaciones toast ───────────────────────────────────────────────────

/**
 * Muestra una notificación toast temporal.
 *
 * @param {string} mensaje  Texto a mostrar
 * @param {'success'|'error'|'info'} tipo  Tipo de notificación
 */
function showToast(mensaje, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = `${icons[tipo] ?? ''} ${mensaje}`;

  container.appendChild(toast);

  // Eliminar del DOM después de que termine la animación CSS
  setTimeout(() => toast.remove(), 3100);
}

// ── Formato ───────────────────────────────────────────────────────────────

/**
 * Formatea una cadena de fecha ISO a formato local español.
 *
 * @param {string} dateStr  Fecha en formato MySQL (YYYY-MM-DD HH:MM:SS) o ISO
 * @returns {string}        Fecha formateada (Ej: "22 mar 2026, 15:30")
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('es-ES', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea un número como moneda europea (€).
 *
 * @param {number} amount  Cantidad a formatear
 * @returns {string}       Ej: "12.500,00 €"
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style:    'currency',
    currency: 'EUR',
  }).format(amount ?? 0);
}

// ── Estado de carga en botones ────────────────────────────────────────────

/**
 * Activa o desactiva el estado loading de un botón.
 * CAMBIO: movida desde auth.js a utils.js para uso global.
 *
 * @param {HTMLButtonElement} btn
 * @param {boolean}           loading
 * @param {string}            textoOriginal  Texto a mostrar cuando loading=false
 * @param {string}            [textoLoading] Texto a mostrar cuando loading=true
 */
function setLoading(btn, loading, textoOriginal, textoLoading = '⏳ Cargando…') {
  btn.disabled    = loading;
  btn.textContent = loading ? textoLoading : textoOriginal;
}

// ── Badges de estado ──────────────────────────────────────────────────────

/**
 * Devuelve el HTML de un badge de estado coloreado.
 *
 * @param {string} estado  'caliente' | 'tibio' | 'frio' | 'ganado'
 * @returns {string}       HTML del badge
 */
function estadoBadge(estado) {
  const labels = {
    caliente: 'Caliente',
    tibio:    'Tibio',
    frio:     'Frío',
    ganado:   'Ganado',
  };
  const label = labels[estado] ?? estado;
  return `<span class="badge badge-${escapeHtml(estado)}">${label}</span>`;
}
