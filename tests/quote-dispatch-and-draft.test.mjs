import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/20260815230353_fix_quote_dispatch_hours_and_presence.sql", import.meta.url), "utf8");
const searchExperience = readFileSync(new URL("../src/features/quotes/components/search-quotes-experience.tsx", import.meta.url), "utf8");
const searchStatus = readFileSync(new URL("../src/features/quotes/components/search-status.tsx", import.meta.url), "utf8");
const quoteForm = readFileSync(new URL("../src/features/quotes/components/quote-form.tsx", import.meta.url), "utf8");
const quoteService = readFileSync(new URL("../src/services/quotes/quote-service.ts", import.meta.url), "utf8");
const quotePage = readFileSync(new URL("../src/app/(private)/nova-cotacao/page.tsx", import.meta.url), "utf8");

test("horário vazio usa o padrão visual e contrato enabled/open/close", () => {
  assert.match(migration, /day_key <> 'sun'/);
  assert.match(migration, /'open', '08:00'/);
  assert.match(migration, /'close', '18:00'/);
  assert.match(migration, /schedule ->> 'enabled'/);
  assert.doesNotMatch(migration, /schedule->>'closed'/);
  assert.match(migration, /America\/Sao_Paulo/);
});

test("dispatch exige operador online com heartbeat recente em todas as rodadas", () => {
  const heartbeatUses = migration.match(/last_activity_at >= now\(\) - interval '3 minutes'/g) ?? [];
  assert.equal(heartbeatUses.length, 2);
  assert.match(migration, /business_is_open\(b\.opening_hours, now\(\)\)/);
  assert.match(migration, /having count\(e\.id\) filter/);
});

test("tela conta somente notificações reais e não expõe pending", () => {
  assert.match(searchExperience, /notifications\.length/);
  assert.match(searchExperience, /item\.status === "responded"/);
  assert.match(searchExperience, /Buscando empresas disponíveis/);
  assert.match(searchExperience, /Procurando empresas disponíveis na sua região/);
  assert.match(searchStatus, /Aguardando respostas/);
  assert.match(searchExperience, /notifications\.map/);
  assert.doesNotMatch(searchExperience, />Pendentes</);
  assert.doesNotMatch(searchStatus, /simulamos o contato/);
});

test("voltar aponta para o UUID específico do chamado", () => {
  assert.match(searchExperience, /\/nova-cotacao\?request=\$\{encodeURIComponent\(search\.request\.id\)\}/);
  assert.match(quotePage, /searchParams: Promise<\{ request\?: string \}>/);
  assert.match(quotePage, /<QuoteForm requestId=\{request \?\? null\}/);
});

test("rascunho é lido apenas para o cliente proprietário e não altera o original", () => {
  assert.match(quoteService, /\.eq\("customer_id", userData\.user\.id\)/);
  assert.match(quoteService, /\.is\("deleted_at", null\)/);
  assert.match(quoteService, /part_name,vehicle_brand,vehicle_model,vehicle_year,vehicle_engine,observation,radius_meters,latitude,longitude/);
  assert.doesNotMatch(quoteService, /quote_requests"\)\.update/);
});

test("restauração inclui campos e localização sem criar chamado automaticamente", () => {
  const restorationEffect = quoteForm.slice(
    quoteForm.indexOf("useEffect(() =>"),
    quoteForm.indexOf("const quoteMutation"),
  );
  assert.match(quoteForm, /reset\(draftQuery\.data\.values\)/);
  assert.match(quoteForm, /setRestoredCoordinates\(draftQuery\.data\.coordinates\)/);
  assert.match(quoteService, /restoredCoordinates \?\? await getCoordinates\(\)/);
  assert.match(quoteForm, /handleSubmit\(async \(values\)/);
  assert.doesNotMatch(restorationEffect, /mutate|insert|update/);
});

test("limpar remove dados e request da URL sem escrever no chamado", () => {
  assert.match(quoteForm, /reset\(initialValues\)/);
  assert.match(quoteForm, /setRestoredCoordinates\(null\)/);
  assert.match(quoteForm, /setPhoto\(null\)/);
  assert.match(quoteForm, /router\.replace\("\/nova-cotacao"\)/);
  assert.match(quoteForm, />Limpar formulário</);
});
