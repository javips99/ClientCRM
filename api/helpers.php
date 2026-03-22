<?php
/**
 * helpers.php — Funciones compartidas por todos los endpoints
 *
 * Incluir con: require_once 'helpers.php';
 * (Siempre DESPUÉS de require_once 'config.php')
 *
 * Al incluir este archivo se configuran automáticamente los flags
 * de seguridad de la cookie de sesión.
 */

/** Estados de cliente válidos. Usada en validación y filtrado. */
const VALID_ESTADOS = ['caliente', 'tibio', 'frio', 'ganado'];

// Configurar cookie de sesión segura ANTES de cualquier session_start()
// Este bloque se ejecuta una sola vez gracias a require_once.
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Strict',
]);

/**
 * Verifica que exista una sesión PHP activa.
 * Si no la hay, devuelve 401 y termina la ejecución.
 */
function requireAuth(): void {
    if (empty($_SESSION['usuario_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit;
    }
}

/**
 * Decodifica el body JSON de la petición.
 * Devuelve array vacío si el body no es JSON válido.
 *
 * @return array
 */
function getJsonInput(): array {
    return (array) (json_decode(file_get_contents('php://input'), true) ?? []);
}

/**
 * Envía una respuesta JSON con el código HTTP indicado y termina.
 *
 * @param mixed $data
 * @param int   $code
 */
function jsonResponse(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}
