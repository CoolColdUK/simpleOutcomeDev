-- Purpose: PostgreSQL table privileges for REST/MCP agent routes (SUPABASE_SECRET_KEY / service_role).
-- Affects: public tables read or written from packages/web/lib/api/agent handlers.
-- Notes: service_role bypasses RLS; API key authz runs in application code. Only api_key had service_role grants before this migration.

grant all on table public.profile to service_role;
grant all on table public.space to service_role;
grant all on table public.space_member to service_role;
grant all on table public.space_invite to service_role;
grant all on table public.pod to service_role;
grant all on table public.pod_member to service_role;
grant all on table public.pod_join_request to service_role;
grant all on table public.todo_column to service_role;
grant all on table public.todo_card to service_role;
grant all on table public.todo_card_comment to service_role;
grant all on table public.fp_setting to service_role;
grant all on table public.fp_account to service_role;
grant all on table public.fp_category to service_role;
grant all on table public.fp_parser to service_role;
grant all on table public.fp_import to service_role;
grant all on table public.fp_import_file to service_role;
grant all on table public.fp_transaction to service_role;
