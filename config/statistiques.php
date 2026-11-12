<?php

function dateStatistiqueValide(string $date): bool
{
    if (!preg_match('/\A(\d{4})-(\d{2})-(\d{2})\z/', $date, $parties)) {
        return false;
    }

    return checkdate((int) $parties[2], (int) $parties[3], (int) $parties[1]);
}

function lireStatistiquesCommandes(PDO $pdo, array $filtres): array
{
    foreach (['menu', 'from', 'to'] as $filtre) {
        if (isset($filtres[$filtre]) && !is_string($filtres[$filtre])) {
            throw new InvalidArgumentException('Un filtre de statistiques est invalide.');
        }
    }

    $menu = trim($filtres['menu'] ?? '');
    $debut = $filtres['from'] ?? '';
    $fin = $filtres['to'] ?? '';

    foreach ([$debut, $fin] as $date) {
        if ($date !== '' && !dateStatistiqueValide($date)) {
            throw new InvalidArgumentException('Les dates doivent être au format AAAA-MM-JJ.');
        }
    }

    if ($debut !== '' && $fin !== '' && $debut > $fin) {
        throw new InvalidArgumentException('La date de début doit précéder ou être égale à la date de fin.');
    }

    $conditions = ["status <> 'cancelled'"];
    $parametres = [];
    if ($menu !== '') {
        $conditions[] = 'menu_id = :menu';
        $parametres['menu'] = $menu;
    }
    if ($debut !== '') {
        $conditions[] = 'service_date >= :debut';
        $parametres['debut'] = $debut;
    }
    if ($fin !== '') {
        $conditions[] = 'service_date <= :fin';
        $parametres['fin'] = $fin;
    }

    $requete = $pdo->prepare(
        'SELECT menu_id AS menu, COUNT(*) AS nombre_reservations, SUM(total) AS chiffre_affaires
         FROM orders
         WHERE ' . implode(' AND ', $conditions) . '
         GROUP BY menu_id
         ORDER BY nombre_reservations DESC, menu_id ASC'
    );
    $requete->execute($parametres);

    $statistiques = [];
    foreach ($requete->fetchAll(PDO::FETCH_ASSOC) as $ligne) {
        $statistiques[] = [
            'menu' => (string) $ligne['menu'],
            'orders' => (int) $ligne['nombre_reservations'],
            'revenue' => (float) $ligne['chiffre_affaires']
        ];
    }

    return $statistiques;
}
