# Operação multiusuário da empresa

O painel agora prevê seleção de operador após o login empresarial em `/empresa/operador`. A lista é carregada de `business_employees`; o PIN é validado exclusivamente pela função `verify_employee_pin`, que compara o valor com o hash armazenado no banco. O PIN nunca é persistido no navegador ou em texto puro.

A migration incremental `20260809000000_operator_presence.sql` adiciona apenas hash do PIN, último acesso, última atividade e presença (`online`, `away`, `offline`). Ela não altera tabelas existentes fora desses campos nem modifica Edge Functions, RLS ou Realtime.

O operador selecionado é mantido somente na sessão do navegador para troca rápida. O painel continua consumindo chamados, cotações e Realtime pelas integrações já existentes; a concorrência de respostas permanece sob responsabilidade de `respond-quotation`.

Para ativação em produção, Owner/Manager devem cadastrar hashes de PIN para os funcionários. Sem PIN configurado, a seleção é recusada de forma segura.
