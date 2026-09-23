<?php

require_once __DIR__ . '/../../config/database.php';
enforceRateLimit('reset', 5, 3600);

$data = requestData();
if (requiredFields($data, ['email'])) {
    jsonResponse(['error' => 'Adresse e-mail obligatoire.'], 400);
}

$email = strtolower(trim($data['email']));
$userQuery = $pdo->prepare('SELECT id FROM users WHERE email = ? AND is_active = TRUE');
$userQuery->execute([$email]);
$user = $userQuery->fetch();

if ($user) {
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = (new DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:s');
    $pdo->prepare('DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < NOW()')->execute([$user['id']]);
    $insert = $pdo->prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)');
    $insert->execute([$user['id'], $tokenHash, $expiresAt]);
    $baseUrl = rtrim(getenv('APP_URL') ?: 'http://localhost/Vite-et-Gourmand', '/');
    $link = $baseUrl . '/connexion.html?reset_token=' . urlencode($token);
    @mail($email, 'Réinitialisation de votre mot de passe', "Utilisez ce lien pendant une heure :\n\n$link");
}

jsonResponse(['message' => 'Si un compte correspond à cette adresse, un lien sera envoyé.']);
