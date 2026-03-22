<?php
/**
 * bootstrap.php — Entorno de tests PHPUnit para ClientCRM
 *
 * Define stubs de las funciones de infraestructura (DB, sesión)
 * para poder testear la lógica de negocio de forma aislada.
 */

// Definir constante que indica que estamos en modo test
define('TESTING', true);

// ── Constantes y funciones de helpers.php ────────────────────────────────
// Las cargamos directamente para testear VALID_ESTADOS y helpers

const VALID_ESTADOS = ['caliente', 'tibio', 'frio', 'ganado'];

function requireAuth(): void {
    if (empty($_SESSION['usuario_id'] ?? null)) {
        throw new \RuntimeException('No autenticado', 401);
    }
}

function getJsonInput(): array {
    return (array) (json_decode(file_get_contents('php://input'), true) ?? []);
}

// ── Stub PDO ─────────────────────────────────────────────────────────────
// getDB() devuelve un stub configurable en cada test

$GLOBALS['_mockPDO'] = null;

function getDB(): PDO {
    if ($GLOBALS['_mockPDO'] === null) {
        throw new \PDOException('getDB() no mockeado en este test');
    }
    return $GLOBALS['_mockPDO'];
}

// ── Función validarCliente extraída de api/clientes.php ──────────────────
// Copiada para tests aislados. Si cambia en clientes.php, actualizar aquí.

/**
 * @param  array    $data
 * @return string[]
 */
function validarCliente(array $data): array {
    $errores = [];

    if (empty(trim($data['nombre'] ?? ''))) {
        $errores[] = 'El nombre es obligatorio';
    } elseif (mb_strlen(trim($data['nombre'])) > 150) {
        $errores[] = 'El nombre no puede superar 150 caracteres';
    }

    if (!in_array($data['estado'] ?? '', VALID_ESTADOS, true)) {
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
