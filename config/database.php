<?php

$isProduction = (getenv('APP_ENV') ?: 'local') === 'production';

if ($isProduction) {
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
}

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $isProduction || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    ]);
    session_start();
}

$databaseHost = getenv('DB_HOST') ?: '127.0.0.1';
$databaseName = getenv('DB_NAME') ?: 'vite_et_gourmand';
$databaseUser = getenv('DB_USER') ?: 'root';
$databasePassword = getenv('DB_PASSWORD') ?: '';

if ($isProduction && (!$databaseHost || !$databaseName || !$databaseUser || !$databasePassword)) {
    http_response_code(500);
    exit('Configuration de production incomplete.');
}

$pdo = new PDO(
    "mysql:host={$databaseHost};dbname={$databaseName};charset=utf8mb4",
    $databaseUser,
    $databasePassword,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]
);

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestData(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}

function requiredFields(array $data, array $fields): array
{
    return array_values(array_filter($fields, fn ($field) => !isset($data[$field]) || trim((string) $data[$field]) === ''));
}

function validEmail(mixed $email): bool
{
    return is_string($email) && filter_var(trim($email), FILTER_VALIDATE_EMAIL) !== false;
}

function requireRole(array $roles): array
{
    if (!isset($_SESSION['user'])) {
        jsonResponse(['error' => 'Connexion requise.'], 401);
    }

    if (!in_array($_SESSION['user']['role'], $roles, true)) {
        jsonResponse(['error' => 'Vous n’avez pas les droits nécessaires.'], 403);
    }

    return $_SESSION['user'];
}
