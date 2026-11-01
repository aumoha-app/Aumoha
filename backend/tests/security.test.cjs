const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
let readyState = 1;
Object.defineProperty(mongoose.connection, 'readyState', { get: () => readyState });
let firebaseReady = true;
let user = { uid: 'owner-uid', email: 'owner@example.test', email_verified: true };
let verifyCalls = 0;
let writes = 0;
let slotQuery;
let rollback;
let throwOnCreate = false;
let amount = 40000;
let captured = true;
const appt = { _id: 'appt1', bookingId: 'BOOK1', userEmail: 'owner@example.test', vetId: 'doctor1', status: 'confirmed' };
const doctor = { _id: 'doctor1', email: 'doctor@example.test', isApproved: true, fee: 400,
  name: 'Test Vet', specialisation: 'General', availableSlots: [{ _id: 'slot1', date: '2099-12-31', time: '10:00 AM', isBooked: false }], save: async () => {} };
const query = value => ({ then: (resolve, reject) => Promise.resolve(value).then(resolve, reject), sort() { return this; }, lean() { return this; }, select() { return this; } });
const models = {
  appointmentModel: {
    findOne: () => query(appt), find: () => query([appt]), deleteOne: async () => { writes++; },
    create: async data => { writes++; if (throwOnCreate) throw new Error('simulated persistence failure'); return data; },
    findOneAndUpdate: async () => { writes++; return appt; }
  },
  vetModel: {
    findOne: filter => query(filter._id === 'other-doctor' ? { ...doctor, _id: 'other-doctor', email: 'other@example.test' } : doctor),
    findById: () => query(doctor), find: () => query([doctor]),
    findOneAndUpdate: async filter => { slotQuery = filter; return doctor; },
    updateOne: async filter => { rollback = filter; },
  },
  productModel: { find: () => query([]) },
  userModel: { find: () => query([]), findOne: () => query(null), findOneAndDelete: async filter => { writes++; assert.deepEqual(filter, { firebaseUid: user.uid }); } },
  activityModel: { findById: () => query({ ...appt, userEmail: 'other@example.test' }) },
  callSessionModel: { findOne: () => query(null), findOneAndUpdate: async () => { writes++; return null; } },
};
process.env.APP_MODE = 'test';
process.env.CUSTOMER_PAYMENTS_ENABLED = 'true';
process.env.RAZORPAY_KEY_ID = 'rzp_test_fixture';
process.env.RAZORPAY_KEY_SECRET = 'unit-test-secret';
process.env.ADMIN_EMAILS = 'admin@example.test';
process.env.ADMIN_PASSWORD = 'configured-test-password';
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'firebase-admin/app') return { getApps: () => firebaseReady ? [{}] : [], initializeApp() {}, cert() {} };
  if (request === 'firebase-admin/auth') return { getAuth: () => ({ verifyIdToken: async token => { verifyCalls++; if (token !== 'verified') throw new Error('invalid token'); return user; } }) };
  if (request === 'razorpay') return class {
    orders = { create: async data => ({ ...data, id: 'order1' }), fetch: async () => ({ amount, currency: 'INR', notes: { app_user_uid: 'owner-uid' } }) };
    payments = { fetch: async () => ({ amount, order_id: 'order1', currency: 'INR', status: captured ? 'captured' : 'authorized' }) };
  };
  if (request === './lib/emailService') return { sendEmail: async () => {}, generateBookingEmailHtml: () => '', generateDonationEmailHtml: () => '' };
  if (request.startsWith('./models/')) {
    const key = request.split('/').pop();
    return { __esModule: true, default: models[key] || {} };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { app } = require('../dist/index');
Module._load = originalLoad;
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
async function request(path, method = 'GET', body, token = 'verified', extra = {}) {
  return fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
}
function identity(email) { user = { uid: email === 'owner@example.test' ? 'owner-uid' : 'other-uid', email, email_verified: true }; }

test('unsigned JWT payloads and mock tokens are rejected through the Firebase verifier', async () => {
  const forged = 'eyJhbGciOiJub25lIn0.' + Buffer.from(JSON.stringify({ sub: 'victim', email: 'admin@example.test' })).toString('base64url') + '.fake';
  for (const token of [forged, 'mock-token-owner:admin@example.test', 'expired']) {
    const before = verifyCalls;
    assert.equal((await request('/api/auth/admin-config', 'GET', undefined, token)).status, 401);
    assert.equal(verifyCalls, before + 1);
  }
});
test('unavailable Firebase fails closed', async () => {
  firebaseReady = false;
  assert.equal((await request('/api/auth/admin-config')).status, 503);
  firebaseReady = true;
});
test('default admin password and ordinary authenticated users cannot gain admin access', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/auth/verify-admin', 'POST', { password: 'aumoha2026' }, 'verified', { 'x-admin-password': 'aumoha2026' })).status, 403);
});
test('verified allowlisted admin can pass the configured second lock; unverified allowlist cannot', async () => {
  identity('admin@example.test');
  assert.equal((await request('/api/auth/verify-admin', 'POST', { password: 'configured-test-password' })).status, 200);
  user.email_verified = false;
  assert.equal((await request('/api/auth/verify-admin', 'POST', { password: 'configured-test-password' })).status, 403);
  identity('owner@example.test');
});
test('unrelated users cannot read call metadata, signal, delete, cancel, prescribe, or complete appointments', async () => {
  identity('other@example.test');
  const before = writes;
  for (const [method, path, body] of [
    ['GET', '/call'], ['POST', '/call/signal', { signal: {} }], ['GET', '/call/signals'],
    ['DELETE', ''], ['PUT', '/cancel', {}], ['PUT', '/notes', { prescription: 'tampered' }],
    ['PUT', '/accept', {}], ['PUT', '/reject', {}], ['PUT', '/consultation/start', {}], ['PUT', '/consultation/end', {}], ['GET', '/token']
  ]) assert.equal((await request('/api/appointments/BOOK1' + path, method, body)).status, 403, path);
  assert.equal(writes, before);
});
test('a provider cannot access another provider appointment simply by having a Vet profile', async () => {
  identity('other@example.test');
  assert.equal((await request('/api/appointments/BOOK1/call/request', 'POST', {})).status, 403);
});
test('owners may signal their appointments; only the assigned doctor can accept or prescribe', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/appointments/BOOK1/call/signal', 'POST', { signal: {} })).status, 200);
  assert.equal((await request('/api/appointments/BOOK1/accept', 'PUT', {})).status, 403);
  assert.equal((await request('/api/appointments/BOOK1/notes', 'PUT', { prescription: 'fake' })).status, 403);
  identity('doctor@example.test');
  assert.equal((await request('/api/appointments/BOOK1/accept', 'PUT', {})).status, 200);
});
test('provider ID parameters cannot disclose or change somebody else profile or booking list', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/provider/me?providerId=other-doctor')).status, 403);
  assert.equal((await request('/api/provider/profile', 'PUT', { providerId: 'other-doctor', fee: 1 })).status, 403);
  assert.equal((await request('/api/provider/slots', 'PUT', { providerId: 'other-doctor', slots: [] })).status, 403);
  assert.equal((await request('/api/appointments?vetId=other-doctor')).status, 403);
});
test('database outage returns 503 before emergency writes can report false success', async () => {
  readyState = 0;
  assert.equal((await request('/api/sos', 'POST', { category: 'dog', severity: 'urgent', reason: 'help' })).status, 503);
  readyState = 1;
});
test('negative and non-finite bulk slot intervals return 400', async () => {
  identity('doctor@example.test');
  for (const intervalMinutes of [-30, 'NaN', 0, 0.5]) {
    assert.equal((await request('/api/provider/me/slots/bulk', 'POST', { startTime: '09:00', endTime: '10:00', intervalMinutes })).status, 400);
  }
});
test('editing another community author post is rejected', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/activities', 'POST', { id: '507f1f77bcf86cd799439011', category: 'event', title: 'x', description: 'x', location: 'x' })).status, 403);
});
test('profile deletion uses firebaseUid, not an unknown uid field', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/auth/account', 'DELETE')).status, 200);
});
const signature = crypto.createHmac('sha256', 'unit-test-secret').update('order1|payment1').digest('hex');
test('payment verification requires captured funds and authenticated order ownership', async () => {
  identity('owner@example.test');
  const body = { razorpay_order_id: 'order1', razorpay_payment_id: 'payment1', razorpay_signature: signature };
  captured = false;
  assert.equal((await request('/api/verify-payment', 'POST', body)).status, 400);
  captured = true;
  identity('other@example.test');
  assert.equal((await request('/api/verify-payment', 'POST', body)).status, 400);
  identity('owner@example.test');
  assert.equal((await request('/api/verify-payment', 'POST', body)).status, 200);
});
test('bookings reject partial payment fields, missing slots and underpayment', async () => {
  identity('owner@example.test');
  const body = { vetId: 'doctor1', slotId: 'slot1', petName: 'Test pet' };
  assert.equal((await request('/api/appointments', 'POST', { ...body, razorpayPaymentId: 'payment1' })).status, 400);
  assert.equal((await request('/api/appointments', 'POST', { ...body, slotId: 'invented' })).status, 404);
  amount = 100;
  assert.equal((await request('/api/appointments', 'POST', { ...body, razorpayPaymentId: 'payment1', razorpayOrderId: 'order1', razorpaySignature: signature })).status, 400);
  amount = 40000;
});
test('slot claim uses same-element matching and is released if appointment persistence fails', async () => {
  identity('owner@example.test');
  throwOnCreate = true;
  doctor.availableSlots[0].isBooked = false;
  assert.equal((await request('/api/appointments', 'POST', { vetId: 'doctor1', slotId: 'slot1', petName: 'Test pet' })).status, 500);
  assert.deepEqual(slotQuery.availableSlots, { $elemMatch: { _id: 'slot1', isBooked: false } });
  assert.equal(rollback.availableSlots.$elemMatch._id, 'slot1');
  assert.ok(rollback.availableSlots.$elemMatch.bookedBy.startsWith('AMC-'));
  throwOnCreate = false;
});
test('donation receipts require a captured payment', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/donations', 'POST', { amount: 100, description: 'feeding' })).status, 400);
});

test('empty catalogs and community directories return empty data without demo records or writes', async () => {
  identity('owner@example.test');
  const before = writes;
  for (const [path, key] of [['/api/products', 'products'], ['/api/users', 'users'], ['/api/users/rescuers', 'rescuers']]) {
    const res = await request(path);
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json())[key], []);
  }
  assert.equal(writes, before);
});
test('full provider directory requires an admin account', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/admin/vets')).status, 403);
  identity('admin@example.test');
  assert.equal((await request('/api/admin/vets')).status, 200);
  identity('owner@example.test');
});

test('event mode reports readiness without secrets and blocks customer payments and bookings even with a signed-in user', async () => {
  process.env.APP_MODE = 'event';
  identity('owner@example.test');
  readyState = 0;
  const capabilities = await request('/api/capabilities');
  assert.equal(capabilities.status, 200);
  const data = await capabilities.json();
  assert.equal(data.consultationsAvailable, false);
  assert.equal(data.customerPaymentsAvailable, false);
  assert.equal(data.paymentsTestMode, true);
  assert.equal(JSON.stringify(data).includes('unit-test-secret'), false);
  for (const path of ['/api/create-order', '/api/donations']) assert.equal((await request(path, 'POST', {})).status, 403);
  for (const path of ['/api/appointments', '/api/instant-consultation/find']) assert.equal((await request(path, 'POST', {})).status, 503);
  assert.deepEqual((await (await request('/api/vets')).json()).vets, []);
  assert.equal((await request('/api/sos', 'POST', {})).status, 403);
  process.env.APP_MODE = 'test';
  readyState = 1;
});
test('integration checks stay private and test checkout never accepts live Razorpay keys', async () => {
  identity('owner@example.test');
  assert.equal((await request('/api/integrations/razorpay/test-order', 'POST', {})).status, 403);
  identity('admin@example.test');
  assert.equal((await request('/api/integrations/razorpay/test-order', 'POST', {})).status, 200);
  process.env.RAZORPAY_KEY_ID = 'rzp_live_fixture';
  assert.equal((await request('/api/integrations/razorpay/test-order', 'POST', {})).status, 503);
  process.env.RAZORPAY_KEY_ID = 'rzp_test_fixture';
  assert.equal((await request('/api/integrations/agora/test-token')).status, 503);
  identity('owner@example.test');
});
