# Infraestrutura administrativa de funcionários

Foram publicadas seis Edge Functions administrativas, todas com validação JWT padrão do Supabase e uso de `service_role` somente no ambiente Edge:

- `create-business-employee`: valida Owner/Manager, cria usuário Auth, atualiza o profile, gera hash do PIN, cria vínculo e auditoria.
- `update-business-employee`: atualiza dados permitidos e registra auditoria.
- `change-business-pin`: valida o PIN atual e substitui o hash.
- `reset-business-pin`: Owner/Manager gera PIN temporário e registra o reset.
- `remove-business-employee`: desativa o vínculo sem apagar histórico.
- `update-employee-presence`: atualiza presença e timestamps do próprio funcionário autenticado.

A migration `20260809010000_employee_admin_support.sql` adiciona somente `pin_requires_change` e as funções SQL internas para hash/verificação de PIN. As migrations, policies, RLS e Edge Functions anteriores não foram editadas.

Todas as mutações administrativas validam a empresa no backend. Auditorias usam `audit_logs`, registrando ator, empresa, funcionário afetado, operação e metadados disponíveis. O IP pode ser acrescentado posteriormente quando o gateway fornecer esse valor ao runtime da função.
