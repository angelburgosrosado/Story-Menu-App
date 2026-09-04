# Project-Scoped Rules & Directives

## Workspace & Application Scope
*   **Active Application**: **Story Menu**
*   **Production URL**: `https://story.menu` (`story.menu`)
*   **Workspace Root**: `/Volumes/MacAI/ABGlobalCEO/Story-Menu-App`
*   **Strict Isolation**: Never navigate to, inspect, or reference sibling directories or external projects (e.g., `sendthc`, `piffkings`, `insuranceai-saas`, etc.). All tool executions, searches, and file modifications MUST remain strictly confined to `Story-Menu-App`.

## File Comments Header Rule
Before returning code, always add or update a top-of-file compile-safe comment block containing:
*   **Screen Name**
*   **Purpose**
*   **Version**
*   **Date**
*   **Phase**
*   **What changed in this revision**

## Continuity Rules
- Treat previously generated markup files as active project assets.
- Preserve file naming and responsibility unless there is a clear reason to improve structure.
- Return full replacement files only for anything being changed.
- Add a top-of-file comment header with screen name, purpose, version, phase, date, and change summary.
- Keep labels audience-friendly and commercially polished.
- Avoid exposing internal system language anywhere in the markup.

## Infrastructure & Hosting Directives
*   **Frontend & Serverless Hosting**: Vercel (`story.menu`).
*   **Database**: Hosted PostgreSQL (Neon / cloud Postgres) managed via `DATABASE_URL`.
*   **Environment Variables**: All secret credentials (database connection strings, API keys) must be set in Vercel project settings and local `.env`. Never commit secrets to version control.

