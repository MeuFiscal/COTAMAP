# 12 — Tela de Cotações

## Objetivo

A rota `/cotacoes` apresenta cinco propostas simuladas em um ambiente de comparação rápida. A experiência prioriza preço, distância, reputação e retirada, sem executar qualquer consulta, escolha ou persistência real.

## Componentes

- `QuoteCard`: cartão completo da proposta, ações, favorito local e expansão.
- `QuoteFilters`: filtros rápidos com seleção única e operação por teclado.
- `BusinessBadge`: logo simulada, nome, avaliação e Índice CotaMap.
- `PriceHighlight`: formatação monetária consistente em real brasileiro.
- `Rating`: avaliação acessível, com quantidade de avaliações.
- `QuoteList`: ordenação, favoritos e animação de reposicionamento.
- `QuoteDetails`: descrição, endereço, horário e pagamentos.
- `EmptyQuotes`: estados vazio e de erro com recuperação.
- `QuotesLoading`: esqueleto visual da lista em carregamento.

## Dados simulados

As propostas são definidas em `quote-data.ts` e possuem:

- empresa e iniciais utilizadas como logo;
- avaliação e Índice CotaMap;
- preço, marca e observação;
- distância, retirada e tempo de resposta;
- disponibilidade: pronta, separando ou sob encomenda;
- descrição, endereço, horário e formas de pagamento.

Não há leitura ou gravação no banco.

## Ordenação

Os filtros reorganizam imediatamente a lista por:

1. menor preço;
2. menor distância;
3. melhor avaliação;
4. menor tempo estimado de retirada.

A ordenação usa uma cópia imutável da coleção simulada. Os cartões preservam sua identidade durante a animação por meio de IDs estáveis.

## Interações

- “Escolher esta cotação” apresenta somente uma confirmação visual local.
- Favoritar empresa mantém a seleção apenas enquanto o componente está montado.
- “Ver detalhes” expande o conteúdo dentro do cartão.
- Nenhuma ação libera WhatsApp, Maps ou cria pedido.

## Estados

O estado padrão mostra cinco propostas. Para inspeção isolada:

- `/cotacoes?state=loading`: carregamento;
- `/cotacoes?state=empty`: lista vazia;
- `/cotacoes?state=error`: erro simulado.

Esses parâmetros são apenas ferramentas de demonstração frontend.

## Responsividade

- Mobile: cartões em coluna, filtros horizontais com snap e ações empilhadas.
- Tablet: métricas compactas, detalhes em duas colunas e filtros flexíveis.
- Desktop: grade de duas colunas para comparação e filtros fixos durante a rolagem.

## Acessibilidade

- Filtros e favoritos expõem seleção com `aria-pressed`.
- Detalhes informam expansão com `aria-expanded`.
- Avaliações possuem descrição textual completa.
- Imagens possuem textos alternativos.
- Estados de carregamento usam `role="status"`.
- Todos os controles são acessíveis por teclado e mantêm foco visível.

## Fora do escopo

As cotações são consultadas de `quotations` no Supabase, sem dados demonstrativos. Integrações de contato, pagamentos e seleção definitiva continuam fora deste escopo.
