# Déploiement et recette

## Variables à configurer

`APP_ENV`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `CONTACT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

Ne jamais publier `.env`, les mots de passe ni le jeton Upstash.

## Étapes de déploiement (Hostinger)

1. Créer la base MySQL et son utilisateur.
2. Pour une base neuve, importer `sql/schema.sql` (encodage `utf8mb4`). Ne pas importer `sql/comptes-ecf.sql` en ligne : il est réservé à une installation locale neuve et ses mots de passe sont publics.
3. Créer une base Upstash Redis REST gratuite et renseigner son URL HTTPS et son jeton dans `config/env.local.php`. Ne pas placer le jeton dans Git ni le partager. L'hébergement doit autoriser les connexions HTTPS sortantes ; aucune IP fixe n'est requise pour l'authentification par jeton. Voir [la procédure Upstash](statistiques-upstash.md).
4. Configurer l'envoi d'e-mails. MySQL/MariaDB reste la source des commandes ; la première consultation des statistiques copie les commandes existantes dans Upstash.
5. Envoyer les fichiers (ou relier le dépôt GitHub, branche `main`).
6. Activer HTTPS.
7. Faire la recette ci-dessous sur l'adresse publique.

## Liste de contrôle (recette)

Cocher chaque ligne après l'avoir testée.

- [ ] Accueil, navigation et pied de page (horaires, mentions légales, CGV).
- [ ] Menus : filtres par prix, thème, régime et nombre de personnes, sans rechargement.
- [ ] Détail d'un menu : plats, allergènes, conditions bien visibles.
- [x] Inscription (mot de passe de 10 caractères avec majuscule, minuscule, chiffre et caractère spécial). Testé en local le 3 novembre 2026.
- [x] Connexion et déconnexion. Testé en local le 3 novembre 2026.
- [x] Mot de passe oublié : réception de l'e-mail confirmée par Lisbeth.
- [x] Réservation refusée sans connexion. Testé en local le 3 novembre 2026.
- [x] Commande : adresse, ville, distance hors Bordeaux, détail du prix (menu, remise de 10 %, livraison). Testé en local le 3 novembre 2026.
- [x] Parcours de paiement simulé d'une réservation. Testé en local le 3 novembre 2026 ; aucun paiement réel n'est encaissé.
- [x] Client : modification et annulation d'une réservation. Testé en local le 3 novembre 2026.
- [x] Accessibilité : aucun défaut détecté par l'outil automatique axe-core (WCAG 2.1 AA) sur 13 pages publiques le 3 novembre 2026. Le contrôle manuel (clavier, lecteur d'écran, zoom 200 %) reste à faire.
- [ ] Espace client : liste, suivi du statut, avis (la liste et l'annulation sont déjà testées en local).
- [ ] Espace administrateur : messages, réservations (changement de statut), avis (publier ou refuser), activité.
- [ ] Réservations : rechercher un client par nom ou e-mail, filtrer par statut puis effacer les filtres.
- [x] Espace administrateur : statistiques par menu et filtres de dates vérifiés en ligne.
- [x] Connexion Upstash depuis Hostinger et chargement des statistiques vérifiés en ligne.
- [ ] Menus : ajouter un menu avec plats et allergènes, le retrouver sur le site, le supprimer.
- [ ] Vérifier les horaires affichés dans le pied de page.
- [ ] Comptes employés : créer, désactiver (la connexion doit alors échouer).
- [x] Client : avis donné sur une réservation terminée. Refusé dans l'administration et absent du site public.
- [x] Espace employé : connexion et accès aux réservations, aux avis et aux menus confirmés par Lisbeth.
- [x] Site déployé chez Hostinger, envoi d'e-mails et parcours client testés en ligne avec une vraie adresse (tests faits par Lisbeth).
- [x] Parcours client testé sur le site en ligne le 3 novembre 2026 : inscription, connexion, commande à Bordeaux et hors Bordeaux, remise de 10 %, paiement, annulation, droits d'accès, contact, suppression du compte de test. Stocks des menus inchangés après les tests.
- [x] Accessibilité en ligne le 3 novembre 2026 : aucun défaut axe-core sur 13 pages, lecture à 320 px sans défilement horizontal, focus clavier visible, langue, titres et textes alternatifs présents. Un lien d'évitement « Aller au contenu principal » a ensuite été ajouté sur les 20 pages et testé en local (visible au clavier, saut vers le contenu) ; il est en ligne depuis le redéploiement du 3 novembre 2026. Il manque le contrôle au lecteur d'écran.
- [x] Formulaire de contact : réception de l'e-mail confirmée par Lisbeth.
- [x] Affichage sur téléphone : fonctionnement confirmé par Lisbeth.
- [ ] Contrôle manuel au clavier, avec un zoom à 200 % et au lecteur d'écran.

Le 13 novembre 2026, un contrôle automatisé sur l'accueil, les menus, le contact et la connexion a vérifié le premier focus clavier et le lien d'évitement, ainsi que l'absence de débordement horizontal à une largeur de 640 pixels. Il ne remplace pas le contrôle manuel au clavier, au zoom à 200 % et au lecteur d'écran.

Le test PHP de migration des photos reste à exécuter sur une base MySQL de test isolée et vide, jamais sur la base de production. Des erreurs HTTP 429 ont aussi été observées en production, notamment sur `session.php` et `horaires.php` lors du contrôle du 13 novembre ; leur cause et leur fréquence restent à confirmer.

## E-mails

Un test n'est réussi que si le message arrive vraiment dans la boîte de réception. Un message de succès affiché par le site ne suffit pas.
