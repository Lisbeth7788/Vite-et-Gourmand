<?php

// Galerie d'un menu : plusieurs images, la première sert de couverture (menus.image_path).
function assurerTableImages(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS menu_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            menu_id VARCHAR(80) NOT NULL,
            path VARCHAR(255) NOT NULL,
            position INT NOT NULL DEFAULT 1,
            CONSTRAINT fk_menu_images_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
        )'
    );
}

function imagesDuMenu(PDO $pdo, string $menuId, string $imageParDefaut = ''): array
{
    $requete = $pdo->prepare('SELECT path FROM menu_images WHERE menu_id = ? ORDER BY position, id');
    $requete->execute([$menuId]);
    $images = $requete->fetchAll(PDO::FETCH_COLUMN);
    if (!$images && $imageParDefaut !== '') {
        $images = [$imageParDefaut];
    }
    return $images;
}

function cheminImageValide(string $chemin): bool
{
    return (bool) preg_match('#^(images/[A-Za-z0-9_./-]+|https://[^\s"\'<>]+)$#', $chemin) && !str_contains($chemin, '..');
}
