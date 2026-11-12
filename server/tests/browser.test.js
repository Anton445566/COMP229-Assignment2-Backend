import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { chromium } from 'playwright';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import config from '../../config/config.js';
import app from '../express.js';
import User from '../models/user.model.js';
import { seed } from '../scripts/seed.js';

const dbName = 'comp229a3browser_' + process.pid + '_' + Date.now();
const out = path.resolve('submission');
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
const password = 'Browser-demo-password-2026';
const shots = [], errors = [];
let server, vite, browser, safe = false, checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
async function screenshot(page, name, explanation, fullPage = true) {
 const title = name.replace(/^\d+-/, '').replaceAll('-', ' ');
 const number = String(shots.length + 1).padStart(2, '0');
 const file = path.join(out, 'screenshots', number + '-' + name.replace(/^\d+-/, '') + '.png');
 await page.screenshot({ path: file, fullPage });
 shots.push({ name: number + '. ' + title, explanation, file });
}
async function waitText(page, text) { await page.getByText(text, { exact: false }).first().waitFor(); checks++; }
async function login(page, email) {
 await page.goto('http://127.0.0.1:5173/signin');
 await page.getByLabel('Email', { exact: true }).fill(email);
 await page.getByLabel('Password', { exact: true }).fill(password);
 await page.getByRole('button', { name: 'Sign in', exact: true }).click();
 await page.waitForURL(url => url.pathname !== '/signin');
 await page.goto('http://127.0.0.1:5173/projects');
 checks++;
}
try {
 await mongoose.connect(config.mongoUri, { dbName, serverSelectionTimeoutMS: 10000 });
 assert.equal(mongoose.connection.db.databaseName, dbName); safe = true;
 process.env.ADMIN_EMAIL = 'browser-admin@example.test'; process.env.ADMIN_PASSWORD = password;
 await User.init(); await seed();
 server = app.listen(3000, '127.0.0.1'); await once(server, 'listening');
 vite = spawn(process.execPath, [path.resolve('client/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: path.resolve('client'), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
 let viteOutput = '';
 vite.stdout.on('data', chunk => { viteOutput += chunk; });
 vite.stderr.on('data', chunk => { viteOutput += chunk; });
 for (let i = 0; i < 50; i++) {
  try { if ((await fetch('http://127.0.0.1:5173')).ok) break; } catch {}
  if (i === 49) throw new Error('Vite did not start: ' + viteOutput);
  await new Promise(resolve => setTimeout(resolve, 200));
 }
 browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 page.on('pageerror', error => errors.push(error.message));
 await page.goto('http://127.0.0.1:5173/');
 await waitText(page, "Hi, I'm Anton Nasr");
 await screenshot(page, '01-home', 'The original portfolio layout, introduction, navigation, and styling remain in place.');
 await page.goto('http://127.0.0.1:5173/admin/projects/new');
 await page.waitForURL('**/signin'); checks++;
 await page.goto('http://127.0.0.1:5173/signup');
 await page.getByLabel('Name', { exact: true }).fill('Demo User');
 await page.getByLabel('Email', { exact: true }).fill('browser-user@example.test');
 await page.getByLabel('Password', { exact: true }).fill(password);
 await screenshot(page, '02-signup', 'The signup form collects name, email, and password. New accounts receive the User role.');
 await page.getByRole('button', { name: 'Create account', exact: true }).click();
 await page.waitForURL('**/signin');
 await waitText(page, 'Account created.');
 await page.getByLabel('Email', { exact: true }).fill('browser-user@example.test');
 await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
 await page.getByRole('button', { name: 'Sign in', exact: true }).click();
 await waitText(page, 'Invalid email or password');
 await screenshot(page, '03-invalid-signin', 'Invalid credentials produce a useful error and do not sign the user in.');
 await login(page, 'browser-user@example.test');
 await waitText(page, 'read-only access');
 check(await page.getByRole('link', { name: 'Add Project', exact: true }).count() === 0, 'User must not see Add Project');
 await screenshot(page, '04-user-projects', 'The regular user can view MongoDB project records and has no write controls.');
 await page.goto('http://127.0.0.1:5173/admin/projects/new');
 await waitText(page, 'Admin access required.');
 await screenshot(page, '05-protected-admin', 'A regular user who enters an admin URL directly sees an access-denied message. The API also enforces this permission.');
 await page.getByRole('button', { name: 'Sign out', exact: true }).click();
 await waitText(page, 'You have signed out.');
 check(await page.evaluate(() => sessionStorage.getItem('portfolio-session')) === null, 'Signout clears token');
 await login(page, 'browser-admin@example.test');
 await waitText(page, 'Growing Planet');
 await screenshot(page, '06-admin-projects', 'The Admin role displays Add, Edit, and Delete controls alongside the database-backed portfolio projects.');
 const specs = [
  ['projects','Project', { title: 'Browser test project', firstname: 'Anton', lastname: 'Nasr', email: 'anton@example.test', completion: '2026-11-12', description: 'Created using the React project form.' }, 'title', '/projects'],
  ['qualifications','Qualification', { title: 'Browser test qualification', institution: 'Centennial College', type: 'Education', completion: '2026-11-12', description: 'Created using the React qualification form.' }, 'title', '/education'],
  ['contacts','Contact', { firstname: 'Browser', lastname: 'Contact', email: 'contact@example.test', contactNumber: '(555) 123-4567', message: 'Created using the React contact form.' }, 'message', '/contact']
 ];
 for (const [resource, label, values, editField, listPath] of specs) {
  await page.goto('http://127.0.0.1:5173/admin/' + resource + '/new');
  for (const [key, value] of Object.entries(values)) await page.locator('#' + key).fill(value);
  const caption = resource === 'contacts'
   ? 'The admin contact form requires first name, last name, email, contact number, and message. All five fields are saved in MongoDB.'
   : 'The admin ' + label.toLowerCase() + ' form validates required fields and accepts an optional completion date.';
  await screenshot(page, '07-form-' + resource, caption);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await waitText(page, label + ' saved in MongoDB.');
  await page.goto('http://127.0.0.1:5173' + listPath);
  const marker = values.title || 'Browser Contact';
  await waitText(page, marker);
  await page.reload(); await waitText(page, marker);
  await screenshot(page, '08-persisted-' + resource, 'The newly submitted ' + label.toLowerCase() + ' remains visible after a full browser refresh.');
  let card = page.getByRole('article').filter({ hasText: marker });
  await card.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.locator('#' + editField).waitFor();
  await page.locator('#' + editField).fill(values[editField] + ' Updated');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await waitText(page, label + ' saved in MongoDB.');
  await page.goto('http://127.0.0.1:5173' + listPath);
  await waitText(page, values[editField] + ' Updated');
  card = page.getByRole('article').filter({ hasText: values[editField] + ' Updated' });
  page.once('dialog', dialog => dialog.dismiss());
  await card.getByRole('button', { name: 'Delete', exact: true }).click();
  check(await card.count() === 1, 'Cancel delete retains record');
  page.once('dialog', dialog => dialog.accept());
  await card.getByRole('button', { name: 'Delete', exact: true }).click();
  await waitText(page, label + ' deleted.');
  check(await card.count() === 0, 'Confirmed delete removes record');
 }
 await page.goto('http://127.0.0.1:5173/education'); await waitText(page, 'Security Licence');
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('http://127.0.0.1:5173/projects'); await waitText(page, 'Growing Planet');
 check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile layout fits viewport');
 await screenshot(page, '09-mobile-navigation', 'At a 390-pixel mobile width, the navigation wraps and project cards stack vertically. This viewport capture preserves readable text.', false);
 await page.getByRole('article').first().scrollIntoViewIfNeeded();
 await screenshot(page, '09-mobile-project', 'The first project card at the same mobile width. A separate viewport capture keeps its description and admin controls readable.', false);
 for (const route of ['/about','/services']) {
  await page.goto('http://127.0.0.1:5173' + route);
  await page.locator('h1').waitFor(); checks++;
 }
 await page.setViewportSize({ width: 1440, height: 1000 });
 // Force an expired token to verify browser authentication cleanup.
 await page.evaluate(() => {
  const session = JSON.parse(sessionStorage.getItem('portfolio-session'));
  session.token = 'invalid';
  sessionStorage.setItem('portfolio-session', JSON.stringify(session));
 });
 await page.reload();
 await waitText(page, 'Invalid or expired token');
 check(await page.evaluate(() => sessionStorage.getItem('portfolio-session')) === null, 'Invalid token cleared');
 await screenshot(page, '10-invalid-token', 'An invalid session is rejected by the backend and cleared by the interface.');
 check(errors.length === 0, 'No browser JavaScript errors: ' + errors.join('; '));
 const paragraphs = [
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'COMP229 Assignment 3 – Screenshot Report', color: '000000' })] }),
  new Paragraph('Anton Nasr | Screenshots captured from the running React and Express application in Chrome.'),
  new Paragraph('The screenshots use a disposable MongoDB database. Form records were submitted through the interface and checked after refresh. Only admins may create, edit, or delete Contacts, Projects, and Qualifications; regular users are read-only.')
 ];
 for (const shot of shots) {
  const bytes = fs.readFileSync(shot.file);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  const scale = Math.min(600 / width, 650 / height);
  paragraphs.push(
   new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: shot.name, color: '000000' })], pageBreakBefore: true }),
   new Paragraph(shot.explanation),
   new Paragraph({ children: [new ImageRun({ data: bytes, type: 'png', transformation: { width: Math.round(width * scale), height: Math.round(height * scale) } })] })
  );
 }
 const doc = new Document({ styles: { default: { document: { run: { font: 'Calibri', color: '000000', size: 22 } } } }, sections: [{ children: paragraphs }] });
 fs.writeFileSync(path.join(out, 'COMP229_Assignment3_Screenshot_Report.docx'), await Packer.toBuffer(doc));
 console.log(JSON.stringify({ result: 'PASS', checks, screenshots: shots.length, javascriptErrors: errors, report: 'submission/COMP229_Assignment3_Screenshot_Report.docx' }));
 fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ result: 'PASS', checks, screenshots: shots.length, javascriptErrors: errors }, null, 2));
} catch (error) {
 console.error(error); process.exitCode = 1;
} finally {
 if (browser) await browser.close();
 if (vite) { vite.kill(); await once(vite, 'exit').catch(() => {}); }
 if (server) await new Promise(resolve => server.close(resolve));
 if (safe && mongoose.connection.db?.databaseName === dbName && /^comp229a3browser_\d+_\d+$/.test(dbName)) await mongoose.connection.db.dropDatabase();
 await mongoose.disconnect();
}
