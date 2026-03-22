/**
 * cliente-detalle.js — Vista de detalle de un cliente
 *
 * Funcionalidades:
 *   - Cargar datos del cliente desde la URL (?id=X)
 *   - Mostrar y gestionar notas (añadir / eliminar)
 *   - Editar el cliente mediante modal
 *   - Eliminar el cliente con confirmación
 */

let clienteId   = null;
let clienteData = null; // CAMBIO: variable de módulo en lugar de window._clienteData

document.addEventListener('DOMContentLoaded', () => {
  // Obtener el ID del cliente desde la URL (?id=X)
  const params = new URLSearchParams(window.location.search);
  clienteId    = parseInt(params.get('id'));

  if (!clienteId) {
    showToast('ID de cliente no válido.', 'error');
    setTimeout(() => window.location.href = 'clientes.html', 1500);
    return;
  }

  // CAMBIO: esperar confirmación de sesión antes de cargar datos del cliente
  authReady.then(() => {
    loadCliente();
    loadNotas();
  });

  initModalEditar();
  initModalDelete();
  initAddNota();
});

// ── Cargar datos del cliente ──────────────────────────────────────────────

async function loadCliente() {
  try {
    const c = await apiCall(`api/clientes.php?id=${clienteId}`);
    renderCliente(c);
  } catch (err) {
    showToast('Error al cargar el cliente: ' + err.message, 'error');
  }
}

function renderCliente(c) {
  document.title = `ClientCRM — ${c.nombre}`;

  document.getElementById('detNombre').textContent  = c.nombre   || '—';
  document.getElementById('detEmpresa').textContent = c.empresa  || '—';
  document.getElementById('detEmail').textContent   = c.email    || '—';
  document.getElementById('detTelefono').textContent = c.telefono || '—';
  document.getElementById('detValor').textContent   = formatCurrency(c.valor_estimado);
  document.getElementById('detFecha').textContent   = formatDate(c.creado_en);
  document.getElementById('detBadge').innerHTML     = estadoBadge(c.estado);

  // CAMBIO: almacenar en variable de módulo, no en window
  clienteData = c;
}

// ── Notas ──────────────────────────────────────────────────────────────────

async function loadNotas() {
  const timeline = document.getElementById('notesTimeline');
  timeline.innerHTML = '<p class="text-muted" style="font-size:0.875rem;">Cargando notas…</p>';

  try {
    const notas = await apiCall(`api/notas.php?cliente_id=${clienteId}`);
    renderNotas(notas);
  } catch (err) {
    timeline.innerHTML = `<p style="color:var(--caliente); font-size:0.875rem;">Error: ${escapeHtml(err.message)}</p>`;
  }
}

function renderNotas(notas) {
  const timeline = document.getElementById('notesTimeline');

  if (notas.length === 0) {
    timeline.innerHTML = `
      <div style="text-align:center; padding:2rem 0; color:var(--text-muted); font-size:0.875rem;">
        <div style="font-size:2rem; margin-bottom:0.5rem;">📝</div>
        <p>Sin notas todavía. Registra la primera actividad.</p>
      </div>`;
    return;
  }

  timeline.innerHTML = notas.map(n => `
    <div class="note-item" data-id="${n.id}">
      <div class="note-dot"></div>
      <div class="note-body">
        <div class="note-meta">
          <span class="note-author">${escapeHtml(n.autor)}</span>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="note-date">${formatDate(n.creado_en)}</span>
            <button
              class="btn btn-icon"
              onclick="eliminarNota(${n.id})"
              title="Eliminar nota"
              style="color:var(--caliente); padding:0.2rem 0.4rem; font-size:0.75rem;"
            >🗑️</button>
          </div>
        </div>
        <p class="note-content">${escapeHtml(n.contenido)}</p>
      </div>
    </div>
  `).join('');
}

function initAddNota() {
  document.getElementById('btnAgregarNota').addEventListener('click', agregarNota);

  // Atajo de teclado: Ctrl+Enter para enviar la nota
  document.getElementById('nuevaNota').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) agregarNota();
  });
}

async function agregarNota() {
  const textarea  = document.getElementById('nuevaNota');
  const contenido = textarea.value.trim();

  if (!contenido) {
    showToast('Escribe el contenido de la nota.', 'error');
    textarea.focus();
    return;
  }

  const btn = document.getElementById('btnAgregarNota');
  setLoading(btn, true, 'Añadir nota', '⏳');

  // CAMBIO: UI optimista — mostrar nota antes de recibir confirmación del servidor
  const notaTemp  = prependarNotaOptimista(contenido);
  textarea.value  = '';

  try {
    await apiCall('api/notas.php', 'POST', { cliente_id: clienteId, contenido });
    // Confirmar visualmente que fue guardada
    notaTemp.style.opacity = '1';
    showToast('Nota añadida.', 'success');
  } catch (err) {
    // Revertir: eliminar nota optimista y restaurar textarea
    notaTemp.remove();
    textarea.value = contenido;
    showToast('Error al añadir nota: ' + err.message, 'error');
  } finally {
    setLoading(btn, false, 'Añadir nota');
  }
}

/**
 * Inserta una nota provisional al inicio del timeline con opacidad reducida
 * mientras se confirma en el servidor.
 *
 * @param {string} contenido
 * @returns {HTMLElement} El elemento insertado (para revertir si falla)
 */
function prependarNotaOptimista(contenido) {
  const timeline = document.getElementById('notesTimeline');

  // Si el timeline tiene el "Sin notas" placeholder, limpiarlo
  if (timeline.querySelector('div[style]')) timeline.innerHTML = '';

  const usuarioNombre = JSON.parse(sessionStorage.getItem('usuario') || '{}').nombre ?? 'Tú';

  const noteEl = document.createElement('div');
  noteEl.className   = 'note-item';
  noteEl.style.opacity = '0.5'; // semi-transparente hasta confirmación
  noteEl.innerHTML   = `
    <div class="note-dot"></div>
    <div class="note-body">
      <div class="note-meta">
        <span class="note-author">${escapeHtml(usuarioNombre)}</span>
        <span class="note-date">Ahora mismo</span>
      </div>
      <p class="note-content">${escapeHtml(contenido)}</p>
    </div>`;

  timeline.prepend(noteEl);
  return noteEl;
}

async function eliminarNota(notaId) {
  try {
    await apiCall(`api/notas.php?id=${notaId}`, 'DELETE');
    showToast('Nota eliminada.', 'success');
    loadNotas();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ── Modal editar cliente ──────────────────────────────────────────────────

function initModalEditar() {
  document.getElementById('btnEditar').addEventListener('click', abrirModalEditar);
  document.getElementById('btnEditarClose').addEventListener('click', cerrarModalEditar);
  document.getElementById('btnEditarCancelar').addEventListener('click', cerrarModalEditar);
  document.getElementById('modalEditarOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalEditar();
  });
  document.getElementById('btnEditarGuardar').addEventListener('click', guardarEdicion);
}

function abrirModalEditar() {
  const c = clienteData; // CAMBIO: variable de módulo
  if (!c) return;

  document.getElementById('editId').value       = c.id;
  document.getElementById('editNombre').value   = c.nombre    || '';
  document.getElementById('editEmpresa').value  = c.empresa   || '';
  document.getElementById('editEmail').value    = c.email     || '';
  document.getElementById('editTelefono').value = c.telefono  || '';
  document.getElementById('editEstado').value   = c.estado;
  document.getElementById('editValor').value    = c.valor_estimado || 0;

  document.getElementById('modalEditarOverlay').classList.add('open');
  document.getElementById('editNombre').focus();
}

function cerrarModalEditar() {
  document.getElementById('modalEditarOverlay').classList.remove('open');
}

async function guardarEdicion() {
  const nombre = document.getElementById('editNombre').value.trim();

  if (!nombre) {
    showToast('El nombre es obligatorio.', 'error');
    document.getElementById('editNombre').focus();
    return;
  }

  const payload = {
    id:             clienteId,
    nombre,
    empresa:        document.getElementById('editEmpresa').value.trim(),
    email:          document.getElementById('editEmail').value.trim(),
    telefono:       document.getElementById('editTelefono').value.trim(),
    estado:         document.getElementById('editEstado').value,
    valor_estimado: parseFloat(document.getElementById('editValor').value) || 0,
  };

  const btn = document.getElementById('btnEditarGuardar');
  setLoading(btn, true, 'Guardar cambios', '⏳ Guardando…');

  try {
    await apiCall('api/clientes.php', 'PUT', payload);
    showToast('Cliente actualizado.', 'success');
    cerrarModalEditar();
    loadCliente(); // Refrescar ficha
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    setLoading(btn, false, 'Guardar cambios');
  }
}

// ── Modal eliminar cliente ────────────────────────────────────────────────

function initModalDelete() {
  document.getElementById('btnEliminar').addEventListener('click', () => {
    document.getElementById('modalDeleteOverlay').classList.add('open');
  });
  document.getElementById('btnDeleteClose').addEventListener('click',    cerrarModalDelete);
  document.getElementById('btnDeleteCancelar').addEventListener('click', cerrarModalDelete);
  document.getElementById('modalDeleteOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalDelete();
  });
  document.getElementById('btnDeleteConfirmar').addEventListener('click', eliminarCliente);
}

function cerrarModalDelete() {
  document.getElementById('modalDeleteOverlay').classList.remove('open');
}

async function eliminarCliente() {
  const btn = document.getElementById('btnDeleteConfirmar');
  setLoading(btn, true, 'Sí, eliminar', '⏳ Eliminando…');

  try {
    await apiCall(`api/clientes.php?id=${clienteId}`, 'DELETE');
    showToast('Cliente eliminado. Redirigiendo…', 'success');
    setTimeout(() => window.location.href = 'clientes.html', 1200);
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    setLoading(btn, false, 'Sí, eliminar');
  }
}
