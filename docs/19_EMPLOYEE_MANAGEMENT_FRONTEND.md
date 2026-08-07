# Frontend de gestão de funcionários

Rotas implementadas:

- `/empresa/funcionarios`: listagem com pesquisa, filtros, presença, último acesso, reset de PIN e remoção de vínculo.
- `/empresa/funcionarios/novo`: formulário React Hook Form + Zod que invoca `create-business-employee`.
- `/empresa/funcionarios/[id]`: edição de dados e status via `update-business-employee`.

As mutações usam exclusivamente as Edge Functions administrativas existentes: `create-business-employee`, `update-business-employee`, `reset-business-pin` e `remove-business-employee`. O PIN temporário é mantido apenas no estado da tela e desaparece ao ser ocultado.

Consultas usam React Query e dados reais de `business_employees`/`profiles`. Quando não há registros, a interface informa o estado vazio sem dados fictícios. A presença é exibida a partir de `presence_status`, `last_access_at` e `last_activity_at`.

Limitação documentada: as policies atuais podem restringir a leitura de perfis de outros funcionários; nesses casos a interface usa o identificador do vínculo até que uma policy de leitura administrativa seja autorizada em etapa própria.
