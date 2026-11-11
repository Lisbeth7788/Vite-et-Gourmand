import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../js/script.js', import.meta.url), 'utf8');

async function ouvrirPage({ page = 'connexion.html', redirect, session = false, loginOk = true } = {}) {
  const url = new URL(`https://exemple.fr/site/${page}`);
  if (redirect !== undefined) url.searchParams.set('redirect', redirect);
  const location = {
    href: url.href,
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    replace(destination) { this.href = destination; }
  };
  const handlers = {};
  const feedback = { dataset: {} };
  const form = {
    addEventListener(type, handler) { handlers[type] = handler; },
    checkValidity() { return true; },
    querySelector(selector) { return selector === '.message-formulaire' ? feedback : null; },
    querySelectorAll() { return []; }
  };
  const panneau = { hidden: false };
  const lien = { search: '' };
  const document = {
    body: { append() {}, dataset: {} },
    querySelector(selector) {
      if (selector === '#login-panel, #employe-login-form, #admin-login-form') return page === 'connexion.html' ? panneau : null;
      if (selector === '#login-form') return page === 'connexion.html' ? form : null;
      if (selector === '#register-form') return page === 'inscription.html' ? form : null;
      if (selector.startsWith('.auth-switch a')) return lien;
      return null;
    },
    querySelectorAll() { return []; },
    createElement() {
      return { dataset: {}, classList: { add() {} }, setAttribute() {}, append() {}, remove() {} };
    }
  };
  const window = { location };
  const context = vm.createContext({
    window, document, URL, URLSearchParams, console,
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    FormData: class { *[Symbol.iterator]() { yield ['email', 'client@example.fr']; yield ['password', 'motdepasse']; } },
    fetch: async (adresse) => {
      if (adresse === 'api/auth/session.php') {
        return { ok: session, json: async () => ({ user: { role: 'client' } }) };
      }
      if (adresse === 'api/auth/login.php') {
        return { ok: loginOk, json: async () => loginOk ? {} : { error: 'Connexion refusée.' } };
      }
      throw new Error(`Requête inattendue : ${adresse}`);
    },
    setTimeout() {}
  });
  const module = new vm.SourceTextModule(script, { context });
  await module.link(() => { throw new Error('Import inattendu'); });
  await module.evaluate();
  return { location, handlers, lien, feedback };
}

test('la connexion reprend la réservation avec le menu choisi', async () => {
  const page = await ouvrirPage({ redirect: 'reservation.html?menu=repas%20de%20fete' });
  await page.handlers.submit({ preventDefault() {} });
  assert.equal(page.location.href, '/site/reservation.html?menu=repas%20de%20fete');
});

test('les adresses internes absolues conservent leurs paramètres et leur ancre', async () => {
  const page = await ouvrirPage({ redirect: '/site/menu-detail.html?menu=1#plats' });
  await page.handlers.submit({ preventDefault() {} });
  assert.equal(page.location.href, '/site/menu-detail.html?menu=1#plats');
});

test('une connexion directe retourne à l’accueil', async () => {
  const page = await ouvrirPage();
  await page.handlers.submit({ preventDefault() {} });
  assert.equal(page.location.href, 'index.html');
});

test('une connexion refusée ne redirige pas', async () => {
  const page = await ouvrirPage({ redirect: 'reservation.html?menu=1', loginOk: false });
  await page.handlers.submit({ preventDefault() {} });
  assert.match(page.location.href, /connexion\.html/);
  assert.equal(page.feedback.textContent, 'Connexion refusée.');
});

test('les destinations externes, hors du site ou menant à la connexion sont refusées', async () => {
  for (const redirect of ['https://ailleurs.fr/', '//ailleurs.fr/site/menus.html', 'javascript:alert(1)', '/autre/menus.html', '../menus.html', 'connexion.html', 'inscription.html']) {
    const page = await ouvrirPage({ redirect });
    await page.handlers.submit({ preventDefault() {} });
    assert.equal(page.location.href, 'index.html', redirect);
  }
});

test('une session client existante reprend également la destination', async () => {
  const page = await ouvrirPage({ redirect: 'reservation.html?menu=1', session: true });
  assert.equal(page.location.href, '/site/reservation.html?menu=1');
});

test('le passage par l’inscription conserve la destination dans les deux sens', async () => {
  const connexion = await ouvrirPage({ redirect: 'reservation.html?menu=1' });
  const inscription = await ouvrirPage({ page: 'inscription.html', redirect: '/site/reservation.html?menu=1' });
  for (const page of [connexion, inscription]) {
    assert.equal(new URLSearchParams(page.lien.search).get('redirect'), '/site/reservation.html?menu=1');
  }
});
