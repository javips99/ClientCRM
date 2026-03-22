<?php
/**
 * config.example.php — Plantilla de configuración
 *
 * Copia este archivo a config.php y rellena tus valores.
 * config.php está en .gitignore y NUNCA debe subirse a GitHub.
 */

define('DB_HOST',    'localhost');       // Host del servidor MySQL
define('DB_NAME',    'clientcrm');      // Nombre de la base de datos
define('DB_USER',    'tu_usuario');     // Usuario MySQL
define('DB_PASS',    'tu_contraseña');  // Contraseña MySQL
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}
