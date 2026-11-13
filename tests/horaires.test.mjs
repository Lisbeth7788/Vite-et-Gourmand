import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../js/admin-horaires.js', import.meta.url), 'utf8');

async function ouvrirHoraires(echecEnregistrement = false, chargementImpossible = false) {
  class Element {
    constructor() { this.listeners = {}; this.dataset = {}; this.value = ''; this.disabled = true; this.options = []; }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    append(option) {
      this.options.push(option);
      if (this.options.length === 1) this.value = option.value;
    }
  }
  const elements = Object.fromEntries(
    ['#horaires-form', '#horaires-jour', '#horaires-valeur', '#horaires-enregistrer', '#horaires-retour']
      .map((id) => [id, new Element()])
  );
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    .map((nom, index) => ({ day_of_week: index + 1, day_name: nom, opening_hours: `${index + 9}h00 - 17h00` }));
  const requetes = [];
  const contexte = vm.createContext({
    document: { querySelector: (id) => elements[id], createElement: () => new Element() },
    demanderJson: chargementImpossible ? undefined : async (url, options) => {
      if (!options) return jours;
      requetes.push(JSON.parse(options.body));
      if (echecEnregistrement) throw new Error('Enregistrement impossible.');
      return { message: 'Horaires enregistrés.' };
    }
  });
  await vm.runInContext(`(async () => { ${script} })()`, contexte);
  return { elements, requetes };
}

test('modifier un seul jour puis retrouver sa valeur', async () => {
  const { elements, requetes } = await ouvrirHoraires();
  const jour = elements['#horaires-jour'];
  const valeur = elements['#horaires-valeur'];
  assert.equal(jour.options.length, 7);
  jour.value = '2';
  jour.listeners.change();
  assert.equal(valeur.value, '10h00 - 17h00');
  valeur.value = ' Fermé ';
  await elements['#horaires-form'].listeners.submit({ preventDefault() {} });
  assert.deepEqual(requetes, [{ day_of_week: 2, opening_hours: 'Fermé' }]);
  assert.equal(elements['#horaires-retour'].textContent, 'Horaires enregistrés.');
  jour.value = '1';
  jour.listeners.change();
  assert.equal(valeur.value, '9h00 - 17h00');
  jour.value = '2';
  jour.listeners.change();
  assert.equal(valeur.value, 'Fermé');
});

test('un échec reste visible et la saisie est conservée', async () => {
  const { elements } = await ouvrirHoraires(true);
  elements['#horaires-valeur'].value = 'Fermé';
  await elements['#horaires-form'].listeners.submit({ preventDefault() {} });
  assert.equal(elements['#horaires-retour'].textContent, 'Enregistrement impossible.');
  assert.equal(elements['#horaires-retour'].dataset.state, 'error');
  assert.equal(elements['#horaires-valeur'].value, 'Fermé');
  assert.equal(elements['#horaires-enregistrer'].disabled, false);
});

test('la page indique une erreur si le script de gestion ne charge pas', async () => {
  const { elements } = await ouvrirHoraires(false, true);
  assert.match(elements['#horaires-retour'].textContent, /page de gestion n’a pas pu être chargée/);
  assert.equal(elements['#horaires-retour'].dataset.state, 'error');
  assert.equal(elements['#horaires-enregistrer'].disabled, true);
});
