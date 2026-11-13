<?php

require_once __DIR__ . '/statistiques.php';

class ExceptionUpstash extends RuntimeException
{
}

function configurationUpstash(): ?array
{
    $url = trim(getenv('UPSTASH_REDIS_REST_URL') ?: '');
    $token = getenv('UPSTASH_REDIS_REST_TOKEN') ?: '';
    if ($url === '' && $token === '') {
        return null;
    }

    $parties = parse_url($url);
    if (
        $url === ''
        || !is_array($parties)
        || ($parties['scheme'] ?? '') !== 'https'
        || empty($parties['host'])
        || isset($parties['user'])
        || isset($parties['pass'])
        || isset($parties['query'])
        || isset($parties['fragment'])
        || !in_array($parties['path'] ?? '', ['', '/'], true)
    ) {
        throw new ExceptionUpstash('L’adresse REST Upstash est absente ou invalide.');
    }

    if ($token === '' || preg_match('/[\r\n]/', $token)) {
        throw new ExceptionUpstash('Le jeton REST Upstash est absent ou contient un retour à la ligne.');
    }

    return ['url' => rtrim($url, '/'), 'token' => $token];
}

function requeteUpstash(string $route, array $corps, ?callable $transport = null): array
{
    $configuration = configurationUpstash();
    if ($configuration === null) {
        throw new ExceptionUpstash('Le service NoSQL n’est pas configuré.');
    }

    if ($transport !== null) {
        $reponse = $transport($route, $corps);
        if (!is_array($reponse)) {
            throw new ExceptionUpstash('La réponse du service NoSQL est invalide.');
        }
        return $reponse;
    }

    $url = $configuration['url'] . ($route === '' ? '' : '/' . ltrim($route, '/'));
    $contexte = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\nAuthorization: Bearer {$configuration['token']}\r\n",
            'content' => json_encode($corps, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'timeout' => 8,
            'ignore_errors' => true,
            'follow_location' => 0
        ]
    ]);

    set_error_handler(static fn (int $niveau): bool => $niveau === E_WARNING);
    try {
        $contenu = file_get_contents($url, false, $contexte);
    } finally {
        restore_error_handler();
    }

    if ($contenu === false) {
        throw new ExceptionUpstash('Connexion au service NoSQL impossible.');
    }

    $ligneStatut = $http_response_header[0] ?? '';
    if (!preg_match('/\s(\d{3})\s/', $ligneStatut, $statut) || (int) $statut[1] < 200 || (int) $statut[1] >= 300) {
        throw new ExceptionUpstash('Le service NoSQL a refusé la requête.');
    }

    $reponse = json_decode($contenu, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($reponse) || array_key_exists('error', $reponse)) {
        throw new ExceptionUpstash('Le service NoSQL a renvoyé une erreur.');
    }

    return $reponse;
}

function commandeUpstash(array $commande, ?callable $transport = null): mixed
{
    $reponse = requeteUpstash('', $commande, $transport);
    if (!array_key_exists('result', $reponse)) {
        throw new ExceptionUpstash('La réponse du service NoSQL ne contient pas de résultat.');
    }

    return $reponse['result'];
}

function transactionUpstash(array $commandes, ?callable $transport = null): array
{
    $reponses = requeteUpstash('multi-exec', $commandes, $transport);
    if (count($reponses) !== count($commandes)) {
        throw new ExceptionUpstash('La transaction NoSQL n’a pas renvoyé tous ses résultats.');
    }

    $resultats = [];
    foreach ($reponses as $reponse) {
        if (!is_array($reponse) || !array_key_exists('result', $reponse) || array_key_exists('error', $reponse)) {
            throw new ExceptionUpstash('Une commande de la transaction NoSQL a échoué.');
        }
        $resultats[] = $reponse['result'];
    }

    return $resultats;
}

function commandesStatistiqueNoSQL(array $commande): array
{
    $identifiant = (string) ($commande['id'] ?? '');
    $date = (string) ($commande['service_date'] ?? '');
    if (!preg_match('/\A[a-zA-Z0-9_-]{1,64}\z/', $identifiant) || !dateStatistiqueValide($date)) {
        throw new ExceptionUpstash('Les données de la commande sont invalides pour le stockage NoSQL.');
    }

    $document = [
        'id_commande' => $identifiant,
        'id_menu' => (string) $commande['menu_id'],
        'total' => (float) $commande['total'],
        'date_prestation' => $date,
        'statut' => (string) $commande['status']
    ];
    $cle = 'vite-et-gourmand:statistiques:commande:' . $identifiant;

    return [
        ['SET', $cle, json_encode($document, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)],
        ['ZADD', 'vite-et-gourmand:statistiques:dates', (int) str_replace('-', '', $date), $identifiant]
    ];
}

function enregistrerStatistiqueNoSQL(PDO $pdo, string $identifiant, ?callable $transport = null): void
{
    $requete = $pdo->prepare('SELECT id, menu_id, total, service_date, status FROM orders WHERE id = ?');
    $requete->execute([$identifiant]);
    $commande = $requete->fetch(PDO::FETCH_ASSOC);
    if (!$commande) {
        throw new ExceptionUpstash('Commande introuvable pour la synchronisation NoSQL.');
    }

    transactionUpstash(commandesStatistiqueNoSQL($commande), $transport);
}

function synchroniserStatistiqueNoSQL(PDO $pdo, string $identifiant): bool
{
    try {
        if (configurationUpstash() === null && (getenv('APP_ENV') ?: 'local') !== 'production') {
            return false;
        }

        enregistrerStatistiqueNoSQL($pdo, $identifiant);
        return true;
    } catch (PDOException | RuntimeException | JsonException $erreur) {
        error_log('Synchronisation des statistiques NoSQL impossible : ' . get_class($erreur) . ' : ' . $erreur->getMessage());
        return false;
    }
}

function initialiserStatistiquesNoSQL(PDO $pdo, ?callable $transport = null): void
{
    if (commandeUpstash(['GET', 'vite-et-gourmand:statistiques:initialise'], $transport) === '1') {
        return;
    }

    $commandes = $pdo->query('SELECT id, menu_id, total, service_date, status FROM orders');
    $lot = [];
    while ($commande = $commandes->fetch(PDO::FETCH_ASSOC)) {
        array_push($lot, ...commandesStatistiqueNoSQL($commande));
        if (count($lot) >= 100) {
            transactionUpstash($lot, $transport);
            $lot = [];
        }
    }
    if ($lot) {
        transactionUpstash($lot, $transport);
    }

    if (commandeUpstash(['SET', 'vite-et-gourmand:statistiques:initialise', '1'], $transport) !== 'OK') {
        throw new ExceptionUpstash('L’initialisation des statistiques NoSQL a échoué.');
    }
}

function lireDocumentsStatistiques(array $identifiants, ?callable $transport): array
{
    $cles = array_map(
        fn ($identifiant) => 'vite-et-gourmand:statistiques:commande:' . $identifiant,
        $identifiants
    );
    $valeurs = commandeUpstash(array_merge(['MGET'], $cles), $transport);
    if (!is_array($valeurs) || count($valeurs) !== count($cles)) {
        throw new ExceptionUpstash('Les commandes NoSQL n’ont pas pu être lues.');
    }

    $documents = [];
    foreach ($valeurs as $valeur) {
        if (!is_string($valeur)) {
            throw new ExceptionUpstash('Une commande référencée est absente du stockage NoSQL.');
        }
        $document = json_decode($valeur, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($document)) {
            throw new ExceptionUpstash('Un document de statistiques NoSQL est invalide.');
        }
        $documents[] = $document;
    }
    return $documents;
}

function lireStatistiquesNoSQL(array $filtres, ?callable $transport = null): array
{
    $filtresNormalises = normaliserFiltresStatistiques($filtres);
    $debut = $filtresNormalises['debut'] === '' ? '-inf' : (string) (int) str_replace('-', '', $filtresNormalises['debut']);
    $fin = $filtresNormalises['fin'] === '' ? '+inf' : (string) (int) str_replace('-', '', $filtresNormalises['fin']);
    $documents = [];
    $decalage = 0;
    $tailleLot = 100;

    do {
        $identifiants = commandeUpstash([
            'ZRANGEBYSCORE',
            'vite-et-gourmand:statistiques:dates',
            $debut,
            $fin,
            'LIMIT',
            (string) $decalage,
            (string) $tailleLot
        ], $transport);
        if (!is_array($identifiants)) {
            throw new ExceptionUpstash('L’index des dates NoSQL est invalide.');
        }
        if (!$identifiants) {
            break;
        }

        array_push($documents, ...lireDocumentsStatistiques($identifiants, $transport));

        $decalage += count($identifiants);
    } while (count($identifiants) === $tailleLot);

    return aggregerDocumentsStatistiques($documents, $filtres);
}

function effacerStatistiquesNoSQL(?callable $transport = null): int
{
    $nombre = 0;
    do {
        $identifiants = commandeUpstash([
            'ZRANGE',
            'vite-et-gourmand:statistiques:dates',
            '0',
            '49'
        ], $transport);
        if (!is_array($identifiants)) {
            throw new ExceptionUpstash('L’index des dates NoSQL est invalide.');
        }
        if (!$identifiants) {
            break;
        }

        $cles = array_map(
            fn ($identifiant) => 'vite-et-gourmand:statistiques:commande:' . $identifiant,
            $identifiants
        );
        transactionUpstash([
            array_merge(['DEL'], $cles),
            array_merge(['ZREM', 'vite-et-gourmand:statistiques:dates'], $identifiants)
        ], $transport);
        $nombre += count($identifiants);
    } while (count($identifiants) === 50);

    commandeUpstash([
        'DEL',
        'vite-et-gourmand:statistiques:dates',
        'vite-et-gourmand:statistiques:initialise'
    ], $transport);

    return $nombre;
}
