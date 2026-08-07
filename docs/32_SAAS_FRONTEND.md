# Frontend SaaS

Implementada a rota `/empresa/plano`, consumindo planos, features, assinatura, uso diário e checkout ativo diretamente do Supabase. O preço e a promoção são lidos do banco e o botão Premium abre somente o checkout ativo retornado.

Limitação: o schema SaaS atual não possui campo de limite diário configurável por plano. Por isso a interface não usa o valor `3` hardcoded e informa que o limite configurável ainda não está exposto. O controle real continua garantido pelo backend.
