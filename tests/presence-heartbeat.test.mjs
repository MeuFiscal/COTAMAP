import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const functionSource = readFileSync(new URL("../supabase/functions/update-employee-presence/index.ts", import.meta.url), "utf8");
const shellSource = readFileSync(new URL("../src/features/business/components/business-shell.tsx", import.meta.url), "utf8");
const dispatchSource = readFileSync(new URL("../supabase/migrations/20260815230353_fix_quote_dispatch_hours_and_presence.sql", import.meta.url), "utf8");

test("presence accepts the selected active business instead of assuming the first membership", () => {
  assert.match(functionSource, /select\("business_id,role"\)/);
  assert.match(functionSource, /memberships\.data\.find\(\(membership\) => membership\.business_id === businessId\)/);
  assert.doesNotMatch(functionSource, /\.limit\(1\)\s*\.maybeSingle\(\)/);
});

test("presence updates both timestamps and fails closed for database errors", () => {
  assert.match(functionSource, /last_activity_at: now/);
  assert.match(functionSource, /last_access_at: now/);
  assert.match(functionSource, /return json\(\{ error: "Não foi possível atualizar a presença" \}, 500\)/);
});

test("the UI sends an immediate heartbeat, retries every minute, and exposes reconnecting state", () => {
  assert.match(shellSource, /void heartbeat\(\)/);
  assert.match(shellSource, /setInterval\(\(\) => void heartbeat\(\), 60_000\)/);
  assert.match(shellSource, /Reconectando presença/);
  assert.match(shellSource, /last_activity_at/);
  assert.match(shellSource, /HEARTBEAT_MAX_AGE_MS = 3 \* 60 \* 1000/);
});

test("dispatch still requires an online operator with a recent heartbeat", () => {
  assert.equal((dispatchSource.match(/last_activity_at >= now\(\) - interval '3 minutes'/g) ?? []).length, 2);
  assert.match(dispatchSource, /presence_status = 'online'/);
});
