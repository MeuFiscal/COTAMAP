# Mapas, localização e navegação

O pedido do cliente agora exibe a localização real da empresa quando latitude/longitude estão disponíveis, além do endereço cadastrado. Os links de navegação usam Google Maps, Apple Maps e Waze, com fallback por endereço quando não há coordenadas.

A localização do cliente é solicitada somente após ação explícita. Se for negada, a rota continua funcionando pelo endereço da empresa. Não foi adicionada chave do Google Maps nem mapa embutido porque nenhuma variável de API estava configurada; o estado de coordenadas e os links oficiais evitam inventar dados ou credenciais.
