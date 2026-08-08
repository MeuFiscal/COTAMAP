# Distribuição V2

## Arquitetura

A distribuição continua sendo executada no Supabase com PostgreSQL e PostGIS. A solicitação fornece latitude, longitude, categoria e raio. A RPC `buscar_empresas_inteligente` expande a busca a partir do raio configurado até o máximo configurado, filtra empresas ativas, localizadas, com operador online e em horário de funcionamento, e ordena por score.

## Score

O score persistido em `distribution_settings` combina distância, tempo médio de resposta, taxa de aceitação, operadores online, balanceamento de carga diária e reputação auxiliar. Os pesos somam 100% e podem ser alterados administrativamente sem modificar código.

## Distribuição

`criar_notificacoes` seleciona inicialmente a quantidade configurada de empresas. `promover_proxima_empresa` mantém o limite de notificações pendentes e promove a próxima empresa elegível quando uma resposta é recusada, ignorada ou expira.

## Índices

O algoritmo utiliza o índice GiST existente em `businesses.location` e os índices incrementais de notificações e cotações por empresa e data.

## Limitações conhecidas

A distância é geográfica, não uma rota por estrada. Feriados permanecem preparados para uma evolução posterior. A validação de performance deve ser executada com dados representativos no banco de produção.
