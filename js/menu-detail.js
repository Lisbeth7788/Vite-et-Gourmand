const pageDetail = document.querySelector('#menu-detail');

if (pageDetail) {
  const identifiantMenu = new URLSearchParams(window.location.search).get('menu');

  if (identifiantMenu) {
    async function chargerDetailMenu() {
      try {
        const response = await fetch(`api/menus.php?id=${encodeURIComponent(identifiantMenu)}`, { cache: 'no-store' });
        if (response.status === 404) throw new Error('Menu introuvable.');
        if (!response.ok) throw new Error('Ce menu est temporairement indisponible.');
        const menu = await response.json();
        document.title = `${menu.name} - Vite et Gourmand`;
        document.querySelector('#menu-detail-category').textContent = `${menu.theme} · ${menu.regime}`;
        document.querySelector('#menu-detail-title').textContent = menu.name;
        document.querySelector('#menu-detail-description').textContent = menu.description;
        const euros = (montant) => `${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
        document.querySelector('#menu-detail-price').textContent = `${euros(Number(menu.price))} par personne`;
        document.querySelector('#menu-detail-people').textContent = menu.minimum > 1 ? `${menu.minimum} personnes` : "À partir d’une personne";
        document.querySelector('#menu-detail-total').textContent = `${euros(Number(menu.price) * Number(menu.minimum))} pour ${menu.minimum} personne${Number(menu.minimum) > 1 ? 's' : ''} (hors livraison)`;
        document.querySelector('#menu-detail-stock').textContent = Number(menu.stock) > 0
          ? `${menu.stock} commande${Number(menu.stock) > 1 ? 's' : ''} possible${Number(menu.stock) > 1 ? 's' : ''}`
          : 'Indisponible actuellement';
        document.querySelector('#menu-detail-regime').textContent = menu.regime;
        const galerie = (menu.images && menu.images.length ? menu.images : [menu.image_path]).filter(Boolean);
        const image = document.querySelector('#menu-detail-image');
        const vignettes = document.querySelector('#menu-detail-thumbnails');
        const afficherImage = (chemin, numero) => {
          image.src = chemin;
          image.alt = `Illustration du menu ${menu.name} - photo ${numero}`;
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
        lienReservation.hidden = Number(menu.stock) <= 0;
        lienReservation.onclick = async (evenement) => {
          evenement.preventDefault();
          try {
            const reponse = await fetch('api/auth/session.php', { credentials: 'same-origin', cache: 'no-store' });
            if (reponse.ok) {
              window.location.href = adresseReservation;
            } else if (reponse.status === 401) {
              window.location.href = `connexion.html?redirect=${encodeURIComponent(adresseReservation)}`;
            } else {
              throw new Error('Vérification de la connexion impossible. Veuillez réessayer.');
            }
          } catch (erreurSession) {
            console.error('Vérification de la connexion impossible :', erreurSession);
            window.showToast('Vérification de la connexion impossible. Veuillez réessayer.', true);
          }
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
            detail.textContent = `Allergènes : ${plat.allergens}`;
            item.appendChild(detail);
            liste.appendChild(item);
          });
          document.querySelector('.detail-layout').hidden = false;
          document.querySelector('.detail-information').hidden = false;
        });
      } catch (error) {
        console.error('Chargement du menu impossible :', error);
        document.querySelector('#menu-detail-title').textContent = error.message || 'Ce menu est temporairement indisponible.';
        document.querySelector('#menu-detail-description').textContent = '';
        document.querySelector('#menu-detail-category').textContent = '';
        document.querySelector('.detail-layout').hidden = true;
        document.querySelector('.detail-information').hidden = true;
      }
    }
    chargerDetailMenu();
  } else {
    document.querySelector('#menu-detail-title').textContent = 'Aucun menu sélectionné.';
  }
}
