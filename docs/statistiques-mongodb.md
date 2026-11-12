# Statistiques MongoDB

Les commandes sont enregistrées dans MariaDB pour le fonctionnement métier. Pour une nouvelle installation, une copie analytique est envoyée dans la collection MongoDB `vite_et_gourmand.statistiques_commandes` avec `id_commande`, `id_menu`, `total`, `date_prestation` et `date_creation`.

Le fichier `config/mongodb.php` utilise l'extension native PHP `mongodb`. L'API `api/admin/stats.php` filtre par menu et par période, regroupe les commandes par menu et calcule le chiffre d'affaires. L'espace administrateur affiche le résultat dans un tableau et un graphique comparatif.

Configurer `MONGODB_URI`, `MONGODB_DATABASE` et `MONGODB_COLLECTION` dans la configuration privée du serveur. Sans `MONGODB_COLLECTION`, l'application conserve l'ancienne collection `order_analytics` et ses champs anglais : ne pas changer cette valeur sur une base existante sans migrer et vérifier ses données. Les deux collections ne sont pas fusionnées automatiquement. Une base neuve peut utiliser `statistiques_commandes`. Ne jamais placer d'identifiants MongoDB dans Git.

Sur un hébergement mutualisé Hostinger, le projet doit se connecter à un service MongoDB externe (par exemple MongoDB Atlas) : `127.0.0.1` désigne l'hébergement du site et non le service externe. Vérifier dans hPanel que l'extension PHP `mongodb` est disponible et que les connexions sortantes vers le fournisseur sont autorisées. Créer un utilisateur MongoDB limité à la base de statistiques et autoriser uniquement l'adresse sortante du serveur web dans la liste d'accès réseau du fournisseur. Si Hostinger ne fournit pas d'adresse sortante stable ou si l'extension n'est pas disponible, les statistiques MongoDB ne pourront pas fonctionner sur cette offre.

Créer `config/env.local.php` sur le serveur à partir de `config/env.local.example.php`, puis remplacer `MONGODB_URI` par l'URI fournie par le service externe. Garder ce fichier hors de Git et ne jamais partager l'URI. En production, une URI absente ne déclenche pas de tentative de connexion à `127.0.0.1`; en local, ce serveur reste l'adresse par défaut.

Si MongoDB tourne sur un VPS séparé, utiliser son URI privée et limiter le pare-feu MongoDB aux connexions provenant du serveur web. Ne pas exposer le port MongoDB à tout Internet.

Les statistiques dépendent de la disponibilité de MongoDB : une erreur d’écriture est inscrite dans le journal serveur, mais ne bloque pas la commande MySQL. Les erreurs de connexion et de lecture y indiquent aussi leur type et leur code; les URI et mots de passe sont masqués. Les commandes antérieures à la configuration ne sont pas recopiées automatiquement.
