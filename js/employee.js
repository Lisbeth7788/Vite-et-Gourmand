import './planning-equipe.js';

const apiEspace = 'api/employee/espace.php';
const libellesPostes = { patron: 'Patron', chef: 'Chef', 'sous-chef': 'Sous-chef', commis: 'Commis', serveur: 'Serveur', plongeur: 'Plongeur', livreur: 'Livreur' };

async function chargerEspaceEmploye() {
  const sousTitre = document.querySelector('#employe-sous-titre');
  try {
    const reponse = await fetch(apiEspace, { credentials: 'same-origin' });
    if (reponse.status === 401 || reponse.status === 403) {
      location.href = 'employe-connexion.html';
      return;
    }
    const d = await reponse.json();
    const p = d.profile || {};
    const poste = libellesPostes[p.job_title] || '';
    sousTitre.textContent = (p.first_name || '') + (poste ? ' · Mon rôle dans l’équipe : ' + poste : '');
  } catch {
    sousTitre.textContent = '';
  }
}

const session = await chargerSession();
if (session.data?.user?.role === 'admin') document.querySelector('#employe-choix').hidden = false;
await chargerEspaceEmploye();
