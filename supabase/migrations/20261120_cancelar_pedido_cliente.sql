-- ============================================================
-- RPC: cancelar_pedido_cliente
-- Data: 2026-11-20
-- Escopo: Cliente cancela seu próprio pedido pendente
-- Regra: pending → cancelled (única transição permitida)
-- Segurança: SECURITY DEFINER, search_path='', FOR UPDATE
-- Transação única: criação + privilégios atômicos
--
-- VERIFICAÇÃO PRÉVIA (execute separadamente antes deste SQL):
-- SELECT proname FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'cancelar_pedido_cliente';
-- Se retornar 0 linhas → função NÃO existe → prossiga.
-- Se retornar 1+ linhas → PARE, a função já existe.
--
-- PLANO DE REVERSÃO:
-- DROP FUNCTION IF EXISTS public.cancelar_pedido_cliente(uuid);
-- ============================================================

BEGIN;

CREATE FUNCTION public.cancelar_pedido_cliente(
    target_order_id uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid           uuid;
    current_order   public.orders;
    quotation_row   public.quotations;
    request_row     public.quote_requests;
BEGIN
    -- 1. Validar autenticação explicitamente
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'unauthenticated_user';
    END IF;

    -- 2. Lock atômico do pedido (previne race condition com lojista)
    SELECT * INTO current_order
    FROM public.orders
    WHERE id = target_order_id
      AND deleted_at IS NULL
    FOR UPDATE;

    IF current_order.id IS NULL THEN
        RAISE EXCEPTION 'order_not_found';
    END IF;

    -- 3. Apenas pedidos pendentes podem ser cancelados pelo cliente
    IF current_order.status != 'pending'::public.order_status THEN
        RAISE EXCEPTION 'invalid_order_transition';
    END IF;

    -- 4. Verificar cadeia de propriedade: order → quotation → quote_request → customer
    SELECT * INTO quotation_row
    FROM public.quotations
    WHERE id = current_order.quotation_id
      AND deleted_at IS NULL;

    IF quotation_row.id IS NULL THEN
        RAISE EXCEPTION 'quotation_not_found';
    END IF;

    SELECT * INTO request_row
    FROM public.quote_requests
    WHERE id = quotation_row.quote_request_id
      AND deleted_at IS NULL;

    IF request_row.id IS NULL THEN
        RAISE EXCEPTION 'request_not_found';
    END IF;

    -- 5. Validar que o caller autenticado é o proprietário do pedido
    IF request_row.customer_id != v_uid THEN
        RAISE EXCEPTION 'not_order_owner';
    END IF;

    -- 6. Atualizar status atomicamente
    UPDATE public.orders
    SET status = 'cancelled'::public.order_status,
        updated_at = now()
    WHERE id = target_order_id
    RETURNING * INTO current_order;

    -- 7. Registrar auditoria (mesma transação = atômico)
    INSERT INTO public.audit_logs (
        actor_profile_id, entity_type, entity_id, action, created_at
    ) VALUES (
        v_uid,
        'order',
        target_order_id,
        'customer_cancelled',
        now()
    );

    RETURN current_order;
END;
$$;

-- 8. Privilégios mínimos: revogar TODOS primeiro, conceder apenas ao authenticated
REVOKE ALL ON FUNCTION public.cancelar_pedido_cliente(uuid)
    FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_pedido_cliente(uuid)
    TO authenticated;

COMMIT;
