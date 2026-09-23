const filterForm = document.querySelector('#menu-filters');
const menuCards = document.querySelectorAll('.catalogue-card');
const resultsCount = document.querySelector('#results-count');
const emptyResults = document.querySelector('#empty-results');

function updateMenuResults() {
  if (!filterForm || !menuCards.length) {
    return;
  }

  const formData = new FormData(filterForm);
  const selectedTheme = formData.get('theme');
  const selectedRegime = formData.get('regime');
  const maximumPeople = Number(formData.get('people')) || 0;
  const maximumPrice = Number(formData.get('price')) || 0;
  let visibleMenus = 0;

  menuCards.forEach((card) => {
    const matchesTheme = !selectedTheme || card.dataset.theme === selectedTheme;
    const matchesRegime = !selectedRegime || card.dataset.regime === selectedRegime;
    const matchesPeople = !maximumPeople || Number(card.dataset.people) <= maximumPeople;
    const matchesPrice = !maximumPrice || Number(card.dataset.price) <= maximumPrice;
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
const contactForm = document.querySelector('#contact-form');
const formulaireAvis = document.querySelector('#formulaire-avis');
const forms = document.querySelectorAll('form');
const passwordToggles = document.querySelectorAll('.password-toggle');
const choixNotes = document.querySelectorAll('.choix-note');

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
  [loginForm, 'api/auth/login.php', 'Connexion réussie.'],
  [resetForm, 'api/auth/reset.php', 'Votre demande de réinitialisation a bien été enregistrée.'],
  [contactForm, 'api/contact.php', 'Votre demande a bien été envoyée.']
].forEach(([form, endpoint, message]) => {
  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    submitFormToApi(event, form, endpoint, message);
  });
});

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
