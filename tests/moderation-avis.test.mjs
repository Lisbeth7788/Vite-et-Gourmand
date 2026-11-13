import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../js/admin.js', import.meta.url), 'utf8');

for (const role of ['admin', 'employe']) {
  test(`publication et refus d’un avis pour ${role}`, async () => {
    const listeners = {};
    const liste = { innerHTML: '', textContent: '', addEventListener: (type, handler) => { listeners[type] = handler; } };
    const identite = { textContent: '' };
    const avis = { id: 4, rating: 4, comment: 'Service agréable', status: 'pending', created_at: '2026-01-01' };
    const operations = [];
    const contexte = vm.createContext({
      document: {
        querySelector: id => id === '#review-list' ? liste : id === '#admin-identity' ? identite : null,
        querySelectorAll: () => [],
        body: { hasAttribute: () => false }
      },
      window: { location: {}, alert: message => { throw new Error(message); } },
      URLSearchParams,
      setTimeout,
      fetch: async (url, options = {}) => {
        if (url === 'api/auth/session.php') return { ok: true, json: async () => ({ user: { role, email: 'gestion@example.test' } }) };
        if (options.method === 'PATCH') {
          const decision = JSON.parse(options.body);
          operations.push(decision);
          avis.status = decision.status;
          return { ok: true, json: async () => ({ message: 'Avis modéré.' }) };
        }
        return { ok: true, json: async () => [avis] };
      }
    });
    vm.runInContext(script, contexte);
    await new Promise(resolve => setImmediate(resolve));
    assert.match(liste.innerHTML, /Service agréable/);

    for (const decision of ['approved', 'rejected']) {
      await listeners.click({
        target: { closest: () => ({ dataset: { reviewId: '4', reviewStatus: decision } }) }
      });
      assert.deepEqual(operations.at(-1), { id: '4', status: decision });
      assert.match(liste.innerHTML, decision === 'approved' ? /Publié/ : /Refusé/);
    }
  });
}
