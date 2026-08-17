import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const service = fs.readFileSync("src/services/customer/customer-service.ts", "utf8");
const quoteService = fs.readFileSync("src/services/quotes/quote-service.ts", "utf8");
const page = fs.readFileSync("src/app/(private)/historico/page.tsx", "utf8");
const list = fs.readFileSync("src/features/quotes/components/customer-history-list.tsx", "utf8");
const search = fs.readFileSync("src/features/quotes/components/search-quotes-experience.tsx", "utf8");
const form = fs.readFileSync("src/features/quotes/components/quote-form.tsx", "utf8");

test("histórico usa rota dedicada e consulta apenas chamados do cliente", () => {
  assert.match(page, /CustomerHistoryList/);
  assert.match(service, /getCustomerQuoteRequestHistory/);
  assert.match(service, /\.eq\("customer_id", session\.session\.user\.id\)/);
  assert.match(service, /\.is\("deleted_at", null\)/);
  assert.match(service, /\.order\("created_at", \{ ascending: false \}\)/);
});

test("histórico tem fallback vazio/erro e status amigável", () => {
  assert.match(list, /Você ainda não possui solicitações anteriores/);
  assert.match(list, /Não foi possível carregar seu histórico/);
  assert.match(list, /Cancelado/);
  assert.match(list, /Concluído/);
});

test("repetir chamado abre apenas o rascunho", () => {
  assert.match(list, /\/nova-cotacao\?request=/);
  assert.match(form, /getQuoteRequestDraft/);
  assert.match(form, /O original não será alterado/);
  assert.match(search, /href="\/historico"/);
});

test("restauração mantém a peça principal separada dos adicionais", () => {
  assert.match(quoteService, /partQuantity: Number\(requestItems\.data\?\.\[0\]\?\.quantity \?\? 1\)/);
  assert.match(quoteService, /\.slice\(1\)\.map/);
  assert.match(form, /items: normalizedItems/);
});
