const formulaireMenu = document.querySelector('#menu-form');
const retourMenu = document.querySelector('#menu-retour');
const listeMenus = document.querySelector('#menu-liste');
const listeHoraires = document.querySelector('#horaires-liste');
const retourHoraires = document.querySelector('#horaires-retour');
let menus = [];

function annoncer(zone, texte, estErreur) {
  zone.textContent = texte;
  if (estErreur) zone.dataset.state = 'error';
  else delete zone.dataset.state;
}

async function chargerMenus() {
  menus = await demanderJson('api/admin/menus.php');
  listeMenus.innerHTML = menus.length
    ? '<table class="tableau-activite"><thead><tr><th>Menu</th><th>Thème / régime</th><th>Prix</th><th>Minimum</th><th>Stock</th><th>Actions</th></tr></thead><tbody>' +
      menus.map((menu) => '<tr><td><strong>' + echapperHtml(menu.name) + '</strong></td><td>' + echapperHtml(menu.theme) + ' / ' + echapperHtml(menu.regime) + '</td><td>' + Number(menu.price).toFixed(2) + ' €</td><td>' + Number(menu.minimum_people) + ' pers.</td><td>' + Number(menu.stock) +
        '</td><td><button class="button button-small" type="button" data-menu-modifier="' + echapperHtml(menu.id) + '">Modifier</button> <button class="button button-small bouton-secondaire" type="button" data-menu-supprimer="' + echapperHtml(menu.id) + '">Supprimer</button></td></tr>').join('') + '</tbody></table>'
    : 'Aucun menu.';
}

function remplirFormulaire(menu) {
  const champs = { id: menu.id, name: menu.name, price: menu.price, minimum_people: menu.minimum_people, stock: menu.stock, theme: menu.theme, regime: menu.regime, images: menu.images, description: menu.description, conditions_text: menu.conditions_text || '', entrees: menu.plats.entrees, plats: menu.plats.plats, desserts: menu.plats.desserts };
  Object.entries(champs).forEach(([nom, valeur]) => { formulaireMenu.elements[nom].value = valeur ?? ''; });
  formulaireMenu.scrollIntoView({ behavior: 'smooth' });
}

formulaireMenu.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  try {
    const resultat = await demanderJson('api/admin/menus.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(formulaireMenu))) });
    annoncer(retourMenu, resultat.message, false);
    formulaireMenu.reset();
    formulaireMenu.elements.id.value = '';
    await chargerMenus();
  } catch (error_) {
    annoncer(retourMenu, error_.message, true);
  }
});

formulaireMenu.addEventListener('reset', () => { formulaireMenu.elements.id.value = ''; });

document.querySelector('#menus-maj')?.addEventListener('click', async (evenement) => {
  const message = 'Cette action remplace les menus par les nouveaux menus de traiteur ET supprime toutes les commandes, avis et messages existants. Continuer ?';
  if (!window.confirm(message)) return;
  const bouton = evenement.currentTarget;
  const retour = document.querySelector('#menus-maj-retour');
  bouton.disabled = true;
  try {
    const resultat = await demanderJson('api/admin/menus-maj.php', { method: 'POST' });
    annoncer(retour, resultat.message, false);
    await chargerMenus();
  } catch (error_) {
    annoncer(retour, error_.message, true);
  } finally {
    bouton.disabled = false;
  }
});

listeMenus.addEventListener('click', async (evenement) => {
  const modifier = evenement.target.closest('[data-menu-modifier]');
  const supprimer = evenement.target.closest('[data-menu-supprimer]');
  if (modifier) {
    remplirFormulaire(menus.find((menu) => menu.id === modifier.dataset.menuModifier));
  } else if (supprimer && window.confirm('Supprimer ce menu ?')) {
    try {
      const resultat = await demanderJson('api/admin/menus.php', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: supprimer.dataset.menuSupprimer }) });
      annoncer(retourMenu, resultat.message, false);
      await chargerMenus();
    } catch (error_) {
      annoncer(retourMenu, error_.message, true);
    }
  }
});

const groupesHoraires = [
  { titre: 'Du lundi au vendredi', jours: [1, 2, 3, 4, 5] },
  { titre: 'Samedi et dimanche', jours: [6, 7] }
];

async function chargerHoraires() {
  const jours = await fetch('api/horaires.php').then((reponse) => reponse.json());
  listeHoraires.innerHTML = '<ul class="horaires-groupes">' + groupesHoraires.map((groupe) => {
    const premier = jours.find((jour) => Number(jour.day_of_week) === groupe.jours[0]);
    return '<li class="horaires-groupe" data-jours="' + groupe.jours.join(',') + '"><span class="horaires-titre">' + groupe.titre +
      '</span><span class="horaires-valeur">' + echapperHtml(premier ? premier.opening_hours : '') + '</span>' +
      '<button class="button button-small bouton-secondaire" type="button" data-horaire-action="modifier">Modifier</button></li>';
  }).join('') + '</ul>';
}

listeHoraires.addEventListener('click', async (evenement) => {
  const bouton = evenement.target.closest('[data-horaire-action]');
  if (!bouton) return;
  const ligne = bouton.closest('.horaires-groupe');
  const valeur = ligne.querySelector('.horaires-valeur');
  if (bouton.dataset.horaireAction === 'modifier') {
    const saisie = document.createElement('input');
    saisie.className = 'champ-horaire';
    saisie.maxLength = 120;
    saisie.value = valeur.textContent;
    saisie.setAttribute('aria-label', 'Horaires : ' + ligne.querySelector('.horaires-titre').textContent);
    valeur.replaceWith(saisie);
    saisie.focus();
    bouton.dataset.horaireAction = 'valider';
    bouton.textContent = 'Valider';
    bouton.classList.remove('bouton-secondaire');
    return;
  }
  const saisie = ligne.querySelector('.champ-horaire');
  try {
    const resultat = await demanderJson('api/horaires.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: ligne.dataset.jours.split(',').map(Number), opening_hours: saisie.value }) });
    annoncer(retourHoraires, resultat.message, false);
    await chargerHoraires();
  } catch (error_) {
    annoncer(retourHoraires, error_.message, true);
  }
});

try {
  await chargerMenus();
  await chargerHoraires();
} catch (error_) {
  annoncer(retourMenu, error_.message, true);
}
