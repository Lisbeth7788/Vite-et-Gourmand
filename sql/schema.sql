CREATE DATABASE IF NOT EXISTS vite_et_gourmand
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vite_et_gourmand;

CREATE TABLE IF NOT EXISTS menus (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  minimum_people INT NOT NULL,
  theme VARCHAR(40) NOT NULL,
  regime VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  image_path VARCHAR(255) NOT NULL DEFAULT '',
  conditions_text TEXT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_path VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE menus ADD COLUMN IF NOT EXISTS conditions_text TEXT NULL;

CREATE TABLE IF NOT EXISTS menu_dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id VARCHAR(80) NOT NULL,
  dish_type VARCHAR(20) NOT NULL,
  name VARCHAR(180) NOT NULL,
  allergens VARCHAR(255) NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  UNIQUE KEY unique_menu_dish (menu_id, dish_type, position),
  CONSTRAINT fk_menu_dishes_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'client';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(30) NULL;

CREATE TABLE IF NOT EXISTS employee_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  note VARCHAR(200) NULL,
  CONSTRAINT fk_shifts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  task_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  report_date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payslips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  period CHAR(7) NOT NULL,
  hours DECIMAL(6, 2) NOT NULL,
  gross DECIMAL(10, 2) NOT NULL,
  net DECIMAL(10, 2) NOT NULL,
  note VARCHAR(200) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payslips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  distance DECIMAL(8, 2) NOT NULL DEFAULT 0,
  service_date DATE NOT NULL,
  service_time TIME NOT NULL,
  delivery_place VARCHAR(150) NOT NULL,
  menu_id VARCHAR(80) NOT NULL,
  people INT NOT NULL,
  menu_total DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  material_loaned BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_reason TEXT NULL,
  cancellation_contact_method VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_menu FOREIGN KEY (menu_id) REFERENCES menus(id)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(20) NOT NULL DEFAULT 'impaye';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paye_le DATETIME NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS material_loaned  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_contact_method VARCHAR(30) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  email VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours (
  day_of_week TINYINT PRIMARY KEY,
  day_name VARCHAR(20) NOT NULL,
  opening_hours VARCHAR(120) NOT NULL
);

INSERT INTO business_hours (day_of_week, day_name, opening_hours)
VALUES
  (1, 'Lundi', '11h30 - 14h00'),
  (2, 'Mardi', '11h30 - 14h00 / 18h00 - 21h00'),
  (3, 'Mercredi', '11h30 - 14h00 / 18h00 - 21h00'),
  (4, 'Jeudi', '11h30 - 14h00 / 18h00 - 21h30'),
  (5, 'Vendredi', '11h30 - 14h00 / 18h00 - 22h00'),
  (6, 'Samedi', '10h30 - 15h00 / 18h00 - 22h00'),
  (7, 'Dimanche', '10h30 - 14h30')
ON DUPLICATE KEY UPDATE day_name = VALUES(day_name), opening_hours = VALUES(opening_hours);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NULL,
  order_id CHAR(36) NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(220) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

INSERT INTO menus (id, name, price, minimum_people, theme, regime, description, image_path, conditions_text, stock)
VALUES
  ('banquet-mariage', 'Le banquet de mariage', 95, 40, 'Événement', 'classique', 'Le grand repas de réception en cinq temps, pensé pour le plus beau jour : produits d''exception, dressage à l''assiette et pièce montée signature.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 30 jours avant la prestation. Dégustation offerte sur rendez-vous. Service et dressage assurés par notre équipe. Conservation au réfrigérateur et consommation sous 24 heures.', 3),
  ('repas-anniversaire', 'Le dîner d''anniversaire', 62, 10, 'Événement', 'classique', 'Un dîner raffiné pour célébrer un anniversaire, avec un entremets sur mesure aux couleurs de la fête.', 'images/images/menu-printemps.jpg', 'Commande au minimum 10 jours avant la prestation. Message et parfum de l''entremets à préciser à la commande. Conservation au réfrigérateur et consommation sous 24 heures.', 6),
  ('brunch-naissance', 'Le brunch de naissance', 58, 8, 'Événement', 'classique', 'Un brunch délicat et généreux pour accueillir bébé en famille : salé fin, douceurs et pièces festives en dragées.', 'images/images/menu-marche.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('bapteme-communion', 'Le repas de baptême et de communion', 72, 12, 'Événement', 'classique', 'Un repas de fête délicat pour un baptême, une communion ou une confirmation, avec un gâteau blanc personnalisable.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 21 jours avant la prestation. Personnalisation du gâteau possible (couleurs, dragées). Conservation au réfrigérateur et consommation sous 24 heures.', 4),
  ('cocktail-dinatoire', 'Le cocktail de cérémonie', 68, 20, 'Événement', 'classique', 'Un cocktail de 14 pièces par personne, salées et sucrées, à partager debout : idéal pour un vin d''honneur, une réception ou une inauguration.', 'images/images/menu-marche.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures. Prévoir des tables hautes ou un buffet pour la mise en place.', 6),
  ('reveillon', 'Le réveillon d''exception', 89, 8, 'Noël', 'classique', 'Un menu de Noël gastronomique, des produits de fête à la bûche signature, pour une table inoubliable.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 21 jours avant la prestation. Réservation conseillée dès novembre. Conservation au réfrigérateur et consommation sous 24 heures.', 4),
  ('dejeuner-paques', 'Le déjeuner de Pâques', 74, 6, 'Pâques', 'classique', 'Le repas de Pâques en famille revisité : printemps en entrée, agneau de lait au four et desserts au chocolat.', 'images/images/menu-printemps.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('marche-bordeaux', 'Le dîner gastronomique de Bordeaux', 79, 6, 'Classique', 'classique', 'Un dîner de famille ou entre amis, inspiré de la cuisine bordelaise : produits du Sud-Ouest, sauces au vin et desserts maison.', 'images/images/menu-marche.jpg', 'Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('fete-vegetale', 'La table végétale d''exception', 64, 10, 'Événement', 'vegan', 'Une gastronomie 100 % végétale : produits de saison travaillés comme à la grande table, sans aucun produit animal.', 'images/images/menu-vegetal.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price = VALUES(price), minimum_people = VALUES(minimum_people),
  theme = VALUES(theme), regime = VALUES(regime), description = VALUES(description),
  image_path = VALUES(image_path), conditions_text = VALUES(conditions_text), stock = VALUES(stock);

CREATE TABLE IF NOT EXISTS menu_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id VARCHAR(80) NOT NULL,
  path VARCHAR(255) NOT NULL,
  position INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_menu_images_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

INSERT INTO menu_images (menu_id, path, position)
SELECT m.id, m.image_path, 1 FROM menus m
WHERE m.image_path <> '' AND NOT EXISTS (SELECT 1 FROM menu_images i WHERE i.menu_id = m.id);

INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position)
VALUES
  ('banquet-mariage', 'entree', 'Foie gras de canard mi-cuit, chutney de figues et brioche toastée', 'gluten, oeufs, lait', 1),
  ('banquet-mariage', 'entree', 'Langoustines rôties, émulsion de corail et fenouil confit', 'crustacés, lait', 2),
  ('banquet-mariage', 'plat', 'Filet de bœuf Rossini, jus truffé, gratin dauphinois et légumes glacés', 'lait, gluten, céleri', 3),
  ('banquet-mariage', 'plat', 'Pavé de turbot, beurre blanc au champagne et risotto crémeux aux asperges', 'poisson, lait', 4),
  ('banquet-mariage', 'dessert', 'Pièce montée de choux, crème vanille de Madagascar et caramel', 'gluten, lait, oeufs', 5),
  ('banquet-mariage', 'dessert', 'Macarons assortis et mignardises du chef', 'fruits à coque, oeufs, lait', 6),
  ('repas-anniversaire', 'entree', 'Burrata crémeuse, tomates anciennes et pesto de basilic', 'lait, fruits à coque', 1),
  ('repas-anniversaire', 'entree', 'Carpaccio de bœuf, copeaux de parmesan, roquette et huile d''olive vierge', 'lait', 2),
  ('repas-anniversaire', 'plat', 'Côte de veau rôtie au thym, jus corsé et purée à la vanille', 'lait', 3),
  ('repas-anniversaire', 'plat', 'Risotto crémeux aux gambas et safran, copeaux de parmesan', 'crustacés, lait', 4),
  ('repas-anniversaire', 'dessert', 'Entremets personnalisé chocolat noir, framboise et croustillant praliné', 'gluten, lait, oeufs, fruits à coque', 5),
  ('brunch-naissance', 'entree', 'Blinis, saumon gravlax maison et crème à l''aneth', 'gluten, poisson, lait, oeufs', 1),
  ('brunch-naissance', 'entree', 'Mini-croissants au jambon de Bayonne et fromage frais aux herbes', 'gluten, lait', 2),
  ('brunch-naissance', 'plat', 'Œufs cocotte à la crème et ciboulette, mouillettes de pain de campagne', 'oeufs, lait, gluten', 3),
  ('brunch-naissance', 'plat', 'Tarte fine courgette, chèvre frais et menthe, salade de jeunes pousses', 'gluten, lait, oeufs', 4),
  ('brunch-naissance', 'dessert', 'Pancakes moelleux, fruits rouges et sirop d''érable', 'gluten, lait, oeufs', 5),
  ('brunch-naissance', 'dessert', 'Verrines de panna cotta vanille et coulis de fruits de la passion', 'lait', 6),
  ('bapteme-communion', 'entree', 'Salade de gambas et mangue, vinaigrette à la passion et coriandre', 'crustacés', 1),
  ('bapteme-communion', 'entree', 'Feuilleté de ris de veau aux champignons des bois et crème de porto', 'gluten, lait, oeufs, sulfites', 2),
  ('bapteme-communion', 'plat', 'Filet mignon de porc ibérique, sauce miel-romarin et écrasé de pommes de terre au beurre noisette', 'lait', 3),
  ('bapteme-communion', 'plat', 'Cailles farcies aux raisins et jus au porto, polenta crémeuse', 'lait, sulfites', 4),
  ('bapteme-communion', 'dessert', 'Gâteau de baptême blanc, mousse vanille et framboises fraîches', 'gluten, lait, oeufs', 5),
  ('bapteme-communion', 'dessert', 'Charlotte aux poires et chocolat blanc', 'gluten, lait, oeufs', 6),
  ('cocktail-dinatoire', 'entree', 'Cuillères de tartare de thon rouge, avocat et yuzu', 'poisson', 1),
  ('cocktail-dinatoire', 'entree', 'Gougères au comté et mini-blinis au caviar d''aubergine', 'gluten, lait, oeufs', 2),
  ('cocktail-dinatoire', 'plat', 'Brochettes de gambas marinées citron-gingembre', 'crustacés', 3),
  ('cocktail-dinatoire', 'plat', 'Mini-burgers de bœuf wagyu et pain brioché', 'gluten, lait, oeufs, sésame', 4),
  ('cocktail-dinatoire', 'dessert', 'Mignardises, tartelettes citron meringuée et éclairs chocolat', 'gluten, lait, oeufs', 5),
  ('cocktail-dinatoire', 'dessert', 'Verrines de mousse chocolat et passion', 'lait, oeufs', 6),
  ('reveillon', 'entree', 'Noix de Saint-Jacques snackées, crème de topinambour et noisettes torréfiées', 'mollusques, lait, fruits à coque', 1),
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
  ('marche-bordeaux', 'entree', 'Salade périgourdine, gésiers confits, noix et vinaigre de Xérès', 'fruits à coque, sulfites', 1),
  ('marche-bordeaux', 'entree', 'Marbré de légumes du marché, vinaigrette à la noisette et fromage de chèvre', 'lait, fruits à coque', 2),
  ('marche-bordeaux', 'plat', 'Entrecôte de bœuf à la bordelaise, moelle poêlée et pommes grenaille', 'lait, sulfites', 3),
  ('marche-bordeaux', 'plat', 'Souris d''agneau confite aux sarments, haricots tarbais et jus au vin rouge', 'sulfites', 4),
  ('marche-bordeaux', 'dessert', 'Cannelés de Bordeaux tièdes et crème glacée vanille', 'gluten, lait, oeufs', 5),
  ('marche-bordeaux', 'dessert', 'Mille-feuille vanille, caramel au beurre salé', 'gluten, lait, oeufs', 6),
  ('fete-vegetale', 'entree', 'Tartare de betteraves et pomme verte, crème d''amande et pickles', 'fruits à coque', 1),
  ('fete-vegetale', 'entree', 'Velouté de panais et lait de coco, huile de noisette et chips de patate douce', 'fruits à coque', 2),
  ('fete-vegetale', 'plat', 'Wellington de légumes d''automne, jus aux champignons et purée de pois chiches', 'gluten', 3),
  ('fete-vegetale', 'plat', 'Gnocchis de patate douce, crème de sésame noir et pousses de moutarde', 'gluten, sésame', 4),
  ('fete-vegetale', 'dessert', 'Tarte au chocolat noir et sel de Guérande, crème de coco', 'gluten, fruits à coque', 5),
  ('fete-vegetale', 'dessert', 'Poire pochée au vin épicé et sablé amande', 'gluten, fruits à coque, sulfites', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), allergens = VALUES(allergens);

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Client',
  'Test',
  '0600000000',
  'test@vite-et-gourmand.fr',
  '1 rue de Bordeaux, 33000 Bordeaux',
  '$2a$12$X6u5K9ts2AxT4KGuQxld1.6sg/cj.ap6cYFNL1wbR83ZAHANT/Y/C',
  'client'
)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name), last_name = VALUES(last_name),
  password_hash = VALUES(password_hash), role = VALUES(role);

INSERT INTO users (id, first_name, last_name, phone, email, address, password_hash, role)
VALUES (
  '00000000-0000-4000-8000-000000000002',
  'Administrateur',
  'Vite et Gourmand',
  '0600000001',
  'admin@vite-et-gourmand.fr',
  'Bordeaux',
  '$2a$12$dZ94gbewS6K1qYaLWzdQuOPiro2ftSWhMvAbKX5KDOHuz7buqLXVu',
  'admin'
)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name), last_name = VALUES(last_name),
  password_hash = VALUES(password_hash), role = VALUES(role);
