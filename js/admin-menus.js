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
  const champs = { id: menu.id, name: menu.name, price: menu.price, minimum_people: menu.minimum_people, stock: menu.stock, theme: menu.theme, regime: menu.regime, image_path: menu.image_path, description: menu.description, conditions_text: menu.conditions_text || '', entrees: menu.plats.entrees, plats: menu.plats.plats, desserts: menu.plats.desserts };
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

async function chargerHoraires() {
  const jours = await fetch('api/horaires.php').then((reponse) => reponse.json());
  listeHoraires.innerHTML = '<table class="tableau-activite"><thead><tr><th>Jour</th><th>Horaires</th><th>Action</th></tr></thead><tbody>' +
    jours.map((jour) => '<tr><td><strong>' + echapperHtml(jour.day_name) + '</strong></td><td><input class="champ-horaire" aria-label="Horaires du ' + echapperHtml(jour.day_name) + '" value="' + echapperHtml(jour.opening_hours) + '" maxlength="120"></td><td><button class="button button-small" type="button" data-horaire-jour="' + Number(jour.day_of_week) + '">Enregistrer</button></td></tr>').join('') + '</tbody></table>';
}

listeHoraires.addEventListener('click', async (evenement) => {
  const bouton = evenement.target.closest('[data-horaire-jour]');
  if (!bouton) return;
  const saisie = bouton.closest('tr').querySelector('.champ-horaire');
  try {
    const resultat = await demanderJson('api/horaires.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day_of_week: bouton.dataset.horaireJour, opening_hours: saisie.value }) });
    annoncer(retourHoraires, resultat.message, false);
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
