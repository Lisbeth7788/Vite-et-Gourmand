const identiteAdministration = document.querySelector('#admin-identity');
const messageList = document.querySelector('#message-list');
const formulaireFiltreCommandes = document.querySelector('#order-filter-form');
const orderList = document.querySelector('#order-list');

const statusLabels = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  delivery: 'Prête',
  delivered: 'Retirée',
  material_return: 'Retour du matériel',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

const nomsMenus = {
  'marche-bordeaux': 'Le marché de Bordeaux',
  'formule-soir': 'La Table du Soir',
  'formule-etudiant': 'Le Campus Gourmand',
  'menu-enfant': 'Le Petit Gourmet'
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
  messageList.innerHTML = `<table><caption>Messages envoyés depuis la page contact</caption><thead><tr><th>Date</th><th>De</th><th>Sujet</th><th>Message</th></tr></thead><tbody>${messages.map((message) => `<tr><td>${echapperHtml(message.created_at)}</td><td><a href="mailto:${echapperHtml(message.email)}">${echapperHtml(message.email)}</a></td><td>${echapperHtml(message.title)}</td><td>${echapperHtml(message.description)}</td></tr>`).join('')}</tbody></table>`;
}

async function chargerCommandes() {
  const parameters = new URLSearchParams(new FormData(formulaireFiltreCommandes));
  const orders = await demanderJson(`api/admin/orders.php?${parameters}`);
  if (!orders.length) {
    orderList.textContent = 'Aucune réservation trouvée.';
    return;
  }
  const options = Object.entries(statusLabels).map(([valeur, libelle]) => `<option value="${valeur}">${libelle}</option>`).join('');
  orderList.innerHTML = `<table><caption>Réservations enregistrées</caption><thead><tr><th>Client</th><th>Menu</th><th>Date</th><th>Heure</th><th>Personnes</th><th>Total</th><th>Statut</th></tr></thead><tbody>${orders.map((order) => `<tr><td>${echapperHtml(order.first_name)} ${echapperHtml(order.last_name)}<br>${echapperHtml(order.email)}</td><td>${echapperHtml(nomsMenus[order.menu_id] || order.menu_id)}</td><td>${echapperHtml(order.service_date)}</td><td>${echapperHtml(String(order.service_time).slice(0, 5))}</td><td>${echapperHtml(order.people)}</td><td>${Number(order.total).toFixed(2)} €</td><td><select data-order-status="${echapperHtml(order.id)}" aria-label="Statut de la réservation">${options}</select></td></tr>`).join('')}</tbody></table>`;
  orders.forEach((order) => {
    const select = orderList.querySelector(`[data-order-status="${order.id}"]`);
    if (select) select.value = order.status;
  });
}

async function initialiserAdministration() {
  try {
    const session = await demanderJson('api/auth/session.php');
    const role = session.user.role;
    if (!['admin', 'employe'].includes(role)) throw new Error('Accès réservé à l’équipe.');
    if (role !== 'admin') {
      if (document.body.hasAttribute('data-admin-only')) {
        window.location.href = 'admin-reservations.html';
        return;
      }
      document.querySelectorAll('[data-admin-only]').forEach((element) => { element.hidden = true; });
    }
    identiteAdministration.textContent = `Connecté : ${session.user.email}`;
  } catch (error) {
    window.location.href = 'admin-connexion.html';
    return;
  }
  try {
    if (messageList) await chargerMessages();
    if (orderList) await chargerCommandes();
  } catch (error) {
    (messageList || orderList).textContent = error.message;
  }
}

if (formulaireFiltreCommandes) {
  formulaireFiltreCommandes.addEventListener('submit', (event) => {
    event.preventDefault();
    chargerCommandes().catch((error) => { orderList.textContent = error.message; });
  });
}

if (orderList) {
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

initialiserAdministration();
