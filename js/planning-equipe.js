const api = 'api/employee/planning-equipe.php';
const conteneur = document.querySelector('#planning-simule');
const modeEdition = conteneur.hasAttribute('data-edition');
const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const heuresService = 7;
const groupes = [
  ['Cuisine', ['Chef', 'Sous-chef']],
  ['Salle', ['Serveuse', 'Serveur']],
  ['Plonge', ['Plongeur', 'Plongeuse']]
];

// Planning par défaut : deux personnes alternent à chaque poste (35 h et 5 jours maximum).
const jourA = [0, 1, 2, 5, 6];
const jourB = [3, 4, 5, 6];
const semaineDe = (liste) => jours.map((_, j) => liste.includes(j));
const tous = jours.map(() => true);

function personne(nom, poste, groupe) {
  if (!groupe) return { nom, poste, toujours: true, semaines: [tous, tous] };
  return { nom, poste, toujours: false, semaines: groupe === 'A' ? [semaineDe(jourA), semaineDe(jourB)] : [semaineDe(jourB), semaineDe(jourA)] };
}

const parDefaut = [
  personne('Julie', 'Patronne'), personne('José', 'Patron'),
  personne('Karim', 'Chef', 'A'), personne('Paul', 'Chef', 'B'),
  personne('Marie', 'Sous-chef', 'A'), personne('Julien', 'Sous-chef', 'B'),
  personne('Léa', 'Serveuse', 'A'), personne('Nadia', 'Serveuse', 'B'),
  personne('Antoine', 'Plongeur', 'A'), personne('Hugo', 'Plongeur', 'B')
];

let equipe = parDefaut;
let signature = '';

function texte(valeur) {
  const span = document.createElement('span');
  span.textContent = valeur ?? '';
  return span.innerHTML;
}

function cellule(p, semaine, jour) {
  const actif = p.semaines[semaine][jour];
  const pastille = actif ? '<span class="pastille-service">Service</span>' : '<span class="pastille-repos">Repos</span>';
  if (!modeEdition || p.toujours) return '<td data-label="' + jours[jour] + '">' + pastille + '</td>';
  return '<td data-label="' + jours[jour] + '"><button type="button" class="case-planning" data-nom="' + texte(p.nom) + '" data-semaine="' + semaine + '" data-jour="' + jour + '" title="Cliquer pour changer">' + pastille + '</button></td>';
}

function ligne(p, semaine) {
  const total = p.semaines[semaine].filter(Boolean).length * heuresService;
  const heures = p.toujours ? 'Tous les services' : total + ' h';
  const nom = modeEdition ? '<button type="button" class="nom-planning" data-nom="' + texte(p.nom) + '" title="Cliquer pour renommer">' + texte(p.nom) + '</button>' : texte(p.nom);
  const cellules = jours.map((_, j) => cellule(p, semaine, j)).join('');
  return '<tr><th scope="row"><strong>' + nom + '</strong><small>' + texte(p.poste) + '</small></th>' + cellules + '<td class="total-heures" data-label="Total">' + heures + '</td></tr>';
}

function tableauSemaine(semaine) {
  const entetes = jours.map((j) => '<th>' + j + '</th>').join('');
  const corps = groupes.map(([titre, postes]) => {
    const lignes = equipe.filter((p) => postes.includes(p.poste)).map((p) => ligne(p, semaine)).join('');
    return '<tr class="groupe-equipe"><th colspan="9">' + titre + '</th></tr>' + lignes;
  }).join('');
  return '<section class="bloc-semaine"><h3>Planning de l’équipe · Semaine ' + (semaine === 0 ? 'A' : 'B') + '</h3><div class="table-responsive"><table class="planning-equipe"><thead><tr><th>Équipe</th>' + entetes + '<th>Total</th></tr></thead><tbody>' + corps + '</tbody></table></div></section>';
}

function afficher() {
  conteneur.innerHTML = tableauSemaine(0) + tableauSemaine(1);
}

function message(texteMessage, erreur) {
  const zone = document.querySelector('#planning-retour');
  if (!zone) return;
  zone.textContent = texteMessage;
  if (erreur) zone.setAttribute('data-state', 'error');
  else zone.removeAttribute('data-state');
}

async function charger() {
  try {
    const reponse = await fetch(api, { credentials: 'same-origin', cache: 'no-store' });
    if (!reponse.ok) return;
    const d = await reponse.json();
    const recu = d.planning?.equipe;
    const nouvelleSignature = JSON.stringify(recu || null);
    if (nouvelleSignature === signature) return;
    signature = nouvelleSignature;
    equipe = recu || parDefaut;
    afficher();
  } catch {
    // Les données par défaut restent affichées.
  }
}

async function enregistrer() {
  try {
    const reponse = await fetch(api, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ equipe }) });
    const d = await reponse.json();
    if (!reponse.ok) throw new Error(d.error || 'Enregistrement impossible.');
    signature = JSON.stringify(equipe);
    message('Planning enregistré : les employés le voient aussitôt.', false);
  } catch (erreur) {
    message(erreur.message, true);
  }
}

afficher();
await charger();

if (modeEdition) {
  conteneur.addEventListener('click', async (evenement) => {
    const caseJour = evenement.target.closest('.case-planning');
    const nomBouton = evenement.target.closest('.nom-planning');
    if (caseJour) {
      const p = equipe.find((x) => x.nom === caseJour.dataset.nom);
      const semaine = Number(caseJour.dataset.semaine);
      const jour = Number(caseJour.dataset.jour);
      p.semaines[semaine][jour] = !p.semaines[semaine][jour];
    } else if (nomBouton) {
      const p = equipe.find((x) => x.nom === nomBouton.dataset.nom);
      const nouveau = (prompt('Nouveau nom :', p.nom) || '').trim().slice(0, 40);
      if (!nouveau || nouveau === p.nom) return;
      if (equipe.some((x) => x.nom === nouveau)) return message('Ce nom existe déjà.', true);
      p.nom = nouveau;
    } else {
      return;
    }
    afficher();
    await enregistrer();
  });
} else {
  setInterval(charger, 10000);
}
