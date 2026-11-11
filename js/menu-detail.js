const pageDetail = document.querySelector('#detail-menu');

if (pageDetail) {
  const identifiantMenu = new URLSearchParams(window.location.search).get('menu');

  if (identifiantMenu) {
    async function chargerDetailMenu() {
      try {
        const reponse = await fetch(`api/menus.php?id=${encodeURIComponent(identifiantMenu)}`, { cache: 'no-store' });
        if (reponse.status === 404) throw new Error('Menu introuvable.');
        if (!reponse.ok) throw new Error('Ce menu est temporairement indisponible.');
        const menu = await reponse.json();
        document.title = `${menu.name} - Vite et Gourmand`;
        document.querySelector('#categorie-detail-menu').textContent = `${menu.theme} · ${menu.regime}`;
        document.querySelector('#titre-detail-menu').textContent = menu.name;
        document.querySelector('#description-detail-menu').textContent = menu.description;
        const euros = (montant) => `${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
        document.querySelector('#prix-detail-menu').textContent = `${euros(Number(menu.price))} par personne`;
        document.querySelector('#personnes-detail-menu').textContent = menu.minimum > 1 ? `${menu.minimum} personnes` : "À partir d’une personne";
        document.querySelector('#total-detail-menu').textContent = `${euros(Number(menu.price) * Number(menu.minimum))} pour ${menu.minimum} personne${Number(menu.minimum) > 1 ? 's' : ''} (hors livraison)`;
        document.querySelector('#stock-detail-menu').textContent = Number(menu.stock) > 0
          ? `${menu.stock} commande${Number(menu.stock) > 1 ? 's' : ''} possible${Number(menu.stock) > 1 ? 's' : ''}`
          : 'Indisponible actuellement';
        document.querySelector('#regime-detail-menu').textContent = menu.regime;
        const galerie = (menu.images && menu.images.length ? menu.images : [menu.image_path]).filter(Boolean);
        const image = document.querySelector('#image-detail-menu');
        const vignettes = document.querySelector('#vignettes-detail-menu');
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
        const lienReservation = document.querySelector('#lien-commande-menu');
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
        const listeConditions = document.querySelector('#menu-conditions');
        listeConditions.replaceChildren();
        (menu.conditions_text || 'Aucune condition particulière communiquée.')
          .split(/(?<=\.)\s+/)
          .filter(Boolean)
          .forEach((phrase) => {
            const element = document.createElement('li');
            element.textContent = phrase;
            listeConditions.appendChild(element);
          });

        const typesPlats = { entree: '#liste-entrees-menu', plat: '#liste-plats-menu', dessert: '#liste-desserts-menu' };
        Object.entries(typesPlats).forEach(([typeBase, selecteur]) => {
          const liste = document.querySelector(selecteur);
          liste.replaceChildren();
          (menu.dishes || []).filter((plat) => plat.dish_type === typeBase).forEach((plat) => {
            const element = document.createElement('li');
            element.textContent = plat.name;
            const detail = document.createElement('span');
            detail.className = 'allergene';
            detail.textContent = `Allergènes : ${plat.allergens}`;
            element.appendChild(detail);
            liste.appendChild(element);
          });
          document.querySelector('.disposition-detail').hidden = false;
          document.querySelector('.informations-detail').hidden = false;
        });
      } catch (erreur) {
        console.error('Chargement du menu impossible :', erreur);
        document.querySelector('#titre-detail-menu').textContent = erreur.message || 'Ce menu est temporairement indisponible.';
        document.querySelector('#description-detail-menu').textContent = '';
        document.querySelector('#categorie-detail-menu').textContent = '';
        document.querySelector('.disposition-detail').hidden = true;
        document.querySelector('.informations-detail').hidden = true;
      }
    }
    chargerDetailMenu();
  } else {
    document.querySelector('#titre-detail-menu').textContent = 'Aucun menu sélectionné.';
  }
}
