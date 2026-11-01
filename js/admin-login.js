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
      body: JSON.stringify({ ...Object.fromEntries(new FormData(formulaireAdmin)), space: 'admin' })
    });
    const resultat = await reponse.json();
    if (!reponse.ok) throw new Error(resultat.error || 'La connexion a échoué.');
    window.location.href = 'admin.html';
  } catch (error_) {
    afficherRetourAdmin(error_.message, true);
  }
});

