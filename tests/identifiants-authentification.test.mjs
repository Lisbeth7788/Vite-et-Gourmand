import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const connexion = await readFile(new URL('../connexion.html', import.meta.url), 'utf8');
const inscription = await readFile(new URL('../inscription.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../js/script.js', import.meta.url), 'utf8');

test('les sélecteurs des formulaires correspondent aux pages', () => {
  for (const [page, identifiants] of [
    [connexion, ['panneau-connexion-client', 'formulaire-connexion-client', 'formulaire-reinitialisation', 'formulaire-confirmation-reinitialisation', 'titre-reinitialisation']],
    [inscription, ['formulaire-inscription', 'mot-de-passe-inscription', 'confirmation-mot-de-passe']]
  ]) {
    for (const identifiant of identifiants) {
      assert.ok(page.includes(`id="${identifiant}"`), `Identifiant HTML absent : ${identifiant}`);
      assert.ok(script.includes(`#${identifiant}`) || script.includes(`'${identifiant}'`), `Référence JavaScript absente : ${identifiant}`);
    }
  }
});

test('les étiquettes et aides ciblent des éléments existants', () => {
  for (const page of [connexion, inscription]) {
    for (const [, identifiant] of page.matchAll(/\b(?:for|aria-labelledby|aria-describedby)="([^"]+)"/g)) {
      assert.ok(page.includes(`id="${identifiant}"`), `Cible absente : ${identifiant}`);
    }
  }
});

test('le lien existant de réinitialisation reste utilisable', () => {
  assert.ok(connexion.includes('href="#password-reset"'));
  assert.ok(connexion.includes('id="password-reset"'));
  assert.ok(script.includes("window.location.hash === '#password-reset'"));
});
