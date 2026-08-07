# Fechamento técnico da versão Web 1.0

O limite SaaS agora cancela somente a notificação excedente no trigger `BEFORE INSERT`, preservando a distribuição válida para as demais empresas e mantendo o bloqueio concorrente por linha de uso. A leitura frontend sem assinatura ativa usa explicitamente o plano Free, alinhada ao backend.

O dashboard administrativo passou a usar contagens SQL (`head/count`) em vez de carregar tabelas inteiras. A criação de funcionário registra uma auditoria de reconciliação caso a compensação Auth falhe.
