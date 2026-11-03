// Copie de secours : le menu reste affiché même si la base de données n'est pas à jour.
const MENUS_PAR_DEFAUT = {
  "marche-bordeaux": {
    id: "marche-bordeaux",
    name: "Le marché de Bordeaux",
    price: 24,
    theme: "Classique",
    regime: "classique",
    description: "Un repas de famille ou entre amis, composé avec les produits de saison du marché.",
    image_path: "images/images/menu-marche.jpg",
    minimum: 6,
    stock: 5,
    conditions_text: "Commande au minimum 7 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Salade de chèvre frais et légumes de saison", "allergens": "lait, fruits à coque"}, {"dish_type": "plat", "name": "Bœuf braisé, pommes de terre grenaille et légumes rôtis", "allergens": "aucun allergène majeur déclaré"}, {"dish_type": "dessert", "name": "Tarte fine aux pommes caramélisées", "allergens": "gluten, lait, oeufs"}]
  },
  "reveillon": {
    id: "reveillon",
    name: "Le réveillon généreux",
    price: 38,
    theme: "Noël",
    regime: "classique",
    description: "Une sélection festive pour réunir vos proches autour de la table de Noël.",
    image_path: "images/images/menu-reveillon.jpg",
    minimum: 8,
    stock: 4,
    conditions_text: "Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Velouté de courge et éclats de noisette", "allergens": "fruits à coque"}, {"dish_type": "plat", "name": "Volaille rôtie, marrons et légumes de fête", "allergens": "aucun allergène majeur déclaré"}, {"dish_type": "dessert", "name": "Bûche chocolat et vanille", "allergens": "gluten, lait, oeufs"}]
  },
  "dejeuner-paques": {
    id: "dejeuner-paques",
    name: "Le déjeuner de Pâques",
    price: 34,
    theme: "Pâques",
    regime: "classique",
    description: "Le repas de Pâques en famille : agneau tendre et desserts au chocolat.",
    image_path: "images/images/menu-printemps.jpg",
    minimum: 6,
    stock: 5,
    conditions_text: "Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Asperges vertes, œuf mollet et copeaux de parmesan", "allergens": "oeufs, lait"}, {"dish_type": "plat", "name": "Gigot d'agneau rôti au thym, gratin dauphinois", "allergens": "lait"}, {"dish_type": "dessert", "name": "Nid de Pâques au chocolat et fruits rouges", "allergens": "gluten, lait, oeufs"}]
  },
  "cocktail-dinatoire": {
    id: "cocktail-dinatoire",
    name: "Le cocktail de cérémonie",
    price: 28,
    theme: "Événement",
    regime: "classique",
    description: "Une sélection de pièces salées et sucrées à partager debout, idéale pour un vin d'honneur, une réception ou une inauguration.",
    image_path: "images/images/menu-marche.jpg",
    minimum: 20,
    stock: 6,
    conditions_text: "Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures. Prévoir une table ou un buffet pour la mise en place.",
    dishes: [{"dish_type": "entree", "name": "Verrines de saumon fumé et fromage frais, mini-quiches", "allergens": "poisson, lait, gluten, oeufs"}, {"dish_type": "plat", "name": "Brochettes de poulet mariné, mini-burgers et navettes garnies", "allergens": "gluten, lait, sésame"}, {"dish_type": "dessert", "name": "Mignardises, mini-tartelettes et verrines de fruits", "allergens": "gluten, lait, oeufs, fruits à coque"}]
  },
  "repas-anniversaire": {
    id: "repas-anniversaire",
    name: "Le repas d'anniversaire",
    price: 30,
    theme: "Événement",
    regime: "classique",
    description: "Un repas convivial pour fêter un anniversaire, avec un gâteau personnalisable.",
    image_path: "images/images/menu-printemps.jpg",
    minimum: 10,
    stock: 6,
    conditions_text: "Commande au minimum 7 jours avant la prestation. Message sur le gâteau à préciser à la commande. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Tarte fine tomates confites et chèvre, salade croquante", "allergens": "gluten, lait"}, {"dish_type": "plat", "name": "Suprême de volaille crème de champagne, gratin de légumes", "allergens": "lait"}, {"dish_type": "dessert", "name": "Gâteau d'anniversaire chocolat-framboise", "allergens": "gluten, lait, oeufs"}]
  },
  "brunch-naissance": {
    id: "brunch-naissance",
    name: "Le brunch de naissance",
    price: 27,
    theme: "Événement",
    regime: "classique",
    description: "Un brunch doux et gourmand pour accueillir bébé en famille, salé et sucré.",
    image_path: "images/images/menu-marche.jpg",
    minimum: 8,
    stock: 5,
    conditions_text: "Commande au minimum 7 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Mini-croissants garnis, saumon fumé et fromage frais", "allergens": "gluten, poisson, lait"}, {"dish_type": "plat", "name": "Œufs brouillés, charcuteries fines et salade de saison", "allergens": "oeufs"}, {"dish_type": "dessert", "name": "Pancakes, fruits frais et dragées", "allergens": "gluten, lait, oeufs"}]
  },
  "bapteme-communion": {
    id: "bapteme-communion",
    name: "Le repas de baptême et de communion",
    price: 36,
    theme: "Événement",
    regime: "classique",
    description: "Un repas de fête pour un baptême, une communion ou une confirmation, avec un dessert à partager.",
    image_path: "images/images/menu-reveillon.jpg",
    minimum: 12,
    stock: 4,
    conditions_text: "Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Terrine de poisson, mayonnaise citronnée et mesclun", "allergens": "poisson, oeufs"}, {"dish_type": "plat", "name": "Rôti de veau sauce aux morilles, gratin dauphinois", "allergens": "lait"}, {"dish_type": "dessert", "name": "Pièce montée de choux et dragées", "allergens": "gluten, lait, oeufs"}]
  },
  "banquet-mariage": {
    id: "banquet-mariage",
    name: "Le banquet de mariage",
    price: 55,
    theme: "Événement",
    regime: "classique",
    description: "Un repas de réception en trois services pour célébrer le plus beau jour, avec dressage soigné.",
    image_path: "images/images/menu-reveillon.jpg",
    minimum: 40,
    stock: 3,
    conditions_text: "Commande au minimum 21 jours avant la prestation. Dégustation possible sur rendez-vous. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Foie gras maison, chutney de figues et pain d'épices", "allergens": "gluten, fruits à coque"}, {"dish_type": "plat", "name": "Filet de bœuf sauce au poivre, gratin et légumes glacés", "allergens": "lait, gluten"}, {"dish_type": "dessert", "name": "Pièce montée de choux et caramel", "allergens": "gluten, lait, oeufs"}]
  },
  "fete-vegetale": {
    id: "fete-vegetale",
    name: "La fête végétale",
    price: 32,
    theme: "Événement",
    regime: "vegan",
    description: "Une formule entièrement végétale pour vos événements professionnels ou privés.",
    image_path: "images/images/menu-vegetal.jpg",
    minimum: 10,
    stock: 3,
    conditions_text: "Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Gaspacho de petits pois et croustillant de pois chiches", "allergens": "aucun allergène majeur déclaré"}, {"dish_type": "plat", "name": "Curry de légumes et lentilles corail, riz basmati", "allergens": "aucun allergène majeur déclaré"}, {"dish_type": "dessert", "name": "Mousse au chocolat noir et lait de coco", "allergens": "aucun allergène majeur déclaré"}]
  }
};

const pageDetail = document.querySelector('#menu-detail');

if (pageDetail) {
  const identifiantMenu = new URLSearchParams(window.location.search).get('menu');

  if (identifiantMenu) {
    async function chargerDetailMenu() {
      try {
        const menuParDefaut = MENUS_PAR_DEFAUT[identifiantMenu];
        let menu = menuParDefaut;
        try {
          const response = await fetch(`api/menus.php?id=${encodeURIComponent(identifiantMenu)}`);
          if (response.ok) menu = await response.json();
        } catch (erreurReseau) {
          menu = menuParDefaut;
        }
        if (!menu) throw new Error('Menu introuvable.');
        document.title = `${menu.name} - Vite et Gourmand`;
        document.querySelector('#menu-detail-category').textContent = `${menu.theme} · ${menu.regime}`;
        document.querySelector('#menu-detail-title').textContent = menu.name;
        document.querySelector('#menu-detail-description').textContent = menu.description;
        document.querySelector('#menu-detail-price').firstChild.textContent = `${Number(menu.price).toFixed(2).replace('.', ',')} € `;
        document.querySelector('#menu-detail-people').textContent = menu.minimum > 1 ? `${menu.minimum} personnes` : "À partir d’une personne";
        document.querySelector('#menu-detail-regime').textContent = menu.regime;
        const galerie = (menu.images && menu.images.length ? menu.images : [menu.image_path]).filter(Boolean);
        const image = document.querySelector('#menu-detail-image');
        const vignettes = document.querySelector('#menu-detail-thumbnails');
        const afficherImage = (chemin, numero) => {
          image.src = chemin;
          image.alt = `${menu.name} - photo ${numero}`;
          vignettes.querySelectorAll('button').forEach((bouton, i) => bouton.setAttribute('aria-current', String(i === numero - 1)));
        };
        vignettes.replaceChildren();
        if (galerie.length > 1) {
          galerie.forEach((chemin, i) => {
            const bouton = document.createElement('button');
            bouton.type = 'button';
            bouton.setAttribute('aria-label', `Voir la photo ${i + 1} sur ${galerie.length}`);
            const miniature = document.createElement('img');
            miniature.src = chemin;
            miniature.alt = '';
            miniature.loading = 'lazy';
            bouton.append(miniature);
            bouton.addEventListener('click', () => afficherImage(chemin, i + 1));
            vignettes.append(bouton);
          });
        }
        afficherImage(galerie[0] || 'images/images/menu-marche.jpg', 1);
        const lienReservation = document.querySelector('#menu-order-link');
        const adresseReservation = `reservation.html?menu=${encodeURIComponent(menu.id)}`;
        lienReservation.href = adresseReservation;
        lienReservation.onclick = async (evenement) => {
          evenement.preventDefault();
          let connecte = false;
          try {
            const reponse = await fetch('api/auth/session.php', { credentials: 'same-origin', cache: 'no-store' });
            connecte = reponse.ok;
          } catch (erreurSession) {
            connecte = false;
          }
          window.location.href = connecte
            ? adresseReservation
            : `connexion.html?redirect=${encodeURIComponent(adresseReservation)}`;
        };
        const conditionsList = document.querySelector('#menu-conditions');
        conditionsList.replaceChildren();
        (menu.conditions_text || 'Aucune condition particulière communiquée.')
          .split(/(?<=\.)\s+/)
          .filter(Boolean)
          .forEach((phrase) => {
            const item = document.createElement('li');
            item.textContent = phrase;
            conditionsList.appendChild(item);
          });

        const choix = {
          starter: [['Tartare de saumon, avocat et citron vert', 'poisson'], ['Samossas de légumes et chutney de mangue', 'gluten'], ['Bâtonnets de légumes et sauce yaourt-citron', 'lait']],
          main: [['Magret de canard laqué au miel et gingembre, patates douces rôties', 'aucun allergène majeur déclaré'], ['Poulet tikka masala et riz basmati', 'lait'], ['Wrap de poulet croustillant et frites de patate douce', 'gluten, oeufs']],
          dessert: [['Cœur coulant au chocolat et mangue fraîche', 'gluten, lait, oeufs'], ['Riz au lait de coco et fruits de la passion', 'fruits à coque'], ['Brochette de fruits exotiques et chocolat fondu', 'lait']]
        };
        Object.entries(choix).forEach(([type, plats]) => {
          const liste = document.querySelector(`#menu-detail-${type}-list`);
          liste.replaceChildren();
          [...plats].sort(() => Math.random() - 0.5).forEach(([nom, allergenes]) => {
            const item = document.createElement('li');
            item.textContent = nom;
            const detail = document.createElement('span');
            detail.className = 'allergen';
            detail.textContent = `Allergènes : ${allergenes}`;
            item.appendChild(detail);
            liste.appendChild(item);
          });
        });
      } catch (error) {
        document.querySelector('#menu-detail-title').textContent = 'Menu introuvable';
      }
    }
    chargerDetailMenu();
  }
}
