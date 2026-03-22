/**
 * clientes.js — CRUD de la lista de clientes
 *
 * Funcionalidades:
 *   - Cargar y renderizar la tabla de clientes
 *   - Filtrar por estado y buscar por texto (con debounce)
 *   - Abrir modal de creación / edición
 *   - Confirmar y ejecutar el borrado
 */

let clienteIdParaBorrar = null;
let debounceTimer       = null;

document.addEventListener('DOMContentLoaded', () => {
  loadClientes();
  initFiltros();
  initModal();
  initModalDelete();
  initTableDelegate(); // CAMBIO: delegación de eventos en tabla
});

// ── Carga y render de la tabla ────────────────────────────────────────────

async function loadClientes() {
  const estado   = document.getElementById('filtroEstado').value;
  const busqueda = document.getElementById('searchInput').value.trim();

  let url = 'api/clientes.php';
  const params = new URLSearchParams();
  if (estado)   params.set('estado', estado);
  if (busqueda) params.set('q', busqueda);
  if (params.toString()) url += '?' + params.toString();

  const tbody = document.getElementById('tbodyClientes');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6"><span class="spinner"></span> Cargando…</td></tr>';

  try {
    const clientes = await apiCall(url);
    renderClientes(clientes);
    actualizarLabel(clientes.length, !!estado || !!busqueda);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>❌ ${escapeHtml(err.message)}</p></td></tr>`;
    showToast('Error al cargar clientes: ' + err.message, 'error');
  }
}

function renderClientes(clientes) {
  const tbody = document.getElementById('tbodyClientes');

  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No se encontraron clientes con esos criterios.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  // CAMBIO: data-attributes en lugar de onclick="..." para separar lógica de template
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>
        <a href="cliente-detalle.html?id=${c.id}" style="text-decoration:none; color:var(--text);">
          <div class="td-name">${escapeHtml(c.nombre)}</div>
        </a>
      </td>
      <td class="col-empresa td-company">${escapeHtml(c.empresa || '—')}</td>
      <td>${estadoBadge(c.estado)}</td>
      <td class="col-telefono" style="color:var(--text-muted); font-size:0.85rem;">${escapeHtml(c.telefono || '—')}</td>
      <td class="text-right fw-600">${formatCurrency(c.valor_estimado)}</td>
      <td>
        <div class="td-actions">
          <a href="cliente-detalle.html?id=${c.id}" class="btn btn-icon" title="Ver detalle">👁️</a>
          <button class="btn btn-icon" data-action="editar" data-id="${c.id}" title="Editar">✏️</button>
          <button class="btn btn-icon" data-action="eliminar" data-id="${c.id}" title="Eliminar" style="color:var(--caliente);">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function actualizarLabel(count, filtrado) {
  const label = document.getElementById('totalLabel');
  const sufijo = filtrado ? ' encontrados' : ' clientes en total';
  label.textContent = `${count}${sufijo}`;
}

// ── Delegación de eventos en tabla ───────────────────────────────────────

/**
 * Un único listener en tbody delega los clicks de los botones de acción.
 * Evita añadir/quitar listeners cada vez que se re-renderiza la tabla.
 */
function initTableDelegate() {
  document.getElementById('tbodyClientes').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id     = parseInt(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'editar')   abrirModalEditar(id);
    if (action === 'eliminar') abrirModalDelete(id);
  });
}

// ── Filtros ───────────────────────────────────────────────────────────────

function initFiltros() {
  const searchInput  = document.getElementById('searchInput');
  const filtroEstado = document.getElementById('filtroEstado');

  // Debounce para no llamar a la API en cada pulsación de teclado
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadClientes, 350);
  });

  filtroEstado.addEventListener('change', loadClientes);
}

// ── Modal crear / editar ──────────────────────────────────────────────────

function initModal() {
  document.getElementById('btnNuevoCliente').addEventListener('click', () => abrirModalCrear());
  document.getElementById('btnModalClose').addEventListener('click', cerrarModal);
  document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModal();
  });
  document.getElementById('btnGuardar').addEventListener('click', guardarCliente);
}

function abrirModalCrear() {
  limpiarFormulario();
  document.getElementById('modalTitle').textContent = 'Nuevo cliente';
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('fNombre').focus();
}

async function abrirModalEditar(id) {
  try {
    const c = await apiCall(`api/clientes.php?id=${id}`);
    document.getElementById('clienteId').value   = c.id;
    document.getElementById('fNombre').value      = c.nombre     || '';
    document.getElementById('fEmpresa').value     = c.empresa    || '';
    document.getElementById('fEmail').value       = c.email      || '';
    document.getElementById('fTelefono').value    = c.telefono   || '';
    document.getElementById('fEstado').value      = c.estado;
    document.getElementById('fValor').value       = c.valor_estimado || 0;
    document.getElementById('modalTitle').textContent = 'Editar cliente';
    document.getElementById('modalOverlay').classList.add('open');
  } catch (err) {
    showToast('Error al cargar el cliente: ' + err.message, 'error');
  }
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function limpiarFormulario() {
  document.getElementById('clienteId').value  = '';
  document.getElementById('fNombre').value    = '';
  document.getElementById('fEmpresa').value   = '';
  document.getElementById('fEmail').value     = '';
  document.getElementById('fTelefono').value  = '';
  document.getElementById('fEstado').value    = 'frio';
  document.getElementById('fValor').value     = '';
}

async function guardarCliente() {
  const id     = document.getElementById('clienteId').value;
  const nombre = document.getElementById('fNombre').value.trim();
  const estado = document.getElementById('fEstado').value;

  if (!nombre) {
    showToast('El nombre del cliente es obligatorio.', 'error');
    document.getElementById('fNombre').focus();
    return;
  }

  const payload = {
    nombre,
    empresa:        document.getElementById('fEmpresa').value.trim(),
    email:          document.getElementById('fEmail').value.trim(),
    telefono:       document.getElementById('fTelefono').value.trim(),
    estado,
    valor_estimado: parseFloat(document.getElementById('fValor').value) || 0,
  };

  const btnGuardar = document.getElementById('btnGuardar');
  setLoading(btnGuardar, true, 'Guardar cliente', '⏳ Guardando…'); // CAMBIO: setLoading centralizado

  try {
    if (id) {
      await apiCall('api/clientes.php', 'PUT', { ...payload, id: parseInt(id) });
      showToast('Cliente actualizado correctamente.', 'success');
    } else {
      await apiCall('api/clientes.php', 'POST', payload);
      showToast('Cliente creado correctamente.', 'success');
    }
    cerrarModal();
    loadClientes();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    setLoading(btnGuardar, false, 'Guardar cliente');
  }
}

// ── Modal de borrado ──────────────────────────────────────────────────────

function initModalDelete() {
  document.getElementById('btnDeleteClose').addEventListener('click',    cerrarModalDelete);
  document.getElementById('btnDeleteCancelar').addEventListener('click', cerrarModalDelete);
  document.getElementById('modalDeleteOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalDelete();
  });
  document.getElementById('btnDeleteConfirmar').addEventListener('click', eliminarCliente);
}

function abrirModalDelete(id) {
  clienteIdParaBorrar = id;
  document.getElementById('modalDeleteOverlay').classList.add('open');
}

function cerrarModalDelete() {
  clienteIdParaBorrar = null;
  document.getElementById('modalDeleteOverlay').classList.remove('open');
}

async function eliminarCliente() {
  if (!clienteIdParaBorrar) return;

  const btnConfirmar = document.getElementById('btnDeleteConfirmar');
  setLoading(btnConfirmar, true, 'Sí, eliminar', '⏳ Eliminando…');

  try {
    await apiCall(`api/clientes.php?id=${clienteIdParaBorrar}`, 'DELETE');
    showToast('Cliente eliminado.', 'success');
    cerrarModalDelete();
    loadClientes();
  } catch (err) {
    showToast('Error al eliminar: ' + err.message, 'error');
  } finally {
    setLoading(btnConfirmar, false, 'Sí, eliminar');
  }
}
