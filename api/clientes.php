<?php
/**
 * clientes.php — CRUD de clientes
 *
 * GET               → lista clientes (filtros: ?estado=X &q=busqueda)
 * GET  ?id=X        → obtiene un cliente
 * POST              → crea un cliente  (body JSON)
 * PUT               → actualiza        (body JSON con id)
 * DELETE ?id=X      → elimina un cliente
 *
 * Todos los endpoints requieren sesión activa.
 * Los clientes están aislados por usuario_id de sesión.
 */

require_once 'config.php';
require_once 'helpers.php'; // CAMBIO: requireAuth() y getJsonInput() centralizados

header('Content-Type: application/json');

session_start(); // helpers.php ya configuró los flags de la cookie
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        $id ? getCliente($id) : getClientes();
        break;
    case 'POST':
        crearCliente();
        break;
    case 'PUT':
        actualizarCliente();
        break;
    case 'DELETE':
        eliminarCliente($id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}

// ── Handlers ──────────────────────────────────────────────────

function getClientes(): void {
    $pdo      = getDB();
    $userId   = $_SESSION['usuario_id'];
    $estado   = $_GET['estado'] ?? '';
    $busqueda = trim($_GET['q'] ?? '');

    $sql    = 'SELECT id, nombre, empresa, email, telefono, estado, valor_estimado, creado_en
               FROM clientes WHERE usuario_id = ?';
    $params = [$userId];

    if ($estado && in_array($estado, VALID_ESTADOS, true)) { // CAMBIO: constante centralizada
        $sql     .= ' AND estado = ?';
        $params[] = $estado;
    }

    if ($busqueda !== '') {
        $sql     .= ' AND (nombre LIKE ? OR empresa LIKE ? OR email LIKE ?)';
        $like     = "%{$busqueda}%";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    // CAMBIO: paginación básica para evitar cargar miles de registros de golpe
    $limite = min(intval($_GET['limit'] ?? 200), 500); // máximo 500
    $offset = max(intval($_GET['offset'] ?? 0), 0);

    $sql     .= ' ORDER BY creado_en DESC LIMIT ? OFFSET ?';
    $params[] = $limite;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
}

function getCliente(int $id): void {
    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$id, $userId]);
    $cliente = $stmt->fetch();

    if (!$cliente) {
        http_response_code(404);
        echo json_encode(['error' => 'Cliente no encontrado']);
        return;
    }

    echo json_encode($cliente);
}

function crearCliente(): void {
    $data    = getJsonInput();
    $errores = validarCliente($data);

    if ($errores) {
        http_response_code(422);
        echo json_encode(['error' => implode('. ', $errores)]);
        return;
    }

    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    $stmt = $pdo->prepare(
        'INSERT INTO clientes (nombre, empresa, email, telefono, estado, valor_estimado, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        trim($data['nombre']),
        trim($data['empresa']        ?? ''),
        trim($data['email']          ?? ''),
        trim($data['telefono']       ?? ''),
        $data['estado'],
        max(0, floatval($data['valor_estimado'] ?? 0)),
        $userId,
    ]);

    http_response_code(201);
    echo json_encode(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
}

function actualizarCliente(): void {
    $data = getJsonInput();
    $id   = isset($data['id']) ? intval($data['id']) : 0;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID requerido']);
        return;
    }

    $errores = validarCliente($data);
    if ($errores) {
        http_response_code(422);
        echo json_encode(['error' => implode('. ', $errores)]);
        return;
    }

    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    $stmt = $pdo->prepare(
        'UPDATE clientes
         SET nombre=?, empresa=?, email=?, telefono=?, estado=?, valor_estimado=?
         WHERE id=? AND usuario_id=?'
    );
    $stmt->execute([
        trim($data['nombre']),
        trim($data['empresa']        ?? ''),
        trim($data['email']          ?? ''),
        trim($data['telefono']       ?? ''),
        $data['estado'],
        max(0, floatval($data['valor_estimado'] ?? 0)),
        $id,
        $userId,
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Cliente no encontrado']);
        return;
    }

    echo json_encode(['ok' => true]);
}

function eliminarCliente(?int $id): void {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID requerido']);
        return;
    }

    $pdo    = getDB();
    $userId = $_SESSION['usuario_id'];

    $stmt = $pdo->prepare('DELETE FROM clientes WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$id, $userId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Cliente no encontrado']);
        return;
    }

    echo json_encode(['ok' => true]);
}

// ── Helpers ───────────────────────────────────────────────────

// CAMBIO: getJsonInput() movida a helpers.php

/**
 * Valida los campos de un cliente.
 *
 * @param  array    $data  Datos del cliente
 * @return string[]        Lista de errores (vacía = válido)
 */
function validarCliente(array $data): array {
    $errores = [];

    if (empty(trim($data['nombre'] ?? ''))) {
        $errores[] = 'El nombre es obligatorio';
    } elseif (mb_strlen(trim($data['nombre'])) > 150) {
        $errores[] = 'El nombre no puede superar 150 caracteres';
    }

    if (!in_array($data['estado'] ?? '', VALID_ESTADOS, true)) { // CAMBIO: constante centralizada
        $errores[] = 'Estado no válido (caliente, tibio, frio, ganado)';
    }

    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'Formato de email no válido';
    }

    if (isset($data['valor_estimado']) && !is_numeric($data['valor_estimado'])) {
        $errores[] = 'El valor estimado debe ser numérico';
    }

    return $errores;
}
