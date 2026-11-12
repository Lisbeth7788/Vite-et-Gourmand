<?php

function dateStatistiqueValide(string $date): bool
{
    if (!preg_match('/\A(\d{4})-(\d{2})-(\d{2})\z/', $date, $parties)) {
        return false;
    }

    return checkdate((int) $parties[2], (int) $parties[3], (int) $parties[1]);
}

function normaliserFiltresStatistiques(array $filtres): array
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

    return ['menu' => $menu, 'debut' => $debut, 'fin' => $fin];
}

function aggregerDocumentsStatistiques(array $documents, array $filtres): array
{
    $filtres = normaliserFiltresStatistiques($filtres);
    $groupes = [];

    foreach ($documents as $document) {
        if (
            !is_array($document)
            || !isset($document['id_menu'], $document['date_prestation'], $document['total'], $document['statut'])
            || !is_string($document['id_menu'])
            || !is_string($document['date_prestation'])
            || !is_numeric($document['total'])
            || !is_string($document['statut'])
        ) {
            throw new RuntimeException('Un document de statistiques est invalide.');
        }
        if ($document['statut'] === 'cancelled') {
            continue;
        }

        $menu = $document['id_menu'];
        $date = $document['date_prestation'];
        if (
            $menu === ''
            || !dateStatistiqueValide($date)
        ) {
            throw new RuntimeException('Un document de statistiques contient des données invalides.');
        }
        if (
            ($filtres['menu'] !== '' && $menu !== $filtres['menu'])
            || ($filtres['debut'] !== '' && $date < $filtres['debut'])
            || ($filtres['fin'] !== '' && $date > $filtres['fin'])
        ) {
            continue;
        }

        if (!isset($groupes[$menu])) {
            $groupes[$menu] = ['menu' => $menu, 'orders' => 0, 'revenue' => 0.0];
        }
        $groupes[$menu]['orders'] += 1;
        $groupes[$menu]['revenue'] += (float) $document['total'];
    }

    $statistiques = array_values($groupes);
    usort($statistiques, fn ($premier, $second) => ($second['orders'] <=> $premier['orders']) ?: ($premier['menu'] <=> $second['menu']));

    return $statistiques;
}

function lireStatistiquesCommandes(PDO $pdo, array $filtres): array
{
    $filtres = normaliserFiltresStatistiques($filtres);
    $menu = $filtres['menu'];
    $debut = $filtres['debut'];
    $fin = $filtres['fin'];

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
