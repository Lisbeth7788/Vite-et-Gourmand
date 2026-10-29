const formulaireAdmin = document.querySelector('#admin-login-form');
const retourAdmin = document.querySelector('#admin-login-feedback');

function afficherRetourAdmin(message, erreur = false) {
  retourAdmin.textContent = message;
  retourAdmin.dataset.state = erreur ? 'error' : 'success';
}

formulaireAdmin.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!formulaireAdmin.checkValidity()) {
    formulaireAdmin.reportValidity();
    return;
  }
  try {
    const reponse = await fetch('api/auth/login.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(formulaireAdmin)))
    });
    const resultat = await reponse.json();
    if (!reponse.ok) throw new Error(resultat.error || 'La connexion a échoué.');
    if (resultat.user.role !== 'admin') {
      await fetch('api/auth/logout.php', { method: 'POST', credentials: 'same-origin' });
      throw new Error('Ce compte n’est pas administrateur.');
    }
    window.location.href = 'admin.html';
  } catch (erreur) {
    afficherRetourAdmin(erreur.message, true);
  }
});
