/**
 * demo.js — Capa mock para modo demo (GitHub Pages)
 *
 * Sobreescribe window.apiCall() definida en utils.js.
 * Todos los datos viven en sessionStorage durante la sesión del navegador,
 * por lo que persisten entre páginas y se reinician al cerrar sesión.
 *
 * Cargado DESPUÉS de utils.js y ANTES de auth.js en todos los HTML.
 * En producción (con PHP), este archivo no existe, así que no afecta.
 *
 * Endpoints simulados:
 *   api/auth.php      → check / login / logout
 *   api/dashboard.php → métricas + recientes
 *   api/clientes.php  → GET list, GET ?id, POST, PUT, DELETE ?id
 *   api/notas.php     → GET ?cliente_id, POST, DELETE ?id
 */

(function () {
  'use strict';

  // ── Usuario demo ─────────────────────────────────────────────────────────

  const DEMO_USER = {
    id:     1,
    nombre: 'Admin Demo',
    email:  'admin@clientcrm.com',
  };

  // ── Claves de sessionStorage ──────────────────────────────────────────────

  const SK_CLIENTES = '_demo_clientes';
  const SK_NOTAS    = '_demo_notas';

  // ── Datos iniciales (solo se usan si sessionStorage está vacío) ───────────

  const INIT_CLIENTES = [
    {
      id: 1, nombre: 'María García', empresa: 'TechSolutions S.L.',
      email: 'maria@techsolutions.es', telefono: '612 345 678',
      estado: 'caliente', valor_estimado: 18500,
      usuario_id: 1, creado_en: '2026-03-10 09:15:00',
    },
    {
      id: 2, nombre: 'Carlos Ruiz', empresa: 'Innovatech',
      email: 'c.ruiz@innovatech.com', telefono: '638 901 234',
      estado: 'ganado', valor_estimado: 32000,
      usuario_id: 1, creado_en: '2026-03-05 14:30:00',
    },
    {
      id: 3, nombre: 'Lucía Martínez', empresa: 'Grupo Nexo',
      email: 'lmartinez@gruponexo.es', telefono: '655 222 111',
      estado: 'tibio', valor_estimado: 9800,
      usuario_id: 1, creado_en: '2026-03-18 11:00:00',
    },
    {
      id: 4, nombre: 'Andrés López', empresa: 'Digital Hub',
      email: 'andres@digitalhub.io', telefono: '699 555 444',
      estado: 'frio', valor_estimado: 4500,
      usuario_id: 1, creado_en: '2026-03-20 16:45:00',
    },
    {
      id: 5, nombre: 'Elena Fernández', empresa: 'Retail Pro',
      email: 'elena.f@retailpro.es', telefono: '617 888 777',
      estado: 'caliente', valor_estimado: 27000,
      usuario_id: 1, creado_en: '2026-03-22 10:20:00',
    },
    {
      id: 6, nombre: 'Pablo Sánchez', empresa: 'CloudBase',
      email: 'pablo@cloudbase.io', telefono: '644 333 222',
      estado: 'ganado', valor_estimado: 15000,
      usuario_id: 1, creado_en: '2026-03-25 08:00:00',
    },
    {
      id: 7, nombre: 'Isabel Torres', empresa: '',
      email: 'itorresg@gmail.com', telefono: '666 123 456',
      estado: 'frio', valor_estimado: 2200,
      usuario_id: 1, creado_en: '2026-03-28 17:10:00',
    },
    {
      id: 8, nombre: 'Roberto Díaz', empresa: 'MedTech España',
      email: 'rdiaz@medtech.es', telefono: '611 987 654',
      estado: 'tibio', valor_estimado: 12400,
      usuario_id: 1, creado_en: '2026-04-01 09:30:00',
    },
  ];

  const INIT_NOTAS = [
    {
      id: 1, cliente_id: 1, usuario_id: 1, autor: 'Admin Demo',
      contenido: 'Llamada inicial. Muy interesado en el plan Enterprise. Pide propuesta formal para la próxima semana.',
      creado_en: '2026-03-11 10:00:00',
    },
    {
      id: 2, cliente_id: 1, usuario_id: 1, autor: 'Admin Demo',
      contenido: 'Reunión presencial en sus oficinas. Confirmaron presupuesto de 18.500 €. Esperan contrato antes del día 20.',
      creado_en: '2026-03-15 16:30:00',
    },
    {
      id: 3, cliente_id: 2, usuario_id: 1, autor: 'Admin Demo',
      contenido: 'Contrato firmado. Inicio de proyecto el 1 de abril. Asignado equipo de 3 personas.',
      creado_en: '2026-03-06 09:00:00',
    },
    {
      id: 4, cliente_id: 3, usuario_id: 1, autor: 'Admin Demo',
      contenido: 'Primer contacto por LinkedIn. Solicitan demo del producto. Pendiente de agendar llamada.',
      creado_en: '2026-03-19 11:45:00',
    },
    {
      id: 5, cliente_id: 5, usuario_id: 1, autor: 'Admin Demo',
      contenido: 'Demo realizada con éxito. Feedback muy positivo. Quieren ampliar el alcance a 3 tiendas más.',
      creado_en: '2026-03-23 14:00:00',
    },
    {
      id: 6, cliente_id: 8, usuario_id: 1, autor: 'Admin Demo',
      contenido: 'Email de seguimiento enviado. Sin respuesta todavía. Reintentar en 5 días.',
      creado_en: '2026-04-01 10:00:00',
    },
  ];

  // ── Arrays en memoria — cargados desde sessionStorage o datos iniciales ───
  //
  // Al navegar entre páginas el IIFE se re-ejecuta, pero sessionStorage
  // persiste durante toda la sesión del navegador, por lo que los cambios
  // (crear, editar, eliminar) sobreviven a la navegación.

  let _clientes = _loadOrInit(SK_CLIENTES, INIT_CLIENTES);
  let _notas    = _loadOrInit(SK_NOTAS,    INIT_NOTAS);

  function _loadOrInit(key, defaults) {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaults.map(item => ({ ...item })); // copia superficial
  }

  /** Persiste ambos arrays en sessionStorage tras cada operación de escritura. */
  function _save() {
    try {
      sessionStorage.setItem(SK_CLIENTES, JSON.stringify(_clientes));
      sessionStorage.setItem(SK_NOTAS,    JSON.stringify(_notas));
    } catch {}
  }

  // ── IDs autoincrementales — derivados del máximo existente ────────────────

  function _nextClienteId() {
    return Math.max(0, ..._clientes.map(c => c.id)) + 1;
  }

  function _nextNotaId() {
    return Math.max(0, ..._notas.map(n => n.id)) + 1;
  }

  // ── Estado de sesión ──────────────────────────────────────────────────────
  //
  // Se inicializa leyendo la caché de sessionStorage que auth.js escribe al
  // hacer login. Así, al navegar entre páginas, el mock recupera el estado
  // correcto aunque el IIFE se re-ejecute desde cero en cada carga.

  let _loggedIn = (function () {
    try {
      const cached = sessionStorage.getItem('_authCache');
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000 && data?.autenticado) return true;
      }
    } catch {}
    return false;
  })();

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Simula latencia de red para que la UI se vea realista. */
  function _delay(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Calcula las métricas del dashboard a partir del estado actual de _clientes. */
  function _calcMetricas() {
    const total   = _clientes.length;
    const activas = _clientes.filter(c => c.estado !== 'ganado').length;
    const ganadas = _clientes.filter(c => c.estado === 'ganado').length;
    const pipeline = _clientes
      .filter(c => c.estado !== 'ganado')
      .reduce((sum, c) => sum + Number(c.valor_estimado), 0);

    return {
      total_clientes:        total,
      oportunidades_activas: activas,
      ventas_ganadas:        ganadas,
      valor_pipeline:        pipeline,
      distribucion: {
        caliente: _clientes.filter(c => c.estado === 'caliente').length,
        tibio:    _clientes.filter(c => c.estado === 'tibio').length,
        frio:     _clientes.filter(c => c.estado === 'frio').length,
        ganado:   ganadas,
      },
    };
  }

  /** Filtra _clientes por estado y/o texto de búsqueda. */
  function _applyFilters(estado, q) {
    let result = [..._clientes];
    if (estado) {
      result = result.filter(c => c.estado === estado);
    }
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(lower) ||
        (c.empresa  || '').toLowerCase().includes(lower) ||
        (c.email    || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }

  // ── Router mock ───────────────────────────────────────────────────────────

  async function mockApiCall(url, method = 'GET', body = null) {
    await _delay();

    // Usar URL relativa anclada a un origen ficticio para parsear correctamente
    const urlObj = new URL(url, 'http://localhost/');
    const path   = urlObj.pathname.replace(/^\//, '');
    const params = urlObj.searchParams;

    // ── api/auth.php ────────────────────────────────────────────────────────

    if (path === 'api/auth.php') {
      const action = params.get('action');

      if (action === 'check') {
        return _loggedIn
          ? { autenticado: true, usuario: DEMO_USER }
          : { autenticado: false };
      }

      if (action === 'login' && method === 'POST') {
        if (
          body?.email    === 'admin@clientcrm.com' &&
          body?.password === 'admin123'
        ) {
          _loggedIn = true;
          // Pre-popular la caché de auth para que initAuthGuard no haga
          // otra petición al cambiar de página
          const authData = { autenticado: true, usuario: DEMO_USER };
          sessionStorage.setItem('_authCache', JSON.stringify({
            timestamp: Date.now(),
            data:      authData,
          }));
          sessionStorage.setItem('usuario', JSON.stringify(DEMO_USER));
          return { success: true };
        }
        throw new Error('Credenciales incorrectas. Usa admin@clientcrm.com / admin123');
      }

      if (action === 'logout' && method === 'POST') {
        _loggedIn = false;
        // Limpiar sesión y datos persistidos — la próxima sesión parte de cero
        sessionStorage.removeItem('_authCache');
        sessionStorage.removeItem('usuario');
        sessionStorage.removeItem(SK_CLIENTES);
        sessionStorage.removeItem(SK_NOTAS);
        return { success: true };
      }
    }

    // Las rutas siguientes requieren sesión activa
    if (!_loggedIn) {
      throw new Error('Sesión no iniciada.');
    }

    // ── api/dashboard.php ────────────────────────────────────────────────────

    if (path === 'api/dashboard.php' && method === 'GET') {
      const recientes = [..._clientes]
        .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
        .slice(0, 5);
      return { metricas: _calcMetricas(), recientes };
    }

    // ── api/clientes.php ─────────────────────────────────────────────────────

    if (path === 'api/clientes.php') {

      // GET ?id=X — cliente individual
      if (method === 'GET' && params.has('id')) {
        const id = parseInt(params.get('id'));
        const c  = _clientes.find(c => c.id === id);
        if (!c) throw new Error('Cliente no encontrado.');
        return c;
      }

      // GET (lista con filtros opcionales)
      if (method === 'GET') {
        return _applyFilters(params.get('estado'), params.get('q'));
      }

      // POST — crear cliente
      if (method === 'POST') {
        const nuevo = {
          id:             _nextClienteId(),
          nombre:         (body.nombre         || '').trim(),
          empresa:        (body.empresa         || '').trim() || null,
          email:          (body.email           || '').trim() || null,
          telefono:       (body.telefono        || '').trim() || null,
          estado:         body.estado           || 'frio',
          valor_estimado: Number(body.valor_estimado) || 0,
          usuario_id:     1,
          creado_en:      new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        _clientes.unshift(nuevo);
        _save();
        return { success: true, id: nuevo.id };
      }

      // PUT — actualizar cliente
      if (method === 'PUT') {
        const idx = _clientes.findIndex(c => c.id === body.id);
        if (idx === -1) throw new Error('Cliente no encontrado.');
        _clientes[idx] = {
          ..._clientes[idx],
          nombre:         (body.nombre         || '').trim(),
          empresa:        (body.empresa         || '').trim() || null,
          email:          (body.email           || '').trim() || null,
          telefono:       (body.telefono        || '').trim() || null,
          estado:         body.estado           || _clientes[idx].estado,
          valor_estimado: Number(body.valor_estimado) || 0,
        };
        _save();
        return { success: true };
      }

      // DELETE ?id=X — eliminar cliente y sus notas
      if (method === 'DELETE' && params.has('id')) {
        const id  = parseInt(params.get('id'));
        const idx = _clientes.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Cliente no encontrado.');
        _clientes.splice(idx, 1);
        // Borrar notas asociadas (ON DELETE CASCADE)
        for (let i = _notas.length - 1; i >= 0; i--) {
          if (_notas[i].cliente_id === id) _notas.splice(i, 1);
        }
        _save();
        return { success: true };
      }
    }

    // ── api/notas.php ────────────────────────────────────────────────────────

    if (path === 'api/notas.php') {

      // GET ?cliente_id=X — notas de un cliente
      if (method === 'GET' && params.has('cliente_id')) {
        const cid = parseInt(params.get('cliente_id'));
        return [..._notas]
          .filter(n => n.cliente_id === cid)
          .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
      }

      // POST — añadir nota
      if (method === 'POST') {
        const nueva = {
          id:         _nextNotaId(),
          cliente_id: Number(body.cliente_id),
          usuario_id: 1,
          autor:      DEMO_USER.nombre,
          contenido:  (body.contenido || '').trim(),
          creado_en:  new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        _notas.push(nueva);
        _save();
        return { success: true, id: nueva.id };
      }

      // DELETE ?id=X — eliminar nota
      if (method === 'DELETE' && params.has('id')) {
        const id  = parseInt(params.get('id'));
        const idx = _notas.findIndex(n => n.id === id);
        if (idx === -1) throw new Error('Nota no encontrada.');
        _notas.splice(idx, 1);
        _save();
        return { success: true };
      }
    }

    throw new Error(`[Demo] Endpoint no reconocido: ${method} ${path}`);
  }

  // ── Reemplazar apiCall global ─────────────────────────────────────────────
  window.apiCall = mockApiCall;

})();
