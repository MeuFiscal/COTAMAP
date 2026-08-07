# Autorização administrativa unificada

`platform_admins.active` é a fonte única de autorização da plataforma. O usuário continua autenticando exclusivamente pelo Supabase Auth; a tabela administrativa apenas relaciona o e-mail autenticado a uma autorização ativa.

Frontend, `private.is_admin()`, policies administrativas, RPCs e Edge Function `admin-core` usam a mesma regra. `profiles.role` continua representando o perfil de domínio, mas não concede acesso ao painel administrativo.

A migration é idempotente e não cria senha, bypass ou autenticação paralela. A remoção/desativação de um registro em `platform_admins` invalida a autorização na próxima consulta/token request sem alterar credenciais do usuário.
