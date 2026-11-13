import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const page = await readFile(new URL('../admin-menus.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../js/admin-menus.js', import.meta.url), 'utf8');

test('la gestion des menus reste utilisable sans section horaires', async () => {
  const menu = {
    id: 'menu-test', name: 'Menu test', price: 20, minimum_people: 4, stock: 3,
    theme: 'Fête', regime: 'classique', images: '', description: 'Description',
    conditions_text: '', plats: { entrees: '', plats: '', desserts: '' }
  };
  class Element {
    constructor() { this.listeners = {}; this.dataset = {}; this.innerHTML = ''; }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    scrollIntoView() {}
  }
  const formulaire = new Element();
  formulaire.elements = Object.fromEntries(
    ['id', 'name', 'price', 'minimum_people', 'stock', 'theme', 'regime', 'images', 'description', 'conditions_text', 'entrees', 'plats', 'desserts']
      .map(nom => [nom, { value: '' }])
  );
  const liste = new Element();
  const details = new Element();
  const elements = {
    '#menu-form': formulaire, '#menu-retour': new Element(), '#menu-liste': liste,
    '#menus-maj': null
  };
  const ids = { 'menu-details': details, 'menu-ajouter': new Element() };
  const requetes = [];
  const contexte = vm.createContext({
    document: {
      querySelector: id => elements[id] || null,
      getElementById: id => ids[id]
    },
    demanderJson: async url => { requetes.push(url); return [menu]; },
    echapperHtml: valeur => String(valeur),
    window: {}
  });
  await vm.runInContext(`(async () => { ${script} })()`, contexte);
  assert.match(page, /<h1>Menus<\/h1>/);
  assert.doesNotMatch(page, /id="horaires-liste"/);
  assert.match(page, /class="horaires-ouverture"/);
  assert.deepEqual(requetes, ['api/admin/menus.php']);
  assert.match(liste.innerHTML, /Menu test/);

  await liste.listeners.click({
    target: { closest: selecteur => selecteur === '[data-menu-modifier]' ? { dataset: { menuModifier: 'menu-test' } } : null }
  });
  assert.equal(formulaire.elements.id.value, 'menu-test');
  assert.equal(formulaire.elements.stock.value, 3);
  assert.equal(details.open, true);
});
