import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const customer = readFileSync(new URL("../src/services/customer/customer-service.ts", import.meta.url), "utf8");
const customerHook = readFileSync(new URL("../src/features/customer/hooks/use-customer-journey.ts", import.meta.url), "utf8");
const search = readFileSync(new URL("../src/features/quotes/components/search-quotes-experience.tsx", import.meta.url), "utf8");
const business = readFileSync(new URL("../src/services/business/business-service.ts", import.meta.url), "utf8");
const businessHook = readFileSync(new URL("../src/features/business/hooks/use-business-calls.ts", import.meta.url), "utf8");
const respond = readFileSync(new URL("../supabase/functions/respond-quotation/index.ts", import.meta.url), "utf8");
const cancel = readFileSync(new URL("../supabase/functions/cancel-quote-request/index.ts", import.meta.url), "utf8");
const businessDetail = readFileSync(new URL("../src/app/empresa/chamados/[id]/page.tsx", import.meta.url), "utf8");
const businessService = readFileSync(new URL("../src/services/business/business-service.ts", import.meta.url), "utf8");

test("propostas usam quotation real, distância oficial e aparecem na experiência de busca", () => {
  assert.match(customer, /from\("quotations"\)/);
  assert.match(customer, /from\("quote_notifications"\).*distance_meters/);
  assert.match(customer, /distanceMeters/);
  assert.match(search, /quotation\.business\?\.name/);
  assert.match(search, /quotation\.amount/);
  assert.match(search, /quotation\.distanceMeters/);
  assert.match(search, /Ver detalhes/);
});

test("Realtime de quotations e quote_requests invalida somente consultas relacionadas", () => {
  assert.match(customerHook, /table: "quotations"/);
  assert.match(customerHook, /table: "quote_requests"/);
  assert.match(customerHook, /invalidateQueries\(\{ queryKey: \["customer-quotations"\]/);
  assert.doesNotMatch(customerHook, /refetchInterval/);
});

test("cancelamento remove chamados ativos das consultas do lojista", () => {
  assert.match(business, /quote_notifications.*is\("deleted_at", null\).*in\("status", \["pending", "sent"\]\)/);
  assert.match(business, /quote_requests.*eq\("status", "waiting"\)/);
  assert.match(businessHook, /table: "quote_requests"/);
  assert.match(cancel, /cancel_quote_request/);
});

test("cancelamento remove o card do cache do lojista e possui fallback de atualização", () => {
  assert.match(businessHook, /setQueryData/);
  assert.match(businessHook, /payload\.new\.status/);
  assert.match(businessHook, /refetchInterval: 5_000/);
});

test("detalhe de chamado encerrado não mantém ações e redireciona", () => {
  assert.match(businessDetail, /if \(!calls\.isLoading && !status\.isLoading && terminal\) router\.replace\("\/empresa\/chamados"\)/);
  assert.match(businessDetail, /Este chamado foi encerrado pelo cliente/);
  assert.match(businessDetail, /disabled=\{closed \|\| reject\.isPending\}/);
});

test("detalhe confirma status atual independentemente do cache da lista", () => {
  assert.match(businessService, /getBusinessCallStatus/);
  assert.match(businessDetail, /useBusinessCallStatus/);
  assert.match(businessDetail, /status\.data\.requestStatus !== "waiting"/);
  assert.match(businessDetail, /status\.data\.notificationStatus/);
});

test("histórico reconhece chamado cancelado e bloqueia novo cancelamento", () => {
  const cancelButton = readFileSync(new URL("../src/features/quotes/components/cancel-quote-button.tsx", import.meta.url), "utf8");
  const quoteList = readFileSync(new URL("../src/features/quotes/components/quote-list.tsx", import.meta.url), "utf8");
  assert.match(customer, /getCustomerRequestStatus/);
  assert.match(customerHook, /useCustomerRequestStatus/);
  assert.match(cancelButton, /Chamado cancelado/);
  assert.match(cancelButton, /status\.data !== "waiting"/);
  assert.match(quoteList, /requestStatus\.data === "cancelled"/);
});

test("respond-quotation aceita aliases seguros, recusa sem cotação e bloqueia estado encerrado", () => {
  assert.match(respond, /normalizeAction/);
  assert.match(respond, /"reject", "rejected", "recusar"/);
  assert.match(respond, /target_action: action/);
  assert.match(respond, /request_expired/);
  assert.match(respond, /notification_not_active/);
  assert.match(respond, /return json\(\{ quotation: data \}\)/);
});

test("erros de recusa/cancelamento não expõem detalhes técnicos ao cliente", () => {
  assert.match(respond, /quotation_response_failed/);
  assert.match(cancel, /return json\(\{ error: error\.message \}/);
});
