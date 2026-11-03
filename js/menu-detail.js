// Copie de secours : le menu reste affiché même si la base de données n'est pas à jour.
const MENUS_PAR_DEFAUT = {
  "banquet-mariage": {
    id: "banquet-mariage",
    name: "Le banquet de mariage",
    price: 95,
    theme: "Événement",
    regime: "classique",
    description: "Le grand repas de réception en cinq temps, pensé pour le plus beau jour : produits d'exception, dressage à l'assiette et pièce montée signature.",
    image_path: "images/images/menu-reveillon.jpg",
    minimum: 40,
    stock: 3,
    conditions_text: "Commande au minimum 30 jours avant la prestation. Dégustation offerte sur rendez-vous. Service et dressage assurés par notre équipe. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Foie gras de canard mi-cuit, chutney de figues et brioche toastée", "allergens": "gluten, oeufs, lait"}, {"dish_type": "entree", "name": "Noix de Saint-Jacques snackées, crème de topinambour et noisettes torréfiées", "allergens": "mollusques, lait, fruits à coque"}, {"dish_type": "plat", "name": "Filet de bœuf Rossini, jus truffé, gratin dauphinois et légumes glacés", "allergens": "lait, gluten, céleri"}, {"dish_type": "plat", "name": "Pavé de turbot, beurre blanc au champagne et risotto crémeux aux asperges", "allergens": "poisson, lait"}, {"dish_type": "dessert", "name": "Pièce montée de choux, crème vanille de Madagascar et caramel", "allergens": "gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Macarons assortis et mignardises du chef", "allergens": "fruits à coque, oeufs, lait"}]
  },
  "repas-anniversaire": {
    id: "repas-anniversaire",
    name: "Le dîner d'anniversaire",
    price: 62,
    theme: "Événement",
    regime: "classique",
    description: "Un dîner raffiné pour célébrer un anniversaire, avec un entremets sur mesure aux couleurs de la fête.",
    image_path: "images/images/menu-printemps.jpg",
    minimum: 10,
    stock: 6,
    conditions_text: "Commande au minimum 10 jours avant la prestation. Message et parfum de l'entremets à préciser à la commande. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Carpaccio de bœuf, copeaux de parmesan, roquette et huile de truffe", "allergens": "lait"}, {"dish_type": "entree", "name": "Velouté de petits pois à la menthe et crème fouettée au citron", "allergens": "lait"}, {"dish_type": "plat", "name": "Suprême de volaille fermière, sauce au vin jaune et morilles, pommes fondantes", "allergens": "lait, sulfites"}, {"dish_type": "plat", "name": "Dos de cabillaud rôti, beurre citronné et légumes de printemps", "allergens": "poisson, lait"}, {"dish_type": "dessert", "name": "Entremets personnalisé chocolat noir, framboise et feuilleté praliné", "allergens": "gluten, lait, oeufs, fruits à coque"}]
  },
  "brunch-naissance": {
    id: "brunch-naissance",
    name: "Le brunch de naissance",
    price: 58,
    theme: "Événement",
    regime: "classique",
    description: "Un brunch délicat et généreux pour accueillir bébé en famille : salé fin, douceurs et pièces festives en dragées.",
    image_path: "images/images/menu-marche.jpg",
    minimum: 8,
    stock: 5,
    conditions_text: "Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Blinis, saumon gravlax maison, crème à l'aneth et œufs de truite", "allergens": "gluten, poisson, lait, oeufs"}, {"dish_type": "entree", "name": "Mini-croissants au jambon de Bayonne et fromage frais aux herbes", "allergens": "gluten, lait"}, {"dish_type": "plat", "name": "Œufs cocotte à la crème et ciboulette, mouillettes de pain de campagne", "allergens": "oeufs, lait, gluten"}, {"dish_type": "plat", "name": "Quiche fine aux asperges, chèvre frais et salade de jeunes pousses", "allergens": "gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Pancakes moelleux, fruits rouges et sirop d'érable", "allergens": "gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Verrines de panna cotta vanille et coulis de fruits de la passion", "allergens": "lait"}]
  },
  "bapteme-communion": {
    id: "bapteme-communion",
    name: "Le repas de baptême et de communion",
    price: 72,
    theme: "Événement",
    regime: "classique",
    description: "Un repas de fête en quatre temps pour un baptême, une communion ou une confirmation, avec une pièce montée à partager.",
    image_path: "images/images/menu-reveillon.jpg",
    minimum: 12,
    stock: 4,
    conditions_text: "Commande au minimum 21 jours avant la prestation. Personnalisation de la pièce montée possible (couleurs, dragées). Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Terrine de lotte au safran, mayonnaise citronnée et salade croquante", "allergens": "poisson, oeufs"}, {"dish_type": "entree", "name": "Tartelette fine aux champignons des bois et jambon cru", "allergens": "gluten, lait, oeufs"}, {"dish_type": "plat", "name": "Rôti de veau basse température, sauce aux morilles, gratin de pommes de terre", "allergens": "lait, sulfites"}, {"dish_type": "plat", "name": "Pavé de saumon, sauce au beurre blanc et fondue de poireaux", "allergens": "poisson, lait"}, {"dish_type": "dessert", "name": "Pièce montée de choux, dragées et nougatine", "allergens": "gluten, lait, oeufs, fruits à coque"}, {"dish_type": "dessert", "name": "Fraisier à la crème mousseline", "allergens": "gluten, lait, oeufs"}]
  },
  "cocktail-dinatoire": {
    id: "cocktail-dinatoire",
    name: "Le cocktail de cérémonie",
    price: 68,
    theme: "Événement",
    regime: "classique",
    description: "Un cocktail de 14 pièces par personne, salées et sucrées, à partager debout : idéal pour un vin d'honneur, une réception ou une inauguration.",
    image_path: "images/images/menu-marche.jpg",
    minimum: 20,
    stock: 6,
    conditions_text: "Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures. Prévoir des tables hautes ou un buffet pour la mise en place.",
    dishes: [{"dish_type": "entree", "name": "Cuillères de tartare de saumon, avocat et citron vert", "allergens": "poisson"}, {"dish_type": "entree", "name": "Gougères au comté et mini-blinis au caviar d'aubergine", "allergens": "gluten, lait, oeufs"}, {"dish_type": "plat", "name": "Brochettes de magret de canard, sauce teriyaki et sésame", "allergens": "sésame, soja"}, {"dish_type": "plat", "name": "Mini-burgers de bœuf wagyu et pain brioché", "allergens": "gluten, lait, oeufs, sésame"}, {"dish_type": "dessert", "name": "Mignardises, tartelettes citron meringuée et éclairs chocolat", "allergens": "gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Verrines de mousse chocolat et passion", "allergens": "lait, oeufs"}]
  },
  "reveillon": {
    id: "reveillon",
    name: "Le réveillon d'exception",
    price: 89,
    theme: "Noël",
    regime: "classique",
    description: "Un menu de Noël gastronomique, des produits de fête à la bûche signature, pour une table inoubliable.",
    image_path: "images/images/menu-reveillon.jpg",
    minimum: 8,
    stock: 4,
    conditions_text: "Commande au minimum 21 jours avant la prestation. Réservation conseillée dès novembre. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Foie gras de canard mi-cuit, chutney de figues et pain d'épices", "allergens": "gluten, oeufs, lait"}, {"dish_type": "entree", "name": "Huîtres de Marennes-Oléron, mignonnette au vinaigre de champagne", "allergens": "mollusques, sulfites"}, {"dish_type": "plat", "name": "Chapon rôti aux marrons et truffe noire, jus corsé et purée de céleri", "allergens": "lait, céleri"}, {"dish_type": "plat", "name": "Homard bleu, bisque légère et gnocchis dorés", "allergens": "crustacés, gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Bûche chocolat grand cru, cœur praliné et feuilleté croustillant", "allergens": "gluten, lait, oeufs, fruits à coque"}, {"dish_type": "dessert", "name": "Truffes au chocolat et papillotes du chef", "allergens": "lait, fruits à coque"}]
  },
  "dejeuner-paques": {
    id: "dejeuner-paques",
    name: "Le déjeuner de Pâques",
    price: 74,
    theme: "Pâques",
    regime: "classique",
    description: "Le repas de Pâques en famille revisité : printemps en entrée, agneau de lait au four et desserts au chocolat.",
    image_path: "images/images/menu-printemps.jpg",
    minimum: 6,
    stock: 5,
    conditions_text: "Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Asperges blanches, œuf mollet, sabayon au citron et jambon cru", "allergens": "oeufs, lait"}, {"dish_type": "entree", "name": "Velouté de cresson, crème de chèvre et croûtons dorés", "allergens": "lait, gluten"}, {"dish_type": "plat", "name": "Gigot d'agneau de lait rôti au thym et à l'ail, jus réduit et gratin dauphinois", "allergens": "lait"}, {"dish_type": "plat", "name": "Carré d'agneau en croûte d'herbes, flan de petits pois et carottes fanes", "allergens": "gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Nid de Pâques chocolat noir, mousse praliné et œufs en sucre", "allergens": "lait, oeufs, fruits à coque"}, {"dish_type": "dessert", "name": "Tarte fine aux fraises, crème légère à la vanille", "allergens": "gluten, lait, oeufs"}]
  },
  "marche-bordeaux": {
    id: "marche-bordeaux",
    name: "Le dîner gastronomique de Bordeaux",
    price: 79,
    theme: "Classique",
    regime: "classique",
    description: "Un dîner de famille ou entre amis, inspiré de la cuisine bordelaise : produits du Sud-Ouest, sauces au vin et desserts maison.",
    image_path: "images/images/menu-marche.jpg",
    minimum: 6,
    stock: 5,
    conditions_text: "Commande au minimum 10 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Terrine de foie gras des Landes, confit d'oignons au vin rouge et pain de campagne", "allergens": "gluten, sulfites"}, {"dish_type": "entree", "name": "Marbré de légumes du marché, vinaigrette à la noisette et fromage de chèvre", "allergens": "lait, fruits à coque"}, {"dish_type": "plat", "name": "Entrecôte de bœuf à la bordelaise, moelle poêlée et pommes grenaille", "allergens": "lait, sulfites"}, {"dish_type": "plat", "name": "Magret de canard rôti, sauce au miel et aux épices, purée de patates douces", "allergens": "lait"}, {"dish_type": "dessert", "name": "Cannelés de Bordeaux tièdes et crème glacée vanille", "allergens": "gluten, lait, oeufs"}, {"dish_type": "dessert", "name": "Mille-feuille vanille, caramel au beurre salé", "allergens": "gluten, lait, oeufs"}]
  },
  "fete-vegetale": {
    id: "fete-vegetale",
    name: "La table végétale d'exception",
    price: 64,
    theme: "Événement",
    regime: "vegan",
    description: "Une gastronomie 100 % végétale : produits de saison travaillés comme à la grande table, sans aucun produit animal.",
    image_path: "images/images/menu-vegetal.jpg",
    minimum: 10,
    stock: 3,
    conditions_text: "Commande au minimum 14 jours avant la prestation. Conservation au réfrigérateur et consommation sous 24 heures.",
    dishes: [{"dish_type": "entree", "name": "Tartare de betteraves et pomme verte, crème d'amande et pickles", "allergens": "fruits à coque"}, {"dish_type": "entree", "name": "Velouté de topinambour à l'huile de noisette et chips de panais", "allergens": "fruits à coque"}, {"dish_type": "plat", "name": "Wellington de légumes d'automne, jus aux champignons et purée de pois chiches", "allergens": "gluten"}, {"dish_type": "plat", "name": "Risotto de cèpes à la crème d'avoine et éclats de noisette", "allergens": "gluten, fruits à coque"}, {"dish_type": "dessert", "name": "Tarte au chocolat noir et sel de Guérande, crème de coco", "allergens": "gluten, fruits à coque"}, {"dish_type": "dessert", "name": "Poire pochée au vin épicé et sablé amande", "allergens": "gluten, fruits à coque, sulfites"}]
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

        const typesPlats = { entree: 'starter', plat: 'main', dessert: 'dessert' };
        Object.entries(typesPlats).forEach(([typeBase, typePage]) => {
          const liste = document.querySelector(`#menu-detail-${typePage}-list`);
          liste.replaceChildren();
          (menu.dishes || []).filter((plat) => plat.dish_type === typeBase).forEach((plat) => {
            const item = document.createElement('li');
            item.textContent = plat.name;
            const detail = document.createElement('span');
            detail.className = 'allergen';
            detail.textContent = `Allerg?nes : ${plat.allergens}`;
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
