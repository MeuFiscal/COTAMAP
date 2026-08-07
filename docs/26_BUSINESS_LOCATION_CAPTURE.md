# Captura da localização da empresa

Foi criada a rota `/empresa/configuracoes/localizacao`. O botão de captura usa exclusivamente `navigator.geolocation`, solicita permissão explicitamente e salva latitude/longitude nos campos existentes de `businesses`, respeitando as policies de Owner/Manager.

A precisão retornada pelo dispositivo é exibida após a captura, mas não é persistida porque o schema atual não possui coluna de precisão. Permissões negadas, GPS indisponível e ausência de coordenadas possuem mensagens específicas. Nenhuma API, SDK ou biblioteca de mapas foi adicionada.
