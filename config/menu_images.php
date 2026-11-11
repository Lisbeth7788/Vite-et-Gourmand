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

function actualiserPhotosMenus(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS maj_menus (nom VARCHAR(40) PRIMARY KEY, applique_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    $pdo->beginTransaction();
    try {
        $marqueur = $pdo->prepare('INSERT IGNORE INTO maj_menus (nom) VALUES (?)');
        $marqueur->execute(['photos-menus-pexels']);
        if ($marqueur->rowCount() === 0) {
            $pdo->commit();
            return;
        }

        $photos = [
            'banquet-mariage' => ['menu-reveillon.jpg', 'menu-banquet-mariage.jpg'],
            'repas-anniversaire' => ['menu-printemps.jpg', 'menu-repas-anniversaire.jpg'],
            'brunch-naissance' => ['menu-marche.jpg', 'menu-brunch-naissance.jpg'],
            'bapteme-communion' => ['menu-reveillon.jpg', 'menu-bapteme-communion.jpg'],
            'cocktail-dinatoire' => ['menu-marche.jpg', 'menu-cocktail-dinatoire.jpg'],
            'reveillon' => ['menu-reveillon.jpg', 'menu-noel.jpg'],
            'dejeuner-paques' => ['menu-printemps.jpg', 'menu-dejeuner-paques.jpg'],
            'marche-bordeaux' => ['menu-marche.jpg', 'menu-marche-bordeaux.jpg'],
            'fete-vegetale' => ['menu-vegetal.jpg', 'menu-fete-vegetale.jpg'],
        ];
        $menu = $pdo->prepare('SELECT image_path FROM menus WHERE id = ? FOR UPDATE');
        $galerie = $pdo->prepare('SELECT id, path FROM menu_images WHERE menu_id = ? ORDER BY position, id FOR UPDATE');
        $modifierMenu = $pdo->prepare('UPDATE menus SET image_path = ? WHERE id = ? AND image_path = ?');
        $modifierImage = $pdo->prepare('UPDATE menu_images SET path = ? WHERE id = ? AND path = ?');
        foreach ($photos as $id => [$ancienNom, $nouveauNom]) {
            $ancienne = 'images/images/' . $ancienNom;
            $nouvelle = 'images/images/' . $nouveauNom;
            $menu->execute([$id]);
            if ($menu->fetchColumn() !== $ancienne) continue;

            $galerie->execute([$id]);
            $premiereImage = $galerie->fetch();
            if ($premiereImage && $premiereImage['path'] !== $ancienne) continue;
            $modifierMenu->execute([$nouvelle, $id, $ancienne]);
            if ($premiereImage) {
                $modifierImage->execute([$nouvelle, $premiereImage['id'], $ancienne]);
            }
        }
        $pdo->commit();
    } catch (Throwable $erreur) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $erreur;
    }
}

function cheminImageValide(string $chemin): bool
{
    return (bool) preg_match('#^(images/[A-Za-z0-9_./-]+|https://[^\s"\'<>]+)$#', $chemin) && !str_contains($chemin, '..');
}
