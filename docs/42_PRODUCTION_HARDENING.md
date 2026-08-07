# Hardening de produção

Foi auditado CORS, timers, consultas `select(*)`, React Query, Edge Functions, dependências e build. O único CORS wildcard encontrado estava em `create-quote-request` e foi substituído por origem configurável (`APP_ORIGIN`) com métodos explícitos. As demais Edge Functions não expõem cabeçalhos CORS próprios.

TypeScript, ESLint e build foram executados. `npm audit` depende de acesso ao registry npm; caso a rede esteja indisponível, deve ser executado novamente em CI antes do lançamento.
