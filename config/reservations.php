<?php

function modifierStatutReservation(PDO $pdo, string $identifiant, string $statut, ?string $motif, ?string $contact, ?string $note): void
{
    $requete = $pdo->prepare('SELECT menu_id, status FROM orders WHERE id = ? FOR UPDATE');
    $requete->execute([$identifiant]);
    $reservation = $requete->fetch(PDO::FETCH_ASSOC);
    if (!$reservation) {
        throw new OutOfBoundsException('Réservation introuvable.');
    }

    if ($reservation['status'] !== 'cancelled' && $statut === 'cancelled') {
        $stock = $pdo->prepare('UPDATE menus SET stock = stock + 1 WHERE id = ?');
        $stock->execute([$reservation['menu_id']]);
    } elseif ($reservation['status'] === 'cancelled' && $statut !== 'cancelled') {
        $stock = $pdo->prepare('UPDATE menus SET stock = stock - 1 WHERE id = ? AND stock > 0');
        $stock->execute([$reservation['menu_id']]);
        if ($stock->rowCount() !== 1) {
            throw new DomainException('Impossible de réactiver cette réservation : le menu est indisponible.');
        }
    }

    $miseAJour = $pdo->prepare('UPDATE orders SET status = ?, cancellation_reason = ?, cancellation_contact_method = ? WHERE id = ?');
    $miseAJour->execute([$statut, $motif, $contact, $identifiant]);
    $historique = $pdo->prepare('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)');
    $historique->execute([$identifiant, $statut, $note]);
}

function filtresReservations(array $filtres): array
{
    $conditions = [];
    $parametres = [];
    if (!empty($filtres['status'])) {
        $conditions[] = 'o.status = ?';
        $parametres[] = $filtres['status'];
    }
    if (!empty($filtres['paiement']) && in_array($filtres['paiement'], ['paye', 'impaye'], true)) {
        $conditions[] = 'o.statut_paiement = ?';
        $parametres[] = $filtres['paiement'];
    }
    if (!empty($filtres['email'])) {
        $conditions[] = 'o.email LIKE ?';
        $parametres[] = '%' . $filtres['email'] . '%';
    }
    if (isset($filtres['client']) && trim((string) $filtres['client']) !== '') {
        $recherche = '%' . strtr(trim((string) $filtres['client']), ['!' => '!!', '%' => '!%', '_' => '!_']) . '%';
        $conditions[] = "(o.first_name LIKE ? ESCAPE '!' OR o.last_name LIKE ? ESCAPE '!' OR CONCAT(o.first_name, ' ', o.last_name) LIKE ? ESCAPE '!' OR o.email LIKE ? ESCAPE '!')";
        array_push($parametres, $recherche, $recherche, $recherche, $recherche);
    }

    return [$conditions, $parametres];
}
