<?php

require_once __DIR__ . '/../../config/database.php';
$user = requireRole(['employe', 'admin']);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$pdo->exec('CREATE TABLE IF NOT EXISTS team_planning (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    data LONGTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

if ($method === 'GET') {
    $row = $pdo->query('SELECT data, updated_at FROM team_planning WHERE id = 1')->fetch();
    jsonResponse(['planning' => $row ? json_decode($row['data'], true) : null, 'updatedAt' => $row['updated_at'] ?? null]);
}

if ($method !== 'POST' && $method !== 'PUT') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}
if ($user['role'] !== 'admin') {
    jsonResponse(['error' => 'Seul l’administrateur peut modifier le planning.'], 403);
}

$data = requestData();
$equipe = $data['equipe'] ?? null;
if (!is_array($equipe) || count($equipe) === 0 || count($equipe) > 40) {
    jsonResponse(['error' => 'Planning invalide.'], 400);
}

$propre = [];
foreach ($equipe as $p) {
    $nom = trim((string) ($p['nom'] ?? ''));
    $poste = trim((string) ($p['poste'] ?? ''));
    $semaines = $p['semaines'] ?? null;
    if ($nom === '' || mb_strlen($nom) > 40 || $poste === '' || mb_strlen($poste) > 40 || !is_array($semaines) || count($semaines) !== 2) {
        jsonResponse(['error' => 'Planning invalide.'], 400);
    }
    $lignes = [];
    foreach ($semaines as $semaine) {
        if (!is_array($semaine) || count($semaine) !== 7) {
            jsonResponse(['error' => 'Planning invalide.'], 400);
        }
        $lignes[] = array_map(fn ($v) => (bool) $v, array_values($semaine));
    }
    $propre[] = ['nom' => $nom, 'poste' => $poste, 'toujours' => !empty($p['toujours']), 'semaines' => $lignes];
}

$save = $pdo->prepare('INSERT INTO team_planning (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)');
$save->execute([json_encode(['equipe' => $propre], JSON_UNESCAPED_UNICODE)]);
jsonResponse(['message' => 'Planning enregistré.']);
