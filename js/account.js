const identiteCompte = document.querySelector('#account-identity');
const commandesCompte = document.querySelector('#account-orders');
const formulaireProfil = document.querySelector('#profile-form');
const retourProfil = document.querySelector('#profile-feedback');

const libellesStatuts = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  delivery: 'En cours de livraison',
  delivered: 'Livrée',
  material_return: 'En attente du retour du matériel',
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

async function chargerCompte() {
  try {
    const session = await demanderCompte('api/auth/session.php');
    identiteCompte.textContent = `Connecté : ${session.user.firstName} ${session.user.lastName}`;
    const profile = await demanderCompte('api/user/profile.php');
    Object.entries({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address
    }).forEach(([field, value]) => { formulaireProfil.elements[field].value = value || ''; });
    const orders = await demanderCompte('api/user/orders.php');
    if (!orders.length) {
      commandesCompte.textContent = 'Aucune commande enregistrée.';
      return;
    }
    commandesCompte.innerHTML = orders.map((order) => `<article class="carte-menu"><h3>${echapperTexte(order.menu_id)}</h3><p>${echapperTexte(order.service_date)} à ${echapperTexte(order.service_time)} · ${Number(order.total).toFixed(2)} €</p><p>Statut : ${echapperTexte(libellesStatuts[order.status] || order.status)}</p><h4>Suivi</h4><ul>${order.history.map((event) => `<li>${echapperTexte(event.created_at)} - ${echapperTexte(libellesStatuts[event.status] || event.status)}${event.note ? ` : ${echapperTexte(event.note)}` : ''}</li>`).join('')}</ul>${order.status === 'pending' ? `<button class="button button-small" type="button" data-cancel-order="${echapperTexte(order.id)}">Annuler la commande</button>` : ''}${order.status === 'completed' ? '<p>Commande terminée : vous pouvez donner votre avis.</p>' : ''}</article>`).join('');
  } catch (error) {
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

chargerCompte();
