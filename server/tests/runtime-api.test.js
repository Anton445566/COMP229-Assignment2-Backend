import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import config from '../../config/config.js';
import app from '../express.js';
import User from '../models/user.model.js';
import Contact from '../models/contact.model.js';
import Project from '../models/project.model.js';
import Qualification from '../models/qualification.model.js';
import { seed } from '../scripts/seed.js';

const dbName = 'comp229a3t_' + process.pid + '_' + Date.now();
const secret = randomBytes(48).toString('hex');
config.jwtSecret = secret;
const password = 'Runtime-' + randomBytes(16).toString('hex');
let server, safe = false, checks = 0;
async function request(method, path, status, token, body) {
 const response = await fetch('http://127.0.0.1:' + server.address().port + path, {
  method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {})
 });
 const data = await response.json();
 assert.equal(response.status, status, method + ' ' + path + ': ' + JSON.stringify(data));
 checks++;
 return data;
}
try {
 await mongoose.connect(config.mongoUri, { dbName, serverSelectionTimeoutMS: 10000 });
 assert.equal(mongoose.connection.db.databaseName, dbName);
 assert.match(dbName, /^comp229a3t_\d+_\d+$/);
 safe = true;
 await Promise.all([User.init(), Contact.init(), Project.init(), Qualification.init()]);
 const admin = await new User({ name: 'Admin', email: 'admin@test.example', password, role: 'Admin' }).save();
 server = app.listen(0, '127.0.0.1');
 await new Promise(resolve => server.once('listening', resolve));
 await request('POST', '/api/users', 400, null, { name: 'Missing password', email: 'missing@test.example' });
 await request('POST', '/api/users', 400, null, { name: 'Bad email', email: 'invalid', password });
 await request('POST', '/api/users', 200, null, { name: 'Member', email: 'member@test.example', password, role: 'Admin', admin: true, _id: String(admin._id) });
 await request('POST', '/api/users', 400, null, { name: 'Duplicate', email: 'MEMBER@test.example', password });
 assert.equal((await User.findOne({ email: 'member@test.example' })).role, 'User'); checks++;
 const owner = await request('POST', '/auth/signin', 200, null, { email: admin.email, password });
 const member = await request('POST', '/auth/signin', 200, null, { email: 'MEMBER@test.example', password });
 assert.equal(owner.user.role, 'Admin'); assert.equal(member.user.role, 'User'); checks += 2;
 await request('POST', '/auth/signin', 401, null, { email: admin.email, password: 'wrong' });
 await request('POST', '/auth/signin', 400, null, { email: { $ne: null }, password });
 const a = owner.token, u = member.token, userPath = '/api/users/' + member.user._id;
 await request('GET', '/api/users', 401);
 await request('GET', '/api/users', 403, u);
 await request('GET', '/api/users', 200, a);
 await request('GET', '/api/users/' + admin._id, 403, u);
 await request('PUT', '/api/users/' + admin._id, 403, u, { name: 'Hijacked' });
 await request('DELETE', '/api/users/' + admin._id, 403, u);
 const updated = await request('PUT', userPath, 200, u, { name: 'Updated', role: 'Admin', hashed_password: 'injected', salt: 'injected' });
 assert.equal(updated.role, 'User'); checks++;
 assert.equal((await User.findById(member.user._id)).role, 'User'); checks++;
 await request('GET', userPath, 200, u);
 for (const token of ['invalid', jwt.sign({ sub: String(admin._id) }, secret, { expiresIn: -1, issuer: 'comp229-portfolio', audience: 'comp229-api' })])
  await request('GET', '/api/contacts', 401, token);
 const resources = [
  ['contacts', Contact, { firstname: 'Test', lastname: 'Contact', email: 'contact@test.example', contactNumber: '(555) 123-4567', message: 'Persist every field.' }, { message: 'Updated and persistent.' }],
  ['projects', Project, { title: 'Runtime project', firstname: 'Anton', lastname: 'Nasr', email: 'anton@test.example', completion: '2026-11-12', description: 'Persistent project' }, { description: 'Updated and persistent.' }],
  ['qualifications', Qualification, { title: 'Runtime qualification', institution: 'College', type: 'Education', completion: '2026-11-12', description: 'Persistent qualification' }, { description: 'Updated and persistent.' }]
 ];
 for (const [resource, Model, body, change] of resources) {
  const base = '/api/' + resource;
  if (resource === 'contacts') await request('GET', base, 401);
  else await request('GET', base, 200);
  await request('GET', base, 200, u);
  await request('POST', base, 401, null, body);
  await request('POST', base, 403, u, body);
  await request('POST', base, 400, a, {});
  await request('POST', base, 400, a, { ...body, email: 'invalid' });
  if (resource !== 'contacts') await request('POST', base, 400, a, { ...body, completion: 'not-a-date' });
  else await request('POST', base, 400, a, { ...body, contactNumber: 'abc' });
  const created = await request('POST', base, 201, a, body);
  const item = base + '/' + created._id;
  const read = await request('GET', item, 200, u);
  for (const key of Object.keys(body)) {
   assert.equal(read[key], key === 'completion' ? new Date(body[key]).toISOString() : body[key]); checks++;
  }
  assert.ok(await Model.findById(created._id)); checks++;
  await request('PUT', item, 401, null, change);
  await request('PUT', item, 403, u, change);
  await request('DELETE', item, 401);
  await request('DELETE', item, 403, u);
  await request('PUT', item, 400, a, resource === 'contacts' ? { firstname: ' ' } : { title: ' ' });
  await request('PUT', item, 200, a, { ...change, $unset: { title: 1 } });
  const reread = await request('GET', item, 200, u);
  for (const key of Object.keys(change)) { assert.equal(reread[key], change[key]); checks++; }
  // Reopen the connection and read again: data is in MongoDB, not a server-side array.
  await mongoose.disconnect();
  await mongoose.connect(config.mongoUri, { dbName, serverSelectionTimeoutMS: 10000 });
  assert.equal(mongoose.connection.db.databaseName, dbName);
  assert.deepEqual((await request('GET', item, 200, u))._id, created._id); checks++;
  for (const method of ['GET', 'PUT', 'DELETE']) {
   await request(method, base + '/not-an-id', 400, a, method === 'PUT' ? change : undefined);
   await request(method, base + '/' + new mongoose.Types.ObjectId(), 404, a, method === 'PUT' ? change : undefined);
  }
  await request('DELETE', item, 200, a);
  await request('GET', item, 404, u);
  await request('DELETE', base, 401);
  await request('DELETE', base, 403, u);
  await request('POST', base, 201, a, body);
  await request('DELETE', base, 200, a);
  assert.equal(await Model.countDocuments(), 0); checks++;
 }
 // Roles are reloaded from MongoDB rather than trusted from an old token.
 await User.updateOne({ _id: admin._id }, { $set: { role: 'User' } });
 await request('POST', '/api/projects', 403, a, resources[1][2]);
 await User.updateOne({ _id: admin._id }, { $set: { role: 'Admin' } });
 await request('GET', '/auth/signout', 200);
 await request('GET', '/api/users/bad', 400, a);
 await request('GET', '/api/users/' + new mongoose.Types.ObjectId(), 404, a);
 // Run setup twice against this disposable DB and verify existing admin and content remain unchanged.
 process.env.ADMIN_EMAIL = 'seed@test.example'; process.env.ADMIN_PASSWORD = password;
 await seed();
 const seeded = await User.findOne({ email: process.env.ADMIN_EMAIL }).select('+hashed_password +salt');
 const hash = seeded.hashed_password;
 await Project.updateOne({ title: 'Growing Planet' }, { $set: { description: 'Keep this edit' } });
 await seed();
 assert.equal((await User.findById(seeded._id).select('+hashed_password')).hashed_password, hash); checks++;
 assert.equal((await Project.findOne({ title: 'Growing Planet' })).description, 'Keep this edit'); checks++;
 assert.equal(await Project.countDocuments(), 3); checks++;
 assert.equal(await Qualification.countDocuments(), 4); checks++;
 process.env.ADMIN_EMAIL = 'member@test.example';
 await assert.rejects(seed(), /belongs to a User/); checks++;
 await request('DELETE', userPath, 200, u);
 await request('GET', userPath, 401, u);
 await request('DELETE', '/api/users', 401, owner.token.replace(/.$/, 'x'));
} catch (error) {
 console.error(error);
 process.exitCode = 1;
} finally {
 if (server) await new Promise(resolve => server.close(resolve));
 if (safe && mongoose.connection.db?.databaseName === dbName && /^comp229a3t_\d+_\d+$/.test(dbName))
  await mongoose.connection.db.dropDatabase();
 await mongoose.disconnect();
 console.log(JSON.stringify({ result: process.exitCode ? 'FAIL' : 'PASS', checks, database: dbName, existingDatabaseRecordsDeleted: 0 }));
}
