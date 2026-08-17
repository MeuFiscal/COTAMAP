import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/empresa/operador/page.tsx", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/services/business/business-service.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260829010000_allow_owner_initial_pin.sql", import.meta.url), "utf8");
const bootstrap = readFileSync(new URL("../supabase/functions/ensure-business-account/index.ts", import.meta.url), "utf8");

test("owner sem PIN recebe fluxo de criação no primeiro acesso", () => {
  assert.match(page, /getEmployeePinConfigured/);
  assert.match(page, /Crie seu PIN/);
  assert.match(page, /Criar PIN e entrar/);
  assert.match(page, /confirmPin/);
});

test("owner com PIN existente mantém autenticação normal", () => {
  assert.match(page, /verifyEmployeePin/);
  assert.match(page, /PIN inválido\./);
  assert.match(page, /Digite|PIN do usuário/);
});

test("funcionário sem PIN orienta o responsável", () => {
  assert.match(page, /Peça ao responsável da empresa para configurar seu PIN/);
});

test("PIN inicial é gravado somente por RPC seguro e com hash", () => {
  assert.match(service, /set_initial_employee_pin/);
  assert.match(migration, /crypt\(submitted_pin, gen_salt\('bf', 10\)\)/);
  assert.match(migration, /pin_hash is null/);
  assert.match(migration, /grant execute on function public\.set_initial_employee_pin\(uuid, text\) to authenticated/);
  assert.doesNotMatch(page, /pin_hash/);
  assert.match(bootstrap, /role: "owner"/);
});

test("RPC limita configuração ao próprio owner ativo", () => {
  assert.match(migration, /profile_id = auth\.uid\(\)/);
  assert.match(migration, /role = 'owner'::public\.user_role/);
  assert.match(migration, /is_active/);
  assert.match(migration, /deleted_at is null/);
  assert.match(migration, /submitted_pin !~ '\^\[0-9\]\{4\}\(\[0-9\]\{2\}\)\?\$'/);
});
