const filterForm = document.querySelector('#menu-filters');
const menuCards = document.querySelectorAll('.catalogue-card');
const resultsCount = document.querySelector('#results-count');
const emptyResults = document.querySelector('#empty-results');

async function actualiserLienConnexion() {
  const liensConnexion = [...document.querySelectorAll('.main-navigation a')]
    .filter((lien) => lien.getAttribute('href')?.includes('connexion'));
  if (!liensConnexion.length) return;

  try {
    const response = await fetch('api/auth/session.php', { credentials: 'same-origin' });
    if (!response.ok) return;
    liensConnexion.forEach((lien) => {
      lien.textContent = 'Déconnexion';
      lien.href = '#deconnexion';
      lien.addEventListener('click', async (event) => {
        event.preventDefault();
        await fetch('api/auth/logout.php', { credentials: 'same-origin' });
        window.alert('Vous êtes déconnecté.');
        window.location.href = 'index.html';
      }, { once: true });
    });
  } catch (error) {
  }
}

actualiserLienConnexion();

document.querySelectorAll('.opening-hours dl').forEach(async (listeHoraires) => {
  try {
    const response = await fetch('api/hours.php');
    if (!response.ok) return;
    const horaires = await response.json();
    listeHoraires.innerHTML = horaires.map((horaire) => `<div><dt>${horaire.day_name}</dt><dd>${horaire.opening_hours}</dd></div>`).join('');
  } catch (error) {
  }
});

function updateMenuResults() {
  if (!filterForm || !menuCards.length) {
    return;
  }

  const formData = new FormData(filterForm);
  const selectedTheme = formData.get('theme');
  const selectedRegime = formData.get('regime');
  const maximumPeople = Number(formData.get('people')) || 0;
  const minimumPrice = Number(formData.get('minimum_price')) || 0;
  const maximumPrice = Number(formData.get('price')) || 0;
  let visibleMenus = 0;

  menuCards.forEach((card) => {
    const matchesTheme = !selectedTheme || card.dataset.theme === selectedTheme;
    const matchesRegime = !selectedRegime || card.dataset.regime === selectedRegime;
    const matchesPeople = !maximumPeople || Number(card.dataset.people) <= maximumPeople;
    const menuPrice = Number(card.dataset.price);
    const matchesPrice = (!minimumPrice || menuPrice >= minimumPrice) && (!maximumPrice || menuPrice <= maximumPrice);
    const isVisible = matchesTheme && matchesRegime && matchesPeople && matchesPrice;

    card.hidden = !isVisible;
    if (isVisible) {
      visibleMenus += 1;
    }
  });

  resultsCount.textContent = `${visibleMenus} menu${visibleMenus > 1 ? 's' : ''} disponible${visibleMenus > 1 ? 's' : ''}`;
  emptyResults.hidden = visibleMenus !== 0;
}

if (filterForm) {
  const requestedTheme = new URLSearchParams(window.location.search).get('theme');
  const themeFilter = filterForm.querySelector('#theme-filter');
  if (requestedTheme && themeFilter && [...themeFilter.options].some((option) => option.value === requestedTheme)) {
    themeFilter.value = requestedTheme;
  }

  filterForm.addEventListener('input', updateMenuResults);
  filterForm.addEventListener('change', updateMenuResults);
  filterForm.addEventListener('reset', () => {
    window.setTimeout(updateMenuResults, 0);
  });
  updateMenuResults();
}

const orderForm = document.querySelector('#order-form');
const menuChoice = document.querySelector('#order-menu');
const peopleInput = document.querySelector('#order-people');
const distanceInput = document.querySelector('#order-distance');
const cityInput = document.querySelector('#order-city');

function showFormFeedback(form, message, isError = false) {
  let feedback = form.querySelector('.message-formulaire');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.className = 'message-formulaire';
    feedback.setAttribute('role', 'status');
    form.append(feedback);
  }

  feedback.textContent = message;
  feedback.dataset.state = isError ? 'error' : 'success';
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
    showFormFeedback(form, error.message, true);
  }
}

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
  const people = Math.max(Number(peopleInput.value) || minimumPeople, minimumPeople);
  const menuTotal = price * people;
  const discount = people >= minimumPeople + 5 ? menuTotal * 0.1 : 0;
  const distance = Number(distanceInput.value) || 0;
  const isOutsideBordeaux = cityInput.value.trim().toLowerCase() !== 'bordeaux';
  const delivery = isOutsideBordeaux && distance > 0 ? 5 + (distance * 0.59) : 0;

  distanceInput.setCustomValidity(isOutsideBordeaux && distance <= 0 ? 'Indiquez la distance hors Bordeaux.' : '');

  peopleInput.min = minimumPeople;
  peopleInput.value = people;
  document.querySelector('#people-help').textContent = `Minimum obligatoire : ${minimumPeople} personne${minimumPeople > 1 ? 's' : ''}.`;
  document.querySelector('#summary-menu').textContent = selectedMenu.textContent.split(' - ')[0];
  document.querySelector('#summary-menu-price').textContent = formatPrice(menuTotal);
  document.querySelector('#summary-discount').textContent = discount ? `- ${formatPrice(discount)}` : formatPrice(0);
  document.querySelector('#summary-delivery').textContent = formatPrice(delivery);
  document.querySelector('#summary-total').textContent = formatPrice(menuTotal - discount + delivery);
}

if (orderForm) {
  async function verifierSessionCommande() {
    try {
      const response = await fetch('api/auth/session.php', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Session requise');
      const session = await response.json();
      const user = session?.user;
      if (!user) throw new Error('Utilisateur absent');
      const firstName = document.querySelector('#order-first-name');
      const lastName = document.querySelector('#order-last-name');
      const email = document.querySelector('#order-email');
      const phone = document.querySelector('#order-phone');
      const address = document.querySelector('#order-address');
      if (firstName) firstName.value = user.firstName || '';
      if (lastName) lastName.value = user.lastName || '';
      if (email) email.value = user.email || '';
      phone?.setAttribute('value', user.phone || '');
      address?.setAttribute('value', user.address || '');
    } catch (error) {
      window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
  }
  verifierSessionCommande();

  const orderQuery = new URLSearchParams(window.location.search);
  const requestedMenu = orderQuery.get('menu');
  if (requestedMenu && [...menuChoice.options].some((option) => option.value === requestedMenu)) {
    menuChoice.value = requestedMenu;
  }

  const dateInput = document.querySelector('#order-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  orderForm.addEventListener('input', updateOrderSummary);
  orderForm.addEventListener('change', updateOrderSummary);
  orderForm.addEventListener('submit', (event) => {
    updateOrderSummary();
    if (!orderForm.checkValidity()) {
      event.preventDefault();
      orderForm.reportValidity();
      return;
    }

    event.preventDefault();
    submitFormToApi(event, orderForm, 'api/orders.php', 'Votre demande de commande a bien été enregistrée.');
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
      const reviews = await response.json();
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
    }
  }
  chargerAvisApprouves();
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
  registerForm.addEventListener('submit', (event) => {
    syncRegistrationPasswords();
    submitFormToApi(event, registerForm, 'api/auth/register.php', 'Votre compte a bien été créé.');
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

  form.addEventListener('submit', (event) => {
    submitFormToApi(event, form, endpoint, message);
  });
});

if (resetConfirmForm) {
  const resetToken = new URLSearchParams(window.location.search).get('reset_token');
  if (resetToken) {
    resetConfirmForm.hidden = false;
    resetConfirmForm.elements.token.value = resetToken;
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
        body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'La connexion a échoué.');
      }
      showFormFeedback(loginForm, 'Connexion réussie.');
      window.alert('Vous êtes connecté.');
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = redirect === 'admin.html' ? 'admin.html' : (redirect || 'index.html');
    } catch (error) {
      showFormFeedback(loginForm, error.message, true);
    }
  });
}

if (formulaireAvis) {
  formulaireAvis.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!formulaireAvis.checkValidity()) {
      formulaireAvis.reportValidity();
      return;
    }

    formulaireAvis.reset();
    mettreAJourEtoiles(formulaireAvis.querySelector('.choix-note'), 0);
    formulaireAvis.querySelectorAll('.is-valid').forEach((field) => field.classList.remove('is-valid'));
    showFormFeedback(formulaireAvis, 'Merci pour votre avis.');
  });
}
