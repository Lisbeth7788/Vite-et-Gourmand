<?php

function enregistrerAvis(PDO $pdo, string $utilisateur, ?string $reservation, int $note, string $commentaire): void
{
    $parametres = [$utilisateur];
    $selection = '';
    if ($reservation !== null) {
        $selection = ' AND o.id = ?';
        $parametres[] = $reservation;
    }

    $requete = $pdo->prepare(
        "SELECT o.id FROM orders o
         WHERE o.user_id = ? AND o.status = 'completed'{$selection}
           AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = o.id)
         ORDER BY o.created_at DESC LIMIT 1 FOR UPDATE"
    );
    $requete->execute($parametres);
    $identifiant = $requete->fetchColumn();
    if (!$identifiant) {
        throw new DomainException('Un avis est possible après une réservation terminée, une seule fois par réservation.');
    }

    $existant = $pdo->prepare('SELECT id FROM reviews WHERE order_id = ? LIMIT 1 FOR UPDATE');
    $existant->execute([$identifiant]);
    if ($existant->fetchColumn()) {
        throw new DomainException('Un avis a déjà été envoyé pour cette réservation.');
    }

    $insertion = $pdo->prepare('INSERT INTO reviews (user_id, order_id, rating, comment) VALUES (?, ?, ?, ?)');
    $insertion->execute([$utilisateur, $identifiant, $note, $commentaire]);
}
