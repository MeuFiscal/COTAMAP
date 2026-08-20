import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20260820201402_grant_service_role_admin_reads.sql", import.meta.url), "utf8");
const foundation = readFileSync(new URL("../supabase/migrations/20260812000000_saas_foundation.sql", import.meta.url), "utf8");
const adminCoreMigration = readFileSync(new URL("../supabase/migrations/20260814000000_admin_core.sql", import.meta.url), "utf8");
const core = readFileSync(new URL("../supabase/functions/admin-core/index.ts", import.meta.url), "utf8");
const adminService = readFileSync(new URL("../src/services/admin/admin-service.ts", import.meta.url), "utf8");

test("service_role recebe somente os grants mínimos dos callers confirmados", () => {
  assert.match(migration, /grant select, update\s+on table public\.saas_checkouts\s+to service_role/);
  assert.match(migration, /grant select\s+on table public\.saas_daily_usage,\s+public\.quotations,\s+public\.orders\s+to service_role/);
  assert.doesNotMatch(migration, /grant\s+all|grant[^;]*(?:insert|delete)/i);
});

test("leitura authenticated de checkout continua limitada à policy atual", () => {
  assert.match(foundation, /create policy saas_checkout_read on public\.saas_checkouts for select to authenticated using\(is_active and deleted_at is null\)/);
  assert.match(adminService, /from\("saas_checkouts"\)\.select/);
  assert.doesNotMatch(migration, /to\s+(?:anon|authenticated)/i);
});

test("update_checkout usa exclusivamente o caminho service_role do admin-core", () => {
  assert.match(core, /service\.from\("saas_checkouts"\)\.update/);
  assert.match(core, /\.eq\("id", body\.checkout_id\)/);
});

test("activate_checkout permanece SECURITY DEFINER e executável somente por service_role", () => {
  assert.match(adminCoreMigration, /create or replace function public\.activate_checkout[\s\S]*?security definer/);
  assert.match(adminCoreMigration, /grant execute on function public\.activate_checkout\(uuid,uuid\).*to service_role/);
  assert.match(adminCoreMigration, /revoke all on function public\.activate_checkout\(uuid,uuid\).*from public,anon,authenticated/);
});

test("leituras opcionais do list_overview deixam de gerar 42501 silencioso", () => {
  assert.match(core, /service\.from\("saas_daily_usage"\)\.select/);
  assert.match(core, /service\.from\("quotations"\)\.select/);
  assert.match(core, /service\.from\("orders"\)\.select/);
  assert.match(migration, /public\.saas_daily_usage,\s+public\.quotations,\s+public\.orders/);
});

test("nenhuma permissão anon é aberta para configuração SaaS", () => {
  assert.doesNotMatch(migration, /anon/i);
  assert.match(foundation, /create policy saas_checkout_read on public\.saas_checkouts for select to authenticated/);
});
