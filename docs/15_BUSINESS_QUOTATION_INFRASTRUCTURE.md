# Infraestrutura de resposta da autopeça

## Storage

`quotation-images` é privado. O caminho começa com o `business_id`; upload, leitura e remoção só são permitidos quando o JWT pertence a um membro ativo da empresa.

## Resposta transacional

`respond-quotation` valida o JWT e encaminha a operação para `responder_cotacao`.

- `reject`: marca a notificação como rejeitada e chama `promover_proxima_empresa` na mesma transação.
- `accept`: valida a janela de sete minutos, cria `quotations`, registra `quotation_images`, marca a notificação como respondida e atualiza a solicitação.

O arquivo é movido para o caminho definitivo antes da transação. Se a operação SQL falhar, a Edge Function remove o objeto definitivo para evitar arquivo órfão.

## Segurança

O frontend nunca recebe `service_role`. A RPC só pode ser executada pelo papel `service_role`; a validação de vínculo empresa/funcionário ocorre novamente no banco antes de qualquer escrita.
