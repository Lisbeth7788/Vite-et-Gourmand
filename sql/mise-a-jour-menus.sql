-- Mise à jour des menus et des plats (à importer dans phpMyAdmin, base déjà sélectionnée).
-- Ne touche ni aux comptes, ni aux commandes.

INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, image_path, conditions_text, stock)
VALUES
  ('marche-bordeaux', 'Le marché de Bordeaux', 24, 1, 'Midi', 'classique', 'La formule du 12h00, composée chaque jour avec les produits de saison et du jour.', 'images/images/menu-marche.jpg', 'Commande une semaine à l''avance. Annulation 24 h avant la prestation.', 5),
  ('formule-soir', 'La Table du Soir', 34, 1, 'Soir', 'classique', 'Une formule généreuse et raffinée pour vos dîners.', 'images/images/menu-reveillon.jpg', 'Commande une semaine à l''avance. Annulation 24 h avant la prestation.', 4),
  ('formule-etudiant', 'Le Campus Gourmand', 15, 1, 'Étudiant', 'classique', 'Une formule complète à petit prix pour les étudiants et les repas de groupe.', 'images/images/menu-printemps.jpg', 'Commande une semaine à l''avance. Annulation 24 h avant la prestation.', 10),
  ('menu-enfant', 'Le Petit Gourmet', 12, 1, 'Enfant', 'classique', 'Un repas adapté aux plus jeunes, avec des plats simples et gourmands.', 'images/images/menu-vegetal.jpg', 'Commande une semaine à l''avance. Annulation 24 h avant la prestation.', 10)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price = VALUES(price), minimum_people = VALUES(minimum_people),
  theme = VALUES(theme), regime = VALUES(regime), description = VALUES(description),
  image_path = VALUES(image_path), conditions_text = VALUES(conditions_text), stock = VALUES(stock);

INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position)
VALUES
  ('marche-bordeaux', 'entree', 'Entrée du jour selon le marché', 'selon les produits du jour', 1),
  ('marche-bordeaux', 'plat', 'Plat du jour selon le marché', 'selon les produits du jour', 2),
  ('marche-bordeaux', 'dessert', 'Dessert du jour selon le marché', 'selon les produits du jour', 3),
  ('formule-soir', 'entree', 'Tartare de saumon, avocat et citron vert', 'poisson', 1),
  ('formule-soir', 'plat', 'Magret de canard laqué au miel et gingembre, patates douces rôties', 'aucun allergène majeur déclaré', 2),
  ('formule-soir', 'dessert', 'Cœur coulant au chocolat et mangue fraîche', 'gluten, lait, oeufs', 3),
  ('formule-etudiant', 'entree', 'Samossas de légumes et chutney de mangue', 'gluten', 1),
  ('formule-etudiant', 'plat', 'Poulet tikka masala et riz basmati', 'lait', 2),
  ('formule-etudiant', 'dessert', 'Riz au lait de coco et fruits de la passion', 'fruits à coque', 3),
  ('menu-enfant', 'entree', 'Bâtonnets de légumes et sauce yaourt-citron', 'lait', 1),
  ('menu-enfant', 'plat', 'Wrap de poulet croustillant et frites de patate douce', 'gluten, oeufs', 2),
  ('menu-enfant', 'dessert', 'Brochette de fruits exotiques et chocolat fondu', 'lait', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), allergens = VALUES(allergens);

-- Retire les anciens menus qui ne sont plus proposés (sans commande liée).
DELETE FROM menu_dishes WHERE menu_id IN ('reveillon','jardin-printemps','fete-vegetale');
DELETE FROM menus WHERE id IN ('reveillon','jardin-printemps','fete-vegetale') AND id NOT IN (SELECT menu_id FROM orders);
