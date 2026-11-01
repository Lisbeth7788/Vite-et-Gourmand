# Déploiement et recette

## Variables à configurer

`APP_ENV`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `CONTACT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `MONGODB_URI`, `MONGODB_DATABASE`.

Ne jamais publier `.env`, les mots de passe ou le dossier local `mongo-data`.

## Étapes de déploiement (Hostinger)

1. Créer la base MySQL et son utilisateur.
2. Importer `sql/schema.sql` puis `sql/exemple-employe.sql` (encodage `utf8mb4`).
3. Configurer MongoDB, l'extension PHP `mongodb` et l'envoi d'e-mails.
4. Envoyer les fichiers (ou relier le dépôt GitHub, branche `main`).
5. Activer HTTPS.
6. Faire la recette ci-dessous sur l'adresse publique.

## Liste de contrôle (recette)

Cocher chaque ligne après l'avoir testée.

- [ ] Accueil, navigation et pied de page (horaires, mentions légales, CGV).
- [ ] Menus : filtres par prix, thème, régime et nombre de personnes, sans rechargement.
- [ ] Détail d'un menu : plats, allergènes, conditions bien visibles.
- [ ] Inscription (mot de passe de 10 caractères avec majuscule, minuscule, chiffre et caractère spécial).
- [ ] Connexion, déconnexion, mot de passe oublié (lien reçu par e-mail).
- [ ] Réservation refusée sans connexion.
- [ ] Réservation : jour et service, 10 personnes maximum, 60 personnes maximum par service.
- [ ] Paiement en ligne d'une réservation.
- [ ] Espace client : liste, annulation avant acceptation, suivi du statut, avis.
- [ ] Espace administrateur : messages, réservations (changement de statut), avis (publier ou refuser), activité.
- [ ] Planning : une case modifiée par l'administrateur apparaît chez l'employé en quelques secondes.
- [ ] Espace employé : connexion avec `employe`, planning en lecture seule.
- [ ] Formulaire de contact et réception de l'e-mail.
- [ ] Affichage sur téléphone, au clavier et avec un zoom à 200 %.

## E-mails

Un test n'est réussi que si le message arrive vraiment dans la boîte de réception. Un message de succès affiché par le site ne suffit pas.
