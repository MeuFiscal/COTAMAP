# Integração frontend/backend — Prompt 09B

O fluxo de cotações agora usa exclusivamente o Supabase.

## Solicitação

`QuoteForm` obtém a localização do navegador, envia a imagem para o bucket privado `quote-request-images` em um caminho temporário e chama `create-quote-request`. A Edge Function cria o registro, move a imagem para o caminho definitivo e cria o registro em `quote_request_images`.

## Busca em tempo real

`useQuoteSearch` consulta `quote_requests` e `quote_notifications`, mantém apenas uma assinatura Realtime por solicitação e cancela o canal ao desmontar. O tempo restante é calculado a partir de `expires_at`; não há polling, lista mockada ou atraso artificial.

## Cotações

`QuoteList` consulta `quotations` pela solicitação e preserva os filtros de ordenação. Quando não há respostas, apresenta estado vazio real. Nenhum preço, empresa, logo ou avaliação fictícia é inserido.

## Cache e estados

O `QueryProvider` centraliza React Query com cache curto e retry limitado. Loading, erro, solicitação ausente, expiração e ausência de empresas são estados derivados dos dados reais.
