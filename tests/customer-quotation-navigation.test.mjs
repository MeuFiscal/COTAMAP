import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const search = readFileSync(new URL("../src/features/quotes/components/search-quotes-experience.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../src/app/(private)/cotacoes/[id]/page.tsx", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/services/customer/customer-service.ts", import.meta.url), "utf8");

test("cards de cotação abrem a cotação exata e não exibem CTA duplicado", () => {
  assert.match(search, /href=\{`\/cotacoes\/\$\{quotation\.id\}`\}/);
  assert.match(search, /aria-label=\{`Ver cotação de/);
  assert.match(search, /Ver detalhes/);
  assert.doesNotMatch(search, />Ver cotações<|>Ver Cotações<|>VER COTAÇÕES</);
});

test("detalhe retorna à mesma solicitação e mantém a identificação da cotação", () => {
  assert.match(detail, /useCustomerQuotations\(\)/);
  assert.match(detail, /item\.id === id/);
  assert.match(detail, /procurando-cotacoes\?request=/);
  assert.match(detail, /quote\.quote_request_id/);
});

test("consulta de cotações permanece limitada ao cliente autenticado", () => {
  assert.match(service, /from\("quote_requests"\)/);
  assert.match(service, /eq\("customer_id", session\.session\.user\.id\)/);
  assert.match(service, /from\("quotations"\)/);
});

test("detalhe exibe itens e preserva o fluxo de escolha", () => {
  assert.match(detail, /Itens da proposta/);
  assert.match(detail, /item\.available/);
  assert.match(detail, /chooseQuotation\(id\)/);
});

test("não cria nem altera solicitação ao navegar entre as cotações", () => {
  assert.doesNotMatch(search, /createQuoteRequest|create-quote-request/);
  assert.doesNotMatch(detail, /update\("quote_requests"\)|from\("quote_requests"\)/);
  assert.match(detail, /quote\.quote_request_id/);
});

test("cartão permanece acessível em telas pequenas", () => {
  assert.match(search, /block rounded-2xl/);
  assert.match(search, /focus-visible:ring-2/);
});

test("detalhe não aceita uma cotação fora da lista autorizada do cliente", () => {
  assert.match(detail, /const quote = query\.data\?\.find\(\(item\) => item\.id === id\)/);
  assert.match(detail, /if \(!quote\)/);
  assert.match(service, /eq\("customer_id", session\.session\.user\.id\)/);
});
