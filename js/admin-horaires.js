const formulaire = document.querySelector('#horaires-form');
const choixJour = document.querySelector('#horaires-jour');
const champHoraires = document.querySelector('#horaires-valeur');
const bouton = document.querySelector('#horaires-enregistrer');
const retour = document.querySelector('#horaires-retour');
let jours = [];

function afficherMessage(texte, erreur = false) {
  retour.textContent = texte;
  if (erreur) retour.dataset.state = 'error';
  else delete retour.dataset.state;
}

function afficherJour() {
  const jour = jours.find((element) => String(element.day_of_week) === choixJour.value);
  champHoraires.value = jour ? jour.opening_hours : '';
}

choixJour.addEventListener('change', () => {
  afficherJour();
  afficherMessage('');
});

formulaire.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  const horaires = champHoraires.value.trim();
  if (!horaires) {
    afficherMessage('Indiquez les horaires ou « Fermé ».', true);
    return;
  }
  const numeroJour = Number(choixJour.value);
  bouton.disabled = true;
  choixJour.disabled = true;
  champHoraires.disabled = true;
  try {
    const resultat = await demanderJson('api/horaires.php', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: numeroJour, opening_hours: horaires })
    });
    const jour = jours.find((element) => Number(element.day_of_week) === numeroJour);
    jour.opening_hours = horaires;
    champHoraires.value = horaires;
    afficherMessage(resultat.message);
  } catch (error) {
    afficherMessage(error.message, true);
  } finally {
    bouton.disabled = false;
    choixJour.disabled = false;
    champHoraires.disabled = false;
  }
});

try {
  if (typeof demanderJson !== 'function') throw new Error('La page de gestion n’a pas pu être chargée. Réessayez plus tard.');
  jours = await demanderJson('api/horaires.php');
  if (!Array.isArray(jours) || jours.length !== 7) throw new Error('Les horaires de la semaine sont incomplets.');
  jours.forEach((jour) => {
    const option = document.createElement('option');
    option.value = String(jour.day_of_week);
    option.textContent = jour.day_name;
    choixJour.append(option);
  });
  afficherJour();
  choixJour.disabled = false;
  champHoraires.disabled = false;
  bouton.disabled = false;
} catch (error) {
  afficherMessage(error.message, true);
}
