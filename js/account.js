const identiteCompte = document.querySelector('#account-identity');
const commandesCompte = document.querySelector('#account-orders');
const formulaireProfil = document.querySelector('#profile-form');
const retourProfil = document.querySelector('#profile-feedback');
const activiteCompte = document.querySelector('#account-activity');

const libellesActivite = { compte: 'Compte', reservation: 'Commande', paiement: 'Paiement', suivi: 'Suivi', avis: 'Avis' };

const libellesStatuts = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  delivery: 'En cours de livraison',
  delivered: 'Livrée',
  material_return: 'En attente du retour de matériel',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

async function demanderCompte(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'La demande a échoué.');
  return result;
}

function echapperTexte(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function afficherActivite(activite) {
  if (!activite.length) {
    activiteCompte.textContent = 'Aucune activité enregistrée.';
    return;
  }
  const lignes = activite.map((evenement, index) => {
    const detail = evenement.type === 'suivi'
      ? evenement.detail.replace(/ : (\w+)$/, (_, statut) => ` : ${libellesStatuts[statut] || statut}`)
      : evenement.detail;
    const [jour, heure = ''] = String(evenement.event_at).split(' ');
    const montant = evenement.amount === null ? '' : ` · ${Number(evenement.amount).toFixed(2)} €`;
    return `<li class="activite-ligne"${index >= 8 ? ' hidden data-extra' : ''}><span class="activite-type">${echapperTexte(libellesActivite[evenement.type] || evenement.type)}</span><span class="activite-detail">${echapperTexte(detail)}${montant}</span><time class="activite-date">${echapperTexte(jour)} ${echapperTexte(heure.slice(0, 5))}</time></li>`;
  }).join('');
  const nombreCache = activite.length - 8;
  const plus = nombreCache > 0 ? '<button class="button button-small activite-plus" type="button">Voir plus (' + nombreCache + ')</button>' : '';
  activiteCompte.innerHTML = '<ul class="activite-liste">' + lignes + '</ul>' + plus;
  activiteCompte.querySelector('.activite-plus')?.addEventListener('click', (event) => {
    activiteCompte.querySelectorAll('[data-extra]').forEach((ligne) => { ligne.hidden = false; });
    event.currentTarget.remove();
  });
}

function ligneSuivi(event) {
  const statut = echapperTexte(libellesStatuts[event.status] || event.status);
  const note = event.note ? ' : ' + echapperTexte(event.note) : '';
  return '<li>' + echapperTexte(event.created_at) + ' - ' + statut + note + '</li>';
}

const etapesSuivi = ['pending', 'accepted', 'preparing', 'delivery', 'delivered', 'material_return', 'completed'];
const libellesEtapes = {
  pending: 'Demande reçue',
  accepted: 'Confirmée',
  preparing: 'En préparation',
  delivery: 'En livraison',
  delivered: 'Livrée',
  material_return: 'Retour du matériel',
  completed: 'Terminée'
};

function formaterDate(jour) {
  const date = new Date(`${jour}T12:00:00`);
  if (Number.isNaN(date.getTime())) return jour;
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function joursRestants(jour) {
  const debut = new Date(`${jour}T00:00:00`);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.round((debut - aujourdhui) / 86400000);
}

function frise(order) {
  if (order.status === 'cancelled') return '<p class="evenement-annule">Cet événement a été annulé.</p>';
  const vues = new Set(order.history.map((evenement) => evenement.status));
  const etapes = etapesSuivi.filter((etape) => etape !== 'material_return' || vues.has(etape) || order.status === etape);
  const position = etapes.indexOf(order.status);
  const items = etapes.map((etape, index) => {
    const classe = index < position ? 'fait' : index === position ? 'actuel' : '';
    return '<li class="' + classe + '"' + (index === position ? ' aria-current="step"' : '') + '>' + libellesEtapes[etape] + '</li>';
  }).join('');
  return '<ol class="frise-suivi" aria-label="Avancement de votre commande">' + items + '</ol>';
}

function formulaireModification(order, heure) {
  const id = echapperTexte(order.id);
  return '<form class="grille-formulaire" data-edit-order="' + id + '"><h3>Modifier mon événement</h3>' +
    '<div class="champ-formulaire"><label>Date <input name="date" type="date" value="' + echapperTexte(order.service_date) + '" required></label></div>' +
    '<div class="champ-formulaire"><label>Heure de livraison <input name="time" type="time" value="' + echapperTexte(heure) + '" required></label></div>' +
    '<div class="champ-formulaire"><label>Nombre d\u2019invités <input name="people" type="number" min="1" value="' + Number(order.people) + '" required></label></div>' +
    '<div class="champ-formulaire"><label>Adresse de livraison <input name="address" type="text" value="' + echapperTexte(order.address || '') + '" required></label></div>' +
    '<div class="champ-formulaire"><label>Ville <input name="city" type="text" value="' + echapperTexte(order.city || '') + '" required></label></div>' +
    '<div class="champ-formulaire"><label>Distance depuis Bordeaux (km) <input name="distance" type="number" min="0" step="0.1" value="' + Number(order.distance || 0) + '"></label></div>' +
    '<div class="champ-formulaire"><label>Téléphone <input name="phone" type="tel" value="' + echapperTexte(order.phone || '') + '" required></label></div>' +
    '<button class="button button-small" type="submit">Enregistrer les modifications</button></form>' +
    '<button class="button button-small bouton-secondaire" type="button" data-cancel-order="' + id + '">Annuler l\u2019événement</button>';
}

function formulaireAvis(order) {
  return '<form class="grille-formulaire" data-review-order="' + echapperTexte(order.id) + '"><h3>Votre avis sur la prestation</h3>' +
    '<div class="champ-formulaire"><label>Note (1 à 5) <select name="rating" required><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></label></div>' +
    '<div class="champ-formulaire"><label>Commentaire <textarea name="comment" rows="3" required></textarea></label></div>' +
    '<button class="button button-small" type="submit">Envoyer mon avis</button></form>';
}

function ligneReservation(order) {
  const heure = String(order.service_time).slice(0, 5);
  const statut = libellesStatuts[order.status] || order.status;
  const suivi = order.history.map(ligneSuivi).join('');
  const paiement = order.statut_paiement === 'paye' ? 'Payé' : 'Paiement à régler';
  let action = '';
  if (order.status === 'pending') action = formulaireModification(order, heure);
  else if (order.status === 'completed' && !Number(order.has_review)) action = formulaireAvis(order);
  else if (order.status === 'completed') action = '<p>Merci pour votre avis.</p>';
  const lieu = [order.address, order.city].filter(Boolean).map(echapperTexte).join(', ');
  const personnes = Number(order.people);
  return '<details class="reservation-ligne evenement-carte"><summary>' +
    '<span class="reservation-titre">' + echapperTexte(order.menu_name || order.menu_id) + '</span>' +
    '<span class="reservation-resume">' + echapperTexte(formaterDate(order.service_date)) + ' à ' + echapperTexte(heure) + '</span>' +
    '<span class="reservation-statut">' + echapperTexte(statut) + '</span></summary>' +
    '<div class="reservation-detail">' + frise(order) +
    '<dl class="evenement-infos">' +
    '<div><dt>Invités</dt><dd>' + personnes + ' personne' + (personnes > 1 ? 's' : '') + '</dd></div>' +
    '<div><dt>Livraison</dt><dd>' + (lieu || 'À préciser') + '</dd></div>' +
    '<div><dt>Total</dt><dd>' + Number(order.total).toFixed(2) + ' € · ' + paiement + '</dd></div>' +
    '<div><dt>Commandé le</dt><dd>' + echapperTexte(order.created_at) + '</dd></div></dl>' +
    '<details class="evenement-historique"><summary>Historique de la commande</summary><ul>' + suivi + '</ul></details>' +
    action + '</div></details>';
}

function afficherProchain(orders) {
  const bloc = document.querySelector('#account-next');
  const aVenir = orders
    .filter((order) => !['cancelled', 'completed'].includes(order.status) && joursRestants(order.service_date) >= 0)
    .sort((a, b) => a.service_date.localeCompare(b.service_date))[0];
  if (!aVenir) {
    bloc.hidden = true;
    return;
  }
  const jours = joursRestants(aVenir.service_date);
  const delai = jours === 0 ? 'C\u2019est aujourd\u2019hui !' : jours === 1 ? 'C\u2019est demain !' : 'Dans ' + jours + ' jours';
  const invites = Number(aVenir.people);
  bloc.hidden = false;
  bloc.innerHTML = '<p class="eyebrow">Votre prochain événement</p>' +
    '<h2>' + echapperTexte(aVenir.menu_name || aVenir.menu_id) + '</h2>' +
    '<p class="evenement-date">' + echapperTexte(formaterDate(aVenir.service_date)) + ' · ' + echapperTexte(String(aVenir.service_time).slice(0, 5)) + '</p>' +
    '<p class="evenement-delai">' + delai + ' · ' + invites + ' invité' + (invites > 1 ? 's' : '') + '</p>' + frise(aVenir);
}

async function chargerCompte() {
  try {
    const session = await demanderCompte('api/auth/session.php');
    identiteCompte.textContent = `Bonjour ${session.user.firstName}, retrouvez ici le suivi de vos événements.`;
    const profile = await demanderCompte('api/user/profile.php');
    Object.entries({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address
    }).forEach(([field, value]) => { formulaireProfil.elements[field].value = value || ''; });
    document.querySelector('#profile-avatar').textContent =
      `${(profile.first_name || '?')[0]}${(profile.last_name || '')[0] || ''}`.toUpperCase();
    const activite = await demanderCompte('api/user/activity.php');
    afficherActivite(activite);
    const orders = await demanderCompte('api/user/orders.php');
    afficherProchain(orders);
    if (!orders.length) {
      commandesCompte.innerHTML = '<div class="evenement-vide"><p>Vous n\u2019avez pas encore organisé d\u2019événement avec nous.</p><a class="button" href="menus.html">Découvrir nos menus de cérémonie</a></div>';
      return;
    }
    commandesCompte.innerHTML = orders.map(ligneReservation).join('');
  } catch (error_) {
    console.warn('Session invalide :', error_);
    window.location.href = 'connexion.html?redirect=compte.html';
  }
}

formulaireProfil.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const result = await demanderCompte('api/user/profile.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(formulaireProfil))) });
    retourProfil.textContent = result.message;
  } catch (error) {
    retourProfil.textContent = error.message;
    retourProfil.dataset.state = 'error';
  }
});

document.querySelector('#delete-account-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!window.confirm('Supprimer définitivement votre compte ?')) return;
  try {
    await demanderCompte('api/user/profile.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: event.currentTarget.elements.password.value }) });
    sessionStorage.setItem('toast', 'Votre compte a été supprimé.');
    window.location.href = 'index.html';
  } catch (error) {
    window.alert(error.message);
  }
});

commandesCompte.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-cancel-order]');
  if (!button) return;
  try {
    await demanderCompte('api/user/orders.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: button.dataset.cancelOrder }) });
    await chargerCompte();
  } catch (error) {
    window.alert(error.message);
  }
});

commandesCompte.addEventListener('submit', async (event) => {
  const edition = event.target.closest('[data-edit-order]');
  if (edition) {
    event.preventDefault();
    try {
      await demanderCompte('api/user/orders.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: edition.dataset.editOrder, ...Object.fromEntries(new FormData(edition)) }) });
      await chargerCompte();
    } catch (error) {
      window.alert(error.message);
    }
    return;
  }
  const form = event.target.closest('[data-review-order]');
  if (!form) return;
  event.preventDefault();
  try {
    await demanderCompte('api/reviews.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: form.dataset.reviewOrder, rating: form.elements.rating.value, comment: form.elements.comment.value }) });
    form.outerHTML = '<p>Merci, votre avis sera visible après validation.</p>';
  } catch (error) {
    window.alert(error.message);
  }
});

function afficherSection(nom) {
  const sections = ['profil', 'commandes', 'activite'];
  const choix = sections.includes(nom) ? nom : 'profil';
  sections.forEach((section) => { document.querySelector(`#section-${section}`).hidden = section !== choix; });
  document.querySelectorAll('[data-section]').forEach((lien) => {
    if (lien.dataset.section === choix) lien.setAttribute('aria-current', 'page');
    else lien.removeAttribute('aria-current');
  });
}

document.querySelectorAll('[data-section]').forEach((lien) => {
  lien.addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', `#${lien.dataset.section}`);
    afficherSection(lien.dataset.section);
  });
});
afficherSection(window.location.hash.slice(1));

await chargerCompte();
