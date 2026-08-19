import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const helper = readFileSync(new URL("../src/lib/meta-pixel.ts", import.meta.url), "utf8");
const component = readFileSync(new URL("../src/components/analytics/meta-pixel.tsx", import.meta.url), "utf8");
const customer = readFileSync(new URL("../src/features/auth/components/customer-sign-up-form.tsx", import.meta.url), "utf8");

test("Meta Pixel enfileira eventos antes do carregamento do script", () => {
  assert.match(helper, /fbq\.queue = \[\]/);
  assert.match(helper, /fbq\.queue\?\.push\(args\)/);
  assert.match(helper, /fbevents\.js/);
  assert.match(helper, /META_PIXEL_ID/);
});

test("eventos usam a fila central e o bootstrap não duplica script/init", () => {
  assert.match(helper, /ensureMetaPixel/);
  assert.match(helper, /__metaPixelInitialized/);
  assert.match(helper, /data-meta-pixel/);
  assert.match(component, /initializeMetaPixel/);
  assert.match(component, /lastPage\.current !== pathname/);
});

test("CompleteRegistration permanece após sucesso do cadastro", () => {
  const successBlock = customer.slice(customer.indexOf("if (error || !data.user)"));
  assert.match(successBlock, /trackMetaEvent\("CompleteRegistration"/);
  assert.doesNotMatch(customer.slice(0, customer.indexOf("if (error || !data.user)")), /CompleteRegistration/);
});
