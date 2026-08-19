import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20260819223739_allow_customer_read_own_quote_notifications.sql", import.meta.url), "utf8");
const hook = readFileSync(new URL("../src/features/quotes/hooks/use-quote-search.ts", import.meta.url), "utf8");
const experience = readFileSync(new URL("../src/features/quotes/components/search-quotes-experience.tsx", import.meta.url), "utf8");

test("cliente lê somente notificações dos próprios chamados", () => {
  assert.match(migration, /quote_notifications_select_request_customer/);
  assert.match(migration, /request\.customer_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /request\.deleted_at is null/);
  assert.doesNotMatch(migration, /using\s*\(true\)/i);
});

test("contador e lista usam as mesmas notificações persistidas", () => {
  assert.match(hook, /from\("quote_notifications"\)/);
  assert.match(hook, /eq\("quote_request_id", requestId/);
  assert.match(hook, /CustomerNotification/);
  assert.match(experience, /const notifications = search\.notifications/);
  assert.match(experience, /value=\{String\(notifications\.length\)\}/);
  assert.match(experience, /notifications\.map/);
  assert.doesNotMatch(experience, /quotations\.data\?\.length \? <div/);
});

test("novas notificações atualizam por Realtime e fallback existente", () => {
  assert.match(hook, /table: "quote_notifications"/);
  assert.match(hook, /invalidateQueries\(\{ queryKey: \["quote-notifications", requestId\] \}\)/);
  assert.match(hook, /refetchInterval: 5_000/);
  assert.match(experience, /search\.error/);
  assert.match(experience, /Não foi possível carregar/);
});
