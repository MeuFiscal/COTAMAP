import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("business logos storage is constrained to owner writes", () => {
  const migration = read("supabase/migrations/20260827000000_business_logos_storage.sql");
  assert.match(migration, /business-logos/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/png/);
  assert.match(migration, /image\/webp/);
  assert.match(migration, /5242880/);
  assert.match(migration, /business_logos_insert_owner/);
  assert.match(migration, /business_logos_update_owner/);
  assert.match(migration, /business_logos_delete_owner/);
  assert.match(migration, /role\s*=\s*'owner'/);
});

test("business logo policies delegate authorization to private.is_owner", () => {
  const migration = read("supabase/migrations/20260827010000_fix_business_logos_storage_owner_policy.sql");
  assert.equal((migration.match(/private\.is_owner\(/g) ?? []).length, 4);
  assert.match(migration, /for insert to authenticated/);
  assert.match(migration, /for update to authenticated/);
  assert.match(migration, /for delete to authenticated/);
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(migration, /to anon/);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\]\)::uuid/);
});

test("business logo upsert has owner-scoped authenticated SELECT", () => {
  const migration = read("supabase/migrations/20260827020000_allow_business_logo_upsert_select.sql");
  assert.match(migration, /business_logos_select_owner/);
  assert.match(migration, /on storage\.objects for select to authenticated/);
  assert.match(migration, /bucket_id = 'business-logos'/);
  assert.match(migration, /private\.is_owner\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\)/);
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(migration, /to anon/);
});

test("business logo service uses one deterministic path and persists logo_url", () => {
  const service = read("src/services/business/registration-service.ts");
  assert.match(service, /const LOGO_BUCKET = "business-logos"/);
  assert.match(service, /\$\{businessId\}\/logo\.webp/);
  assert.match(service, /contentType:\s*"image\/webp"/);
  assert.match(service, /update\(\{ logo_url: publicUrl \}/);
  assert.match(service, /update\(\{ logo_url: null \}/);
});

test("logo editor validates image input and produces a square preview", () => {
  const editor = read("src/features/business/components/business-logo-editor.tsx");
  assert.match(editor, /image\/jpeg/);
  assert.match(editor, /image\/png/);
  assert.match(editor, /image\/webp/);
  assert.match(editor, /5 \* 1024 \* 1024/);
  assert.match(editor, /canvas\.width\s*=\s*512/);
  assert.match(editor, /canvas\.height\s*=\s*512/);
  assert.match(editor, /toBlob/);
});

test("dashboard greeting uses Brazil time and preserves metrics query", () => {
  const dashboard = read("src/app/empresa/dashboard/page.tsx");
  assert.match(dashboard, /America\/Sao_Paulo/);
  assert.match(dashboard, /Bom dia/);
  assert.match(dashboard, /Boa tarde/);
  assert.match(dashboard, /Boa noite/);
  assert.match(dashboard, /getBusinessDashboard/);
  assert.match(dashboard, /query\.data\?\.metrics\.map/);
});

test("business and customer surfaces render logo fallback components", () => {
  const shell = read("src/features/business/components/business-shell.tsx");
  const quoteList = read("src/features/quotes/components/quote-list.tsx");
  const search = read("src/features/quotes/components/search-quotes-experience.tsx");
  assert.match(shell, /BusinessLogo/);
  assert.match(shell, /updateEmployeePresence/);
  assert.match(shell, /set_my_business_availability/);
  assert.match(quoteList, /BusinessLogo/);
  assert.match(search, /BusinessLogo/);
});
