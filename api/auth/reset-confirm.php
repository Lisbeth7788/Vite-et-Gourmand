<?php

require_once __DIR__ . '/../../config/database.php';
enforceRateLimit('reset-confirm', 5, 3600);

$data = requestData();
if (requiredFields($data, ['token', 'password'])) {
    jsonResponse(['error' => 'Jeton et nouveau mot de passe obligatoires.'], 400);
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/', (string) $data['password'])) {
    jsonResponse(['error' => 'Le mot de passe doit contenir 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'], 400);
}

$tokenHash = hash('sha256', (string) $data['token']);
$query = $pdo->prepare(
    'SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()'
);
$query->execute([$tokenHash]);
$token = $query->fetch();
if (!$token) {
    jsonResponse(['error' => 'Le lien est invalide ou expiré.'], 400);
}

$pdo->beginTransaction();
$updateUser = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
$updateUser->execute([password_hash($data['password'], PASSWORD_DEFAULT), $token['user_id']]);
$useToken = $pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?');
$useToken->execute([$token['id']]);
$pdo->commit();

jsonResponse(['message' => 'Mot de passe réinitialisé.']);