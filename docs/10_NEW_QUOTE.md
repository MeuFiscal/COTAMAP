# 10 — Nova Cotação

## Objetivo

O fluxo de Nova Cotação oferece ao cliente uma experiência simples para descrever a peça, informar o veículo, anexar uma referência visual e escolher a distância de busca. Esta etapa é exclusivamente frontend: nenhuma solicitação é persistida ou enviada.

## Fluxo

1. O cliente acessa `/nova-cotacao` em uma sessão autenticada.
2. Informa obrigatoriamente o nome da peça.
3. Pode adicionar marca, modelo, ano, motor e observações.
4. Pode escolher uma foto existente ou abrir a câmera do dispositivo.
5. Seleciona um único raio entre 5, 10, 20 e 50 km.
6. Ao selecionar “Solicitar cotação”, o botão apresenta o estado de carregamento.
7. A interface navega para `/procurando-cotacoes`, que funciona como placeholder da etapa seguinte.

Nenhuma autopeça é notificada durante esta simulação.

## Componentes

- `QuoteForm`: coordena o formulário, validação e navegação simulada.
- `PhotoUploader`: seleção por galeria ou câmera, preview local e remoção.
- `RadiusSelector`: seleção exclusiva do raio de busca.
- `VehicleSection`: campos reutilizáveis de identificação do veículo.
- `PageHeader`: título, descrição e navegação de retorno.
- `PrimaryButton`: ação principal com estado de carregamento.
- `QuoteField`: base visual e acessível para campos de texto.

Os componentes estão isolados em `src/features/quotes`, sem dependência de Supabase, Storage ou serviços de negócio.

## Validações

- Nome da peça: obrigatório, mínimo de dois caracteres.
- Foto: opcional.
- Marca, modelo, ano e motor: opcionais nesta etapa.
- Observações: opcionais, limitadas a 500 caracteres.
- Raio: obrigatório e restrito às quatro opções disponíveis.

As validações usam React Hook Form e Zod, com mensagens associadas aos campos por atributos ARIA.

## Foto

O arquivo selecionado permanece somente na memória do navegador. O preview usa uma URL temporária, liberada ao substituir, remover ou desmontar o componente. Não há compressão, upload ou persistência.

## Responsividade

- Mobile: conteúdo em coluna, controles com áreas de toque amplas e botão principal ocupando toda a largura.
- Tablet: agrupamento progressivo dos campos e ações de foto lado a lado.
- Desktop: largura de leitura controlada, maior espaço entre blocos e agrupamento horizontal da ação final.

## Acessibilidade

- Estrutura semântica com `form`, `section`, `fieldset` e `legend`.
- Labels explícitos para todos os campos.
- Estados inválidos e mensagens conectados por ARIA.
- Seleção de raio exposta com `aria-pressed`.
- Estado da foto anunciado por região `aria-live`.
- Foco visível e operação completa por teclado.

## Fora do escopo

Não foram implementados backend, banco, Supabase, Storage, mapas, notificações, WhatsApp, upload real ou criação de registros de cotação.
