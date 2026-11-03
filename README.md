# Vite et Gourmand

Site web d'un traiteur à Bordeaux : présentation des menus, commande avec livraison et paiement en ligne, espace client, espace employé et espace administrateur.

Projet réalisé dans le cadre de la formation Développeur Web et Web Mobile.

## Outils utilisés

| Besoin | Outil |
| --- | --- |
| Pages et mise en forme | HTML5, CSS3 |
| Interactions (filtres, formulaires) | JavaScript sans framework |
| Serveur | PHP 8.2 |
| Base de données principale | MySQL (accès avec PDO et requêtes préparées) |
| Statistiques par menu | MongoDB (base non relationnelle) |
| Hébergement | Hostinger, déploiement depuis la branche `main` de GitHub |

## Installer le site sur son ordinateur

1. Installer XAMPP, puis démarrer **Apache** et **MySQL**.
2. Copier le dossier du projet dans `C:\xampp\htdocs\Vite-et-Gourmand`.
3. Ouvrir phpMyAdmin (`http://localhost/phpmyadmin`) et importer le fichier `sql/schema.sql` (encodage `utf8mb4`).
4. Importer ensuite `sql/comptes-ecf.sql` pour créer les comptes de démonstration.
5. Copier les variables de `.env.example` dans la configuration PHP (ou dans `config/env.local.php`, modèle : `config/env.local.example.php`).
6. Pour les statistiques : activer l'extension PHP `mongodb` dans `php.ini` et démarrer MongoDB.
7. Ouvrir `http://localhost/Vite-et-Gourmand/index.html`.

## Comptes de test

| Espace | Page de connexion | Identifiant | Mot de passe |
| --- | --- | --- | --- |
| Client | `connexion.html` | `client@vite-et-gourmand.fr` | `Azerty2026!` |
| Employé | `employe-connexion.html` | `employe@vite-et-gourmand.fr` | `Azerty2026!` |
| Administrateur | `admin-connexion.html` | `admin@vite-et-gourmand.fr` | `Azerty2026!` |

Ces comptes sont créés par `sql/comptes-ecf.sql` (à exécuter après `sql/schema.sql`). Ce sont des mots de passe de démonstration : il faut les changer avant une vraie mise en ligne.

## Que peut faire chaque profil ?

- **Visiteur** : voir l'accueil, les menus (avec filtres), le détail d'un menu, l'histoire du traiteur (sur l'accueil), et envoyer un message.
- **Client** : créer un compte, commander un menu à livrer (remise de 10 % et frais de livraison calculés), modifier sa commande avant acceptation, suivre ses commandes, les annuler tant qu'elles ne sont pas acceptées, puis donner un avis. Le paiement par carte est une simulation : aucun débit réel n'est effectué.
- **Employé** : traiter les commandes (statuts, annulation avec motif), valider ou refuser les avis, gérer les menus (plats, allergènes, stock) et les horaires.
- **Administrateur** : traiter les messages, les commandes (statuts) et les avis, voir les statistiques par menu, tout ce que fait un employé, créer, désactiver, réactiver ou supprimer des comptes employés.

## Sécurité mise en place

- Mots de passe protégés avec `password_hash()` et `password_verify()`.
- Requêtes SQL préparées (PDO) : pas d'injection SQL.
- Session régénérée après la connexion, cookies `HttpOnly` et `SameSite`.
- Droits vérifiés **côté serveur** sur chaque route protégée.
- Nombre de tentatives limité sur les formulaires sensibles.
- Données vérifiées côté navigateur **et** côté serveur.
- Fichiers sensibles (`.env`, `sql/`, `config/`) protégés par `.htaccess`.

## Organisation des fichiers

- `index.html`, `menus.html`, `menu-detail.html`, `contact.html` : pages publiques.
- `connexion.html`, `inscription.html`, `compte.html`, `reservation.html` : espace client.
- `employe-connexion.html`, `espace-employe.html` : espace employé.
- `admin-connexion.html`, `admin.html`, `admin-reservations.html`, `admin-avis.html`, `admin-activite.html`, `admin-menus.html`, `admin-comptes.html` : espace administrateur.
- `api/` : routes PHP qui répondent en JSON.
- `config/` : connexion à la base, sessions, fonctions communes.
- `css/`, `js/`, `images/`, `fonts/` : mise en forme, scripts, images, polices.
- `sql/` : création de la base et données d'exemple.
- `docs/` : documentation (voir ci-dessous).

## Documentation

- [Documentation technique](docs/documentation-technique.md)
- [Déploiement et recette](docs/deploiement-et-recette.md) et [DEPLOYMENT.md](DEPLOYMENT.md)
- [Gestion de projet](docs/gestion-projet.md)
- [Manuel d'utilisation](docs/manuel-utilisation.html) (version PDF à remettre séparément)
- [Charte graphique](docs/charte-graphique.pdf) et [maquettes](docs/maquettes.pdf)
- [Liens de livraison](docs/liens-livraison.md)
- [Contrôle final avant envoi](docs/controle-final.md)

## Méthode de travail avec Git

- `main` : version terminée, publiée en ligne.
- `develop` : fonctionnalités en cours de validation.
- Une branche par fonctionnalité, fusionnée dans `develop` après test, puis `develop` est fusionnée dans `main`.
