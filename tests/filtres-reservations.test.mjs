import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../js/admin.js', import.meta.url), 'utf8');

async function ouvrir(role, attendre = async () => {}) {
  class Element {
    constructor() {
      this.value = '';
      this.listeners = {};
      this.textContent = '';
      this.innerHTML = '';
    }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    insertAdjacentHTML() {}
    querySelector() { return { value: '' }; }
  }
  const elements = Object.fromEntries([
    '#admin-identity', '#order-list', '#filtres-reservations',
    '#filtre-statut', '#filtre-client', '#resultat-reservations'
  ].map(id => [id, new Element()]));
  const commandes = [
    { id: '1', first_name: 'Alice', last_name: 'Martin', email: 'alice@example.test', phone: '', status: 'pending', service_date: '2027-01-01', service_time: '12:00', people: 8, total: 100, created_at: '2026-01-01' },
    { id: '2', first_name: 'Bob', last_name: 'Durand', email: 'bob@example.test', phone: '', status: 'cancelled', service_date: '2027-01-02', service_time: '12:00', people: 8, total: 100, created_at: '2026-01-01' }
  ];
  const demandes = [];
  const context = vm.createContext({
    document: {
      querySelector: id => elements[id] || null,
      querySelectorAll: () => [],
      body: { dataset: {} }
    },
    window: { location: {}, alert() {}, confirm: () => false },
    URLSearchParams,
    setTimeout,
    fetch: async url => {
      if (url === 'api/auth/session.php') return { ok: true, json: async () => ({ user: { role, email: 'gestion@example.test' } }) };
      demandes.push(url);
      const parametres = new URL(url, 'https://exemple.test').searchParams;
      const client = (parametres.get('client') || '').toLowerCase();
      const statut = parametres.get('status');
      await attendre(client);
      const resultats = commandes.filter(commande =>
        (!statut || commande.status === statut) &&
        (!client || `${commande.first_name} ${commande.last_name} ${commande.email}`.toLowerCase().includes(client))
      );
      return { ok: true, json: async () => resultats };
    }
  });
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, demandes };
}

for (const role of ['admin', 'employe']) {
  test(`recherche et remise à zéro des réservations pour ${role}`, async () => {
    const { elements, demandes } = await ouvrir(role);
    const formulaire = elements['#filtres-reservations'];
    const liste = elements['#order-list'];
    assert.match(liste.innerHTML, /Alice/);
    assert.match(liste.innerHTML, /Bob/);

    elements['#filtre-client'].value = 'Martin';
    formulaire.listeners.submit({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.match(demandes.at(-1), /client=Martin/);
    assert.match(liste.innerHTML, /Alice/);
    assert.doesNotMatch(liste.innerHTML, /Bob/);
    assert.equal(elements['#resultat-reservations'].textContent, '1 réservation trouvée.');

    elements['#filtre-client'].value = 'example.test';
    elements['#filtre-statut'].value = 'cancelled';
    formulaire.listeners.submit({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.match(liste.innerHTML, /Bob/);
    assert.doesNotMatch(liste.innerHTML, /Alice/);

    formulaire.listeners.reset();
    elements['#filtre-client'].value = '';
    elements['#filtre-statut'].value = '';
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.match(liste.innerHTML, /Alice/);
    assert.match(liste.innerHTML, /Bob/);
    assert.equal(elements['#resultat-reservations'].textContent, '2 réservations trouvées.');
  });
}

test('une ancienne recherche ne remplace pas le résultat le plus récent', async () => {
  let debloquer;
  const attente = new Promise(resolve => { debloquer = resolve; });
  const { elements } = await ouvrir('admin', client => client === 'alice' ? attente : Promise.resolve());
  const formulaire = elements['#filtres-reservations'];
  elements['#filtre-client'].value = 'Alice';
  formulaire.listeners.submit({ preventDefault() {} });
  elements['#filtre-client'].value = 'Bob';
  formulaire.listeners.submit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(elements['#order-list'].innerHTML, /Bob/);
  debloquer();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(elements['#order-list'].innerHTML, /Bob/);
  assert.doesNotMatch(elements['#order-list'].innerHTML, /Alice/);
});
