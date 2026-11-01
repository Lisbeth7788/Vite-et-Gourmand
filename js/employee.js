const apiEspace = 'api/employee/espace.php';
const sectionsEmploye = ['planning', 'compte-rendu', 'documents'];

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

async function chargerEspaceEmploye() {
  const parametre = employeConsulte ? '?user_id=' + encodeURIComponent(employeConsulte) : '';
  const reponse = await fetch(apiEspace + parametre, { credentials: 'same-origin' });
  if (reponse.status === 401 || reponse.status === 403) {
    location.href = 'employe-connexion.html';
    return;
  }
  const d = await reponse.json();
  const p = d.profile || {};
  document.querySelector('#employe-sous-titre').textContent =
    `${p.first_name || ''} ${p.last_name || ''}${p.job_title ? ` · ${p.job_title}` : ''}`.trim();
  remplir('#planning-horaires', d.shifts.map((s) => ligneHoraire(s, d.today)), 'Aucun horaire prévu.');
  remplir('#planning-taches', d.tasks.map((t) => ligneTache(t, d.today)), 'Aucune tâche prévue.');
  remplir('#report-list', d.reports.map((r) => `<li><strong>${texte(dateFr(r.report_date))}</strong> : ${texte(r.content)}</li>`), 'Aucun compte rendu.');
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

document.querySelector('#report-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const retour = document.querySelector('#report-feedback');
  const reponse = await fetch(apiEspace, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: document.querySelector('#report-content').value })
  });
  const resultat = await reponse.json();
  retour.textContent = resultat.message || resultat.error;
  retour.dataset.state = reponse.ok ? 'success' : 'error';
  if (reponse.ok) {
    event.target.reset();
    chargerEspaceEmploye();
  }
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

window.addEventListener('hashchange', afficherSectionEmploye);
afficherSectionEmploye();
await initialiserChoixEmploye();
await chargerEspaceEmploye();
