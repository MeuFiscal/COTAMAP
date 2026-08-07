# Push Notifications

## Auditoria

O projeto já possui `notification_center`, `push_devices`, RLS por usuário, Realtime para a central e a Edge Function `create-notification`. Não foram criadas tabelas, migrations ou funções duplicadas.

## Camada de abstração

`src/services/push/push-service.ts` define o contrato `PushProvider` e um adaptador Web. O registro utiliza `upsert` por `profile_id + token`, atualiza `last_seen_at` e desativa dispositivos no logout. Android, iOS, FCM, APNs, Expo ou OneSignal podem implementar o mesmo contrato sem alterar a central de notificações.

## Limitação atual

Não há VAPID/public key Web Push nem Edge Function de envio (`send-push`/`broadcast-push`) publicada no backend auditado. Portanto, o frontend não envia Push diretamente e não inventa tokens. O bootstrap solicita permissão e permanece pronto para registrar o token quando um provider configurado for disponibilizado. A geração de notificações continua obrigatoriamente passando por `notification_center` e `create-notification`.
