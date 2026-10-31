(async () => {
  const form = document.querySelector('#reservation-form');
  if (!form) return;
  const payForm = document.querySelector('#payment-form');
  const confirmation = document.querySelector('#confirmation');
  const menuSelect = document.querySelector('#res-menu');
  const peopleInput = document.querySelector('#res-people');
  const dateInput = document.querySelector('#res-date');
  const timeSelect = document.querySelector('#res-time');
  const intro = document.querySelector('#reservation-intro');
  let user;
  let menus = [];
  let order;

  const euros = (value) => `${value.toFixed(2).replace('.', ',')} €`;
  const selectedMenu = () => menus.find((menu) => menu.id === menuSelect.value);

  try {
    const session = await chargerSession();
    user = session.ok ? session.data?.user : null;
  } catch (error) {
    user = null;
  }
  if (!user) {
    window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search)}`;
    return;
  }
  document.querySelector('#reservation-user').textContent = `Réservation au nom de ${user.firstName || ''} ${user.lastName || ''} (${user.email || ''}).`;
  form.elements.phone.value = user.phone || '';

  try {
    const response = await fetch('api/menus.php', { credentials: 'same-origin' });
    menus = (await response.json()).filter((menu) => Number(menu.stock) > 0);
  } catch (error) {
    showToast(friendlyError(error), true);
  }
  menus.forEach((menu) => {
    menuSelect.add(new Option(`${menu.name} - ${euros(Number(menu.price))} / personne`, menu.id));
  });
  const requested = new URLSearchParams(window.location.search).get('menu');
  if (menus.some((menu) => menu.id === requested)) menuSelect.value = requested;

  const horaires = {
    semaine: [['11:30', '14:00'], ['18:00', '22:00']],
    weekend: [['10:30', '15:00'], ['18:00', '22:00']]
  };
  const enMinutes = (heure) => Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3, 5));
  const enHeure = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  function actualiserCreneaux() {
    timeSelect.replaceChildren();
    if (!dateInput.value) {
      timeSelect.add(new Option('Choisissez d’abord une date', ''));
      timeSelect.disabled = true;
      return;
    }
    const jour = new Date(`${dateInput.value}T12:00:00`).getDay();
    const plages = jour === 0 || jour === 6 ? horaires.weekend : horaires.semaine;
    timeSelect.add(new Option('Choisissez un créneau', ''));
    plages.forEach(([debut, fin]) => {
      for (let m = enMinutes(debut); m < enMinutes(fin); m += 30) {
        timeSelect.add(new Option(enHeure(m).replace(':', 'h'), enHeure(m)));
      }
    });
    timeSelect.disabled = false;
  }

  function actualiserRecap() {
    const menu = selectedMenu();
    if (!menu) return;
    const minimum = Number(menu.minimum) || 1;
    peopleInput.min = minimum;
    peopleInput.max = 6;
    const people = Math.min(Math.max(Number(peopleInput.value) || minimum, minimum), 6);
    peopleInput.value = people;
    document.querySelector('#res-people-help').textContent = `Minimum : ${minimum}, maximum : 6 personnes par réservation.`;
    document.querySelector('#res-summary-menu').textContent = `${menu.name} × ${people}`;
    document.querySelector('#res-summary-date').textContent = dateInput.value
      ? `${dateInput.value}${timeSelect.value ? ` à ${timeSelect.value.replace(':', 'h')}` : ''}` : '-';
    document.querySelector('#res-summary-total').textContent = euros(Number(menu.price) * people);
  }

  dateInput.min = new Date().toISOString().split('T')[0];
  dateInput.addEventListener('change', actualiserCreneaux);
  form.addEventListener('input', actualiserRecap);
  form.addEventListener('change', actualiserRecap);
  actualiserRecap();

  async function appelApi(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'La demande n’a pas pu être traitée.');
    return result;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    actualiserRecap();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      order = await appelApi('api/orders.php', {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: form.elements.phone.value,
        date: dateInput.value,
        time: timeSelect.value,
        menu: menuSelect.value,
        people: peopleInput.value
      });
      form.hidden = true;
      payForm.hidden = false;
      intro.textContent = 'Étape 2 sur 2 : réglez votre réservation en ligne.';
      document.querySelector('#pay-button').textContent = `Payer ${euros(Number(order.totals.total))}`;
      payForm.querySelector('input').focus();
    } catch (error) {
      showToast(friendlyError(error), true);
    } finally {
      button.disabled = false;
    }
  });

  const luhn = (numero) => {
    let somme = 0;
    [...numero].reverse().forEach((chiffre, index) => {
      let n = Number(chiffre);
      if (index % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      somme += n;
    });
    return somme % 10 === 0;
  };

  payForm.querySelector('#pay-number').addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  });
  payForm.querySelector('#pay-expiry').addEventListener('input', (event) => {
    const chiffres = event.target.value.replace(/\D/g, '').slice(0, 4);
    event.target.value = chiffres.length > 2 ? `${chiffres.slice(0, 2)}/${chiffres.slice(2)}` : chiffres;
  });

  function carteValide() {
    const numero = payForm.querySelector('#pay-number').value.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(numero) || !luhn(numero)) return 'Numéro de carte invalide.';
    const expiry = payForm.querySelector('#pay-expiry').value.match(/^(\d{2})\/(\d{2})$/);
    if (!expiry || Number(expiry[1]) < 1 || Number(expiry[1]) > 12) return 'Date d’expiration invalide.';
    const fin = new Date(2000 + Number(expiry[2]), Number(expiry[1]), 1);
    if (fin <= new Date()) return 'Cette carte est expirée.';
    if (!/^\d{3,4}$/.test(payForm.querySelector('#pay-cvc').value)) return 'Cryptogramme invalide.';
    if (!payForm.querySelector('#pay-name').value.trim()) return 'Indiquez le titulaire de la carte.';
    return '';
  }

  payForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const erreur = carteValide();
    if (erreur) {
      showToast(erreur, true);
      return;
    }
    const button = payForm.querySelector('#pay-button');
    button.disabled = true;
    try {
      await appelApi('api/pay.php', { order_id: order.orderId });
      payForm.reset();
      payForm.hidden = true;
      confirmation.hidden = false;
      intro.textContent = 'Réservation confirmée.';
      document.querySelector('#confirmation-text').textContent =
        `Paiement de ${euros(Number(order.totals.total))} reçu pour le ${dateInput.value} à ${timeSelect.value.replace(':', 'h')}. Un suivi est disponible dans votre espace client.`;
      confirmation.querySelector('h2').setAttribute('tabindex', '-1');
      confirmation.querySelector('h2').focus();
    } catch (error) {
      showToast(friendlyError(error), true);
      button.disabled = false;
    }
  });

  document.querySelector('#back-button').addEventListener('click', () => {
    showToast('Votre réservation est enregistrée en attente de paiement. Vous pouvez la retrouver dans votre compte.');
    window.location.href = 'compte.html';
  });
})();
