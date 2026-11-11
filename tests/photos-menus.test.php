<?php

require_once __DIR__ . '/../config/menu_images.php';

$dsn = getenv('TEST_DATABASE_DSN');
if (!$dsn) {
    throw new RuntimeException('TEST_DATABASE_DSN doit désigner une base de test vide.');
}
$pdo = new PDO($dsn, getenv('TEST_DATABASE_USER') ?: 'root', getenv('TEST_DATABASE_PASSWORD') ?: '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

function verifier(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$pdo->exec('CREATE TABLE menus (id VARCHAR(80) PRIMARY KEY, image_path VARCHAR(255) NOT NULL, stock INT NOT NULL)');
assurerTableImages($pdo);
$pdo->exec("INSERT INTO menus VALUES
    ('banquet-mariage', 'images/images/menu-reveillon.jpg', 2),
    ('brunch-naissance', 'images/images/menu-marche.jpg', 5),
    ('cocktail-dinatoire', 'images/images/personnalisee.jpg', 6),
    ('reveillon', 'images/images/menu-reveillon.jpg', 4),
    ('dejeuner-paques', 'images/images/menu-printemps.jpg', 5)");
$pdo->exec("INSERT INTO menu_images (menu_id, path, position) VALUES
    ('banquet-mariage', 'images/images/menu-reveillon.jpg', 1),
    ('banquet-mariage', 'images/images/galerie-personnalisee.jpg', 2),
    ('cocktail-dinatoire', 'images/images/personnalisee.jpg', 1),
    ('reveillon', 'images/images/couverture-personnalisee.jpg', 1),
    ('dejeuner-paques', 'images/images/menu-printemps.jpg', 1)");

actualiserPhotosMenus($pdo);
$menus = $pdo->query('SELECT id, image_path, stock FROM menus')->fetchAll(PDO::FETCH_UNIQUE);
verifier($menus['banquet-mariage']['image_path'] === 'images/images/menu-banquet-mariage.jpg', 'Couverture non remplacée.');
verifier($menus['banquet-mariage']['stock'] === 2, 'Stock modifié.');
verifier(imagesDuMenu($pdo, 'banquet-mariage') === [
    'images/images/menu-banquet-mariage.jpg',
    'images/images/galerie-personnalisee.jpg',
], 'Galerie personnalisée non préservée.');
verifier($menus['brunch-naissance']['image_path'] === 'images/images/menu-brunch-naissance.jpg', 'Menu sans galerie non remplacé.');
verifier($menus['cocktail-dinatoire']['image_path'] === 'images/images/personnalisee.jpg', 'Couverture personnalisée modifiée.');
verifier($menus['reveillon']['image_path'] === 'images/images/menu-reveillon.jpg', 'Couverture incohérente avec une galerie personnalisée modifiée.');
verifier(imagesDuMenu($pdo, 'reveillon') === ['images/images/couverture-personnalisee.jpg'], 'Galerie personnalisée modifiée.');
verifier(imagesDuMenu($pdo, 'dejeuner-paques') === ['images/images/menu-dejeuner-paques.jpg'], 'Photo de Pâques non remplacée.');

$pdo->exec("UPDATE menus SET image_path = 'images/images/menu-reveillon.jpg' WHERE id = 'banquet-mariage'");
actualiserPhotosMenus($pdo);
verifier($pdo->query("SELECT image_path FROM menus WHERE id = 'banquet-mariage'")->fetchColumn() === 'images/images/menu-reveillon.jpg', 'La migration a été réappliquée après une modification.');

$pdo->exec("DELETE FROM maj_menus WHERE nom = 'photos-menus-pexels'");
$pdo->exec('DROP TABLE menu_images');
try {
    actualiserPhotosMenus($pdo);
    throw new RuntimeException('Une erreur de base de données aurait dû interrompre la migration.');
} catch (PDOException $erreur) {
    verifier(!$pdo->inTransaction(), 'La transaction a été laissée ouverte.');
}
verifier((int) $pdo->query("SELECT COUNT(*) FROM maj_menus WHERE nom = 'photos-menus-pexels'")->fetchColumn() === 0, 'Le marqueur a été conservé après une erreur.');
verifier($pdo->query("SELECT image_path FROM menus WHERE id = 'banquet-mariage'")->fetchColumn() === 'images/images/menu-reveillon.jpg', 'Une erreur a modifié les images.');

echo "Migration des photos vérifiée.\n";
