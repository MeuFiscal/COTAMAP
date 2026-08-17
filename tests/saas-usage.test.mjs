import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync(new URL("../src/services/saas/plan-service.ts", import.meta.url), "utf8");
const hook = readFileSync(new URL("../src/features/saas/hooks/use-business-plan.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/empresa/plano/page.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../src/features/business/components/business-shell.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260817184526_grant_authenticated_read_saas_daily_usage.sql", import.meta.url), "utf8");

const percentage = (used, limit) => used === null || limit === null || limit <= 0 ? null : Math.min((used / limit) * 100, 100);

test("uso diário calcula a barra sem ultrapassar o limite", () => {
  assert.equal(percentage(0, 3), 0);
  assert.ok(Math.abs(percentage(1, 3) - 100 / 3) < 0.000001);
  assert.equal(Math.round(percentage(2, 3)), 67);
  assert.equal(percentage(3, 3), 100);
  assert.equal(percentage(5, 3), 100);
});

test("uso ilimitado não divide por zero", () => assert.equal(percentage(2, null), null));

test("falha de uso não vira zero falso", () => {
  assert.match(service, /usedToday: usage\.error \? null/);
  assert.match(service, /usageAvailable: !usage\.error/);
  assert.match(page, /Uso indisponível/);
});

test("consulta usa business selecionado e data operacional de São Paulo", () => {
  assert.match(hook, /operator\?\.businessId/);
  assert.match(service, /selectedBusinessId \?\? await getCurrentBusinessId/);
  assert.match(service, /America\/Sao_Paulo/);
  assert.match(service, /operationalDate\(\)/);
});

test("leitura é concedida somente à role authenticated e continua protegida por RLS", () => {
  assert.match(migration, /grant select on table public\.saas_daily_usage to authenticated/);
  assert.match(service, /saas_daily_usage/);
  assert.match(shell, /invalidateQueries\(\{ queryKey: \[\"business-plan\"/);
});

test("novo chamado invalida o plano para atualizar o contador", () => {
  assert.match(shell, /table: \"quote_notifications\"/);
  assert.match(shell, /\[\"business-plan\", business\?\.id\]/);
});
