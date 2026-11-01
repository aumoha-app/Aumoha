const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../src/lib/razorpay.ts'), 'utf8');
function load({ verifyOk = true, failAuth = false } = {}) {
  const calls = [];
  let checkout;
  const context = {
    exports: {}, process: { env: {} }, console,
    require: name => name === './api' ? { API_BASE: '/api' } : { auth: { getIdToken: async () => { if (failAuth) throw Error('signed out'); return 'verified-token'; } } },
    window: { location: { origin: 'https://aumoha.test' }, Razorpay: class { constructor(options) { checkout = options; } on() {} open() {} } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: url.endsWith('create-order') || verifyOk, json: async () => url.endsWith('create-order')
        ? { status: 'success', order_id: 'order1', key_id: 'server-key', amount: 40000, currency: 'INR' }
        : { status: verifyOk ? 'success' : 'error', message: 'not captured' } };
    },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return { pay: context.exports.processRazorpayPayment, calls, checkout: () => checkout };
}
test('checkout returns signatures and both supported field-name sets, using authenticated requests', async () => {
  const h = load();
  let result;
  await h.pay({ amount: 400, onSuccess: data => { result = data; } });
  assert.equal(h.checkout().key, 'server-key');
  await h.checkout().handler({ razorpay_order_id: 'order1', razorpay_payment_id: 'payment1', razorpay_signature: 'signature1' });
  assert.equal(result.signature, 'signature1');
  assert.equal(result.razorpay_signature, 'signature1');
  assert.equal(result.order_id, result.razorpay_order_id);
  assert.equal(result.payment_id, result.razorpay_payment_id);
  assert.equal(h.calls.length, 2);
  for (const call of h.calls) assert.equal(call.options.headers.Authorization, 'Bearer verified-token');
});
test('failed server verification never calls booking success', async () => {
  const h = load({ verifyOk: false });
  let succeeded = false, failed = false;
  await h.pay({ amount: 400, onSuccess: () => { succeeded = true; }, onFailure: () => { failed = true; } });
  await h.checkout().handler({ razorpay_order_id: 'order1', razorpay_payment_id: 'payment1', razorpay_signature: 'bad' });
  assert.equal(succeeded, false);
  assert.equal(failed, true);
});
test('signed-out users do not create payment orders', async () => {
  const h = load({ failAuth: true });
  let failed = false;
  await h.pay({ amount: 400, onSuccess: () => assert.fail('unexpected success'), onFailure: () => { failed = true; } });
  assert.equal(failed, true);
  assert.equal(h.calls.length, 0);
});
