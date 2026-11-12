# COMP229 Assignment 3 — Anton Nasr's Portfolio

React portfolio connected to Express and MongoDB, with JWT signin and database-backed Admin/User roles. The existing Home, About, Services, illustrations, layout, resume, and portfolio content are retained. Projects and Education now read MongoDB records; browser storage does not substitute for database persistence.

## Windows / VS Code setup

Use Node.js 22.12 or newer (tested with Node 24), npm, and a running MongoDB service, or supply your own MongoDB URI. Run from the project root in PowerShell. Use npm.cmd to avoid execution-policy issues with npm.ps1.

~~~powershell
npm.cmd ci
npm.cmd --prefix client ci
Copy-Item .env.example .env
node --input-type=module -e "import {randomBytes} from 'node:crypto'; console.log(randomBytes(48).toString('hex'))"
notepad .env
~~~

Copy the generated random value into JWT_SECRET. Set MONGODB_URI and a private ADMIN_PASSWORD of at least 12 characters. Keep ADMIN_EMAIL=admin@portfolio.local or choose your own. The backend loads the root .env automatically, even when started from another directory; terminal environment variables take precedence.

Do not copy over an existing .env. In this prepared workspace it already contains a generated JWT secret and random demonstration admin password. Open .env locally to read ADMIN_PASSWORD; it is excluded from Git and the ZIP.

~~~powershell
npm.cmd run seed
npm.cmd run dev
~~~

Open **http://127.0.0.1:5173**. Express uses port 3000. Vite forwards /api and /auth to Express. Keep ports 3000 and 5173 free. Alternatively, run npm.cmd run dev:server and npm.cmd --prefix client run dev in two terminals. npm.cmd start runs only the backend.

## Demonstration admin and portfolio data

Sign in at /signin using **admin@portfolio.local** (or ADMIN_EMAIL) and the ADMIN_PASSWORD used for the initial seed. The seed stores a salted scrypt password hash and explicit Admin role in MongoDB. It adds the three original projects and four education/qualification records only when their titles are absent.

The seed is repeatable: it never deletes records, resets an existing admin password, replaces edited portfolio content, or elevates an existing User account. If the configured email belongs to a User, choose another email. Changing ADMIN_PASSWORD after the first seed does not change an existing password.

In this workspace the demo admin and portfolio records were successfully seeded in the local Portfolio database. Tests used separately named disposable databases.

## Permission interpretation and authentication

The Contact-form requirement conflicts with regular-user read-only access. This implementation follows the requested strict interpretation: **only Admin accounts can create, edit, or delete Contacts**, including submitting the Contact form. Signed-in Users can read Contacts. Projects and Qualifications remain publicly readable to preserve the portfolio, and signed-in Users can read them too.

| Action | Anonymous | User | Admin |
| --- | --- | --- | --- |
| Signup / signin | Yes | Yes | Yes |
| Read Projects / Qualifications | Yes | Yes | Yes |
| Read Contacts | 401 | Yes | Yes |
| Write Contacts / Projects / Qualifications | 401 | 403 | Yes |
| Read/update/delete own account | 401 | Yes | Yes |
| Access another account / list all accounts | 401 | 403 | Yes |
| Delete all records in a resource | 401 | 403 | Yes |

- Signup defaults to User. Client-supplied roles, IDs, hashes, salts, and internal fields are ignored on signup/account updates, including requests by admins. Role changes are a database administration operation.
- Every protected request verifies the JWT and reloads the current role from MongoDB. An old token cannot retain permissions after a database role change. Frontend admin routes also check the session.
- JWTs use HS256, issuer/audience checks, and one-hour expiration. Passwords use a random salt and scrypt; plaintext legacy records cannot sign in.
- Only authentication information is saved in tab-scoped sessionStorage, never submitted records. Refresh revalidates the session with the backend. Invalid/expired tokens clear authentication; a timer clears expired sessions too.
- GET /auth/signout clears the legacy cookie. The client always discards its session on signout. JWTs are stateless: a separately copied bearer token remains valid until expiration; there is no server-side blacklist.
- Emails are normalized to lowercase with a unique MongoDB index. Existing duplicate emails can prevent index setup; resolve those manually without automatic deletion.

## Forms and API

Signup: /signup; signin: /signin; lists: /projects, /education, /contact.

Admins use Add/Edit/Delete controls. Forms have controlled React state, browser/server validation, loading states, useful errors, save/delete messages, and delete confirmation. Contact submits firstname, lastname, email, contactNumber, and message. All five fields are validated and persisted.

Project requires title, firstname, lastname, and valid email. Completion date and description are optional. Qualification requires title; firstname, lastname, email, institution, type, completion, and description are optional. Dates use date inputs and ISO storage; empty dates are sent as null.

API routes:
- POST /api/users — signup
- POST /auth/signin; GET /auth/signout
- /api/contacts, /api/projects, /api/qualifications, /api/users: GET, POST, DELETE collection routes; GET, PUT, DELETE item routes.
- Item parameter names: :contactId, :id, :id, :userId, respectively.

The updated Postman collection keeps write/destructive tests disabled by default. Enable them only for a disposable database; sign in with an Admin for write tests.

## Validation actually completed

~~~powershell
npm.cmd run test:backend
npm.cmd run test:runtime
npm.cmd run test:browser
npm.cmd run build
npm.cmd audit
npm.cmd --prefix client audit
~~~

- Backend: **28 tests passed**, covering hashing, safe account fields, JWT verification, route guards, and errors.
- Runtime: **150 checks passed** in isolated MongoDB: signup/duplicate email, valid/invalid signin, role injection attempts, all resource CRUD, 401/403, invalid inputs/IDs, missing records, invalid/expired JWTs, role demotion, seed idempotency, and rereads after disconnecting/reconnecting MongoDB.
- Chrome browser: **44 checks passed**: signup, signin errors, user/admin views, protected routes, all three create/edit/delete forms, cancel/confirm deletion, persistence after full refresh, signout/session cleanup, invalid-token cleanup, main pages, and mobile layout. No JavaScript errors observed.
- Frontend production build passed.
- Both npm audits reported zero vulnerabilities after compatible dependency fixes.
- Local seed was run twice; the existing admin was preserved.

Runtime and browser tests override the database name with a unique comp229a3t_... or comp229a3browser_... name, verify it before cleanup, and drop only that database. Existing application records are not deleted by tests. Browser tests require standard Windows Chrome, or CHROME_PATH set to another Chrome executable, and ports 3000/5173 free. They regenerate the report from genuine screenshots.

## Submission and GitHub

Run npm.cmd run submission:zip to create submission/COMP229_Assignment3_Portfolio.zip. It includes source, npm lockfiles, .env.example, and instructions, excluding dependencies, .env, Git metadata, builds, caches, logs, submission output, and reference files.

Also submit submission/COMP229_Assignment3_Screenshot_Report.docx, containing 15 genuine Chrome screenshots, numbered sequentially. Mobile views are split into two readable viewport captures. Original PNGs and results are in submission/screenshots/ and submission/browser-results.json. Screenshots use a disposable demonstration database.

Git origin is configured to [Anton445566/COMP229-Assignment2-Backend](https://github.com/Anton445566/COMP229-Assignment2-Backend). Assignment 3 uses the [assignment3 branch](https://github.com/Anton445566/COMP229-Assignment2-Backend/tree/assignment3), preserving the existing main history. The corrected Word report is tracked; .env, node_modules, raw screenshots, and the generated ZIP are excluded. For future updates:

~~~powershell
git add .
git commit -m "Complete COMP229 Assignment 3"
git push -u origin assignment3
~~~

Submit the assignment3 branch URL above along with the ZIP and Word report. Never commit .env.

No reference folder, Assignment 3 document, or Week 8 labs were present in the supplied workspace or attachment folder. Implementation follows the detailed pasted request; comparison with the original rubric remains pending until those documents are supplied.
