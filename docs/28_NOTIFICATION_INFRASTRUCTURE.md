# Infraestrutura de notificações

`notification_logs` foi mantido para entrega de notificações de cotação. A auditoria mostrou que ele não possui destinatário, título, mensagem, leitura ou exclusão lógica, por isso não pode ser reutilizado como Central.

Foi criada a menor infraestrutura complementar: `notification_center`, para notificações persistentes por usuário, e `push_devices`, para preparar tokens de dispositivos. Ambas possuem RLS por usuário, índices e Realtime em `notification_center`.

A Edge Function `create-notification` cria notificações com JWT e `service_role` somente no ambiente Edge, registra auditoria e marca o envio Realtime. As funções SQL `mark_notification_read`, `mark_all_notifications_read` e `delete_notification` restringem operações ao destinatário autenticado.

Push ainda não é enviado: não há provedor, Service Worker ou credenciais de Push configurados. O registro de dispositivos está preparado para uma etapa posterior segura.
