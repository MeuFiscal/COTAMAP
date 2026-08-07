import type { QuoteNotificationRow, QuoteRequestRow } from "@/types/database";

export type BusinessCall = {
  notification: QuoteNotificationRow;
  request: QuoteRequestRow;
};
