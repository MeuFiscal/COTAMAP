import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPage = readFileSync(new URL("../src/app/(private)/admin/page.tsx", import.meta.url), "utf8");
const landingPage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("queries administrativas aguardam autenticação completa e Platform Admin", () => {
  assert.match(adminPage, /const adminQueriesEnabled = !loading && Boolean\(session\?\.user\) && isAdmin/);
  assert.strictEqual((adminPage.match(/enabled: adminQueriesEnabled/g) ?? []).length, 2);
  assert.match(adminPage, /if \(loading\) return/);
  assert.match(adminPage, /if \(!session\?\.user \|\| !isAdmin\) return/);
});

test("sessão perdida cancela e remove o cache administrativo", () => {
  assert.match(adminPage, /cancelQueries\(\{ queryKey: \["admin-overview"\] \}\)/);
  assert.match(adminPage, /cancelQueries\(\{ queryKey: \["admin-saas"\] \}\)/);
  assert.match(adminPage, /removeQueries\(\{ queryKey: \["admin-overview"\] \}\)/);
  assert.match(adminPage, /removeQueries\(\{ queryKey: \["admin-saas"\] \}\)/);
});

test("erros de autenticação não entram em retry repetitivo", () => {
  assert.match(adminPage, /isAdminAuthorizationError/);
  assert.match(adminPage, /retry: \(failureCount, error\) => !isAdminAuthorizationError\(error\) && failureCount < 1/);
  assert.match(adminPage, /42501|permission denied|forbidden/);
});

test("landing pública não consulta saas_checkouts como anon", () => {
  assert.doesNotMatch(landingPage, /saas_checkouts/);
  assert.match(landingPage, /saas_plans/);
});
