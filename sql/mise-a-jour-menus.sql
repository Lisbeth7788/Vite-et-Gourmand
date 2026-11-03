-- Mise à jour des menus et des plats (à importer dans phpMyAdmin, base déjà sélectionnée).
-- Ne touche ni aux comptes, ni aux commandes.

INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, image_path, conditions_text, stock)
VALUES
  ('banquet-mariage', 'Le banquet de mariage', 95, 40, 'Événement', 'classique', 'Le grand repas de réception en cinq temps, pensé pour le plus beau jour : produits d''exception, dressage à l''assiette et pièce montée signature.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 30 jours avant la prestation. Dégustation offerte sur rendez-vous. Service et dressage assurés par notre équipe. Conservation au réfrigérateur et consommation sous 24 heures.', 3),
  ('repas-anniversaire', 'Le dîner d''anniversaire', 62, 10, 'Événement', 'classique', 'Un dîner raffiné pour célébrer un anniversaire, avec un entremets sur mesure aux couleurs de la fête.', 'images/images/menu-printemps.jpg', 'Commande au minimum 10 jours avant la prestation. Message et parfum de l''entremets à préciser à la commande. Conservation au réfrigérateur et consommation sous 24 heures.', 6),
  ('brunch-naissance', 'Le brunch de naissance', 58, 8, 'Événement', 'classique', 'Un brunch délicat et généreux pour accueillir bébé en famille : salé fin, douceurs et pièces festives en dragées.', 'images/images/menu-marche.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('bapteme-communion', 'Le repas de baptême et de communion', 72, 12, 'Événement', 'classique', 'Un repas de fête en quatre temps pour un baptême, une communion ou une confirmation, avec une pièce montée à partager.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 21 jours avant la prestation. Personnalisation de la pièce montée possible (couleurs, dragées). Conservation au réfrigérateur et consommation sous 24 heures.', 4),
  ('cocktail-dinatoire', 'Le cocktail de cérémonie', 68, 20, 'Événement', 'classique', 'Un cocktail de 14 pièces par personne, salées et sucrées, à partager debout : idéal pour un vin d''honneur, une réception ou une inauguration.', 'images/images/menu-marche.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures. Prévoir des tables hautes ou un buffet pour la mise en place.', 6),
  ('reveillon', 'Le réveillon d''exception', 89, 8, 'Noël', 'classique', 'Un menu de Noël gastronomique, des produits de fête à la bûche signature, pour une table inoubliable.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 21 jours avant la prestation. Réservation conseillée dès novembre. Conservation au réfrigérateur et consommation sous 24 heures.', 4),
  ('dejeuner-paques', 'Le déjeuner de Pâques', 74, 6, 'Pâques', 'classique', 'Le repas de Pâques en famille revisité : printemps en entrée, agneau de lait au four et desserts au chocolat.', 'images/images/menu-printemps.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('marche-bordeaux', 'Le dîner gastronomique de Bordeaux', 79, 6, 'Classique', 'classique', 'Un dîner de famille ou entre amis, inspiré de la cuisine bordelaise : produits du Sud-Ouest, sauces au vin et desserts maison.', 'images/images/menu-marche.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('fete-vegetale', 'La table végétale d''exception', 64, 10, 'Événement', 'vegan', 'Une gastronomie 100 % végétale : produits de saison travaillés comme à la grande table, sans aucun produit animal.', 'images/images/menu-vegetal.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price = VALUES(price), minimum_people = VALUES(minimum_people),
  theme = VALUES(theme), regime = VALUES(regime), description = VALUES(description),
  image_path = VALUES(image_path), conditions_text = VALUES(conditions_text), stock = VALUES(stock);

-- Remplace les plats des menus conservés puis ajoute les nouveaux.
DELETE FROM menu_dishes WHERE menu_id IN ('banquet-mariage','repas-anniversaire','brunch-naissance','bapteme-communion','cocktail-dinatoire','reveillon','dejeuner-paques','marche-bordeaux','fete-vegetale');
INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position)
VALUES
  ('banquet-mariage', 'entree', 'Foie gras de canard mi-cuit, chutney de figues et brioche toastée', 'gluten, oeufs, lait', 1),
  ('banquet-mariage', 'entree', 'Noix de Saint-Jacques snackées, crème de topinambour et noisettes torréfiées', 'mollusques, lait, fruits à coque', 2),
  ('banquet-mariage', 'plat', 'Filet de bœuf Rossini, jus truffé, gratin dauphinois et légumes glacés', 'lait, gluten, céleri', 3),
  ('banquet-mariage', 'plat', 'Pavé de turbot, beurre blanc au champagne et risotto crémeux aux asperges', 'poisson, lait', 4),
  ('banquet-mariage', 'dessert', 'Pièce montée de choux, crème vanille de Madagascar et caramel', 'gluten, lait, oeufs', 5),
  ('banquet-mariage', 'dessert', 'Macarons assortis et mignardises du chef', 'fruits à coque, oeufs, lait', 6),
  ('repas-anniversaire', 'entree', 'Carpaccio de bœuf, copeaux de parmesan, roquette et huile de truffe', 'lait', 1),
  ('repas-anniversaire', 'entree', 'Velouté de petits pois à la menthe et crème fouettée au citron', 'lait', 2),
  ('repas-anniversaire', 'plat', 'Suprême de volaille fermière, sauce au vin jaune et morilles, pommes fondantes', 'lait, sulfites', 3),
  ('repas-anniversaire', 'plat', 'Dos de cabillaud rôti, beurre citronné et légumes de printemps', 'poisson, lait', 4),
  ('repas-anniversaire', 'dessert', 'Entremets personnalisé chocolat noir, framboise et feuilleté praliné', 'gluten, lait, oeufs, fruits à coque', 5),
  ('brunch-naissance', 'entree', 'Blinis, saumon gravlax maison, crème à l''aneth et œufs de truite', 'gluten, poisson, lait, oeufs', 1),
  ('brunch-naissance', 'entree', 'Mini-croissants au jambon de Bayonne et fromage frais aux herbes', 'gluten, lait', 2),
  ('brunch-naissance', 'plat', 'Œufs cocotte à la crème et ciboulette, mouillettes de pain de campagne', 'oeufs, lait, gluten', 3),
  ('brunch-naissance', 'plat', 'Quiche fine aux asperges, chèvre frais et salade de jeunes pousses', 'gluten, lait, oeufs', 4),
  ('brunch-naissance', 'dessert', 'Pancakes moelleux, fruits rouges et sirop d''érable', 'gluten, lait, oeufs', 5),
  ('brunch-naissance', 'dessert', 'Verrines de panna cotta vanille et coulis de fruits de la passion', 'lait', 6),
  ('bapteme-communion', 'entree', 'Terrine de lotte au safran, mayonnaise citronnée et salade croquante', 'poisson, oeufs', 1),
  ('bapteme-communion', 'entree', 'Tartelette fine aux champignons des bois et jambon cru', 'gluten, lait, oeufs', 2),
  ('bapteme-communion', 'plat', 'Rôti de veau basse température, sauce aux morilles, gratin de pommes de terre', 'lait, sulfites', 3),
  ('bapteme-communion', 'plat', 'Pavé de saumon, sauce au beurre blanc et fondue de poireaux', 'poisson, lait', 4),
  ('bapteme-communion', 'dessert', 'Pièce montée de choux, dragées et nougatine', 'gluten, lait, oeufs, fruits à coque', 5),
  ('bapteme-communion', 'dessert', 'Fraisier à la crème mousseline', 'gluten, lait, oeufs', 6),
  ('cocktail-dinatoire', 'entree', 'Cuillères de tartare de saumon, avocat et citron vert', 'poisson', 1),
  ('cocktail-dinatoire', 'entree', 'Gougères au comté et mini-blinis au caviar d''aubergine', 'gluten, lait, oeufs', 2),
  ('cocktail-dinatoire', 'plat', 'Brochettes de magret de canard, sauce teriyaki et sésame', 'sésame, soja', 3),
  ('cocktail-dinatoire', 'plat', 'Mini-burgers de bœuf wagyu et pain brioché', 'gluten, lait, oeufs, sésame', 4),
  ('cocktail-dinatoire', 'dessert', 'Mignardises, tartelettes citron meringuée et éclairs chocolat', 'gluten, lait, oeufs', 5),
  ('cocktail-dinatoire', 'dessert', 'Verrines de mousse chocolat et passion', 'lait, oeufs', 6),
  ('reveillon', 'entree', 'Foie gras de canard mi-cuit, chutney de figues et pain d''épices', 'gluten, oeufs, lait', 1),
  ('reveillon', 'entree', 'Huîtres de Marennes-Oléron, mignonnette au vinaigre de champagne', 'mollusques, sulfites', 2),
  ('reveillon', 'plat', 'Chapon rôti aux marrons et truffe noire, jus corsé et purée de céleri', 'lait, céleri', 3),
  ('reveillon', 'plat', 'Homard bleu, bisque légère et gnocchis dorés', 'crustacés, gluten, lait, oeufs', 4),
  ('reveillon', 'dessert', 'Bûche chocolat grand cru, cœur praliné et feuilleté croustillant', 'gluten, lait, oeufs, fruits à coque', 5),
  ('reveillon', 'dessert', 'Truffes au chocolat et papillotes du chef', 'lait, fruits à coque', 6),
  ('dejeuner-paques', 'entree', 'Asperges blanches, œuf mollet, sabayon au citron et jambon cru', 'oeufs, lait', 1),
  ('dejeuner-paques', 'entree', 'Velouté de cresson, crème de chèvre et croûtons dorés', 'lait, gluten', 2),
  ('dejeuner-paques', 'plat', 'Gigot d''agneau de lait rôti au thym et à l''ail, jus réduit et gratin dauphinois', 'lait', 3),
  ('dejeuner-paques', 'plat', 'Carré d''agneau en croûte d''herbes, flan de petits pois et carottes fanes', 'gluten, lait, oeufs', 4),
  ('dejeuner-paques', 'dessert', 'Nid de Pâques chocolat noir, mousse praliné et œufs en sucre', 'lait, oeufs, fruits à coque', 5),
  ('dejeuner-paques', 'dessert', 'Tarte fine aux fraises, crème légère à la vanille', 'gluten, lait, oeufs', 6),
  ('marche-bordeaux', 'entree', 'Terrine de foie gras des Landes, confit d''oignons au vin rouge et pain de campagne', 'gluten, sulfites', 1),
  ('marche-bordeaux', 'entree', 'Marbré de légumes du marché, vinaigrette à la noisette et fromage de chèvre', 'lait, fruits à coque', 2),
  ('marche-bordeaux', 'plat', 'Entrecôte de bœuf à la bordelaise, moelle poêlée et pommes grenaille', 'lait, sulfites', 3),
  ('marche-bordeaux', 'plat', 'Magret de canard rôti, sauce au miel et aux épices, purée de patates douces', 'lait', 4),
  ('marche-bordeaux', 'dessert', 'Cannelés de Bordeaux tièdes et crème glacée vanille', 'gluten, lait, oeufs', 5),
  ('marche-bordeaux', 'dessert', 'Mille-feuille vanille, caramel au beurre salé', 'gluten, lait, oeufs', 6),
  ('fete-vegetale', 'entree', 'Tartare de betteraves et pomme verte, crème d''amande et pickles', 'fruits à coque', 1),
  ('fete-vegetale', 'entree', 'Velouté de topinambour à l''huile de noisette et chips de panais', 'fruits à coque', 2),
  ('fete-vegetale', 'plat', 'Wellington de légumes d''automne, jus aux champignons et purée de pois chiches', 'gluten', 3),
  ('fete-vegetale', 'plat', 'Risotto de cèpes à la crème d''avoine et éclats de noisette', 'gluten, fruits à coque', 4),
  ('fete-vegetale', 'dessert', 'Tarte au chocolat noir et sel de Guérande, crème de coco', 'gluten, fruits à coque', 5),
  ('fete-vegetale', 'dessert', 'Poire pochée au vin épicé et sablé amande', 'gluten, fruits à coque, sulfites', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), allergens = VALUES(allergens);

-- Retire les anciens menus de type restaurant (sans commande liée).
DELETE FROM menu_dishes WHERE menu_id IN ('formule-soir','formule-etudiant','menu-enfant','jardin-printemps','buffet-entreprise') AND menu_id NOT IN (SELECT menu_id FROM orders);
DELETE FROM menus WHERE id IN ('formule-soir','formule-etudiant','menu-enfant','jardin-printemps','buffet-entreprise') AND id NOT IN (SELECT menu_id FROM orders);
