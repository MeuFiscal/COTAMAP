# Infraestrutura backend do CotaMap

## Escopo

Esta etapa adiciona somente a infraestrutura necessária para solicitações reais. A autenticação, o RLS existente e as migrations anteriores permanecem inalterados.

## Solicitações

`quote_requests` recebeu campos estruturados para peça, veículo, observação e categoria. O campo `description` continua preenchido como resumo compatível com o modelo anterior.

`quote_notifications` recebeu estado, ordem de disparo, distância, expiração e horário de resposta. O limite operacional inicial é de cinco notificações pendentes.

## Storage

O bucket privado `quote-request-images` usa caminhos iniciados pelo UUID do perfil. Usuários autenticados podem enviar e remover somente objetos da própria pasta. A leitura exige propriedade da solicitação ou autorização já prevista no módulo de segurança.

## RPCs

- `buscar_empresas_por_raio`: usa `ST_DWithin`, distância geográfica e o índice GiST de `businesses.location`.
- `criar_notificacoes`: seleciona as cinco empresas elegíveis mais próximas e registra a ordem, distância e expiração.
- `promover_proxima_empresa`: promove a próxima empresa não notificada quando há vaga entre as cinco pendentes.
- `expirar_solicitacao`: encerra a solicitação e marca notificações pendentes como expiradas.

As RPCs privilegiadas não são concedidas a `anon`. A busca geográfica e as mutações de distribuição ficam restritas ao `service_role`; criação/expiração autenticada respeita o proprietário da solicitação.

## Edge Functions

- `create-quote-request`: valida o JWT, cria a solicitação e chama a distribuição inicial.
- `expire-quote-request`: encerra uma solicitação por ID.
- `promote-next-business`: promove a próxima empresa elegível.

As funções usam `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente Edge. Essa chave não é enviada ao navegador.

## Realtime

As tabelas `quote_requests`, `quote_notifications`, `quotations` e `orders` foram adicionadas à publicação `supabase_realtime` com `REPLICA IDENTITY FULL` para permitir atualizações incrementais no cliente.

## Validação

A migration é idempotente para colunas, índices, bucket, policies, funções e publicação. Após a aplicação, deve-se confirmar o histórico remoto sem migrations pendentes, a existência do bucket, as tabelas na publicação e a execução das RPCs com dados de teste controlados.
