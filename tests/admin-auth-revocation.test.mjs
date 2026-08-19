import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ensure = readFileSync(new URL("../supabase/functions/ensure-platform-admin/index.ts", import.meta.url), "utf8");
const provider = readFileSync(new URL("../src/providers/auth-provider.tsx", import.meta.url), "utf8");

test("Platform Admin ativo é a única fonte de autorização", () => {
  assert.match(ensure, /existing\.data\[0\]\?\.active === true/);
  assert.doesNotMatch(ensure, /platform_admins.*insert|\.insert\(/s);
  assert.doesNotMatch(ensure, /update\(\{\s*active\s*:\s*true/);
  assert.doesNotMatch(ensure, /SUPER_ADMIN_EMAIL/);
});

test("Admin revogado e usuário sem registro continuam sem acesso", () => {
  assert.match(ensure, /existing\.data\[0\]\?\.active === true/);
  assert.match(ensure, /is_admin: false/);
  assert.match(provider, /setIsAdmin\(!error && data\?\.is_admin === true\)/);
});

test("checagem não imprime identidade ou autorização completa", () => {
  assert.doesNotMatch(ensure, /console\.log\("user"|console\.log\("Authorization"|console\.log\("platform_admins result"/);
});
