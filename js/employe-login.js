const formulaireEmploye = document.querySelector('#employe-login-form');
const retourEmploye = document.querySelector('#employe-login-feedback');

formulaireEmploye.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!formulaireEmploye.checkValidity()) {
    formulaireEmploye.reportValidity();
    return;
  }
  try {
    const reponse = await fetch('api/auth/login.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(new FormData(formulaireEmploye)), space: 'employe' })
    });
    const resultat = await reponse.json();
    if (!reponse.ok) throw new Error(resultat.error || 'La connexion a échoué.');
    window.location.href = 'espace-employe.html';
  } catch (erreur) {
    retourEmploye.textContent = erreur.message;
    retourEmploye.dataset.state = 'error';
  }
});
