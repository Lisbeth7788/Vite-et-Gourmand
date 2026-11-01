const identiteCompte = document.querySelector('#account-identity');
const commandesCompte = document.querySelector('#account-orders');
const formulaireProfil = document.querySelector('#profile-form');
const retourProfil = document.querySelector('#profile-feedback');
const activiteCompte = document.querySelector('#account-activity');

const libellesActivite = { compte: 'Compte', reservation: 'Réservation', paiement: 'Paiement', suivi: 'Suivi', avis: 'Avis' };

const libellesStatuts = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  delivery: 'Prête',
  delivered: 'Retirée',
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
    document.querySelector('#profile-avatar').textContent =
      `${(profile.first_name || '?')[0]}${(profile.last_name || '')[0] || ''}`.toUpperCase();
    const activite = await demanderCompte('api/user/activity.php');
    activiteCompte.innerHTML = activite.length
      ? `<table><caption>Mes actions, de la plus récente à la plus ancienne</caption><thead><tr><th>Date</th><th>Action</th><th>Détail</th><th>Montant</th></tr></thead><tbody>${activite.map((evenement) => `<tr><td>${echapperTexte(evenement.event_at)}</td><td>${echapperTexte(libellesActivite[evenement.type] || evenement.type)}</td><td>${echapperTexte(evenement.type === 'suivi' ? evenement.detail.replace(/ : (\w+)$/, (_, statut) => ` : ${libellesStatuts[statut] || statut}`) : evenement.detail)}</td><td>${evenement.amount === null ? '' : `${Number(evenement.amount).toFixed(2)} €`}</td></tr>`).join('')}</tbody></table>`
      : 'Aucune activité enregistrée.';
    const orders = await demanderCompte('api/user/orders.php');
    if (!orders.length) {
      commandesCompte.textContent = 'Aucune commande enregistrée.';
      return;
    }
    commandesCompte.innerHTML = orders.map((order) => {
      const heure = String(order.service_time).slice(0, 5);
      const statut = libellesStatuts[order.status] || order.status;
      const suivi = order.history.map((event) => `<li>${echapperTexte(event.created_at)} - ${echapperTexte(libellesStatuts[event.status] || event.status)}${event.note ? ` : ${echapperTexte(event.note)}` : ''}</li>`).join('');
      return `<details class="reservation-ligne"><summary><span class="reservation-titre">${echapperTexte(order.menu_name || order.menu_id)}</span><span class="reservation-resume">${echapperTexte(order.service_date)} · ${echapperTexte(heure)} · ${Number(order.total).toFixed(2)} €</span><span class="reservation-statut">${echapperTexte(statut)}</span></summary><div class="reservation-detail"><p>${echapperTexte(order.people)} personne${Number(order.people) > 1 ? 's' : ''} · ${order.statut_paiement === 'paye' ? 'Payé' : 'En attente de paiement'}</p><p>Réservée le ${echapperTexte(order.created_at)}</p><ul>${suivi}</ul>${order.status === 'pending' ? `<button class="button button-small" type="button" data-cancel-order="${echapperTexte(order.id)}">Annuler la réservation</button>` : ''}${order.status === 'completed' ? '<p>Terminée : vous pouvez donner votre avis.</p>' : ''}</div></details>`;
    }).join('');
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

function afficherSection(nom) {
  const sections = ['profil', 'commandes', 'activite', 'session'];
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

chargerCompte();
