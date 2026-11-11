import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

for (const espace of ['admin', 'employe']) {
  const page = await readFile(new URL(`../${espace}-connexion.html`, import.meta.url), 'utf8');
  const script = await readFile(new URL(`../js/${espace}-login.js`, import.meta.url), 'utf8');
  const styles = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');

  async function connexion(ok) {
    let soumettre;
    let requete;
    const retour = { dataset: {} };
    const formulaire = {
      addEventListener(type, fonction) { if (type === 'submit') soumettre = fonction; },
      checkValidity() { return true; }
    };
    const window = { location: { href: '' } };
    const contexte = vm.createContext({
      window,
      document: {
        querySelector(selecteur) {
          assert.ok(page.includes(`id="${selecteur.slice(1)}"`), `Identifiant absent : ${selecteur}`);
          return selecteur === `#formulaire-connexion-${espace}` ? formulaire : retour;
        }
      },
      FormData: class { *[Symbol.iterator]() { yield ['email', 'test@example.fr']; yield ['password', 'motdepasse']; } },
      fetch: async (url, options) => {
        requete = { url, ...options };
        return { ok, json: async () => ok ? {} : { error: 'Connexion refusée.' } };
      }
    });
    vm.runInContext(script, contexte);
    await soumettre({ preventDefault() {} });
    return { window, retour, requete };
  }

  test(`connexion ${espace} : formulaire et redirection restent coordonnés`, async () => {
    const { window, requete } = await connexion(true);
    assert.equal(requete.url, 'api/auth/login.php');
    assert.equal(JSON.parse(requete.body).space, espace);
    assert.equal(window.location.href, espace === 'admin' ? 'admin.html' : 'admin-reservations.html');
    assert.ok(styles.includes(`#retour-connexion-${espace}::before`));
    for (const id of [`titre-connexion-${espace}`, `email-connexion-${espace}`, `mot-de-passe-connexion-${espace}`]) {
      assert.ok(page.includes(`id="${id}"`));
      assert.ok(page.includes(`"${id}"`));
    }
  });

  test(`connexion ${espace} : une erreur reste visible sans redirection`, async () => {
    const { window, retour } = await connexion(false);
    assert.equal(retour.textContent, 'Connexion refusée.');
    assert.equal(retour.dataset.state, 'error');
    assert.equal(window.location.href, '');
  });
}
