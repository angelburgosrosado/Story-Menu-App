# Project Documentation: Myiad-Comic-App

This documentation tracks the architectural details, database alignment milestones, and troubleshooting history of **Myiad-Comic-App** (also known as *Infinite Heroes REMIX*), fully prepared for production deployment on Google Cloud Run.

---

## 1. Project Overview

**Infinite Heroes REMIX** is an interactive multiverse comic book creator and retro adventure engine. The system integrates advanced generative capabilities with interactive reader workflows:
* **Interactive Multiverse Comic Generation:** Leverages the **Gemini 2.5 Flash** models to dynamically generate rich multi-page retro visual comics and story arcs.
* **Ambient Audio Architecture:** Integrates a custom Web Audio synthesizer generating procedural retro music tailored to the select genre, completed with high-impact spatial sound effect cues (e.g., laser beams, explosions, pages turning) and premium Text-to-Speech (TTS) narration.
* **Persistent Multi-Tenant Database Storage:** Fully integrates with an external, secure **PostgreSQL Database** featuring dynamic, multi-tenant database isolation. Each creator is allocated a distinct namespace schema (`vault_app_<username>`) to secure intellectual property, save comic chapters, record cast selections, and cache character attributes.
* **Self-Healing Connection Shield:** Provides an asynchronous, self-healing database protocol that conducts a background TCP socket probe of port `5432` and falls back automatically to an interactive, stateful sandbox mode if the server is offline or unreachable.

---

## 2. Troubleshooting History

This section tracks critical issues encountered and resolved to guarantee the application starts and serves requests instantly on Cloud Run container targets.

### Issue 1: Server Sandbox Crash on Production Startup
* **Symptoms:** Cloud Run service `myiad-comic-app` was failing to start, showing `exit(1)` or failing to complete health check handshakes in logs.
* **Root Cause:**
  1. The server code was importing `vite` dynamically in development mode. In production, `vite` was listed in `devDependencies` in `package.json`, causing the compiler or runtime script to crash on start if `node_modules` did not contain the package.
  2. The application was running as an ES Module (ESM) but importing files directly, triggering Node's strict ESM path check errors.
* **Resolution:**
  1. We configured a robust, compiled pipeline using `esbuild` to bundle the server file (`server.ts`) into a single, self-contained CommonJS output file (`dist/server.cjs`).
  2. Moved any runtime dependencies into the correct `dependencies` section of `package.json` to prevent build-time conflicts.
  3. Integrated a silent try/catch block around the Vite setup. If Vite fails to load during background execution, the server heals itself by falling back to serving pre-compiled static assets out of `dist/` rather than throwing an uncaught exception.

### Issue 2: Port Binding Mismatch & Hardcoded Ingress Port
* **Symptoms:** Container initiated but timed out because it didn't listen on the port provided by the hosting context.
* **Root Cause:** Cloud Run dynamically injects a `PORT` environment variable and expects matching HTTP server binding on `0.0.0.0`.
* **Resolution:**
  1. Updated the application listener to dynamically bind with `process.env.PORT || 3000`.
  2. Configured the host binding strictly to `0.0.0.0` to route inbound remote traffic cleanly.
  3. Wrapped the listener in validation catch-blocks to supply troubleshooting advice when hosting ports are already occupied by parallel tools in the environment.

### Issue 3: Incomplete or Invalid Database Strings Preventing Boot
* **Symptoms:** Unconfigured database credentials or placeholder parameters in settings caused PostgreSQL connection pools (`pg.Pool`) to fail during startup initialization, crashing the server.
* **Resolution:**
  * Implemented an advanced **Self-Healing URL Guard** in both `server.ts` and `db.ts` to block connection attempts for invalid strings (e.g., containing `postgresql://username:password@base:5432` or words like `placeholder` and `your_host`).
  * If identified, the connection string is safely cleared on boot, prompting the application to switch gracefully into interactive fallback sandbox mode without crashing.

### Issue 4: Relational Integrity / Cast Picture Upload Block with Guest/Default Creator IDs
* **Symptoms:** First-time users or guest sessions with the default placeholder/unregistered creator ID (`00000000-0000-0000-0000-000000000000`) were unable to upload cast pictures when the database was active. Furthermore, any query constraint or user error would place the database connection into a permanent offline state.
* **Root Cause:**
  1. The database schema enforces strict relational integrity (`REFERENCES users(id) ON DELETE CASCADE`). If the default placeholder ID (loaded from previous offline client localStorage) tried to insert a character, the query failed with a foreign key violation since no matching row existed in the PostgreSQL `users` table.
  2. The server caught these query constraint/input exceptions inside catch blocks and called `markDatabaseOffline()`, misidentifying standard business logic / database check failures as server connection drops and severing the main database connection pool entirely for subsequent operations.
* **Resolution:**
  1. Developed a **Self-Healing User/Creator Auto-Seeding Engine**: When characters or projects are uploaded, the server dynamically runs a check to ensure the associated `userId` UUID is fully seeded in the database `users` table before submitting the write. This supports both random caller UUIDs and the standard guest UUID safely.
  2. Rebuilt the database health supervisor with a high-fidelity **Connection Drop Evaluator** (`isConnectionError`): The server now analyzes database error states, only switching to local sandbox mode for actual hardware/network drops (such as `ECONNREFUSED` or network timeouts). Standard programmatic exceptions (integrity checks, uniqueness, or query structure) are caught gracefully without affecting the database pool lifecycle.

---

## 3. How to Access and Run the App

### Running Locally

1. **Install Node.js & Dependencies:**
   Ensure Node.js is installed. Run the command to install packages:
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the project root with your credentials:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_database
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Validate Infrastructure and Live Databases:**
   Run the live transactional test engine to query active tables and check connection handshakes:
   ```bash
   npm test
   ```

4. **Compile and Build for Production:**
   Run the compiler to build the single-page application and the backend CommonJS server bundle:
   ```bash
   npm run build
   ```

5. **Start the Production Server:**
   Launch the compiled service:
   ```bash
   npm start
   ```

### Accessing the Deployed App
The application is deployed on Google Cloud Run. You can access it via the URL provided in the Google Cloud Console under active revision details.

---

## 4. Testing & Verification

We established two highly effective testing tools to prevent regression during future deployments:
1. **`npm test` (`test-db-queries.cjs`):**
   * Establishes a raw network socket check to measure TCP latency.
   * Logs on to the live PostgreSQL instance at `34.148.244.49:5432` using credentials, verifying authentication.
   * Automatically provisions the multi-tenant namespace schema `vault_app_angelburgosrosado`.
   * Performs an interactive write-through test—inserting a test creator and a temporary comic character—and safely purges the test data afterward during cleanup.
2. **`npm run validate:deploy` (`validate-deployment.cjs`):**
   * Validates file structures and checks build outputs.
   * Inspects `package.json` configurations.
   * Spawns a background Express testing process on a secure test port, runs mock HTTP transactions directly to the landing routes, and prints a comprehensive compliance report.

---

## 5. Future Development Tips

* **Dependency Management:** Always verify where packages belong. Use `dependencies` for runtime requirements and `devDependencies` only for build utilities like typescript, vite, or esbuild.
* **Environment Variables:** For production, use Google Google Cloud Secret Manager to map sensitive secrets like `DATABASE_URL` or `GEMINI_API_KEY` into your revision's environment instead of plain text settings.
* **Port Configuration:** Always refer to `process.env.PORT` inside code statements. Never bind to fixed hostnames or static ports in production.
* **Logs & Troubleshooting:** To trace container lifecycle events, use the Google Logs Explorer and filter with:
  ```text
  resource.type="cloud_run_revision" AND resource.labels.service_name="myiad-comic-app"
  ```
* **Production Deployment:** Prior to triggering Cloud Build or GitHub Actions deployment pipelines, run `npm test` locally to verify Postgres is reachable and ready.
