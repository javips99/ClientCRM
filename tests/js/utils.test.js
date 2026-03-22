/**
 * utils.test.js — Tests para assets/js/utils.js
 *
 * Cubre: escapeHtml, formatDate, formatCurrency, estadoBadge, showToast, apiCall, setLoading
 *
 * Categorías:
 *   [HP]  Happy Path    — flujo normal funciona correctamente
 *   [EC]  Edge Cases    — inputs límite, vacíos, especiales
 *   [ERR] Error Handling — fallos controlados
 *   [MCK] Mocks         — fetch y DOM simulados
 */

// ════════════════════════════════════════════════════════════════
// escapeHtml
// ════════════════════════════════════════════════════════════════
describe('escapeHtml', () => {

  // ── Happy Path ─────────────────────────────────────────────
  test('[HP] deberia_devolver_texto_sin_caracteres_especiales_intacto', () => {
    expect(escapeHtml('Hola mundo')).toBe('Hola mundo');
  });

  test('[HP] deberia_escapar_etiqueta_script_completa', () => {
    const resultado = escapeHtml('<script>alert("xss")</script>');
    expect(resultado).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    // Verificar que el resultado no puede ejecutarse como HTML
    expect(resultado).not.toContain('<script>');
  });

  // ── Edge Cases ─────────────────────────────────────────────
  test('[EC] deberia_devolver_cadena_vacia_cuando_recibe_null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  test('[EC] deberia_devolver_cadena_vacia_cuando_recibe_undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  test('[EC] deberia_escapar_ampersand_en_texto', () => {
    expect(escapeHtml('Café & Bar')).toBe('Café &amp; Bar');
  });

  test('[EC] deberia_escapar_comilla_simple_para_prevenir_XSS_en_atributos', () => {
    expect(escapeHtml("O'Brien")).toBe('O&#39;Brien');
  });

  test('[EC] deberia_convertir_numero_a_cadena_y_devolverlo', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  // ── Error Handling ─────────────────────────────────────────
  test('[ERR] deberia_manejar_objeto_convirtiendolo_a_string', () => {
    // No lanza excepción, convierte a "[object Object]"
    expect(() => escapeHtml({})).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════
// formatCurrency
// ════════════════════════════════════════════════════════════════
describe('formatCurrency', () => {

  // ── Happy Path ─────────────────────────────────────────────
  test('[HP] deberia_formatear_12500_con_separador_de_miles_y_simbolo_euro', () => {
    const resultado = formatCurrency(12500);
    expect(resultado).toContain('12');
    expect(resultado).toContain('500');
    expect(resultado).toContain('€');
  });

  test('[HP] deberia_formatear_0_como_cero_con_simbolo_euro', () => {
    const resultado = formatCurrency(0);
    expect(resultado).toContain('€');
    expect(resultado).toMatch(/0/);
  });

  // ── Edge Cases ─────────────────────────────────────────────
  test('[EC] deberia_formatear_null_como_0_euros', () => {
    const resultado = formatCurrency(null);
    expect(resultado).toContain('€');
    expect(resultado).toMatch(/0/);
  });

  test('[EC] deberia_formatear_valor_negativo_con_signo_menos', () => {
    const resultado = formatCurrency(-500);
    expect(resultado).toContain('-');
    expect(resultado).toContain('€');
  });

  test('[EC] deberia_formatear_numero_con_decimales_correctamente', () => {
    const resultado = formatCurrency(1234.56);
    expect(resultado).toContain('€');
    expect(resultado).toMatch(/1\.234|1,234/); // acepta formato ES o EN
  });
});

// ════════════════════════════════════════════════════════════════
// formatDate
// ════════════════════════════════════════════════════════════════
describe('formatDate', () => {

  // ── Happy Path ─────────────────────────────────────────────
  test('[HP] deberia_formatear_fecha_MySQL_a_formato_legible_en_espanol', () => {
    const resultado = formatDate('2026-03-22 14:30:00');
    // Debe contener el año
    expect(resultado).toContain('2026');
    // No debe devolver la cadena original de MySQL
    expect(resultado).not.toBe('2026-03-22 14:30:00');
  });

  // ── Edge Cases ─────────────────────────────────────────────
  test('[EC] deberia_devolver_guion_cuando_recibe_cadena_vacia', () => {
    expect(formatDate('')).toBe('—');
  });

  test('[EC] deberia_devolver_guion_cuando_recibe_null', () => {
    expect(formatDate(null)).toBe('—');
  });

  test('[EC] deberia_devolver_la_cadena_original_si_la_fecha_no_es_valida', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha');
  });

  // ── Error Handling ─────────────────────────────────────────
  test('[ERR] deberia_no_lanzar_excepcion_con_formato_inesperado', () => {
    expect(() => formatDate('2026/01/01')).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════
// estadoBadge
// ════════════════════════════════════════════════════════════════
describe('estadoBadge', () => {

  // ── Happy Path ─────────────────────────────────────────────
  test('[HP] deberia_generar_badge_caliente_con_clase_correcta', () => {
    const html = estadoBadge('caliente');
    expect(html).toContain('badge-caliente');
    expect(html).toContain('Caliente');
  });

  test('[HP] deberia_generar_badge_ganado_con_clase_correcta', () => {
    const html = estadoBadge('ganado');
    expect(html).toContain('badge-ganado');
    expect(html).toContain('Ganado');
  });

  test('[HP] deberia_generar_badge_frio_con_acento_en_la_etiqueta', () => {
    const html = estadoBadge('frio');
    expect(html).toContain('Frío');
  });

  // ── Edge Cases ─────────────────────────────────────────────
  test('[EC] deberia_escapar_estado_desconocido_para_prevenir_XSS', () => {
    const html = estadoBadge('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });

  test('[EC] deberia_usar_el_estado_como_fallback_si_no_tiene_etiqueta', () => {
    const html = estadoBadge('desconocido');
    expect(html).toContain('desconocido');
  });
});

// ════════════════════════════════════════════════════════════════
// apiCall — con mock de fetch
// ════════════════════════════════════════════════════════════════
describe('apiCall', () => {

  // ── Happy Path ─────────────────────────────────────────────
  test('[HP] deberia_devolver_datos_JSON_cuando_el_servidor_responde_200', async () => {
    fetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ ok: true, id: 42 }),
    });

    const data = await apiCall('api/clientes.php', 'POST', { nombre: 'Test' });
    expect(data).toEqual({ ok: true, id: 42 });
  });

  test('[HP] deberia_enviar_metodo_y_body_JSON_correctamente_en_POST', async () => {
    fetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ ok: true }),
    });

    await apiCall('api/notas.php', 'POST', { cliente_id: 1, contenido: 'Nota test' });

    expect(fetch).toHaveBeenCalledWith('api/notas.php', expect.objectContaining({
      method:  'POST',
      body:    JSON.stringify({ cliente_id: 1, contenido: 'Nota test' }),
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  // ── Mocks ──────────────────────────────────────────────────
  test('[MCK] deberia_incluir_credentials_same_origin_para_enviar_cookies_de_sesion', async () => {
    fetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({}),
    });

    await apiCall('api/dashboard.php');

    expect(fetch).toHaveBeenCalledWith('api/dashboard.php', expect.objectContaining({
      credentials: 'same-origin',
    }));
  });

  test('[MCK] deberia_NO_enviar_body_en_peticion_GET', async () => {
    fetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ([]),
    });

    await apiCall('api/clientes.php', 'GET');

    const opciones = fetch.mock.calls[0][1];
    expect(opciones.body).toBeNull();
  });

  // ── Error Handling ─────────────────────────────────────────
  test('[ERR] deberia_lanzar_Error_con_mensaje_del_servidor_cuando_respuesta_es_401', async () => {
    fetch.mockResolvedValueOnce({
      ok:   false,
      json: async () => ({ error: 'No autenticado' }),
    });

    await expect(apiCall('api/clientes.php')).rejects.toThrow('No autenticado');
  });

  test('[ERR] deberia_lanzar_Error_generico_cuando_el_servidor_no_devuelve_JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok:   false,
      json: async () => { throw new SyntaxError('not json'); },
    });

    await expect(apiCall('api/clientes.php')).rejects.toThrow();
  });

  test('[ERR] deberia_propagar_error_de_red_cuando_fetch_rechaza', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiCall('api/clientes.php')).rejects.toThrow('Failed to fetch');
  });
});

// ════════════════════════════════════════════════════════════════
// showToast
// ════════════════════════════════════════════════════════════════
describe('showToast', () => {

  // ── Mocks / DOM ────────────────────────────────────────────
  test('[MCK] deberia_crear_elemento_toast_en_el_contenedor', () => {
    showToast('Operación exitosa', 'success');
    const toasts = document.querySelectorAll('.toast');
    expect(toasts.length).toBeGreaterThan(0);
  });

  test('[MCK] deberia_aplicar_clase_toast_error_cuando_tipo_es_error', () => {
    showToast('Algo salió mal', 'error');
    const toast = document.querySelector('.toast-error');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Algo salió mal');
  });

  // ── Edge Cases ─────────────────────────────────────────────
  test('[EC] deberia_no_lanzar_excepcion_si_el_contenedor_no_existe_en_el_DOM', () => {
    // Eliminar el contenedor temporalmente
    const container = document.getElementById('toastContainer');
    container.remove();
    expect(() => showToast('test')).not.toThrow();
    // Restaurar para tests posteriores
    document.body.insertAdjacentHTML('beforeend', '<div id="toastContainer"></div>');
  });
});

// ════════════════════════════════════════════════════════════════
// setLoading
// ════════════════════════════════════════════════════════════════
describe('setLoading', () => {

  let btn;
  beforeEach(() => {
    btn = document.createElement('button');
    btn.textContent = 'Guardar';
    document.body.appendChild(btn);
  });
  afterEach(() => btn.remove());

  // ── Happy Path ─────────────────────────────────────────────
  test('[HP] deberia_deshabilitar_boton_y_cambiar_texto_cuando_loading_es_true', () => {
    setLoading(btn, true, 'Guardar', '⏳ Guardando…');
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('⏳ Guardando…');
  });

  test('[HP] deberia_habilitar_boton_y_restaurar_texto_cuando_loading_es_false', () => {
    setLoading(btn, true,  'Guardar', '⏳ Guardando…');
    setLoading(btn, false, 'Guardar');
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('Guardar');
  });

  // ── Edge Cases ─────────────────────────────────────────────
  test('[EC] deberia_usar_texto_por_defecto_si_no_se_proporciona_textoLoading', () => {
    setLoading(btn, true, 'Guardar');
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('⏳ Cargando…');
  });
});
