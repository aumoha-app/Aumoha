const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { generateKeyPairSync, createPublicKey } = require('node:crypto');

test('Firebase authentication loads when the host disables synchronous require(ESM)', () => {
  execFileSync(process.execPath, ['--no-experimental-require-module', '-e', "require('firebase-admin/auth')"], { cwd: require('node:path').resolve(__dirname, '..'), stdio: 'pipe' });
});
test('the compatibility dependency still imports RSA JWK signing keys correctly', async () => {
  const { retrieveSigningKeys } = require('jwks-rsa/src/utils');
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  const keys = await retrieveSigningKeys([{ ...jwk, use: 'sig', alg: 'RS256', kid: 'test-key' }]);
  assert.equal(keys.length, 1);
  assert.deepEqual(createPublicKey(keys[0].getPublicKey()).export({ format: 'der', type: 'spki' }), publicKey.export({ format: 'der', type: 'spki' }));
});
