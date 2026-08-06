# 11 — Procurando Cotações

## Objetivo

A tela `/procurando-cotacoes` comunica atividade em tempo real logo após a criação simulada de uma solicitação. Toda a experiência é local e temporária: nenhuma empresa é consultada, nenhuma notificação é enviada e nenhum registro é gravado.

## Fluxo simulado

1. `QuoteForm` guarda em memória o nome da peça, veículo, raio e uma URL temporária da foto.
2. A navegação abre `/procurando-cotacoes`.
3. A interface apresenta sequencialmente os estados:
   - Procurando empresas próximas;
   - Enviando solicitações;
   - Aguardando respostas;
   - Recebendo cotações.
4. Três empresas fictícias aparecem gradualmente com estados diferentes.
5. Após a simulação, é exibida a mensagem “Uma nova cotação chegou” e a ação “Ver cotações”.

O botão de cotações direciona ao dashboard existente. Valores e listagem real de propostas permanecem fora desta etapa.

## Componentes

- `SearchStatus`: comunica a fase atual com transição suave e região acessível.
- `Countdown`: contagem regressiva local iniciada em sete minutos.
- `BusinessProgressCard`: empresa simulada e estado de atendimento.
- `SearchAnimation`: radar com ondas, pulso e pins de empresas.
- `QuoteArrivalToast`: aviso temporário e descartável de nova cotação.
- `EmptyState`: ausência de respostas, ampliação de raio e nova tentativa.
- `RequestSummaryCard`: resumo da peça, veículo, raio e foto opcional.
- `SearchQuotesExperience`: orquestra os estados e o tempo da simulação.

## Dados temporários

`quote-preview-store.ts` mantém a solicitação apenas na memória da aba atual. A foto utiliza uma Object URL local e não é enviada para Storage. Ao acessar a busca diretamente ou recarregar a página, a interface usa dados demonstrativos.

## Cronologia

- 0–2 segundos: localização de empresas.
- 3–5 segundos: envio simulado.
- 4 segundos: primeira empresa encontrada.
- 6–9 segundos: espera por respostas.
- 7 e 9 segundos: novas empresas aparecem.
- 10 segundos: estado de recebimento.
- 11 segundos: chegada da primeira cotação e liberação do botão.

O cronômetro visual começa em `07:00` e continua reduzindo a cada segundo.

## Estado vazio

O componente de ausência de respostas oferece:

- ampliar o raio para 50 km;
- iniciar uma nova tentativa.

Para inspeção visual isolada, o estado pode ser aberto por `/procurando-cotacoes?state=empty`. Essa opção é somente de demonstração e não altera dados.

## Acessibilidade e performance

- Atualizações importantes usam regiões `aria-live` e `role="status"`.
- Animações não bloqueiam controles nem a navegação por teclado.
- Ícones decorativos são ocultados de leitores de tela.
- Um único intervalo controla toda a sequência para evitar timers duplicados.
- Listas derivadas são calculadas a partir do tempo decorrido.
- A preferência global de movimento reduzido continua sendo respeitada pelo CSS do projeto.

## Fora do escopo

Não foram implementados backend, Supabase, Realtime, WebSocket, banco, push, preços, notificações reais ou contato com empresas.
