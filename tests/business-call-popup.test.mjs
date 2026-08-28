import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../src/features/business/components/business-shell.tsx", import.meta.url), "utf8");
const respond = readFileSync(new URL("../supabase/functions/respond-quotation/index.ts", import.meta.url), "utf8");

test("popup adicional reutiliza o evento existente de novo chamado", () => {
  assert.match(shell, /table: "quote_notifications"/);
  assert.match(shell, /event: "INSERT"/);
  assert.match(shell, /setCallQueue/);
  assert.match(shell, /current\.some\(\(call\) => call\.id === id\)/);
  assert.match(shell, /role="dialog"/);
  assert.match(shell, /Ver chamado/);
  assert.match(shell, /Recusar/);
});

test("fila remove somente o chamado decidido e mantém o alerta persistente", () => {
  assert.match(shell, /filter\(\(call\) => call\.id !== currentCall\.id\)/);
  assert.match(shell, /filter\(\(item\) => item\.id !== call\.id\)/);
  assert.match(shell, /setInterval\(playCallAlert, 2200\)/);
  assert.match(shell, /currentCall \? <div className="fixed inset-0/);
  assert.doesNotMatch(shell, /new Audio\(/);
});

test("recusar reutiliza a persistência oficial sem migration ou status paralelo", () => {
  assert.match(shell, /respondToQuotation\(\{ notificationId: call\.id, businessId: call\.businessId, action: "reject" \}\)/);
  assert.match(respond, /target_action: action/);
  assert.match(respond, /"reject", "rejected", "recusar"/);
  assert.doesNotMatch(shell, /\.from\("quote_notifications"\)\.update/);
});

test("o fluxo visual existente continua presente junto do popup", () => {
  assert.match(shell, /Novo chamado recebido/);
  assert.match(shell, /Uma solicitação está aguardando resposta/);
  assert.match(shell, /client\.invalidateQueries\(\{ queryKey: \["business-plan"/);
  assert.match(shell, /business-call-alerts-/);
});
