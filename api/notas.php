<?php
/**
 * notas.php — CRUD de notas de actividad
 *
 * GET  ?cliente_id=X  → lista notas de un cliente
 * POST               → crea una nota  (body JSON: cliente_id, contenido)
 * DELETE ?id=X       → elimina una nota
 *
 * Todos los endpoints verifican que el cliente pertenezca al usuario de sesión.
 */

require_once 'config.php';
require_once 'helpers.php'; // CAMBIO: requireAuth() centralizada

header('Content-Type: application/json');

session_start(); // helpers.php ya configuró los flags de la cookie
requireAuth();

$method    = $_SERVER['REQUEST_METHOD'];
$id        = isset($_GET['id'])         ? intval($_GET['id'])         : null;
$clienteId = isset($_GET['cliente_id']) ? intval($_GET['cliente_id']) : null;

switch ($method) {
    case 'GET':
        getNotas($clienteId);
        break;
    case 'POST':
        crearNota();
        break;
    case 'DELETE':
        eliminarNota($id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Verifica que un cliente exista y pertenezca al usuario de sesión.
 * Devuelve false y emite 403 si no pasa la verificación.
 */
function verificarPropiedadCliente(PDO $pdo, int $clienteId): bool {
    $userId = $_SESSION['usuario_id'];
    $stmt   = $pdo->prepare('SELECT id FROM clientes WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$clienteId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso denegado']);
        return false;
    }
    return true;
}

// ── Handlers ──────────────────────────────────────────────────

function getNotas(?int $clienteId): void {
    if (!$clienteId) {
        http_response_code(400);
        echo json_encode(['error' => 'cliente_id es obligatorio']);
        return;
    }

    $pdo = getDB();
    if (!verificarPropiedadCliente($pdo, $clienteId)) return;

    $stmt = $pdo->prepare(
        'SELECT n.id, n.contenido, n.creado_en, u.nombre AS autor
         FROM notas n
         JOIN usuarios u ON u.id = n.usuario_id
         WHERE n.cliente_id = ?
         ORDER BY n.creado_en DESC'
    );
    $stmt->execute([$clienteId]);
    echo json_encode($stmt->fetchAll());
}

function crearNota(): void {
    $data      = json_decode(file_get_contents('php://input'), true) ?? [];
    $clienteId = isset($data['cliente_id']) ? intval($data['cliente_id']) : 0;
    $contenido = trim($data['contenido']    ?? '');

    if (!$clienteId || empty($contenido)) {
        http_response_code(400);
        echo json_encode(['error' => 'cliente_id y contenido son obligatorios']);
        return;
    }

    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    if (!verificarPropiedadCliente($pdo, $clienteId)) return;

    $stmt = $pdo->prepare(
        'INSERT INTO notas (cliente_id, usuario_id, contenido) VALUES (?, ?, ?)'
    );
    $stmt->execute([$clienteId, $userId, $contenido]);

    http_response_code(201);
    echo json_encode(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
}

function eliminarNota(?int $id): void {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID requerido']);
        return;
    }

    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    // JOIN con clientes para verificar propiedad en una sola query
    $stmt = $pdo->prepare(
        'DELETE n FROM notas n
         JOIN clientes c ON c.id = n.cliente_id
         WHERE n.id = ? AND c.usuario_id = ?'
    );
    $stmt->execute([$id, $userId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Nota no encontrada']);
        return;
    }

    echo json_encode(['ok' => true]);
}
