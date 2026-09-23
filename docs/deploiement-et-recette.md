# Deploiement et recette

## Variables de production

Configurer sur l'hebergement : `APP_ENV`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `MONGODB_URI`, `MONGODB_DATABASE` et `CONTACT_EMAIL`.

Ne jamais publier `.env`, les mots de passe ou le dossier local `mongo-data`.

## Etapes

1. Creer la base MariaDB/MySQL et son utilisateur dedie.
2. Importer `sql/schema.sql` avec l'encodage `utf8mb4`.
3. Configurer MongoDB et l'extension PHP `mongodb`.
4. Copier les fichiers dans le dossier public de l'hebergement.
5. Configurer HTTPS et le service SMTP.
6. Tester les parcours ci-dessous sur l'URL publique.

## Tests de recette

- Accueil, navigation et pied de page.
- Catalogue et filtres par prix, theme, regime et nombre de personnes.
- Detail dynamique de chaque menu, plats, allergenes et conditions.
- Inscription, connexion et mot de passe oublie.
- Acces commande refuse sans session.
- Commande avec remise et frais de livraison.
- Compte client, historique et annulation avant acceptation.
- Creation/desactivation d'un employe par l'administrateur.
- Mise a jour des statuts par l'employe.
- Validation d'un avis et affichage sur l'accueil.
- Statistiques MongoDB avec graphique et filtres de periode.
- Formulaire de contact et reception du mail SMTP.
- Verification mobile, clavier et lecteur d'ecran.

## SMTP

Le test est valide uniquement lorsque le message arrive dans la boite de l'entreprise et que le lien de reinitialisation arrive dans la boite de test. Un message HTTP de succes ne suffit pas.
