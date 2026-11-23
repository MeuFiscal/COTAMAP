import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import BusinessCallsPage from "@/app/empresa/chamados/page";
import { BusinessShell } from "@/features/business/components/business-shell";

type Row = Record<string, string | null>;
let notifications: Row[], requests: Row[];
let operatorId: string | null, userId: string | null;
const setBusiness = vi.fn(), router = { replace: vi.fn(), push: vi.fn() };
const tones = vi.fn(), disconnect = vi.fn();
const channels = new Map<string, ReturnType<typeof makeChannel>>();

function makeChannel(name: string) {
  const handlers: { event: string; table: string; fn: (payload: unknown) => void }[] = [];
  const channel = {
    handlers,
    status: vi.fn<(status: string) => void>(),
    on(_: string, filter: { event: string; table: string }, fn: (payload: unknown) => void) {
      handlers.push({ ...filter, fn });
      return channel;
    },
    subscribe(fn?: (status: string) => void) {
      if (fn) channel.status.mockImplementation(fn);
      return channel;
    },
    name,
  };
  return channel;
}
const business = { id: "shop" };
vi.mock("@/features/business/context/operator-context", () => ({
  useOperator: () => ({ ready: true, operator: operatorId && { id: operatorId, businessId: "shop" }, business, setBusiness }),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ session: userId && { user: { id: userId } } }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/empresa/dashboard", useRouter: () => router }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
vi.mock("@/features/auth/components/private-shell", () => ({ PrivateShell: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/business-logo", () => ({ BusinessLogo: () => null }));
vi.mock("@/services/business/business-service", async importOriginal => ({
  ...await importOriginal<typeof import("@/services/business/business-service")>(),
  updateEmployeePresence: async () => {}, respondToQuotation: async () => {},
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({
  auth: { getSession: async () => ({ data: { session: userId && { user: { id: userId } } } }) },
  channel(name: string) { const channel = makeChannel(name); channels.set(name, channel); return channel; },
  removeChannel(channel: { name: string }) { channels.delete(channel.name); },
  from(table: string) {
    let rows: Row[] = [];
    if (table === "quote_notifications") rows = [...notifications];
    if (table === "quote_requests") rows = [...requests];
    if (table === "business_employees") rows = [{ business_id: "shop", profile_id: "user", deleted_at: null, is_active: "true" }];
    const chain = {
      select: () => chain, order: () => chain,
      eq(key: string, value: string) { rows = rows.filter(row => row[key] === String(value)); return chain; },
      in(key: string, values: string[]) { rows = rows.filter(row => values.includes(String(row[key]))); return chain; },
      is(key: string, value: null) { rows = rows.filter(row => row[key] === value); return chain; },
      limit(count: number) { rows = rows.slice(0, count); return chain; },
      then(resolve: (response: { data: Row[]; error: null }) => unknown) { return Promise.resolve(resolve({ data: rows, error: null })); },
      gt(key: string, value: string) { rows = rows.filter(row => String(row[key]) > value); return chain; },
      or(filter: string) {
        const cutoff = filter.split("expires_at.gt.")[1];
        rows = rows.filter(row => row.expires_at === null || String(row.expires_at) > cutoff);
        return chain;
      },
      abortSignal: async () => ({ data: rows, error: null }),
      maybeSingle: async () => ({ data: null }),
    };
    return chain;
  },
}) }));

function add(id: string, expiry = Date.now() + 60000) {
  const expires_at = new Date(expiry).toISOString();
  notifications.push({ id, business_id: "shop", quote_request_id: id, status: "pending", expires_at, deleted_at: null });
  requests.push({ id, part_name: "Peça " + id, status: "waiting", expires_at, deleted_at: null });
}
function alerts() { return [...channels.values()].filter(c => c.name.startsWith("business-call-alerts-")); }
function emit(table: string, event: string) {
  act(() => { for (const h of alerts()[0].handlers) if (h.table === table && event === h.event) h.fn({ new: {} }); });
}
function mount(content?: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = () => <QueryClientProvider client={client}>{content ?? <BusinessShell>Solicitações</BusinessShell>}</QueryClientProvider>;
  const view = render(page());
  return { ...view, update: () => view.rerender(page()) };
}
beforeEach(() => {
  notifications = []; requests = []; userId = "user"; operatorId = "one"; sessionStorage.clear();
  vi.clearAllMocks();
  window.AudioContext = class {
    state = "running"; currentTime = 0;
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect }; }
    createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, start: tones, stop() {} }; }
  } as unknown as typeof AudioContext;
});
afterEach(() => { cleanup(); expect(alerts()).toHaveLength(0); vi.restoreAllMocks(); });

it("recupera dois chamados e mantém um único loop; abrir sobrevive à navegação e à recarga sem remover a solicitação", async () => {
  const intervals = vi.spyOn(globalThis, "setInterval");
  const view = mount();
  add("first"); add("second");
  emit("quote_notifications", "INSERT");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("2 na fila")).toBeTruthy();
  expect(intervals.mock.calls.filter(([, ms]) => ms === 2200)).toHaveLength(1);
  expect(tones).toHaveBeenCalledTimes(3);
  const open = within(dialog).getByRole("link");
  expect(open.getAttribute("href")).toBe("/empresa/chamados/first");
  open.addEventListener("click", e => e.preventDefault());
  fireEvent.click(open);
  expect(within(dialog).getByRole("link").getAttribute("href")).toBe("/empresa/chamados/second");
  view.unmount();
  expect(disconnect).toHaveBeenCalled();
  mount();
  const restored = await screen.findByRole("dialog");
  expect(within(restored).getByRole("link").getAttribute("href")).toBe("/empresa/chamados/second");
  expect(notifications.every(row => row.status === "pending")).toBe(true);
});

it("mantém solicitação elegível após UPDATE e remove a respondida na reconexão", async () => {
  add("one"); mount(); await screen.findByRole("dialog");
  emit("quote_requests", "UPDATE");
  expect(await screen.findByRole("dialog")).toBeTruthy();
  notifications[0].status = "responded";
  act(() => alerts()[0].status("SUBSCRIBED"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(disconnect).toHaveBeenCalled();
});

it("descarta expirados e encerrados; silencia no vencimento sem evento Realtime", async () => {
  add("expired", Date.now() - 100); add("cancelled"); requests[1].status = "cancelled";
  add("live", Date.now() + 600);
  mount();
  expect(within(await screen.findByRole("dialog")).getByRole("link").getAttribute("href")).toBe("/empresa/chamados/live");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 2000 });
  expect(disconnect).toHaveBeenCalled();
});

it("troca de operador e logout desativam a fila anterior, o áudio e a inscrição", async () => {
  add("call"); const view = mount(); await screen.findByRole("dialog");
  operatorId = null; view.update();
  expect(screen.queryByRole("dialog")).toBeNull(); expect(alerts()).toHaveLength(0);
  operatorId = "two"; view.update(); await screen.findByRole("dialog");
  userId = null; view.update();
  expect(screen.queryByRole("dialog")).toBeNull(); expect(alerts()).toHaveLength(0);
  expect(disconnect).toHaveBeenCalled();
});

it("a lista real recupera o chamado já aberto e outro pendente ao voltar ou atualizar a página", async () => {
  add("farol"); add("roda");
  const initial = mount();
  const open = within(await screen.findByRole("dialog")).getByRole("link");
  open.addEventListener("click", e => e.preventDefault());
  fireEvent.click(open);
  initial.unmount();
  for (let visit = 0; visit < 2; visit++) {
    const view = mount(<BusinessCallsPage />);
    expect(await screen.findByRole("link", { name: /Peça farol/ })).toBeTruthy();
    expect(await screen.findByRole("link", { name: /Peça roda/ })).toBeTruthy();
    const popup = await screen.findByRole("dialog");
    expect(within(popup).getByRole("link").getAttribute("href")).toBe("/empresa/chamados/roda");
    view.unmount();
  }
});
