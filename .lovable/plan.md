# Plano de Implementação: Loja e Customização

Vamos começar pela **Loja de Itens**, pois ela dá um propósito imediato para as moedas que o jogador ganha, fechando o ciclo de economia do jogo.

## Passos Técnicos

### 1. Banco de Dados (Supabase)
- Criar a tabela `shop_items` para armazenar os itens disponíveis (Skins, Títulos, Efeitos).
- Criar a tabela `user_inventory` para registrar o que cada jogador já comprou.
- Adicionar colunas `selected_skin` e `selected_title` na tabela `profiles`.
- Criar uma função SQL para processar a compra de forma atômica (verificar saldo, descontar moedas e adicionar ao inventário).

### 2. Backend (Server Functions)
- `getShopItems`: Lista os itens da loja.
- `buyItem`: Processa a compra de um item.
- `getUserInventory`: Lista os itens que o usuário possui.
- `updateEquippedItems`: Salva quais itens o usuário quer usar no momento.

### 3. Frontend (UI/UX)
- Criar o componente `Shop.tsx` com uma interface moderna e atraente.
- Atualizar o `UserProfile.tsx` para mostrar o inventário e permitir equipar itens.
- Modificar a `GameArena.tsx` para aplicar a cor da Skin selecionada (neon, bordas, etc.).

## Itens Iniciais Sugeridos
- **Skins (Cores de Neon):** Cyber Blue (Padrão), Matrix Green, Vaporwave Pink, Gold Edition.
- **Títulos:** "Brain Master", "Zero Lag", "Neural Hacker".

O que acha de começarmos por aqui?
