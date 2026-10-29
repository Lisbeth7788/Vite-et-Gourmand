const CONDITIONS_MENUS = 'Commande une semaine à l’avance. Annulation 24 h avant la prestation.';

const creerMenu = (id, name, price, theme, description, image, stock, plats) => ({
  id,
  name,
  price,
  theme,
  regime: 'classique',
  description,
  image_path: image,
  minimum: 1,
  stock,
  conditions_text: CONDITIONS_MENUS,
  dishes: ['entree', 'plat', 'dessert'].map((dish_type, i) => ({ dish_type, name: plats[i][0], allergens: plats[i][1] }))
});

// Copie de secours : le titre reste personnalisé même si la base de données n'est pas à jour.
const MENUS_PAR_DEFAUT = {
  'marche-bordeaux': creerMenu('marche-bordeaux', 'Le marché de Bordeaux', 24, 'Midi',
    'La formule du 12h00, composée chaque jour avec les produits de saison et du jour.', 'images/images/menu-marche.jpg', 5,
    [['Entrée du jour selon le marché', 'selon les produits du jour'], ['Plat du jour selon le marché', 'selon les produits du jour'], ['Dessert du jour selon le marché', 'selon les produits du jour']]),
  'formule-soir': creerMenu('formule-soir', 'La Table du Soir', 34, 'Soir',
    'Une formule généreuse et raffinée pour vos dîners.', 'images/images/menu-reveillon.jpg', 4,
    [['Tartare de saumon, avocat et citron vert', 'poisson'], ['Magret de canard laqué au miel et gingembre, patates douces rôties', 'aucun allergène majeur déclaré'], ['Cœur coulant au chocolat et mangue fraîche', 'gluten, lait, oeufs']]),
  'formule-etudiant': creerMenu('formule-etudiant', 'Le Campus Gourmand', 15, 'Étudiant',
    'Une formule complète à petit prix pour les étudiants et les repas de groupe.', 'images/images/menu-printemps.jpg', 10,
    [['Samossas de légumes et chutney de mangue', 'gluten'], ['Poulet tikka masala et riz basmati', 'lait'], ['Riz au lait de coco et fruits de la passion', 'fruits à coque']]),
  'menu-enfant': creerMenu('menu-enfant', 'Le Petit Gourmet', 12, 'Enfant',
    'Un repas adapté aux plus jeunes, avec des plats simples et gourmands.', 'images/images/menu-vegetal.jpg', 10,
    [['Bâtonnets de légumes et sauce yaourt-citron', 'lait'], ['Wrap de poulet croustillant et frites de patate douce', 'gluten, oeufs'], ['Brochette de fruits exotiques et chocolat fondu', 'lait']])
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
        if (menuParDefaut) menu = { ...menu, conditions_text: CONDITIONS_MENUS, minimum: 1 };
        document.title = `${menu.name} - Vite et Gourmand`;
        document.querySelector('#menu-detail-category').textContent = `${menu.theme} · ${menu.regime}`;
        document.querySelector('#menu-detail-title').textContent = menu.name;
        document.querySelector('#menu-detail-description').textContent = menu.description;
        document.querySelector('#menu-detail-price').firstChild.textContent = `${Number(menu.price).toFixed(2).replace('.', ',')} € `;
        document.querySelector('#menu-detail-people').textContent = menu.minimum > 1 ? `${menu.minimum} personnes` : "À partir d’une personne";
        document.querySelector('#menu-detail-stock').textContent = `${menu.stock} commandes`;
        document.querySelector('#menu-detail-regime').textContent = menu.regime;
        const image = document.querySelector('#menu-detail-image');
        image.src = menu.image_path;
        image.alt = menu.name;
        const orderLink = document.querySelector('#menu-order-link');
        const commandeUrl = `commande.html?menu=${menu.id}`;
        orderLink.href = `connexion.html?redirect=${encodeURIComponent(commandeUrl)}`;
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

        const dishes = new Map(menu.dishes.map((dish) => [dish.dish_type, dish]));
        ['starter', 'main', 'dessert'].forEach((type) => {
          let typePlat = 'dessert';
          if (type === 'starter') typePlat = 'entree';
          if (type === 'main') typePlat = 'plat';
          const dish = dishes.get(typePlat);
          if (!dish) return;
          document.querySelector(`#menu-detail-${type}`).textContent = dish.name;
          document.querySelector(`#menu-detail-${type}-allergens`).textContent = `Allergènes : ${dish.allergens || 'aucun allergène déclaré'}`;
        });
      } catch (error) {
        document.querySelector('#menu-detail-title').textContent = 'Menu introuvable';
      }
    }
    chargerDetailMenu();
  }
}
