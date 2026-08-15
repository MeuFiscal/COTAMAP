export type JsonObject = Record<string, unknown>;

export const ACTIVATION_EVENTS = new Set(["purchase_approved"]);
export const CREATION_EVENTS = new Set(["subscription_created"]);
export const RENEWAL_EVENTS = new Set(["subscription_renewed", "subscription_renewal_refused"]);
export const REVOCATION_EVENTS = new Set([
  "subscription_canceled",
  "subscription_cancelled",
  "refund",
  "chargeback",
]);

const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

export function isCaktoCanceledStatus(value: unknown): boolean {
  const status = text(value).toLowerCase();
  return status === "canceled" || status === "cancelled";
}

const object = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};

export function normalizeCaktoEvent(value: unknown): string {
  const event = text(value).toLowerCase();
  if (event === "subscription_cancelled") return "subscription_canceled";
  if (event === "subscription_renewal_refusal" || event === "subscription_renewal_failed") {
    return "subscription_renewal_refused";
  }
  return event || "unknown";
}

export type ParsedCaktoItem = {
  item: JsonObject;
  customerEmail: string;
  productId: string;
  offerId: string;
  subscriptionId: string;
  orderId: string;
  status: string;
  eventAt: string;
};

export function parseCaktoItem(item: JsonObject): ParsedCaktoItem {
  const subscriptionValue = item.subscription;
  const subscription = object(subscriptionValue);
  const product = Object.keys(object(item.product)).length ? object(item.product) : object(subscription.product);
  const offer = Object.keys(object(item.offer)).length ? object(item.offer) : object(subscription.offer);
  const customer = Object.keys(object(item.customer)).length ? object(item.customer) : object(subscription.customer);
  const parentOrder = object(subscription.parent_order);
  const subscriptionId = typeof subscriptionValue === "string"
    ? text(subscriptionValue)
    : text(subscription.id);
  const orderId = text(item.id) || text(item.order_id) || text(parentOrder.id) || text(subscription.order_id);
  const eventAt = [
    item.updated_at,
    item.updatedAt,
    item.paid_at,
    item.paidAt,
    item.created_at,
    item.createdAt,
    subscription.updated_at,
    subscription.created_at,
  ].map(text).find(Boolean) ?? new Date().toISOString();

  return {
    item,
    customerEmail: text(customer.email).toLowerCase(),
    productId: text(product.id),
    offerId: text(offer.id),
    subscriptionId,
    orderId,
    status: (text(item.status) || text(subscription.status)).toLowerCase(),
    eventAt,
  };
}

export async function caktoEventId(event: string, parsed: ParsedCaktoItem): Promise<string> {
  const currentPeriod = object(object(parsed.item.subscription).current_period);
  const stable = [
    normalizeCaktoEvent(event),
    parsed.subscriptionId,
    parsed.orderId,
    parsed.productId,
    parsed.offerId,
    parsed.status,
    parsed.eventAt,
    text(currentPeriod.start),
    text(currentPeriod.end),
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stable));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type WebhookAction = "activate" | "record" | "renew" | "revoke" | "ignore";

export function actionForCaktoEvent(event: string): WebhookAction {
  const normalized = normalizeCaktoEvent(event);
  if (ACTIVATION_EVENTS.has(normalized)) return "activate";
  if (CREATION_EVENTS.has(normalized)) return "record";
  if (RENEWAL_EVENTS.has(normalized)) return "renew";
  if (REVOCATION_EVENTS.has(normalized)) return "revoke";
  return "ignore";
}

export function effectiveCaktoEvent(event: string, status: string): string {
  const normalized = normalizeCaktoEvent(event);
  if (actionForCaktoEvent(normalized) !== "ignore") return normalized;
  const normalizedStatus = status.trim().toLowerCase();
  if (normalizedStatus === "refunded") return "refund";
  if (normalizedStatus === "chargedback" || normalizedStatus === "chargeback") return "chargeback";
  if (normalizedStatus === "canceled" || normalizedStatus === "cancelled") return "subscription_canceled";
  return normalized;
}

export function canRequestCancellation(input: {
  isOwner: boolean;
  isDefaultFree: boolean;
  provider: string | null;
  providerSubscriptionId: string | null;
  cancellationRequestedAt: string | null;
}): { allowed: boolean; reason: string } {
  if (!input.isOwner) return { allowed: false, reason: "owner_required" };
  if (input.isDefaultFree) return { allowed: false, reason: "free_plan_not_cancelable" };
  if (input.provider !== "cakto" || !input.providerSubscriptionId) {
    return { allowed: false, reason: "subscription_not_cancelable" };
  }
  if (input.cancellationRequestedAt) return { allowed: false, reason: "cancellation_already_requested" };
  return { allowed: true, reason: "cancelable" };
}
