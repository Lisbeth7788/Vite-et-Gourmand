const pageDetail = document.querySelector('#menu-detail');

if (pageDetail) {
  const identifiantMenu = new URLSearchParams(window.location.search).get('menu');

  if (identifiantMenu) {
    async function chargerDetailMenu() {
      try {
        const response = await fetch(`api/menus.php?id=${encodeURIComponent(identifiantMenu)}`);
        if (!response.ok) throw new Error('Menu introuvable.');
        const menu = await response.json();
        document.title = `${menu.name} - Vite et Gourmand`;
        document.querySelector('#menu-detail-category').textContent = `${menu.theme} · ${menu.regime}`;
        document.querySelector('#menu-detail-title').textContent = menu.name;
        document.querySelector('#menu-detail-description').textContent = menu.description;
        document.querySelector('#menu-detail-price').firstChild.textContent = `${Number(menu.price).toFixed(2).replace('.', ',')} € `;
        document.querySelector('#menu-detail-people').textContent = `${menu.minimum} personnes`;
        document.querySelector('#menu-detail-stock').textContent = `${menu.stock} commandes`;
        document.querySelector('#menu-detail-regime').textContent = menu.regime;
        const image = document.querySelector('#menu-detail-image');
        image.src = menu.image_path;
        image.alt = menu.name;
        const orderLink = document.querySelector('#menu-order-link');
        const commandeUrl = `commande.html?menu=${menu.id}`;
        orderLink.href = `connexion.html?redirect=${encodeURIComponent(commandeUrl)}`;
        document.querySelector('#menu-conditions').textContent = menu.conditions_text || 'Aucune condition particulière communiquée.';

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
