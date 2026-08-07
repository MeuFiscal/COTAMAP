# Hardening final da versão 1.0

## SaaS

O limite diário não depende mais de valor fixo. A trigger lê o plano ativo e `daily_quote_limit` dentro da mesma transação de criação da notificação. A linha de uso diário continua bloqueada com `FOR UPDATE`, preservando concorrência e rollback.

## Autorização

O envio administrativo de notificações e o redirecionamento após login usam `platform_admins.active`. `profiles.role` permanece como dado de domínio e não concede privilégio administrativo.

## Funcionários

A criação de funcionário agora possui compensação: se profile, PIN, vínculo ou auditoria falharem depois da criação no Auth, o usuário recém-criado é removido pelo backend. Nenhuma chave privilegiada chega ao navegador.

## Consultas

Listagens de chamadas, pedidos, cotações e central de notificações receberam limites explícitos para impedir carregamento ilimitado no cliente. Uma evolução futura pode adicionar paginação de interface sem alterar os contratos atuais.

## Validação externa

`npm audit` deve ser executado em CI ou ambiente com acesso ao registry npm. A auditoria local pode ficar indisponível por restrição de rede.
