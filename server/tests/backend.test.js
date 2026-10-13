import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import config from '../../config/config.js';
import User from '../models/user.model.js';
import Contact from '../models/contact.model.js';
import Qualification from '../models/qualification.model.js';
import auth from '../controllers/auth.controller.js';
import contact from '../controllers/contact.controller.js';
import user from '../controllers/user.controller.js';
import qualification from '../controllers/qualification.controller.js';
import errors from '../controllers/error.controller.js';
import app from '../express.js';
import authRoutes from '../routes/auth.routes.js';
import userRoutes from '../routes/user.routes.js';
import contactRoutes from '../routes/contact.routes.js';
import projectRoutes from '../routes/project.routes.js';
import qualificationRoutes from '../routes/qualification.routes.js';

// Tests never start a listener or connect to MongoDB. DELETE routes are inspected only.
const originalConfig = { jwtSecret: config.jwtSecret, adminUserIds: config.adminUserIds };
const ownerId = '111111111111111111111111';
const memberId = '222222222222222222222222';
const secret = 'unit-test-only-signing-secret-with-at-least-32-bytes';
const result = () => ({
  statusCode: 200, body: undefined, cookies: [],
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  clearCookie(name, options) { this.cookies.push({ name, options }); return this; }
});
const request = (token) => ({ get: () => token ? `Bearer ${token}` : undefined });
const sign = (id = memberId, options = {}) => jwt.sign({ sub: id }, secret, {
  algorithm: 'HS256', expiresIn: '1h', issuer: 'comp229-portfolio', audience: 'comp229-api', ...options
});
const handlers = (router, method, path) => router.stack
  .filter(layer => layer.route?.path === path)
  .flatMap(layer => layer.route.stack.filter(item => item.method === method).map(item => item.handle));

// Dispatch directly through Express without opening an HTTP listener or sending network requests.
const dispatch = (method, path, body) => new Promise((resolve, reject) => {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = path;
  req.headers = { host: 'localhost' };
  if (body !== undefined) {
    req.headers['content-type'] = 'application/json';
    req.headers['content-length'] = String(Buffer.byteLength(body));
  }
  const res = new ServerResponse(req);
  const timeout = setTimeout(() => { socket.destroy(); reject(new Error('In-memory request timed out')); }, 2000);
  res.end = (chunk) => {
    clearTimeout(timeout);
    const text = chunk ? chunk.toString() : '';
    resolve({ status: res.statusCode, headers: res.getHeaders(), body: text ? JSON.parse(text) : undefined });
    res.emit('finish');
    socket.destroy();
    return res;
  };
  app.handle(req, res);
  if (body !== undefined) req.push(body);
  req.push(null);
});

before(() => {
  assert.equal(mongoose.connection.readyState, 0, 'Tests must not have a database connection');
  config.jwtSecret = secret;
  config.adminUserIds = [ownerId];
});
after(() => {
  Object.assign(config, originalConfig);
  assert.equal(mongoose.connection.readyState, 0, 'Tests must leave MongoDB disconnected');
});

test('new passwords are salted, verified, and excluded from serialization', async () => {
  const first = new User({ name: 'Test', email: 'first@example.test', password: 'test-password' });
  const second = new User({ name: 'Test', email: 'second@example.test', password: 'test-password' });
  await first.validate();
  await second.validate();
  assert.match(first.hashed_password, /^scrypt\$32768\$8\$3\$[a-f0-9]{128}$/);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hashed_password, second.hashed_password);
  assert.equal(await first.authenticate('test-password'), true);
  assert.equal(await first.authenticate('wrong-password'), false);
  for (const value of [first.toJSON(), first.toObject()]) {
    for (const field of ['hashed_password', 'salt', 'password', '_password']) {
      assert.equal(Object.hasOwn(value, field), false);
    }
  }
  assert.equal(User.schema.path('hashed_password').options.select, false);
  assert.equal(User.schema.path('salt').options.select, false);
});

test('assignment models expose the required contact, project, qualification, and user fields', async () => {
  const { default: Project } = await import('../models/project.model.js');
  const required = {
    Contact: [Contact, ['firstname', 'lastname', 'email']],
    Project: [Project, ['title', 'firstname', 'lastname', 'email', 'completion', 'description']],
    Qualification: [Qualification, ['title', 'firstname', 'lastname', 'email', 'completion', 'description']],
    User: [User, ['name', 'email', 'created', 'updated']]
  };
  for (const [name, [Model, fields]] of Object.entries(required)) {
    for (const field of fields) assert.ok(Model.schema.path(field), `${name}.${field} is required by the assignment`);
  }
  assert.notEqual(Contact.schema.path('email').options.unique, true);
  assert.notEqual(User.schema.path('email').options.unique, true);
});

test('missing, short, nonstring, and oversized passwords are rejected', async () => {
  for (const password of [undefined, '', 'short', 123456, 'x'.repeat(1025)]) {
    const record = new User({ name: 'Test', email: 'invalid@example.test', password });
    await assert.rejects(record.validate(), error => Boolean(error.errors.password));
  }
});

test('a mocked user save persists only a salted hash and clears the transient password', async (t) => {
  let inserted;
  t.mock.method(User.collection, 'insertOne', async document => {
    inserted = document;
    return { acknowledged: true, insertedId: document._id };
  });
  const record = new User({ name: 'Test', email: 'saved@example.test', password: 'test-password' });
  await record.save();
  assert.match(inserted.hashed_password, /^scrypt\$32768\$8\$3\$[a-f0-9]{128}$/);
  assert.match(inserted.salt, /^[a-f0-9]{32}$/);
  assert.equal(Object.hasOwn(inserted, 'password'), false);
  assert.equal(Object.hasOwn(inserted, '_password'), false);
  assert.equal(record.password, undefined);
});

test('legacy plaintext records are untouched and cannot authenticate', async () => {
  const record = User.hydrate({ _id: memberId, name: 'Legacy', email: 'legacy@example.test', hashed_password: 'legacy-password' });
  record.name = 'Updated in memory';
  await record.validate();
  assert.equal(record.hashed_password, 'legacy-password');
  assert.equal(record.salt, undefined);
  assert.equal(await record.authenticate('legacy-password'), false);
});

test('contact GET returns the retrieved record', () => {
  const record = { _id: memberId, firstname: 'Test', lastname: 'Contact', email: 'contact@example.test' };
  const res = result();
  contact.read({ contact: record }, res);
  assert.deepEqual(res.body, record);
});

test('contact update accepts schema fields only, using a mocked save', async () => {
  let saves = 0;
  const record = { firstname: 'Old', save: async () => { saves++; } };
  const res = result();
  await contact.update({ contact: record, body: { firstname: 'New', _id: ownerId, updated: 1, admin: true } }, res);
  assert.equal(saves, 1);
  assert.equal(record.firstname, 'New');
  for (const field of ['_id', 'updated', 'admin']) assert.equal(Object.hasOwn(record, field), false);
  assert.equal(res.statusCode, 200);
});

test('user registration ignores client-supplied internal fields', async (t) => {
  let record;
  t.mock.method(User.prototype, 'save', async function() { record = this; return this; });
  const res = result();
  await user.create({ body: {
    name: 'New', email: 'new@example.test', password: 'test-password',
    _id: ownerId, hashed_password: 'injected', salt: 'injected', admin: true
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.notEqual(String(record._id), ownerId);
  assert.equal(record.password, 'test-password');
  assert.equal(record.hashed_password, undefined);
  assert.equal(record.salt, undefined);
  assert.equal(record.admin, undefined);
});

test('user update prevents internal-field assignment and returns safe fields', async () => {
  const record = { _id: memberId, name: 'Old', email: 'member@example.test', hashed_password: 'private', salt: 'private', save: async () => {} };
  const res = result();
  await user.update({ profile: record, body: { name: 'New', hashed_password: 'injected', salt: 'injected', _id: ownerId, admin: true } }, res);
  assert.equal(record._id, memberId);
  assert.equal(record.hashed_password, 'private');
  assert.equal(record.salt, 'private');
  assert.equal(record.admin, undefined);
  assert.equal(res.body.name, 'New');
  assert.equal(Object.hasOwn(res.body, 'hashed_password'), false);
  assert.equal(Object.hasOwn(res.body, 'salt'), false);
});

test('valid missing contacts/users return 404, malformed IDs return 400', async (t) => {
  for (const [Model, load] of [[Contact, contact.contactByID], [User, user.userByID]]) {
    const stub = t.mock.method(Model, 'findById', async () => null);
    let res = result();
    await load({}, res, () => assert.fail('Must not continue'), memberId);
    assert.equal(res.statusCode, 404);
    stub.mock.restore();
    const castStub = t.mock.method(Model, 'findById', async () => { throw new mongoose.Error.CastError('ObjectId', 'bad-id', '_id'); });
    res = result();
    await load({}, res, () => assert.fail('Must not continue'), 'bad-id');
    assert.equal(res.statusCode, 400);
    castStub.mock.restore();
  }
});

test('error responses are meaningful and omit secrets', () => {
  assert.equal(errors.getErrorMessage({ code: 11000, keyPattern: { email: 1 }, keyValue: { email: 'private@example.test' } }), 'email already exists');
  const cast = new mongoose.Error.CastError('String', 'sensitive-value', 'password');
  assert.equal(errors.getErrorMessage(cast).includes('sensitive-value'), false);
  const res = result();
  errors.handleError(Object.assign(new SyntaxError('sensitive-value'), { type: 'entity.parse.failed' }), {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Invalid JSON request body' });
  const unexpected = result();
  errors.handleError(new Error('private database information'), {}, unexpected, () => {});
  assert.equal(unexpected.statusCode, 500);
  assert.equal(unexpected.body.error, 'An unexpected error occurred');
});

test('sign-in verifies a password and issues a limited JWT with safe user data', async (t) => {
  const record = new User({ _id: memberId, name: 'Member', email: 'member@example.test', password: 'test-password' });
  await record.validate();
  t.mock.method(User, 'findOne', filter => {
    assert.deepEqual(filter, { email: 'member@example.test' });
    return { select: async fields => { assert.equal(fields, '+hashed_password +salt'); return record; } };
  });
  const res = result();
  await auth.signin({ body: { email: 'member@example.test', password: 'test-password' } }, res);
  assert.equal(res.statusCode, 200);
  const claims = jwt.verify(res.body.token, secret, { algorithms: ['HS256'], issuer: 'comp229-portfolio', audience: 'comp229-api' });
  assert.equal(claims.sub, memberId);
  assert.equal(claims.exp - claims.iat, 3600);
  assert.deepEqual(Object.keys(res.body.user).sort(), ['_id', 'email', 'name']);
  assert.equal(Object.hasOwn(claims, 'admin'), false);
});

test('sign-in rejects bad credentials and injection-shaped inputs', async (t) => {
  t.mock.method(User, 'findOne', () => ({ select: async () => null }));
  let res = result();
  await auth.signin({ body: { email: 'missing@example.test', password: 'test-password' } }, res);
  assert.equal(res.statusCode, 401);
  res = result();
  await auth.signin({ body: { email: { $ne: null }, password: 'test-password' } }, res);
  assert.equal(res.statusCode, 400);
});

test('missing/weak JWT secrets fail closed without affecting public registration', async () => {
  const previous = config.jwtSecret;
  try {
    for (const value of [undefined, 'short']) {
      config.jwtSecret = value;
      const res = result();
      await auth.signin({ body: { email: 'test@example.test', password: 'test-password' } }, res);
      assert.equal(res.statusCode, 503);
    }
  } finally { config.jwtSecret = previous; }
  assert.deepEqual(handlers(userRoutes, 'post', '/api/users'), [user.create]);
});

test('JWT verification rejects absent, invalid, expired, wrong-audience, and wrong-algorithm tokens', async () => {
  for (const token of [undefined, 'invalid', sign(memberId, { expiresIn: -1 }),
    sign(memberId, { audience: 'other' }), sign(memberId, { algorithm: 'HS384' }), sign('invalid-id')]) {
    const res = result();
    await auth.requireSignin(request(token), res, () => assert.fail('Invalid token accepted'));
    assert.equal(res.statusCode, 401);
  }
});

test('valid JWTs identify existing users; tokens for deleted users are rejected', async (t) => {
  const stub = t.mock.method(User, 'findById', id => ({ select: async () => ({ _id: id }) }));
  const req = request(sign());
  let continued = false;
  await auth.requireSignin(req, result(), () => { continued = true; });
  assert.equal(continued, true);
  assert.deepEqual(req.auth, { _id: memberId });
  stub.mock.restore();
  t.mock.method(User, 'findById', () => ({ select: async () => null }));
  const res = result();
  await auth.requireSignin(request(sign()), res, () => assert.fail('Deleted user accepted'));
  assert.equal(res.statusCode, 401);
});

test('ordinary users cannot pass the bulk-delete owner guard; there is no default admin', () => {
  const denied = result();
  auth.requireAdmin({ auth: { _id: memberId } }, denied, () => assert.fail('Ordinary user elevated'));
  assert.equal(denied.statusCode, 403);
  let allowed = false;
  auth.requireAdmin({ auth: { _id: ownerId } }, result(), () => { allowed = true; });
  assert.equal(allowed, true);
  const previous = config.adminUserIds;
  try {
    config.adminUserIds = [];
    const res = result();
    auth.requireAdmin({ auth: { _id: ownerId } }, res, () => assert.fail('Default admin exists'));
    assert.equal(res.statusCode, 403);
  } finally { config.adminUserIds = previous; }
});

test('user account access is restricted to self or configured owner', () => {
  let allowed = 0;
  auth.hasAuthorization({ auth: { _id: memberId }, params: { userId: memberId } }, result(), () => allowed++);
  auth.hasAuthorization({ auth: { _id: ownerId }, params: { userId: memberId } }, result(), () => allowed++);
  assert.equal(allowed, 2);
  const res = result();
  auth.hasAuthorization({ auth: { _id: memberId }, params: { userId: ownerId } }, res, () => assert.fail('Cross-account access allowed'));
  assert.equal(res.statusCode, 403);
});

test('sign-out clears the legacy cookie and explains bearer-token disposal', () => {
  const res = result();
  auth.signout({}, res);
  assert.equal(res.cookies[0].name, 't');
  assert.match(res.body.message, /Discard your bearer token/);
});

test('all resource CRUD routes exist; every bulk-delete route has owner protection (no DELETE execution)', () => {
  for (const [router, collection, item] of [
    [contactRoutes, '/api/contacts', '/api/contacts/:contactId'],
    [userRoutes, '/api/users', '/api/users/:userId'],
    [projectRoutes, '/api/projects', '/api/projects/:id'],
    [qualificationRoutes, '/api/qualifications', '/api/qualifications/:id']
  ]) {
    for (const method of ['get', 'post', 'delete']) assert.ok(handlers(router, method, collection).length);
    for (const method of ['get', 'put', 'delete']) assert.ok(handlers(router, method, item).length);
    const bulk = handlers(router, 'delete', collection);
    assert.equal(bulk[0], auth.requireSignin);
    assert.equal(bulk[1], auth.requireAdmin);
    for (const method of ['put', 'delete']) assert.equal(handlers(router, method, item)[0], auth.requireSignin);
  }
});

test('approved public endpoints remain public and sensitive GET routes require authentication', () => {
  assert.deepEqual(handlers(authRoutes, 'post', '/auth/signin'), [auth.signin]);
  assert.deepEqual(handlers(authRoutes, 'get', '/auth/signout'), [auth.signout]);
  assert.deepEqual(handlers(contactRoutes, 'post', '/api/contacts'), [contact.create]);
  assert.deepEqual(handlers(userRoutes, 'post', '/api/users'), [user.create]);
  for (const [router, base] of [[projectRoutes, '/api/projects'], [qualificationRoutes, '/api/qualifications']]) {
    assert.equal(handlers(router, 'get', base).includes(auth.requireSignin), false);
    assert.equal(handlers(router, 'get', base + '/:id').includes(auth.requireSignin), false);
    assert.equal(handlers(router, 'post', base)[0], auth.requireSignin);
  }
  for (const [router, path] of [[contactRoutes, '/api/contacts'], [userRoutes, '/api/users']]) {
    assert.equal(handlers(router, 'get', path)[0], auth.requireSignin);
  }
  assert.equal(handlers(userRoutes, 'put', '/api/users/:userId')[1], auth.hasAuthorization);
  assert.equal(handlers(userRoutes, 'get', '/api/users/:userId')[1], auth.hasAuthorization);
});

test('middleware runs before routers, and the final error handler runs last', () => {
  const stack = app._router.stack;
  const firstRouter = stack.findIndex(layer => layer.name === 'router');
  for (const name of ['corsMiddleware', 'helmetMiddleware', 'compression', 'cookieParser', 'jsonParser', 'urlencodedParser']) {
    const index = stack.findIndex(layer => layer.name === name);
    assert.ok(index >= 0 && index < firstRouter, `${name} must precede routes`);
  }
  assert.equal(stack.at(-1).handle, errors.handleError);
});

test('the edited Express pipeline rejects anonymous sensitive GETs and adds security/CORS headers', async () => {
  for (const path of ['/api/contacts', '/api/users']) {
    const response = await dispatch('GET', path);
    assert.equal(response.status, 401);
    assert.equal(response.headers['access-control-allow-origin'], '*');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
  }
});

test('public contact submission parses JSON through Express, with persistence mocked', async (t) => {
  let saved;
  t.mock.method(Contact.prototype, 'save', async function() { saved = this; return this; });
  const response = await dispatch('POST', '/api/contacts', JSON.stringify({ firstname: 'Test', lastname: 'Contact', email: 'test@example.test' }));
  assert.equal(response.status, 200);
  assert.equal(saved.firstname, 'Test');
  assert.equal(saved.email, 'test@example.test');
});

test('malformed JSON reaches the final error handler before any contact save', async (t) => {
  const stub = t.mock.method(Contact.prototype, 'save', async () => assert.fail('Malformed input reached persistence'));
  const response = await dispatch('POST', '/api/contacts', '{invalid-json');
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Invalid JSON request body' });
  assert.equal(stub.mock.callCount(), 0);
});

test('qualification queries retain the exact URL ID and return 404 only for missing results (mocked)', async (t) => {
  const id = '6aec9116f39bdf9e9f4fc5e8';
  let found = { _id: id, title: 'Software Engineering Technology', institution: 'Centennial College' };
  t.mock.method(Qualification, 'findById', async requestedId => { assert.equal(requestedId, id); return found; });
  t.mock.method(Qualification, 'findByIdAndUpdate', async (requestedId, body, options) => {
    assert.equal(requestedId, id);
    assert.deepEqual(options, { new: true, runValidators: true });
    return found;
  });
  for (const exists of [true, false]) {
    if (!exists) found = null;
    for (const handler of [qualification.getQualificationById, qualification.updateQualification]) {
      const res = result();
      await handler({ params: { id }, body: { description: 'In-memory test' } }, res);
      assert.equal(res.statusCode, exists ? 200 : 404);
    }
  }
});

test('editing a loaded user without a password does not require or rewrite password fields', async () => {
  const record = User.hydrate({ _id: memberId, name: 'Member', email: 'member@example.test' }, { name: 1, email: 1 });
  record.name = 'Updated in memory';
  await record.validate();
  assert.equal(record.hashed_password, undefined);
  assert.equal(record.isModified('hashed_password'), false);
});

test('Postman collection defaults to blocked resource writes and destructive tests', () => {
  const collection = JSON.parse(fs.readFileSync(new URL('./COMP229.postman_collection.json', import.meta.url), 'utf8'));
  const variables = Object.fromEntries(collection.variable.map(item => [item.key, item.value]));
  assert.equal(variables.allowWriteTests, 'false');
  assert.equal(variables.allowDestructiveTests, 'false');
  const gate = collection.event.find(item => item.listen === 'prerequest').script.exec.join('\n');
  assert.match(gate, /skipRequest/);
  assert.match(gate, /allowDestructiveTests/);
  for (const folder of collection.item.filter(folder => ['Contacts', 'Users', 'Projects', 'Qualifications'].includes(folder.name))) {
    assert.equal(folder.item.filter(item => item.request.method === 'DELETE').length, 2);
  }
});
