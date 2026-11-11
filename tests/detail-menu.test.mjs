import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../js/menu-detail.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../menu-detail.html', import.meta.url), 'utf8');
const menu = {
  id: 'repas-test', name: 'Menu test', price: '23.00', minimum: 4, stock: 2,
  theme: 'Fête', regime: 'classique', description: 'Un repas.',
  images: ['image.jpg'], conditions_text: 'Réserver en avance.',
  dishes: [
    { dish_type: 'entree', name: 'Salade', allergens: 'moutarde' },
    { dish_type: 'plat', name: 'Rôti', allergens: 'aucun' },
    { dish_type: 'dessert', name: 'Gâteau', allergens: 'gluten' }
  ]
};

async function ouvrir({ statut = 200, session = 401 } = {}) {
  class Element {
    constructor() { this.children = []; this.hidden = true; this.textContent = ''; }
    replaceChildren(...elements) { this.children = elements; }
    append(...elements) { this.children.push(...elements); }
    appendChild(element) { this.children.push(element); }
    querySelectorAll() { return []; }
    setAttribute() {}
  }
  const elements = {};
  const document = {
    querySelector(selecteur) {
      if (selecteur.startsWith('#')) {
        assert.ok(page.includes(`id="${selecteur.slice(1)}"`), `Identifiant absent : ${selecteur}`);
      }
      return elements[selecteur] ||= new Element();
    },
    createElement() { return new Element(); }
  };
  const window = { location: { search: '?menu=repas-test', href: '' }, showToast() {} };
  const contexte = vm.createContext({
    document, window, URLSearchParams, console: { error() {} },
    fetch: async (url) => url.startsWith('api/menus.php')
      ? { status: statut, ok: statut === 200, json: async () => menu }
      : { status: session, ok: session === 200 }
  });
  vm.runInContext(script, contexte);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, window };
}

test('la fiche présente le menu et ses plats avec les identifiants coordonnés', async () => {
  const { elements } = await ouvrir();
  assert.equal(elements['#titre-detail-menu'].textContent, 'Menu test');
  assert.match(elements['#total-detail-menu'].textContent, /92,00/);
  assert.equal(elements['#liste-entrees-menu'].children[0].textContent, 'Salade');
  assert.equal(elements['#liste-plats-menu'].children[0].textContent, 'Rôti');
  assert.equal(elements['#liste-desserts-menu'].children[0].textContent, 'Gâteau');
  assert.equal(elements['.disposition-detail'].hidden, false);
  assert.equal(elements['#lien-commande-menu'].hidden, false);
});

test('la commande sans connexion conserve le menu choisi', async () => {
  const { elements, window } = await ouvrir();
  await elements['#lien-commande-menu'].onclick({ preventDefault() {} });
  assert.equal(window.location.href, 'connexion.html?redirect=reservation.html%3Fmenu%3Drepas-test');
});

test('une fiche introuvable affiche une erreur et masque le contenu', async () => {
  const { elements } = await ouvrir({ statut: 404 });
  assert.equal(elements['#titre-detail-menu'].textContent, 'Menu introuvable.');
  assert.equal(elements['.disposition-detail'].hidden, true);
  assert.equal(elements['.informations-detail'].hidden, true);
});
