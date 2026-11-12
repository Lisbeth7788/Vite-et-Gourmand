<?php

require_once __DIR__ . '/../config/statistiques.php';

function verifier(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$pdo = new PDO('sqlite::memory:', null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);
$pdo->exec('CREATE TABLE orders (menu_id TEXT, service_date TEXT, total REAL, status TEXT)');
$inserer = $pdo->prepare('INSERT INTO orders (menu_id, service_date, total, status) VALUES (?, ?, ?, ?)');
foreach ([
    ['buffet', '2026-03-01', 100.25, 'pending'],
    ['buffet', '2026-03-10', 25.25, 'completed'],
    ['buffet', '2026-03-10', 500, 'cancelled'],
    ['brunch', '2026-03-05', 60, 'accepted']
] as $commande) {
    $inserer->execute($commande);
}

$statistiques = lireStatistiquesCommandes($pdo, []);
verifier($statistiques === [
    ['menu' => 'buffet', 'orders' => 2, 'revenue' => 125.5],
    ['menu' => 'brunch', 'orders' => 1, 'revenue' => 60.0]
], 'Le regroupement doit exclure les commandes annulées et conserver le format attendu.');

$filtrees = lireStatistiquesCommandes($pdo, [
    'menu' => 'brunch',
    'from' => '2026-03-05',
    'to' => '2026-03-05'
]);
verifier($filtrees === [
    ['menu' => 'brunch', 'orders' => 1, 'revenue' => 60.0]
], 'Les filtres par menu et dates doivent inclure les bornes demandées.');

$apresDate = lireStatistiquesCommandes($pdo, ['from' => '2026-03-10']);
verifier($apresDate === [
    ['menu' => 'buffet', 'orders' => 1, 'revenue' => 25.25]
], 'Le filtre de date doit exclure les commandes hors période et les annulations.');

foreach ([
    ['from' => '2026-02-30'],
    ['from' => '2026-03-10', 'to' => '2026-03-01'],
    ['menu' => ['buffet']]
] as $filtresInvalides) {
    try {
        lireStatistiquesCommandes($pdo, $filtresInvalides);
        throw new RuntimeException('Un filtre invalide aurait dû être refusé.');
    } catch (InvalidArgumentException $error) {
    }
}

echo "Statistiques MySQL vérifiées.\n";
