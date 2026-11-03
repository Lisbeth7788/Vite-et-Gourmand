<?php

const REMISE_SEUIL_PERSONNES = 5;
const REMISE_TAUX = 0.10;
const LIVRAISON_FORFAIT = 5.0;
const LIVRAISON_PAR_KM = 0.59;

function estBordeaux(string $ville): bool
{
    return mb_strtolower(trim($ville)) === 'bordeaux';
}

/**
 * Remise de 10 % à partir de 5 personnes de plus que le minimum du menu.
 * Livraison : gratuite à Bordeaux, sinon 5 € plus 0,59 € par kilomètre.
 */
function calculerTarifs(float $prixParPersonne, int $minimum, int $personnes, string $ville, float $distanceKm): array
{
    $menuTotal = round($prixParPersonne * $personnes, 2);
    $discount = $personnes >= $minimum + REMISE_SEUIL_PERSONNES ? round($menuTotal * REMISE_TAUX, 2) : 0.0;
    $delivery = estBordeaux($ville) ? 0.0 : round(LIVRAISON_FORFAIT + LIVRAISON_PAR_KM * max(0.0, $distanceKm), 2);

    return [
        'menuTotal' => $menuTotal,
        'discount' => $discount,
        'delivery' => $delivery,
        'total' => round($menuTotal - $discount + $delivery, 2),
    ];
}
