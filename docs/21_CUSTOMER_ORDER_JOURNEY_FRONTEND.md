# Jornada do cliente

O frontend agora consome cotações, imagens, empresas e pedidos reais do Supabase. A tela `/cotacoes` possui pesquisa e ordenação; `/cotacoes/[id]` apresenta os detalhes e invoca exclusivamente `choose-quotation`; `/pedido/[id]` acompanha o pedido criado.

As assinaturas Realtime em `quotations` e `orders` invalidam o cache React Query automaticamente, sem polling. O dashboard do cliente lista pedidos reais e informa estados vazios e erros sem dados simulados.

As escritas de escolha nunca ocorrem diretamente nas tabelas: a navegação para o pedido usa apenas a Edge Function `choose-quotation`. Dados de empresa, logo e avaliação são exibidos somente quando retornados pelas policies existentes; quando não disponíveis, a interface informa a ausência sem inventar valores.
