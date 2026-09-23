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

ALTER TABLE orders ADD COLUMN IF NOT EXISTS material_loaned BOOLEAN NOT NULL DEFAULT FALSE;
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
  ('marche-bordeaux', 'Le marché de Bordeaux', 24, 6, 'classique', 'classique', 'Une formule équilibrée avec produits de saison.', 'images/images/menu-marche.jpg', 'Commande au minimum 7 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.', 5),
  ('reveillon', 'Le réveillon généreux', 38, 8, 'noel', 'classique', 'Une sélection festive pour réunir vos proches.', 'images/images/menu-reveillon.jpg', 'Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur.', 4),
  ('jardin-printemps', 'Le jardin de printemps', 29, 6, 'paques', 'vegetarien', 'Un menu végétarien coloré et de saison.', 'images/images/menu-printemps.jpg', 'Commande au minimum 7 jours avant la prestation.', 6),
  ('fete-vegetale', 'La fête végétale', 32, 10, 'evenement', 'vegan', 'Une formule entièrement végétale pour vos événements professionnels ou privés.', 'images/images/menu-vegetal.jpg', 'Commande au minimum 10 jours avant la prestation.', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price = VALUES(price), minimum_people = VALUES(minimum_people),
  theme = VALUES(theme), regime = VALUES(regime), description = VALUES(description),
  image_path = VALUES(image_path), conditions_text = VALUES(conditions_text), stock = VALUES(stock);

INSERT INTO menu_dishes (menu_id, dish_type, name, allergens, position)
VALUES
  ('marche-bordeaux', 'entree', 'Salade de chèvre frais et légumes de saison', 'lait, fruits à coque', 1),
  ('marche-bordeaux', 'plat', 'Boeuf braisé, pommes de terre grenaille et légumes rôtis', 'aucun allergène majeur déclaré', 2),
  ('marche-bordeaux', 'dessert', 'Tarte fine aux pommes caramélisées', 'gluten, lait, oeufs', 3),
  ('reveillon', 'entree', 'Velouté de courge et éclats de noisette', 'fruits à coque', 1),
  ('reveillon', 'plat', 'Volaille rôtie et légumes de fête', 'aucun allergène majeur déclaré', 2),
  ('reveillon', 'dessert', 'Bûche chocolat et vanille', 'gluten, lait, oeufs', 3)
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
