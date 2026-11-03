<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/menu_images.php';
require_once __DIR__ . '/../../config/maj_menus.php';
requireRole(['admin', 'employe']);
assurerTableImages($pdo);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    try {
        assurerMenusTraiteur($pdo);
    } catch (Throwable $erreur) {
        error_log('Mise à jour automatique des menus impossible : ' . $erreur->getMessage());
        jsonResponse(['error' => 'Mise à jour des menus impossible : ' . $erreur->getMessage()], 500);
    }
}

const TYPES_PLATS = ['entree' => 'entrees', 'plat' => 'plats', 'dessert' => 'desserts'];

// Une ligne de texte = un plat. Les allergènes se mettent après un point-virgule.
function lirePlats(string $texte): array
{
    $plats = [];
    foreach (preg_split('/\R/', $texte) as $ligne) {
        $ligne = trim($ligne);
        if ($ligne === '') {
            continue;
        }
        [$nom, $allergenes] = array_pad(array_map('trim', explode(';', $ligne, 2)), 2, '');
        $plats[] = [mb_substr($nom, 0, 180), mb_substr($allergenes, 0, 255)];
    }
    return $plats;
}

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($methode === 'GET') {
    $menus = $pdo->query('SELECT id, name, price, minimum_people, theme, regime, description, image_path, conditions_text, stock FROM menus ORDER BY name')->fetchAll();
    $requetePlats = $pdo->prepare('SELECT dish_type, name, allergens FROM menu_dishes WHERE menu_id = ? ORDER BY position');
    foreach ($menus as &$menu) {
        $requetePlats->execute([$menu['id']]);
        $menu['images'] = implode("\n", imagesDuMenu($pdo, $menu['id'], (string) $menu['image_path']));
        $menu['plats'] = [];
        foreach (TYPES_PLATS as $type => $cle) {
            $menu['plats'][$cle] = '';
        }
        foreach ($requetePlats->fetchAll() as $plat) {
            $cle = TYPES_PLATS[$plat['dish_type']] ?? null;
            if ($cle) {
                $menu['plats'][$cle] .= $plat['name'] . ($plat['allergens'] !== '' ? ' ; ' . $plat['allergens'] : '') . "\n";
            }
        }
    }
    jsonResponse($menus);
}

$data = requestData();

if ($methode === 'DELETE') {
    if (requiredFields($data, ['id'])) {
        jsonResponse(['error' => 'Menu invalide.'], 400);
    }
    $enCours = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE menu_id = ? AND status NOT IN ('cancelled', 'completed')");
    $enCours->execute([trim($data['id'])]);
    if ((int) $enCours->fetchColumn() > 0) {
        jsonResponse(['error' => 'Ce menu a des réservations en cours : suppression impossible.'], 409);
    }
    try {
        $pdo->prepare('DELETE FROM menus WHERE id = ?')->execute([trim($data['id'])]);
    } catch (Throwable $erreur) {
        jsonResponse(['error' => 'Ce menu est lié à des réservations : mettez son stock à 0 pour le masquer.'], 409);
    }
    jsonResponse(['message' => 'Menu supprimé.']);
}

if ($methode !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

if (requiredFields($data, ['name', 'price', 'minimum_people', 'theme', 'regime', 'description'])) {
    jsonResponse(['error' => 'Titre, prix, minimum de personnes, thème, régime et description sont obligatoires.'], 400);
}
$prix = (float) $data['price'];
$minimum = (int) $data['minimum_people'];
$stock = max(0, (int) ($data['stock'] ?? 0));
if ($prix <= 0 || $minimum < 1) {
    jsonResponse(['error' => 'Prix et nombre minimum de personnes doivent être positifs.'], 400);
}

$images = array_values(array_unique(array_filter(array_map('trim', preg_split('/\R/', (string) ($data['images'] ?? ''))))));
foreach ($images as $chemin) {
    if (!cheminImageValide($chemin)) {
        jsonResponse(['error' => 'Image invalide : « ' . mb_substr($chemin, 0, 60) . ' ». Utilisez un chemin comme images/images/menu-marche.jpg, un par ligne.'], 400);
    }
}
$data['image_path'] = $images[0] ?? '';

$id = trim((string) ($data['id'] ?? ''));
$nouveau = $id === '';
if ($nouveau) {
    $id = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', trim($data['name'])) ?: 'menu')), '-') ?: 'menu';
    $id = substr($id, 0, 60) . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
}

$pdo->beginTransaction();
try {
    if ($nouveau) {
        $requete = $pdo->prepare('INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, image_path, conditions_text, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $requete->execute([$id, trim($data['name']), $prix, $minimum, trim($data['theme']), trim($data['regime']), trim($data['description']), trim((string) ($data['image_path'] ?? '')), trim((string) ($data['conditions_text'] ?? '')), $stock]);
    } else {
        $requete = $pdo->prepare('UPDATE menus SET name = ?, price = ?, minimum_people = ?, theme = ?, regime = ?, description = ?, image_path = ?, conditions_text = ?, stock = ? WHERE id = ?');
        $requete->execute([trim($data['name']), $prix, $minimum, trim($data['theme']), trim($data['regime']), trim($data['description']), trim((string) ($data['image_path'] ?? '')), trim((string) ($data['conditions_text'] ?? '')), $stock, $id]);
    }
    $pdo->prepare('DELETE FROM menu_dishes WHERE menu_id = ?')->execute([$id]);
    $insertion = $pdo->prepare('INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position) VALUES (?, ?, ?, ?, ?)');
    $position = 1;
    foreach (TYPES_PLATS as $type => $cle) {
        foreach (lirePlats((string) ($data[$cle] ?? '')) as [$nom, $allergenes]) {
            $insertion->execute([$id, $type, $nom, $allergenes, $position++]);
        }
    }
    $pdo->prepare('DELETE FROM menu_images WHERE menu_id = ?')->execute([$id]);
    $insertionImage = $pdo->prepare('INSERT INTO menu_images (menu_id, path, position) VALUES (?, ?, ?)');
    foreach ($images as $rang => $chemin) {
        $insertionImage->execute([$id, $chemin, $rang + 1]);
    }
    $pdo->commit();
} catch (Throwable $erreur) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Le menu n’a pas pu être enregistré.'], 500);
}

jsonResponse(['message' => $nouveau ? 'Menu créé.' : 'Menu enregistré.', 'id' => $id], $nouveau ? 201 : 200);
