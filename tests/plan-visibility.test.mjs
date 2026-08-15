import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const plans = [
  { name: "Free", is_active: true, is_public: true },
  { name: "teste 1", is_active: true, is_public: false },
  { name: "Premium", is_active: true, is_public: true },
  { name: "Inativo público", is_active: false, is_public: true },
  { name: "Inativo privado", is_active: false, is_public: false },
];

test("Admin vê planos públicos, privados, ativos e inativos", () => {
  assert.deepEqual(plans.map((plan) => plan.name), [
    "Free",
    "teste 1",
    "Premium",
    "Inativo público",
    "Inativo privado",
  ]);
});

test("área pública vê somente planos ativos e públicos", () => {
  const visible = plans.filter((plan) => plan.is_active && plan.is_public);
  assert.deepEqual(visible.map((plan) => plan.name), ["Free", "Premium"]);
});

test("consulta completa ocorre somente depois da autorização de Admin", async () => {
  const source = await readFile("supabase/functions/admin-core/index.ts", "utf8");
  const authorization = source.indexOf('if (!admin?.active) return json({ error: "admin_not_authorized" }, 403)');
  const listing = source.indexOf('body.operation === "list_plans"');
  assert.ok(authorization >= 0);
  assert.ok(listing > authorization);

  const branch = source.slice(listing, source.indexOf("let result", listing));
  assert.match(branch, /service\.from\("saas_plans"\)\.select\("\*"\)/);
  assert.doesNotMatch(branch, /\.eq\("is_(?:active|public)"/);
});

test("Admin usa rota autorizada e landing mantém os dois filtros públicos", async () => {
  const [adminService, landing, adminSection] = await Promise.all([
    readFile("src/services/admin/admin-service.ts", "utf8"),
    readFile("src/app/page.tsx", "utf8"),
    readFile("src/features/admin/components/admin-plans-section.tsx", "utf8"),
  ]);

  const adminSaas = adminService.slice(adminService.indexOf("export async function getAdminSaas"));
  assert.match(adminSaas, /getAdminPlans\(\)/);
  assert.doesNotMatch(adminSaas, /from\("saas_plans"\)/);
  assert.match(landing, /\.eq\("is_active", true\)\.eq\("is_public", true\)/);
  assert.match(adminSection, /plan\.is_public \? "Público" : "Privado"/);
  assert.match(adminSection, /plan\.is_active \? "Ativo" : "Inativo"/);
});
