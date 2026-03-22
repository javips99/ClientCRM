<?php
/**
 * auth.php — Autenticación de usuarios
 *
 * GET  ?action=check   → devuelve estado de sesión actual
 * POST ?action=login   → inicia sesión (email + password)
 * POST ?action=logout  → cierra sesión
 */

require_once 'config.php';
require_once 'helpers.php';

header('Content-Type: application/json');

session_start(); // helpers.php ya configuró los flags de la cookie

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check':
        handleCheck();
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Acción no válida']);
}

// ── Handlers ──────────────────────────────────────────────────

function handleLogin(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        return;
    }

    $data     = json_decode(file_get_contents('php://input'), true) ?? [];
    $email    = trim($data['email']    ?? '');
    $password =       $data['password'] ?? '';

    // Validación básica de inputs
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son obligatorios']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de email no válido']);
        return;
    }

    try {
        $pdo  = getDB();
        $stmt = $pdo->prepare(
            'SELECT id, nombre, email, password_hash FROM usuarios WHERE email = ?'
        );
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        // Comparación de tiempo constante para evitar timing attacks
        if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales incorrectas']);
            return;
        }

        // Regenerar ID de sesión previene session fixation
        session_regenerate_id(true);

        $_SESSION['usuario_id']     = $usuario['id'];
        $_SESSION['usuario_nombre'] = $usuario['nombre'];
        $_SESSION['usuario_email']  = $usuario['email'];

        echo json_encode([
            'ok'      => true,
            'usuario' => [
                'id'     => $usuario['id'],
                'nombre' => $usuario['nombre'],
                'email'  => $usuario['email'],
            ],
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error interno del servidor']);
    }
}

function handleLogout(): void {
    $_SESSION = [];

    // Destruir la cookie de sesión si existe
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']
        );
    }

    session_destroy();
    echo json_encode(['ok' => true]);
}

function handleCheck(): void {
    if (isset($_SESSION['usuario_id'])) {
        echo json_encode([
            'autenticado' => true,
            'usuario'     => [
                'id'     => $_SESSION['usuario_id'],
                'nombre' => $_SESSION['usuario_nombre'],
                'email'  => $_SESSION['usuario_email'],
            ],
        ]);
    } else {
        echo json_encode(['autenticado' => false]);
    }
}
