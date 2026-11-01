let sessionPromise;

function chargerSession() {
  sessionPromise ??= fetch('api/auth/session.php', { credentials: 'same-origin' })
    .then(async (response) => ({ ok: response.ok, data: response.ok ? await response.json() : null }));
  return sessionPromise;
}

const panneauConnexion = document.querySelector('#login-panel, #employe-login-form, #admin-login-form');

function pagePourEspace(role) {
  return { admin: 'admin.html', employe: 'espace-employe.html', client: 'index.html' }[role] || 'index.html';
}

async function changerExperience(space, page, link) {
  link.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('api/auth/switch-space.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ space })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Le changement d’espace a échoué.');
    window.location.href = page;
  } catch (error) {
    console.error('Changement d’espace impossible :', error);
    window.alert(error.message || 'Le changement d’espace a échoué.');
    link.removeAttribute('aria-busy');
  }
}

function ajouterSelecteurExperience(liste, role) {
  const element = document.createElement('li');
  element.className = 'experience-switch';
  const label = document.createElement('span');
  label.textContent = 'Expérience : ';
  element.append(label);
  [
    ['client', 'Client', 'index.html'],
    ['employe', 'Employé', 'espace-employe.html'],
    ['admin', 'Administrateur', 'admin.html']
  ].forEach(([space, name, page]) => {
    const link = document.createElement('a');
    link.href = page;
    link.textContent = name;
    if (role === space) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      await changerExperience(space, page, link);
    });
    element.append(document.createTextNode(' '), link);
  });
  liste.append(element);
}

function ajouterBadgeRole(liste, role) {
  if (!role || role === 'admin' || liste.querySelector('.badge-role')) return;
  const nomsRoles = { client: 'Client', employe: 'Employé' };
  const badge = document.createElement('li');
  badge.className = `badge-role badge-role-${role}`;
  badge.textContent = `Connecté : ${nomsRoles[role] || role}`;
  liste.append(badge);
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
  const liensConnexion = [...document.querySelectorAll('.main-navigation a')]
    .filter((lien) => lien.getAttribute('href')?.includes('connexion'));
  try {
    const session = await chargerSession();
    if (!session.ok) {
      if (panneauConnexion) panneauConnexion.hidden = false;
      return;
    }
    const role = session.data?.user?.role;
    if (panneauConnexion && role) {
      window.location.replace(pagePourEspace(role));
      return;
    }
    const liste = document.querySelector('.main-navigation ul');
    if (!liste) return;
    if (session.data?.canSwitchExperience && !liste.querySelector('.experience-switch')) {
      ajouterSelecteurExperience(liste, role);
    }
    ajouterBadgeRole(liste, role);
    if (document.body.dataset.modeEmploye !== undefined) return;
    ajouterLienEspace(liste, role, liensConnexion);
    if (liensConnexion.length) ajouterDeconnexion(liensConnexion);
  } catch (error) {
    console.error('Vérification de la session impossible :', error);
    if (panneauConnexion) panneauConnexion.hidden = false;
  }
}

if (panneauConnexion) panneauConnexion.hidden = true;
await actualiserLienConnexion();

const orderForm = document.querySelector('#order-form');
const menuChoice = document.querySelector('#order-menu');
const peopleInput = document.querySelector('#order-people');

function showToast(message, isError = false) {
  let zone = document.querySelector('.toast-zone');
  if (!zone) {
    zone = document.createElement('div');
    zone.className = 'toast-zone';
    zone.setAttribute('role', 'status');
    zone.setAttribute('aria-live', 'polite');
    document.body.append(zone);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.dataset.state = isError ? 'error' : 'success';
  toast.textContent = message;
  zone.append(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
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
  await verifierSessionCommande();

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
}

const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const resetForm = document.querySelector('#reset-form');
const resetConfirmForm = document.querySelector('#reset-confirm-form');
const contactForm = document.querySelector('#contact-form');
const formulaireAvis = document.querySelector('#formulaire-avis');
const forms = document.querySelectorAll('form');
const passwordToggles = document.querySelectorAll('.password-toggle');
const choixNotes = document.querySelectorAll('.choix-note');
const approvedReviews = document.querySelector('#approved-reviews');

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

  const password = registerForm.querySelector('#register-password');
  const confirmation = registerForm.querySelector('#register-password-confirm');
  confirmation.setCustomValidity(confirmation.value && password.value !== confirmation.value ? 'Les mots de passe ne correspondent pas.' : '');
}

function updateFormFieldState(field) {
  const hasValue = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
  field.classList.toggle('is-valid', hasValue && field.checkValidity());
}

function refreshFormFieldState(field) {
  if (field.id === 'register-password' || field.id === 'register-password-confirm') {
    syncRegistrationPasswords();
  }
  updateFormFieldState(field);
  if (field.id === 'register-password') {
    updateFormFieldState(registerForm.querySelector('#register-password-confirm'));
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
    const passwordInput = toggle.closest('.password-input').querySelector('input');
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
    const intro = resetPanel.querySelector('#reset-title + p');
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
      window.location.href = 'index.html';
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
      formulaireAvis.querySelectorAll('.is-valid').forEach((field) => field.classList.remove('is-valid'));
      showFormFeedback(formulaireAvis, result.message || 'Merci pour votre avis.');
    } catch (error) {
      showFormFeedback(formulaireAvis, error.message, true);
    }
  });
}

// Les horaires du pied de page viennent de la base : l'équipe peut les modifier.
async function afficherHorairesPiedDePage() {
  const liste = document.querySelector('.opening-hours dl');
  if (!liste) return;
  try {
    const reponse = await fetch('api/horaires.php');
    if (!reponse.ok) throw new Error('Les horaires du restaurant n’ont pas pu être chargés.');
    const jours = await reponse.json();
    if (!Array.isArray(jours) || !jours.length) return;
    liste.replaceChildren(...jours.map((jour) => {
      const ligne = document.createElement('div');
      const nom = document.createElement('dt');
      const horaires = document.createElement('dd');
      nom.textContent = jour.day_name;
      (typeof jour.opening_hours === 'string' ? jour.opening_hours : '').split('/').forEach((plage) => {
        const periode = document.createElement('span');
        periode.textContent = plage.trim();
        horaires.append(periode);
      });
      ligne.append(nom, horaires);
      return ligne;
    }));
  } catch (error) {
    console.warn('Conservation des horaires de secours du pied de page :', error);
  }
}

await afficherHorairesPiedDePage();
