# Regras de Negócio

## Regras confirmadas

1. O cliente cria um pedido de cotação de autopeça.
2. Lojas próximas recebem uma notificação sobre a solicitação.
3. No máximo cinco lojas enviam cotações para um pedido.
4. O cliente pode escolher uma das cotações recebidas.
5. WhatsApp e Google Maps são liberados somente após a escolha.
6. As lojas não cadastram estoque na plataforma.
7. As solicitações e respostas acontecem em tempo real.

## Escopo e linguagem do domínio

- O produto inicial permanece exclusivamente direcionado ao mercado de autopeças.
- A arquitetura interna será genérica para permitir evolução futura sem alterar o foco
  atual do produto.
- O termo canônico interno para uma empresa será `business`, nunca `store`.
- Identificadores de empresa usarão `business_id`, nunca `store_id`.
- Coleções de empresas usarão `businesses`, nunca `stores`.

Os termos “loja” e “empresa” podem continuar sendo usados na comunicação com usuários do
segmento de autopeças; a padronização acima se aplica à linguagem interna do sistema.

## Perfis previstos

A arquitetura deverá suportar futuramente os seguintes perfis, sem implementar nesta
etapa autenticação, autorização ou permissões:

- `Owner`: proprietário da empresa.
- `Manager`: gerente da empresa.
- `Employee`: funcionário da empresa.
- `Customer`: cliente que solicita cotações.
- `Admin`: administrador da plataforma CotaMap.

As permissões exatas de cada perfil permanecem pendentes de definição.

## Empresas e funcionários

Uma empresa poderá possuir vários usuários vinculados. A relação arquitetural prevista é:

`Business` → `Employees` → `Notifications` → `Quotes`

Uma empresa também poderá possuir futuramente logo, foto da fachada, banner, WhatsApp,
Instagram, website, horário, localização, funcionários e avaliações. Esses elementos são
apenas capacidades previstas; seus campos, regras e formas de armazenamento ainda não
foram definidos.

## Decisões pendentes

As questões abaixo devem ser definidas antes da implementação e não podem ser inferidas
automaticamente:

- Critério e raio usados para determinar lojas próximas.
- Ordem de elegibilidade quando houver mais de cinco lojas interessadas.
- Prazo de validade e condições de cancelamento de pedidos e cotações.
- Campos obrigatórios de pedido, item e proposta.
- Tratamento de indisponibilidade parcial de itens.
- Regras de reputação, moderação, fraude e bloqueio.
- Modelo de receita, cobrança e planos.
- Política de privacidade, retenção de dados e consentimento.
- Canais e regras de notificação.
- Regras de vínculo, convite, desligamento e atuação de funcionários em uma empresa.
- Permissões específicas dos perfis `Owner`, `Manager`, `Employee`, `Customer` e `Admin`.

## Restrição desta etapa

Este documento registra somente regras fornecidas e perguntas em aberto. Não contém
fluxos completos, algoritmos, validações ou modelos de banco de dados.
