# Statistiques MongoDB

Les commandes sont enregistrees dans MariaDB pour le fonctionnement metier. Une copie analytique est envoyee dans la collection MongoDB `vite_et_gourmand.order_analytics` avec `order_id`, `menu_id`, `total`, `service_date` et `created_at`.

Le fichier `config/mongodb.php` utilise l'extension native PHP `mongodb`. L'API `api/admin/stats.php` filtre par menu et par periode, regroupe les commandes par menu et calcule le chiffre d'affaires. L'espace administrateur affiche le resultat dans un tableau et un graphique comparatif.

En production, configurer `MONGODB_URI` et `MONGODB_DATABASE`, puis creer un index MongoDB sur `menu_id` et `service_date` si le volume augmente. Ne jamais placer d'identifiants MongoDB dans Git.
