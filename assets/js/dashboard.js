/**
 * dashboard.js — Lógica del panel principal
 *
 * Carga métricas desde api/dashboard.php y renderiza:
 *   - 4 tarjetas de estadísticas
 *   - Gráfico de dona (distribución por estado)
 *   - Tabla de últimos 5 clientes
 */

let chartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // CAMBIO: esperar a que auth.js confirme la sesión antes de cargar datos
  await authReady;
  loadDashboard();
});

// ── Carga principal ───────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    const data = await apiCall('api/dashboard.php');
    renderStats(data.metricas);
    renderChart(data.metricas.distribucion);
    renderRecientes(data.recientes);
  } catch (err) {
    showToast('Error al cargar el dashboard: ' + err.message, 'error');
  }
}

// ── Tarjetas de métricas ──────────────────────────────────────────────────

function renderStats(m) {
  document.getElementById('statTotal').textContent   = m.total_clientes;
  document.getElementById('statActivas').textContent = m.oportunidades_activas;
  document.getElementById('statGanadas').textContent = m.ventas_ganadas;
  document.getElementById('statPipeline').textContent = formatCurrency(m.valor_pipeline);
}

// ── Gráfico de dona ───────────────────────────────────────────────────────

function renderChart(dist) {
  const ctx = document.getElementById('chartEstados');
  if (!ctx) return;

  const labels = ['Caliente', 'Tibio', 'Frío', 'Ganado'];
  const values = [dist.caliente, dist.tibio, dist.frio, dist.ganado];
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  // Destruir instancia previa si existe (HMR / recarga)
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + '33'), // con transparencia
        borderColor:     colors,
        borderWidth:     2,
        hoverOffset:     6,
      }],
    },
    options: {
      responsive:       true,
      maintainAspectRatio: false,
      cutout:           '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} clientes`,
          },
        },
      },
    },
  });

  // Leyenda personalizada con colores del tema
  const legend = document.getElementById('chartLegend');
  if (!legend) return;
  legend.innerHTML = labels.map((l, i) => `
    <div style="display:flex; align-items:center; gap:0.4rem;">
      <span style="width:10px; height:10px; border-radius:50%; background:${colors[i]}; flex-shrink:0;"></span>
      <span style="color:var(--text-muted)">${l}:</span>
      <strong>${values[i]}</strong>
    </div>
  `).join('');
}

// ── Tabla de recientes ────────────────────────────────────────────────────

function renderRecientes(clientes) {
  const tbody = document.getElementById('tbodyRecientes');

  if (!clientes || clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>Sin clientes todavía. <a href="clientes.html">Añade el primero</a></p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>
        <a href="cliente-detalle.html?id=${c.id}" style="color:var(--text); text-decoration:none;">
          <div class="td-name">${escapeHtml(c.nombre)}</div>
          <div class="td-company">${escapeHtml(c.empresa || '—')}</div>
        </a>
      </td>
      <td>${estadoBadge(c.estado)}</td>
      <td class="text-right" style="font-weight:600;">${formatCurrency(c.valor_estimado)}</td>
    </tr>
  `).join('');
}
