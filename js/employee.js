const apiEspace = 'api/employee/espace.php';
const sectionsEmploye = ['planning', 'documents'];

function texte(valeur) {
  const span = document.createElement('span');
  span.textContent = valeur ?? '';
  return span.innerHTML;
}

function dateFr(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function afficherSectionEmploye() {
  const nom = sectionsEmploye.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'planning';
  sectionsEmploye.forEach((id) => { document.querySelector(`#section-${id}`).hidden = id !== nom; });
  document.querySelectorAll('[data-section]').forEach((lien) => {
    if (lien.dataset.section === nom) lien.setAttribute('aria-current', 'page'); else lien.removeAttribute('aria-current');
  });
}

function remplir(selecteur, lignes, vide) {
  document.querySelector(selecteur).innerHTML = lignes.length ? lignes.join('') : `<li>${vide}</li>`;
}

function etiquetteJour(dateIso, aujourdhui) {
  return dateIso === aujourdhui ? ' <span class="etiquette-jour">Aujourd’hui</span>' : '';
}

function ligneHoraire(s, aujourdhui) {
  const note = s.note ? ' (' + texte(s.note) + ')' : '';
  return '<li><strong>' + texte(dateFr(s.shift_date)) + '</strong>' + etiquetteJour(s.shift_date, aujourdhui) + ' : ' + texte(s.start_time) + ' - ' + texte(s.end_time) + note + '</li>';
}

function ligneTache(t, aujourdhui) {
  const coche = Number(t.is_done) ? 'checked' : '';
  return '<li><label><input type="checkbox" data-task="' + Number(t.id) + '" ' + coche + '> <strong>' + texte(dateFr(t.task_date)) + '</strong>' + etiquetteJour(t.task_date, aujourdhui) + ' : ' + texte(t.title) + '</label></li>';
}

let employeConsulte = '';
let semaineAffichee = '';
const libellesPostes = { patron: 'Patron', chef: 'Chef', 'sous-chef': 'Sous-chef', commis: 'Commis', serveur: 'Serveur', plongeur: 'Plongeur', livreur: 'Livreur' };

function minutesCreneau(debut, fin) {
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function decalerJour(iso, jours) {
  const date = new Date(iso + 'T12:00:00');
  date.setDate(date.getDate() + jours);
  return date.toISOString().slice(0, 10);
}

function afficherEquipe(d) {
  semaineAffichee = d.weekStart;
  const jours = [0, 1, 2, 3, 4, 5, 6].map((i) => decalerJour(d.weekStart, i));
  document.querySelector('#semaine-titre').textContent = 'Semaine du ' + new Date(d.weekStart + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const entetes = jours.map((j) => '<th>' + texte(new Date(j + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })) + '</th>').join('');
  document.querySelector('#equipe-entete').innerHTML = '<tr><th>Équipe</th>' + entetes + '<th>Total</th></tr>';
  const personnes = new Map();
  d.team.forEach((ligne) => {
    if (!personnes.has(ligne.user_id)) personnes.set(ligne.user_id, { ligne, creneaux: {}, minutes: 0 });
    if (!ligne.shift_date) return;
    const entree = personnes.get(ligne.user_id);
    (entree.creneaux[ligne.shift_date] ??= []).push(ligne.start_time + '-' + ligne.end_time);
    entree.minutes += minutesCreneau(ligne.start_time, ligne.end_time);
  });
  document.querySelector('#equipe-corps').innerHTML = [...personnes.values()].map(({ ligne, creneaux, minutes }) => {
    const cellules = jours.map((j) => '<td>' + (creneaux[j] ? creneaux[j].map(texte).join('<br>') : '<span class="repos">Repos</span>') + '</td>').join('');
    const classe = ligne.user_id === d.me ? ' class="ligne-moi"' : '';
    const total = (minutes / 60).toFixed(1).replace('.0', '') + ' h';
    return '<tr' + classe + '><th scope="row">' + texte(ligne.first_name) + '<br><small>' + texte(libellesPostes[ligne.job_title] || ligne.job_title || '') + '</small></th>' + cellules + '<td><strong>' + total + '</strong></td></tr>';
  }).join('');
}

async function chargerEspaceEmploye() {
  const parametres = new URLSearchParams();
  if (employeConsulte) parametres.set('user_id', employeConsulte);
  if (semaineAffichee) parametres.set('week', semaineAffichee);
  const reponse = await fetch(apiEspace + '?' + parametres.toString(), { credentials: 'same-origin' });
  if (reponse.status === 401 || reponse.status === 403) {
    location.href = 'employe-connexion.html';
    return;
  }
  const d = await reponse.json();
  const p = d.profile || {};
  document.querySelector('#employe-sous-titre').textContent =
    `${p.first_name || ''} ${p.last_name || ''}${p.job_title ? ` · ${p.job_title}` : ''}`.trim();
  afficherEquipe(d);
  remplir('#planning-horaires', d.shifts.map((s) => ligneHoraire(s, d.today)), 'Aucun horaire prévu.');
  remplir('#planning-taches', d.tasks.map((t) => ligneTache(t, d.today)), 'Aucune tâche prévue.');
  document.querySelector('#payslip-list').innerHTML = d.payslips.length
    ? d.payslips.map((f) => `<tr><td>${texte(f.period)}</td><td>${texte(f.hours)}</td><td>${texte(f.gross)} €</td><td>${texte(f.net)} €</td><td>${texte(f.note)}</td></tr>`).join('')
    : '<tr><td colspan="5">Aucune fiche de paie.</td></tr>';
}

document.addEventListener('change', async (event) => {
  const tache = event.target.dataset?.task;
  if (!tache) return;
  await fetch(apiEspace, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: Number(tache), done: event.target.checked })
  });
});

async function initialiserChoixEmploye() {
  const session = await chargerSession();
  if (session.data?.user?.role !== 'admin') return;
  const reponse = await fetch('api/admin/employees.php', { credentials: 'same-origin' });
  if (!reponse.ok) return;
  const employes = await reponse.json();
  const choix = document.querySelector('#employe-select');
  choix.innerHTML = '<option value="">Mon propre espace</option>' +
    employes.map((e) => '<option value="' + texte(e.id) + '">' + texte(e.first_name) + ' ' + texte(e.last_name) + (e.job_title ? ' (' + texte(e.job_title) + ')' : '') + '</option>').join('');
  document.querySelector('#employe-choix').hidden = false;
  choix.addEventListener('change', async () => {
    employeConsulte = choix.value;
    await chargerEspaceEmploye();
  });
}

document.querySelector('#semaine-precedente').addEventListener('click', async () => {
  semaineAffichee = decalerJour(semaineAffichee, -7);
  await chargerEspaceEmploye();
});

document.querySelector('#semaine-suivante').addEventListener('click', async () => {
  semaineAffichee = decalerJour(semaineAffichee, 7);
  await chargerEspaceEmploye();
});

window.addEventListener('hashchange', afficherSectionEmploye);
afficherSectionEmploye();
await initialiserChoixEmploye();
await chargerEspaceEmploye();
