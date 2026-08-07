# Operação de pedidos

O painel empresarial agora possui `/empresa/pedidos` e `/empresa/pedidos/[id]`, consumindo pedidos reais associados às cotações da empresa. Os pedidos são organizados por status e atualizados por Realtime, sem polling. O cliente continua acompanhando `/pedido/[id]` pela mesma assinatura Realtime.

Não existe no backend atual uma Edge Function segura para transicionar `orders.status`. Por isso, esta etapa implementa visualização, histórico, filtros estruturais, detalhes e estados vazios, mas não cria botões que gravem diretamente no banco. A alteração de `pending` para `preparing`, `ready` e `completed` requer uma futura função administrativa transacional, conforme a regra deste prompt.
