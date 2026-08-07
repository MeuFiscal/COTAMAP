# Frontend da Central de Notificações

`/notificacoes` agora consome exclusivamente `notification_center`, com filtros por tipo, agrupamento por data, contador real no sino, Realtime e ações de leitura/exclusão lógica via RPCs existentes. Links de entidade só são exibidos para tipos conhecidos (`order` e `quotation`).

O hook React Query mantém a lista e o contador sincronizados com a publicação Realtime. Push não é solicitado nesta etapa, conforme escopo; `push_devices` permanece apenas como infraestrutura preparada.
