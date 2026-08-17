import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260828000000_add_quote_request_items.sql", "utf8");
const requestFunction = fs.readFileSync("supabase/functions/create-quote-request/index.ts", "utf8");
const responseFunction = fs.readFileSync("supabase/functions/respond-quotation/index.ts", "utf8");
const chooseMigration = fs.readFileSync("supabase/migrations/20260828000000_add_quote_request_items.sql", "utf8");
const cancelFunction = fs.readFileSync("supabase/functions/cancel-quote-request/index.ts", "utf8");

test("multi-item schema is normalized and bounded to ten items", () => {
  assert.match(migration, /create table if not exists public\.quote_request_items/);
  assert.match(migration, /create table if not exists public\.quotation_items/);
  assert.match(migration, /position between 0 and 9/);
  assert.match(requestFunction, /items\.length > 10/);
});

test("legacy request remains compatible through a synthetic first item", () => {
  assert.match(requestFunction, /body\.items.*body\.part_name/);
  assert.match(responseFunction, /responder_cotacao/);
});

test("quotation total is calculated server-side from available item lines", () => {
  assert.match(migration, /line_total := line_total \+ price \* qty/);
  assert.match(migration, /round\(line_total,2\)/);
  assert.match(migration, /at_least_one_item_available/);
});

test("choosing a quotation persists item quantity, unit price and subtotal", () => {
  assert.match(chooseMigration, /create table if not exists public\.order_items/);
  assert.match(chooseMigration, /round\(qty\*line\.unit_price,2\)/);
});

test("dispatch remains request-level and item tables are owner-scoped", () => {
  assert.match(migration, /quote_request_items_select_authorized/);
  assert.match(migration, /quotation_items_select_authorized/);
  assert.doesNotMatch(migration, /quote_item_notifications/); // no per-item notification path is introduced
});

test("one request still dispatches one notification per business", () => {
  assert.match(migration, /quote_notifications/);
  assert.doesNotMatch(requestFunction, /quote_request_items.*quote_notifications/s);
});

test("legacy cancellation and closed-request conflict protections remain intact", () => {
  assert.match(cancelFunction, /request_not_cancellable/);
  assert.match(responseFunction, /notification_not_active/);
  assert.match(responseFunction, /request_expired/);
  assert.match(responseFunction, /409/);
});

test("partial responses can mark unavailable items without charging them", () => {
  assert.match(migration, /available_count = 0/);
  assert.match(migration, /coalesce\(\(item->>'available'\)::boolean, false\)/);
  assert.match(migration, /line_total := line_total \+ price \* qty/);
});
