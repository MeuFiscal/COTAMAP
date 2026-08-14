# Histórico de migrations do CotaMap

O projeto Supabase de produção é a fonte de verdade para o estado atual do
schema.

A migration remota `20260813140251_fix_cancel_quote_request_status_sync` existe
no histórico remoto, mas seu SQL original não está disponível localmente. Não
crie um arquivo SQL fictício para essa versão e não execute `migration repair`
nela sem uma necessidade futura comprovada.

`20260826000000_cancel_quote_request.sql` é uma migration histórica já
aplicada. A implementação atual de `public.cancel_quote_request` em produção é
mais recente/diferente do conteúdo histórico desse arquivo. Nunca edite ou
reexecute essa migration para tentar sincronizar produção. Qualquer alteração
futura nessa função deve ser feita por uma nova migration.

Migrations aplicadas nunca devem ser reescritas.

Antes de qualquer alteração de banco:

1. Execute `supabase migration list`.
2. Confirme que nenhuma migration histórica aparece como pendente.
3. Crie uma nova migration com timestamp único.
4. Revise o SQL.
5. Versione a migration.
6. Somente depois aplique-a mediante autorização.
