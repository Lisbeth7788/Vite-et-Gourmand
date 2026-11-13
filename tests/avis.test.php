<?php

require_once __DIR__ . '/../config/avis.php';

class PdoSqliteAvis extends PDO
{
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return parent::prepare(preg_replace('/ FOR UPDATE$/', '', $query), $options);
    }
}

function verifier(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$pdo = new PdoSqliteAvis('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE orders (id TEXT PRIMARY KEY, user_id TEXT, status TEXT, created_at TEXT)');
$pdo->exec("CREATE TABLE reviews (id INTEGER PRIMARY KEY, user_id TEXT, order_id TEXT, rating INTEGER, comment TEXT, status TEXT DEFAULT 'pending')");
$pdo->exec("INSERT INTO orders VALUES ('ancienne', 'client', 'completed', '2026-01-01'), ('recente', 'client', 'completed', '2026-02-01'), ('en-attente', 'client', 'pending', '2026-03-01'), ('autre-client', 'autre', 'completed', '2026-04-01')");

$pdo->beginTransaction();
enregistrerAvis($pdo, 'client', 'ancienne', 5, 'Très bien');
$pdo->commit();
verifier($pdo->query('SELECT order_id FROM reviews')->fetchColumn() === 'ancienne', 'L’avis doit être lié à la réservation choisie, pas à la plus récente.');
verifier($pdo->query('SELECT status FROM reviews')->fetchColumn() === 'pending', 'Un nouvel avis doit attendre la validation.');

foreach (['ancienne', 'en-attente', 'autre-client', 'inconnue'] as $reservation) {
    $pdo->beginTransaction();
    try {
        enregistrerAvis($pdo, 'client', $reservation, 4, 'Test');
        throw new LogicException('Cette réservation ne devrait pas accepter un avis.');
    } catch (DomainException $erreur) {
        $pdo->rollBack();
    }
}

$pdo->beginTransaction();
enregistrerAvis($pdo, 'client', null, 4, 'Bien');
$pdo->commit();
verifier($pdo->query('SELECT order_id FROM reviews ORDER BY id DESC')->fetchColumn() === 'recente', 'Sans réservation précisée, la dernière réservation éligible doit être utilisée.');
verifier((int) $pdo->query('SELECT COUNT(*) FROM reviews')->fetchColumn() === 2, 'Les tentatives refusées ne doivent pas créer d’avis.');

echo "Avis des réservations vérifiés.\n";
