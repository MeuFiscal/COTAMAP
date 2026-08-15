import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminCore = readFileSync(new URL("../supabase/functions/admin-core/index.ts", import.meta.url), "utf8");
const adminService = readFileSync(new URL("../src/services/admin/admin-service.ts", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../src/app/(private)/admin/page.tsx", import.meta.url), "utf8");
const sections = readFileSync(new URL("../src/features/admin/components/admin-accounts-sections.tsx", import.meta.url), "utf8");

test("overview completo passa pelo admin-core após validação de platform_admin", () => {
  assert.match(adminCore, /if \(body\.operation === "list_overview"\)/);
  assert.match(adminCore, /if \(!admin\?\.active\) return json\(\{ error: "admin_not_authorized" \}, 403\)/);
  assert.match(adminService, /operation: "list_overview"/);
  assert.doesNotMatch(adminService, /from\("profiles"\)/);
});

test("perfis tombstone não voltam à listagem administrativa", () => {
  assert.match(adminCore, /from\("profiles"\)\.select\([^\n]+\)\.is\("deleted_at", null\)/);
  assert.match(adminCore, /auth\.admin\.deleteUser\(body\.profile_id\)/);
  assert.match(adminCore, /auth_user_delete_failed/);
  assert.match(adminCore, /profile_has_active_business_membership/);
  assert.match(adminCore, /delete_confirmation_mismatch/);
});

test("desativação não é confundida com exclusão", () => {
  const deactivate = adminCore.slice(adminCore.indexOf('body.operation === "deactivate_profile"'), adminCore.indexOf('body.operation === "delete_profile"'));
  assert.match(deactivate, /is_active: false/);
  assert.doesNotMatch(deactivate, /deleted_at:/);
  assert.match(adminCore, /body\.operation === "activate_profile"/);
});

test("Empresas não permite mais trocar entitlement por select", () => {
  assert.match(adminPage, /AdminBusinessesSection/);
  assert.doesNotMatch(adminPage, /Selecionar plano/);
  assert.doesNotMatch(adminPage, /operation:"set_business_plan"/);
});

test("cards exibem dados administrativos úteis sem IDs técnicos", () => {
  for (const label of ["Último acesso", "Empresa", "Plano", "Assinatura", "Último pagamento", "Próxima cobrança / acesso", "Uso hoje", "Funcionários"]) {
    assert.match(sections, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(sections, /Resetar senha/);
  assert.match(sections, /Conceder admin/);
  assert.match(sections, /Remover admin/);
  assert.match(sections, /Excluir conta/);
  assert.doesNotMatch(sections, /provider_subscription_id|provider_product_id|provider_offer_id/);
});

test("falha de leitura opcional não derruba list_overview", () => {
  const requiredGuard = adminCore.slice(
    adminCore.indexOf("for (const result of [businesses"),
    adminCore.indexOf("const profileRows"),
  );
  assert.doesNotMatch(requiredGuard, /quotations|orders|audit|usage/);
  assert.match(adminCore, /quotations: quotations\.error \? \[\] : quotations\.data \?\? \[\]/);
  assert.match(adminCore, /orders: orders\.error \? \[\] : orders\.data \?\? \[\]/);
  assert.match(adminCore, /audit: audit\.error \? \[\] : audit\.data \?\? \[\]/);
  assert.match(adminCore, /const usedToday = usage\.error\s*\? null/);
  assert.match(sections, /business\.used_today === null \? "Não disponível"/);
});
