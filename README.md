# Vite et Gourmand

Application web de presentation et de commande de menus pour l'entreprise Vite et Gourmand.

## Technologies

- HTML5, CSS3 et JavaScript natif pour l'interface.
- PHP 8.2 pour les traitements serveur.
- MySQL avec PDO et requetes preparees pour les donnees relationnelles.
- MongoDB pour les statistiques de commandes par menu, avec l'extension PHP `mongodb`.
- Sessions PHP pour l'authentification et les droits.

## Installation locale

1. Installer XAMPP avec Apache, PHP et MySQL.
2. Copier le projet dans `C:\xampp\htdocs\Vite-et-Gourmand`.
3. Demarrer Apache et MySQL.
4. Ouvrir phpMyAdmin et importer `sql/schema.sql` en choisissant l'encodage `utf8mb4` (ou utiliser `mysql --default-character-set=utf8mb4 < sql/schema.sql`).
5. Configurer les variables de `.env.example` dans l'environnement PHP.
6. Activer l'extension PHP `mongodb` dans `php.ini`.
7. Ouvrir `http://localhost/Vite-et-Gourmand/index.html`.

Le fichier SQL cree les menus, les utilisateurs de test, les commandes, les messages, les avis et l'historique des statuts. Les variables `MONGODB_URI` et `MONGODB_DATABASE` activent la collecte NoSQL des statistiques.

## Parcours de test

- Visiteur : accueil, menus, filtres, detail et contact.
- Client : inscription, connexion, commande et session.
- Employe : gestion des menus, filtrage et mise a jour des commandes, moderation des avis.
- Administrateur : fonctions employe, creation/desactivation des comptes employes.

Les comptes de test sont indiques dans `DEPLOYMENT.md`. Les mots de passe doivent etre modifies avant la mise en production.

## Securite

- Mots de passe haches avec `password_hash()` et verifies avec `password_verify()`.
- Requetes SQL preparees avec PDO.
- Sessions regenerees apres connexion ou inscription.
- Cookies de session `HttpOnly`, `SameSite=Lax` et `Secure` en production.
- Controle des roles cote serveur sur les routes protegees.
- Limitation des tentatives sur les formulaires sensibles.
- Validation serveur des e-mails, des mots de passe, des commandes et des statuts.
- Fichiers `.env`, SQL et dossiers sensibles proteges par `.htaccess`.

## Architecture

- `index.html`, `menus.html`, `menu-detail.html` : parcours public.
- `connexion.html`, `commande.html` : authentification et commande.
- `admin.html` : espace de gestion protege.
- `api/` : routes PHP JSON.
- `config/database.php` : connexion PDO, sessions et fonctions communes.
- `sql/schema.sql` : creation et alimentation de la base relationnelle.
- `DEPLOYMENT.md` : procedure de deploiement.

## Deploiement

L'hebergement doit fournir PHP 8.2+, Apache, MySQL et l'envoi d'e-mails PHP. Importer le schema SQL, definir les variables de `.env.example`, activer HTTPS et tester chaque parcours avant livraison.

Pour une livraison ECF complete, ajouter dans le depot le manuel PDF, la charte graphique, les maquettes, les diagrammes, le lien de l'application en ligne et le lien de l'outil de gestion de projet.
