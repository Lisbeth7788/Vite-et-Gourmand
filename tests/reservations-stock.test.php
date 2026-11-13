<?php

require_once __DIR__ . '/../config/reservations.php';

class PdoSqliteReservations extends PDO
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

$pdo = new PdoSqliteReservations('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE menus (id TEXT PRIMARY KEY, stock INTEGER NOT NULL)');
$pdo->exec('CREATE TABLE orders (id TEXT PRIMARY KEY, menu_id TEXT NOT NULL, status TEXT NOT NULL, cancellation_reason TEXT, cancellation_contact_method TEXT)');
$pdo->exec('CREATE TABLE order_status_history (order_id TEXT NOT NULL, status TEXT NOT NULL, note TEXT)');
$pdo->exec("INSERT INTO menus VALUES ('menu-test', 0)");
$pdo->exec("INSERT INTO orders (id, menu_id, status) VALUES ('commande-test', 'menu-test', 'pending')");

$pdo->beginTransaction();
modifierStatutReservation($pdo, 'commande-test', 'cancelled', 'Test', 'Téléphone', null);
$pdo->commit();
verifier((int) $pdo->query("SELECT stock FROM menus WHERE id = 'menu-test'")->fetchColumn() === 1, 'Une annulation doit restituer une unité.');

$pdo->beginTransaction();
modifierStatutReservation($pdo, 'commande-test', 'cancelled', 'Test', 'Téléphone', null);
$pdo->commit();
verifier((int) $pdo->query("SELECT stock FROM menus WHERE id = 'menu-test'")->fetchColumn() === 1, 'Une deuxième annulation ne doit pas restituer le stock une seconde fois.');

$pdo->beginTransaction();
modifierStatutReservation($pdo, 'commande-test', 'pending', null, null, null);
$pdo->commit();
verifier((int) $pdo->query("SELECT stock FROM menus WHERE id = 'menu-test'")->fetchColumn() === 0, 'Une réactivation doit réserver une unité.');

$pdo->beginTransaction();
modifierStatutReservation($pdo, 'commande-test', 'cancelled', 'Test', 'Téléphone', null);
$pdo->commit();
$pdo->exec("UPDATE menus SET stock = 0 WHERE id = 'menu-test'");
$pdo->beginTransaction();
try {
    modifierStatutReservation($pdo, 'commande-test', 'pending', null, null, null);
    throw new LogicException('La réactivation sans stock aurait dû être refusée.');
} catch (DomainException $erreur) {
    $pdo->rollBack();
}
verifier($pdo->query("SELECT status FROM orders WHERE id = 'commande-test'")->fetchColumn() === 'cancelled', 'Une réactivation refusée doit conserver le statut annulé.');
verifier((int) $pdo->query("SELECT COUNT(*) FROM order_status_history")->fetchColumn() === 4, 'Une réactivation refusée ne doit pas ajouter d’historique.');

$pdo->beginTransaction();
try {
    modifierStatutReservation($pdo, 'inconnue', 'pending', null, null, null);
    throw new LogicException('Une réservation inexistante aurait dû être refusée.');
} catch (OutOfBoundsException $erreur) {
    $pdo->rollBack();
}

$recherche = new PDO('sqlite::memory:');
$recherche->sqliteCreateFunction('CONCAT', static fn (...$parties) => implode('', $parties));
$recherche->exec('CREATE TABLE orders (first_name TEXT, last_name TEXT, email TEXT, status TEXT, statut_paiement TEXT)');
$recherche->exec("INSERT INTO orders VALUES ('Alice', 'Martin', 'alice@example.test', 'pending', 'impaye'), ('Bob', 'Durand', 'bob@example.test', 'cancelled', 'paye')");
$chercher = static function (array $filtres) use ($recherche): array {
    [$conditions, $parametres] = filtresReservations($filtres);
    $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
    $requete = $recherche->prepare('SELECT o.first_name FROM orders o' . $where);
    $requete->execute($parametres);
    return $requete->fetchAll(PDO::FETCH_COLUMN);
};
verifier($chercher(['client' => 'Alice Martin']) === ['Alice'], 'La recherche doit trouver le nom complet.');
verifier($chercher(['client' => 'durand']) === ['Bob'], 'La recherche doit trouver le nom de famille.');
verifier($chercher(['client' => 'alice@example']) === ['Alice'], 'La recherche doit trouver une adresse e-mail.');
verifier($chercher(['client' => 'example.test', 'status' => 'cancelled']) === ['Bob'], 'Les filtres client et statut doivent se combiner.');
verifier($chercher(['client' => '%']) === [], 'Les caractères spéciaux ne doivent pas correspondre à tous les clients.');
verifier($chercher([]) === ['Alice', 'Bob'], 'Sans filtre, toutes les réservations doivent être affichées.');

echo "Stock des réservations vérifié.\n";
