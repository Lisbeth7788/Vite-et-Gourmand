# Déploiement de Vite et Gourmand avec XAMPP

## Technologies

- HTML, CSS et JavaScript pour l'interface.
- PHP natif pour les traitements serveur.
- MySQL pour les utilisateurs, menus, commandes et messages.
- PDO pour les requêtes SQL préparées.

## Installation locale

1. Installer et démarrer Apache et MySQL dans XAMPP.
2. Copier le dossier `Vite-et-Gourmand` dans `C:\xampp\htdocs`.
3. Ouvrir phpMyAdmin à l'adresse `http://localhost/phpmyadmin`.
4. Importer le fichier `sql/schema.sql`.
5. Ouvrir le site avec `http://localhost/Vite-et-Gourmand/index.html`.

Le script SQL crée les menus et deux profils de test :

- Client : `test@vite-et-gourmand.fr` / `ViteGourmand2026!`
- Administrateur : `admin@vite-et-gourmand.fr` / `AdminVite2026!`

Les messages de contact sont maintenant stockés dans MySQL, dans la table `messages`.

## Mise en ligne

L'hébergement doit prendre en charge PHP 8.2 ou une version plus récente, MySQL et Apache avec les fichiers `.htaccess` actifs.

1. Créer une base MySQL et un utilisateur dédié, sans utiliser `root`.
2. Importer `sql/schema.sql` dans cette base.
3. Définir les variables présentes dans `.env.example` dans la configuration de l'hébergement : `DB_HOST`, `DB_NAME`, `DB_USER` et `DB_PASSWORD`.
5. Configurer le relais SMTP avec `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM`.
6. Copier les fichiers du projet dans le dossier public de l'hébergement.
7. Activer HTTPS et vérifier que les sessions PHP fonctionnent.
8. Tester l'inscription, la connexion, les menus, une commande, les e-mails, le formulaire de contact et les fonctions administrateur.

Le fichier `.env` ne doit jamais être envoyé sur le serveur public ou ajouté au dépôt. Le fichier `.env.example` sert uniquement de modèle.

Les comptes présents dans `sql/schema.sql` sont des comptes de test. Ils doivent être supprimés ou leurs mots de passe doivent être changés avant une mise en production.

## Routes PHP

- `api/menus.php` : lecture des menus.
- `api/auth/register.php` : création d'un compte client.
- `api/auth/login.php` : connexion d'un utilisateur.
- `api/auth/reset.php` : demande de réinitialisation.
- `api/auth/logout.php` : fermeture de session.
- `api/contact.php` : enregistrement d'un message.
- `api/orders.php` : validation et enregistrement d'une commande.
- `api/admin/orders.php` : commandes réservées à l'administrateur connecté.
- `api/admin/messages.php` : messages réservés à l'administrateur connecté.
- `api/admin/menus.php` : menus réservés à l'administrateur connecté.

## Droits utilisateurs

- Le `client` peut consulter les menus, créer un compte, se connecter, commander et envoyer un message.
- L'`admin` possède une session PHP avec des droits supplémentaires pour consulter les commandes, les messages et les menus.

Les mots de passe sont protégés avec les fonctions natives PHP `password_hash()` et `password_verify()`. Les requêtes utilisent PDO et des paramètres préparés.
