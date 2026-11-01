const apiEspace = 'api/employee/espace.php';
let employeConsulte = '';

function texte(valeur) {
  const span = document.createElement('span');
  span.textContent = valeur ?? '';
  return span.innerHTML;
}

const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const heuresService = 7;

// Chaque poste a deux personnes qui alternent d'une semaine à l'autre (35 h maximum, 5 jours maximum).
const jourA = [0, 1, 2, 5, 6];
const jourB = [3, 4, 5, 6];
const equipe = [
  { nom: 'Julie', poste: 'Patronne', toujours: true },
  { nom: 'José', poste: 'Patron', toujours: true },
  { nom: 'Antoine', poste: 'Chef', groupe: 'A' },
  { nom: 'Paul', poste: 'Chef', groupe: 'B' },
  { nom: 'Marie', poste: 'Sous-chef', groupe: 'A' },
  { nom: 'Julien', poste: 'Sous-chef', groupe: 'B' },
  { nom: 'Léa', poste: 'Serveuse', groupe: 'A' },
  { nom: 'Hugo', poste: 'Serveur', groupe: 'B' },
  { nom: 'Karim', poste: 'Plongeur', groupe: 'A' },
  { nom: 'Nadia', poste: 'Plongeuse', groupe: 'B' }
];

function travaille(personne, semaine, jour) {
  if (personne.toujours) return true;
  const groupe = (personne.groupe === 'A') === (semaine === 0) ? jourA : jourB;
  return groupe.includes(jour);
}

const groupes = [
  ['Direction', ['Patronne', 'Patron']],
  ['Cuisine', ['Chef', 'Sous-chef']],
  ['Salle', ['Serveuse', 'Serveur']],
  ['Plonge', ['Plongeur', 'Plongeuse']]
];

function ligneEquipe(personne, semaine, prenom) {
  let total = 0;
  const cellules = jours.map((_, jour) => {
    if (!travaille(personne, semaine, jour)) return '<td><span class="pastille-repos">Repos</span></td>';
    total += heuresService;
    return '<td><span class="pastille-service">Service</span></td>';
  }).join('');
  const heures = personne.toujours ? 'Tous les services' : total + ' h';
  const classe = personne.nom === prenom ? ' class="ligne-moi"' : '';
  return '<tr' + classe + '><th scope="row"><strong>' + texte(personne.nom) + '</strong><small>' + texte(personne.poste) + '</small></th>' + cellules + '<td class="total-heures">' + heures + '</td></tr>';
}

function tableauSemaine(semaine, prenom) {
  const entetes = jours.map((j) => '<th>' + j + '</th>').join('');
  const corps = groupes.map(([titre, postes]) => {
    const lignes = equipe.filter((p) => postes.includes(p.poste)).map((p) => ligneEquipe(p, semaine, prenom)).join('');
    return '<tr class="groupe-equipe"><th colspan="9">' + titre + '</th></tr>' + lignes;
  }).join('');
  return '<h3>Semaine ' + (semaine === 0 ? 'A' : 'B') + '</h3><div class="table-responsive"><table class="planning-equipe"><thead><tr><th>Équipe</th>' + entetes + '<th>Total</th></tr></thead><tbody>' + corps + '</tbody></table></div>';
}

const libellesPostes = { patron: 'Patron', chef: 'Chef', 'sous-chef': 'Sous-chef', commis: 'Commis', serveur: 'Serveur', plongeur: 'Plongeur', livreur: 'Livreur' };

async function chargerEspaceEmploye() {
  const parametres = new URLSearchParams();
  if (employeConsulte) parametres.set('user_id', employeConsulte);
  try {
    const reponse = await fetch(apiEspace + '?' + parametres.toString(), { credentials: 'same-origin' });
    if (reponse.status === 401 || reponse.status === 403) {
      location.href = 'employe-connexion.html';
      return;
    }
    const d = await reponse.json();
    const p = d.profile || {};
    const poste = libellesPostes[p.job_title] || '';
    document.querySelector('#employe-sous-titre').textContent =
      (p.first_name || '') + (poste ? ' · Mon rôle dans l’équipe : ' + poste : '');
  } catch {
    document.querySelector('#employe-sous-titre').textContent = '';
  }
}

document.querySelector('#planning-simule').innerHTML = tableauSemaine(0, '') + tableauSemaine(1, '');

async function initialiserChoixEmploye() {
  const session = await chargerSession();
  if (session.data?.user?.role !== 'admin') return;
  document.querySelector('#employe-choix').hidden = false;
  const reponse = await fetch('api/admin/employees.php', { credentials: 'same-origin' });
  if (!reponse.ok) return;
  const employes = await reponse.json();
  const choix = document.querySelector('#employe-select');
  choix.innerHTML = '<option value="">Mon propre espace</option>' +
    employes.map((e) => '<option value="' + texte(e.id) + '">' + texte(e.first_name) + ' ' + texte(e.last_name) + '</option>').join('');
  choix.addEventListener('change', async () => {
    employeConsulte = choix.value;
    await chargerEspaceEmploye();
  });
}

await initialiserChoixEmploye();
await chargerEspaceEmploye();
