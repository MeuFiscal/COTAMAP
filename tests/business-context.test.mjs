import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync(new URL("../src/services/business/business-service.ts", import.meta.url), "utf8");
const provider = readFileSync(new URL("../src/features/business/context/operator-context.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/empresa/operador/page.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/services/auth/auth-service.ts", import.meta.url), "utf8");

test("empresa atual usa seleção versionada por usuário e valida vínculo ativo", () => {
  assert.match(service, /cotamap:selected-business:v1:\$\{userId\}/);
  assert.match(service, /business_employees/);
  assert.match(service, /is_active.*true/);
  assert.match(service, /setSelectedBusinessId/);
  assert.match(service, /memberships\.some\(\(membership\) => membership\.business_id === stored\)/);
});

test("múltiplos vínculos não escolhem empresa arbitrariamente", () => {
  const current = service.slice(service.indexOf("export async function getCurrentBusinessId"), service.indexOf("export async function getBusinessCalls"));
  assert.doesNotMatch(current, /limit\(1\)/);
  assert.match(service, /if \(memberships\.length === 1\)/);
  assert.match(provider, /getSelectedBusinessId/);
});

test("troca de empresa limpa operador e carrega funcionários pelo business_id selecionado", () => {
  assert.match(page, /getBusinessEmployeesForBusiness/);
  assert.match(page, /setSelectedBusinessId/);
  assert.match(page, /clearOperator\(\)/);
  assert.match(page, /clearBusiness\(\)/);
  assert.match(page, /business-employees", businessId/);
});

test("pós-login prioriza vínculo legítimo e não histórico de cliente", () => {
  const postLogin = auth.slice(auth.indexOf("export async function getPostLoginPath"));
  assert.match(postLogin, /owner_profile_id/);
  assert.match(postLogin, /profile\?\.role === item\.role/);
  assert.doesNotMatch(postLogin, /quote_requests|requests\.count|limit\(1\)/);
});

test("heartbeat e operador permanecem vinculados à empresa selecionada", () => {
  assert.match(page, /businessId/);
  assert.match(page, /businessId: employee\.business_id/);
  assert.match(provider, /parsed\.businessId === businessId/);
});
