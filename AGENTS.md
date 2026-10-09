<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BlinkWear Workspace Rules

## Before Changes
- Before any change, read `marketplace-web/docs/00_INDEX.md` and the relevant numbered document. From `marketplace-web`, use `docs/...`; from the nested mobile/admin roots, use `../../marketplace-web/docs/...`.
- Do not invent features, tables, columns, flows, or UI. If a requirement is not documented or present in code, ask the user.

## Database
- Make database changes only in a new numbered `phaseNN_*.sql` migration for user review. Never edit an applied migration or apply a migration to production.
- Update `marketplace-web/docs/06_BACKEND_SCHEMA.md` in the same change as database changes.
- Every new table must have RLS policies.
- Never use `select('*')` on `products` or `seller_profiles` in public queries.

## Payments And Moderation
- Cashfree environment comes only from `CASHFREE_ENV`; return the server-selected environment as `cf_env`. Never hardcode keys or secrets, and never expose secrets through `NEXT_PUBLIC_` variables.
- Refunds are manual through the Cashfree dashboard.
- An admin-approved product stays active until the seller edits listing content; content edits return it to `pending_approval`.

## Documentation And Validation
- When a task changes behavior, update its relevant document and `marketplace-web/docs/08_DECISIONS_LOG.md` in the same change.
- After changes, run TypeScript checks and production builds for the affected app repositories.
- Report changed files and use the output format `path + changed snippet`; prefer tables over prose.
