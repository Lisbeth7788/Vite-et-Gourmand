const identiteAdministration = document.querySelector('#admin-identity');
const formulaireMenu = document.querySelector('#menu-management-form');
const listeMenus = document.querySelector('#menu-list');
const menuFeedback = document.querySelector('#menu-feedback');
const formulaireFiltreCommandes = document.querySelector('#order-filter-form');
const orderList = document.querySelector('#order-list');
const employeeSection = document.querySelector('#employee-section');
const employeeForm = document.querySelector('#employee-form');
const employeeList = document.querySelector('#employee-list');
const reviewList = document.querySelector('#review-list');
const statsFilterForm = document.querySelector('#stats-filter-form');
const statsList = document.querySelector('#stats-list');
const graphiqueStatistiques = document.querySelector('#stats-chart');
const formulairePlat = document.querySelector('#dish-management-form');
const retourPlat = document.querySelector('#dish-feedback');
const formulaireHoraires = document.querySelector('#hours-management-form');
const retourHoraires = document.querySelector('#hours-feedback');
const statusLabels = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  delivery: 'En cours de livraison',
  delivered: 'Livrée',
  material_return: 'En attente du retour du matériel',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

async function demanderJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'La demande n’a pas pu être traitée.');
  }
  return result;
}

function definirRetour(element, message, error = false) {
  element.textContent = message;
  element.dataset.state = error ? 'error' : 'success';
}

async function chargerMenus() {
  const menus = await demanderJson('api/admin/menus.php');
  listeMenus.innerHTML = menus.map((menu) => `
    <article class="catalogue-card">
      <div class="catalogue-card-content">
        <h3>${echapperHtml(menu.name)}</h3>
        <p>${echapperHtml(menu.description)}</p>
        <p>${Number(menu.price).toFixed(2)} € · minimum ${menu.minimum_people} · stock ${menu.stock}</p>
        <button class="button button-small" type="button" data-edit-menu="${echapperHtml(menu.id)}" data-menu-name="${echapperHtml(menu.name)}" data-menu-price="${menu.price}" data-menu-minimum="${menu.minimum_people}" data-menu-theme="${echapperHtml(menu.theme)}" data-menu-regime="${echapperHtml(menu.regime)}" data-menu-stock="${menu.stock}" data-menu-description="${echapperHtml(menu.description)}">Modifier</button>
        <button class="button button-small" type="button" data-delete-menu="${echapperHtml(menu.id)}">Supprimer</button>
      </div>
    </article>`).join('');
}

async function chargerHoraires() {
  const horaires = await demanderJson('api/hours.php');
  formulaireHoraires.innerHTML = horaires.map((horaire) => `<div class="champ-formulaire"><label for="horaire-${horaire.day_of_week}">${echapperHtml(horaire.day_name)}</label><input id="horaire-${horaire.day_of_week}" name="horaire-${horaire.day_of_week}" data-jour="${horaire.day_of_week}" value="${echapperHtml(horaire.opening_hours)}" required></div>`).join('') + '<button class="button" type="submit">Enregistrer les horaires</button>';
}

async function chargerCommandes() {
  const parameters = new URLSearchParams(new FormData(formulaireFiltreCommandes));
  const orders = await demanderJson(`api/admin/orders.php?${parameters}`);
  if (!orders.length) {
    orderList.textContent = 'Aucune commande trouvée.';
    return;
  }
  orderList.innerHTML = `<table><caption>Commandes enregistrées</caption><thead><tr><th>Client</th><th>Menu</th><th>Date</th><th>Total</th><th>Statut</th><th>Action</th></tr></thead><tbody>${orders.map((order) => `<tr><td>${echapperHtml(order.first_name)} ${echapperHtml(order.last_name)}<br>${echapperHtml(order.email)}</td><td>${echapperHtml(order.menu_id)}</td><td>${echapperHtml(order.service_date)}</td><td>${Number(order.total).toFixed(2)} €</td><td>${echapperHtml(statusLabels[order.status] || order.status)}</td><td><select data-order-status="${echapperHtml(order.id)}"><option value="pending">En attente</option><option value="accepted">Acceptée</option><option value="preparing">En préparation</option><option value="delivery">En cours de livraison</option><option value="delivered">Livrée</option><option value="material_return">Retour matériel</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select></td></tr>`).join('')}</tbody></table>`;
  orders.forEach((order) => {
    const select = document.querySelector(`[data-order-status="${order.id}"]`);
    if (select) select.value = order.status;
  });
}

async function chargerEmployes() {
  const employees = await demanderJson('api/admin/users.php');
  employeeList.innerHTML = employees.map((employee) => `<p>${echapperHtml(employee.email)} - ${employee.is_active ? 'actif' : 'désactivé'} <button class="button button-small" type="button" data-toggle-employee="${echapperHtml(employee.id)}">${employee.is_active ? 'Désactiver' : 'Activer'}</button></p>`).join('');
}

async function chargerAvis() {
  const reviews = await demanderJson('api/admin/reviews.php');
  reviewList.innerHTML = reviews.map((review) => `<p>${'★'.repeat(Number(review.rating))} ${echapperHtml(review.comment)} - ${review.status === 'approved' ? 'Validé' : review.status === 'rejected' ? 'Refusé' : 'En attente'} <button class="button button-small" type="button" data-review-id="${review.id}" data-review-status="approved">Valider</button> <button class="button button-small" type="button" data-review-id="${review.id}" data-review-status="rejected">Refuser</button></p>`).join('');
}

async function chargerStatistiques() {
  const parameters = new URLSearchParams(new FormData(statsFilterForm));
  const statistics = await demanderJson(`api/admin/stats.php?${parameters}`);
  if (!statistics.length) {
    graphiqueStatistiques.innerHTML = '';
    statsList.textContent = 'Aucune statistique disponible.';
    return;
  }
  const maximumCommandes = Math.max(...statistics.map((statistic) => Number(statistic.orders)), 1);
  graphiqueStatistiques.innerHTML = statistics.map((statistic) => `<div class="stat-bar"><span>${echapperHtml(statistic.menu)}</span><div><i style="width: ${(Number(statistic.orders) / maximumCommandes) * 100}%"></i></div><strong>${statistic.orders} commande${Number(statistic.orders) > 1 ? 's' : ''}</strong></div>`).join('');
  statsList.innerHTML = `<table><caption>Commandes et chiffre d'affaires par menu</caption><thead><tr><th>Menu</th><th>Commandes</th><th>Chiffre d'affaires</th></tr></thead><tbody>${statistics.map((statistic) => `<tr><td>${echapperHtml(statistic.menu)}</td><td>${statistic.orders}</td><td>${Number(statistic.revenue).toFixed(2)} €</td></tr>`).join('')}</tbody></table>`;
}

function echapperHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function initialiserAdministration() {
  try {
    const session = await demanderJson('api/auth/session.php');
    if (!['admin', 'employe'].includes(session.user.role)) throw new Error('Accès réservé à l’équipe.');
    identiteAdministration.textContent = `Connecté : ${session.user.email} (${session.user.role})`;
    if (session.user.role === 'admin') {
      employeeSection.hidden = false;
      await chargerEmployes();
    }
    await chargerMenus();
    await chargerHoraires();
    await chargerCommandes();
    await chargerAvis();
    await chargerStatistiques().catch((error) => { statsList.textContent = error.message; });
  } catch (error) {
    window.location.href = 'connexion.html?redirect=admin.html';
  }
}

formulaireMenu.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await demanderJson('api/admin/menus.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(formulaireMenu))) });
    formulaireMenu.reset();
    definirRetour(menuFeedback, 'Menu enregistré.');
    await chargerMenus();
  } catch (error) {
    definirRetour(menuFeedback, error.message, true);
  }
});

listeMenus.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-menu]');
  if (editButton) {
    formulaireMenu.elements.id.value = editButton.dataset.editMenu;
    formulaireMenu.elements.name.value = editButton.dataset.menuName;
    formulaireMenu.elements.price.value = editButton.dataset.menuPrice;
    formulaireMenu.elements.minimum_people.value = editButton.dataset.menuMinimum;
    formulaireMenu.elements.theme.value = editButton.dataset.menuTheme;
    formulaireMenu.elements.regime.value = editButton.dataset.menuRegime;
    formulaireMenu.elements.stock.value = editButton.dataset.menuStock;
    formulaireMenu.elements.description.value = editButton.dataset.menuDescription;
    return;
  }
  const deleteButton = event.target.closest('[data-delete-menu]');
  if (!deleteButton) return;
  try {
    await demanderJson('api/admin/menus.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteButton.dataset.deleteMenu }) });
    await chargerMenus();
  } catch (error) {
    definirRetour(menuFeedback, error.message, true);
  }
});

formulaireFiltreCommandes.addEventListener('submit', (event) => { event.preventDefault(); chargerCommandes().catch((error) => { orderList.textContent = error.message; }); });
statsFilterForm.addEventListener('submit', (event) => { event.preventDefault(); chargerStatistiques().catch((error) => { statsList.textContent = error.message; }); });
orderList.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-order-status]');
  if (!select) return;
  const data = { id: select.dataset.orderStatus, status: select.value };
  if (select.value === 'cancelled') {
    data.reason = window.prompt('Motif de l’annulation :') || '';
    data.contact_method = window.prompt('Mode de contact du client :') || '';
  }
  try { await demanderJson('api/admin/orders.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (error) { window.alert(error.message); await chargerCommandes(); }
});

employeeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await demanderJson('api/admin/users.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(employeeForm))) }); employeeForm.reset(); await chargerEmployes(); } catch (error) { window.alert(error.message); }
});

formulairePlat.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const result = await demanderJson('api/admin/dishes.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(formulairePlat))) });
    retourPlat.textContent = result.message;
    formulairePlat.reset();
  } catch (error) {
    retourPlat.textContent = error.message;
    retourPlat.dataset.state = 'error';
  }
});

formulaireHoraires.addEventListener('submit', async (event) => {
  event.preventDefault();
  const horaires = [...formulaireHoraires.querySelectorAll('[data-jour]')].map((champ) => ({ day_of_week: champ.dataset.jour, opening_hours: champ.value }));
  try {
    const result = await demanderJson('api/admin/hours.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours: horaires }) });
    retourHoraires.textContent = result.message;
  } catch (error) {
    retourHoraires.textContent = error.message;
    retourHoraires.dataset.state = 'error';
  }
});
employeeList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-toggle-employee]');
  if (!button) return;
  const currentlyActive = button.textContent === 'Désactiver';
  try { await demanderJson('api/admin/users.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: button.dataset.toggleEmployee, is_active: !currentlyActive }) }); await chargerEmployes(); } catch (error) { window.alert(error.message); }
});

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

initialiserAdministration();
