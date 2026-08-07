# Infraestrutura administrativa core

Foram criadas `platform_admins` e `platform_settings`. O administrador inicial é identificado apenas pelo e-mail persistido em `platform_admins`, sem senha ou autenticação paralela.

O limite diário configurável foi adicionado a `saas_plans`. As RPCs `activate_checkout`, `update_plan` e `update_platform_settings` validam o administrador, parâmetros e registram auditoria. A Edge Function `admin-core` é o wrapper JWT dessas operações.
