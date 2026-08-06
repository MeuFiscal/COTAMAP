# Banco de Dados

## Escopo da fase

Esta fase cria a fundação relacional do CotaMap em PostgreSQL com PostGIS. Não inclui
autenticação, APIs, consultas de produto, views, triggers, functions, policies, RLS,
Realtime ou Storage.

O schema usa UUID em todas as chaves primárias, `timestamptz` para datas e soft delete
por `deleted_at`. O campo `updated_at` deve ser atualizado explicitamente pela camada de
persistência até que uma estratégia de automação seja autorizada em fase posterior.

## Extensões

- `postgis`: tipos, operadores e índices geoespaciais.
- `pgcrypto`: geração de UUID por `gen_random_uuid()`.

## ENUMs

| Tipo               | Valores                                                   |
| ------------------ | --------------------------------------------------------- |
| `business_status`  | `active`, `inactive`, `blocked`                           |
| `user_role`        | `owner`, `manager`, `employee`, `customer`, `admin`       |
| `quote_status`     | `waiting`, `accepted`, `expired`, `cancelled`, `finished` |
| `quotation_status` | `pending`, `sent`, `accepted`, `rejected`, `expired`      |
| `order_status`     | `pending`, `preparing`, `ready`, `completed`, `cancelled` |

## Tabelas

### `profiles`

Representa o perfil de uma pessoa na plataforma. Armazena nome, e-mail, telefone, avatar,
papel global e situação ativa. A integração do `id` com Supabase Auth será definida na
fase de autenticação; esta migration não cria dependência com `auth.users`.

### `business_categories`

Catálogo normalizado de categorias de empresa. Separa a classificação dos dados da
empresa e impede a repetição de nomes e slugs em cada registro de `businesses`.

### `businesses`

Representa empresas participantes. Contém identidade, mídia, contatos, endereço,
horários, categoria, situação e coordenadas. `latitude` e `longitude` são os valores de
entrada; `location` é uma coluna `geography(Point, 4326)` gerada a partir deles e usada
em futuras buscas por raio.

### `business_employees`

Relaciona vários perfis a uma empresa e registra o papel exercido naquele vínculo. Os
papéis permitidos no vínculo empresarial são `owner`, `manager` e `employee`.

### `quote_requests`

Representa o pedido de cotação criado pelo cliente. Armazena descrição, coordenadas,
raio em metros, situação e validade. O cliente é referenciado por `customer_id`.

### `quote_request_images`

Metadados normalizados das imagens associadas a um pedido de cotação. O arquivo não é
armazenado nesta tabela; `storage_path` está preparado para uma futura integração com
Storage.

### `quote_notifications`

Registra o envio de um pedido a uma empresa e, opcionalmente, o funcionário destinatário.
Também registra os instantes de envio e leitura. A combinação ativa de pedido e empresa é
única, evitando notificações duplicadas.

### `quotations`

Representa a cotação enviada por uma empresa para um pedido. Armazena valor, marca,
observação, situação, validade, funcionário responsável e tempo de resposta em segundos.
Existe no máximo uma cotação ativa por empresa para cada pedido.

### `quotation_images`

Metadados normalizados das imagens associadas a uma cotação. Mantém caminho futuro de
Storage, tipo, tamanho e ordenação sem embutir arquivos no banco.

### `orders`

Representa o pedido resultante de uma cotação aceita. Referencia somente `quotation_id` e
seu status para preservar normalização. Empresa, cliente e solicitação são obtidos pela
cadeia `orders → quotations → quote_requests`, evitando duplicação e divergência.

### `ratings`

Registra a nota de 1 a 5 e o comentário de um cliente sobre uma empresa. Pode referenciar
o pedido que originou a avaliação para permitir avaliações verificadas no futuro.

### `notification_logs`

Histórico de tentativas de entrega de uma notificação. Registra canal, situação informada
pelo provedor, identificador externo, erro, metadados e instante da ocorrência. Os valores
de canal e situação permanecem abertos até a definição dos provedores.

### `audit_logs`

Trilha genérica e append-oriented para auditoria futura. Registra ator, ação, tipo e ID da
entidade, valores anteriores e posteriores, metadados técnicos e correlação da requisição.
O índice BRIN por data favorece grandes volumes cronológicos com baixo custo de índice.

## Relacionamentos

- `businesses.business_category_id` → `business_categories.id`.
- `business_employees.business_id` → `businesses.id`.
- `business_employees.profile_id` → `profiles.id`.
- `quote_requests.customer_id` → `profiles.id`.
- `quote_request_images.quote_request_id` → `quote_requests.id`.
- `quote_notifications.quote_request_id` → `quote_requests.id`.
- `quote_notifications.business_id` → `businesses.id`.
- `quote_notifications.recipient_profile_id` → `profiles.id`.
- `quotations.quote_request_id` → `quote_requests.id`.
- `quotations.business_id` → `businesses.id`.
- `quotations.submitted_by_profile_id` → `profiles.id`.
- `quotation_images.quotation_id` → `quotations.id`.
- `orders.quotation_id` → `quotations.id`.
- `ratings.customer_id` → `profiles.id`.
- `ratings.business_id` → `businesses.id`.
- `ratings.order_id` → `orders.id`.
- `notification_logs.quote_notification_id` → `quote_notifications.id`.
- `audit_logs.actor_profile_id` → `profiles.id`.

As exclusões físicas usam `restrict` nas relações de domínio porque o fluxo normal é soft
delete. Em auditoria, a exclusão física excepcional de um perfil usa `set null` para
preservar o evento histórico.

## Estratégia de índices

### Unicidade ativa

Índices únicos parciais consideram somente linhas sem `deleted_at` para permitir a
reutilização controlada após soft delete:

- E-mail de perfil.
- Slug de categoria.
- Vínculo empresa–perfil.
- Posição e caminho das imagens.
- Notificação por pedido–empresa.
- Cotação por pedido–empresa.
- Pedido por cotação.
- Avaliação por pedido–cliente.

### Operação e filtros compostos

Foram criados índices compostos para os principais acessos futuros:

- Perfis por papel e atividade.
- Empresas por categoria/situação e cidade/estado/situação.
- Funcionários por empresa/papel/atividade e perfil/atividade.
- Pedidos de cotação por cliente/data, situação/data e situação/validade.
- Notificações por empresa ou destinatário, leitura e data.
- Cotações por pedido/situação/valor e empresa/situação/data.
- Pedidos por situação/data.
- Avaliações por empresa/data, empresa/nota e cliente/data.
- Logs de notificação por notificação/data, situação/data e ID do provedor.
- Auditoria por entidade/data, ator/data, requisição e data em BRIN.

Todos os índices operacionais compatíveis com soft delete são parciais e excluem registros
apagados, reduzindo o tamanho das estruturas mais acessadas.

### Índice geográfico

`businesses_location_gix` é um índice GiST parcial sobre `businesses.location`. Ele está
preparado para operadores PostGIS e futuras buscas de empresas por distância em metros.
Nenhuma consulta geográfica foi implementada nesta fase.

## Integridade e escala

- Todas as tabelas usam `uuid` com `gen_random_uuid()`; não há `serial`.
- Foreign keys protegem todos os relacionamentos declarados.
- Checks validam coordenadas, raio, valores monetários, nota e metadados JSON.
- Valores monetários usam `numeric(14, 2)`.
- Datas usam fuso horário por meio de `timestamptz`.
- Arquivos são representados somente por metadados e caminhos futuros de Storage.
- `jsonb` é usado apenas em estruturas variáveis, não para substituir relações centrais.

## Arquivos SQL

- `supabase/migrations/20260806000000_initial_database_foundation.sql`: migration inicial
  transacional.
- `supabase/schema.sql`: snapshot declarativo equivalente à migration inicial.

Os dois arquivos devem permanecer semanticamente sincronizados em alterações futuras.

## Camada de segurança

A migration `supabase/migrations/20260806010000_database_security.sql` adiciona a camada
de segurança sem modificar colunas, ENUMs, relacionamentos, índices ou a migration
inicial. Ela integra perfis ao Supabase Auth pelo UUID compartilhado, habilita RLS nas 13
tabelas, cria policies de menor privilégio e automatiza `updated_at`.

As regras completas, funções auxiliares, triggers e fluxo de autenticação estão descritos
em [`06_SECURITY.md`](06_SECURITY.md).
