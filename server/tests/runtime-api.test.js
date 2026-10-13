import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';

const testDatabaseName = `comp229a2t_${process.pid}_${Date.now().toString(36)}`;
const ownerId = new mongoose.Types.ObjectId();
const runId = `${process.pid}-${Date.now()}`;
const ownerEmail = `owner-${runId}@example.test`;
const memberEmail = `member-${runId}@example.test`;
const password = `Test-${randomBytes(12).toString('hex')}`;
const jwtSecret = randomBytes(48).toString('hex');
const results = [];
let server;
let connectedToDisposableDatabase = false;

const record = (name, method, path, expected, actual) => {
  const passed = expected === actual;
  results.push({ name, method, path, expected, actual, passed });
  return passed;
};

const request = async (baseUrl, name, method, path, expected, { token, body } = {}) => {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let responseBody;
  try { responseBody = text ? JSON.parse(text) : undefined; } catch { responseBody = text; }
  if (!record(name, method, path, expected, response.status)) {
    throw new Error(`${name}: expected ${expected}, received ${response.status}; response ${JSON.stringify(responseBody)}`);
  }
  return responseBody;
};

try {
  const { default: config } = await import('../../config/config.js');
  if (!config.mongoUri) throw new Error('MONGODB_URI is required for the disposable runtime test');
  config.jwtSecret = jwtSecret;
  config.adminUserIds = [String(ownerId).toLowerCase()];

  await mongoose.connect(config.mongoUri, {
    dbName: testDatabaseName,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });
  if (mongoose.connection.db.databaseName !== testDatabaseName ||
      !testDatabaseName.startsWith('comp229a2t_')) {
    throw new Error('Refusing to test against a non-disposable database');
  }
  connectedToDisposableDatabase = true;

  const [{ default: app }, { default: User }, { default: Contact },
    { default: Project }, { default: Qualification }] = await Promise.all([
    import('../express.js'), import('../models/user.model.js'), import('../models/contact.model.js'),
    import('../models/project.model.js'), import('../models/qualification.model.js')
  ]);

  await new User({ _id: ownerId, name: 'Portfolio Owner', email: ownerEmail, password }).save();
  await Promise.all([Contact.init(), Project.init(), Qualification.init(), User.init()]);

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  await request(baseUrl, 'Backend welcome', 'GET', '/', 200);
  await request(baseUrl, 'Public user registration', 'POST', '/api/users', 200, {
    body: { name: 'Assignment Member', email: memberEmail, password }
  });
  const ownerSignin = await request(baseUrl, 'Owner sign-in', 'POST', '/auth/signin', 200, {
    body: { email: ownerEmail, password }
  });
  const memberSignin = await request(baseUrl, 'Member sign-in', 'POST', '/auth/signin', 200, {
    body: { email: memberEmail, password }
  });
  const ownerToken = ownerSignin.token;
  const memberToken = memberSignin.token;

  await request(baseUrl, 'Contacts require authentication for listing', 'GET', '/api/contacts', 401);
  await request(baseUrl, 'Public contact submission', 'POST', '/api/contacts', 200, {
    body: { firstname: 'Contact', lastname: 'One', email: `contact-one-${runId}@example.test` }
  });
  let contacts = await request(baseUrl, 'Get all contacts', 'GET', '/api/contacts', 200, { token: ownerToken });
  let contactId = String(contacts.find(item => item.email === `contact-one-${runId}@example.test`)._id);
  await request(baseUrl, 'Get contact by ID', 'GET', `/api/contacts/${contactId}`, 200, { token: ownerToken });
  await request(baseUrl, 'Update contact by ID', 'PUT', `/api/contacts/${contactId}`, 200, {
    token: ownerToken, body: { firstname: 'Updated' }
  });
  await request(baseUrl, 'Delete contact by ID', 'DELETE', `/api/contacts/${contactId}`, 200, { token: ownerToken });
  for (const number of [2, 3]) {
    await request(baseUrl, `Create contact ${number}`, 'POST', '/api/contacts', 200, {
      body: { firstname: 'Contact', lastname: String(number), email: `contact-${number}-${runId}@example.test` }
    });
  }
  await request(baseUrl, 'Ordinary user cannot delete all contacts', 'DELETE', '/api/contacts', 403, { token: memberToken });
  await request(baseUrl, 'Owner deletes all disposable contacts', 'DELETE', '/api/contacts', 200, { token: ownerToken });

  const resources = [
    {
      name: 'project', path: 'projects', Model: Project,
      body: { title: 'Runtime Project', firstname: 'Project', lastname: 'Tester', email: `project-${runId}@example.test`, completion: '2026-10-13', description: 'Disposable runtime test' },
      update: { description: 'Updated disposable runtime test' }
    },
    {
      name: 'qualification', path: 'qualifications', Model: Qualification,
      body: { title: 'Runtime Qualification', firstname: 'Qualification', lastname: 'Tester', email: `qualification-${runId}@example.test`, completion: '2026-10-13', description: 'Disposable runtime test' },
      update: { description: 'Updated disposable runtime test' }
    }
  ];

  for (const resource of resources) {
    await request(baseUrl, `Public get all ${resource.path}`, 'GET', `/api/${resource.path}`, 200);
    const created = await request(baseUrl, `Create ${resource.name}`, 'POST', `/api/${resource.path}`, resource.path === 'projects' ? 201 : 201, {
      token: ownerToken, body: resource.body
    });
    const id = String(created._id);
    await request(baseUrl, `Public get ${resource.name} by ID`, 'GET', `/api/${resource.path}/${id}`, 200);
    await request(baseUrl, `Update ${resource.name} by ID`, 'PUT', `/api/${resource.path}/${id}`, 200, {
      token: ownerToken, body: resource.update
    });
    await request(baseUrl, `Delete ${resource.name} by ID`, 'DELETE', `/api/${resource.path}/${id}`, 200, { token: ownerToken });
    for (const number of [2, 3]) {
      await request(baseUrl, `Create ${resource.name} ${number}`, 'POST', `/api/${resource.path}`, 201, {
        token: ownerToken,
        body: { ...resource.body, title: `${resource.body.title} ${number}`, email: `${resource.name}-${number}-${runId}@example.test` }
      });
    }
    await request(baseUrl, `Ordinary user cannot delete all ${resource.path}`, 'DELETE', `/api/${resource.path}`, 403, { token: memberToken });
    await request(baseUrl, `Owner deletes all disposable ${resource.path}`, 'DELETE', `/api/${resource.path}`, 200, { token: ownerToken });
  }

  const users = await request(baseUrl, 'Get all users', 'GET', '/api/users', 200, { token: ownerToken });
  const member = users.find(item => item.email === memberEmail);
  await request(baseUrl, 'Get own user by ID', 'GET', `/api/users/${member._id}`, 200, { token: memberToken });
  await request(baseUrl, 'Update own user by ID', 'PUT', `/api/users/${member._id}`, 200, {
    token: memberToken, body: { name: 'Updated Assignment Member' }
  });
  await request(baseUrl, 'Ordinary user cannot delete all users', 'DELETE', '/api/users', 403, { token: memberToken });
  await request(baseUrl, 'Delete own disposable user by ID', 'DELETE', `/api/users/${member._id}`, 200, { token: memberToken });
  await request(baseUrl, 'Owner deletes all disposable users', 'DELETE', '/api/users', 200, { token: ownerToken });
  await request(baseUrl, 'Sign-out', 'GET', '/auth/signout', 200);

  const counts = {
    contacts: await Contact.countDocuments(), projects: await Project.countDocuments(),
    qualifications: await Qualification.countDocuments(), users: await User.countDocuments()
  };
  if (Object.values(counts).some(count => count !== 0)) throw new Error('Disposable test records were not cleared');

  console.log(JSON.stringify({
    result: 'PASS', tests: results.length, passed: results.filter(item => item.passed).length,
    database: 'isolated disposable database', destructiveRequestsAgainstExistingDatabase: 0,
    checks: results, finalDisposableRecordCounts: counts
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', completed: results.length, message: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (connectedToDisposableDatabase && mongoose.connection.db?.databaseName === testDatabaseName) {
    try { await mongoose.connection.db.dropDatabase(); }
    catch (cleanupError) {
      console.error(JSON.stringify({ cleanup: 'FAIL', message: cleanupError.message }));
      process.exitCode = 1;
    }
  }
  await mongoose.disconnect();
}
