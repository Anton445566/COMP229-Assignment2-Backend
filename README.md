# COMP229 Assignment 2 — Portfolio Backend

This project contains the React portfolio from Assignment 1 and the Node.js, Express, Mongoose, and MongoDB backend required for Assignment 2.

## Requirements

- Node.js and npm or Yarn
- MongoDB connection string
- A JWT secret containing at least 32 bytes
- A securely registered portfolio-owner account for owner-only bulk deletion

Set these environment variables before starting the backend. Do not commit real values.

```text
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<a random secret of at least 32 bytes>
PORTFOLIO_ADMIN_IDS=<owner MongoDB user ID; comma-separate multiple IDs>
PORT=3000
```

Use [.env.example](.env.example) as a value guide. The application does not automatically load `.env`; set the variables in the terminal or hosting environment.

Install and start:

```text
yarn install
yarn start
```

The frontend keeps its existing workflow:

```text
cd client
yarn install
yarn dev
```

## Authentication

- `POST /api/users` registers a user and stores new passwords with salted scrypt hashing.
- `POST /auth/signin` returns a one-hour bearer token and safe user details.
- `GET /auth/signout` clears the legacy auth cookie; the caller must discard its bearer token.
- Send protected requests with `Authorization: Bearer <token>`.
- Existing legacy users whose passwords were stored as plaintext are intentionally not authenticated and were not modified.
- All DELETE-all endpoints require the signed-in user's ID to be listed in `PORTFOLIO_ADMIN_IDS`. There is no default administrator.

To configure the first owner without changing records automatically: register securely, sign in, copy `user._id` from the sign-in response, set `PORTFOLIO_ADMIN_IDS` to that value, and restart the backend.

## REST API

| Resource | Collection endpoint | Item endpoint | Public access |
| --- | --- | --- | --- |
| Contacts | `/api/contacts` | `/api/contacts/:contactId` | POST only |
| Projects | `/api/projects` | `/api/projects/:id` | GET all and GET by ID |
| Qualifications | `/api/qualifications` | `/api/qualifications/:id` | GET all and GET by ID |
| Users | `/api/users` | `/api/users/:userId` | POST registration only |

Each resource supports GET-all, GET-by-ID, POST, PUT, DELETE-by-ID, and DELETE-all. Other than the public operations listed above, a bearer token is required. User item access is limited to that user or a configured owner. DELETE-all is owner-only.

## Verification

Run the database-free automated tests:

```text
yarn test:backend
```

Run the full API suite against an automatically named disposable database:

```text
yarn test:runtime
```

The runtime suite never points destructive requests at the configured database: it overrides the database name with a unique `comp229a2t_...` name, verifies that name before inserting data, performs the CRUD tests, checks that all disposable collections are empty, and drops only that disposable database.

Import [server/tests/COMP229.postman_collection.json](server/tests/COMP229.postman_collection.json) into Postman for manual tests. Resource writes are blocked until `allowWriteTests` is set to `true`; all DELETE requests are blocked until `allowDestructiveTests` is set to `true`. Enable destructive tests only for an isolated disposable database.
