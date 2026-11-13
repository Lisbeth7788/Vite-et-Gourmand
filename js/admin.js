const identiteAdministration = document.querySelector('#admin-identity');
const messageList = document.querySelector('#message-list');
const orderList = document.querySelector('#order-list');
const reviewList = document.querySelector('#review-list');
const activityList = document.querySelector('#activity-list');
const employeeList = document.querySelector('#employee-list');
const employeeForm = document.querySelector('#employee-form');
const resultatReservations = document.querySelector('#resultat-reservations');
let numeroChargementReservations = 0;

const statusLabels = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  delivery: 'En cours de livraison',
  delivered: 'Livrée',
  material_return: 'Retour du matériel',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

const nomsMenus = {
  'banquet-mariage': 'Le banquet de mariage',
  'repas-anniversaire': 'Le dîner d\'anniversaire',
  'brunch-naissance': 'Le brunch de naissance',
  'bapteme-communion': 'Le repas de baptême et de communion',
  'cocktail-dinatoire': 'Le cocktail de cérémonie',
  'reveillon': 'Le réveillon d\'exception',
  'dejeuner-paques': 'Le déjeuner de Pâques',
  'marche-bordeaux': 'Le dîner gastronomique de Bordeaux',
  'fete-vegetale': 'La table végétale d\'exception'
};

async function demanderJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'La demande n’a pas pu être traitée.');
  }
  return result;
}

function echapperHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function chargerMessages() {
  const messages = await demanderJson('api/admin/messages.php');
  if (!messages.length) {
    messageList.textContent = 'Aucun message reçu.';
    return;
  }
  const lignes = messages.map((message) => `<tr><td>${echapperHtml(message.created_at)}</td><td><a href="mailto:${echapperHtml(message.email)}">${echapperHtml(message.email)}</a></td><td>${echapperHtml(message.title)}</td><td>${echapperHtml(message.description)}</td><td><button class="bouton bouton-petit" type="button" data-delete-message="${Number(message.id)}">Supprimer</button></td></tr>`).join('');
  messageList.innerHTML = `<table><caption>Messages envoyés depuis la page contact</caption><thead><tr><th>Date</th><th>De</th><th>Sujet</th><th>Message</th><th>Action</th></tr></thead><tbody>${lignes}</tbody></table>`;
}

function carteReservation(order, options) {
  const paye = order.statut_paiement === 'paye';
  const heure = String(order.service_time).slice(0, 5);
  const menu = nomsMenus[order.menu_id] || order.menu_id;
  const paiement = paye ? 'Payé' : 'Paiement en attente';
  return '<article class="carte-reservation" data-statut="' + echapperHtml(order.status) + '">' +
    '<header><div><h3>' + echapperHtml(menu) + '</h3><p>' + echapperHtml(order.service_date) + ' à ' + echapperHtml(heure) + ' · ' + echapperHtml(order.people) + ' personnes</p></div>' +
    '<span class="badge-paiement ' + (paye ? 'badge-ok' : 'badge-attente') + '">' + paiement + '</span></header>' +
    '<dl><div><dt>Client</dt><dd>' + echapperHtml(order.first_name) + ' ' + echapperHtml(order.last_name) + '</dd></div>' +
    '<div><dt>Contact</dt><dd><a href="mailto:' + echapperHtml(order.email) + '">' + echapperHtml(order.email) + '</a><br>' + echapperHtml(order.phone) + '</dd></div>' +
    '<div><dt>Total</dt><dd>' + Number(order.total).toFixed(2) + ' €</dd></div>' +
    '<div><dt>Réservée le</dt><dd>' + echapperHtml(order.created_at) + '</dd></div></dl>' +
    '<label>Statut <select data-order-status="' + echapperHtml(order.id) + '" aria-label="Statut de la réservation">' + options + '</select></label></article>';
}

async function chargerCommandes() {
  const numeroChargement = ++numeroChargementReservations;
  const parametres = new URLSearchParams();
  const statut = document.querySelector('#filtre-statut')?.value;
  const client = document.querySelector('#filtre-client')?.value.trim();
  if (statut) parametres.set('status', statut);
  if (client) parametres.set('client', client);
  let orders;
  try {
    orders = await demanderJson('api/admin/orders.php' + (parametres.size ? '?' + parametres : ''));
  } catch (error) {
    if (numeroChargement !== numeroChargementReservations) return;
    throw error;
  }
  if (numeroChargement !== numeroChargementReservations) return;
  if (resultatReservations) {
    resultatReservations.textContent = `${orders.length} réservation${orders.length === 1 ? '' : 's'} trouvée${orders.length === 1 ? '' : 's'}.`;
  }
  if (!orders.length) {
    orderList.textContent = 'Aucune réservation trouvée.';
    return;
  }
  const options = Object.entries(statusLabels).map(([valeur, libelle]) => `<option value="${valeur}">${libelle}</option>`).join('');
  orderList.innerHTML = '<div class="grille-reservations">' + orders.map((order) => carteReservation(order, options)).join('') + '</div>';
  orders.forEach((order) => {
    const select = orderList.querySelector(`[data-order-status="${order.id}"]`);
    if (select) select.value = order.status;
  });
}

async function chargerAvis() {
  const avis = await demanderJson('api/admin/reviews.php');
  if (!avis.length) {
    reviewList.textContent = 'Aucun avis à modérer.';
    return;
  }
  const statuts = { approved: 'Publié', rejected: 'Refusé', pending: 'En attente' };
  const lignes = avis.map((review) => `<tr><td>${echapperHtml(review.created_at)}</td><td>${'★'.repeat(Number(review.rating))}</td><td>${echapperHtml(review.comment)}</td><td>${statuts[review.status] || echapperHtml(review.status)}</td><td><button class="bouton bouton-petit" type="button" data-review-id="${Number(review.id)}" data-review-status="approved">Publier</button> <button class="bouton bouton-petit" type="button" data-review-id="${Number(review.id)}" data-review-status="rejected">Refuser</button></td></tr>`).join('');
  reviewList.innerHTML = `<table><caption>Avis reçus</caption><thead><tr><th>Date</th><th>Note</th><th>Avis</th><th>Statut</th><th>Action</th></tr></thead><tbody>${lignes}</tbody></table>`;
}

async function chargerActivite() {
  const data = await demanderJson('api/admin/activity.php');
  const types = { inscription: 'Inscription', reservation: 'Réservation', paiement: 'Paiement', statut: 'Suivi', avis: 'Avis' };
  document.querySelector('#activity-summary').innerHTML =
    '<div class="chiffre-cle"><strong>' + Number(data.summary.payments) + '</strong><span>paiements reçus</span></div>' +
    '<div class="chiffre-cle"><strong>' + Number(data.summary.total_paid).toFixed(2) + ' €</strong><span>encaissés</span></div>' +
    '<div class="chiffre-cle"><strong>' + Number(data.summary.reservations) + '</strong><span>réservations actives</span></div>';
  const days = document.querySelector('#activity-days');
  days.innerHTML = data.days.length
    ? '<table class="tableau-activite tableau-services"><thead><tr><th>Jour de livraison</th><th>Commandes</th><th>Personnes</th><th>Montant</th></tr></thead><tbody>' + data.days.map((day) =>
      '<tr><td><strong>' + echapperHtml(dateLongue(day.service_date)) + '</strong></td><td>' + Number(day.orders) + '</td><td>' + Number(day.people) + '</td><td>' + Number(day.total).toFixed(2) + ' €</td></tr>'
    ).join('') + '</tbody></table>'
    : 'Aucune livraison à venir.';
  activityList.innerHTML = data.events.length
    ? '<table class="tableau-activite tableau-historique"><colgroup><col style="width:17%"><col style="width:15%"><col style="width:24%"><col style="width:32%"><col style="width:12%"></colgroup><thead><tr><th>Date</th><th>Action</th><th>Client</th><th>Détail</th><th>Montant</th></tr></thead><tbody>' + data.events.map((event) =>
      '<tr><td>' + echapperHtml(event.event_at) + '</td><td><span class="fil-type fil-' + echapperHtml(event.type) + '">' + echapperHtml(types[event.type] || event.type) + '</span></td>' +
      '<td><strong>' + echapperHtml(event.client) + '</strong><br><small>' + echapperHtml(event.email) + '</small></td><td>' + echapperHtml(event.detail) + '</td>' +
      '<td><strong>' + (event.amount === null ? '' : Number(event.amount).toFixed(2) + ' €') + '</strong></td></tr>').join('') + '</tbody></table>'
    : 'Aucune activité enregistrée.';
}

async function chargerStatistiques() {
  const formulaire = document.querySelector('#stats-form');
  const resultat = document.querySelector('#stats-result');
  const choixMenu = document.querySelector('#stats-menu');
  const menus = await fetch('api/menus.php').then((reponse) => reponse.json()).catch(() => []);
  const noms = {};
  (Array.isArray(menus) ? menus : []).forEach((menu) => {
    noms[menu.id] = menu.name || menu.title || menu.id;
    choixMenu.insertAdjacentHTML('beforeend', '<option value="' + echapperHtml(menu.id) + '">' + echapperHtml(noms[menu.id]) + '</option>');
  });

  async function afficher() {
    const parametres = new URLSearchParams(new FormData(formulaire));
    for (const [cle, valeur] of new URLSearchParams(parametres)) if (!valeur) parametres.delete(cle);
    try {
      const stats = await demanderJson('api/admin/stats.php?' + parametres);
      if (!stats.length) {
        resultat.textContent = 'Aucune réservation pour ce choix.';
        return;
      }
      const maximum = Math.max(...stats.map((ligne) => ligne.orders));
      resultat.innerHTML = '<table class="tableau-activite tableau-stats"><caption class="masque-visuellement">Réservations et chiffre d’affaires par menu</caption><thead><tr><th>Menu</th><th>Réservations</th><th>Chiffre d’affaires</th></tr></thead><tbody>' +
        stats.map((ligne) => '<tr><td><strong>' + echapperHtml(noms[ligne.menu] || ligne.menu) + '</strong></td><td><strong>' + ligne.orders + '</strong><div class="jauge"><div class="jauge-remplie jauge-libre" style="width:' + Math.round(ligne.orders * 100 / maximum) + '%"></div></div></td><td>' + Number(ligne.revenue).toFixed(2) + ' €</td></tr>').join('') + '</tbody></table>';
    } catch (error_) {
      resultat.textContent = error_.message;
    }
  }

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    void afficher();
  });
  await afficher();
}

function dateLongue(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function chargerEmployes() {
  const employes = await demanderJson('api/admin/employees.php');
  const lignes = employes.map((employe) => `<tr><td>${echapperHtml(employe.first_name)} ${echapperHtml(employe.last_name)}</td><td>${echapperHtml(employe.job_title || '')}</td><td>${echapperHtml(employe.email)}<br>${echapperHtml(employe.phone)}</td><td>${Number(employe.is_active) ? 'Actif' : 'Désactivé'}</td><td><button class="bouton bouton-petit" type="button" data-employee-toggle="${echapperHtml(employe.id)}" data-active="${Number(employe.is_active) ? 0 : 1}">${Number(employe.is_active) ? 'Désactiver' : 'Réactiver'}</button> <button class="bouton bouton-petit bouton-secondaire" type="button" data-employee-delete="${echapperHtml(employe.id)}">Supprimer</button></td></tr>`).join('');
  employeeList.innerHTML = employes.length
    ? `<table><caption>Comptes employés</caption><thead><tr><th>Nom</th><th>Poste</th><th>Contact</th><th>État</th><th>Actions</th></tr></thead><tbody>${lignes}</tbody></table>`
    : 'Aucun compte employé.';
}

async function initialiserAdministration() {
  try {
    const session = await demanderJson('api/auth/session.php');
    const role = session.user.role;
    if (!['admin', 'employe'].includes(role)) throw new Error('Accès réservé à l’équipe.');
    if (role === 'admin') {
      document.querySelectorAll('[data-employe-only]').forEach((element) => { element.hidden = true; });
    } else {
      if ('adminOnly' in document.body.dataset) {
        window.location.href = 'admin-reservations.html';
        return;
      }
      document.querySelectorAll('[data-admin-only]').forEach((element) => { element.hidden = true; });
    }
    identiteAdministration.textContent = `Connecté : ${session.user.email}`;
  } catch (error) {
    console.error('Vérification de la session impossible :', error);
    window.location.href = 'admin-connexion.html';
    return;
  }
  try {
    if (messageList) await chargerMessages();
    if (orderList) await chargerCommandes();
    if (reviewList) await chargerAvis();
    if (activityList) {
      await chargerActivite();
      await chargerStatistiques();
    }
    if (employeeList) await chargerEmployes();
  } catch (error) {
    (messageList || orderList || reviewList || activityList || employeeList || identiteAdministration).textContent = error.message;
  }
}

if (orderList) {
  const formulaireFiltres = document.querySelector('#filtres-reservations');
  const filtreStatut = document.querySelector('#filtre-statut');
  if (filtreStatut) {
    filtreStatut.insertAdjacentHTML('beforeend', Object.entries(statusLabels).map(([valeur, libelle]) => `<option value="${valeur}">${libelle}</option>`).join(''));
  }
  const actualiserFiltres = async () => {
    try {
      await chargerCommandes();
    } catch (error) {
      if (resultatReservations) resultatReservations.textContent = '';
      orderList.textContent = error.message;
    }
  };
  formulaireFiltres?.addEventListener('submit', (event) => {
    event.preventDefault();
    void actualiserFiltres();
  });
  filtreStatut?.addEventListener('change', actualiserFiltres);
  formulaireFiltres?.addEventListener('reset', () => setTimeout(actualiserFiltres));
  orderList.addEventListener('change', async (event) => {
    const select = event.target.closest('[data-order-status]');
    if (!select) return;
    const data = { id: select.dataset.orderStatus, status: select.value };
    if (select.value === 'cancelled') {
      data.reason = window.prompt('Motif de l’annulation :') || '';
      data.contact_method = window.prompt('Mode de contact du client :') || '';
    }
    try {
      await demanderJson('api/admin/orders.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } catch (error) {
      window.alert(error.message);
      await chargerCommandes();
    }
  });
}

if (reviewList) {
  reviewList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-review-id]');
    if (!button) return;
    try {
      await demanderJson('api/admin/reviews.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: button.dataset.reviewId, status: button.dataset.reviewStatus }) });
      await chargerAvis();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

if (messageList) {
  messageList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-message]');
    if (!button || !window.confirm('Supprimer ce message ?')) return;
    try {
      await demanderJson('api/admin/messages.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: button.dataset.deleteMessage }) });
      await chargerMessages();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

if (employeeForm) {
  const retourEmploye = document.querySelector('#employee-feedback');
  employeeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await demanderJson('api/admin/employees.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(employeeForm))) });
      retourEmploye.textContent = result.message;
      delete retourEmploye.dataset.state;
      employeeForm.reset();
      await chargerEmployes();
    } catch (error) {
      retourEmploye.textContent = error.message;
      retourEmploye.dataset.state = 'error';
    }
  });
  employeeList.addEventListener('click', async (event) => {
    const bascule = event.target.closest('[data-employee-toggle]');
    const suppression = event.target.closest('[data-employee-delete]');
    try {
      if (bascule) {
        await demanderJson('api/admin/employees.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: bascule.dataset.employeeToggle, active: bascule.dataset.active }) });
      } else if (suppression && window.confirm('Supprimer définitivement ce compte employé ?')) {
        await demanderJson('api/admin/employees.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: suppression.dataset.employeeDelete }) });
      } else {
        return;
      }
      await chargerEmployes();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

// Ce script classique partage ses fonctions avec la gestion des menus.
initialiserAdministration().catch((error) => { // NOSONAR
  console.error('Initialisation de l’espace de gestion impossible :', error);
  if (identiteAdministration) identiteAdministration.textContent = 'L’espace de gestion n’a pas pu être chargé.';
});
