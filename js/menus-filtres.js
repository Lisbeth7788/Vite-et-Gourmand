const formulaire = document.querySelector('#filtres-menus');
const cartes = [...document.querySelectorAll('#menu-list .catalogue-card')];
const resultat = document.querySelector('#filtre-resultat');

function nombre(id) {
  const valeur = document.querySelector(id).value.trim();
  return valeur === '' ? null : Number(valeur);
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

formulaire.addEventListener('input', filtrer);
formulaire.addEventListener('submit', (evenement) => evenement.preventDefault());
formulaire.addEventListener('reset', () => setTimeout(filtrer));
filtrer();
