# Atomicidade da criação de solicitações

## Causa raiz

`create-quote-request` criava o registro, movia o arquivo, registrava a imagem e criava notificações em etapas independentes. Falhas intermediárias deixavam dados ou arquivos parciais.

## Estratégia

Como Storage e PostgreSQL não compartilham uma transação SQL única, a Edge Function agora utiliza uma rotina compensatória idempotente. Em qualquer falha após a criação da solicitação, ela remove notificações, registros de imagens, arquivos envolvidos no Storage e a própria solicitação antes de responder o erro.

O fluxo de sucesso permanece inalterado: criação, movimentação, registro da imagem, distribuição via PostGIS/RPC e Realtime continuam usando a infraestrutura existente.

## Limite operacional

A limpeza é executada no mesmo request e usa `service_role` exclusivamente dentro da Edge Function. Falhas catastróficas de infraestrutura após a resposta da função exigem monitoramento/reconciliação posterior, mas todos os caminhos de erro síncronos agora executam rollback compensatório.
