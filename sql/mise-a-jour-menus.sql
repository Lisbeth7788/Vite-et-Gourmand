-- Mise à jour des menus et des plats (à importer dans phpMyAdmin, base déjà sélectionnée).
-- Ne touche ni aux comptes, ni aux commandes.

INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, image_path, conditions_text, stock)
VALUES
  ('marche-bordeaux', 'Le marché de Bordeaux', 24, 6, 'Classique', 'classique', 'Un repas de famille ou entre amis, composé avec les produits de saison du marché.', 'images/images/menu-marche.jpg', 'Commande au minimum 7 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('reveillon', 'Le réveillon généreux', 38, 8, 'Noël', 'classique', 'Une sélection festive pour réunir vos proches autour de la table de Noël.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 4),
  ('dejeuner-paques', 'Le déjeuner de Pâques', 34, 6, 'Pâques', 'classique', 'Le repas de Pâques en famille : agneau tendre et desserts au chocolat.', 'images/images/menu-printemps.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('cocktail-dinatoire', 'Le cocktail de cérémonie', 28, 20, 'Événement', 'classique', 'Une sélection de pièces salées et sucrées à partager debout, idéale pour un vin d''honneur, une réception ou une inauguration.', 'images/images/menu-marche.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures. Prévoir une table ou un buffet pour la mise en place.', 6),
  ('repas-anniversaire', 'Le repas d''anniversaire', 30, 10, 'Événement', 'classique', 'Un repas convivial pour fêter un anniversaire, avec un gâteau personnalisable.', 'images/images/menu-printemps.jpg', 'Commande au minimum 7 jours avant la prestation. Message sur le gâteau à préciser à la commande. Conservation au réfrigérateur et consommation sous 24 heures.', 6),
  ('brunch-naissance', 'Le brunch de naissance', 27, 8, 'Événement', 'classique', 'Un brunch doux et gourmand pour accueillir bébé en famille, salé et sucré.', 'images/images/menu-marche.jpg', 'Commande au minimum 7 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('bapteme-communion', 'Le repas de baptême et de communion', 36, 12, 'Événement', 'classique', 'Un repas de fête pour un baptême, une communion ou une confirmation, avec un dessert à partager.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 4),
  ('banquet-mariage', 'Le banquet de mariage', 55, 40, 'Événement', 'classique', 'Un repas de réception en trois services pour célébrer le plus beau jour, avec dressage soigné.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 21 jours avant la prestation. Dégustation possible sur rendez-vous. Conservation au réfrigérateur et consommation sous 24 heures.', 3),
  ('fete-vegetale', 'La fête végétale', 32, 10, 'Événement', 'vegan', 'Une formule entièrement végétale pour vos événements professionnels ou privés.', 'images/images/menu-vegetal.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price = VALUES(price), minimum_people = VALUES(minimum_people),
  theme = VALUES(theme), regime = VALUES(regime), description = VALUES(description),
  image_path = VALUES(image_path), conditions_text = VALUES(conditions_text), stock = VALUES(stock);

-- Remplace les plats des menus conservés puis ajoute les nouveaux.
DELETE FROM menu_dishes WHERE menu_id IN ('marche-bordeaux','reveillon','dejeuner-paques','cocktail-dinatoire','repas-anniversaire','brunch-naissance','bapteme-communion','banquet-mariage','fete-vegetale');
INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position)
VALUES
  ('marche-bordeaux', 'entree', 'Salade de chèvre frais et légumes de saison', 'lait, fruits à coque', 1),
  ('marche-bordeaux', 'plat', 'Bœuf braisé, pommes de terre grenaille et légumes rôtis', 'aucun allergène majeur déclaré', 2),
  ('marche-bordeaux', 'dessert', 'Tarte fine aux pommes caramélisées', 'gluten, lait, oeufs', 3),
  ('reveillon', 'entree', 'Velouté de courge et éclats de noisette', 'fruits à coque', 1),
  ('reveillon', 'plat', 'Volaille rôtie, marrons et légumes de fête', 'aucun allergène majeur déclaré', 2),
  ('reveillon', 'dessert', 'Bûche chocolat et vanille', 'gluten, lait, oeufs', 3),
  ('dejeuner-paques', 'entree', 'Asperges vertes, œuf mollet et copeaux de parmesan', 'oeufs, lait', 1),
  ('dejeuner-paques', 'plat', 'Gigot d''agneau rôti au thym, gratin dauphinois', 'lait', 2),
  ('dejeuner-paques', 'dessert', 'Nid de Pâques au chocolat et fruits rouges', 'gluten, lait, oeufs', 3),
  ('cocktail-dinatoire', 'entree', 'Verrines de saumon fumé et fromage frais, mini-quiches', 'poisson, lait, gluten, oeufs', 1),
  ('cocktail-dinatoire', 'plat', 'Brochettes de poulet mariné, mini-burgers et navettes garnies', 'gluten, lait, sésame', 2),
  ('cocktail-dinatoire', 'dessert', 'Mignardises, mini-tartelettes et verrines de fruits', 'gluten, lait, oeufs, fruits à coque', 3),
  ('repas-anniversaire', 'entree', 'Tarte fine tomates confites et chèvre, salade croquante', 'gluten, lait', 1),
  ('repas-anniversaire', 'plat', 'Suprême de volaille crème de champagne, gratin de légumes', 'lait', 2),
  ('repas-anniversaire', 'dessert', 'Gâteau d''anniversaire chocolat-framboise', 'gluten, lait, oeufs', 3),
  ('brunch-naissance', 'entree', 'Mini-croissants garnis, saumon fumé et fromage frais', 'gluten, poisson, lait', 1),
  ('brunch-naissance', 'plat', 'Œufs brouillés, charcuteries fines et salade de saison', 'oeufs', 2),
  ('brunch-naissance', 'dessert', 'Pancakes, fruits frais et dragées', 'gluten, lait, oeufs', 3),
  ('bapteme-communion', 'entree', 'Terrine de poisson, mayonnaise citronnée et mesclun', 'poisson, oeufs', 1),
  ('bapteme-communion', 'plat', 'Rôti de veau sauce aux morilles, gratin dauphinois', 'lait', 2),
  ('bapteme-communion', 'dessert', 'Pièce montée de choux et dragées', 'gluten, lait, oeufs', 3),
  ('banquet-mariage', 'entree', 'Foie gras maison, chutney de figues et pain d''épices', 'gluten, fruits à coque', 1),
  ('banquet-mariage', 'plat', 'Filet de bœuf sauce au poivre, gratin et légumes glacés', 'lait, gluten', 2),
  ('banquet-mariage', 'dessert', 'Pièce montée de choux et caramel', 'gluten, lait, oeufs', 3),
  ('fete-vegetale', 'entree', 'Gaspacho de petits pois et croustillant de pois chiches', 'aucun allergène majeur déclaré', 1),
  ('fete-vegetale', 'plat', 'Curry de légumes et lentilles corail, riz basmati', 'aucun allergène majeur déclaré', 2),
  ('fete-vegetale', 'dessert', 'Mousse au chocolat noir et lait de coco', 'aucun allergène majeur déclaré', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), allergens = VALUES(allergens);

-- Retire les anciens menus de type restaurant (sans commande liée).
DELETE FROM menu_dishes WHERE menu_id IN ('formule-soir','formule-etudiant','menu-enfant','jardin-printemps','buffet-entreprise') AND menu_id NOT IN (SELECT menu_id FROM orders);
DELETE FROM menus WHERE id IN ('formule-soir','formule-etudiant','menu-enfant','jardin-printemps','buffet-entreprise') AND id NOT IN (SELECT menu_id FROM orders);
