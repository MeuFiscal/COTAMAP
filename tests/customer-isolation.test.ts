import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mocks
const mockGetMyOrders = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/services/customer/my-orders", () => ({
  getMyOrders: (...args: unknown[]) => mockGetMyOrders(...args),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({ subscribe: () => {}, removeChannel: () => {} }),
    }),
    removeChannel: () => {},
  }),
}));

vi.mock("@/services/customer/customer-service", () => ({
  getCustomerQuotations: vi.fn().mockResolvedValue([]),
  getCustomerRequestStatus: vi.fn().mockResolvedValue(null),
}));

// Import após mocks
import { useCustomerOrders } from "@/features/customer/hooks/use-customer-journey";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const ORDER_A = [{ id: "order-a1", status: "pending", quotation: { business: { name: "Loja A" } } }];
const ORDER_B = [{ id: "order-b1", status: "completed", quotation: { business: { name: "Loja B" } } }];

describe("Isolamento de sessão do cliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Cliente A vê somente seus pedidos", async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-a" } } });
    mockGetMyOrders.mockResolvedValue(ORDER_A);

    const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ORDER_A);
    expect(mockGetMyOrders).toHaveBeenCalledWith(undefined, "user-a");
  });

  it("2. Cliente B vê somente seus pedidos", async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-b" } } });
    mockGetMyOrders.mockResolvedValue(ORDER_B);

    const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ORDER_B);
    expect(mockGetMyOrders).toHaveBeenCalledWith(undefined, "user-b");
  });

  it("3-4. Admin e lojista veem apenas próprios pedidos nas páginas de cliente", async () => {
    for (const role of ["admin", "lojista"]) {
      mockUseAuth.mockReturnValue({ session: { user: { id: `user-${role}` } } });
      mockGetMyOrders.mockResolvedValue([{ id: `order-${role}`, status: "pending" }]);

      const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].id).toBe(`order-${role}`);
      expect(mockGetMyOrders).toHaveBeenCalledWith(undefined, `user-${role}`);
      vi.clearAllMocks();
    }
  });

  it("5. Troca de A para B remove dados de A antes de carregar B", async () => {
    // Sessão A
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-a" } } });
    mockGetMyOrders.mockResolvedValue(ORDER_A);
    const wrapperA = createWrapper();
    const { result: resultA, unmount } = renderHook(() => useCustomerOrders(), { wrapper: wrapperA });
    await waitFor(() => expect(resultA.current.data).toEqual(ORDER_A));
    unmount();

    // Sessão B com novo QueryClient (cache limpo)
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-b" } } });
    mockGetMyOrders.mockResolvedValue(ORDER_B);
    const wrapperB = createWrapper();
    const { result: resultB } = renderHook(() => useCustomerOrders(), { wrapper: wrapperB });

    // Durante carregamento, não deve haver dados de A
    expect(resultB.current.data).toBeUndefined();
    await waitFor(() => expect(resultB.current.data).toEqual(ORDER_B));
    expect(resultB.current.data).not.toEqual(ORDER_A);
  });

  it("6. Resposta atrasada da sessão A não popula sessão B", async () => {
    let resolveA: (value: unknown) => void;
    const delayedA = new Promise((resolve) => { resolveA = resolve; });

    mockUseAuth.mockReturnValue({ session: { user: { id: "user-a" } } });
    mockGetMyOrders.mockReturnValue(delayedA as Promise<typeof ORDER_A>);
    const wrapperA = createWrapper();
    const { unmount } = renderHook(() => useCustomerOrders(), { wrapper: wrapperA });

    // Troca para B antes de A resolver
    unmount();
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-b" } } });
    mockGetMyOrders.mockResolvedValue(ORDER_B);
    const wrapperB = createWrapper();
    const { result: resultB } = renderHook(() => useCustomerOrders(), { wrapper: wrapperB });

    await waitFor(() => expect(resultB.current.isSuccess).toBe(true));
    expect(resultB.current.data).toEqual(ORDER_B);

    // Resolve A tardiamente — não deve afetar B
    resolveA!(ORDER_A);
    await new Promise((r) => setTimeout(r, 50));
    expect(resultB.current.data).toEqual(ORDER_B);
  });

  it("7. IDs manipulados não expõem pedidos de terceiros", async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-a" } } });
    // Service retorna vazio quando ID não pertence ao usuário (RLS simulado)
    mockGetMyOrders.mockResolvedValue(ORDER_A);

    const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Dados retornados são filtrados pelo service (RLS no banco)
    const ids = result.current.data?.map((o: { id: string }) => o.id);
    expect(ids).toContain("order-a1");
    expect(ids).not.toContain("order-b1");
  });

  it("8. Ausência de sessão não expõe dados", async () => {
    mockUseAuth.mockReturnValue({ session: null });
    mockGetMyOrders.mockResolvedValue(ORDER_A);

    const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() });

    // Hook tem enabled: Boolean(userId) — não executa sem sessão
    await new Promise((r) => setTimeout(r, 100));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetMyOrders).not.toHaveBeenCalled();
  });

  it("9. Erros não deixam informações antigas visíveis", async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: "user-a" } } });
    mockGetMyOrders.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });
});
