let sessionPromise;

function chargerSession() {
  sessionPromise ??= fetch('api/auth/session.php', { credentials: 'same-origin' })
    .then(async (response) => ({ ok: response.ok, data: response.ok ? await response.json() : null }));
  return sessionPromise;
}

const panneauConnexion = document.querySelector('#panneau-connexion-client, #formulaire-connexion-employe, #formulaire-connexion-admin');

function pagePourEspace(role) {
  return { admin: 'admin.html', employe: 'admin-reservations.html', client: 'index.html' }[role] || 'index.html';
}

function pageDeRetour() {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  if (!redirect) return null;

  try {
    const destination = new URL(redirect, window.location.href);
    const repertoire = new URL('.', window.location.href).pathname;
    const page = destination.pathname.slice(repertoire.length);
    if (destination.origin === window.location.origin
        && destination.pathname.startsWith(repertoire)
        && /^[a-z0-9-]+\.html$/i.test(page)
        && !['connexion.html', 'inscription.html'].includes(page.toLowerCase())) {
      return destination.pathname + destination.search + destination.hash;
    }
  } catch (error) {
    console.warn('Adresse de retour invalide :', error);
    return null;
  }
  console.warn('Adresse de retour refusée.');
  return null;
}

function ajouterLienEspace(liste, role, liensConnexion) {
  if (!['client', 'employe'].includes(role) || liste.querySelector('.lien-espace-client')) return;
  const element = document.createElement('li');
  const lien = document.createElement('a');
  lien.className = 'lien-espace-client';
  lien.href = role === 'employe' ? 'espace-employe.html' : 'compte.html';
  lien.textContent = role === 'employe' ? 'Mon espace employé' : 'Mon espace client';
  if (window.location.pathname.endsWith(lien.getAttribute('href'))) lien.setAttribute('aria-current', 'page');
  element.append(lien);
  const dernier = liensConnexion[0]?.closest('li');
  if (dernier) dernier.before(element);
  else liste.append(element);
}

function ajouterDeconnexion(liensConnexion) {
  liensConnexion.forEach((lien) => {
    lien.textContent = 'Déconnexion';
    lien.href = '#deconnexion';
    lien.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        const response = await fetch('api/auth/logout.php', { credentials: 'same-origin' });
        if (!response.ok) throw new Error('La déconnexion n’a pas pu être effectuée.');
        sessionStorage.setItem('toast', 'Vous êtes déconnecté.');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Déconnexion impossible :', error);
        showToast(error.message || 'La déconnexion n’a pas pu être effectuée.', true);
      }
    }, { once: true });
  });
}

async function actualiserLienConnexion() {
  const liensConnexion = [...document.querySelectorAll('.navigation-principale a')]
    .filter((lien) => lien.getAttribute('href')?.includes('connexion'));
  try {
    const session = await chargerSession();
    if (!session.ok) {
      if (panneauConnexion) panneauConnexion.hidden = false;
      return;
    }
    const role = session.data?.user?.role;
    if (panneauConnexion && role) {
      window.location.replace(role === 'client' && loginForm ? pageDeRetour() || pagePourEspace(role) : pagePourEspace(role));
      return;
    }
    const liste = document.querySelector('.navigation-principale ul');
    if (!liste) return;
    if (document.body.dataset.modeEmploye !== undefined) return;
    ajouterLienEspace(liste, role, liensConnexion);
    if (liensConnexion.length) ajouterDeconnexion(liensConnexion);
  } catch (error) {
    console.error('Vérification de la session impossible :', error);
    if (panneauConnexion) panneauConnexion.hidden = false;
  }
}

if (panneauConnexion) panneauConnexion.hidden = true;

const orderForm = document.querySelector('#order-form');
const menuChoice = document.querySelector('#order-menu');
const peopleInput = document.querySelector('#order-people');

function showToast(message, isError = false) {
  let zone = document.querySelector('.zone-notifications');
  if (!zone) {
    zone = document.createElement('div');
    zone.className = 'zone-notifications';
    zone.setAttribute('role', 'status');
    zone.setAttribute('aria-live', 'polite');
    document.body.append(zone);
  }

  const toast = document.createElement('div');
  toast.className = 'notification';
  toast.dataset.state = isError ? 'error' : 'success';
  toast.textContent = message;
  zone.append(toast);
  setTimeout(() => {
    toast.classList.add('en-disparition');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

const toastEnAttente = sessionStorage.getItem('toast');
if (toastEnAttente) {
  sessionStorage.removeItem('toast');
  showToast(toastEnAttente);
}

function showFormFeedback(form, message, isError = false) {
  let feedback = form.querySelector('.message-formulaire');
  if (!feedback) {
    feedback = document.createElement('output');
    feedback.className = 'message-formulaire';
    form.append(feedback);
  }

  feedback.textContent = message;
  feedback.dataset.state = isError ? 'error' : 'success';
  showToast(message, isError);
}

async function submitFormToApi(event, form, endpoint, successMessage) {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'La demande n’a pas pu être traitée.');
    }

    showFormFeedback(form, result.message || successMessage);
    form.reset();
  } catch (error) {
    showFormFeedback(form, friendlyError(error), true);
  }
}

function friendlyError(error) {
  if (error instanceof TypeError) {
    return window.location.protocol === 'file:'
      ? 'Le site doit être ouvert via http://localhost/Vite-et-Gourmand/ (pas en double-cliquant sur le fichier).'
      : 'Serveur injoignable. Vérifiez que Apache et MySQL sont démarrés dans XAMPP.';
  }
  if (error instanceof SyntaxError) {
    return 'Erreur serveur (réponse invalide). Vérifiez la base de données et la configuration PHP.';
  }
  return error.message;
}

window.chargerSession = chargerSession;
window.showToast = showToast;
window.friendlyError = friendlyError;

function formatPrice(value) {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

function updateOrderSummary() {
  if (!orderForm || !menuChoice || !peopleInput) {
    return;
  }

  const selectedMenu = menuChoice.options[menuChoice.selectedIndex];
  const price = Number(selectedMenu.dataset.price);
  const minimumPeople = Number(selectedMenu.dataset.min);
  const people = Math.min(Math.max(Number(peopleInput.value) || minimumPeople, minimumPeople), 10);
  const menuTotal = price * people;

  peopleInput.min = minimumPeople;
  peopleInput.max = 10;
  peopleInput.value = people;
  document.querySelector('#people-help').textContent = `Minimum : ${minimumPeople} personne${minimumPeople > 1 ? 's' : ''}, maximum : 10 personnes par réservation.`;
  document.querySelector('#summary-menu').textContent = selectedMenu.textContent.split(' - ')[0];
  document.querySelector('#summary-menu-price').textContent = formatPrice(menuTotal);
  document.querySelector('#summary-total').textContent = formatPrice(menuTotal);
}

if (orderForm) {
  async function verifierSessionCommande() {
    let session;
    try {
      session = await chargerSession();
    } catch (error) {
      console.error('Vérification de la session de réservation impossible :', error);
      showFormFeedback(orderForm, friendlyError(error), true);
      return;
    }
    if (!session.ok || !session.data?.user) {
      window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    const user = session.data.user;
    const firstName = document.querySelector('#order-first-name');
    const lastName = document.querySelector('#order-last-name');
    const email = document.querySelector('#order-email');
    const phone = document.querySelector('#order-phone');
    if (firstName) firstName.value = user.firstName || '';
    if (lastName) lastName.value = user.lastName || '';
    if (email) email.value = user.email || '';
    phone?.setAttribute('value', user.phone || '');
  }
  const orderQuery = new URLSearchParams(window.location.search);
  const requestedMenu = orderQuery.get('menu');
  if (requestedMenu && [...menuChoice.options].some((option) => option.value === requestedMenu)) {
    menuChoice.value = requestedMenu;
  }

  const dateInput = document.querySelector('#order-date');
  const timeSelect = document.querySelector('#order-time');
  const horairesOuverture = {
    semaine: [['11:30', '14:00'], ['18:00', '22:00']],
    weekend: [['10:30', '15:00'], ['18:00', '22:00']]
  };
  const enMinutes = (heure) => Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3, 5));
  const enHeure = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  function actualiserCreneaux() {
    if (!timeSelect) return;
    timeSelect.replaceChildren();
    if (!dateInput.value) {
      timeSelect.add(new Option('Choisissez d’abord une date', ''));
      timeSelect.disabled = true;
      return;
    }
    const jour = new Date(`${dateInput.value}T12:00:00`).getDay();
    const plages = jour === 0 || jour === 6 ? horairesOuverture.weekend : horairesOuverture.semaine;
    timeSelect.add(new Option('Choisissez un créneau', ''));
    plages.forEach(([debut, fin]) => {
      for (let minutes = enMinutes(debut); minutes < enMinutes(fin); minutes += 30) {
        timeSelect.add(new Option(enHeure(minutes).replace(':', 'h'), enHeure(minutes)));
      }
    });
    timeSelect.disabled = false;
  }

  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', actualiserCreneaux);
  }

  orderForm.addEventListener('input', updateOrderSummary);
  orderForm.addEventListener('change', updateOrderSummary);
  orderForm.addEventListener('submit', async (event) => {
    updateOrderSummary();
    if (!orderForm.checkValidity()) {
      event.preventDefault();
      orderForm.reportValidity();
      return;
    }

    event.preventDefault();
    await submitFormToApi(event, orderForm, 'api/orders.php', 'Votre demande de commande a bien été enregistrée.');
  });
  updateOrderSummary();
  await verifierSessionCommande();
}

const registerForm = document.querySelector('#formulaire-inscription');
const loginForm = document.querySelector('#formulaire-connexion-client');
const resetForm = document.querySelector('#formulaire-reinitialisation');
const resetConfirmForm = document.querySelector('#formulaire-confirmation-reinitialisation');
const contactForm = document.querySelector('#contact-form');
const formulaireAvis = document.querySelector('#formulaire-avis');
const forms = document.querySelectorAll('form');
const passwordToggles = document.querySelectorAll('.bascule-mot-de-passe');
const choixNotes = document.querySelectorAll('.choix-note');
const approvedReviews = document.querySelector('#approved-reviews');

if (loginForm || registerForm) {
  const pageRetour = pageDeRetour();
  const lienAutreFormulaire = document.querySelector(loginForm
    ? '.changement-authentification a[href="inscription.html"]'
    : '.changement-authentification a[href="connexion.html"]');
  if (pageRetour && lienAutreFormulaire) {
    lienAutreFormulaire.search = new URLSearchParams({ redirect: pageRetour }).toString();
  }
}

if (approvedReviews) {
  async function chargerAvisApprouves() {
    try {
      const response = await fetch('api/reviews.php');
      if (!response.ok) throw new Error('Les avis publiés n’ont pas pu être chargés.');
      const reviews = await response.json();
      if (reviews.length) document.querySelector('#no-reviews')?.remove();
      reviews.forEach((review) => {
        const card = document.createElement('article');
        card.className = 'carte-avis';
        const rating = document.createElement('div');
        rating.className = 'note-avis';
        rating.textContent = `${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}`;
        rating.setAttribute('aria-label', `Note : ${review.rating} sur 5`);
        const comment = document.createElement('blockquote');
        comment.textContent = `« ${review.comment} »`;
        const author = document.createElement('cite');
        author.textContent = 'Client vérifié';
        card.append(rating, comment, author);
        approvedReviews.append(card);
      });
    } catch (error) {
      console.error('Chargement des avis impossible :', error);
      const emptyState = document.querySelector('#no-reviews');
      if (emptyState) emptyState.textContent = 'Les avis publiés sont momentanément indisponibles.';
    }
  }
  await chargerAvisApprouves();
}

function mettreAJourEtoiles(choixNote, note) {
  choixNote.querySelectorAll('label').forEach((label) => {
    const radio = document.querySelector(`#${label.htmlFor}`);
    label.classList.toggle('is-highlighted', Number(radio.value) <= note);
  });
}

choixNotes.forEach((choixNote) => {
  choixNote.addEventListener('change', (event) => {
    mettreAJourEtoiles(choixNote, Number(event.target.value));
  });
});

function syncRegistrationPasswords() {
  if (!registerForm) {
    return;
  }

  const password = registerForm.querySelector('#mot-de-passe-inscription');
  const confirmation = registerForm.querySelector('#confirmation-mot-de-passe');
  confirmation.setCustomValidity(confirmation.value && password.value !== confirmation.value ? 'Les mots de passe ne correspondent pas.' : '');
}

function updateFormFieldState(field) {
  const hasValue = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
  field.classList.toggle('est-valide', hasValue && field.checkValidity());
}

function refreshFormFieldState(field) {
  if (field.id === 'mot-de-passe-inscription' || field.id === 'confirmation-mot-de-passe') {
    syncRegistrationPasswords();
  }
  updateFormFieldState(field);
  if (field.id === 'mot-de-passe-inscription') {
    updateFormFieldState(registerForm.querySelector('#confirmation-mot-de-passe'));
  }
}

forms.forEach((form) => {
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => refreshFormFieldState(field));
    field.addEventListener('change', () => refreshFormFieldState(field));
  });
});

passwordToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const passwordInput = toggle.closest('.champ-mot-de-passe').querySelector('input');
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    toggle.setAttribute('aria-label', isVisible ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
    toggle.setAttribute('aria-pressed', String(!isVisible));
  });
});

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    syncRegistrationPasswords();
    await submitFormToApi(event, registerForm, 'api/auth/register.php', 'Votre compte a bien été créé.');
  });
}

[
  [resetForm, 'api/auth/reset.php', 'Votre demande de réinitialisation a bien été enregistrée.'],
  [resetConfirmForm, 'api/auth/reset-confirm.php', 'Votre mot de passe a bien été modifié.'],
  [contactForm, 'api/contact.php', 'Votre demande a bien été envoyée.']
].forEach(([form, endpoint, message]) => {
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    await submitFormToApi(event, form, endpoint, message);
  });
});

const resetPanel = document.querySelector('#password-reset');


function afficherReinitialisation() {
  resetPanel.hidden = false;
  resetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (resetPanel) {
  document.querySelectorAll('a[href="#password-reset"]').forEach((lien) => {
    lien.addEventListener('click', (event) => {
      event.preventDefault();
      afficherReinitialisation();
    });
  });

  const resetToken = new URLSearchParams(window.location.search).get('reset_token');
  if (resetToken && resetConfirmForm) {
    resetPanel.hidden = false;
    resetForm.hidden = true;
    resetConfirmForm.hidden = false;
    resetConfirmForm.elements.token.value = resetToken;
    const intro = resetPanel.querySelector('#titre-reinitialisation + p');
    if (intro) intro.textContent = 'Choisissez votre nouveau mot de passe (10 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial).';
    resetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (window.location.hash === '#password-reset') {
    resetPanel.hidden = false;
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }
    try {
      const response = await fetch('api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(loginForm)), space: 'client' })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'La connexion a échoué.');
      }
      showFormFeedback(loginForm, 'Connexion réussie.');
      sessionStorage.setItem('toast', 'Connexion réussie. Bienvenue !');
      if (window.PasswordCredential && window.confirm('Voulez-vous enregistrer le mot de passe sur cet ordinateur ?')) {
        try {
          await navigator.credentials.store(new PasswordCredential(loginForm));
        } catch (storeError) {
          // L'enregistrement est facultatif.
        }
      }
      window.location.href = pageDeRetour() || 'index.html';
    } catch (error) {
      showFormFeedback(loginForm, friendlyError(error), true);
    }
  });
}

if (formulaireAvis) {
  formulaireAvis.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!formulaireAvis.checkValidity()) {
      formulaireAvis.reportValidity();
      return;
    }

    try {
      const response = await fetch('api/reviews.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: formulaireAvis.elements.rating.value,
          comment: formulaireAvis.elements.message.value
        })
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Connectez-vous pour laisser un avis.');
      }
      if (!response.ok) {
        throw new Error(result.error || 'Votre avis n’a pas pu être envoyé.');
      }
      formulaireAvis.reset();
      mettreAJourEtoiles(formulaireAvis.querySelector('.choix-note'), 0);
      formulaireAvis.querySelectorAll('.est-valide').forEach((field) => field.classList.remove('est-valide'));
      showFormFeedback(formulaireAvis, result.message || 'Merci pour votre avis.');
    } catch (error) {
      showFormFeedback(formulaireAvis, error.message, true);
    }
  });
}

// Les horaires du pied de page viennent de la base.
async function afficherHorairesPiedDePage() {
  const liste = document.querySelector('.horaires-ouverture dl');
  if (!liste) return;
  try {
    const reponse = await fetch('api/horaires.php');
    if (!reponse.ok) throw new Error('Les horaires du traiteur n’ont pas pu être chargés.');
    const jours = await reponse.json();
    if (!Array.isArray(jours) || !jours.length) return;
    const groupes = [
      ['Semaine (lun. - ven.)', jours.find((jour) => Number(jour.day_of_week) === 1) || jours[0]],
      ['Week-end (sam. - dim.)', jours.find((jour) => Number(jour.day_of_week) === 6) || jours.at(-1)]
    ];
    liste.replaceChildren(...groupes.map(([titre, jour]) => {
      const ligne = document.createElement('div');
      const nom = document.createElement('dt');
      const horaires = document.createElement('dd');
      nom.textContent = titre;
      (typeof jour.opening_hours === 'string' ? jour.opening_hours : '').split('/').forEach((plage) => {
        const periode = document.createElement('span');
        periode.textContent = plage.trim();
        horaires.append(periode);
      });
      ligne.append(nom, horaires);
      return ligne;
    }));
    const openingHours = liste.parentElement;
    const details = document.createElement('details');
    details.className = 'details-horaires-ouverture';
    const summary = document.createElement('summary');
    summary.textContent = 'Afficher les horaires';
    details.append(summary, liste);
    openingHours.append(details);
  } catch (error) {
    console.warn('Conservation des horaires de secours du pied de page :', error);
  }
}

await actualiserLienConnexion();
await afficherHorairesPiedDePage();
