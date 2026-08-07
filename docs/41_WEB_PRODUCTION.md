# Produção Web, PWA e Firebase

## Auditoria

Firebase/Analytics continuam com inicialização única e SSR-safe por variáveis de ambiente. `notification_center`, `push_devices` e `PushProvider` não foram alterados; Push real e registro de tokens permanecem desativados.

## PWA

Foi adicionado `manifest.webmanifest`, ícones SVG, rota `/offline` e `sw.js`. O Service Worker só intercepta requisições GET públicas do mesmo domínio. Não armazena respostas autenticadas, `/api` ou `/auth`, nem interfere nas chamadas Supabase.

O registro ocorre somente em produção e apenas no navegador. A ativação de Messaging/Push exige provider e infraestrutura backend futuros, sem mudanças no restante da aplicação.
