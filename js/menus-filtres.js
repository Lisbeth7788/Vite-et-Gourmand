const formulaire = document.querySelector('#filtres-menus');
const liste = document.querySelector('#liste-menus');
const resultat = document.querySelector('#filtre-resultat');
let cartes = [];

function nombre(id) {
  const valeur = document.querySelector(id).value.trim();
  return valeur === '' ? null : Number(valeur);
}

function normaliser(valeur) {
  return valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function filtrer() {
  const prixMax = nombre('#filtre-prix-max');
  const prixDe = nombre('#filtre-prix-min');
  const prixA = nombre('#filtre-prix-borne');
  const personnes = nombre('#filtre-personnes');
  const theme = document.querySelector('#filtre-theme').value;
  const regime = document.querySelector('#filtre-regime').value;
  let visibles = 0;

  cartes.forEach((carte) => {
    const prix = Number(carte.dataset.price);
    const accepte = (prixMax === null || prix <= prixMax)
      && (prixDe === null || prix >= prixDe)
      && (prixA === null || prix <= prixA)
      && (personnes === null || Number(carte.dataset.people) <= personnes)
      && (!theme || carte.dataset.theme === theme)
      && (!regime || carte.dataset.regime === regime);
    carte.hidden = !accepte;
    if (accepte) visibles += 1;
  });

  resultat.textContent = visibles
    ? `${visibles} menu${visibles > 1 ? 's' : ''} affiché${visibles > 1 ? 's' : ''}.`
    : 'Aucun menu ne correspond à votre recherche.';
}

function texte(balise, contenu, classe = '') {
  const element = document.createElement(balise);
  element.textContent = contenu;
  if (classe) element.className = classe;
  return element;
}

function creerCarte(menu) {
  const prix = Number(menu.price);
  const minimum = Number(menu.minimum);
  const stock = Number(menu.stock);
  if (!menu.id || !menu.name || !Number.isFinite(prix) || !Number.isInteger(minimum) || minimum < 1 || !Number.isFinite(stock)) {
    throw new Error('Données de menu invalides.');
  }
  const euros = (montant) => `${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const carte = document.createElement('article');
  carte.className = 'carte-catalogue';
  carte.dataset.price = prix;
  carte.dataset.people = minimum;
  carte.dataset.theme = normaliser(menu.theme);
  carte.dataset.regime = normaliser(menu.regime);

  const image = document.createElement('img');
  image.className = 'image-carte-menu';
  image.src = menu.image_path || 'images/images/menu-marche.jpg';
  image.alt = `Illustration du menu ${menu.name}`;
  image.loading = 'lazy';
  const contenu = document.createElement('div');
  contenu.className = 'contenu-carte-catalogue';
  const meta = document.createElement('p');
  meta.className = 'informations-menu';
  meta.append(texte('strong', `${euros(prix)} par personne`), document.createElement('br'),
    `À partir de ${minimum} personne${minimum > 1 ? 's' : ''}`, document.createElement('br'),
    `${euros(prix * minimum)} pour ${minimum} personne${minimum > 1 ? 's' : ''}`);
  const lien = texte('a', 'Voir le détail', 'bouton bouton-petit');
  lien.href = `menu-detail.html?menu=${encodeURIComponent(menu.id)}`;
  contenu.append(texte('p', menu.theme, 'etiquette-carte'), texte('h3', menu.name),
    texte('p', menu.description), meta, lien);
  if (stock <= 0) contenu.insertBefore(texte('p', 'Indisponible actuellement'), lien);
  carte.append(image, contenu);
  return carte;
}

async function chargerMenus() {
  try {
    const reponse = await fetch('api/menus.php', { cache: 'no-store' });
    if (!reponse.ok) throw new Error(`Chargement des menus impossible (${reponse.status}).`);
    const menus = await reponse.json();
    if (!Array.isArray(menus)) throw new Error('Réponse des menus invalide.');
    cartes = menus.map(creerCarte);
    liste.replaceChildren(...cartes);
    filtrer();
  } catch (erreur) {
    console.error('Chargement du catalogue impossible :', erreur);
    liste.replaceChildren();
    resultat.textContent = 'Les menus sont temporairement indisponibles. Veuillez réessayer.';
  }
}

formulaire.addEventListener('input', filtrer);
formulaire.addEventListener('submit', (evenement) => evenement.preventDefault());
formulaire.addEventListener('reset', () => setTimeout(filtrer));
chargerMenus();
