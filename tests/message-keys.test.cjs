const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function fixture() {
  const storage = new Map();
  const rows = new Map();
  let writes = 0;
  const exports = {};
  const context = vm.createContext({ exports, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob,
    window: { localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) } } });
  const source = fs.readFileSync('src/lib/crypto/messages.ts','utf8');
  vm.runInContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, context);
  const db = { from() { return {
    async upsert(row, options) { writes++; if(!rows.has(row.user_id) || !options.ignoreDuplicates) rows.set(row.user_id,row); return {error:null}; },
    select() { return { eq(_column,id) { return { async maybeSingle() { return {data:rows.get(id),error:null}; } }; } }; }
  }; } };
  return { exports, storage, rows, db, writes: () => writes };
}

test('concurrent bootstrap and chat registration use the same device key', async () => {
  const f = fixture();
  const [a,b] = await Promise.all([f.exports.ensureOwnMessageKey(f.db,'alice'),f.exports.ensureOwnMessageKey(f.db,'alice')]);
  assert.equal(a.x,b.x); assert.equal(f.writes(),1);
});

test('a new device cannot silently replace the key protecting existing messages', async () => {
  const f = fixture();
  await f.exports.ensureOwnMessageKey(f.db,'alice');
  const original = f.rows.get('alice').public_key;
  f.storage.clear();
  await assert.rejects(f.exports.ensureOwnMessageKey(f.db,'alice'), /original device/);
  assert.equal(f.rows.get('alice').public_key, original);
});

test('encrypted chat round trips and refuses a different conversation context', async () => {
  const f = fixture();
  await f.exports.ensureOwnMessageKey(f.db,'alice');
  await f.exports.ensureOwnMessageKey(f.db,'bob');
  const encrypted = await f.exports.encryptMessage(f.db,'alice','bob','conversation-1','Hello from Android to iOS');
  assert.equal(await f.exports.decryptMessage(f.db,'bob','alice','conversation-1',encrypted),'Hello from Android to iOS');
  await assert.rejects(f.exports.decryptMessage(f.db,'bob','alice','conversation-2',encrypted));
});
