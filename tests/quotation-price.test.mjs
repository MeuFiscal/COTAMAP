import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const currencySource = readFileSync(new URL("../src/features/business/utils/currency.ts", import.meta.url), "utf8");
const formSource = readFileSync(new URL("../src/features/business/components/call-response-form.tsx", import.meta.url), "utf8");
const formatCurrencyInput = (value) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const parseCurrencyInput = (value) => {
  const normalized = value.replace(/\s/g, "").replace(/^R\$\s?/, "").replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

test("preço por item começa vazio e não usa input number", () => {
  assert.match(currencySource, /export function formatCurrencyInput/);
  assert.match(currencySource, /export function parseCurrencyInput/);
  assert.match(formSource, /unit_price: ""/);
  assert.match(formSource, /type="text" inputMode="decimal"/);
  assert.doesNotMatch(formSource, /type="number"[^>]*unit_price/);
});

test("máscara BRL permite apagar e converte centavos", () => {
  assert.equal(formatCurrencyInput(""), "");
  assert.equal(formatCurrencyInput("1"), "0,01");
  assert.equal(formatCurrencyInput("10"), "0,10");
  assert.equal(formatCurrencyInput("100"), "1,00");
  assert.equal(formatCurrencyInput("12590"), "125,90");
  assert.equal(formatCurrencyInput("125000"), "1.250,00");
  assert.equal(parseCurrencyInput("R$ 1.250,90"), 1250.9);
  assert.equal(parseCurrencyInput(""), null);
});

test("preço disponível exige valor positivo e indisponível limpa o campo", () => {
  assert.match(formSource, /item\.available && \(parseCurrencyInput\(item\.unit_price\) \?\? 0\) <= 0/);
  assert.match(formSource, /available: event\.target\.checked, unit_price: event\.target\.checked \? line\.unit_price : ""/);
});

test("total considera somente itens disponíveis e multiplica quantidade", () => {
  assert.match(formSource, /item\.available \? \(parseCurrencyInput\(item\.unit_price\) \?\? 0\) \* Number\(item\.quantity \|\| 0\) : 0/);
  const lines = [
    { available: true, unit_price: parseCurrencyInput("R$ 100,00"), quantity: 2 },
    { available: true, unit_price: parseCurrencyInput("R$ 500,00"), quantity: 1 },
    { available: false, unit_price: null, quantity: 1 },
  ];
  assert.equal(lines.reduce((sum, line) => sum + (line.available ? (line.unit_price ?? 0) * line.quantity : 0), 0), 700);
});

test("payload envia unit_price numérico", () => {
  assert.match(formSource, /unit_price: item\.available \? parseCurrencyInput\(item\.unit_price\) \?\? 0 : 0/);
  assert.doesNotMatch(formSource, /items: items\.length \? itemResponses : undefined/);
});
