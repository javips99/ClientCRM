/**
 * auth.js — Autenticación y gestión de sesión
 *
 * Responsabilidades:
 *   - Manejar el formulario de login (index.html)
 *   - Gestionar el botón de logout en todas las páginas
 *   - Mostrar el nombre del usuario en el navbar
 *   - Redirigir a index.html si no hay sesión activa
 */

// Promesa global resuelta cuando la sesión está confirmada.
// Los scripts de página hacen: await authReady antes de cargar datos.
window.authReady = new Promise((resolve) => {
  window._resolveAuth = resolve;
});

document.addEventListener('DOMContentLoaded', () => {
  const esLoginPage = document.getElementById('loginForm') !== null;

  if (esLoginPage) {
    // CAMBIO: en login no necesitamos resolver authReady
    window._resolveAuth(null);
    initLoginPage();
  } else {
    initAuthGuard().then(window._resolveAuth);
    initLogout();
  }
});

// ── Login ─────────────────────────────────────────────────────────────────

function initLoginPage() {
  // Si ya hay sesión, redirigir directamente al dashboard
  apiCall('api/auth.php?action=check')
    .then(data => {
      if (data.autenticado) {
        window.location.href = 'dashboard.html';
      }
    })
    .catch(() => {}); // Ignorar errores de red al verificar

  const form    = document.getElementById('loginForm');
  const btnLogin = document.getElementById('btnLogin');
  const errorDiv = document.getElementById('loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validación básica en cliente antes de llamar al servidor
    if (!email || !password) {
      mostrarError('Completa todos los campos.');
      return;
    }

    setLoading(btnLogin, true, 'Entrar al CRM', '⏳ Entrando…');
    ocultarError();

    try {
      await apiCall('api/auth.php?action=login', 'POST', { email, password });
      window.location.href = 'dashboard.html';
    } catch (err) {
      mostrarError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(btnLogin, false, 'Entrar al CRM');
    }
  });

  function mostrarError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.add('visible');
  }

  function ocultarError() {
    errorDiv.textContent = '';
    errorDiv.classList.remove('visible');
  }
}

// ── Guard de autenticación ────────────────────────────────────────────────

/**
 * Verifica que haya una sesión activa.
 * Si no la hay, redirige al login.
 * Si la hay, muestra el nombre del usuario en el navbar y resuelve authReady.
 */
async function initAuthGuard() {
  try {
    // CAMBIO: caché de auth en sessionStorage para evitar petición en cada página
    const data = await getAuthCached();

    if (!data.autenticado) {
      clearAuthCache();
      window.location.href = 'index.html';
      return;
    }

    const nameEl = document.getElementById('navUserName');
    if (nameEl) nameEl.textContent = data.usuario.nombre;

    return data.usuario;
  } catch {
    clearAuthCache();
    window.location.href = 'index.html';
  }
}

/**
 * Devuelve el estado de autenticación desde caché (sessionStorage) si
 * tiene menos de 5 minutos, o desde el servidor si es más antiguo o no existe.
 *
 * @returns {Promise<{autenticado: boolean, usuario?: object}>}
 */
async function getAuthCached() {
  const TTL_MS  = 5 * 60 * 1000; // 5 minutos
  const cached  = sessionStorage.getItem('_authCache');

  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < TTL_MS) return data;
  }

  // Caché vacío o expirado — consultar el servidor
  const data = await apiCall('api/auth.php?action=check');
  sessionStorage.setItem('_authCache', JSON.stringify({ timestamp: Date.now(), data }));
  if (data.usuario) sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
  return data;
}

/** Limpia el caché de auth (llamar en logout o si la sesión expira). */
function clearAuthCache() {
  sessionStorage.removeItem('_authCache');
  sessionStorage.removeItem('usuario');
}

// ── Logout ────────────────────────────────────────────────────────────────

function initLogout() {
  const btn = document.getElementById('btnLogout');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await apiCall('api/auth.php?action=logout', 'POST');
    } catch {
      // Continuar igualmente aunque falle la petición
    } finally {
      clearAuthCache(); // CAMBIO: limpiar caché de auth además del usuario
      window.location.href = 'index.html';
    }
  });
}

// setLoading() está en utils.js (CAMBIO: centralizada para reutilización global)
