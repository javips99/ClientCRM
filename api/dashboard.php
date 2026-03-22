<?php
/**
 * dashboard.php — Métricas del panel principal
 *
 * GET → devuelve:
 *   metricas.total_clientes
 *   metricas.oportunidades_activas  (caliente + tibio + frio)
 *   metricas.ventas_ganadas
 *   metricas.valor_pipeline          (valor de oportunidades activas)
 *   metricas.distribucion            (conteo por estado)
 *   recientes                        (últimos 5 clientes)
 *
 * Requiere sesión activa.
 */

require_once 'config.php';
require_once 'helpers.php'; // CAMBIO: requireAuth() centralizada

header('Content-Type: application/json');

session_start(); // helpers.php ya configuró los flags de la cookie
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    // Una sola query para todas las métricas (evita N+1)
    $stmt = $pdo->prepare(
        "SELECT
            COUNT(*)                                                               AS total_clientes,
            SUM(CASE WHEN estado IN ('caliente','tibio','frio') THEN 1 ELSE 0 END) AS oportunidades_activas,
            SUM(CASE WHEN estado = 'ganado'    THEN 1     ELSE 0    END)           AS ventas_ganadas,
            SUM(CASE WHEN estado != 'ganado'   THEN valor_estimado ELSE 0 END)     AS valor_pipeline,
            SUM(CASE WHEN estado = 'caliente'  THEN 1 ELSE 0 END)                  AS n_caliente,
            SUM(CASE WHEN estado = 'tibio'     THEN 1 ELSE 0 END)                  AS n_tibio,
            SUM(CASE WHEN estado = 'frio'      THEN 1 ELSE 0 END)                  AS n_frio,
            SUM(CASE WHEN estado = 'ganado'    THEN 1 ELSE 0 END)                  AS n_ganado
         FROM clientes WHERE usuario_id = ?"
    );
    $stmt->execute([$userId]);
    $m = $stmt->fetch();

    // Últimos 5 clientes para la tabla de actividad reciente
    $stmtR = $pdo->prepare(
        'SELECT id, nombre, empresa, estado, valor_estimado, creado_en
         FROM clientes WHERE usuario_id = ?
         ORDER BY creado_en DESC LIMIT 5'
    );
    $stmtR->execute([$userId]);

    echo json_encode([
        'metricas' => [
            'total_clientes'        => (int)   ($m['total_clientes']        ?? 0),
            'oportunidades_activas' => (int)   ($m['oportunidades_activas'] ?? 0),
            'ventas_ganadas'        => (int)   ($m['ventas_ganadas']        ?? 0),
            'valor_pipeline'        => (float) ($m['valor_pipeline']        ?? 0),
            'distribucion'          => [
                'caliente' => (int) ($m['n_caliente'] ?? 0),
                'tibio'    => (int) ($m['n_tibio']    ?? 0),
                'frio'     => (int) ($m['n_frio']     ?? 0),
                'ganado'   => (int) ($m['n_ganado']   ?? 0),
            ],
        ],
        'recientes' => $stmtR->fetchAll(),
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
