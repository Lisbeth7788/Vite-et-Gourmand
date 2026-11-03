async function appelerApi(url, corps) {
  const reponse = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps)
  });
  const resultat = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(resultat.error || 'La demande n’a pas pu être traitée.');
  return resultat;
}

async function initialiserReservation() {
  const formulaire = document.querySelector('#formulaire-reservation');
  if (!formulaire) return;
  const formulairePaiement = document.querySelector('#formulaire-paiement');
  const confirmation = document.querySelector('#confirmation');
  const choixMenu = document.querySelector('#reservation-menu');
  const champPersonnes = document.querySelector('#reservation-personnes');
  const champDate = document.querySelector('#reservation-date');
  const choixHeure = document.querySelector('#reservation-heure');
  const champVille = document.querySelector('#reservation-ville');
  const champDistance = document.querySelector('#champ-distance');
  const introduction = document.querySelector('#reservation-intro');
  let utilisateur;
  let menus = [];
  let commande;

  const euros = (valeur) => `${valeur.toFixed(2).replace('.', ',')} €`;
  const menuSelectionne = () => menus.find((menu) => menu.id === choixMenu.value);

  try {
    const session = await window.chargerSession();
    utilisateur = session.ok ? session.data?.user : null;
  } catch (error_) {
    console.warn('Session indisponible :', error_);
    utilisateur = null;
  }
  const adresseConnexion = `connexion.html?redirect=${encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search)}`;
  const zoneClient = document.querySelector('#reservation-client');
  if (utilisateur) {
    zoneClient.textContent = `Réservation au nom de ${utilisateur.firstName || ''} ${utilisateur.lastName || ''} (${utilisateur.email || ''}).`;
    formulaire.elements.telephone.value = utilisateur.phone || '';
  } else {
    zoneClient.append('Vous n’êtes pas connecté. ');
    const lienConnexion = document.createElement('a');
    lienConnexion.href = adresseConnexion;
    lienConnexion.textContent = 'Connectez-vous';
    zoneClient.append(lienConnexion, ' pour valider votre réservation.');
  }

  try {
    const reponse = await fetch('api/menus.php', { credentials: 'same-origin' });
    menus = (await reponse.json()).filter((menu) => Number(menu.stock) > 0);
  } catch (error_) {
    window.showToast(window.friendlyError(error_), true);
  }
  menus.forEach((menu) => {
    choixMenu.add(new Option(`${menu.name} - ${euros(Number(menu.price))} / personne`, menu.id));
  });
  const menuDemande = new URLSearchParams(window.location.search).get('menu');
  if (menus.some((menu) => menu.id === menuDemande)) choixMenu.value = menuDemande;
  if (menuDemande) {
    document.querySelector('#lien-retour').href = `menu-detail.html?menu=${encodeURIComponent(menuDemande)}`;
  }

  const modeRetrait = () => formulaire.elements.mode.value === 'retrait';

  function estBordeaux() {
    return modeRetrait() || champVille.value.trim().toLowerCase() === 'bordeaux';
  }

  function actualiserRecapitulatif(forcer = false) {
    const menu = menuSelectionne();
    if (!menu) return;
    const minimum = Number(menu.minimum) || 1;
    champPersonnes.min = minimum;
    champPersonnes.removeAttribute('max');
    // On ne corrige la valeur qu'à la fin de la saisie, sinon la frappe sur mobile est écrasée.
    if (forcer) {
      champPersonnes.value = Math.max(Math.round(Number(champPersonnes.value)) || minimum, minimum);
    }
    const personnes = Math.max(Number(champPersonnes.value) || minimum, minimum);
    champDistance.hidden = estBordeaux();
    champDistance.querySelector('input').required = !estBordeaux();
    document.querySelector('#bloc-livraison').hidden = modeRetrait();
    formulaire.elements.adresse.required = !modeRetrait();
    formulaire.elements.ville.required = !modeRetrait();
    document.querySelector('#libelle-heure').textContent = modeRetrait() ? 'Heure de retrait' : 'Heure de livraison';
    const distance = estBordeaux() ? 0 : Math.max(Number(champDistance.querySelector('input').value) || 0, 0);
    const prixMenu = Number(menu.price) * personnes;
    const remise = personnes >= minimum + 5 ? prixMenu * 0.1 : 0;
    const livraison = estBordeaux() ? 0 : 5 + 0.59 * distance;
    document.querySelector('#reservation-aide-personnes').textContent = `Minimum : ${minimum} personnes. Remise de 10 % dès ${minimum + 5} personnes.`;
    document.querySelector('#recapitulatif-menu').textContent = `${menu.name} × ${personnes} (${euros(prixMenu)})`;
    let texteDate = '-';
    if (champDate.value) {
      const heureChoisie = choixHeure.value ? ' à ' + choixHeure.value.replace(':', 'h') : '';
      texteDate = champDate.value + heureChoisie;
    }
    document.querySelector('#recapitulatif-date').textContent = texteDate;
    document.querySelector('#recapitulatif-remise').textContent = remise ? `-${euros(remise)}` : 'Aucune';
    document.querySelector('#recapitulatif-livraison').textContent = estBordeaux() ? (modeRetrait() ? 'Retrait sur place (gratuit)' : 'Gratuite (Bordeaux)') : euros(livraison);
    document.querySelector('#recapitulatif-total').textContent = euros(prixMenu - remise + livraison);
  }

  const dateMin = new Date();
  dateMin.setDate(dateMin.getDate() + 2);
  champDate.min = `${dateMin.getFullYear()}-${String(dateMin.getMonth() + 1).padStart(2, '0')}-${String(dateMin.getDate()).padStart(2, '0')}`;
  formulaire.addEventListener('input', () => actualiserRecapitulatif(false));
  formulaire.addEventListener('change', () => actualiserRecapitulatif(true));
  document.querySelector('.compteur-haut').addEventListener('click', () => {
    champPersonnes.value = (Number(champPersonnes.value) || 0) + 1;
    actualiserRecapitulatif(true);
  });
  document.querySelector('.compteur-bas').addEventListener('click', () => {
    champPersonnes.value = (Number(champPersonnes.value) || 2) - 1;
    actualiserRecapitulatif(true);
  });
  actualiserRecapitulatif(true);


  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    actualiserRecapitulatif(true);
    if (!formulaire.checkValidity()) {
      formulaire.reportValidity();
      return;
    }
    if (!utilisateur) {
      window.location.href = adresseConnexion;
      return;
    }
    const bouton = formulaire.querySelector('button[type="submit"]');
    bouton.disabled = true;
    try {
      // Les clés suivantes sont celles attendues par api/orders.php.
      commande = await appelerApi('api/orders.php', {
        first_name: utilisateur.firstName,
        last_name: utilisateur.lastName,
        email: utilisateur.email,
        phone: formulaire.elements.telephone.value,
        date: champDate.value,
        time: choixHeure.value,
        address: formulaire.elements.adresse.value,
        city: champVille.value,
        distance: formulaire.elements.distance.value,
        mode: formulaire.elements.mode.value,
        delivery_place: formulaire.elements.lieu.value,
        menu: choixMenu.value,
        people: champPersonnes.value
      });
      formulaire.hidden = true;
      formulairePaiement.hidden = false;
      introduction.textContent = 'Étape 2 sur 2 : réglez votre réservation en ligne.';
      document.querySelector('#bouton-payer').textContent = `Payer ${euros(Number(commande.totals.total))}`;
      formulairePaiement.querySelector('input').focus();
    } catch (error_) {
      window.showToast(window.friendlyError(error_), true);
    } finally {
      bouton.disabled = false;
    }
  });

  const verifierLuhn = (numero) => {
    let somme = 0;
    [...numero].reverse().forEach((chiffre, index) => {
      let valeur = Number(chiffre);
      if (index % 2 === 1) { valeur *= 2; if (valeur > 9) valeur -= 9; }
      somme += valeur;
    });
    return somme % 10 === 0;
  };

  formulairePaiement.querySelector('#paiement-numero').addEventListener('input', (evenement) => {
    evenement.target.value = evenement.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  });
  formulairePaiement.querySelector('#paiement-expiration').addEventListener('input', (evenement) => {
    const chiffres = evenement.target.value.replace(/\D/g, '').slice(0, 4);
    evenement.target.value = chiffres.length > 2 ? `${chiffres.slice(0, 2)}/${chiffres.slice(2)}` : chiffres;
  });

  function erreurCarte() {
    const numero = formulairePaiement.querySelector('#paiement-numero').value.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(numero) || !verifierLuhn(numero)) return 'Numéro de carte invalide.';
    const expiration = formulairePaiement.querySelector('#paiement-expiration').value.match(/^(\d{2})\/(\d{2})$/);
    if (!expiration || Number(expiration[1]) < 1 || Number(expiration[1]) > 12) return 'Date d’expiration invalide.';
    const fin = new Date(2000 + Number(expiration[2]), Number(expiration[1]), 1);
    if (fin <= new Date()) return 'Cette carte est expirée.';
    if (!/^\d{3,4}$/.test(formulairePaiement.querySelector('#paiement-cryptogramme').value)) return 'Cryptogramme invalide.';
    if (!formulairePaiement.querySelector('#paiement-titulaire').value.trim()) return 'Indiquez le titulaire de la carte.';
    return '';
  }

  formulairePaiement.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const erreur = erreurCarte();
    if (erreur) {
      window.showToast(erreur, true);
      return;
    }
    const bouton = formulairePaiement.querySelector('#bouton-payer');
    bouton.disabled = true;
    try {
      await appelerApi('api/paiement.php', { commande_id: commande.orderId });
      formulairePaiement.reset();
      formulairePaiement.hidden = true;
      confirmation.hidden = false;
      introduction.textContent = 'Réservation confirmée.';
      document.querySelector('#confirmation-texte').textContent =
        `Paiement de ${euros(Number(commande.totals.total))} reçu pour le ${champDate.value} à ${choixHeure.value.replace(':', 'h')}. Un suivi est disponible dans votre espace client.`;
      const titre = confirmation.querySelector('h2');
      titre.setAttribute('tabindex', '-1');
      titre.focus();
      sessionStorage.setItem('toast', 'Paiement reçu : votre réservation est confirmée.');
      window.setTimeout(() => { window.location.href = 'compte.html'; }, 2500);
    } catch (error_) {
      window.showToast(window.friendlyError(error_), true);
      bouton.disabled = false;
    }
  });

  document.querySelector('#bouton-retour').addEventListener('click', async (evenement) => {
    const bouton = evenement.currentTarget;
    bouton.disabled = true;
    try {
      const reponse = await fetch('api/user/orders.php', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commande.orderId })
      });
      if (!reponse.ok) throw new Error('Votre réservation n’a pas pu être modifiée. Consultez votre compte.');
      commande = null;
      formulairePaiement.hidden = true;
      formulaire.hidden = false;
      introduction.textContent = 'Étape 1 sur 2 : choisissez votre menu et votre créneau.';
      formulaire.querySelector('select').focus();
    } catch (error_) {
      window.showToast(window.friendlyError(error_), true);
    } finally {
      bouton.disabled = false;
    }
  });
}

try {
  await initialiserReservation();
} catch (error_) {
  window.showToast(window.friendlyError(error_), true);
}
