begin;

-- O service_role continua sujeito ao escopo das Edge Functions; estes grants
-- somente habilitam as operações que já são encapsuladas pelas RPCs/functions.
grant select, insert on table public.quote_requests to service_role;
grant select, insert, update on table public.quote_notifications to service_role;
grant select, insert on table public.quote_request_images to service_role;

commit;
