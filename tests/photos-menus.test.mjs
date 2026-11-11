import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const photos = {
  'banquet-mariage': 'menu-banquet-mariage.jpg',
  'repas-anniversaire': 'menu-repas-anniversaire.jpg',
  'brunch-naissance': 'menu-brunch-naissance.jpg',
  'bapteme-communion': 'menu-bapteme-communion.jpg',
  'cocktail-dinatoire': 'menu-cocktail-dinatoire.jpg',
  reveillon: 'menu-noel.jpg',
  'dejeuner-paques': 'menu-dejeuner-paques.jpg',
  'marche-bordeaux': 'menu-marche-bordeaux.jpg',
  'fete-vegetale': 'menu-fete-vegetale.jpg'
};

test('chaque photo des menus existe et est définie dans les fichiers SQL', async () => {
  const [schema, miseAJour] = await Promise.all([
    readFile('sql/schema.sql', 'utf8'),
    readFile('sql/mise-a-jour-menus.sql', 'utf8')
  ]);
  for (const [id, photo] of Object.entries(photos)) {
    const chemin = `images/images/${photo}`;
    for (const sql of [schema, miseAJour]) {
      const ligne = sql.split('\n').find((texte) => texte.trimStart().startsWith(`('${id}',`));
      assert.ok(ligne?.includes(`'${chemin}'`), `Données SQL : ${id}`);
    }
    const contenu = await readFile(chemin);
    assert.deepEqual([...contenu.subarray(0, 3)], [0xff, 0xd8, 0xff], `Image JPEG : ${id}`);
  }
});
