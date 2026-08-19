import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../src/features/auth/components/private-shell.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/services/auth/auth-service.ts", import.meta.url), "utf8");
const business = readFileSync(new URL("../src/services/business/business-service.ts", import.meta.url), "utf8");
const provider = readFileSync(new URL("../src/providers/auth-provider.tsx", import.meta.url), "utf8");

test("contexto cliente não vira empresa só pelo metadata ou vínculo existente", () => {
  assert.match(shell, /pathname\.startsWith\("\/empresa"\) \|\| Boolean\(businessRole\)/);
  assert.doesNotMatch(shell, /user\?\.accountType === "business" \|\| pathname/);
  assert.doesNotMatch(auth.slice(auth.indexOf("export async function signUpCustomer"), auth.indexOf("export async function ensurePlatformAdmin")), /invokeEnsureBusinessAccount/);
  assert.doesNotMatch(business.slice(business.indexOf("export async function getCurrentBusinessId"), business.indexOf("export async function getBusinessCalls")), /invokeEnsureBusinessAccount/);
});

test("Admin permanece disponível sem substituir o contexto cliente/empresa", () => {
  assert.match(shell, /const adminLink = isAdmin \?/);
  assert.match(provider, /setIsAdmin\(!error && data\?\.is_admin === true\)/);
  assert.doesNotMatch(provider, /isKnownPlatformAdmin/);
});

test("destino pós-login usa vínculo empresarial legítimo, sem histórico de cotações", () => {
  assert.match(auth, /business_employees/);
  assert.match(auth, /owner_profile_id/);
  assert.match(auth, /getPersistedBusinessId/);
  assert.doesNotMatch(auth.slice(auth.indexOf("export async function getPostLoginPath")), /quote_requests/);
  assert.doesNotMatch(auth.slice(auth.indexOf("export async function getPostLoginPath")), /limit\(1\)/);
  assert.match(auth, /return "\/empresa\/operador"/);
  assert.match(auth, /return AUTH_ROUTES\.dashboard/);
});
