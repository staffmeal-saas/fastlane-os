# CLAUDE.md — Fastlane OS

## Stack

Docker Compose + Nhost (Hasura v2.46 + PostgreSQL 16 + Auth + Storage + Minio) + React 19 / Vite 8

## Architecture

- `initdb.d/` — SQL migrations (schema, triggers, functions). Files run alphabetically on first `docker compose up`.
- `hasura_metadata.json` — Permissions + relationships. Applied via `setup.sh` using `replace_metadata`.
- `frontend/src/` — React SPA. Auth is hand-rolled fetch (NOT using @nhost/nhost-js SDK).
- `emails/fr/` — Auth email templates (verify, passwordless, reset, confirm-change).

## Dev Setup

```bash
bash setup.sh        # Docker up + metadata + npm install
cd frontend && npm run dev
```

## DB Schema

15 tables: clients, client_members, offers, wallets, wallet_transactions, campaigns, actions, action_status_history, documents, document_versions, upgrades, user_profiles, strategic_blocks, notifications, audit_log.

## Key Conventions

- `config.yaml` is gitignored — copy `config.yaml.example` and set `HASURA_GRAPHQL_ADMIN_SECRET` in `.env`.
- SQL functions: `allocate_monthly_credits()`, `expire_old_credits()`, `audit_trigger_func()`.
- 8 roles: superadmin, admin, manager, viewer, client_owner, client_admin, client_member, public.
- Audit log is NOT tracked in Hasura (intentional — DB-only access).
- Notifications table is populated by PostgreSQL triggers, not application code.
- Frontend pagination uses `usePagination` hook + `_aggregate { count }` for totals.

## Exporting Hasura Metadata

After changes in Hasura Console:
```bash
curl -d '{"type": "export_metadata", "args": {}}' \
  -H "X-Hasura-Admin-Secret: $GRAPHQL_ADMIN_SECRET" \
  http://localhost:8080/v1/metadata > hasura_metadata.json
```

## CDC

`Fastlane_Cahier_des_Charges_Plateforme.md` is the source of truth for requirements.
