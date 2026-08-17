import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20260817020000_use_request_radius_for_dispatch.sql", import.meta.url), "utf8");
const createQuote = readFileSync(new URL("../supabase/functions/create-quote-request/index.ts", import.meta.url), "utf8");

test("dispatch usa o raio persistido no chamado", () => {
  assert.match(migration, /target_radius_meters integer/);
  assert.match(migration, /request_row\.radius_meters/);
  assert.match(migration, /st_dwithin\(b\.location, point, search_radius\)/);
  assert.doesNotMatch(migration, /if found then return/);
});

test("raios de 5, 10, 20 e 50 km ficam limitados pela distância escolhida", () => {
  assert.match(migration, /coalesce\(target_radius_meters, settings\.initial_radius_meters\)/);
  assert.match(migration, /least\(greatest\(/);
  assert.match(migration, /limit settings\.initial_business_count/);
});

test("criação continua gerando uma única chamada de notificações por request", () => {
  assert.match(createQuote, /service\.rpc\("criar_notificacoes"/);
  assert.doesNotMatch(createQuote, /criar_notificacoes.*items/i);
  assert.match(migration, /on conflict \(quote_request_id, business_id\)/);
});

test("critérios de elegibilidade permanecem protegidos", () => {
  for (const clause of ["b.status = 'active'", "b.deleted_at is null", "b.is_available_for_requests = true", "b.location is not null", "business_is_open", "last_activity_at >= now() - interval '3 minutes'"]) {
    assert.match(migration, new RegExp(clause.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("caller legado de três argumentos continua disponível", () => {
  assert.match(migration, /target_latitude numeric,\s*target_longitude numeric,\s*target_category_id uuid default null/);
  assert.match(migration, /initial_radius_meters from public\.distribution_settings/);
});
