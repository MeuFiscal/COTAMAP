# Firebase Web

O SDK oficial do Firebase Web foi adicionado como camada complementar, inicializado uma única vez por `getApps()` e configurado exclusivamente por variáveis `NEXT_PUBLIC_FIREBASE_*`. A inicialização retorna `null` quando as variáveis ainda não estiverem configuradas, mantendo SSR e builds sem credenciais seguros.

O Google Analytics está disponível por `getFirebaseAnalytics()` e só executa no navegador após `isSupported()`. Firebase Messaging/Push não foi ativado, nenhum token foi criado e nenhuma alteração foi feita no Supabase, em `push_devices` ou no `PushProvider` existente. A camada poderá receber um adaptador de Messaging em etapa posterior sem duplicar inicializações.
