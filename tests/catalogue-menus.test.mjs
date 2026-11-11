import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../js/menus-filtres.js', import.meta.url), 'utf8');

async function charger(menus, disponible = true) {
  class Element {
    constructor() {
      this.dataset = {};
      this.children = [];
      this.value = '';
      this.listeners = {};
      this.hidden = false;
      this.textContent = '';
    }
    append(...elements) { this.children.push(...elements); }
    replaceChildren(...elements) { this.children = elements; }
    insertBefore(element, avant) { this.children.splice(this.children.indexOf(avant), 0, element); }
    addEventListener(type, fonction) { this.listeners[type] = fonction; }
  }
  const elements = Object.fromEntries([
    '#filtres-menus', '#menu-list', '#filtre-resultat', '#filtre-prix-max',
    '#filtre-prix-min', '#filtre-prix-borne', '#filtre-personnes', '#filtre-theme', '#filtre-regime'
  ].map(id => [id, new Element()]));
  const context = vm.createContext({
    document: { querySelector: id => elements[id], createElement: () => new Element() },
    fetch: async () => ({ ok: disponible, status: disponible ? 200 : 503, json: async () => menus }),
    console: { error() {} },
    setTimeout
  });
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return elements;
}

const menu = {
  id: 'repas-test', name: 'Menu test', price: '23.00', minimum: 4, stock: 2,
  theme: 'Événement', regime: 'vegan', description: 'Une description.', image_path: 'images/images/menu-fete-vegetale.jpg'
};

test('le catalogue affiche les données de la base et le prix minimum', async () => {
  const elements = await charger([menu]);
  const carte = elements['#menu-list'].children[0];
  assert.equal(carte.dataset.price, 23);
  assert.equal(carte.dataset.theme, 'evenement');
  const contenu = carte.children[1];
  const prix = contenu.children[3];
  assert.equal(prix.children[0].textContent, '23,00 € par personne');
  assert.ok(prix.children.includes('92,00 € pour 4 personnes'));
  assert.equal(contenu.children[4].href, 'menu-detail.html?menu=repas-test');
});

test('les filtres et la disponibilité utilisent les données actuelles', async () => {
  const elements = await charger([menu, { ...menu, id: 'second', name: 'Autre', regime: 'classique', stock: 0 }]);
  const cartes = elements['#menu-list'].children;
  assert.equal(cartes[1].children[1].children[4].textContent, 'Indisponible actuellement');
  elements['#filtre-regime'].value = 'vegan';
  elements['#filtres-menus'].listeners.input();
  assert.equal(cartes[0].hidden, false);
  assert.equal(cartes[1].hidden, true);
  elements['#filtre-prix-max'].value = '20';
  elements['#filtres-menus'].listeners.input();
  assert.equal(cartes[0].hidden, true);
  assert.equal(elements['#filtre-resultat'].textContent, 'Aucun menu ne correspond à votre recherche.');
});

test('une erreur de serveur ne présente pas de menus périmés', async () => {
  const elements = await charger([], false);
  assert.equal(elements['#menu-list'].children.length, 0);
  assert.match(elements['#filtre-resultat'].textContent, /temporairement indisponibles/);
});
