# Segurança do Banco de Dados

## Princípios

A segurança do CotaMap combina Supabase Auth, privilégios PostgreSQL e Row Level Security
(RLS). O papel PostgreSQL `anon` não recebe acesso às tabelas de negócio. O papel
`authenticated` recebe privilégios de tabela, mas cada operação continua condicionada às
policies. O `service_role` permanece reservado ao backend confiável e não deve ser exposto
ao navegador.

Todas as policies declaram explicitamente `to authenticated`. Chamadas estáveis, como
`auth.uid()` e helpers de autorização, são envolvidas por `select` para permitir que o
planejador as avalie uma vez por comando.

## Integração com Supabase Auth

`auth.users.id` e `public.profiles.id` compartilham o mesmo UUID. A relação é criada pelo
trigger `on_auth_user_created`, sem adicionar coluna ou foreign key ao schema congelado.

Fluxo de cadastro:

1. O Supabase Auth valida e cria o usuário em `auth.users`.
2. O trigger chama `private.handle_new_user()`.
3. A função exige e-mail, usa `full_name`, `phone` e `avatar_url` dos metadados permitidos
   e cria `public.profiles` com o mesmo UUID.
4. Todo novo perfil recebe obrigatoriamente `role = customer` e `is_active = true`.
5. Metadados fornecidos pelo usuário nunca determinam papel ou permissão.

A função é `security definer`, usa `search_path = ''` e nomes totalmente qualificados
porque precisa gravar o perfil durante uma operação no schema protegido `auth`. Uma falha
na criação do perfil interrompe o cadastro para evitar usuários sem perfil correspondente.

Usuários Auth preexistentes não são inseridos retroativamente por esta migration. Se
existirem, devem passar por um procedimento de migração auditado antes da liberação do
sistema.

## Modelo de permissões

### Customer

- Visualiza e atualiza o próprio perfil, sem alterar `role` ou `is_active`.
- Cria, visualiza, altera e remove seus pedidos de cotação e respectivas imagens.
- Visualiza as cotações recebidas em seus próprios pedidos.
- Visualiza seus pedidos resultantes.
- Cria, visualiza, altera e remove suas avaliações.

### Owner

- Visualiza e altera os dados da própria empresa.
- Gerencia vínculos de funcionários da própria empresa.
- Visualiza pedidos de cotação destinados à empresa.
- Cria e altera respostas de cotação e suas imagens.
- Remove cotações da empresa.
- Visualiza e atualiza pedidos da empresa.
- Visualiza avaliações e logs de notificação da empresa.

### Manager

- Visualiza os dados e vínculos da empresa.
- Visualiza pedidos de cotação destinados à empresa.
- Cria e altera respostas de cotação e suas imagens.
- Visualiza pedidos, avaliações e logs de notificação da empresa.
- Não altera os dados cadastrais da empresa nem os vínculos de funcionários.

### Employee

- Visualiza os dados necessários da empresa e seus vínculos.
- Visualiza pedidos de cotação destinados à empresa.
- Cria e altera respostas de cotação e suas imagens.
- Visualiza pedidos, avaliações e logs de notificação da empresa.
- Não altera os dados cadastrais da empresa nem os vínculos de funcionários.

### Admin

- Possui policies `for all` em todas as tabelas protegidas.
- É identificado por um perfil ativo, não excluído e com `role = admin`.
- O papel administrativo deve ser atribuído somente por processo confiável e auditado.

Os papéis empresariais são obtidos de `business_employees.role`, permitindo que uma pessoa
tenha vínculos distintos em empresas diferentes. `profiles.role` é usado para o papel
global de plataforma, especialmente `admin` e `customer`.

## Funções auxiliares

Todas as funções ficam no schema não exposto `private`, usam `search_path = ''` e nomes
qualificados. A execução pública e anônima é revogada.

| Função                                                  | Objetivo                                                                | Segurança |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | --------- |
| `current_profile()`                                     | Retorna o UUID fornecido por `auth.uid()`.                              | Invoker   |
| `is_admin()`                                            | Confirma perfil administrativo ativo.                                   | Definer   |
| `has_business_role(business_id, roles)`                 | Confirma vínculo empresarial ativo em um conjunto de papéis.            | Definer   |
| `current_businesses()`                                  | Retorna todas as empresas às quais o usuário está vinculado.            | Definer   |
| `is_owner(business_id)`                                 | Confirma o papel Owner na empresa.                                      | Invoker   |
| `is_manager(business_id)`                               | Confirma o papel Manager na empresa.                                    | Invoker   |
| `is_employee(business_id)`                              | Confirma o papel Employee na empresa.                                   | Invoker   |
| `can_view_business(business_id)`                        | Autoriza leitura para Owner, Manager e Employee.                        | Invoker   |
| `can_respond_for_business(business_id)`                 | Autoriza resposta para Owner, Manager e Employee.                       | Invoker   |
| `can_access_quote_request(request_id)`                  | Confirma propriedade do cliente ou notificação a uma empresa vinculada. | Definer   |
| `can_respond_to_quote_request(business_id, request_id)` | Exige vínculo autorizado e notificação válida.                          | Definer   |
| `can_view_quotation(quotation_id)`                      | Autoriza cliente proprietário ou membro da empresa.                     | Definer   |
| `can_manage_quotation(quotation_id)`                    | Confirma que o usuário pode responder pela empresa relacionada.         | Definer   |
| `can_view_order(order_id)`                              | Autoriza cliente proprietário ou membro da empresa.                     | Definer   |
| `can_view_notification(notification_id)`                | Autoriza destinatário ou membro da empresa.                             | Definer   |
| `profile_security_fields_unchanged(id, role, active)`   | Impede autoelevação de papel ou reativação do próprio perfil.           | Definer   |
| `handle_new_user()`                                     | Cria o perfil após cadastro no Supabase Auth.                           | Definer   |
| `set_updated_at()`                                      | Atualiza o timestamp antes de alterações.                               | Invoker   |

As funções `security definer` são usadas somente para atravessar RLS em verificações de
autorização ou para o trigger de Auth. Elas não ficam no schema exposto `public`.

`current_businesses()` é plural por projeto: um usuário pode participar de várias
empresas. Não existe `current_business()` singular, evitando seleção implícita e ambígua.

## Triggers

### Auth

- `on_auth_user_created`: executado depois de um insert em `auth.users`; cria o perfil
  correspondente com papel seguro.

### Timestamps

Cada uma das 13 tabelas possui um trigger `before update` que chama
`private.set_updated_at()`:

- `profiles_set_updated_at`
- `business_categories_set_updated_at`
- `businesses_set_updated_at`
- `business_employees_set_updated_at`
- `quote_requests_set_updated_at`
- `quote_request_images_set_updated_at`
- `quote_notifications_set_updated_at`
- `quotations_set_updated_at`
- `quotation_images_set_updated_at`
- `orders_set_updated_at`
- `ratings_set_updated_at`
- `notification_logs_set_updated_at`
- `audit_logs_set_updated_at`

## RLS e policies

RLS está habilitado nas 13 tabelas do schema público. A ausência de policy para uma
operação representa negação por padrão.

| Tabela                 | Leitura                                           | Criação                       | Alteração                                        | Exclusão                      |
| ---------------------- | ------------------------------------------------- | ----------------------------- | ------------------------------------------------ | ----------------------------- |
| `profiles`             | Próprio perfil ou Admin                           | Trigger/Auth ou Admin         | Próprio perfil sem campos de segurança, ou Admin | Admin                         |
| `business_categories`  | Categorias ativas ou Admin                        | Admin                         | Admin                                            | Admin                         |
| `businesses`           | Membros da empresa ou Admin                       | Admin                         | Owner ou Admin                                   | Admin                         |
| `business_employees`   | Membros da empresa ou Admin                       | Owner ou Admin                | Owner ou Admin                                   | Owner ou Admin                |
| `quote_requests`       | Cliente proprietário, empresa notificada ou Admin | Cliente proprietário ou Admin | Cliente proprietário ou Admin                    | Cliente proprietário ou Admin |
| `quote_request_images` | Mesmo acesso do pedido                            | Cliente proprietário ou Admin | Cliente proprietário ou Admin                    | Cliente proprietário ou Admin |
| `quote_notifications`  | Destinatário, membro da empresa ou Admin          | Admin/serviço                 | Admin/serviço                                    | Admin/serviço                 |
| `quotations`           | Cliente proprietário, membro da empresa ou Admin  | Membro autorizado ou Admin    | Membro autorizado ou Admin                       | Owner ou Admin                |
| `quotation_images`     | Mesmo acesso da cotação                           | Membro autorizado ou Admin    | Membro autorizado ou Admin                       | Membro autorizado ou Admin    |
| `orders`               | Cliente proprietário, membro da empresa ou Admin  | Admin/serviço                 | Owner ou Admin                                   | Admin                         |
| `ratings`              | Cliente proprietário, membro da empresa ou Admin  | Cliente proprietário ou Admin | Cliente proprietário ou Admin                    | Cliente proprietário ou Admin |
| `notification_logs`    | Membro da empresa ou Admin                        | Admin/serviço                 | Admin/serviço                                    | Admin/serviço                 |
| `audit_logs`           | Admin                                             | Admin/serviço                 | Admin                                            | Admin                         |

“Admin/serviço” significa que usuários autenticados comuns não possuem uma policy para a
operação. Processos internos poderão usar `service_role`, que jamais deve ser enviado ao
cliente.

## Catálogo de policies

- `profiles`: `profiles_select_own_or_admin`, `profiles_update_own`,
  `profiles_admin_all`.
- `business_categories`: `business_categories_select_active`,
  `business_categories_admin_all`.
- `businesses`: `businesses_select_members`, `businesses_update_owners`,
  `businesses_admin_all`.
- `business_employees`: `business_employees_select_members`,
  `business_employees_insert_owners`, `business_employees_update_owners`,
  `business_employees_delete_owners`, `business_employees_admin_all`.
- `quote_requests`: `quote_requests_select_authorized`,
  `quote_requests_insert_customer`, `quote_requests_update_customer`,
  `quote_requests_delete_customer`, `quote_requests_admin_all`.
- `quote_request_images`: `quote_request_images_select_authorized`,
  `quote_request_images_insert_customer`, `quote_request_images_update_customer`,
  `quote_request_images_delete_customer`, `quote_request_images_admin_all`.
- `quote_notifications`: `quote_notifications_select_business_members`,
  `quote_notifications_admin_all`.
- `quotations`: `quotations_select_authorized`,
  `quotations_insert_business_members`, `quotations_update_business_members`,
  `quotations_delete_owners`, `quotations_admin_all`.
- `quotation_images`: `quotation_images_select_authorized`,
  `quotation_images_insert_business_members`, `quotation_images_update_business_members`,
  `quotation_images_delete_business_members`, `quotation_images_admin_all`.
- `orders`: `orders_select_authorized`, `orders_update_owners`, `orders_admin_all`.
- `ratings`: `ratings_select_authorized`, `ratings_insert_customer`,
  `ratings_update_customer`, `ratings_delete_customer`, `ratings_admin_all`.
- `notification_logs`: `notification_logs_select_business_members`,
  `notification_logs_admin_all`.
- `audit_logs`: `audit_logs_admin_all`.

## Limites desta fase

Esta camada não ativa Realtime, Storage, Edge Functions, frontend, APIs ou envio de
notificações. A aplicação remota da migration e testes com usuários reais exigem o
ambiente Supabase configurado e serão executados somente com autorização e credenciais
adequadas.
