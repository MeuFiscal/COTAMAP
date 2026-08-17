import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accounts = readFileSync(new URL("../src/features/admin/components/admin-accounts-sections.tsx", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../src/app/(private)/admin/page.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260829020000_admin_business_plan_grants.sql", import.meta.url), "utf8");
const core = readFileSync(new URL("../supabase/functions/admin-core/index.ts", import.meta.url), "utf8");

test("Clientes filtra funcionários e mantém proprietários empresariais", () => {
  assert.match(accounts, /profile\.business_role === "owner"/);
  assert.match(accounts, /AdminClientsSection/);
  assert.match(adminPage, /AdminClientsSection profiles=\{data\.profiles\} plans=\{plans\}/);
});

test("Funcionários mostra nome, e-mail, empresa, cargo e presença", () => {
  assert.match(accounts, /AdminEmployeesSection/);
  assert.match(accounts, /Proprietário.*Gerente.*Funcionário/);
  assert.match(accounts, /Último acesso/);
});

test("Admin seleciona planos reais e concede à empresa", () => {
  assert.match(accounts, /plans\.filter\(\(plan\) => plan\.is_active\)/);
  assert.match(core, /saas_plans.*is_active/);
  assert.match(accounts, /operation: "set_business_plan"/);
  assert.match(core, /body\.operation === "set_business_plan"/);
  assert.match(core, /target_actor: identity\.data\.user\.id/);
});

test("concessão é empresarial, auditável e não simula Cakto", () => {
  assert.match(migration, /create table public\.business_plan_grants/);
  assert.match(migration, /business_id uuid primary key/);
  assert.match(migration, /granted_by uuid/);
  assert.match(migration, /preserve_admin_business_plan_grant/);
  assert.match(migration, /provider_status,?\s*\)\s*\n\s*values .*admin_granted/s);
  assert.match(core, /type: "administrative_grant"/);
});

test("concessão só é executável pelo canal service_role", () => {
  assert.match(migration, /revoke all on function public\.set_business_plan\(uuid, uuid, uuid\) from public/);
  assert.match(migration, /grant execute on function public\.set_business_plan\(uuid, uuid, uuid\) to service_role/);
  assert.match(core, /platform_admins/);
});

test("admin-core usa profiles.id e não referencia coluna auth_user_id", () => {
  assert.doesNotMatch(core, /auth_user_id/);
  assert.match(core, /actor_profile_id: identity\.data\.user\.id/);
  assert.match(core, /target_actor: identity\.data\.user\.id/);
});
