# Mettre le site en ligne

Le site est hébergé chez Hostinger. Il se met à jour à chaque `push` sur la branche `main` de GitHub.

## Ce qu'il faut sur l'hébergement

- PHP 8.2 ou plus récent.
- Une base MySQL / MariaDB.
- Apache avec les fichiers `.htaccess` actifs.
- HTTPS activé.
- (Pour les statistiques) un service MongoDB accessible depuis le site et l'extension PHP `mongodb`. Sur l'offre mutualisée, utiliser un service externe et configurer son URI dans `config/env.local.php` ; ne pas utiliser `127.0.0.1`.

## Étapes

1. Créer une base MySQL et un utilisateur dédié (jamais `root`).
2. Importer `sql/schema.sql` dans phpMyAdmin (encodage `utf8mb4`).
3. Créer les comptes de démonstration en ligne séparément avec des mots de passe privés. Ne pas importer `sql/comptes-ecf.sql` en ligne : il est réservé à une installation locale neuve et ses mots de passe sont publics.
4. Renseigner les variables de `.env.example` dans la configuration de l'hébergement : `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `CONTACT_EMAIL`, `SMTP_*`, `MONGODB_*`. Pour MongoDB en hébergement mutualisé, suivre [la procédure des statistiques MongoDB](docs/statistiques-mongodb.md) et vérifier que l'extension PHP `mongodb` et les connexions sortantes sont disponibles.
5. Envoyer les fichiers dans le dossier public (ou laisser Hostinger les récupérer depuis GitHub).
6. Vérifier que le site s'ouvre en `https://` et tester chaque parcours (voir `docs/deploiement-et-recette.md`).

## Après une modification

Si une page ne montre pas la dernière version, faire **Ctrl + F5** pour vider le cache du navigateur. Les fichiers `css` et `js` portent un numéro `?v=…` qui change quand ils sont modifiés.

## Bon à savoir

- Le fichier `.env` ne doit jamais être publié ni ajouté à GitHub.
- Les comptes de test doivent être supprimés ou voir leur mot de passe changé avant la vraie ouverture.

## Les routes PHP

- Public : `api/menus.php`, `api/contact.php`, `api/reviews.php`.
- Connexion : `api/auth/` (inscription, connexion, déconnexion, mot de passe oublié, session).
- Client : `api/orders.php` (réservation), `api/paiement.php`, `api/user/` (profil, réservations, activité).
- Employé : `api/employee/espace.php`.
- Administrateur : `api/admin/` (messages, réservations, avis, activité, statistiques, comptes employés).
